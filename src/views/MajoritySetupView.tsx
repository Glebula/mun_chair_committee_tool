import { useStore } from '../store/StoreContext';
import type { MajorityType } from '../types';

export default function MajoritySetupView() {
  const { setDefaultMajorityType, setSessionState, simpleMajority, twoThirdsMajority, presentCount } = useStore();

  function choose(type: MajorityType) {
    setDefaultMajorityType(type);
    setSessionState('GSL');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 p-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-2">Default Majority Type</h2>
        <p className="text-xl text-gray-400">
          Choose the majority standard for this session.<br />
          You can change it at any time from the top bar.
        </p>
      </div>

      <div className="text-gray-400 text-lg">
        {presentCount} delegates present
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
        <button
          onClick={() => choose('simple')}
          className="flex-1 py-10 rounded-2xl text-2xl font-bold border-2 border-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 transition-colors"
        >
          Simple Majority
          <div className="text-base font-normal text-yellow-400 mt-3">
            More than half of votes cast
          </div>
          <div className="text-4xl font-black text-yellow-200 mt-2">
            {simpleMajority}
          </div>
          <div className="text-sm text-yellow-500 mt-1">votes needed</div>
        </button>

        <button
          onClick={() => choose('two-thirds')}
          className="flex-1 py-10 rounded-2xl text-2xl font-bold border-2 border-orange-500 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 transition-colors"
        >
          Two-Thirds Majority
          <div className="text-base font-normal text-orange-400 mt-3">
            At least 2/3 of votes cast
          </div>
          <div className="text-4xl font-black text-orange-200 mt-2">
            {twoThirdsMajority}
          </div>
          <div className="text-sm text-orange-500 mt-1">votes needed</div>
        </button>
      </div>
    </div>
  );
}
