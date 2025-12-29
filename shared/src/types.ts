// ============================================
// Tweet & Scraping Types
// ============================================

export interface ScrapedTweet {
  id: string;
  text: string;
  authorHandle: string;
  authorName: string;
  url: string;
  timestamp: string;
  metrics?: TweetMetrics;
  scrapedAt: string;
  linkContext?: LinkContext;
}

export interface LinkContext {
  type: 'github' | 'twitter_article' | 'other';
  url: string;
  title?: string;
  content: string; // Main content from the link
  extractedAt: string;
}

export interface TweetMetrics {
  replies: number;
  retweets: number;
  likes: number;
  views?: number;
}

// ============================================
// Clustering & Analysis Types
// ============================================

export interface ClusterResult {
  id: string;
  label: string;
  summary: string;
  tweets: ScrapedTweet[];
  tweetCount: number;
  insights: string[];
  thread?: ThreadDraft; // Thread for this specific cluster
}

export interface ThreadDraft {
  tweets: string[];
  tone: TonePreset;
  generatedAt: string;
  sources?: string[]; // URLs researched for this thread (when using Agent SDK)
}

export type TonePreset = 'neutral' | 'founder' | 'contrarian';

export type ProcessingMode = 'twitter' | 'research';

// ============================================
// API Types
// ============================================

export interface ProcessRequest {
  tweets: ScrapedTweet[];
  options?: ProcessOptions;
}

export interface ClusterContext {
  id: string;
  label: string;
  summary: string;
  tweetCount: number;
}

export interface ProcessOptions {
  minClusterSize?: number;
  maxClusters?: number;
  tonePreset?: TonePreset;
  includeMetrics?: boolean;
  mode?: ProcessingMode;
  existingClusters?: ClusterContext[]; // For incremental processing
}

export interface ProcessResponse {
  success: true;
  data: {
    clusters: ClusterResult[]; // Each cluster now has its own thread
    meta: ProcessingMeta;
  };
}

export interface ProcessingMeta {
  totalTweets: number;
  processedTweets: number;
  filteredTweets: number;
  clustersGenerated: number;
  processingTimeMs: number;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse = ProcessResponse | ErrorResponse;

// ============================================
// Extension Message Types
// ============================================

// Content Script → Background
export type ContentMessage =
  | { type: 'SCRAPE_PROGRESS'; count: number; status: string }
  | { type: 'SCRAPE_COMPLETE'; tweets: ScrapedTweet[] }
  | { type: 'SCRAPE_ERROR'; error: string };

// Background → Content Script
export type BackgroundMessage =
  | { type: 'START_SCRAPE'; options?: ScrapeOptions }
  | { type: 'STOP_SCRAPE' };

export interface ScrapeOptions {
  maxTweets?: number;
  scrollDelay?: number;
}

// ============================================
// App State Types
// ============================================

export type AppStatus = 'idle' | 'scanning' | 'processing' | 'review' | 'error';

export type ProcessingStep = 'embedding' | 'clustering' | 'summarizing' | 'generating';

export interface AppState {
  status: AppStatus;
  progress?: {
    count: number;
    total?: number;
    step?: ProcessingStep;
  };
  data?: {
    clusters: ClusterResult[];
    thread: ThreadDraft;
    meta: ProcessingMeta;
  };
  error?: {
    message: string;
    code?: string;
  };
}

// ============================================
// Storage Types
// ============================================

export interface StoredData {
  lastScan?: {
    timestamp: string;
    tweetCount: number;
  };
  cachedResults?: {
    clusters: ClusterResult[];
    thread: ThreadDraft;
    expiresAt: string;
  };
  preferences?: UserPreferences;
}

export interface UserPreferences {
  defaultTone: TonePreset;
  autoScroll: boolean;
  maxTweets: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultTone: 'neutral',
  autoScroll: true,
  maxTweets: 500,
};

