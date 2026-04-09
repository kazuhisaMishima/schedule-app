import type { Schedule, ScheduleTemplate, DefaultTaskDef } from '../types/schedule';
import { BUILTIN_DEFAULTS } from '../types/schedule';

const STORAGE_KEY_PREFIX = 'schedules-app-data-';
const TEMPLATES_KEY = 'schedules-templates';
const ARCHIVE_KEY_PREFIX = 'schedules-app-archive-';
const DEFAULT_TASKS_KEY = 'schedules-default-tasks';

export const formatDateKey = (date: Date): string => date.toISOString().split('T')[0];
const getStorageKey = (date: Date): string => STORAGE_KEY_PREFIX + formatDateKey(date);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const normalizeSchedule = (s: Record<string, unknown>): Schedule => ({
  id: (s.id as number) || 0,
  title: (s.title as string) || '',
  startTime: (s.startTime as string) || '09:00',
  endTime: (s.endTime as string) || '10:00',
  completed: (s.completed as boolean) || false,
  progress: (s.progress as number) || 0,
  notes: (s.notes as string) || '',
  isRequired: s.isRequired !== undefined ? (s.isRequired as boolean) : true,
});

export const saveToStorage = (schedules: Schedule[], date: Date) => {
  try {
    localStorage.setItem(getStorageKey(date), JSON.stringify(schedules));
  } catch (error) {
    console.error('保存エラー:', getErrorMessage(error));
  }
};

export const loadFromStorage = (date: Date): Schedule[] | null => {
  try {
    const data = localStorage.getItem(getStorageKey(date));
    if (!data) return null;
    return (JSON.parse(data) as Record<string, unknown>[]).map(normalizeSchedule);
  } catch {
    return null;
  }
};

export const saveTemplatesToStorage = (templates: ScheduleTemplate[]) => {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
};

export const loadTemplatesFromStorage = (): ScheduleTemplate[] => {
  const data = localStorage.getItem(TEMPLATES_KEY);
  return data ? (JSON.parse(data) as ScheduleTemplate[]) : [];
};

export const saveArchive = (schedules: Schedule[], date: Date) => {
  try {
    localStorage.setItem(ARCHIVE_KEY_PREFIX + formatDateKey(date), JSON.stringify(schedules));
    alert('保存しました！');
  } catch (error) {
    alert(`保存に失敗しました。\n${getErrorMessage(error)}`);
  }
};

export const loadArchive = (date: Date): Schedule[] => {
  try {
    const data = localStorage.getItem(ARCHIVE_KEY_PREFIX + formatDateKey(date));
    if (!data) { alert('保存データが見つかりません。'); return []; }
    alert('読み込みました！');
    return (JSON.parse(data) as Record<string, unknown>[]).map(normalizeSchedule);
  } catch (error) {
    alert(`読み込みに失敗しました。\n${getErrorMessage(error)}`);
    return [];
  }
};

export const loadDefaultTasks = (): DefaultTaskDef[] => {
  const data = localStorage.getItem(DEFAULT_TASKS_KEY);
  return data ? (JSON.parse(data) as DefaultTaskDef[]) : BUILTIN_DEFAULTS;
};

export const saveDefaultTasksToStorage = (tasks: DefaultTaskDef[]) => {
  localStorage.setItem(DEFAULT_TASKS_KEY, JSON.stringify(tasks));
};

/**
 * すべてのデータ（全日付のスケジュール、テンプレート、デフォルトタスク）を JSON 形式でエクスポート
 */
export const exportAllDataToJSON = (): string => {
  const allSchedules: Record<string, Schedule[]> = {};

  // LocalStorage から全日付のスケジュールを取得
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      const dateStr = key.replace(STORAGE_KEY_PREFIX, '');
      try {
        const data = localStorage.getItem(key);
        if (data) {
          allSchedules[dateStr] = (JSON.parse(data) as Record<string, unknown>[]).map(normalizeSchedule);
        }
      } catch {
        // スキップ
      }
    }
  }

  const templates = loadTemplatesFromStorage();
  const defaultTasks = loadDefaultTasks();

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    schedules: allSchedules,
    templates,
    defaultTasks,
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * JSON テキストからデータをインポート（LocalStorage に復元）
 */
export const importFromJSON = (jsonText: string): { success: boolean; message: string } => {
  try {
    const data = JSON.parse(jsonText) as {
      version?: string;
      schedules?: Record<string, unknown[]>;
      templates?: unknown[];
      defaultTasks?: unknown[];
    };

    if (!data.schedules || !data.templates || !data.defaultTasks) {
      return {
        success: false,
        message: '無効な JSON 形式です。必要なフィールドが不足しています。',
      };
    }

    // スケジュールをインポート
    for (const [dateStr, schedules] of Object.entries(data.schedules)) {
      try {
        const normalizedSchedules = (schedules as Record<string, unknown>[]).map(normalizeSchedule);
        localStorage.setItem(STORAGE_KEY_PREFIX + dateStr, JSON.stringify(normalizedSchedules));
      } catch {
        // 継続
      }
    }

    // テンプレートをインポート
    try {
      const templates = data.templates as ScheduleTemplate[];
      saveTemplatesToStorage(templates);
    } catch {
      // 継続
    }

    // デフォルトタスクをインポート
    try {
      const defaultTasks = data.defaultTasks as DefaultTaskDef[];
      saveDefaultTasksToStorage(defaultTasks);
    } catch {
      // 継続
    }

    return {
      success: true,
      message: 'データをインポートしました。ページをリロードして反映させてください。',
    };
  } catch (error) {
    return {
      success: false,
      message: `インポートエラー: ${getErrorMessage(error)}`,
    };
  }
};
