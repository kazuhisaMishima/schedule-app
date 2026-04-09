// ============================================================
// types/schedule.ts
// スケジュール管理アプリ 共通型定義
// ============================================================

/**
 * スケジュールアイテムの型
 * 時間ベースのタスク管理を実現する中心的なデータ型
 */
export interface Schedule {
  id: number;
  title: string;
  startTime: string;  // "HH:mm" 形式
  endTime: string;    // "HH:mm" 形式
  completed: boolean;
  progress?: number;  // 0-100 : 進捗率（未完了の場合のみ有効）
  notes?: string;     // タスク単位のメモ
  isRequired: boolean; // true: マスト / false: 努力目標
}

/**
 * スケジュールテンプレートの型
 * 保存・読み込みで使うひな形。id は保存時に付与するため除外。
 */
export interface ScheduleTemplate {
  id: number;
  name: string;
  schedules: Omit<Schedule, 'id'>[];
}

/**
 * 追加フォーム / 編集フォーム 共通の状態型
 * ScheduleForm・ScheduleItem の両コンポーネントで使用する
 */
export interface ScheduleFormData {
  title: string;
  startHour: string;   // "08" ～ "23"
  startMinute: string; // "00" | "15" | "30" | "45"
  endHour: string;
  endMinute: string;
  isRequired: boolean;
}

/** ScheduleFormData の初期値 */
export const INITIAL_FORM_DATA: ScheduleFormData = {
  title: '',
  startHour: '09',
  startMinute: '00',
  endHour: '10',
  endMinute: '00',
  isRequired: true,
};

/**
 * デフォルトタスク定義（設定パネルで編集可能）
 */
export interface DefaultTaskDef {
  title: string;
  startTime: string;
  endTime: string;
  isRequired: boolean;
}

export const BUILTIN_DEFAULTS: DefaultTaskDef[] = [
  { title: '午前タスク1', startTime: '09:00', endTime: '10:00', isRequired: true },
  { title: '午前タスク2', startTime: '10:00', endTime: '11:00', isRequired: true },
  { title: '昼', startTime: '12:00', endTime: '13:00', isRequired: false },
  { title: '午後タスク1', startTime: '13:00', endTime: '14:00', isRequired: true },
  { title: '午後タスク2', startTime: '14:00', endTime: '15:00', isRequired: false },
  { title: '会議・進捗', startTime: '16:00', endTime: '17:00', isRequired: true },
];
