import { clsx } from 'clsx';
import type { TonePreset } from '../../../../shared/src/types';
import { useStore } from '../store/useStore';

const TONES: { value: TonePreset; label: string; description: string }[] = [
  { 
    value: 'neutral', 
    label: 'Neutral', 
    description: 'Analytical and factual' 
  },
  { 
    value: 'founder', 
    label: 'Founder', 
    description: 'Direct and personal' 
  },
  { 
    value: 'contrarian', 
    label: 'Contrarian', 
    description: 'Provocative takes' 
  },
];

export function ToneSelector() {
  const data = useStore((s) => s.data);
  const setTone = useStore((s) => s.setTone);
  
  // Get tone from first cluster's thread, or default to neutral
  const currentTone = data?.clusters.find(c => c.thread)?.thread?.tone || 'neutral';

  return (
    <div className="flex gap-2">
      {TONES.map((tone) => (
        <button
          key={tone.value}
          onClick={() => setTone(tone.value)}
          className={clsx(
            'flex-1 p-2 rounded-lg border transition-all text-center',
            currentTone === tone.value
              ? 'border-x-accent bg-x-accent/10'
              : 'border-x-border hover:border-x-text-secondary'
          )}
        >
          <p className={clsx(
            'text-sm font-medium',
            currentTone === tone.value ? 'text-x-accent' : 'text-x-text'
          )}>
            {tone.label}
          </p>
          <p className="text-xs text-x-text-secondary">
            {tone.description}
          </p>
        </button>
      ))}
    </div>
  );
}
