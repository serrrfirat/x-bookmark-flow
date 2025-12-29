import { useState } from 'react';
import { clsx } from 'clsx';
import type { ThreadDraft } from '../../../../shared/src/types';

interface PostEditorProps {
  thread: ThreadDraft;
  onUpdate?: (content: string) => void;
}

export function PostEditor({ thread, onUpdate }: PostEditorProps) {
  const [copied, setCopied] = useState(false);

  // Get the post content (first tweet in the array)
  const postContent = thread.tweets[0] || '';

  const handleChange = (value: string) => {
    if (onUpdate) {
      onUpdate(value);
    }
  };

  const copyPost = async () => {
    await navigator.clipboard.writeText(postContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportMarkdown = () => {
    const markdown = `# Post\n\n${postContent}\n\n---\n\n## Sources\n\n${
      thread.sources?.map(s => `- ${s}`).join('\n') || 'No sources'
    }`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'post.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-x-text-secondary">
          {postContent.length} characters
        </p>
        <div className="flex gap-2">
          <button
            onClick={exportMarkdown}
            className="btn-ghost text-xs py-1 px-2"
          >
            Export
          </button>
          <button
            onClick={copyPost}
            className={clsx(
              'btn-ghost text-xs py-1 px-2',
              copied && 'text-x-success'
            )}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Post content - scrollable textarea */}
      <div className="card p-3">
        <textarea
          value={postContent}
          onChange={(e) => handleChange(e.target.value)}
          className="textarea text-sm min-h-[200px] max-h-[400px] resize-y"
          placeholder="Your post content..."
        />
      </div>

      {/* Sources */}
      {thread.sources && thread.sources.length > 0 && (
        <div className="text-xs text-x-text-secondary">
          <p className="font-medium mb-1">sources:</p>
          <ul className="space-y-1">
            {thread.sources.slice(0, 3).map((source, i) => (
              <li key={i} className="truncate">
                <a
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-x-accent"
                >
                  {source}
                </a>
              </li>
            ))}
            {thread.sources.length > 3 && (
              <li className="text-x-text-secondary">
                +{thread.sources.length - 3} more
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
