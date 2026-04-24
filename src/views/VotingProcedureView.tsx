import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import type { MajorityType } from '../types';

export default function VotingProcedureView() {
  const { addVotingRecord, state, presentCount } = useStore();

  const [name, setName] = useState('');
  const [forV, setForV] = useState('');
  const [agV, setAgV] = useState('');
  const [absV, setAbsV] = useState('');
  const [majType, setMajType] = useState<MajorityType>('simple');
  const [result, setResult] = useState<{ pass: boolean; name: string; for: number; against: number; abstain: number; needed: number } | null>(null);

  const pvCount = state.delegates.filter(d => d.attendance === 'Present & Voting').length;
  const { simpleMajority: sm, twoThirdsMajority: ttm } = (() => {
    const p = presentCount;
    return { simpleMajority: Math.floor(p / 2) + 1, twoThirdsMajority: Math.ceil((p * 2) / 3) };
  })();

  const forNum = parseInt(forV, 10) || 0;
  const agNum = parseInt(agV, 10) || 0;
  const absNum = parseInt(absV, 10) || 0;
  const totalVotes = forNum + agNum + absNum;
  const voteMismatch = totalVotes !== presentCount && (forNum + agNum + absNum) > 0;

  function calcResult(): { pass: boolean; needed: number } {
    if (majType === 'simple') {
      return { pass: forNum > agNum, needed: sm };
    } else {
      const relevant = forNum + agNum;
      const needed = Math.ceil((relevant * 2) / 3);
      return { pass: relevant > 0 && forNum >= needed, needed };
    }
  }

  function handleVote() {
    if (!name.trim()) return;
    const { pass, needed } = calcResult();
    addVotingRecord(name, forNum, agNum, absNum, majType);
    setResult({ pass, name, for: forNum, against: agNum, abstain: absNum, needed });
    setName('');
    setForV('');
    setAgV('');
    setAbsV('');
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto w-full">
      <h2 className="text-3xl font-bold">Voting Procedure</h2>

      {pvCount > 0 && (
        <div className="bg-amber-900/20 border border-amber-700 rounded-xl px-4 py-3 text-amber-300 text-base">
          Reminder: <strong>Present &amp; Voting</strong> delegates may not abstain. ({pvCount} P&amp;V delegates)
        </div>
      )}

      <div className="flex flex-col gap-4 bg-gray-800/60 border border-gray-700 rounded-xl p-5">
        <div>
          <label className="block text-gray-400 mb-1 text-lg">Resolution / Working Paper</label>
          <input
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-xl focus:outline-none focus:border-blue-400"
            placeholder="e.g. WP 1.1 or DR/1/Rev.2..."
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-gray-400 text-lg">Majority type:</span>
          <select
            value={majType}
            onChange={e => setMajType(e.target.value as MajorityType)}
            className="bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-white text-lg"
          >
            <option value="simple">Simple majority ({sm})</option>
            <option value="two-thirds">Two-thirds majority ({ttm})</option>
          </select>
        </div>

        {majType === 'two-thirds' && (
          <div className="text-sm text-gray-400 bg-gray-900/40 rounded-lg px-3 py-2">
            Two-thirds calculation excludes abstentions: 2/3 of (For + Against).
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-400 mb-1 text-lg text-center">For</label>
            <input
              className="w-full bg-gray-800 border border-green-700 rounded-xl px-3 py-4 text-white text-3xl text-center focus:outline-none focus:border-green-400"
              value={forV}
              onChange={e => setForV(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1 text-lg text-center">Against</label>
            <input
              className="w-full bg-gray-800 border border-red-700 rounded-xl px-3 py-4 text-white text-3xl text-center focus:outline-none focus:border-red-400"
              value={agV}
              onChange={e => setAgV(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1 text-lg text-center">Abstain</label>
            <input
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-4 text-white text-3xl text-center focus:outline-none focus:border-gray-400"
              value={absV}
              onChange={e => setAbsV(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {voteMismatch && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-xl px-4 py-2 text-yellow-300 text-base">
            ⚠ Total votes ({totalVotes}) ≠ delegates present ({presentCount})
          </div>
        )}

        <button
          onClick={handleVote}
          disabled={!name.trim()}
          className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xl font-bold"
        >
          Record Vote
        </button>
      </div>

      {/* Result display */}
      {result && (
        <div className={`rounded-2xl border-2 p-6 text-center ${
          result.pass ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'
        }`}>
          <div className="text-4xl font-bold mb-2 text-white">{result.name}</div>
          <div className={`text-5xl font-black mb-4 ${result.pass ? 'text-green-400' : 'text-red-400'}`}>
            {result.pass ? 'PASSED' : 'FAILED'}
          </div>
          <div className="flex justify-center gap-8 text-xl">
            <span className="text-green-300">For: <strong>{result.for}</strong></span>
            <span className="text-red-300">Against: <strong>{result.against}</strong></span>
            <span className="text-gray-300">Abstain: <strong>{result.abstain}</strong></span>
          </div>
          <div className="text-gray-400 mt-2">Needed: {result.needed}</div>
          <button onClick={() => setResult(null)} className="mt-4 px-5 py-2 bg-gray-700 rounded-xl text-gray-300 hover:bg-gray-600">
            New Vote
          </button>
        </div>
      )}

      {/* Voting history */}
      {state.votingRecords.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-3 text-gray-300">Voting History</h3>
          <div className="flex flex-col gap-2">
            {[...state.votingRecords].reverse().map(r => (
              <div key={r.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                r.result === 'Pass' ? 'border-green-700 bg-green-900/10' : 'border-red-800 bg-red-900/10'
              }`}>
                <span className="text-gray-200 font-medium">{r.name}</span>
                <div className="flex gap-3 text-sm text-gray-400">
                  <span className="text-green-300">✓ {r.forVotes}</span>
                  <span className="text-red-300">✗ {r.againstVotes}</span>
                  <span>abs {r.abstainVotes}</span>
                </div>
                <span className={`font-bold text-base ${r.result === 'Pass' ? 'text-green-400' : 'text-red-400'}`}>
                  {r.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
