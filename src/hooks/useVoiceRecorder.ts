import { useCallback, useRef, useState } from "react";

const BAR_COUNT = 24;

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => new Array(BAR_COUNT).fill(4));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAnalyser = useCallback(() => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    stopAnalyser();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setSeconds(0);
    setLevels(new Array(BAR_COUNT).fill(4));
  }, [stopAnalyser]);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    function tick() {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const step = Math.floor(dataArray.length / BAR_COUNT) || 1;
      const next = Array.from({ length: BAR_COUNT }, (_, i) => {
        const value = dataArray[i * step] ?? 0;
        return 4 + Math.round((value / 255) * 24);
      });
      setLevels(next);
      animationRef.current = requestAnimationFrame(tick);
    }
    animationRef.current = requestAnimationFrame(tick);

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start();

    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    setIsRecording(true);
  }, []);

  const stop = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        cleanup();
        setIsRecording(false);
        if (blob.size === 0) {
          resolve(null);
          return;
        }
        resolve(new File([blob], `voice-message-${Date.now()}.webm`, { type: "audio/webm" }));
      };
      recorder.stop();
    });
  }, [cleanup]);

  const cancel = useCallback(() => {
    mediaRecorderRef.current?.stop();
    cleanup();
    setIsRecording(false);
  }, [cleanup]);

  return { isRecording, seconds, levels, start, stop, cancel };
}
