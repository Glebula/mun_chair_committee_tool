import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import type { MotionType, MajorityType, Motion } from '../types';

const MOTION_TYPES: MotionType[] = [
  'Moderated Caucus', 'Unmoderated Caucus', "Gentleman's Unmod", 'Round Robin', 'Other',
];

function MotionCard({
  motion,
  delegateName,
  simpleMajority,
  twoThirdsMajority,
  onVote,
  onRemove,
  onStart,
}: {
  motion: Motion;
  delegateName: string;
  simpleMajority: number;
  twoThirdsMajority: number;
  onVote: (id: string, forV: number, agV: number, maj: MajorityType) => void;
  onRemove: (id: string) => void;
  onStart: (id: string) => void;
}) {
  const [voting, setVoting] = useState(false);
  const [forInput, setForInput] = useState('');
  const [agInput, setAgInput] = useState('');
  const [majType, setMajType] = useState<MajorityType>(motion.majorityType);

  function submitVote() {
    const f = parseInt(forInput, 10);
    const a = parseInt(agInput, 10);
    if (isNaN(f) || isNaN(a)) return;
    onVote(motion.id, f, a, majType);
    setVoting(false);
  }

  const threshold = majType === 'simple' ? simpleMajority : twoThirdsMajority;

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <span className="text-base font-bold text-blue-300 mr-2">{motion.type}</span>
          {motion.topic && <span className="text-gray-200 text-lg">— {motion.topic}</span>}
          {delegateName && <div className="text-sm text-gray-400 mt-1">Proposed by: {delegateName}</div>}
          <div className="text-sm text-gray-400 mt-1">
            {motion.totalTimeSecs > 0 && <span>Total: {Math.floor(motion.totalTimeSecs / 60)}:{String(motion.totalTimeSecs % 60).padStart(2, '0')} </span>}
            {motion.speakingTimeSecs > 0 && <span>· Speak: {motion.speakingTimeSecs}s</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {motion.result === null && (
            <button
              onClick={() => setVoting(v => !v)}
              className="px-3 py-2 bg-yellow-700/40 border border-yellow-600 text-yellow-300 rounded-lg text-base font-semibold hover:bg-yellow-700/60"
            >
              Vote
            </button>
          )}
          {motion.result === 'Pass' && (
            <button
              onClick={() => onStart(motion.id)}
              className="px-3 py-2 bg-green-700/40 border border-green-500 text-green-300 rounded-lg text-base font-semibold hover:bg-green-700/60"
            >
              Start ▶
            </button>
          )}
          <button
            onClick={() => onRemove(motion.id)}
            className="px-3 py-2 bg-red-900/30 border border-red-700 text-red-400 rounded-lg text-base hover:bg-red-900/50"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Result badge */}
      {motion.result && (
        <div className={`text-base font-bold px-3 py-1 rounded-lg w-fit ${
          motion.result === 'Pass' ? 'bg-green-800/40 text-green-300 border border-green-600' : 'bg-red-800/40 text-red-300 border border-red-600'
        }`}>
          {motion.result} — For: {motion.forVotes} · Against: {motion.againstVotes} · Needed: {threshold}
        </div>
      )}

      {/* Voting form */}
      {voting && (
        <div className="bg-gray-900/60 rounded-xl p-3 flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Majority:</span>
              <select
                value={majType}
                onChange={e => setMajType(e.target.value as MajorityType)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-white text-base"
              >
                <option value="simple">Simple ({simpleMajority})</option>
                <option value="two-thirds">2/3 ({twoThirdsMajority})</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-gray-400 text-sm mb-1">For</label>
              <input
                className="w-20 bg-gray-800 border border-gray-600 rounded-lg px-2 py-2 text-white text-xl text-center focus:outline-none focus:border-green-400"
                value={forInput}
                onChange={e => setForInput(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Against</label>
              <input
                className="w-20 bg-gray-800 border border-gray-600 rounded-lg px-2 py-2 text-white text-xl text-center focus:outline-none focus:border-red-400"
                value={agInput}
                onChange={e => setAgInput(e.target.value)}
                placeholder="0"
              />
            </div>
            <button
              onClick={submitVote}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold text-base"
            >
              Tally
            </button>
            <button
              onClick={() => setVoting(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-base"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MotionsView() {
  const { state, addMotion, removeMotion, voteMotion, startMotion, presentDelegates,
    simpleMajority, twoThirdsMajority } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [motionType, setMotionType] = useState<MotionType>('Moderated Caucus');
  const [topic, setTopic] = useState('');
  const [proposerId, setProposerId] = useState('');
  const [totalMin, setTotalMin] = useState('10');
  const [totalSec, setTotalSec] = useState('0');
  const [speakSec, setSpeakSec] = useState('60');
  const [majType, setMajType] = useState<MajorityType>(state.defaultMajorityType);

  const needsTimes = motionType !== 'Other';
  const needsSpeakTime = motionType === 'Moderated Caucus' || motionType === 'Round Robin';

  const totalTimeSecs = (parseInt(totalMin, 10) || 0) * 60 + (parseInt(totalSec, 10) || 0);
  const speakingTimeSecs = parseInt(speakSec, 10) || 0;
  const unevenSplit = needsSpeakTime && speakingTimeSecs > 0 && totalTimeSecs > 0 && totalTimeSecs % speakingTimeSecs !== 0;
  const maxSpeakers = needsSpeakTime && speakingTimeSecs > 0 ? Math.floor(totalTimeSecs / speakingTimeSecs) : null;

  function handleAdd() {
    if (unevenSplit) return;
    addMotion(motionType, proposerId || null, topic, totalTimeSecs, speakingTimeSecs, majType);
    setShowForm(false);
    setTopic('');
    setProposerId('');
  }

  function getDelegateName(id: string | null) {
    if (!id) return '';
    return presentDelegates.find(d => d.id === id)?.name ?? '';
  }

  return (
    <div className="flex flex-col gap-5 p-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-3xl font-bold">Motions Queue</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-lg font-bold"
        >
          + Add Motion
        </button>
      </div>

      {/* Add motion form */}
      {showForm && (
        <div className="bg-gray-800/60 border border-gray-600 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-40">
              <label className="block text-gray-400 mb-1">Type</label>
              <select
                value={motionType}
                onChange={e => setMotionType(e.target.value as MotionType)}
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-3 text-white text-lg focus:outline-none"
              >
                {MOTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-40">
              <label className="block text-gray-400 mb-1">Proposed by</label>
              <select
                value={proposerId}
                onChange={e => setProposerId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-3 text-white text-lg focus:outline-none"
              >
                <option value="">— select —</option>
                {presentDelegates.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-1">
              {motionType === 'Other' ? 'Motion description' : 'Topic'}
            </label>
            <input
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-3 text-white text-lg focus:outline-none focus:border-blue-400"
              placeholder={motionType === 'Other' ? 'e.g. Extend speakers time...' : 'Topic...'}
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>

          {needsTimes && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-4 flex-wrap">
                <div>
                  <label className="block text-gray-400 mb-1">Total Time (MM:SS)</label>
                  <div className="flex gap-2 items-center">
                    <input className="w-16 bg-gray-700 border border-gray-600 rounded-xl px-2 py-3 text-white text-xl text-center focus:outline-none" value={totalMin} onChange={e => setTotalMin(e.target.value)} placeholder="mm" />
                    <span className="text-gray-400">:</span>
                    <input className="w-16 bg-gray-700 border border-gray-600 rounded-xl px-2 py-3 text-white text-xl text-center focus:outline-none" value={totalSec} onChange={e => setTotalSec(e.target.value)} placeholder="ss" />
                  </div>
                </div>
                {needsSpeakTime && (
                  <div>
                    <label className="block text-gray-400 mb-1">Speaking Time (sec)</label>
                    <input className={`w-24 bg-gray-700 border rounded-xl px-3 py-3 text-white text-xl text-center focus:outline-none ${unevenSplit ? 'border-red-500' : 'border-gray-600'}`} value={speakSec} onChange={e => setSpeakSec(e.target.value)} />
                  </div>
                )}
              </div>
              {needsSpeakTime && maxSpeakers !== null && !unevenSplit && maxSpeakers > 0 && (
                <div className="text-gray-400 text-sm">Max speakers: <strong className="text-white">{maxSpeakers}</strong></div>
              )}
              {unevenSplit && (
                <div className="bg-red-900/40 border border-red-600 rounded-xl px-4 py-2 text-red-300 text-base">
                  {speakingTimeSecs}s doesn't divide evenly into {totalTimeSecs}s — adjust times so there's no leftover ({totalTimeSecs % speakingTimeSecs}s remainder).
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-gray-400">Majority:</span>
            <select
              value={majType}
              onChange={e => setMajType(e.target.value as MajorityType)}
              className="bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-white text-base"
            >
              <option value="simple">Simple ({simpleMajority})</option>
              <option value="two-thirds">2/3 ({twoThirdsMajority})</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button onClick={handleAdd} disabled={unevenSplit} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-lg font-bold">
              Add Motion
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-300 text-lg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {state.motions.length === 0 ? (
        <div className="text-center text-gray-500 text-xl py-8">No motions in queue.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {state.motions.map(m => (
            <MotionCard
              key={m.id}
              motion={m}
              delegateName={getDelegateName(m.proposerId)}
              simpleMajority={simpleMajority}
              twoThirdsMajority={twoThirdsMajority}
              onVote={voteMotion}
              onRemove={removeMotion}
              onStart={startMotion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
