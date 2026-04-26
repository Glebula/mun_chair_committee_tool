import type { Delegate } from '../types';

interface DelegatePickerProps {
  delegates: Delegate[];
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (delegateId: string) => void;
  placeholder?: string;
  maxHeight?: string;
}

export default function DelegatePicker({
  delegates,
  search,
  onSearchChange,
  onSelect,
  placeholder = 'Search delegates...',
  maxHeight = 'max-h-64',
}: DelegatePickerProps) {
  const filtered = delegates.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by speechCount, highest first
  const groups = new Map<number, Delegate[]>();
  for (const d of filtered) {
    const bucket = groups.get(d.speechCount) ?? [];
    bucket.push(d);
    groups.set(d.speechCount, bucket);
  }
  const sortedCounts = [...groups.keys()].sort((a, b) => b - a);

  return (
    <div className="flex flex-col gap-2">
      <input
        autoFocus
        className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 text-base"
        placeholder={placeholder}
        value={search}
        onChange={e => onSearchChange(e.target.value)}
      />
      <div className={`${maxHeight} overflow-y-auto flex flex-col gap-3`}>
        {sortedCounts.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-2">No delegates found</div>
        )}
        {sortedCounts.map(count => (
          <div key={count}>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-1">
              {count === 0 ? 'Not yet spoken' : `${count} speech${count !== 1 ? 'es' : ''}`}
            </div>
            <div className="flex flex-wrap gap-2">
              {(groups.get(count) ?? []).map(d => (
                <button
                  key={d.id}
                  onClick={() => onSelect(d.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-blue-600/40 border border-gray-600 hover:border-blue-500 rounded-lg text-sm text-left"
                >
                  <span className="text-gray-200">{d.name}</span>
                  {count > 0 && (
                    <span className="text-xs text-gray-400 font-mono bg-gray-800 px-1.5 py-0.5 rounded">
                      ×{count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
