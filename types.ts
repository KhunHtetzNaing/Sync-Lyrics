export interface Subtitle {
  id: string;
  startTime: number | null; // in seconds
  endTime: number | null;   // in seconds
  text: string;
}

export interface HistoryState {
  subtitles: Subtitle[];
  activeIndex: number;
}
