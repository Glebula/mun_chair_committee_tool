import { useStore } from '../store/StoreContext';
import type { SessionState } from '../types';

const STATE_LABELS: Record<SessionState, string> = {
  ModeSelect: 'Mode Select',
  RollCall: 'Roll Call',
  GSL: 'General Speakers\' List',
  ModeratedCaucus: 'Moderated Caucus',
  UnmoderatedCaucus: 'Unmoderated Caucus',
  GentlemansUnmod: "Gentleman's Unmod",
  RoundRobin: 'Round Robin',
  Motions: 'Motions',
  VotingProcedure: 'Voting Procedure',
  WorkingPapers: 'Papers / Resolutions',
  DelegateRoster: 'Delegate Roster',
  Suspended: 'Suspended',
};

export default function TopBar() {
  const { state, presentCount, simpleMajority, twoThirdsMajority, setTheme, resetSession } = useStore();

  const modeLabel = state.mode === 'GA' ? 'GA' : state.mode === 'Crisis' ? 'Crisis' : '';
  const stateLabel = STATE_LABELS[state.sessionState] ?? state.sessionState;

  const showTopic = ['ModeratedCaucus', 'GentlemansUnmod', 'RoundRobin'].includes(state.sessionState);

  return (
    <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-4 flex-wrap">
      {/* Mode badge */}
      {modeLabel && (
        <span className={`text-base font-bold px-3 py-1 rounded-lg ${state.mode === 'GA' ? 'bg-blue-600/30 text-blue-300' : 'bg-amber-600/30 text-amber-300'}`}>
          {modeLabel}
        </span>
      )}

      {/* Session state */}
      <span className="text-xl font-semibold text-white">{stateLabel}</span>

      {/* Topic */}
      {showTopic && state.topic && (
        <span className="text-lg text-gray-300 truncate max-w-xs">— {state.topic}</span>
      )}

      <div className="flex-1" />

      {/* Attendance stats */}
      {presentCount > 0 && (
        <div className="flex gap-4 text-base text-gray-300">
          <span>Present: <strong className="text-white">{presentCount}</strong></span>
          <span>Simp: <strong className="text-yellow-300">{simpleMajority}</strong></span>
          <span>2/3: <strong className="text-orange-300">{twoThirdsMajority}</strong></span>
        </div>
      )}

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
        className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-base min-h-[36px]"
        title="Toggle theme"
      >
        {state.theme === 'dark' ? '☀' : '☾'}
      </button>

      {/* Reset */}
      <button
        onClick={() => {
          if (confirm('Reset session? All data will be cleared.')) resetSession();
        }}
        className="px-3 py-1 rounded-lg bg-red-900/40 hover:bg-red-800/60 text-red-300 text-base border border-red-800 min-h-[36px]"
      >
        Reset
      </button>
    </div>
  );
}
