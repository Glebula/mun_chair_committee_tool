import { StoreContext } from './store/StoreContext';
import { useAppStore } from './store/useAppStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import TopBar from './components/TopBar';
import SideNav from './components/SideNav';
import ModeSelect from './views/ModeSelect';
import RollCall from './views/RollCall';
import GSLView from './views/GSLView';
import ModeratedCaucusView from './views/ModeratedCaucusView';
import UnmodView from './views/UnmodView';
import RoundRobinView from './views/RoundRobinView';
import MotionsView from './views/MotionsView';
import VotingProcedureView from './views/VotingProcedureView';
import WorkingPapersView from './views/WorkingPapersView';
import DelegateRosterView from './views/DelegateRosterView';
import SuspendedView from './views/SuspendedView';

function AppContent() {
  const store = useAppStore();
  useKeyboardShortcuts(store);

  const { state } = store;
  const isLight = state.theme === 'light';

  function renderView() {
    switch (state.sessionState) {
      case 'ModeSelect':        return <ModeSelect />;
      case 'RollCall':          return <RollCall />;
      case 'GSL':               return <GSLView />;
      case 'ModeratedCaucus':   return <ModeratedCaucusView />;
      case 'UnmoderatedCaucus': return <UnmodView type="UnmoderatedCaucus" />;
      case 'GentlemansUnmod':   return <UnmodView type="GentlemansUnmod" />;
      case 'RoundRobin':        return <RoundRobinView />;
      case 'Motions':           return <MotionsView />;
      case 'VotingProcedure':   return <VotingProcedureView />;
      case 'WorkingPapers':     return <WorkingPapersView />;
      case 'DelegateRoster':    return <DelegateRosterView />;
      case 'Suspended':         return <SuspendedView />;
      default:                  return <ModeSelect />;
    }
  }

  const inSession = state.sessionState !== 'ModeSelect' && state.sessionState !== 'RollCall';

  return (
    <StoreContext.Provider value={store}>
      <div className={`min-h-screen flex flex-col ${isLight ? 'bg-gray-100 text-gray-900' : 'bg-gray-950 text-gray-100'}`}>
        {state.sessionState !== 'ModeSelect' && <TopBar />}

        <div className={`flex flex-1 ${inSession ? 'flex-row' : 'flex-col'}`}>
          {inSession && <SideNav />}
          <main className="flex-1 overflow-y-auto">
            {renderView()}
          </main>
        </div>

        {inSession && state.sessionState !== 'Suspended' && (
          <div className={`text-center text-xs py-1 px-4 border-t ${isLight ? 'bg-gray-200 border-gray-300 text-gray-500' : 'bg-gray-900 border-gray-800 text-gray-600'}`}>
            <kbd className="font-mono">Space</kbd> play/pause &nbsp;·&nbsp;
            <kbd className="font-mono">N</kbd> next speaker &nbsp;·&nbsp;
            <kbd className="font-mono">R</kbd> reset timer
          </div>
        )}
      </div>
    </StoreContext.Provider>
  );
}

export default function App() {
  return <AppContent />;
}
