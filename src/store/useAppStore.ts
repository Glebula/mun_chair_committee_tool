import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  AppState, CommitteeMode, SessionState, Delegate, AttendanceStatus,
  GSLSpeaker, MotionType, MajorityType, WorkingPaper,
  WorkingPaperStatus, VotingRecord, RoundRobinParticipant,
} from '../types';
import { DEFAULT_STATE } from './defaults';
import { UN_MEMBER_STATES } from '../data/unMemberStates';

const STORAGE_KEY = 'bridgemun_state';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded, ignore */ }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(loadState);

  const stateRef = useRef(state);
  stateRef.current = state;

  const update = useCallback((updater: (s: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  // Persist on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // ── Mode & Session ──────────────────────────────────────────────
  const selectMode = useCallback((mode: CommitteeMode) => {
    update(s => {
      const delegates: Delegate[] = mode === 'GA'
        ? UN_MEMBER_STATES.map(name => ({ id: uid(), name, attendance: 'Absent', speechCount: 0 }))
        : [];
      return { ...s, mode, delegates, sessionState: 'RollCall' };
    });
  }, [update]);

  const resetSession = useCallback(() => {
    const fresh = { ...DEFAULT_STATE, theme: stateRef.current.theme };
    saveState(fresh);
    setState(fresh);
  }, []);

  const setSessionState = useCallback((sessionState: SessionState) => {
    update(s => ({ ...s, previousSessionState: s.sessionState, sessionState }));
  }, [update]);

  const setTheme = useCallback((theme: 'dark' | 'light') => {
    update(s => ({ ...s, theme }));
  }, [update]);

  const setDefaultMajorityType = useCallback((defaultMajorityType: MajorityType) => {
    update(s => ({ ...s, defaultMajorityType }));
  }, [update]);

  const setTopic = useCallback((topic: string) => {
    update(s => ({ ...s, topic }));
  }, [update]);

  // ── Delegates ───────────────────────────────────────────────────
  const setCrisisDelegates = useCallback((names: string[]) => {
    update(s => ({
      ...s,
      delegates: names.map(name => ({ id: uid(), name: name.trim(), attendance: 'Absent', speechCount: 0 })),
    }));
  }, [update]);

  const setAttendance = useCallback((id: string, attendance: AttendanceStatus) => {
    update(s => ({
      ...s,
      delegates: s.delegates.map(d => d.id === id ? { ...d, attendance } : d),
    }));
  }, [update]);

  const incrementSpeechCount = useCallback((delegateId: string) => {
    update(s => ({
      ...s,
      delegates: s.delegates.map(d => d.id === delegateId ? { ...d, speechCount: d.speechCount + 1 } : d),
    }));
  }, [update]);

  const presentDelegates = state.delegates.filter(d => d.attendance !== 'Absent');
  const presentCount = presentDelegates.length;
  const simpleMajority = Math.floor(presentCount / 2) + 1;
  const twoThirdsMajority = Math.ceil((presentCount * 2) / 3);

  // ── GSL ─────────────────────────────────────────────────────────
  const gslAddSpeaker = useCallback((delegateId: string) => {
    update(s => ({
      ...s,
      gsl: {
        ...s.gsl,
        speakers: [...s.gsl.speakers, { id: uid(), delegateId }],
      },
    }));
  }, [update]);

  const gslRemoveSpeaker = useCallback((entryId: string) => {
    update(s => {
      const idx = s.gsl.speakers.findIndex(sp => sp.id === entryId);
      let newIndex = s.gsl.currentIndex;
      if (idx < newIndex) newIndex = Math.max(0, newIndex - 1);
      else if (idx === newIndex) newIndex = Math.min(newIndex, s.gsl.speakers.length - 2);
      return {
        ...s,
        gsl: {
          ...s.gsl,
          speakers: s.gsl.speakers.filter(sp => sp.id !== entryId),
          currentIndex: Math.max(0, newIndex),
        },
      };
    });
  }, [update]);

  const gslReorder = useCallback((speakers: GSLSpeaker[]) => {
    update(s => ({ ...s, gsl: { ...s.gsl, speakers } }));
  }, [update]);

  const gslNextSpeaker = useCallback(() => {
    update(s => {
      const next = s.gsl.currentIndex + 1;
      if (next >= s.gsl.speakers.length) return s;
      const nextId = s.gsl.speakers[next]?.delegateId;
      if (nextId) {
        // increment outgoing speaker count is done explicitly
      }
      return {
        ...s,
        gsl: {
          ...s.gsl,
          currentIndex: next,
          timerRunning: false,
          timerRemaining: s.gsl.speakingTimeSecs,
        },
      };
    });
  }, [update]);

  const gslSetSpeakingTime = useCallback((secs: number) => {
    update(s => ({
      ...s,
      gsl: { ...s.gsl, speakingTimeSecs: secs, timerRemaining: secs, timerRunning: false },
    }));
  }, [update]);

  const gslSetTimerRunning = useCallback((running: boolean) => {
    update(s => ({ ...s, gsl: { ...s.gsl, timerRunning: running } }));
  }, [update]);

  const gslTickTimer = useCallback(() => {
    update(s => {
      if (!s.gsl.timerRunning || s.gsl.timerRemaining <= 0) return s;
      return { ...s, gsl: { ...s.gsl, timerRemaining: s.gsl.timerRemaining - 1 } };
    });
  }, [update]);

  const gslResetTimer = useCallback(() => {
    update(s => ({
      ...s,
      gsl: { ...s.gsl, timerRemaining: s.gsl.speakingTimeSecs, timerRunning: false },
    }));
  }, [update]);

  const gslSetCurrentIndex = useCallback((index: number) => {
    update(s => ({
      ...s,
      gsl: { ...s.gsl, currentIndex: index, timerRemaining: s.gsl.speakingTimeSecs, timerRunning: false },
    }));
  }, [update]);

  // ── Moderated Caucus ────────────────────────────────────────────
  const modSetup = useCallback((topic: string, totalTimeSecs: number, speakingTimeSecs: number) => {
    update(s => ({
      ...s,
      topic,
      modCaucus: {
        topic,
        totalTimeSecs,
        speakingTimeSecs,
        totalRemaining: totalTimeSecs,
        speakerRemaining: speakingTimeSecs,
        currentSpeakerId: null,
        totalRunning: false,
        speakerRunning: false,
        started: false,
      },
    }));
  }, [update]);

  const modSelectSpeaker = useCallback((delegateId: string) => {
    update(s => ({
      ...s,
      modCaucus: {
        ...s.modCaucus,
        currentSpeakerId: delegateId,
        speakerRemaining: s.modCaucus.speakingTimeSecs,
        speakerRunning: false,
        started: true,
      },
    }));
  }, [update]);

  const modSetRunning = useCallback((totalRunning: boolean, speakerRunning: boolean) => {
    update(s => ({ ...s, modCaucus: { ...s.modCaucus, totalRunning, speakerRunning } }));
  }, [update]);

  const modTick = useCallback(() => {
    update(s => {
      const mc = s.modCaucus;
      let totalRemaining = mc.totalRemaining;
      let speakerRemaining = mc.speakerRemaining;
      let totalRunning = mc.totalRunning;
      let speakerRunning = mc.speakerRunning;

      if (mc.totalRunning && totalRemaining > 0) {
        totalRemaining = Math.max(0, totalRemaining - 1);
        if (totalRemaining === 0) { totalRunning = false; speakerRunning = false; }
      }
      if (mc.speakerRunning && speakerRemaining > 0) {
        speakerRemaining = Math.max(0, speakerRemaining - 1);
        if (speakerRemaining === 0) speakerRunning = false;
      }
      return { ...s, modCaucus: { ...mc, totalRemaining, speakerRemaining, totalRunning, speakerRunning } };
    });
  }, [update]);

  const modResetSpeaker = useCallback(() => {
    update(s => ({
      ...s,
      modCaucus: { ...s.modCaucus, speakerRemaining: s.modCaucus.speakingTimeSecs, speakerRunning: false },
    }));
  }, [update]);

  // ── Unmod / Gentleman's Unmod ───────────────────────────────────
  const startUnmod = useCallback((totalTimeSecs: number, type: 'UnmoderatedCaucus' | 'GentlemansUnmod') => {
    update(s => ({
      ...s,
      unmod: { totalTimeSecs, remaining: totalTimeSecs, running: false, previousState: s.sessionState },
      sessionState: type,
      previousSessionState: s.sessionState,
    }));
  }, [update]);

  const unmodSetRunning = useCallback((running: boolean) => {
    update(s => ({ ...s, unmod: { ...s.unmod, running } }));
  }, [update]);

  const unmodTick = useCallback(() => {
    update(s => {
      if (!s.unmod.running || s.unmod.remaining <= 0) return s;
      const remaining = s.unmod.remaining - 1;
      return { ...s, unmod: { ...s.unmod, remaining, running: remaining > 0 } };
    });
  }, [update]);

  const unmodEnd = useCallback(() => {
    update(s => ({
      ...s,
      sessionState: s.unmod.previousState,
      unmod: { ...s.unmod, running: false },
    }));
  }, [update]);

  // ── Round Robin ─────────────────────────────────────────────────
  const rrSetup = useCallback((participants: RoundRobinParticipant[], speakingTimeSecs: number) => {
    update(s => ({
      ...s,
      roundRobin: {
        participants,
        currentIndex: 0,
        speakingTimeSecs,
        timerRemaining: speakingTimeSecs,
        timerRunning: false,
        started: false,
        complete: false,
      },
    }));
  }, [update]);

  const rrStart = useCallback(() => {
    update(s => ({ ...s, roundRobin: { ...s.roundRobin, started: true } }));
  }, [update]);

  const rrSetRunning = useCallback((running: boolean) => {
    update(s => ({ ...s, roundRobin: { ...s.roundRobin, timerRunning: running } }));
  }, [update]);

  const rrTick = useCallback(() => {
    update(s => {
      const rr = s.roundRobin;
      if (!rr.timerRunning || rr.timerRemaining <= 0) return s;
      return { ...s, roundRobin: { ...rr, timerRemaining: rr.timerRemaining - 1 } };
    });
  }, [update]);

  const rrNext = useCallback(() => {
    update(s => {
      const rr = s.roundRobin;
      const next = rr.currentIndex + 1;
      if (next >= rr.participants.length) {
        return { ...s, roundRobin: { ...rr, timerRunning: false, complete: true } };
      }
      return {
        ...s,
        roundRobin: { ...rr, currentIndex: next, timerRemaining: rr.speakingTimeSecs, timerRunning: false },
      };
    });
  }, [update]);

  const rrReset = useCallback(() => {
    update(s => ({
      ...s,
      roundRobin: {
        ...s.roundRobin,
        currentIndex: 0,
        timerRemaining: s.roundRobin.speakingTimeSecs,
        timerRunning: false,
        started: false,
        complete: false,
      },
    }));
  }, [update]);

  // ── Motions ─────────────────────────────────────────────────────
  const addMotion = useCallback((type: MotionType, proposerId: string | null, topic: string, totalTimeSecs: number, speakingTimeSecs: number, majorityType: MajorityType) => {
    update(s => ({
      ...s,
      motions: [...s.motions, { id: uid(), type, proposerId, topic, totalTimeSecs, speakingTimeSecs, forVotes: null, againstVotes: null, result: null, majorityType }],
    }));
  }, [update]);

  const removeMotion = useCallback((id: string) => {
    update(s => ({ ...s, motions: s.motions.filter(m => m.id !== id) }));
  }, [update]);

  const voteMotion = useCallback((id: string, forVotes: number, againstVotes: number, majorityType: MajorityType) => {
    update(s => {
      const motions = s.motions.map(m => {
        if (m.id !== id) return m;
        let result: 'Pass' | 'Fail';
        if (majorityType === 'simple') {
          result = forVotes > againstVotes ? 'Pass' : 'Fail';
        } else {
          const total = forVotes + againstVotes;
          result = total > 0 && forVotes >= Math.ceil((total * 2) / 3) ? 'Pass' : 'Fail';
        }
        return { ...m, forVotes, againstVotes, result, majorityType };
      });
      return { ...s, motions };
    });
  }, [update]);

  const reorderMotions = useCallback((motions: import('../types').Motion[]) => {
    update(s => ({ ...s, motions }));
  }, [update]);

  const startMotion = useCallback((motionId: string) => {
    update(s => {
      const m = s.motions.find(mo => mo.id === motionId);
      if (!m) return s;

      if (m.type === 'Open GSL') {
        return {
          ...s,
          gsl: {
            ...s.gsl,
            isOpen: true,
            speakingTimeSecs: m.speakingTimeSecs,
            timerRemaining: m.speakingTimeSecs,
            timerRunning: false,
          },
          sessionState: 'GSL',
          previousSessionState: s.sessionState,
        };
      }

      if (m.type === 'Moderated Caucus') {
        return {
          ...s,
          topic: m.topic,
          modCaucus: {
            topic: m.topic,
            totalTimeSecs: m.totalTimeSecs,
            speakingTimeSecs: m.speakingTimeSecs,
            totalRemaining: m.totalTimeSecs,
            speakerRemaining: m.speakingTimeSecs,
            currentSpeakerId: null,
            totalRunning: false,
            speakerRunning: false,
            started: false,
          },
          sessionState: 'ModeratedCaucus',
          previousSessionState: s.sessionState,
        };
      }
      if (m.type === 'Unmoderated Caucus') {
        return {
          ...s,
          unmod: { totalTimeSecs: m.totalTimeSecs, remaining: m.totalTimeSecs, running: false, previousState: s.sessionState },
          sessionState: 'UnmoderatedCaucus',
          previousSessionState: s.sessionState,
        };
      }
      if (m.type === "Gentleman's Unmod") {
        return {
          ...s,
          unmod: { totalTimeSecs: m.totalTimeSecs, remaining: m.totalTimeSecs, running: false, previousState: s.sessionState },
          sessionState: 'GentlemansUnmod',
          previousSessionState: s.sessionState,
        };
      }
      if (m.type === 'Round Robin') {
        return {
          ...s,
          roundRobin: {
            participants: [],
            currentIndex: 0,
            speakingTimeSecs: m.speakingTimeSecs,
            timerRemaining: m.speakingTimeSecs,
            timerRunning: false,
            started: false,
            complete: false,
          },
          sessionState: 'RoundRobin',
          previousSessionState: s.sessionState,
        };
      }
      return s;
    });
  }, [update]);

  // ── Voting Records ──────────────────────────────────────────────
  const addVotingRecord = useCallback((name: string, forVotes: number, againstVotes: number, abstainVotes: number, majorityType: MajorityType): string => {
    const id = uid();
    update(s => {
      let result: 'Pass' | 'Fail';
      if (majorityType === 'simple') {
        result = forVotes > againstVotes ? 'Pass' : 'Fail';
      } else {
        const total = forVotes + againstVotes;
        result = total > 0 && forVotes >= Math.ceil((total * 2) / 3) ? 'Pass' : 'Fail';
      }
      const record: VotingRecord = { id, name, forVotes, againstVotes, abstainVotes, majorityType, result, timestamp: Date.now() };
      // auto-update matching working papers
      const workingPapers = s.workingPapers.map(wp =>
        wp.number.toLowerCase() === name.toLowerCase() || wp.title.toLowerCase() === name.toLowerCase()
          ? { ...wp, status: result === 'Pass' ? 'Passed' as WorkingPaperStatus : 'Failed' as WorkingPaperStatus, votingRecordId: id }
          : wp
      );
      return { ...s, votingRecords: [...s.votingRecords, record], workingPapers };
    });
    return id;
  }, [update]);

  // ── Working Papers ──────────────────────────────────────────────
  const addWorkingPaper = useCallback(() => {
    update(s => {
      const num = s.workingPapers.length + 1;
      const wp: WorkingPaper = { id: uid(), number: `WP 1.${num}`, title: '', status: 'Introduced', votingRecordId: null };
      return { ...s, workingPapers: [...s.workingPapers, wp] };
    });
  }, [update]);

  const updateWorkingPaper = useCallback((id: string, changes: Partial<WorkingPaper>) => {
    update(s => ({
      ...s,
      workingPapers: s.workingPapers.map(wp => wp.id === id ? { ...wp, ...changes } : wp),
    }));
  }, [update]);

  const removeWorkingPaper = useCallback((id: string) => {
    update(s => ({ ...s, workingPapers: s.workingPapers.filter(wp => wp.id !== id) }));
  }, [update]);

  return {
    state,
    // computed
    presentDelegates,
    presentCount,
    simpleMajority,
    twoThirdsMajority,
    // actions
    selectMode,
    resetSession,
    setSessionState,
    setTheme,
    setDefaultMajorityType,
    setTopic,
    setCrisisDelegates,
    setAttendance,
    incrementSpeechCount,
    gslAddSpeaker,
    gslRemoveSpeaker,
    gslReorder,
    gslNextSpeaker,
    gslSetSpeakingTime,
    gslSetTimerRunning,
    gslTickTimer,
    gslResetTimer,
    gslSetCurrentIndex,
    modSetup,
    modSelectSpeaker,
    modSetRunning,
    modTick,
    modResetSpeaker,
    startUnmod,
    unmodSetRunning,
    unmodTick,
    unmodEnd,
    rrSetup,
    rrStart,
    rrSetRunning,
    rrTick,
    rrNext,
    rrReset,
    addMotion,
    removeMotion,
    voteMotion,
    reorderMotions,
    startMotion,
    addVotingRecord,
    addWorkingPaper,
    updateWorkingPaper,
    removeWorkingPaper,
  };
}

export type AppStore = ReturnType<typeof useAppStore>;
