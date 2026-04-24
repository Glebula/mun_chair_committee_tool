import { useStore } from '../store/StoreContext';

export default function ModeSelect() {
  const { selectMode } = useStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-3">BridgeMUN</h1>
        <p className="text-2xl text-gray-400">Committee Manager</p>
      </div>

      <p className="text-xl text-gray-400">Select committee mode to begin</p>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl">
        <button
          onClick={() => selectMode('GA')}
          className="flex-1 py-8 rounded-2xl text-3xl font-bold border-2 border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 transition-colors min-h-[120px]"
        >
          General Assembly
          <div className="text-base font-normal text-blue-400 mt-2">193 UN Member States</div>
        </button>
        <button
          onClick={() => selectMode('Crisis')}
          className="flex-1 py-8 rounded-2xl text-3xl font-bold border-2 border-amber-500 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors min-h-[120px]"
        >
          Crisis
          <div className="text-base font-normal text-amber-400 mt-2">Custom delegates / characters</div>
        </button>
      </div>
    </div>
  );
}
