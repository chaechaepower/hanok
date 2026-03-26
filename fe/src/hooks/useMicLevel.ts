import { useCallback, useEffect, useRef, useState } from 'react';

export default function useMicLevel() {
  const [isMicOn, setIsMicOn] = useState(false);
  const [level, setLevel] = useState(0);
  const initializedRef = useRef(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      setIsMicOn(true);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / dataArray.length;
        const normalized = Math.min(avg / 80, 1);
        setLevel(normalized);
        rafRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch {
      // 마이크 권한 거부 등
    }
  }, []);

  const stopMic = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    setIsMicOn(false);
    setLevel(0);
  }, []);

  const toggleMic = useCallback(() => {
    if (isMicOn) {
      stopMic();
    } else {
      void startMic();
    }
  }, [isMicOn, startMic, stopMic]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      void startMic();
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, [startMic]);

  return { isMicOn, level, toggleMic };
}
