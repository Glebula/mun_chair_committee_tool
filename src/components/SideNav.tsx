import { useStore } from '../store/StoreContext';
import type { SessionState } from '../types';

interface NavItem {
  state: SessionState;
  label: string;
  crisis?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { state: 'RollCall', label: 'Roll Call' },
  { state: 'GSL', label: 'GSL' },
  { state: 'Motions', label: 'Motions' },
  { state: 'VotingProcedure', label: 'Voting' },
  { state: 'WorkingPapers', label: 'Papers' },
  { state: 'DelegateRoster', label: 'Roster' },
];

const CRISIS_ITEMS: NavItem[] = [
  { state: 'RoundRobin', label: 'Round Robin', crisis: true },
];

export default function SideNav() {
  const { state, setSessionState } = useStore();
  const isCrisis = state.mode === 'Crisis';

  const items = isCrisis ? [...NAV_ITEMS, ...CRISIS_ITEMS] : NAV_ITEMS;

  function isActive(s: SessionState) {
    return state.sessionState === s;
  }

  function nav(s: SessionState) {
    setSessionState(s);
  }

  return (
    <nav className="flex flex-row lg:flex-col gap-1 p-2 bg-gray-900 border-r border-gray-700 lg:w-36 shrink-0 overflow-x-auto lg:overflow-x-visible">
      {items.map(item => (
        <button
          key={item.state}
          onClick={() => nav(item.state)}
          className={`px-3 py-3 rounded-xl text-base font-semibold text-left min-h-[48px] whitespace-nowrap transition-colors ${
            isActive(item.state)
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          } ${item.crisis ? 'border border-amber-700/50' : ''}`}
        >
          {item.label}
        </button>
      ))}

      <div className="flex-1 hidden lg:block" />

      {/* Suspend */}
      <button
        onClick={() => nav(state.sessionState === 'Suspended' ? 'GSL' : 'Suspended')}
        className={`px-3 py-3 rounded-xl text-base font-semibold min-h-[48px] whitespace-nowrap ${
          state.sessionState === 'Suspended'
            ? 'bg-green-700 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        {state.sessionState === 'Suspended' ? 'Resume' : 'Suspend'}
      </button>
    </nav>
  );
}
