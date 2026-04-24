import { useState, useCallback } from 'react';
import { useStore } from '../store/StoreContext';
import Timer from '../components/Timer';

export default function ModeratedCaucusView() {
  const store = useStore();
  const { state, modSetup, modSelectSpeaker, modSetRunning, modTick, modResetSpeaker,
    incrementSpeechCount, presentDelegates } = store;
  const mc = state.modCaucus;

  const [setup, setSetup] = useState(!mc.started);
  const [topic, setTopic] = useState(mc.topic);
  const [totalMin, setTotalMin] = useState(String(Math.floor(mc.totalTimeSecs / 60)));
  const [totalSec, setTotalSec] = useState(String(mc.totalTimeSecs % 60));
  const [speakSec, setSpeakSec] = useState(String(mc.speakingTimeSecs));
  const [speakerSearch, setSpeakerSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const totalTimeSecs = (parseInt(totalMin, 10) || 0) * 60 + (parseInt(totalSec, 10) || 0);
  const speakingTimeSecs = parseInt(speakSec, 10) || 60;
  const maxSpeakers = speakingTimeSecs > 0 ? Math.floor(totalTimeSecs / speakingTimeSecs) : 0;

  const modTotalTick = useCallback(() => modTick(), [modTick]);

  function handleStart() {
    modSetup(topic, totalTimeSecs, speakingTimeSecs);
    setSetup(false);
  }

  function handleSelectSpeaker(id: string) {
    if (mc.currentSpeakerId) incrementSpeechCount(mc.currentSpeakerId);
    modSelectSpeaker(id);
    modSetRunning(true, true);
    setShowPicker(false);
    setSpeakerSearch('');
  }

  const expired = mc.totalRemaining <= 0;
  const speakerExpired = mc.speakerRemaining <= 0;

  const currentDelegate = mc.currentSpeakerId
    ? presentDelegates.find(d => d.id === mc.currentSpeakerId)
    : null;

  const filteredDelegates = presentDelegates.filter(d =>
    d.name.toLowerCase().includes(speakerSearch.toLowerCase())
  );

  if (setup) {
    return (
      <div className="flex flex-col gap-5 p-6 max-w-xl mx-auto w-full">
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
                placeholder="min"
                value={totalMin}
                onChange={e => setTotalMin(e.target.value)}
              />
              <span className="text-gray-400 text-xl">:</span>
              <input
                className="w-20 bg-gray-800 border border-gray-600 rounded-xl px-3 py-3 text-white text-xl text-center focus:outline-none focus:border-blue-400"
                placeholder="sec"
                value={totalSec}
                onChange={e => setTotalSec(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-gray-400 mb-1 text-lg">Speaking Time (sec)</label>
            <input
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-3 text-white text-xl text-center focus:outline-none focus:border-blue-400"
              placeholder="60"
              value={speakSec}
              onChange={e => setSpeakSec(e.target.value)}
            />
          </div>
        </div>

        {totalTimeSecs > 0 && speakingTimeSecs > 0 && (
          <div className="text-gray-400 text-lg">
            Max speakers: <strong className="text-white">{maxSpeakers}</strong>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={totalTimeSecs <= 0}
          className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xl font-bold"
        >
          Start Caucus
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold">Moderated Caucus</h2>
          {mc.topic && <div className="text-xl text-gray-300 mt-1">{mc.topic}</div>}
        </div>
        <button
          onClick={() => setSetup(true)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-300 text-base"
        >
          Edit Setup
        </button>
      </div>

      {/* Overall timer (smaller) */}
      <div className="bg-gray-800/40 rounded-xl px-4 py-3">
        <Timer
          remaining={mc.totalRemaining}
          total={mc.totalTimeSecs}
          running={mc.totalRunning}
          onTick={modTotalTick}
          size="medium"
          label="Caucus Remaining"
        />
      </div>

      {expired && (
        <div className="text-center py-4 text-2xl font-bold text-red-400 bg-red-900/20 rounded-xl border border-red-700">
          Caucus time expired
        </div>
      )}

      {/* Current speaker + individual timer */}
      <div className="flex flex-col items-center gap-4 bg-gray-800/60 rounded-2xl p-6">
        <div className="text-xl text-gray-400 font-medium">Current Speaker</div>
        <div className="text-3xl font-bold text-white min-h-[40px]">
          {currentDelegate?.name ?? <span className="text-gray-500">None selected</span>}
        </div>

        <Timer
          remaining={mc.speakerRemaining}
          total={mc.speakingTimeSecs}
          running={mc.speakerRunning}
          onTick={modTotalTick}
          size="large"
        />

        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => modSetRunning(mc.totalRunning, !mc.speakerRunning)}
            disabled={!mc.currentSpeakerId}
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
            onClick={() => { setShowPicker(v => !v); setSpeakerSearch(''); }}
            disabled={expired}
            className={`px-6 py-3 rounded-xl text-xl font-bold text-white ${
              speakerExpired
                ? 'bg-yellow-500 hover:bg-yellow-400 text-black animate-pulse'
                : 'bg-green-700 hover:bg-green-600 disabled:opacity-40'
            }`}
          >
            {speakerExpired ? 'Next Speaker →' : 'Select Speaker'}
          </button>
        </div>

        {showPicker && (
          <div className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 flex flex-col gap-2">
            <input
              autoFocus
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              placeholder="Search..."
              value={speakerSearch}
              onChange={e => setSpeakerSearch(e.target.value)}
            />
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {filteredDelegates.map(d => (
                <button
                  key={d.id}
                  onClick={() => handleSelectSpeaker(d.id)}
                  className="px-3 py-2 bg-gray-700 hover:bg-blue-600/40 border border-gray-600 hover:border-blue-500 rounded-lg text-gray-200 text-sm"
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
