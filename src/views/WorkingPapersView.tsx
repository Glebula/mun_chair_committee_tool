import { useStore } from '../store/StoreContext';
import type { WorkingPaperStatus } from '../types';

const STATUSES: WorkingPaperStatus[] = ['Introduced', 'In Discussion', 'Voted On', 'Passed', 'Failed'];

function statusColor(s: WorkingPaperStatus) {
  if (s === 'Passed') return 'text-green-400';
  if (s === 'Failed') return 'text-red-400';
  if (s === 'Voted On') return 'text-yellow-400';
  if (s === 'In Discussion') return 'text-blue-300';
  return 'text-gray-400';
}

export default function WorkingPapersView() {
  const { state, addWorkingPaper, updateWorkingPaper, removeWorkingPaper } = useStore();

  return (
    <div className="flex flex-col gap-5 p-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-3xl font-bold">Papers / Resolutions</h2>
        <button
          onClick={addWorkingPaper}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-lg font-bold"
        >
          + Add Paper
        </button>
      </div>

      {state.workingPapers.length === 0 ? (
        <div className="text-center text-gray-500 text-xl py-8">No working papers yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {state.workingPapers.map(wp => {
            const vr = wp.votingRecordId ? state.votingRecords.find(v => v.id === wp.votingRecordId) : null;
            return (
              <div key={wp.id} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex gap-3 flex-wrap items-start">
                  <input
                    className="w-28 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-lg font-mono focus:outline-none focus:border-blue-400"
                    value={wp.number}
                    onChange={e => updateWorkingPaper(wp.id, { number: e.target.value })}
                    placeholder="WP 1.1"
                  />
                  <input
                    className="flex-1 min-w-48 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-lg focus:outline-none focus:border-blue-400"
                    value={wp.title}
                    onChange={e => updateWorkingPaper(wp.id, { title: e.target.value })}
                    placeholder="Title / topic..."
                  />
                  <select
                    value={wp.status}
                    onChange={e => updateWorkingPaper(wp.id, { status: e.target.value as WorkingPaperStatus })}
                    className={`bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-lg font-semibold focus:outline-none ${statusColor(wp.status)}`}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={() => removeWorkingPaper(wp.id)}
                    className="px-3 py-2 bg-red-900/30 border border-red-700 text-red-400 rounded-lg hover:bg-red-900/50 text-lg"
                  >
                    ✕
                  </button>
                </div>
                {vr && (
                  <div className="text-sm text-gray-400">
                    Voted: For {vr.forVotes} · Against {vr.againstVotes} · Abstain {vr.abstainVotes}
                    <span className={`ml-2 font-semibold ${vr.result === 'Pass' ? 'text-green-400' : 'text-red-400'}`}>
                      {vr.result}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
