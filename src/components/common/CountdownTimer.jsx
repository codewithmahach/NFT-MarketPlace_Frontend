import React, { useState, useEffect } from "react";
import { getTimeRemaining } from "../../utils/formatters";
import { Clock } from "lucide-react";

export function CountdownTimer({ 
  endTime, 
  targetTimestamp, 
  onEnd, 
  showIcon = true, 
  compact = false,
  className = "" 
}) {
  const target = targetTimestamp || endTime;
  const [remaining, setRemaining] = useState(() => getTimeRemaining(target));
  const onEndRef = React.useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getTimeRemaining(target);
      setRemaining(current);
      if (current.isEnded) {
        clearInterval(interval);
        if (onEndRef.current) onEndRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [target]);

  if (remaining.isEnded) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ${className}`}>
        {showIcon && <Clock className="w-3.5 h-3.5 text-slate-400" />}
        <span>Ended</span>
      </span>
    );
  }

  if (compact) {
    return (
      <span className={`font-mono font-bold text-xs text-pink-400 ${className}`}>
        {remaining.formatted}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-tight bg-pink-50 text-pink-600 border border-pink-100 ${className}`}>
      {showIcon && <Clock className="w-3.5 h-3.5 text-pink-500 animate-pulse" />}
      <span>{remaining.formatted}</span>
    </span>
  );
}

export default CountdownTimer;
