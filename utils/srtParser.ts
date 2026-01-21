import { Subtitle } from '../types';
import { formatTimeSRT, parseSRTTime } from './timeUtils';

// Helper to generate IDs safely (works in non-secure contexts unlike crypto.randomUUID)
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const parseSRT = (data: string): Subtitle[] => {
  // Normalize line endings
  const normalizedData = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Regex to match SRT blocks
  // Index number -> Timestamp --> Timestamp -> Text (multiline allowed)
  const regex = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n([\s\S]*?)(?=\n\n|\n*$)/g;
  
  const subtitles: Subtitle[] = [];
  let match;
  
  while ((match = regex.exec(normalizedData)) !== null) {
    subtitles.push({
      id: generateId(),
      startTime: parseSRTTime(match[2]),
      endTime: parseSRTTime(match[3]),
      text: match[4].trim(),
    });
  }

  // If regex fails (simple text file), split by newlines
  if (subtitles.length === 0 && data.trim().length > 0) {
    return data.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => ({
        id: generateId(),
        startTime: null,
        endTime: null,
        text: line.trim()
      }));
  }

  return subtitles;
};

export const generateSRT = (subtitles: Subtitle[]): string => {
  return subtitles.map((sub, index) => {
    // If times are missing, default to 0 or maintain structure but likely invalid for players
    const start = formatTimeSRT(sub.startTime || 0);
    const end = formatTimeSRT(sub.endTime || (sub.startTime ? sub.startTime + 2 : 2));
    
    return `${index + 1}\n${start} --> ${end}\n${sub.text}\n`;
  }).join('\n');
};
