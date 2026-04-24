import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import type { AttendanceStatus, Delegate } from '../types';

const CYCLE: AttendanceStatus[] = ['Absent', 'Present', 'Present & Voting'];

function statusColor(status: AttendanceStatus) {
  if (status === 'Present') return 'border-green-500 bg-green-500/15 text-green-300';
  if (status === 'Present & Voting') return 'border-blue-400 bg-blue-400/15 text-blue-200';
  return 'border-gray-600 bg-gray-800/50 text-gray-400';
}

function statusLabel(status: AttendanceStatus) {
  if (status === 'Present') return 'P';
  if (status === 'Present & Voting') return 'P&V';
  return '—';
}

export default function RollCall() {
  const { state, setAttendance, setSessionState, presentCount, simpleMajority, twoThirdsMajority, setCrisisDelegates } = useStore();
  const [search, setSearch] = useState('');
  const [crisisText, setCrisisText] = useState('');
  const [crisisInput, setCrisisInput] = useState('');
  const [setupDone, setSetupDone] = useState(state.mode === 'GA' || state.delegates.length > 0);

  const isCrisis = state.mode === 'Crisis';

  function cycleStatus(d: Delegate) {
    const idx = CYCLE.indexOf(d.attendance);
    setAttendance(d.id, CYCLE[(idx + 1) % CYCLE.length]);
  }

  function setAll(status: AttendanceStatus) {
    state.delegates.forEach(d => setAttendance(d.id, status));
  }

  function finishSetup() {
    const names = crisisText.split('\n').map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    setCrisisDelegates(names);
    setSetupDone(true);
  }

  function addSingle() {
    const name = crisisInput.trim();
    if (!name) return;
    setCrisisDelegates([...state.delegates.map(d => d.name), name]);
    setCrisisInput('');
  }

  function proceed() {
    setSessionState('GSL');
  }

  // Crisis setup screen
  if (isCrisis && !setupDone) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold">Crisis — Add Delegates</h2>

        <div className="flex gap-3">
          <input
            className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
            placeholder="Add one delegate..."
            value={crisisInput}
            onChange={e => setCrisisInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSingle()}
          />
          <button
            onClick={addSingle}
            className="px-5 py-3 rounded-xl bg-amber-500/20 border border-amber-500 text-amber-300 text-lg font-semibold hover:bg-amber-500/30"
          >
            Add
          </button>
        </div>

        {state.delegates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {state.delegates.map(d => (
              <span key={d.id} className="px-3 py-1 bg-gray-700 rounded-lg text-sm text-gray-200">{d.name}</span>
            ))}
          </div>
        )}

        <div className="text-gray-400 text-center">— or paste a list —</div>

        <textarea
          className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 h-40 resize-none"
          placeholder="One delegate per line..."
          value={crisisText}
          onChange={e => setCrisisText(e.target.value)}
        />

        <button
          onClick={finishSetup}
          className="w-full py-4 rounded-xl bg-amber-500 text-black text-xl font-bold hover:bg-amber-400"
        >
          Proceed to Roll Call
        </button>
      </div>
    );
  }

  const filtered = state.delegates.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const presentTotal = state.delegates.filter(d => d.attendance !== 'Absent').length;
  const pvTotal = state.delegates.filter(d => d.attendance === 'Present & Voting').length;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-3xl font-bold">Roll Call</h2>
        <div className="flex gap-3 text-lg font-semibold">
          <span className="text-green-400">{presentTotal} Present</span>
          <span className="text-blue-300">{pvTotal} P&amp;V</span>
        </div>
      </div>

      {/* Majority display */}
      <div className="flex gap-4 flex-wrap text-base text-gray-300 bg-gray-800/60 rounded-xl px-4 py-3">
        <span>Present: <strong className="text-white">{presentCount}</strong></span>
        <span>Simple Majority: <strong className="text-yellow-300">{simpleMajority}</strong></span>
        <span>2/3 Majority: <strong className="text-orange-300">{twoThirdsMajority}</strong></span>
      </div>

      {/* Search + bulk actions */}
      <div className="flex gap-3 flex-wrap">
        <input
          className="flex-1 min-w-48 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
          placeholder="Search delegates..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={() => setAll('Present')} className="px-4 py-3 rounded-xl bg-green-500/20 border border-green-500 text-green-300 text-base font-semibold hover:bg-green-500/30">All Present</button>
        <button onClick={() => setAll('Present & Voting')} className="px-4 py-3 rounded-xl bg-blue-500/20 border border-blue-400 text-blue-300 text-base font-semibold hover:bg-blue-500/30">All P&amp;V</button>
        <button onClick={() => setAll('Absent')} className="px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-gray-300 text-base font-semibold hover:bg-gray-600">All Absent</button>
      </div>

      {/* Delegate list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto max-h-[55vh]">
        {filtered.map(d => (
          <button
            key={d.id}
            onClick={() => cycleStatus(d)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-colors min-h-[52px] ${statusColor(d.attendance)}`}
          >
            <span className="text-base font-medium truncate">{d.name}</span>
            <span className="ml-2 text-sm font-bold shrink-0">{statusLabel(d.attendance)}</span>
          </button>
        ))}
      </div>

      <button
        onClick={proceed}
        disabled={presentCount === 0}
        className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xl font-bold mt-2"
      >
        Begin Session ({presentCount} present)
      </button>
    </div>
  );
}
