/**
 * Background Service Worker
 * Handles communication between content script, popup, and backend API
 */

import type {
  ContentMessage,
  ScrapedTweet,
  ProcessResponse,
  ErrorResponse,
  ProcessOptions,
  ClusterResult,
  ProcessingMeta,
  ProcessingStep,
  AppStatus
} from '../../../shared/src/types';
import { getProcessedTweetIds, addProcessedTweetIds } from './storage';

// Configuration
const API_BASE_URL = 'http://localhost:9999/api';

// Full app state persisted in background
interface AppState {
  status: AppStatus;
  tweets: ScrapedTweet[];
  progress: { count: number; status: string; step?: ProcessingStep };
  data: { clusters: ClusterResult[]; meta: ProcessingMeta } | null;
  error: { message: string; code?: string } | null;
}

let appState: AppState = {
  status: 'idle',
  tweets: [],
  progress: { count: 0, status: 'idle' },
  data: null,
  error: null,
};

// Legacy references for backwards compatibility
const getScrapedTweets = () => appState.tweets;
const setScrapedTweets = (tweets: ScrapedTweet[]) => { appState.tweets = tweets; };
const getLastScrapeProgress = () => appState.progress;
const setLastScrapeProgress = (progress: { count: number; status: string }) => {
  appState.progress = { ...appState.progress, ...progress };
};

/**
 * Get the active tab
 */
async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

/**
 * Check if we're on the bookmarks page
 */
function isBookmarksPage(url?: string): boolean {
  if (!url) return false;
  return url.includes('x.com/i/bookmarks') || url.includes('twitter.com/i/bookmarks');
}

/**
 * Send message to content script
 */
async function sendToContentScript(message: unknown): Promise<unknown> {
  const tab = await getActiveTab();
  if (!tab?.id) throw new Error('No active tab');
  
  return chrome.tabs.sendMessage(tab.id, message);
}

/**
 * Process tweets via backend API
 */
async function processBookmarks(
  tweets: ScrapedTweet[],
  options?: ProcessOptions,
): Promise<ProcessResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/process-bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tweets, options }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Failed to process bookmarks',
      },
    };
  }
}

/**
 * Handle messages from content script
 */
chrome.runtime.onMessage.addListener(
  (message: ContentMessage | { type: string; [key: string]: unknown }, _sender, sendResponse) => {
    console.log('[Background] Received:', message.type);
    
    // Handle content script messages
    if (message.type === 'SCRAPE_PROGRESS') {
      const msg = message as ContentMessage & { type: 'SCRAPE_PROGRESS' };
      appState.status = 'scanning';
      appState.progress = { count: msg.count, status: msg.status };
      chrome.runtime.sendMessage({
        type: 'PROGRESS_UPDATE',
        count: msg.count,
        status: msg.status,
      }).catch(() => {});
      sendResponse({ success: true });
      return true;
    }

    if (message.type === 'SCRAPE_COMPLETE') {
      const msg = message as ContentMessage & { type: 'SCRAPE_COMPLETE' };
      appState.tweets = msg.tweets;
      appState.progress = { count: msg.tweets.length, status: 'complete' };
      chrome.runtime.sendMessage({
        type: 'SCRAPE_DONE',
        tweets: msg.tweets,
      }).catch(() => {});
      sendResponse({ success: true });
      return true;
    }

    if (message.type === 'SCRAPE_ERROR') {
      const msg = message as ContentMessage & { type: 'SCRAPE_ERROR' };
      appState.status = 'error';
      appState.error = { message: msg.error, code: 'SCRAPE_ERROR' };
      chrome.runtime.sendMessage({
        type: 'SCRAPE_FAILED',
        error: msg.error,
      }).catch(() => {});
      sendResponse({ success: true });
      return true;
    }
    
    // Handle popup messages
    if (message.type === 'POPUP_START_SCAN') {
      handleStartScan().then(sendResponse);
      return true;
    }
    
    if (message.type === 'POPUP_STOP_SCAN') {
      handleStopScan().then(sendResponse);
      return true;
    }
    
    if (message.type === 'POPUP_PROCESS') {
      const msg = message as { type: string; options?: ProcessOptions };
      handleProcess(msg.options).then(sendResponse);
      return true;
    }
    
    if (message.type === 'POPUP_GET_STATE') {
      sendResponse({
        ...appState,
        // Legacy fields for backwards compatibility
        tweets: appState.tweets,
        progress: appState.progress,
      });
      return true;
    }

    // Allow popup to update state (for cluster edits, etc.)
    if (message.type === 'POPUP_UPDATE_STATE') {
      const msg = message as { type: string; state: Partial<AppState> };
      appState = { ...appState, ...msg.state };
      sendResponse({ success: true });
      return true;
    }
    
    return false;
  },
);

async function handleStartScan(): Promise<{ success: boolean; error?: string }> {
  try {
    const tab = await getActiveTab();

    if (!isBookmarksPage(tab?.url)) {
      return {
        success: false,
        error: 'Please navigate to your X/Twitter bookmarks page first'
      };
    }

    // Load processed tweet IDs to skip
    const processedIds = await getProcessedTweetIds();
    console.log(`[Background] Loaded ${processedIds.size} processed tweet IDs`);

    // Reset state
    appState = {
      status: 'scanning',
      tweets: [],
      progress: { count: 0, status: 'starting' },
      data: null,
      error: null,
    };

    // Start scanning with processed IDs to skip
    await sendToContentScript({
      type: 'START_SCRAPE',
      processedIds: Array.from(processedIds),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start scan'
    };
  }
}

async function handleStopScan(): Promise<{ success: boolean }> {
  try {
    await sendToContentScript({ type: 'STOP_SCRAPE' });
    return { success: true };
  } catch {
    return { success: true };
  }
}

async function handleProcess(
  options?: ProcessOptions,
): Promise<ProcessResponse | ErrorResponse> {
  if (appState.tweets.length === 0) {
    return {
      success: false,
      error: {
        code: 'NO_TWEETS',
        message: 'No bookmarks to process. Please scan first.',
      },
    };
  }

  // Update state to processing
  appState.status = 'processing';
  appState.progress = { ...appState.progress, step: 'embedding' };

  const result = await processBookmarks(appState.tweets, options);

  // Store results in state
  if (result.success && 'data' in result) {
    appState.status = 'review';
    appState.data = result.data;
    appState.error = null;

    // Save processed tweet IDs so we skip them next time
    const processedIds = appState.tweets.map(t => t.id);
    await addProcessedTweetIds(processedIds);
    console.log(`[Background] Saved ${processedIds.length} processed tweet IDs`);
  } else if (!result.success && 'error' in result) {
    appState.status = 'error';
    appState.error = result.error;
  }

  return result;
}

// Log when service worker starts
console.log('[Background] Service worker initialized');
