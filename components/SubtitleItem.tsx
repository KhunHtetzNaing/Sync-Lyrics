import React, { useRef, useEffect } from 'react';
import { Subtitle } from '../types';
import { formatTimeDisplay } from '../utils/timeUtils';

interface SubtitleItemProps {
  subtitle: Subtitle;
  isActive: boolean;
  isNext: boolean;
  index: number;
  autoScroll: boolean;
  onClick: () => void;
  onAdjust: (amount: number) => void;
}

export const SubtitleItem: React.FC<SubtitleItemProps> = ({ 
  subtitle, 
  isActive, 
  isNext,
  index, 
  autoScroll,
  onClick,
  onAdjust
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (isActive && autoScroll && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isActive, autoScroll]);

  if (isActive) {
    return (
      <div 
        ref={itemRef}
        className="relative my-4 mx-4 p-4 bg-zinc-800/50 border border-white/10 rounded-xl shadow-xl backdrop-blur-sm flex items-start gap-4 transition-all duration-300 animate-in fade-in zoom-in-95"
      >
        {/* Left Control Column */}
        <div className="flex flex-col items-end gap-1 min-w-[60px] pt-1">
          {/* Main Time */}
          <span className="font-mono text-emerald-400 font-bold text-sm">
            {subtitle.startTime !== null ? formatTimeDisplay(subtitle.startTime) : '--:--'}
          </span>
          
          {/* Adjusters */}
          <div className="flex flex-col gap-1 w-full">
            <button 
              onClick={(e) => { e.stopPropagation(); onAdjust(-0.1); }}
              className="text-[10px] text-zinc-500 hover:text-emerald-400 font-mono hover:bg-white/5 rounded px-1 text-right transition-colors"
            >
              -0.1
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onAdjust(0.1); }}
              className="text-[10px] text-zinc-500 hover:text-emerald-400 font-mono hover:bg-white/5 rounded px-1 text-right transition-colors"
            >
              +0.1
            </button>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-0.5 self-stretch bg-emerald-500 rounded-full opacity-50" />

        {/* Text Content */}
        <div className="flex-1 pt-0.5">
          <p className="font-medium leading-relaxed text-left text-white text-lg lg:text-xl">
            {subtitle.text || <span className="text-zinc-600 italic text-sm">Empty Line</span>}
          </p>
        </div>
      </div>
    );
  }

  // Inactive State
  return (
    <div 
      ref={itemRef}
      onClick={onClick}
      className={`
        group relative py-3 px-8 cursor-pointer transition-all duration-200 flex items-center gap-6 hover:bg-white/5 border-l-2 border-transparent hover:border-white/10
        ${isNext ? 'opacity-80' : 'opacity-40 hover:opacity-70'}
      `}
    >
       {/* Timestamp (Left) */}
       <div className="w-16 text-right font-mono text-xs text-zinc-500 group-hover:text-zinc-400">
         {subtitle.startTime !== null ? formatTimeDisplay(subtitle.startTime) : ''}
       </div>

       {/* Text (Right) */}
       <div className="flex-1 text-left">
          <p className="transition-colors text-zinc-300 text-base">
            {subtitle.text || <span className="opacity-0">-</span>}
          </p>
       </div>
    </div>
  );
};