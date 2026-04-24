import { useState } from 'react';
import { useStore } from '../store/StoreContext';

type SortKey = 'name' | 'speechCount';

export default function DelegateRosterView() {
  const { presentDelegates } = useStore();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const sorted = [...presentDelegates].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    if (sortKey === 'name') return dir * a.name.localeCompare(b.name);
    return dir * (a.speechCount - b.speechCount);
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(key === 'name'); }
  }

  const selectedDelegate = selected ? sorted.find(d => d.id === selected) : null;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-3xl font-bold">Delegate Roster</h2>
        <div className="text-gray-400">{presentDelegates.length} present</div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => toggleSort('name')}
          className={`px-4 py-2 rounded-xl text-base font-semibold ${sortKey === 'name' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          Name {sortKey === 'name' ? (sortAsc ? '↑' : '↓') : ''}
        </button>
        <button
          onClick={() => toggleSort('speechCount')}
          className={`px-4 py-2 rounded-xl text-base font-semibold ${sortKey === 'speechCount' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          Speeches {sortKey === 'speechCount' ? (sortAsc ? '↑' : '↓') : ''}
        </button>
      </div>

      {selected && selectedDelegate && (
        <div className="bg-gray-800/60 border border-blue-600 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-white">{selectedDelegate.name}</div>
            <div className="text-gray-400 mt-1">
              Status: <span className={selectedDelegate.attendance === 'Present & Voting' ? 'text-blue-300' : 'text-green-300'}>{selectedDelegate.attendance}</span>
            </div>
            <div className="text-gray-400">
              Total speeches: <strong className="text-white text-xl">{selectedDelegate.speechCount}</strong>
            </div>
          </div>
          <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
      )}

      <div className="flex flex-col gap-1 overflow-y-auto max-h-[60vh]">
        {sorted.map(d => (
          <button
            key={d.id}
            onClick={() => setSelected(d.id === selected ? null : d.id)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${
              d.id === selected
                ? 'border-blue-500 bg-blue-500/15'
                : 'border-gray-700 bg-gray-800/40 hover:bg-gray-700/60'
            }`}
          >
            <span className="text-lg text-gray-200">{d.name}</span>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-semibold px-2 py-1 rounded ${
                d.attendance === 'Present & Voting' ? 'bg-blue-900/40 text-blue-300' : 'bg-green-900/40 text-green-300'
              }`}>
                {d.attendance === 'Present & Voting' ? 'P&V' : 'P'}
              </span>
              <span className="text-gray-300 font-mono w-8 text-right">
                {d.speechCount > 0 ? `×${d.speechCount}` : '—'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
