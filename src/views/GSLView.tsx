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
import type { GSLSpeaker } from '../types';

function SortableRow({
  entry, index, isCurrent, delegate, onRemove, onSelect,
}: {
  entry: GSLSpeaker;
  index: number;
  isCurrent: boolean;
  delegate: { name: string; speechCount: number } | undefined;
  onRemove: () => void;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: entry.id });
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
        title="Drag to reorder"
      >⠿</div>
      <button onClick={onSelect} className="flex-1 text-left">
        <span className={`text-lg font-semibold ${isCurrent ? 'text-blue-200' : 'text-gray-200'}`}>
          {index + 1}. {delegate?.name ?? '(unknown)'}
        </span>
        {delegate && (
          <span className="ml-2 text-sm text-gray-400">× {delegate.speechCount}</span>
        )}
      </button>
      <button
        onClick={onRemove}
        className="text-gray-500 hover:text-red-400 text-xl font-bold px-2 min-h-[36px]"
        title="Remove"
      >×</button>
    </div>
  );
}

export default function GSLView() {
  const store = useStore();
  const { state, gslAddSpeaker, gslRemoveSpeaker, gslReorder, gslNextSpeaker,
    gslSetSpeakingTime, gslSetTimerRunning, gslTickTimer, gslResetTimer,
    gslSetCurrentIndex, incrementSpeechCount, presentDelegates } = store;
  const { gsl } = state;

  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [editingTime, setEditingTime] = useState(false);
  const [timeInput, setTimeInput] = useState(String(gsl.speakingTimeSecs));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = gsl.speakers.findIndex(s => s.id === active.id);
    const newIdx = gsl.speakers.findIndex(s => s.id === over.id);
    gslReorder(arrayMove(gsl.speakers, oldIdx, newIdx));
  }, [gsl.speakers, gslReorder]);

  function getDelegate(id: string) {
    return presentDelegates.find(d => d.id === id);
  }

  const currentEntry = gsl.speakers[gsl.currentIndex];
  const currentDelegate = currentEntry ? getDelegate(currentEntry.delegateId) : undefined;
  const expired = gsl.timerRemaining <= 0;

  function handleNextSpeaker() {
    if (currentEntry) incrementSpeechCount(currentEntry.delegateId);
    gslNextSpeaker();
  }

  function applyTime() {
    const secs = parseInt(timeInput, 10);
    if (secs > 0) gslSetSpeakingTime(secs);
    setEditingTime(false);
  }

  const filteredDelegates = presentDelegates.filter(d =>
    d.name.toLowerCase().includes(addSearch.toLowerCase())
  );

  const tickCallback = useCallback(() => gslTickTimer(), [gslTickTimer]);

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-3xl font-bold">General Speakers' List</h2>
        <div className="flex items-center gap-3">
          {editingTime ? (
            <div className="flex gap-2 items-center">
              <input
                autoFocus
                className="w-24 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-lg text-center focus:outline-none focus:border-blue-400"
                value={timeInput}
                onChange={e => setTimeInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') applyTime(); if (e.key === 'Escape') setEditingTime(false); }}
              />
              <span className="text-gray-400">sec</span>
              <button onClick={applyTime} className="px-3 py-2 bg-blue-600 rounded-lg text-white font-semibold">Set</button>
            </div>
          ) : (
            <button
              onClick={() => { setTimeInput(String(gsl.speakingTimeSecs)); setEditingTime(true); }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-200 text-base"
            >
              {gsl.speakingTimeSecs}s per speaker
            </button>
          )}
          <button
            onClick={() => { setShowAddDropdown(v => !v); setAddSearch(''); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold text-base"
          >
            + Add Speaker
          </button>
        </div>
      </div>

      {/* Add Speaker Dropdown */}
      {showAddDropdown && (
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-3 flex flex-col gap-2">
          <input
            autoFocus
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            placeholder="Search delegates..."
            value={addSearch}
            onChange={e => setAddSearch(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {filteredDelegates.map(d => (
              <button
                key={d.id}
                onClick={() => { gslAddSpeaker(d.id); setShowAddDropdown(false); }}
                className="px-3 py-2 bg-gray-700 hover:bg-blue-600/40 border border-gray-600 hover:border-blue-500 rounded-lg text-gray-200 text-sm"
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current speaker + timer */}
      {gsl.speakers.length > 0 ? (
        <div className="flex flex-col items-center gap-4 bg-gray-800/60 rounded-2xl p-6">
          <div className="text-xl text-gray-400">
            {currentDelegate ? (
              <span className="text-2xl font-bold text-white">{currentDelegate.name}</span>
            ) : (
              <span className="text-gray-500">No speaker selected</span>
            )}
          </div>

          <Timer
            remaining={gsl.timerRemaining}
            total={gsl.speakingTimeSecs}
            running={gsl.timerRunning}
            onTick={tickCallback}
            size="large"
          />

          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => gslSetTimerRunning(!gsl.timerRunning)}
              disabled={gsl.speakers.length === 0}
              className="px-6 py-3 rounded-xl text-xl font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white min-w-[120px]"
            >
              {gsl.timerRunning ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={gslResetTimer}
              className="px-5 py-3 rounded-xl text-xl font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200"
            >
              Reset
            </button>
            <button
              onClick={handleNextSpeaker}
              disabled={gsl.currentIndex >= gsl.speakers.length - 1}
              className={`px-6 py-3 rounded-xl text-xl font-bold min-w-[160px] ${
                expired
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-black animate-pulse'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-40'
              }`}
            >
              Next Speaker →
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 text-xl py-8">
          No speakers in the list yet. Add delegates above.
        </div>
      )}

      {/* Speakers list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={gsl.speakers.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {gsl.speakers.map((entry, i) => (
              <SortableRow
                key={entry.id}
                entry={entry}
                index={i}
                isCurrent={i === gsl.currentIndex}
                delegate={getDelegate(entry.delegateId)}
                onRemove={() => gslRemoveSpeaker(entry.id)}
                onSelect={() => gslSetCurrentIndex(i)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
