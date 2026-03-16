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

interface UseLiveKitReturn {
  state: LiveKitState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  disconnect: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  isMicOn: boolean;
  isCameraOn: boolean;
}

export function useLiveKit({ serverUrl, token, isHost }: UseLiveKitOptions): UseLiveKitReturn {
  const [state, setState] = useState<LiveKitState>('idle');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const roomRef = useRef<Room | null>(null);
  const isHostRef = useRef(isHost);
  const togglingMicRef = useRef(false);
  const togglingCameraRef = useRef(false);
  isHostRef.current = isHost;

  const attachTrackToVideo = useCallback((track: { attach: (el: HTMLVideoElement) => void }) => {
    const tryAttach = (attempt: number) => {
      if (videoRef.current) {
        track.attach(videoRef.current);
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
          track.attach();
        }
      },
    );

    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      track.detach();
    });

    const connect = async () => {
      try {
        await room.connect(serverUrl, token);
        if (cancelled) return;

        setState('connected');

        if (isHostRef.current) {
          await room.localParticipant.enableCameraAndMicrophone();
          if (cancelled) return;

          const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
          if (camPub?.track) {
            attachTrackToVideo(camPub.track);
          }
          setIsMicOn(true);
          setIsCameraOn(true);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[LiveKit] 연결 실패:', err);
        setState('error');
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
    };
  }, [serverUrl, token, attachTrackToVideo]);

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
    disconnect,
    toggleMic,
    toggleCamera,
    isMicOn,
    isCameraOn,
  };
}
