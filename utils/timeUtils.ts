// Formats seconds into HH:MM:SS,ms format for SRT
export const formatTimeSRT = (seconds: number | null): string => {
  if (seconds === null) return '00:00:00,000';
  
  const date = new Date(0);
  date.setMilliseconds(seconds * 1000);
  
  const isoString = date.toISOString();
  // HH:MM:SS.mmm -> HH:MM:SS,mmm
  return isoString.substr(11, 12).replace('.', ',');
};

// Formats seconds into MM:SS.ms for Display
export const formatTimeDisplay = (seconds: number | null): string => {
  if (seconds === null) return '--:--';
  
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

// Parses SRT timestamp string to seconds
export const parseSRTTime = (timeString: string): number => {
  if (!timeString) return 0;
  const parts = timeString.replace(',', '.').split(':');
  if (parts.length < 3) return 0;
  
  const h = parseFloat(parts[0]);
  const m = parseFloat(parts[1]);
  const s = parseFloat(parts[2]);
  
  return h * 3600 + m * 60 + s;
};
