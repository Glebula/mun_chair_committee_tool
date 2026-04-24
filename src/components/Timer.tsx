import { useEffect, useRef } from 'react';

interface TimerProps {
  remaining: number;
  total: number;
  running: boolean;
  onTick: () => void;
  size?: 'large' | 'medium' | 'small';
  label?: string;
}

function formatTime(secs: number): string {
  const s = Math.max(0, secs);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function Timer({ remaining, total, running, onTick, size = 'large', label }: TimerProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(onTick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, remaining, onTick]);

  const expired = remaining <= 0;
  const pct = total > 0 ? Math.max(0, remaining / total) : 0;

  const barColor = pct > 0.5 ? 'bg-green-500' : pct > 0.2 ? 'bg-yellow-400' : 'bg-red-500';

  const timerClass = size === 'large'
    ? 'font-mono font-bold text-[88px] leading-none tracking-tight'
    : size === 'medium'
    ? 'font-mono font-bold text-5xl leading-none'
    : 'font-mono font-bold text-3xl leading-none';

  const textColor = expired ? 'text-red-400' : running ? 'text-white' : 'text-gray-200';

  return (
    <div className={`flex flex-col items-center gap-3 ${expired ? 'timer-expired' : ''}`}>
      {label && <div className="text-lg text-gray-400 font-medium">{label}</div>}
      <div className={`${timerClass} ${textColor} tabular-nums`}>
        {formatTime(remaining)}
      </div>
      <div className="w-full max-w-md h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500 ease-linear`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
