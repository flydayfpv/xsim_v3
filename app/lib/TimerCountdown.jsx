'use client';
import { useState, useEffect } from 'react';

export default function TimerCountdown({ initialMinutes = 20, onTimeUp }) {
  const [seconds, setSeconds] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setSeconds(initialMinutes * 60);
    setIsActive(true);
  }, [initialMinutes]);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsActive(false);
          if (onTimeUp) onTimeUp(); // ส่ง Trigger กลับไปที่ Page หลัก
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onTimeUp]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center text-blue-300 px-2">
      <span className={`font-mono text-3xl font-bold bg-black px-4 py-1 rounded border shadow-[0_0_10px_rgba(59,130,246,0.5)] ${seconds === 0 ? 'text-red-500 border-red-500 animate-pulse' : 'text-blue-300 border-blue-900'}`}>
        {formatTime(seconds)}
      </span>
    </div>
  );
}