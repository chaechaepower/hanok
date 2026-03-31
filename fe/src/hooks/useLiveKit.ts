import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  ConnectionState,
} from 'livekit-client';

export type LiveKitState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseLiveKitOptions {
  serverUrl: string;
  token: string;
  isHost: boolean;
}

export interface UseLiveKitReturn {
  state: LiveKitState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  bgVideoRef: React.RefObject<HTMLVideoElement | null>;
  disconnect: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleRemoteAudio: () => void;
  isMicOn: boolean;
  isCameraOn: boolean;
  isRemoteAudioMuted: boolean;
  viewerCount: number;
  micLevel: number;
}

export function useLiveKit({ serverUrl, token, isHost }: UseLiveKitOptions): UseLiveKitReturn {
  const [state, setState] = useState<LiveKitState>('idle');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isRemoteAudioMuted, setIsRemoteAudioMuted] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const roomRef = useRef<Room | null>(null);
  const isHostRef = useRef(isHost);
  const togglingMicRef = useRef(false);
  const togglingCameraRef = useRef(false);
  const audioElementsRef = useRef<Set<HTMLMediaElement>>(new Set());
  const isRemoteAudioMutedRef = useRef(false);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micRafRef = useRef<number>(0);
  isHostRef.current = isHost;

  const syncViewerCount = useCallback((room: Room) => {
    let nextViewerCount = isHostRef.current ? 0 : 1;

    room.remoteParticipants.forEach((participant) => {
      if (!participant.permissions?.canPublish) {
        nextViewerCount += 1;
      }
    });

    setViewerCount(nextViewerCount);
  }, []);

  const attachTrackToVideo = useCallback((track: { attach: (el: HTMLVideoElement) => void }) => {
    const tryAttach = (attempt: number) => {
      if (videoRef.current) {
        track.attach(videoRef.current);
        if (bgVideoRef.current) {
          track.attach(bgVideoRef.current);
        }
        return;
      }
      if (attempt < 10) {
        requestAnimationFrame(() => tryAttach(attempt + 1));
      }
    };
    tryAttach(0);
  }, []);

  useEffect(() => {
    if (!serverUrl || !token) {
      setState('idle');
      setIsMicOn(false);
      setIsCameraOn(false);
      setViewerCount(0);
      return;
    }

    let cancelled = false;
    setState('connecting');

    const room = new Room();
    roomRef.current = room;

    // 재연결 후 호스트 트랙 재attach
    room.on(RoomEvent.ConnectionStateChanged, (connectionState: ConnectionState) => {
      if (cancelled) return;
      switch (connectionState) {
        case ConnectionState.Connected: {
          setState('connected');
          syncViewerCount(room);
          // 재연결 시 호스트 로컬 카메라 트랙 재attach
          if (isHostRef.current) {
            const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
            if (camPub?.track) {
              attachTrackToVideo(camPub.track);
            }
          }
          break;
        }
        case ConnectionState.Disconnected:
          setState('disconnected');
          setViewerCount(0);
          break;
        case ConnectionState.Reconnecting:
          setState('connecting');
          break;
      }
    });

    // 구매자: 원격 트랙 수신 (영상 + 오디오)
    room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack) => {
        if (cancelled) return;
        if (track.kind === Track.Kind.Video) {
          attachTrackToVideo(track);
        } else if (track.kind === Track.Kind.Audio) {
          const audioEl = track.attach();
          audioEl.muted = isRemoteAudioMutedRef.current;
          audioElementsRef.current.add(audioEl);
        }
      },
    );

    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      const detached = track.detach();
      detached.forEach((el) => audioElementsRef.current.delete(el));
    });

    room.on(RoomEvent.ParticipantConnected, () => {
      if (cancelled) return;
      syncViewerCount(room);
    });

    room.on(RoomEvent.ParticipantDisconnected, () => {
      if (cancelled) return;
      syncViewerCount(room);
    });

    const connect = async () => {
      try {
        await room.connect(serverUrl, token);
        if (cancelled) return;

        setState('connected');
        syncViewerCount(room);

        if (isHostRef.current) {
          await room.localParticipant.enableCameraAndMicrophone();
          if (cancelled) return;

          const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
          if (camPub?.track) {
            attachTrackToVideo(camPub.track);
          }
          setIsMicOn(true);
          setIsCameraOn(true);

          // 마이크 트랙에서 오디오 레벨 분석 시작
          const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
          const micTrack = micPub?.track?.mediaStreamTrack;
          if (micTrack) {
            const audioCtx = new AudioContext();
            const source = audioCtx.createMediaStreamSource(new MediaStream([micTrack]));
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);
            micAudioCtxRef.current = audioCtx;
            micAnalyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const tick = () => {
              analyser.getByteFrequencyData(dataArray);
              const sum = dataArray.reduce((a, b) => a + b, 0);
              const avg = sum / dataArray.length;
              setMicLevel(Math.min(avg / 80, 1));
              micRafRef.current = requestAnimationFrame(tick);
            };
            tick();
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[LiveKit] 연결 실패:', err);
        setState('error');
        setViewerCount(0);
      }
    };

    connect();

    return () => {
      cancelled = true;
      room.removeAllListeners();
      room.localParticipant?.getTrackPublications().forEach((pub) => {
        pub.track?.detach();
      });
      room.disconnect();
      roomRef.current = null;
      setViewerCount(0);
      cancelAnimationFrame(micRafRef.current);
      micAudioCtxRef.current?.close();
      micAudioCtxRef.current = null;
      micAnalyserRef.current = null;
      setMicLevel(0);
    };
  }, [serverUrl, token, attachTrackToVideo, syncViewerCount]);

  const disconnect = useCallback(() => {
    roomRef.current?.disconnect();
  }, []);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room || togglingMicRef.current) return;
    togglingMicRef.current = true;
    try {
      const enabled = room.localParticipant.isMicrophoneEnabled;
      await room.localParticipant.setMicrophoneEnabled(!enabled);
      setIsMicOn(!enabled);
    } catch (err) {
      console.error('[LiveKit] 마이크 토글 실패:', err);
    } finally {
      togglingMicRef.current = false;
    }
  }, []);

  const toggleRemoteAudio = useCallback(() => {
    const next = !isRemoteAudioMutedRef.current;
    isRemoteAudioMutedRef.current = next;
    setIsRemoteAudioMuted(next);
    audioElementsRef.current.forEach((el) => {
      el.muted = next;
    });
  }, []);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room || togglingCameraRef.current) return;
    togglingCameraRef.current = true;
    try {
      const enabled = room.localParticipant.isCameraEnabled;
      await room.localParticipant.setCameraEnabled(!enabled);
      setIsCameraOn(!enabled);
    } catch (err) {
      console.error('[LiveKit] 카메라 토글 실패:', err);
    } finally {
      togglingCameraRef.current = false;
    }
  }, []);

  return {
    state,
    videoRef,
    bgVideoRef,
    disconnect,
    toggleMic,
    toggleCamera,
    toggleRemoteAudio,
    isMicOn,
    isCameraOn,
    isRemoteAudioMuted,
    viewerCount,
    micLevel,
  };
}
