import { useState, useCallback } from 'react';
import { useStore } from '../store/StoreContext';
import Timer from '../components/Timer';

interface UnmodViewProps {
  type: 'UnmoderatedCaucus' | 'GentlemansUnmod';
}

export default function UnmodView({ type }: UnmodViewProps) {
  const { state, startUnmod, unmodSetRunning, unmodTick, unmodEnd } = useStore();
  const { unmod } = state;

  const isGentlemans = type === 'GentlemansUnmod';
  const defaultSecs = isGentlemans ? 30 : 300;

  const [setup, setSetup] = useState(
    state.sessionState !== type || unmod.remaining === unmod.totalTimeSecs && !unmod.running
  );
  const [totalMin, setTotalMin] = useState(String(Math.floor(defaultSecs / 60)));
  const [totalSec, setTotalSec] = useState(String(defaultSecs % 60));

  const totalTimeSecs = (parseInt(totalMin, 10) || 0) * 60 + (parseInt(totalSec, 10) || 0);

  const tickCb = useCallback(() => unmodTick(), [unmodTick]);

  function handleStart() {
    startUnmod(totalTimeSecs, type);
    setSetup(false);
  }

  const expired = unmod.remaining <= 0 && !setup;
  const label = isGentlemans ? "Gentleman's Unmod" : 'Unmoderated Caucus';

  if (setup) {
    return (
      <div className="flex flex-col gap-5 p-6 max-w-md mx-auto w-full">
        <h2 className="text-3xl font-bold">{label}</h2>

        <div>
          <label className="block text-gray-400 mb-1 text-lg">Total Time</label>
          <div className="flex gap-2 items-center">
            <input
              className="w-24 bg-gray-800 border border-gray-600 rounded-xl px-3 py-3 text-white text-xl text-center focus:outline-none focus:border-blue-400"
              placeholder="min"
              value={totalMin}
              onChange={e => setTotalMin(e.target.value)}
            />
            <span className="text-gray-400 text-xl">:</span>
            <input
              className="w-24 bg-gray-800 border border-gray-600 rounded-xl px-3 py-3 text-white text-xl text-center focus:outline-none focus:border-blue-400"
              placeholder="sec"
              value={totalSec}
              onChange={e => setTotalSec(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={totalTimeSecs <= 0}
          className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xl font-bold"
        >
          Start {label}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 p-6 max-w-md mx-auto w-full">
      <h2 className="text-3xl font-bold self-start">{label}</h2>

      {expired ? (
        <div className="text-2xl font-bold text-red-400 bg-red-900/20 rounded-xl border border-red-700 px-6 py-4 w-full text-center timer-expired">
          Time Expired
        </div>
      ) : null}

      <Timer
        remaining={unmod.remaining}
        total={unmod.totalTimeSecs}
        running={unmod.running}
        onTick={tickCb}
        size="large"
      />

      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={() => unmodSetRunning(!unmod.running)}
          disabled={expired}
          className="px-8 py-4 rounded-xl text-2xl font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white min-w-[140px]"
        >
          {unmod.running ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={() => setSetup(true)}
          className="px-5 py-4 rounded-xl text-xl font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200"
        >
          Reset
        </button>
      </div>

      {(expired) && (
        <button
          onClick={() => unmodEnd()}
          className="px-8 py-4 rounded-xl text-xl font-bold bg-green-700 hover:bg-green-600 text-white w-full"
        >
          Return to Session
        </button>
      )}
    </div>
  );
}
