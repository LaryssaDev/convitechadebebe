import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { getDaysLeft } from '../storage';

export default function Countdown() {
  const [daysLeft, setDaysLeft] = useState(getDaysLeft());

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    function getMsUntilNext0001(): number {
      const now = new Date();
      const target = new Date(now);
      target.setHours(0, 1, 0, 0); // Configured for 00:01 AM

      // If we are already past 00:01 today, target the same time tomorrow
      if (now.getTime() >= target.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      return target.getTime() - now.getTime();
    }

    function scheduleNextUpdate() {
      const msToWait = getMsUntilNext0001();
      timerId = setTimeout(() => {
        setDaysLeft(getDaysLeft());
        scheduleNextUpdate(); // Recursively schedules the next 00:01 check
      }, msToWait);
    }

    scheduleNextUpdate();

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/70 backdrop-blur-md rounded-2xl border border-pink-100 shadow-xs max-w-sm mx-auto text-center">
      <div className="relative flex items-center justify-center w-28 h-28 mb-3">
        {/* Soft decorative background circles */}
        <div className="absolute inset-0 rounded-full bg-linear-to-tr from-pink-100 to-blue-100 animate-pulse opacity-60"></div>
        <div className="absolute inset-1.5 rounded-full bg-white flex flex-col items-center justify-center shadow-xs">
          <span className="font-display font-bold text-4xl text-pink-600 tracking-tight">
            {daysLeft}
          </span>
          <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-widest -mt-1">
            {daysLeft === 1 ? 'Dia' : 'Dias'}
          </span>
        </div>
      </div>
      <h3 className="font-display font-semibold text-lg text-stone-700 flex items-center gap-2 justify-center">
        <Calendar className="w-4 h-4 text-pink-400" />
        Falta Pouco!
      </h3>
      <p className="text-sm text-stone-500 mt-1 max-w-[240px]">
        {daysLeft > 0 
          ? `Faltam ${daysLeft} dias para celebrarmos juntos esse momento de amor!`
          : "Chegou o grande dia de nossa alegria e celebração!"}
      </p>
    </div>
  );
}
