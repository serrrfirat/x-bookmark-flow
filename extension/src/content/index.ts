/**
 * Content Script - Runs on X/Twitter bookmarks page
 * Handles scraping tweets from the DOM
 */

import type { ContentMessage, BackgroundMessage } from '../../../shared/src/types';
import { scrapeAllBookmarks } from './scraper';

let isScanning = false;
let abortController: AbortController | null = null;

/**
 * Send message to background script
 */
function sendMessage(message: ContentMessage): void {
  chrome.runtime.sendMessage(message);
}

/**
 * Start scraping bookmarks
 * @param processedIds - Array of tweet IDs to skip (already processed)
 * @param scrapeLimit - Maximum number of new bookmarks to scrape
 */
async function startScraping(processedIds: string[] = [], scrapeLimit: number = 10): Promise<void> {
  if (isScanning) {
    console.log('[X-Bookmark] Already scanning');
    return;
  }

  isScanning = true;
  abortController = new AbortController();

  const processedSet = new Set(processedIds);
  console.log(`[X-Bookmark] Starting bookmark scan (limit: ${scrapeLimit}, skipping ${processedSet.size} already processed)`, processedIds.slice(0, 3));

  try {
    const tweets = await scrapeAllBookmarks(
      (progress) => {
        sendMessage({
          type: 'SCRAPE_PROGRESS',
          count: progress.count,
          status: progress.status,
        });
      },
      abortController.signal,
      scrapeLimit,
      processedSet,
    );

    console.log(`[X-Bookmark] Scan complete: ${tweets.length} new tweets`);

    sendMessage({
      type: 'SCRAPE_COMPLETE',
      tweets,
    });
  } catch (error) {
    console.error('[X-Bookmark] Scrape error:', error);
    sendMessage({
      type: 'SCRAPE_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  } finally {
    isScanning = false;
    abortController = null;
  }
}

/**
 * Stop scraping
 */
function stopScraping(): void {
  if (abortController) {
    abortController.abort();
    console.log('[X-Bookmark] Scan stopped');
  }
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener(
  (message: BackgroundMessage & { processedIds?: string[]; scrapeLimit?: number }, _sender, sendResponse) => {
    console.log('[X-Bookmark] Received message:', message.type);

    switch (message.type) {
      case 'START_SCRAPE':
        startScraping(message.processedIds || [], message.scrapeLimit || 10);
        sendResponse({ success: true });
        break;

      case 'STOP_SCRAPE':
        stopScraping();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }

    return true; // Keep channel open for async response
  },
);

// Notify that content script is loaded
console.log('[X-Bookmark] Content script loaded on bookmarks page');
