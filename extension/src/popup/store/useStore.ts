import { create } from 'zustand';
import type {
  ClusterResult,
  ProcessingMeta,
  TonePreset,
  ScrapedTweet,
  ProcessingStep,
  AppStatus,
  ProcessingMode
} from '../../../../shared/src/types';

interface AppData {
  clusters: ClusterResult[]; // Each cluster has its own thread now
  meta: ProcessingMeta;
}

interface Progress {
  count: number;
  total?: number;
  step?: ProcessingStep;
}

interface AppError {
  message: string;
  code?: string;
}

interface Store {
  // State
  status: AppStatus;
  progress: Progress | undefined;
  data: AppData | undefined;
  error: AppError | undefined;
  tweets: ScrapedTweet[];
  mode: ProcessingMode;
  scrapeLimit: number;

  // Actions
  setIdle: () => void;
  setScanning: (count: number, status: string) => void;
  setProcessing: (step: ProcessingStep) => void;
  setReview: (data: AppData) => void;
  setError: (message: string, code?: string) => void;
  setMode: (mode: ProcessingMode) => void;
  setScrapeLimit: (limit: number) => void;

  // Data updates
  updateCluster: (clusterId: string, updates: Partial<ClusterResult>) => void;
  updateThread: (tweets: string[]) => void; // Deprecated - threads are per-cluster now
  setTone: (tone: TonePreset) => void;
  updateClusterThread: (clusterId: string, tweets: string[]) => void;
  setTweets: (tweets: ScrapedTweet[]) => void;
}

export const useStore = create<Store>((set) => ({
  // Initial state
  status: 'idle',
  progress: undefined,
  data: undefined,
  error: undefined,
  tweets: [],
  mode: 'twitter', // Default to twitter mode
  scrapeLimit: 10, // Default scrape limit

  // State transitions
  setIdle: () => set({
    status: 'idle',
    progress: undefined,
    error: undefined
  }),

  setMode: (mode: ProcessingMode) => set({ mode }),

  setScrapeLimit: (limit: number) => set({ scrapeLimit: limit }),

  setScanning: (count: number, _status: string) => set({
    status: 'scanning',
    progress: { count, total: undefined, step: undefined },
    error: undefined,
  }),

  setProcessing: (step: ProcessingStep) => set((state) => ({
    status: 'processing',
    progress: { ...state.progress, count: state.progress?.count || 0, step },
    error: undefined,
  })),

  setReview: (data: AppData) => set({
    status: 'review',
    data,
    progress: undefined,
    error: undefined,
  }),

  setError: (message: string, code?: string) => set({
    status: 'error',
    error: { message, code },
  }),

  // Data updates
  updateCluster: (clusterId: string, updates: Partial<ClusterResult>) => set((state) => {
    if (!state.data) return state;
    
    const clusters = state.data.clusters.map((c: ClusterResult) =>
      c.id === clusterId ? { ...c, ...updates } : c
    );
    
    return { data: { ...state.data, clusters } };
  }),

  updateThread: (_tweets: string[]) => {
    // Deprecated - kept for backwards compatibility
    console.warn('updateThread is deprecated, use updateClusterThread instead');
  },

  updateClusterThread: (clusterId: string, tweets: string[]) => set((state) => {
    if (!state.data) return state;
    
    const clusters = state.data.clusters.map((c: ClusterResult) =>
      c.id === clusterId && c.thread
        ? { ...c, thread: { ...c.thread, tweets } }
        : c
    );
    
    return { data: { ...state.data, clusters } };
  }),

  setTone: (tone: TonePreset) => set((state) => {
    if (!state.data) return state;
    
    // Update tone for all cluster threads
    const clusters = state.data.clusters.map((c: ClusterResult) =>
      c.thread ? { ...c, thread: { ...c.thread, tone } } : c
    );
    
    return { data: { ...state.data, clusters } };
  }),

  setTweets: (tweets: ScrapedTweet[]) => set({ tweets }),
}));
