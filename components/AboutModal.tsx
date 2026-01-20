import React from 'react';
import { Music } from 'lucide-react';
import { Button } from './Button';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#18181b] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
         <div className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-2 shadow-inner shadow-emerald-500/5 border border-emerald-500/20">
               <Music className="text-emerald-500 w-8 h-8" />
            </div>
            <div className="space-y-1">
               <h2 className="text-2xl font-bold text-white tracking-tight">SyncWave</h2>
               <p className="text-emerald-500/80 text-xs font-mono uppercase tracking-widest">Professional Studio</p>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed px-4">
               The ultimate web-based subtitle synchronization tool. Upload your media, paste lyrics, and sync in real-time with precision.
            </p>

            <div className="w-full h-px bg-white/5 my-4" />

            <div className="space-y-1">
               <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Developed By</p>
               <p className="text-white font-medium">SyncWave Team</p>
               <p className="text-zinc-600 text-xs font-mono mt-1">v1.0.0 • Made with ☕ & 🎵</p>
            </div>

            <div className="w-full pt-4">
               <Button variant="secondary" className="w-full" onClick={onClose}>Close</Button>
            </div>
         </div>
      </div>
    </div>
  );
};
