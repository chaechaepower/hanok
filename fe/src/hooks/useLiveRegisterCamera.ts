import { useCallback, useEffect, useRef, useState } from 'react';

const CAMERA_CONSTRAINTS = {
  video: { width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: false,
} as const;

export default function useLiveRegisterCamera() {
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const attachStream = useCallback((stream: MediaStream) => {
    cameraStreamRef.current = stream;

    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = stream;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);

      attachStream(stream);
      setIsCameraOn(true);
    } catch {
      setIsCameraOn(false);
    }
  }, [attachStream]);

  const stopCamera = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;

    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }

    setIsCameraOn(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    navigator.mediaDevices
      .getUserMedia(CAMERA_CONSTRAINTS)
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        attachStream(stream);
        setIsCameraOn(true);
      })
      .catch(() => {
        if (isMounted) {
          setIsCameraOn(false);
        }
      });

    return () => {
      isMounted = false;
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [attachStream]);

  return {
    videoPreviewRef,
    isCameraOn,
    startCamera,
    stopCamera,
  };
}
