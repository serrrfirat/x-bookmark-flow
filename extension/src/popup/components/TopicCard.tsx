import { useState } from 'react';
import { clsx } from 'clsx';
import type { ClusterResult, ScrapedTweet } from '../../../../shared/src/types';
import { useStore } from '../store/useStore';
import { PostEditor } from './PostEditor';

interface TopicCardProps {
  cluster: ClusterResult;
  delay?: number;
}

// Emoji mapping for common topics
const TOPIC_EMOJIS: Record<string, string> = {
  ai: '🤖',
  agents: '🤖',
  startup: '🚀',
  founder: '👨‍💼',
  product: '📦',
  design: '🎨',
  engineering: '⚙️',
  code: '💻',
  marketing: '📣',
  growth: '📈',
  finance: '💰',
  crypto: '🪙',
  web3: '🌐',
  career: '💼',
  learning: '📚',
  writing: '✍️',
  productivity: '⚡',
  health: '🏃',
  mental: '🧠',
  default: '💡',
};

function getTopicEmoji(label: string): string {
  const lower = label.toLowerCase();
  for (const [key, emoji] of Object.entries(TOPIC_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return TOPIC_EMOJIS.default;
}

export function TopicCard({ cluster, delay = 0 }: TopicCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'thread'>('summary');
  const [editedSummary, setEditedSummary] = useState(cluster.summary);
  const updateCluster = useStore((s) => s.updateCluster);

  const handleSave = () => {
    updateCluster(cluster.id, { summary: editedSummary });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSummary(cluster.summary);
    setIsEditing(false);
  };

  return (
    <div 
      className="card animate-in"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 text-left"
      >
        <span className="text-2xl">{getTopicEmoji(cluster.label)}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-x-text truncate">
            {cluster.label}
          </h3>
          <p className="text-xs text-x-text-secondary">
            {cluster.tweetCount} tweets
          </p>
        </div>
        <svg
          className={clsx(
            'w-5 h-5 text-x-text-secondary transition-transform',
            isExpanded && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-x-border animate-in">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-x-bg-secondary rounded-lg mb-4">
            <button
              onClick={() => setActiveTab('summary')}
              className={clsx(
                'flex-1 py-1 px-3 rounded-md text-xs font-medium transition-colors',
                activeTab === 'summary'
                  ? 'bg-x-bg text-x-text'
                  : 'text-x-text-secondary hover:text-x-text'
              )}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('thread')}
              className={clsx(
                'flex-1 py-1 px-3 rounded-md text-xs font-medium transition-colors',
                activeTab === 'thread'
                  ? 'bg-x-bg text-x-text'
                  : 'text-x-text-secondary hover:text-x-text'
              )}
            >
              Post {cluster.thread ? '' : ''}
            </button>
          </div>
          
          {activeTab === 'summary' && (
            <>
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    className="textarea text-sm"
                    rows={5}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="btn-primary text-xs py-1">
                      Save
                    </button>
                    <button onClick={handleCancel} className="btn-secondary text-xs py-1">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div 
                    className="text-sm text-x-text-secondary whitespace-pre-wrap prose prose-sm prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: cluster.summary
                        .replace(/^[•\-]\s*/gm, '<span class="text-x-accent mr-2">•</span>')
                    }}
                  />
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-3 text-xs text-x-accent hover:underline"
                  >
                    Edit summary
                  </button>
                </>
              )}
              
              {/* Sample tweets */}
              <div className="mt-4">
                <p className="text-xs text-x-text-secondary mb-2">Sample tweets:</p>
                <div className="space-y-2">
                  {cluster.tweets.slice(0, 2).map((tweet: ScrapedTweet) => (
                    <a
                      key={tweet.id}
                      href={tweet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded-lg bg-x-bg hover:bg-x-bg-hover transition-colors"
                    >
                      <p className="text-xs text-x-text-secondary mb-1">
                        @{tweet.authorHandle}
                      </p>
                      <p className="text-sm text-x-text line-clamp-2">
                        {tweet.text}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'thread' && cluster.thread && (
            <PostEditor
              thread={cluster.thread}
              onUpdate={(content) => {
                updateCluster(cluster.id, {
                  thread: { ...cluster.thread!, tweets: [content] }
                });
              }}
            />
          )}

          {activeTab === 'thread' && !cluster.thread && (
            <p className="text-sm text-x-text-secondary">
              no post generated for this topic.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
