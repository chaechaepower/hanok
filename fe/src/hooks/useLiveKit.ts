import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  ConnectionState,
} from 'livekit-client';

export type LiveKitState = 'connecting' | 'connected' | 'disconnected' | 'error';

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
  const [state, setState] = useState<LiveKitState>('connecting');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    if (!serverUrl || !token) return;

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
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current);
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

        if (isHost) {
          await room.localParticipant.enableCameraAndMicrophone();
          const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
          if (camPub?.track && videoRef.current) {
            camPub.track.attach(videoRef.current);
          }
        }
      } catch (err) {
        console.error('[LiveKit] 연결 실패:', err);
        setState('error');
      }
    };

    connect();

    return () => {
      room.disconnect();
      roomRef.current = null;
    };
  }, [serverUrl, token, isHost]);

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
