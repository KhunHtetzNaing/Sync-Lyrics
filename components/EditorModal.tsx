import React, { useState, useEffect } from 'react';
import { X, Download, Check } from 'lucide-react';
import { Button } from './Button';

interface EditorModalProps {
  isOpen: boolean;
  initialText: string;
  onClose: () => void;
  onSave: (text: string) => void;
  onImportSRT: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const EditorModal: React.FC<EditorModalProps> = ({ 
  isOpen, 
  initialText, 
  onClose, 
  onSave, 
  onImportSRT 
}) => {
  const [text, setText] = useState(initialText);

  // Sync internal text state when modal opens or initialText updates
  useEffect(() => {
    setText(initialText);
  }, [initialText, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#18181b] w-full max-w-2xl h-[80vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
         
         {/* Modal Header */}
         <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#09090b]">
            <h3 className="font-bold text-lg">Lyrics Editor</h3>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
               <X size={20} />
            </button>
         </div>

         {/* Modal Content */}
         <div className="flex-1 flex flex-col p-6 space-y-4">
            <div className="flex justify-between items-center">
               <p className="text-sm text-zinc-400">Edit your lyrics line by line. Each line corresponds to one sync action.</p>
               
               {/* IMPORT BUTTON */}
               <label className="cursor-pointer">
                  <input type="file" accept=".srt,.txt,text/*" onChange={onImportSRT} className="hidden" />
                  <span className="text-xs flex items-center text-emerald-500 hover:text-emerald-400 font-medium py-1 px-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 transition-colors">
                     <Download size={12} className="mr-1.5" /> Import SRT
                  </span>
               </label>
            </div>
            
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 bg-[#09090b] border border-white/10 rounded-xl p-4 text-zinc-300 font-mono text-sm resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
              placeholder="Paste lyrics here..."
            ></textarea>
         </div>

         {/* Modal Footer */}
         <div className="h-16 border-t border-white/10 flex items-center justify-end px-6 bg-[#09090b] space-x-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={() => onSave(text)} icon={<Check size={16} />}>Save Changes</Button>
         </div>
      </div>
    </div>
  );
};
