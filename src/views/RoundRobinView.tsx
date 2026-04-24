import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store/StoreContext';
import Timer from '../components/Timer';
import type { RoundRobinParticipant } from '../types';

function SortableParticipant({
  entry, index, isCurrent, name, onRemove,
}: {
  entry: RoundRobinParticipant;
  index: number;
  isCurrent: boolean;
  name: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: entry.entryId });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${
        isCurrent ? 'border-blue-500 bg-blue-500/15' : 'border-gray-700 bg-gray-800/50'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-500 hover:text-gray-300 text-xl select-none px-1"
      >⠿</div>
      <span className={`flex-1 text-lg font-semibold ${isCurrent ? 'text-blue-200' : 'text-gray-200'}`}>
        {index + 1}. {name}
      </span>
      <button
        onClick={onRemove}
        className="text-gray-500 hover:text-red-400 text-xl font-bold px-2"
      >×</button>
    </div>
  );
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function RoundRobinView() {
  const { state, rrSetup, rrStart, rrSetRunning, rrTick, rrNext, rrReset,
    incrementSpeechCount, presentDelegates } = useStore();
  const { roundRobin: rr } = state;

  const [setupMode, setSetupMode] = useState(!rr.started);
  const [speakSec, setSpeakSec] = useState(String(rr.speakingTimeSecs));
  const [participants, setParticipants] = useState<RoundRobinParticipant[]>(rr.participants);
  const [addSearch, setAddSearch] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const tickCb = useCallback(() => rrTick(), [rrTick]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = participants.findIndex(p => p.entryId === active.id);
    const newIdx = participants.findIndex(p => p.entryId === over.id);
    setParticipants(arrayMove(participants, oldIdx, newIdx));
  }

  function addParticipant(delegateId: string) {
    setParticipants(prev => [...prev, { delegateId, entryId: uid() }]);
  }

  function removeParticipant(entryId: string) {
    setParticipants(prev => prev.filter(p => p.entryId !== entryId));
  }

  function handleStart() {
    const secs = parseInt(speakSec, 10) || 60;
    rrSetup(participants, secs);
    rrStart();
    setSetupMode(false);
  }

  function handleNext() {
    const current = rr.participants[rr.currentIndex];
    if (current) incrementSpeechCount(current.delegateId);
    rrNext();
  }

  const expired = rr.timerRemaining <= 0 && rr.started;
  const currentEntry = rr.participants[rr.currentIndex];
  const currentDelegate = currentEntry
    ? presentDelegates.find(d => d.id === currentEntry.delegateId)
    : null;

  const filteredDelegates = presentDelegates.filter(d =>
    d.name.toLowerCase().includes(addSearch.toLowerCase()) &&
    !participants.some(p => p.delegateId === d.id)
  );

  if (setupMode) {
    return (
      <div className="flex flex-col gap-5 p-6 max-w-2xl mx-auto w-full">
        <h2 className="text-3xl font-bold">Round Robin Setup</h2>

        <div>
          <label className="block text-gray-400 mb-1 text-lg">Speaking Time (sec)</label>
          <input
            className="w-32 bg-gray-800 border border-gray-600 rounded-xl px-3 py-3 text-white text-xl text-center focus:outline-none focus:border-blue-400"
            value={speakSec}
            onChange={e => setSpeakSec(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2 text-lg">Add Participants</label>
          <input
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 mb-2"
            placeholder="Search delegates..."
            value={addSearch}
            onChange={e => setAddSearch(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
            {filteredDelegates.map(d => (
              <button
                key={d.id}
                onClick={() => addParticipant(d.id)}
                className="px-3 py-2 bg-gray-700 hover:bg-blue-600/40 border border-gray-600 hover:border-blue-500 rounded-lg text-gray-200 text-sm"
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {participants.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={participants.map(p => p.entryId)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                <div className="text-gray-400 text-base mb-1">Order (drag to reorder):</div>
                {participants.map((p, i) => {
                  const d = presentDelegates.find(x => x.id === p.delegateId);
                  return (
                    <SortableParticipant
                      key={p.entryId}
                      entry={p}
                      index={i}
                      isCurrent={false}
                      name={d?.name ?? '(unknown)'}
                      onRemove={() => removeParticipant(p.entryId)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <button
          onClick={handleStart}
          disabled={participants.length === 0}
          className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xl font-bold"
        >
          Start Round Robin ({participants.length} speakers)
        </button>
      </div>
    );
  }

  if (rr.complete) {
    return (
      <div className="flex flex-col items-center gap-6 p-8 max-w-md mx-auto">
        <h2 className="text-3xl font-bold">Round Robin Complete</h2>
        <div className="text-xl text-gray-400">All {rr.participants.length} speakers have gone.</div>
        <button
          onClick={() => { rrReset(); setSetupMode(true); setParticipants([]); }}
          className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold"
        >
          New Round Robin
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-3xl font-bold">Round Robin</h2>
        <div className="text-gray-400 text-lg">
          {rr.currentIndex + 1} / {rr.participants.length}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 bg-gray-800/60 rounded-2xl p-6">
        <div className="text-xl text-gray-400 font-medium">Current Speaker</div>
        <div className="text-3xl font-bold text-white min-h-[40px]">
          {currentDelegate?.name ?? <span className="text-gray-500">—</span>}
        </div>

        <Timer
          remaining={rr.timerRemaining}
          total={rr.speakingTimeSecs}
          running={rr.timerRunning}
          onTick={tickCb}
          size="large"
        />

        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => rrSetRunning(!rr.timerRunning)}
            className="px-6 py-3 rounded-xl text-xl font-bold bg-blue-600 hover:bg-blue-500 text-white min-w-[120px]"
          >
            {rr.timerRunning ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={handleNext}
            className={`px-6 py-3 rounded-xl text-xl font-bold ${
              expired
                ? 'bg-yellow-500 hover:bg-yellow-400 text-black animate-pulse'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Ordered list */}
      <div className="flex flex-col gap-2">
        {rr.participants.map((p, i) => {
          const d = presentDelegates.find(x => x.id === p.delegateId);
          return (
            <div
              key={p.entryId}
              className={`flex items-center px-4 py-3 rounded-xl border-2 ${
                i === rr.currentIndex
                  ? 'border-blue-500 bg-blue-500/15'
                  : i < rr.currentIndex
                  ? 'border-gray-800 bg-gray-800/20 opacity-50'
                  : 'border-gray-700 bg-gray-800/40'
              }`}
            >
              <span className={`text-lg font-semibold ${i === rr.currentIndex ? 'text-blue-200' : 'text-gray-300'}`}>
                {i + 1}. {d?.name ?? '(unknown)'}
              </span>
              {i < rr.currentIndex && <span className="ml-auto text-green-400 text-sm">✓ done</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
