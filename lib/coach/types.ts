export type CoachLanguage = 'fr-FR' | 'de-DE';
export type CoachLevel = 'A1' | 'A2';
export type GoalMode = 'exam' | 'speaking' | 'balanced';
export type CoachGoal = {
  mode: GoalMode;
  level: CoachLevel;
  /** Older saved profiles omit this field; French profiles default to DELF tout public in the UI. */
  targetExam?: 'DELF tout public';
  start: 'zero' | 'a1' | 'a2' | 'unsure';
  dailyMinutes: 10 | 20 | 30 | 45;
  targetDate: string | null;
  interests: string[];
  timezone: string;
};
export type CoachProfile = {
  id: string;
  language: CoachLanguage;
  goal: CoachGoal;
  revision: number;
  createdAt: number;
};
export const coachLanguages = [
  {id: 'fr-FR', label: '法语', native: 'Français', exam: 'DELF tout public'},
  {id: 'de-DE', label: '德语', native: 'Deutsch', exam: 'Goethe 成人考试'},
] as const;
export const goalLabels = {exam: '考证优先', speaking: '听说优先', balanced: '考证与听说兼顾'};
export const initialGoal: CoachGoal = {mode: 'balanced', level: 'A1', start: 'zero', dailyMinutes: 20, targetDate: null, interests: ['生活'], timezone: 'Asia/Shanghai'};
