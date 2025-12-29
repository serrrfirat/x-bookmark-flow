import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { Header } from './components/Header';
import { IdleView } from './components/IdleView';
import { ScanningView } from './components/ScanningView';
import { ProcessingView } from './components/ProcessingView';
import { ReviewView } from './components/ReviewView';
import { ErrorView } from './components/ErrorView';
import { HistoryView } from './components/HistoryView';

export default function App() {
  const { status, mode, setScanning, setTweets, setReview, setError, setIdle, setMode } = useStore();
  const [showHistory, setShowHistory] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);

  // Listen for messages from background script
  useEffect(() => {
    const handleMessage = (message: { type: string; [key: string]: unknown }) => {
      console.log('[Popup] Received:', message.type);

      switch (message.type) {
        case 'PROGRESS_UPDATE':
          setScanning(
            message.count as number,
            message.status as string,
          );
          break;

        case 'SCRAPE_DONE':
          setTweets(message.tweets as never[]);
          // Auto-start processing
          startProcessing();
          break;

        case 'SCRAPE_FAILED':
          setError(message.error as string);
          break;
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    // Restore full state from background script
    chrome.runtime.sendMessage({ type: 'POPUP_GET_STATE' }, (response) => {
      if (!response) return;

      console.log('[Popup] Restoring state:', response.status);

      // Restore tweets
      if (response.tweets?.length > 0) {
        setTweets(response.tweets);
      }

      // Restore full state based on status
      if (response.status === 'review' && response.data) {
        setReview(response.data);
      } else if (response.status === 'scanning' && response.progress) {
        setScanning(response.progress.count, response.progress.status);
      } else if (response.status === 'processing' && response.progress?.step) {
        useStore.getState().setProcessing(response.progress.step);
      } else if (response.status === 'error' && response.error) {
        setError(response.error.message, response.error.code);
      }
    });

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [setScanning, setTweets, setError, setReview]);

  const startScan = async () => {
    setShowHistory(false);
    setScanning(0, 'Starting scan...');

    const response = await chrome.runtime.sendMessage({ type: 'POPUP_START_SCAN' });

    if (!response.success) {
      setError(response.error || 'Failed to start scan');
    }
  };

  const stopScan = async () => {
    await chrome.runtime.sendMessage({ type: 'POPUP_STOP_SCAN' });
    setIdle();
  };

  const startProcessing = async () => {
    const store = useStore.getState();
    store.setProcessing('embedding');

    const response = await chrome.runtime.sendMessage({
      type: 'POPUP_PROCESS',
      options: { tonePreset: 'founder', mode: store.mode },
    });

    if (response.success) {
      setReview(response.data);
    } else {
      setError(response.error?.message || 'Processing failed');
    }
  };

  const loadSession = async (sessionId: string) => {
    setLoadingSession(true);
    setShowHistory(false);

    try {
      const response = await fetch(`http://localhost:9999/api/sessions/${sessionId}`);
      const data = await response.json();

      if (data.success) {
        setReview(data.data);
      } else {
        setError(data.error?.message || 'failed to load session');
      }
    } catch (err) {
      setError('could not connect to server');
    } finally {
      setLoadingSession(false);
    }
  };

  const reset = () => {
    setShowHistory(false);
    setIdle();
    // Sync reset to background
    chrome.runtime.sendMessage({
      type: 'POPUP_UPDATE_STATE',
      state: { status: 'idle', data: null, error: null }
    });
  };

  const openHistory = () => {
    setShowHistory(true);
  };

  const closeHistory = () => {
    setShowHistory(false);
  };

  return (
    <div className="min-h-[500px] flex flex-col">
      <Header onReset={status !== 'idle' || showHistory ? reset : undefined} />

      <main className="flex-1 p-4">
        {loadingSession && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-x-accent border-t-transparent" />
          </div>
        )}

        {!loadingSession && showHistory && (
          <HistoryView
            onSelectSession={loadSession}
            onBack={closeHistory}
          />
        )}

        {!loadingSession && !showHistory && (
          <>
            {status === 'idle' && (
              <IdleView
                onStartScan={startScan}
                onOpenHistory={openHistory}
                mode={mode}
                onModeChange={setMode}
              />
            )}
            {status === 'scanning' && <ScanningView onStop={stopScan} />}
            {status === 'processing' && <ProcessingView />}
            {status === 'review' && <ReviewView onRegenerate={startProcessing} />}
            {status === 'error' && <ErrorView onRetry={startScan} onDismiss={reset} />}
          </>
        )}
      </main>
    </div>
  );
}
