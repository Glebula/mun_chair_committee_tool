import { useStore } from '../store/StoreContext';

export default function SuspendedView() {
  const { setSessionState } = useStore();
  return (
    <div className="flex flex-col items-center justify-center gap-8 min-h-[60vh]">
      <div className="text-5xl font-bold text-gray-500">Session Suspended</div>
      <button
        onClick={() => setSessionState('GSL')}
        className="px-10 py-5 rounded-2xl bg-green-700 hover:bg-green-600 text-white text-3xl font-bold"
      >
        Resume Session
      </button>
    </div>
  );
}
