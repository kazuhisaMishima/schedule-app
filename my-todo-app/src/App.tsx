import { useState, useEffect } from 'react'
import './App.css'
import type { Schedule, ScheduleTemplate } from './types/schedule';

// ============================================================
// Storage helpers
// ============================================================
const STORAGE_KEY_PREFIX = 'schedules-app-data-';
const TEMPLATES_KEY = 'schedules-templates';
const ARCHIVE_KEY_PREFIX = 'schedules-app-archive-';
const DEFAULT_TASKS_KEY = 'schedules-default-tasks';

const formatDateKey = (date: Date): string => date.toISOString().split('T')[0];
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

const saveToStorage = (schedules: Schedule[], date: Date) => {
  try {
    localStorage.setItem(getStorageKey(date), JSON.stringify(schedules));
  } catch (error) {
    console.error('保存エラー:', getErrorMessage(error));
  }
};

const loadFromStorage = (date: Date): Schedule[] | null => {
  try {
    const data = localStorage.getItem(getStorageKey(date));
    if (!data) return null;
    return (JSON.parse(data) as Record<string, unknown>[]).map(normalizeSchedule);
  } catch {
    return null;
  }
};

const saveTemplatesToStorage = (templates: ScheduleTemplate[]) => {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
};

const loadTemplatesFromStorage = (): ScheduleTemplate[] => {
  const data = localStorage.getItem(TEMPLATES_KEY);
  return data ? (JSON.parse(data) as ScheduleTemplate[]) : [];
};

const saveArchive = (schedules: Schedule[], date: Date) => {
  try {
    localStorage.setItem(ARCHIVE_KEY_PREFIX + formatDateKey(date), JSON.stringify(schedules));
    alert('保存しました！');
  } catch (error) {
    alert(`保存に失敗しました。\n${getErrorMessage(error)}`);
  }
};

