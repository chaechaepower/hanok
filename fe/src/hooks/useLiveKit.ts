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
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const roomRef = useRef<Room | null>(null);
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  // video 엘리먼트가 준비된 후 트랙을 attach하는 헬퍼
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
      return;
    }

    setState('connecting');

    const room = new Room();
    roomRef.current = room;

    room.on(RoomEvent.ConnectionStateChanged, (connectionState: ConnectionState) => {
      switch (connectionState) {
        case ConnectionState.Connected:
          setState('connected');
          break;
        case ConnectionState.Disconnected:
          setState('disconnected');
          break;
        case ConnectionState.Reconnecting:
          setState('connecting');
          break;
      }
    });

    // 구매자: 원격 트랙(판매자 영상) 수신
    room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Video) {
          attachTrackToVideo(track);
        }
      },
    );

    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      track.detach();
    });

    const connect = async () => {
      try {
        await room.connect(serverUrl, token);
        setState('connected');

        if (isHostRef.current) {
          await room.localParticipant.enableCameraAndMicrophone();
          const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
          if (camPub?.track) {
            attachTrackToVideo(camPub.track);
          }
        }
      } catch (err) {
        console.error('[LiveKit] 연결 실패:', err);
        setState('error');
      }
    };

    connect();

    return () => {
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
    if (!room) return;
    const enabled = room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(!enabled);
    setIsMicOn(!enabled);
  }, []);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const enabled = room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(!enabled);
    setIsCameraOn(!enabled);
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
