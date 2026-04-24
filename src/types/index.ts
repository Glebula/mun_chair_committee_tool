export type CommitteeMode = 'GA' | 'Crisis';

export type AttendanceStatus = 'Absent' | 'Present' | 'Present & Voting';

export type SessionState =
  | 'ModeSelect'
  | 'RollCall'
  | 'GSL'
  | 'ModeratedCaucus'
  | 'UnmoderatedCaucus'
  | 'GentlemansUnmod'
  | 'RoundRobin'
  | 'Motions'
  | 'VotingProcedure'
  | 'WorkingPapers'
  | 'DelegateRoster'
  | 'Suspended';

export type MotionType =
  | 'Moderated Caucus'
  | 'Unmoderated Caucus'
  | "Gentleman's Unmod"
  | 'Round Robin'
  | 'Other';

export type WorkingPaperStatus =
  | 'Introduced'
  | 'In Discussion'
  | 'Voted On'
  | 'Passed'
  | 'Failed';

export type MajorityType = 'simple' | 'two-thirds';

export interface Delegate {
  id: string;
  name: string;
  attendance: AttendanceStatus;
  speechCount: number;
}

export interface GSLSpeaker {
  delegateId: string;
  id: string; // unique entry id for drag/drop
}

export interface GSLState {
  speakers: GSLSpeaker[];
  currentIndex: number;
  speakingTimeSecs: number;
  timerRunning: boolean;
  timerRemaining: number;
}

export interface ModCaucusState {
  topic: string;
  totalTimeSecs: number;
  speakingTimeSecs: number;
  totalRemaining: number;
  speakerRemaining: number;
  currentSpeakerId: string | null;
  totalRunning: boolean;
  speakerRunning: boolean;
  started: boolean;
}

export interface UnmodState {
  totalTimeSecs: number;
  remaining: number;
  running: boolean;
  previousState: SessionState;
}

export interface RoundRobinParticipant {
  delegateId: string;
  entryId: string;
}

export interface RoundRobinState {
  participants: RoundRobinParticipant[];
  currentIndex: number;
  speakingTimeSecs: number;
  timerRemaining: number;
  timerRunning: boolean;
  started: boolean;
  complete: boolean;
}

export interface Motion {
  id: string;
  type: MotionType;
  proposerId: string | null;
  topic: string;
  totalTimeSecs: number;
  speakingTimeSecs: number;
  forVotes: number | null;
  againstVotes: number | null;
  result: 'Pass' | 'Fail' | null;
  majorityType: MajorityType;
}

export interface VotingRecord {
  id: string;
  name: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  majorityType: MajorityType;
  result: 'Pass' | 'Fail';
  timestamp: number;
}

export interface WorkingPaper {
  id: string;
  number: string;
  title: string;
  status: WorkingPaperStatus;
  votingRecordId: string | null;
}

export interface AppState {
  mode: CommitteeMode | null;
  sessionState: SessionState;
  previousSessionState: SessionState;
  theme: 'dark' | 'light';
  delegates: Delegate[];
  topic: string;
  gsl: GSLState;
  modCaucus: ModCaucusState;
  unmod: UnmodState;
  roundRobin: RoundRobinState;
  motions: Motion[];
  votingRecords: VotingRecord[];
  workingPapers: WorkingPaper[];
}