const loadArchive = (date: Date): Schedule[] => {
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

const getNextHourTime = (hour: string, minute: string) => {
  const h = Math.min(parseInt(hour, 10) + 1, 23);
  return { hour: h.toString().padStart(2, '0'), minute };
};

// ============================================================
// Default task definitions (configurable in Settings)
// ============================================================
interface DefaultTaskDef {
  title: string;
  startTime: string;
  endTime: string;
  isRequired: boolean;
}

const BUILTIN_DEFAULTS: DefaultTaskDef[] = [
  { title: '午前タスク1', startTime: '09:00', endTime: '10:00', isRequired: true },
  { title: '午前タスク2', startTime: '10:00', endTime: '11:00', isRequired: true },
  { title: '昼', startTime: '12:00', endTime: '13:00', isRequired: false },
  { title: '午後タスク1', startTime: '13:00', endTime: '14:00', isRequired: true },
  { title: '午後タスク2', startTime: '14:00', endTime: '15:00', isRequired: false },
  { title: '会議・進捗', startTime: '16:00', endTime: '17:00', isRequired: true },
];

const loadDefaultTasks = (): DefaultTaskDef[] => {
  const data = localStorage.getItem(DEFAULT_TASKS_KEY);
  return data ? (JSON.parse(data) as DefaultTaskDef[]) : BUILTIN_DEFAULTS;
};

const saveDefaultTasksToStorage = (tasks: DefaultTaskDef[]) => {
  localStorage.setItem(DEFAULT_TASKS_KEY, JSON.stringify(tasks));
};

const createSchedulesFromDefaults = (defs: DefaultTaskDef[]): Schedule[] =>
  defs.map((d, i) => ({
    id: i + 1,
    title: d.title,
    startTime: d.startTime,
    endTime: d.endTime,
    completed: false,
    progress: 0,
    notes: '',
    isRequired: d.isRequired,
  }));

const getInitialSchedules = (date: Date, defTasks: DefaultTaskDef[]): Schedule[] => {
  const stored = loadFromStorage(date);
  if (stored !== null) return stored;
  return createSchedulesFromDefaults(defTasks);
};

// ============================================================
// Form type
// ============================================================
interface FormData {
  title: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  isRequired: boolean;
}

const EMPTY_FORM: FormData = {
  title: '',
  startHour: '09',
  startMinute: '00',
  endHour: '10',
  endMinute: '00',
  isRequired: true,
};

const HOUR_OPTIONS = Array.from({ length: 16 }, (_, i) => (i + 8).toString().padStart(2, '0'));
const MINUTE_OPTIONS = ['00', '15', '30', '45'];

// ============================================================
// Shared TimeSelect component
// ============================================================
function TimeSelect({ hour, minute, onHourChange, onMinuteChange, id }: {
  hour: string;
  minute: string;
  onHourChange: (h: string) => void;
  onMinuteChange: (m: string) => void;
  id?: string;
}) {
  return (
    <div className="time-input-group">
      <select id={id} value={hour} onChange={e => onHourChange(e.target.value)}>
        {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="time-separator">:</span>
      <select value={minute} onChange={e => onMinuteChange(e.target.value)}>
        {MINUTE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  );
}

// ============================================================
// InlineInsertForm — タスク間にインラインで追加するフォーム
// ============================================================
function InlineInsertForm({ onConfirm, onCancel }: {
  onConfirm: (form: FormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  return (
    <div className="inline-insert-form">
      <input
        className="inline-title-input"
        type="text"
        placeholder="タスク名"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        autoFocus
      />
      <div className="inline-time-row">
        <span className="inline-time-label">開始</span>
        <TimeSelect
          hour={form.startHour}
          minute={form.startMinute}
          onHourChange={h => {
            const next = getNextHourTime(h, form.startMinute);
            setForm({ ...form, startHour: h, endHour: next.hour, endMinute: next.minute });
          }}
          onMinuteChange={m => {
            const next = getNextHourTime(form.startHour, m);
            setForm({ ...form, startMinute: m, endHour: next.hour, endMinute: next.minute });
          }}
        />
        <span className="inline-time-label">終了</span>
        <TimeSelect
          hour={form.endHour}
          minute={form.endMinute}
          onHourChange={h => setForm({ ...form, endHour: h })}
          onMinuteChange={m => setForm({ ...form, endMinute: m })}
        />
        <label className="inline-required-label">
          <input
            type="checkbox"
            checked={form.isRequired}
            onChange={e => setForm({ ...form, isRequired: e.target.checked })}
          />
          マスト
        </label>
      </div>
      <div className="inline-insert-buttons">
        <button className="confirm-insert-btn" onClick={() => onConfirm(form)}>追加</button>
        <button className="cancel-insert-btn" onClick={onCancel}>キャンセル</button>
      </div>
    </div>
  );
}

type SidePanel = 'template' | 'save' | 'settings' | null;

// ============================================================
// App — メインコンポーネント
// ============================================================
function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [defaultTasks, setDefaultTasks] = useState<DefaultTaskDef[]>(loadDefaultTasks);
  const [schedules, setSchedules] = useState<Schedule[]>(() =>
    getInitialSchedules(new Date(), loadDefaultTasks())
  );
  const [templates, setTemplates] = useState<ScheduleTemplate[]>(loadTemplatesFromStorage);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormData>(EMPTY_FORM);
  const [insertAfterId, setInsertAfterId] = useState<number | null>(null); // -1 = top
  const [activePanel, setActivePanel] = useState<SidePanel>(null);
  const [templateName, setTemplateName] = useState('');
  const [editingDefaults, setEditingDefaults] = useState<DefaultTaskDef[]>(loadDefaultTasks);

  // Date change → reload schedules
  useEffect(() => {
    setSchedules(getInitialSchedules(currentDate, loadDefaultTasks()));
    setEditingId(null);
    setInsertAfterId(null);
  }, [currentDate]);

  // Persist schedules
  useEffect(() => {
    saveToStorage(schedules, currentDate);
  }, [schedules, currentDate]);

  // Persist templates
  useEffect(() => {
    saveTemplatesToStorage(templates);
  }, [templates]);

  // Persist defaultTasks
  useEffect(() => {
    saveDefaultTasksToStorage(defaultTasks);
  }, [defaultTasks]);

  const nextId = () =>
    schedules.length > 0 ? Math.max(...schedules.map(s => s.id)) + 1 : 1;

  const handleConfirmInsert = (form: FormData) => {
    const startTime = `${form.startHour}:${form.startMinute}`;
    const endTime = `${form.endHour}:${form.endMinute}`;
    if (!form.title.trim() || startTime >= endTime) {
      alert('タイトルと正しい時間を入力してください');
      return;
    }
    setSchedules(prev => [...prev, {
      id: nextId(),
      title: form.title.trim(),
      startTime,
      endTime,
      completed: false,
      progress: 0,
      notes: '',
      isRequired: form.isRequired,
    }]);
    setInsertAfterId(null);
  };

  const handleEditSchedule = (id: number) => {
    const s = schedules.find(s => s.id === id);
    if (!s) return;
    const [startHour, startMinute] = s.startTime.split(':');
    const [endHour, endMinute] = s.endTime.split(':');
    setEditForm({ title: s.title, startHour, startMinute, endHour, endMinute, isRequired: s.isRequired });
    setEditingId(id);
  };

  const handleSaveEdit = () => {
    if (editingId === null) return;
    const startTime = `${editForm.startHour}:${editForm.startMinute}`;
    const endTime = `${editForm.endHour}:${editForm.endMinute}`;
    if (!editForm.title.trim() || startTime >= endTime) {
      alert('正しい情報を入力してください');
      return;
    }
    setSchedules(prev => prev.map(s =>
      s.id === editingId
        ? { ...s, title: editForm.title.trim(), startTime, endTime, isRequired: editForm.isRequired }
        : s
    ));
    setEditingId(null);
  };

  const handleDeleteSchedule = (id: number) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const handleToggleCompleted = (id: number) => {
    setSchedules(prev => prev.map(s =>
      s.id === id ? { ...s, completed: !s.completed, progress: 0 } : s
    ));
  };

  const handleUpdateProgress = (id: number, progress: number) => {
    setSchedules(prev => prev.map(s =>
      s.id === id ? { ...s, progress: Math.min(100, Math.max(0, progress)) } : s
    ));
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || schedules.length === 0) {
      alert('テンプレート名を入力し、スケジュールを追加してください');
      return;
    }
    setTemplates(prev => [...prev, {
      id: prev.length > 0 ? Math.max(...prev.map(t => t.id)) + 1 : 1,
      name: templateName.trim(),
      schedules: schedules.map(({ id: _id, ...rest }) => rest),
    }]);
    setTemplateName('');
    alert('テンプレートを保存しました！');
  };

  const handleApplyTemplate = (template: ScheduleTemplate) => {
    const base = schedules.length > 0 ? Math.max(...schedules.map(s => s.id)) : 0;
    setSchedules(prev => [...prev, ...template.schedules.map((s, i) => ({
      ...s, id: base + i + 1,
    }))]);
    alert('テンプレートを適用しました！');
  };

  const handleDeleteTemplate = (id: number) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const togglePanel = (panel: SidePanel) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  const sortedSchedules = [...schedules].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const completedCount = schedules.filter(s => s.completed).length;
  const mustCount = schedules.filter(s => s.isRequired).length;

  return (
    <div className="app-shell">
      {/* ===== 左サイドバー ===== */}
      <aside className={`sidebar${activePanel ? ' expanded' : ''}`}>
        <nav className="sidebar-nav">
          <button
            className={`nav-item${activePanel === 'template' ? ' active' : ''}`}
            onClick={() => togglePanel('template')}
            title="テンプレート"
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">テンプレート</span>
          </button>
          <button
            className={`nav-item${activePanel === 'save' ? ' active' : ''}`}
            onClick={() => togglePanel('save')}
            title="保存"
          >
            <span className="nav-icon">💾</span>
            <span className="nav-label">保存</span>
          </button>
          <button
            className={`nav-item${activePanel === 'settings' ? ' active' : ''}`}
            onClick={() => togglePanel('settings')}
            title="設定"
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">設定</span>
          </button>
        </nav>

        {activePanel && (
          <div className="sidebar-panel">
            {/* テンプレートパネル */}
            {activePanel === 'template' && (
              <div className="sub-section">
                <div className="sub-section-header">
                  <h3>テンプレート</h3>
                  <button className="panel-close-btn" onClick={() => setActivePanel(null)}>✕</button>
                </div>
                <div className="sub-row">
                  <input
                    className="sub-input"
                    type="text"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="テンプレート名"
                  />
                  <button onClick={handleSaveTemplate} className="sub-btn">保存</button>
                </div>
                {templates.length === 0 && <p className="sub-empty">テンプレートはまだありません</p>}
                <div className="template-list">
                  {templates.map(t => (
                    <div key={t.id} className="template-item">
                      <div className="template-item-info">
                        <span className="template-item-name">{t.name}</span>
                        <span className="template-item-count">{t.schedules.length}タスク</span>
                      </div>
                      <div className="template-item-actions">
                        <button onClick={() => handleApplyTemplate(t)} className="sub-btn-small">適用</button>
                        <button onClick={() => handleDeleteTemplate(t.id)} className="sub-btn-small danger">削除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 保存パネル */}
            {activePanel === 'save' && (
              <div className="sub-section">
                <div className="sub-section-header">
                  <h3>保存</h3>
                  <button className="panel-close-btn" onClick={() => setActivePanel(null)}>✕</button>
                </div>
                <p className="sub-date">{currentDate.toLocaleDateString('ja-JP')}</p>
                <div className="sub-row vertical">
                  <button
                    onClick={() => saveArchive(schedules, currentDate)}
                    className="sub-btn full"
                  >
                    💾 現在の状態を保存
                  </button>
                  <button
                    onClick={() => {
                      const loaded = loadArchive(currentDate);
                      if (loaded.length > 0) setSchedules(loaded);
                    }}
                    className="sub-btn full outline"
                  >
                    📂 保存データを読み込む
                  </button>
                </div>
              </div>
            )}

            {/* 設定パネル */}
            {activePanel === 'settings' && (
              <div className="sub-section">
                <div className="sub-section-header">
                  <h3>設定</h3>
                  <button className="panel-close-btn" onClick={() => setActivePanel(null)}>✕</button>
                </div>
                <h4 className="sub-heading">初期タスク設定</h4>
                <p className="sub-hint">新しい日に自動で作成されるタスクを設定します</p>
                <div className="default-task-list">
                  {editingDefaults.map((d, i) => (
                    <div key={i} className="default-task-item">
                      <input
                        className="sub-input default-task-title"
                        value={d.title}
                        onChange={e => {
                          const updated = [...editingDefaults];
                          updated[i] = { ...d, title: e.target.value };
                          setEditingDefaults(updated);
                        }}
                        placeholder="タスク名"
                      />
                      <div className="default-task-times">
                        <input
                          className="sub-input time-mini"
                          type="time"
                          value={d.startTime}
                          onChange={e => {
                            const updated = [...editingDefaults];
                            updated[i] = { ...d, startTime: e.target.value };
                            setEditingDefaults(updated);
                          }}
                        />
                        <span>〜</span>
                        <input
                          className="sub-input time-mini"
                          type="time"
                          value={d.endTime}
                          onChange={e => {
                            const updated = [...editingDefaults];
                            updated[i] = { ...d, endTime: e.target.value };
                            setEditingDefaults(updated);
                          }}
                        />
                      </div>
                      <div className="default-task-footer">
                        <label className="default-task-required">
                          <input
                            type="checkbox"
                            checked={d.isRequired}
                            onChange={e => {
                              const updated = [...editingDefaults];
                              updated[i] = { ...d, isRequired: e.target.checked };
                              setEditingDefaults(updated);
                            }}
                          />
                          マスト
                        </label>
                        <button
                          className="sub-btn-small danger"
                          onClick={() => setEditingDefaults(prev => prev.filter((_, j) => j !== i))}
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="sub-btn full"
                  style={{ marginTop: '8px' }}
                  onClick={() => setEditingDefaults(prev => [
                    ...prev,
                    { title: 'タスク', startTime: '09:00', endTime: '10:00', isRequired: true }
                  ])}
                >＋ タスクを追加</button>
                <div className="sub-row" style={{ marginTop: '12px' }}>
                  <button
                    className="sub-btn"
                    onClick={() => {
                      setDefaultTasks(editingDefaults);
                      alert('初期タスク設定を保存しました');
                    }}
                  >保存</button>
                  <button
                    className="sub-btn outline"
                    onClick={() => setEditingDefaults(BUILTIN_DEFAULTS)}
                  >リセット</button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ===== メインコンテンツ ===== */}
      <main className="main-content">
        <header className="app-header">
          <div className="date-nav">
            <button
              className="date-nav-btn"
              onClick={() => setCurrentDate(d => new Date(d.getTime() - 86400000))}
            >◀</button>
            <input
              type="date"
              className="date-input"
              value={formatDateKey(currentDate)}
              onChange={e => setCurrentDate(new Date(e.target.value + 'T00:00:00'))}
            />
            <button
              className="date-nav-btn"
              onClick={() => setCurrentDate(d => new Date(d.getTime() + 86400000))}
            >▶</button>
            <button className="today-btn" onClick={() => setCurrentDate(new Date())}>今日</button>
          </div>
          <div className="stats-bar">
            <span className="stat">{schedules.length} タスク</span>
            <span className="stat-sep">|</span>
            <span className="stat stat-done">{completedCount} 完了</span>
            <span className="stat-sep">|</span>
            <span className="stat">{mustCount} マスト</span>
          </div>
        </header>

        <div className="schedule-list">
          {/* 先頭の ＋ ボタン / インライン追加フォーム */}
          {insertAfterId === -1 ? (
            <InlineInsertForm
              onConfirm={handleConfirmInsert}
              onCancel={() => setInsertAfterId(null)}
            />
          ) : (
            <button
              className="insert-between"
              onClick={() => setInsertAfterId(-1)}
              title="先頭に追加"
            >＋</button>
          )}

          {sortedSchedules.length === 0 && insertAfterId !== -1 && (
            <p className="empty-message">タスクがありません</p>
          )}

          {sortedSchedules.map(schedule => (
            <div key={schedule.id}>
              <div className={`schedule-item${schedule.completed ? ' completed' : ''}${schedule.isRequired ? ' must' : ' optional'}`}>
                <div className="schedule-time">
                  <span className="time-badge">{schedule.startTime}</span>
                  <span className="time-sep-dash">-</span>
                  <span className="time-badge">{schedule.endTime}</span>
                </div>

                <div className="schedule-content">
                  <div className="schedule-header">
                    <input
                      type="checkbox"
                      checked={schedule.completed}
                      onChange={() => handleToggleCompleted(schedule.id)}
                      aria-label={`${schedule.title}を完了にする`}
                    />
                    {editingId === schedule.id ? (
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        className="edit-title-input"
                      />
                    ) : (
                      <h3 className="schedule-title">{schedule.title}</h3>
                    )}
                    {editingId === schedule.id ? (
                      <label className="edit-required">
                        <input
                          type="checkbox"
                          checked={editForm.isRequired}
                          onChange={e => setEditForm({ ...editForm, isRequired: e.target.checked })}
                        />
                        マスト
                      </label>
                    ) : (
                      <span className="badge">{schedule.isRequired ? 'マスト' : '努力'}</span>
                    )}
                  </div>

                  {/* 時間編集 */}
                  {editingId === schedule.id && (
                    <div className="edit-time-section">
                      <div className="form-row">
                        <div className="form-group">
                          <label>開始</label>
                          <TimeSelect
                            hour={editForm.startHour}
                            minute={editForm.startMinute}
                            onHourChange={h => {
                              const next = getNextHourTime(h, editForm.startMinute);
                              setEditForm({ ...editForm, startHour: h, endHour: next.hour, endMinute: next.minute });
                            }}
                            onMinuteChange={m => {
                              const next = getNextHourTime(editForm.startHour, m);
                              setEditForm({ ...editForm, startMinute: m, endHour: next.hour, endMinute: next.minute });
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label>終了</label>
                          <TimeSelect
                            hour={editForm.endHour}
                            minute={editForm.endMinute}
                            onHourChange={h => setEditForm({ ...editForm, endHour: h })}
                            onMinuteChange={m => setEditForm({ ...editForm, endMinute: m })}
                          />
                        </div>
                      </div>
                      <div className="edit-buttons">
                        <button onClick={handleSaveEdit} className="save-edit-btn">保存</button>
                        <button onClick={() => setEditingId(null)} className="cancel-edit-btn">キャンセル</button>
                      </div>
                    </div>
                  )}

                  {/* 進捗スライダー */}
                  {!schedule.completed && editingId !== schedule.id && (
                    <div className="progress-section">
                      <label htmlFor={`progress-${schedule.id}`}>進捗率</label>
                      <div className="progress-container">
                        <input
                          id={`progress-${schedule.id}`}
                          type="range"
                          min="0"
                          max="100"
                          value={schedule.progress || 0}
                          onChange={e => handleUpdateProgress(schedule.id, parseInt(e.target.value))}
                          style={{
                            background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${schedule.progress || 0}%, #e0e0e0 ${schedule.progress || 0}%, #e0e0e0 100%)`
                          }}
                        />
                        <span className="progress-text">{schedule.progress || 0}%</span>
                      </div>
                    </div>
                  )}

                  {/* アクションボタン */}
                  {editingId !== schedule.id && (
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEditSchedule(schedule.id)}
                        className="edit-btn"
                      >編集</button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="delete-btn"
                      >削除</button>
                    </div>
                  )}
                </div>
              </div>

              {/* タスク間の ＋ ボタン / インライン追加フォーム */}
              {insertAfterId === schedule.id ? (
                <InlineInsertForm
                  onConfirm={handleConfirmInsert}
                  onCancel={() => setInsertAfterId(null)}
                />
              ) : (
                <button
                  className="insert-between"
                  onClick={() => setInsertAfterId(schedule.id)}
                  title="ここに追加"
                >＋</button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
