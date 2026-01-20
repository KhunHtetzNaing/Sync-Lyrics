import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Undo2, 
  Redo2, 
  Music, 
  Video, 
  SkipForward,
  SkipBack,
  Edit,
  Upload,
  ArrowDownCircle
} from 'lucide-react';
import { Button } from './components/Button';
import { SubtitleItem } from './components/SubtitleItem';
import { EditorModal } from './components/EditorModal';
import { Subtitle } from './types';
import { parseSRT, generateSRT } from './utils/srtParser';
import { formatTimeDisplay } from './utils/timeUtils';
import { useHistory } from './hooks/useHistory';

const App: React.FC = () => {
  // Media State
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Subtitle State
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState<number>(-1);
  
  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorInitialText, setEditorInitialText] = useState('');
  
  // Scroll State
  const [autoScroll, setAutoScroll] = useState(true);

  // Logic Helpers
  const mediaRef = useRef<HTMLMediaElement>(null);
  const { pushState, undo, redo, canUndo, canRedo, resetHistory } = useHistory([]);

  // --- Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('audio') ? 'audio' : 'video';
      setMediaType(type);
      setMediaFile(file);
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
    }
  };

  const handleSRTImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const content = event.target.result as string;
          const parsed = parseSRT(content);
          
          // When importing via Editor, we update the editor text state implicitly via state 
          // but here we also update the main app state because it acts as a "Load" function.
          const textOnly = parsed.map(s => s.text).join('\n');
          setEditorInitialText(textOnly); // Updates the text passed to EditorModal
          setSubtitles(parsed);
          resetHistory(parsed);
        }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset input
    }
  };

  const openEditor = () => {
    setEditorInitialText(subtitles.map(s => s.text).join('\n'));
    setIsEditorOpen(true);
  };

  const handleSaveEditor = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    
    // Attempt to preserve timestamps if line count matches
    let newSubs: Subtitle[] = [];
    
    if (lines.length === subtitles.length) {
       newSubs = lines.map((line, i) => ({
         ...subtitles[i],
         text: line.trim()
       }));
    } else {
       newSubs = lines.map((line, i) => ({
         id: subtitles[i]?.id || crypto.randomUUID(),
         startTime: subtitles[i]?.startTime || null,
         endTime: subtitles[i]?.endTime || null,
         text: line.trim()
       }));
    }
    
    setSubtitles(newSubs);
    if (subtitles.length === 0) resetHistory(newSubs);
    else pushState(newSubs, activeSubtitleIndex);

    setIsEditorOpen(false);
  };

  const exportSRT = () => {
    const srtContent = generateSRT(subtitles);
    const blob = new Blob([srtContent], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synced_${mediaFile?.name.split('.')[0] || 'subtitles'}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // --- Subtitle Manipulation ---

  const handleAdjustTime = (index: number, amount: number) => {
    pushState(subtitles, activeSubtitleIndex);
    const newSubs = [...subtitles];
    const sub = newSubs[index];
    
    if (sub.startTime !== null) {
      newSubs[index] = {
        ...sub,
        startTime: Math.max(0, sub.startTime + amount)
      };
      setSubtitles(newSubs);
    }
  };

  // --- Syncing Logic ---

  const syncCurrentLine = useCallback(() => {
    if (!mediaRef.current) return;
    
    const time = mediaRef.current.currentTime;
    
    // Create a snapshot for undo
    pushState(subtitles, activeSubtitleIndex);

    const newSubtitles = [...subtitles];
    
    let nextIndex = activeSubtitleIndex + 1;
    if (nextIndex >= newSubtitles.length) return;

    // Set start time for the NEW active line
    newSubtitles[nextIndex] = {
      ...newSubtitles[nextIndex],
      startTime: time,
      endTime: null 
    };

    // Set end time for the PREVIOUS active line
    if (activeSubtitleIndex >= 0 && activeSubtitleIndex < newSubtitles.length) {
      const prevStart = newSubtitles[activeSubtitleIndex].startTime || 0;
      const validEndTime = Math.max(time, prevStart + 0.1); 
      
      newSubtitles[activeSubtitleIndex] = {
        ...newSubtitles[activeSubtitleIndex],
        endTime: validEndTime
      };
    }

    setSubtitles(newSubtitles);
    setActiveSubtitleIndex(nextIndex);
    setAutoScroll(true); // Always re-enable auto-scroll on sync

  }, [subtitles, activeSubtitleIndex, pushState]);

  const handleUndo = () => {
    const prevState = undo();
    if (prevState) {
      setSubtitles(prevState.subtitles);
      setActiveSubtitleIndex(prevState.activeIndex);
    }
  };

  const handleRedo = () => {
    const nextState = redo();
    if (nextState) {
      setSubtitles(nextState.subtitles);
      setActiveSubtitleIndex(nextState.activeIndex);
    }
  };

  // --- Keyboard Shortcuts ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if editor is open
      if (isEditorOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        syncCurrentLine();
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (e.code === 'ArrowLeft') {
         if (mediaRef.current) mediaRef.current.currentTime -= 5;
      } else if (e.code === 'ArrowRight') {
         if (mediaRef.current) mediaRef.current.currentTime += 5;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, syncCurrentLine, handleUndo, handleRedo, isEditorOpen]);

  const handleTimeUpdate = () => {
    if (!mediaRef.current) return;
    
    const t = mediaRef.current.currentTime;
    setCurrentTime(t);
    
    // Check if current active subtitle is still valid to avoid unnecessary searching
    const currentSub = subtitles[activeSubtitleIndex];
    const isCurrentValid = currentSub && 
                           currentSub.startTime !== null && 
                           t >= currentSub.startTime && 
                           (currentSub.endTime === null || t < currentSub.endTime);

    if (isCurrentValid) return;

    // Find the correct subtitle for the current time
    const newActiveIndex = subtitles.findIndex(s => 
      s.startTime !== null && t >= s.startTime && (s.endTime === null || t < s.endTime)
    );
    
    // If we found a direct match, use it
    if (newActiveIndex !== -1) {
      if (newActiveIndex !== activeSubtitleIndex) setActiveSubtitleIndex(newActiveIndex);
      return;
    }

    // Fallback: If in between subtitles or after last one, find the most recent start time
    // This logic ensures the subtitle stays highlighted until the next one starts (Karaoke style)
    if (subtitles.length > 0) {
       let lastStartedIndex = -1;
       // We can iterate backwards or forwards. For small N, simple forward loop is fine.
       for (let i = 0; i < subtitles.length; i++) {
           if (subtitles[i].startTime !== null && subtitles[i].startTime! <= t) {
               lastStartedIndex = i;
           } else if (subtitles[i].startTime !== null && subtitles[i].startTime! > t) {
               // Found a future subtitle, stop
               break; 
           }
       }
       
       if (lastStartedIndex !== -1 && lastStartedIndex !== activeSubtitleIndex) {
           setActiveSubtitleIndex(lastStartedIndex);
       }
    }
  };

  const jumpToSubtitle = (index: number) => {
      setActiveSubtitleIndex(index);
      const sub = subtitles[index];
      if (sub.startTime !== null && mediaRef.current) {
          mediaRef.current.currentTime = sub.startTime;
      }
      setAutoScroll(true); // Re-enable auto-scroll when manually selecting a line
  };

  const handleUserInteract = () => {
      setAutoScroll(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-zinc-100 font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="h-14 lg:h-16 shrink-0 bg-[#09090b] border-b border-white/5 px-4 flex items-center justify-between z-20">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
             <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Music className="text-emerald-500" size={18} />
             </div>
             <span className="font-bold text-lg hidden md:block tracking-tight text-zinc-100">SyncLyrics</span>
          </div>
          
          <div className="flex items-center space-x-1 ml-4 border-l border-white/10 pl-4">
            <Button variant="icon" size="sm" onClick={handleUndo} disabled={!canUndo} className={!canUndo ? 'opacity-30' : ''} title="Undo">
              <Undo2 size={18} />
            </Button>
            <Button variant="icon" size="sm" onClick={handleRedo} disabled={!canRedo} className={!canRedo ? 'opacity-30' : ''} title="Redo">
              <Redo2 size={18} />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-3">
          <Button variant="secondary" size="sm" onClick={openEditor} icon={<Edit size={16} />}>
            Editor
          </Button>
          <Button variant="primary" size="sm" onClick={exportSRT} icon={<Download size={16} />}>
            Export
          </Button>
        </div>
      </header>

      {/* MEDIA PLAYER BAR */}
      <div className="shrink-0 bg-[#09090b] border-b border-white/5 p-4 z-10">
        <div className="max-w-4xl mx-auto w-full flex flex-col space-y-3">
           
           {/* Top Info Row */}
           <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
              <div className="flex items-center space-x-2 truncate max-w-[200px] lg:max-w-md">
                 {mediaType === 'audio' ? <Music size={12} /> : <Video size={12} />}
                 <span className="truncate">{mediaFile?.name || "No Media Selected"}</span>
              </div>
              <div className="flex items-center space-x-1">
                 <span className="text-zinc-300">{formatTimeDisplay(currentTime)}</span>
                 <span className="text-zinc-600">/</span>
                 <span>{formatTimeDisplay(duration)}</span>
              </div>
           </div>

           {/* Progress Bar */}
           <div className="relative h-8 group cursor-pointer">
              {/* Fake Waveform Lines */}
              <div className="absolute inset-0 flex items-center justify-between opacity-20 pointer-events-none px-1">
                 {Array.from({ length: 60 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-0.5 bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ 
                        height: `${Math.max(20, Math.random() * 100)}%`,
                        opacity: (i / 60) < (currentTime / (duration || 1)) ? 1 : 0.3
                      }} 
                    />
                 ))}
              </div>

              {/* Real Input */}
              <input 
                type="range" 
                min={0} 
                max={duration || 100} 
                value={currentTime} 
                onChange={(e) => {
                   const val = parseFloat(e.target.value);
                   if(mediaRef.current) mediaRef.current.currentTime = val;
                   setCurrentTime(val);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              {/* Progress Indicator Line */}
              <div 
                className="absolute top-0 bottom-0 left-0 bg-emerald-500/10 pointer-events-none border-r-2 border-emerald-500 transition-all duration-100 ease-linear"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              ></div>
           </div>

           {/* Controls Row */}
           <div className="flex items-center justify-center space-x-6">
              <button 
                onClick={() => { if(mediaRef.current) mediaRef.current.currentTime -= 5; }}
                className="text-zinc-400 hover:text-white transition-colors p-2"
              >
                 <SkipBack size={20} />
              </button>

              <button 
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-black shadow-lg shadow-emerald-900/50 hover:scale-105 transition-all"
              >
                 {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>

              <button 
                onClick={() => { if(mediaRef.current) mediaRef.current.currentTime += 5; }}
                className="text-zinc-400 hover:text-white transition-colors p-2"
              >
                 <SkipForward size={20} />
              </button>
           </div>
        </div>

        {/* Hidden Media Elements */}
        {mediaUrl && (
           mediaType === 'video' ? (
             <video 
               ref={mediaRef as React.RefObject<HTMLVideoElement>}
               src={mediaUrl} 
               className="hidden"
               onTimeUpdate={handleTimeUpdate}
               onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
               onEnded={() => setIsPlaying(false)}
             />
           ) : (
             <audio 
               ref={mediaRef as React.RefObject<HTMLAudioElement>}
               src={mediaUrl} 
               onTimeUpdate={handleTimeUpdate}
               onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
               onEnded={() => setIsPlaying(false)}
             />
           )
        )}
      </div>

      {/* MAIN LYRICS VIEW */}
      <div className="flex-1 overflow-hidden relative bg-black">
        {mediaUrl ? (
          <>
            <div 
              className="absolute inset-0 overflow-y-auto no-scrollbar py-[40vh] space-y-1"
              onWheel={handleUserInteract}
              onTouchStart={handleUserInteract}
            >
               {subtitles.length > 0 ? (
                 subtitles.map((sub, idx) => (
                   <SubtitleItem 
                     key={sub.id} 
                     subtitle={sub} 
                     index={idx}
                     isActive={idx === activeSubtitleIndex}
                     isNext={idx === activeSubtitleIndex + 1}
                     autoScroll={autoScroll}
                     onClick={() => jumpToSubtitle(idx)}
                     onAdjust={(amount) => handleAdjustTime(idx, amount)}
                   />
                 ))
               ) : (
                 <div className="text-center text-zinc-500 mt-10">
                    <p className="mb-4">No lyrics loaded yet.</p>
                    <Button variant="secondary" onClick={openEditor}>Open Editor</Button>
                 </div>
               )}
               <div className="h-32 lg:hidden"></div>
            </div>
            
            {!autoScroll && subtitles.length > 0 && (
                <button 
                  onClick={() => setAutoScroll(true)}
                  className="absolute bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-30 bg-zinc-800/90 text-white border border-white/20 px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-sm font-medium hover:bg-zinc-700 hover:scale-105 transition-all animate-in fade-in slide-in-from-bottom-4"
                >
                   <ArrowDownCircle size={16} className="text-emerald-400" />
                   Resume Sync
                </button>
            )}

            {/* Mobile Sync Button */}
            <div className="absolute bottom-0 left-0 right-0 p-4 lg:hidden bg-gradient-to-t from-black via-black/90 to-transparent z-20 pointer-events-none">
              <button 
                onClick={syncCurrentLine}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold rounded-xl shadow-xl shadow-emerald-900/40 text-lg tracking-wide flex items-center justify-center transition-all pointer-events-auto"
              >
                 TAP TO SYNC
              </button>
            </div>
            
            {/* Desktop Shortcuts */}
            <div className="hidden lg:block absolute bottom-8 right-8 z-20">
               <div className="bg-[#09090b] border border-white/10 rounded-lg p-4 shadow-2xl">
                  <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-bold">Shortcuts</p>
                  <div className="space-y-2 text-sm text-zinc-300">
                    <div className="flex justify-between w-40">
                       <span>Play/Pause</span> <kbd className="bg-white/10 px-1.5 rounded text-white">Space</kbd>
                    </div>
                    <div className="flex justify-between w-40">
                       <span className="text-emerald-400 font-bold">Sync Line</span> <kbd className="bg-emerald-500/20 text-emerald-400 px-1.5 rounded border border-emerald-500/30">S</kbd>
                    </div>
                  </div>
               </div>
            </div>
          </>
        ) : (
           <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-[#18181b] border border-white/5 flex items-center justify-center mb-6">
                 <Upload size={32} className="text-zinc-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Start Synchronizing</h2>
              <p className="text-zinc-500 max-w-sm mb-8">Upload a media file to begin. You can then paste your lyrics or import an existing SRT.</p>
              
              <label className="cursor-pointer group">
                <input type="file" accept="video/*,audio/*" onChange={handleFileUpload} className="hidden" />
                <div className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 group-hover:shadow-emerald-500/40 group-hover:scale-105 flex items-center">
                   <Music className="mr-2" size={20} /> Select Audio / Video
                </div>
              </label>
           </div>
        )}
      </div>

      <EditorModal 
        isOpen={isEditorOpen}
        initialText={editorInitialText}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveEditor}
        onImportSRT={handleSRTImport}
      />

    </div>
  );
};

export default App;