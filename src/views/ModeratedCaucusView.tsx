import { useState, useCallback } from 'react';
import { useStore } from '../store/StoreContext';
import Timer from '../components/Timer';

export default function ModeratedCaucusView() {
  const store = useStore();
  const { state, modSetup, modAddSpeaker, modRemoveSpeaker, modStart,
    modSetRunning, modTick, modNextSpeaker, modResetSpeaker,
    incrementSpeechCount, presentDelegates } = store;
  const mc = state.modCaucus;

  const [setup, setSetup] = useState(!mc.started && mc.speakers.length === 0);
  const [topic, setTopic] = useState(mc.topic);
  const [totalMin, setTotalMin] = useState(String(Math.floor(mc.totalTimeSecs / 60)));
  const [totalSec, setTotalSec] = useState(String(mc.totalTimeSecs % 60));
  const [speakSec, setSpeakSec] = useState(String(mc.speakingTimeSecs));
  const [speakerSearch, setSpeakerSearch] = useState('');

  const totalTimeSecs = (parseInt(totalMin, 10) || 0) * 60 + (parseInt(totalSec, 10) || 0);
  const speakingTimeSecs = parseInt(speakSec, 10) || 60;
  const maxSpeakers = speakingTimeSecs > 0 ? Math.floor(totalTimeSecs / speakingTimeSecs) : 0;

  const tickCb = useCallback(() => modTick(), [modTick]);

  function handleSaveSetup() {
    modSetup(topic, totalTimeSecs, speakingTimeSecs, mc.speakers);
    setSetup(false);
  }

  function handleStartCaucus() {
    modStart();
  }

  function handleNextSpeaker() {
    const current = mc.speakers[mc.currentSpeakerIndex];
    if (current) incrementSpeechCount(current);
    modNextSpeaker();
  }

  const currentDelegateId = mc.speakers[mc.currentSpeakerIndex];
  const currentDelegate = currentDelegateId
    ? presentDelegates.find(d => d.id === currentDelegateId)
    : null;

  const speakerExpired = mc.speakerRemaining <= 0 && mc.started;
  const totalExpired = mc.totalRemaining <= 0;
  const allDone = mc.started && mc.currentSpeakerIndex >= mc.speakers.length;

  const filteredDelegates = presentDelegates.filter(d =>
    d.name.toLowerCase().includes(speakerSearch.toLowerCase())
  );

  // ── Setup screen ──────────────────────────────────────────────────
  if (setup) {
    return (
      <div className="flex flex-col gap-5 p-6 max-w-2xl mx-auto w-full">
        <h2 className="text-3xl font-bold">Moderated Caucus Setup</h2>

        <div>
          <label className="block text-gray-400 mb-1 text-lg">Topic</label>
          <input
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-xl focus:outline-none focus:border-blue-400"
            placeholder="Topic..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-gray-400 mb-1 text-lg">Total Time</label>
            <div className="flex gap-2 items-center">
              <input
                className="w-20 bg-gray-800 border border-gray-600 rounded-xl px-3 py-3 text-white text-xl text-center focus:outline-none focus:border-blue-400"
                placeholder="min" value={totalMin} onChange={e => setTotalMin(e.target.value)}
              />
              <span className="text-gray-400 text-xl">:</span>
              <input
                className="w-20 bg-gray-800 border border-gray-600 rounded-xl px-3 py-3 text-white text-xl text-center focus:outline-none focus:border-blue-400"
                placeholder="sec" value={totalSec} onChange={e => setTotalSec(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-gray-400 mb-1 text-lg">Speaking Time (sec)</label>
            <input
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-3 text-white text-xl text-center focus:outline-none focus:border-blue-400"
              placeholder="60" value={speakSec} onChange={e => setSpeakSec(e.target.value)}
            />
          </div>
        </div>

        {totalTimeSecs > 0 && speakingTimeSecs > 0 && (
          <div className="text-gray-400 text-base">
            Max speakers: <strong className="text-white">{maxSpeakers}</strong>
          </div>
        )}

        <button
          onClick={handleSaveSetup}
          disabled={totalTimeSecs <= 0}
          className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xl font-bold"
        >
          Save & Add Speakers
        </button>
      </div>
    );
  }

  // ── Speaker selection / pre-start screen ─────────────────────────
  if (!mc.started) {
    return (
      <div className="flex flex-col gap-5 p-4 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-3xl font-bold">Moderated Caucus</h2>
            {mc.topic && <div className="text-xl text-gray-300 mt-1">{mc.topic}</div>}
            <div className="text-gray-400 mt-1">
              Total: {Math.floor(mc.totalTimeSecs / 60)}:{String(mc.totalTimeSecs % 60).padStart(2, '0')} &nbsp;·&nbsp;
              {mc.speakingTimeSecs}s per speaker &nbsp;·&nbsp;
              Max {maxSpeakers} speakers
            </div>
          </div>
          <button onClick={() => setSetup(true)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-300 text-base">
            Edit Setup
          </button>
        </div>

        {/* Add speakers */}
        <div>
          <label className="block text-gray-400 mb-2 text-lg">Add Speakers ({mc.speakers.length} / {maxSpeakers})</label>
          <input
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 mb-2"
            placeholder="Search delegates..."
            value={speakerSearch}
            onChange={e => setSpeakerSearch(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {filteredDelegates.map(d => (
              <button
                key={d.id}
                onClick={() => { modAddSpeaker(d.id); setSpeakerSearch(''); }}
                className="px-3 py-2 bg-gray-700 hover:bg-blue-600/40 border border-gray-600 hover:border-blue-500 rounded-lg text-gray-200 text-sm"
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* Ordered speaker list */}
        {mc.speakers.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-gray-400 text-base">Speaker order:</div>
            {mc.speakers.map((id, i) => {
              const d = presentDelegates.find(x => x.id === id);
              return (
                <div key={`${id}-${i}`} className="flex items-center gap-3 px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl">
                  <span className="text-gray-500 w-6 text-right shrink-0">{i + 1}.</span>
                  <span className="flex-1 text-lg text-gray-200">{d?.name ?? '(unknown)'}</span>
                  <button
                    onClick={() => modRemoveSpeaker(i)}
                    className="text-gray-500 hover:text-red-400 text-xl font-bold px-2"
                  >×</button>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={handleStartCaucus}
          disabled={mc.speakers.length === 0}
          className="w-full py-4 rounded-xl bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-xl font-bold mt-2"
        >
          Start Caucus ({mc.speakers.length} speakers)
        </button>
      </div>
    );
  }

  // ── Active caucus ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 p-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold">Moderated Caucus</h2>
          {mc.topic && <div className="text-xl text-gray-300 mt-1">{mc.topic}</div>}
        </div>
        <button onClick={() => setSetup(true)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-300 text-base">
          Edit Setup
        </button>
      </div>

      {/* Overall timer */}
      <div className={`bg-gray-800/40 rounded-xl px-4 py-3 ${totalExpired ? 'border border-red-700 bg-red-900/10' : ''}`}>
        <Timer
          remaining={mc.totalRemaining}
          total={mc.totalTimeSecs}
          running={mc.speakerRunning}
          onTick={tickCb}
          size="medium"
          label="Caucus Remaining"
        />
        {totalExpired && (
          <div className="text-center text-red-400 font-bold text-xl mt-2 timer-expired">Caucus time expired</div>
        )}
      </div>

      {allDone ? (
        <div className="text-center py-6 text-2xl font-bold text-green-400 bg-green-900/20 rounded-xl border border-green-700">
          All speakers have gone
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 bg-gray-800/60 rounded-2xl p-6">
          <div className="text-xl text-gray-400 font-medium">
            Speaker {mc.currentSpeakerIndex + 1} of {mc.speakers.length}
          </div>
          <div className="text-3xl font-bold text-white min-h-[40px]">
            {currentDelegate?.name ?? <span className="text-gray-500">—</span>}
          </div>

          <Timer
            remaining={mc.speakerRemaining}
            total={mc.speakingTimeSecs}
            running={mc.speakerRunning}
            onTick={tickCb}
            size="large"
          />

          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => modSetRunning(!mc.speakerRunning)}
              disabled={totalExpired}
              className="px-6 py-3 rounded-xl text-xl font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white min-w-[120px]"
            >
              {mc.speakerRunning ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={modResetSpeaker}
              className="px-5 py-3 rounded-xl text-xl font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200"
            >
              Reset
            </button>
            <button
              onClick={handleNextSpeaker}
              disabled={mc.currentSpeakerIndex >= mc.speakers.length - 1 && !speakerExpired}
              className={`px-6 py-3 rounded-xl text-xl font-bold min-w-[160px] ${
                speakerExpired
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-black animate-pulse'
                  : 'bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200'
              }`}
            >
              Next Speaker →
            </button>
          </div>
        </div>
      )}

      {/* Speaker queue */}
      <div className="flex flex-col gap-2">
        {mc.speakers.map((id, i) => {
          const d = presentDelegates.find(x => x.id === id);
          return (
            <div
              key={`${id}-${i}`}
              className={`flex items-center px-4 py-3 rounded-xl border-2 ${
                i === mc.currentSpeakerIndex && !allDone
                  ? 'border-blue-500 bg-blue-500/15'
                  : i < mc.currentSpeakerIndex
                  ? 'border-gray-800 bg-gray-800/20 opacity-50'
                  : 'border-gray-700 bg-gray-800/40'
              }`}
            >
              <span className={`text-lg font-semibold ${i === mc.currentSpeakerIndex && !allDone ? 'text-blue-200' : 'text-gray-300'}`}>
                {i + 1}. {d?.name ?? '(unknown)'}
              </span>
              {i < mc.currentSpeakerIndex && <span className="ml-auto text-green-400 text-sm">✓ done</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
