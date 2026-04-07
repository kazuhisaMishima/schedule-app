import { useState, useEffect } from 'react'
import './App.css'
import type { Schedule, ScheduleTemplate } from './types/schedule';

// スケジュールアイテムの型定義
// 時間ベースのタスク管理を実現
// interface Schedule {
//   id: number;
//   title: string;
//   startTime: string;  // "HH:mm" 形式
//   endTime: string;    // "HH:mm" 形式
//   completed: boolean;
//   progress?: number;  // 0-100、進捗率（完了していない場合）
//   notes?: string;     // タスク単位のメモ
//   isRequired: boolean; // true: マスト, false: 努力目標
// }

// テンプレートの型定義
// スケジュールのテンプレート保存・読み込み用
// interface ScheduleTemplate {
//   id: number;
//   name: string;
//   schedules: Omit<Schedule, 'id'>[]; // idを除いたスケジュール配列
// }

// localStorage操作のヘルパー関数
// ブラウザを閉じても スケジュールが保持される
const STORAGE_KEY_PREFIX = 'schedules-app-data-';
const TEMPLATES_KEY = 'schedules-templates';
const ARCHIVE_KEY_PREFIX = 'schedules-app-archive-';

// 日付をYYYY-MM-DD形式にフォーマット
const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// 指定日付のストレージキー取得
const getStorageKey = (date: Date): string => {
  return STORAGE_KEY_PREFIX + formatDateKey(date);
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};

const saveToStorage = (schedules: Schedule[], date: Date) => {
  try {
    const key = getStorageKey(date);
    localStorage.setItem(key, JSON.stringify(schedules));
  } catch (error) {
    console.error('スケジュール保存エラー:', error);
    alert(`スケジュールの保存に失敗しました。\n\nエラー詳細: ${getErrorMessage(error)}`);
  }
};

const loadFromStorage = (date: Date): Schedule[] => {
  try {
    const key = getStorageKey(date);
    const data = localStorage.getItem(key);
    if (!data) return [];

    const schedules = JSON.parse(data);
    // データを正規化して返す
    return schedules.map(normalizeSchedule);
  } catch (error) {
    console.error('スケジュール読み込みエラー:', error);
    alert(`スケジュールの読み込みに失敗しました。デフォルトの空のスケジュールを使用します。\n\nエラー詳細: ${getErrorMessage(error)}`);
    return [];
  }
};

const saveTemplatesToStorage = (templates: ScheduleTemplate[]) => {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
};

const loadTemplatesFromStorage = (): ScheduleTemplate[] => {
  const data = localStorage.getItem(TEMPLATES_KEY);
  return data ? JSON.parse(data) : [];
};

// アーカイブ保存関数
const saveArchive = (schedules: Schedule[], date: Date) => {
  try {
    const key = ARCHIVE_KEY_PREFIX + formatDateKey(date);
    localStorage.setItem(key, JSON.stringify(schedules));
    alert('アーカイブを保存しました！');
  } catch (error) {
    console.error('アーカイブ保存エラー:', error);
    alert(`アーカイブの保存に失敗しました。\n\nエラー詳細: ${getErrorMessage(error)}`);
  }
};

// アーカイブ読み込み関数
const loadArchive = (date: Date): Schedule[] => {
  try {
    const key = ARCHIVE_KEY_PREFIX + formatDateKey(date);
    const data = localStorage.getItem(key);
    if (!data) {
      alert('アーカイブが見つかりません。');
      return [];
    }
    const schedules = JSON.parse(data);
    alert('アーカイブを読み込みました！');
    return schedules.map(normalizeSchedule);
  } catch (error) {
    console.error('アーカイブ読み込みエラー:', error);
    alert(`アーカイブの読み込みに失敗しました。\n\nエラー詳細: ${getErrorMessage(error)}`);
    return [];
  }
};

// スケジュールデータの正規化関数
// localStorageから読み込んだデータを正しい形式に変換
const normalizeSchedule = (schedule: any): Schedule => {
  return {
    id: schedule.id || 0,
    title: schedule.title || '',
    startTime: schedule.startTime || '08:00',
    endTime: schedule.endTime || '09:00',
    completed: schedule.completed || false,
    progress: schedule.progress || 0,
    notes: schedule.notes || '',
    isRequired: schedule.isRequired !== undefined ? schedule.isRequired : true,
  };
};

// 時間を表示用にフォーマットする関数
const formatTimeDisplay = (time: string): string => {
  const [hour, minute] = time.split(':');
  return `${hour}:${minute}`;
};

// 開始時間から+1時間後の時間を取得する関数
const getNextHourTime = (hour: string, minute: string): { hour: string; minute: string } => {
  const parsedHour = parseInt(hour, 10);
  const normalizedMinute = minute.padStart(2, '0');
  let nextHour = isNaN(parsedHour) ? 9 : parsedHour + 1;
  if (nextHour > 23) {
    nextHour = 23;
  }
  return {
    hour: nextHour.toString().padStart(2, '0'),
    minute: normalizedMinute,
  };
};

// スケジュール管理アプリのメインコンポーネント
// 時間ベースでタスクを管理し、進捗追跡が可能
function App() {
  // 現在の日付管理
  const [currentDate, setCurrentDate] = useState(new Date());

  // スケジュールリストの状態管理
  // 初回ロード時はlocalStorageから読み込み
  const [schedules, setSchedules] = useState<Schedule[]>(loadFromStorage(currentDate));

  // テンプレートリストの状態管理
  const [templates, setTemplates] = useState<ScheduleTemplate[]>(loadTemplatesFromStorage());

  // 編集中のスケジュールID
  const [editingId, setEditingId] = useState<number | null>(null);

  // 編集フォームの状態
  const [editFormData, setEditFormData] = useState({
    title: '',
    startHour: '08',
    startMinute: '00',
    endHour: '09',
    endMinute: '00',
    isRequired: true,
  });

  // 新規スケジュール追加フォームの状態
  const [formData, setFormData] = useState({
    title: '',
    startHour: '08',
    startMinute: '00',
    endHour: '09',
    endMinute: '00',
    isRequired: true,
  });

  // テンプレート保存時の名前入力
  const [templateName, setTemplateName] = useState('');

  // テンプレート使用時の選択
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  // グローバルエラーハンドリング
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('グローバルエラー:', event.error);
      alert(`予期しないエラーが発生しました。\n\nエラー詳細: ${event.error?.message || '不明なエラー'}`);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('未処理のPromise拒否:', event.reason);
      alert(`非同期処理でエラーが発生しました。\n\nエラー詳細: ${event.reason?.message || event.reason}`);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // 日付が変更されたらスケジュールを読み込み
  useEffect(() => {
    setSchedules(loadFromStorage(currentDate));
  }, [currentDate]);

  // スケジュールを localStorage に保存
  useEffect(() => {
    saveToStorage(schedules, currentDate);
  }, [schedules, currentDate]);

  // テンプレート保存
  useEffect(() => {
    saveTemplatesToStorage(templates);
  }, [templates]);

  // スケジュール追加ハンドラー
  const handleAddSchedule = () => {
    try {
      // バリデーション：タイトルが空でないか、時間が正しいか確認
      const startTime = `${formData.startHour}:${formData.startMinute}`;
      const endTime = `${formData.endHour}:${formData.endMinute}`;

      if (formData.title.trim() === '' || startTime >= endTime) {
        alert('正しい情報を入力してください');
        return;
      }

      // 新しいスケジュールオブジェクト作成
      const newSchedule: Schedule = {
        id: schedules.length > 0 ? Math.max(...schedules.map(s => s.id)) + 1 : 1,
        title: formData.title.trim(),
        startTime: startTime,
        endTime: endTime,
        completed: false,
        progress: 0,
        notes: '',
        isRequired: formData.isRequired,
      };

      // 状態更新
      setSchedules(prevSchedules => [...prevSchedules, newSchedule]);

      // フォームをリセット（前回の終了時間を新開始時間に、そこから+1時間を終了時間に）
      const newStartHour = formData.endHour;
      const newStartMinute = formData.endMinute;

      // 終了時間の計算（安全にparseIntを使用）
      let parsedEndHour = parseInt(formData.endHour);
      if (isNaN(parsedEndHour)) {
        parsedEndHour = 9; // デフォルト値
      }
      let newEndHour = parsedEndHour + 1;

      // 23時を超える場合は23時で止める
      if (newEndHour > 23) {
        newEndHour = 23;
      }

      setFormData({
        title: '',
        startHour: newStartHour,
        startMinute: newStartMinute,
        endHour: newEndHour.toString().padStart(2, '0'),
        endMinute: formData.endMinute,
        isRequired: true,
      });
    } catch (error) {
      console.error('スケジュール追加エラー:', error);
      alert(`スケジュールの追加に失敗しました。\n\nエラー詳細: ${getErrorMessage(error)}`);
    }
  };

  // スケジュール削除ハンドラー
  const handleDeleteSchedule = (id: number) => {
    setSchedules(prevSchedules => prevSchedules.filter(s => s.id !== id));
  };

  // スケジュール編集開始ハンドラー
  const handleEditSchedule = (id: number) => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return;

    const [startHour, startMinute] = schedule.startTime.split(':');
    const [endHour, endMinute] = schedule.endTime.split(':');

    setEditFormData({
      title: schedule.title,
      startHour,
      startMinute,
      endHour,
      endMinute,
      isRequired: schedule.isRequired,
    });
    setEditingId(id);
  };

  // スケジュール編集保存ハンドラー
  const handleSaveEdit = () => {
    if (editingId === null) return;

    const startTime = `${editFormData.startHour}:${editFormData.startMinute}`;
    const endTime = `${editFormData.endHour}:${editFormData.endMinute}`;

    if (editFormData.title.trim() === '' || startTime >= endTime) {
      alert('正しい情報を入力してください');
      return;
    }

    setSchedules(prevSchedules =>
      prevSchedules.map(s =>
        s.id === editingId
          ? {
            ...s,
            title: editFormData.title.trim(),
            startTime,
            endTime,
            isRequired: editFormData.isRequired,
          }
          : s
      )
    );
    setEditingId(null);
  };

  // スケジュール編集キャンセルハンドラー
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  // 完了状態切り替えハンドラー
  const handleToggleCompleted = (id: number) => {
    setSchedules(prevSchedules =>
      prevSchedules.map(s =>
        s.id === id ? { ...s, completed: !s.completed, progress: 0 } : s
      )
    );
  };

  // 進捗率更新ハンドラー
  const handleUpdateProgress = (id: number, progress: number) => {
    setSchedules(prevSchedules =>
      prevSchedules.map(s =>
        s.id === id ? { ...s, progress: Math.min(100, Math.max(0, progress)) } : s
      )
    );
  };

  // テンプレート保存ハンドラー
  const handleSaveTemplate = () => {
    if (templateName.trim() === '' || schedules.length === 0) {
      alert('テンプレート名を入力し、スケジュールを追加してください');
      return;
    }

    const newTemplate: ScheduleTemplate = {
      id: templates.length > 0 ? Math.max(...templates.map(t => t.id)) + 1 : 1,
      name: templateName.trim(),
      schedules: schedules.map(({ id, ...rest }) => rest), // idを除去
    };

    setTemplates(prevTemplates => [...prevTemplates, newTemplate]);
    setTemplateName('');
    alert('テンプレートを保存しました！');
  };

  // テンプレート使用ハンドラー
  const handleUseTemplate = () => {
    if (selectedTemplate === null) {
      alert('テンプレートを選択してください');
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    // テンプレートからスケジュールを生成（新しいIDを付与）
    const newSchedules: Schedule[] = template.schedules.map((schedule, index) => ({
      ...schedule,
      id: schedules.length > 0 ? Math.max(...schedules.map(s => s.id)) + index + 1 : index + 1,
    }));

    setSchedules(prevSchedules => [...prevSchedules, ...newSchedules]);
    setSelectedTemplate(null);
    alert('テンプレートを適用しました！');
  };

  // アーカイブ保存ハンドラー
  const handleArchiveSave = () => {
    saveArchive(schedules, currentDate);
  };

  // アーカイブ読み込みハンドラー
  const handleArchiveLoad = () => {
    const archivedSchedules = loadArchive(currentDate);
    if (archivedSchedules.length > 0) {
      setSchedules(archivedSchedules);
    }
  };

  // 時間でソート（開始時間順）
  const sortedSchedules = [...schedules].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="schedule-app">
      <h1>📅 Daily Schedule</h1>

      {/* 日付選択 */}
      <div className="date-selector">
        <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000))} className="date-nav-btn">
          ◀ 前日
        </button>
        <input
          type="date"
          value={formatDateKey(currentDate)}
          onChange={(e) => setCurrentDate(new Date(e.target.value))}
          className="date-input"
        />
        <button onClick={() => setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000))} className="date-nav-btn">
          翌日 ▶
        </button>
        <button onClick={() => setCurrentDate(new Date())} className="today-btn">
          今日
        </button>
      </div>

      {/* アーカイブ機能 */}
      <div className="archive-section">
        <button onClick={handleArchiveSave} className="archive-save-btn">
          アーカイブ保存
        </button>
        <button onClick={handleArchiveLoad} className="archive-load-btn">
          アーカイブ読み込み
        </button>
      </div>

      <div className="app-layout">
        {/* 左側：入力・テンプレートエリア */}
        <div className="left-panel">
          {/* スケジュール追加フォーム */}
          <div className="schedule-form">
            <h2>新しいタスクを追加</h2>
            <div className="form-group">
              <label htmlFor="title">タスク名</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例: VSCode + Copilot"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">開始時間</label>
                <div className="time-input-group">
                  <select
                    id="startHour"
                    value={formData.startHour}
                    onChange={(e) => {
                      const next = getNextHourTime(e.target.value, formData.startMinute);
                      setFormData({
                        ...formData,
                        startHour: e.target.value,
                        endHour: next.hour,
                        endMinute: next.minute,
                      });
                    }}
                  >
                    {Array.from({ length: 16 }, (_, i) => {
                      const hour = i + 8;
                      return (
                        <option key={hour} value={hour.toString().padStart(2, '0')}>
                          {hour.toString().padStart(2, '0')}
                        </option>
                      );
                    })}
                  </select>
                  <span className="time-separator">:</span>
                  <select
                    id="startMinute"
                    value={formData.startMinute}
                    onChange={(e) => {
                      const next = getNextHourTime(formData.startHour, e.target.value);
                      setFormData({
                        ...formData,
                        startMinute: e.target.value,
                        endHour: next.hour,
                        endMinute: next.minute,
                      });
                    }}
                  >
                    <option value="00">00</option>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="endTime">終了時間</label>
                <div className="time-input-group">
                  <select
                    id="endHour"
                    value={formData.endHour}
                    onChange={(e) => setFormData({ ...formData, endHour: e.target.value })}
                  >
                    {Array.from({ length: 16 }, (_, i) => {
                      const hour = i + 8;
                      return (
                        <option key={hour} value={hour.toString().padStart(2, '0')}>
                          {hour.toString().padStart(2, '0')}
                        </option>
                      );
                    })}
                  </select>
                  <span className="time-separator">:</span>
                  <select
                    id="endMinute"
                    value={formData.endMinute}
                    onChange={(e) => setFormData({ ...formData, endMinute: e.target.value })}
                  >
                    <option value="00">00</option>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group checkbox">
              <label htmlFor="isRequired">
                <input
                  id="isRequired"
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                />
                マストタスク
              </label>
            </div>

            <button onClick={handleAddSchedule} className="add-btn">
              追加
            </button>
          </div>

          {/* テンプレート機能 */}
          <div className="template-section">
            <h3>テンプレート機能</h3>

            {/* テンプレート保存 */}
            <div className="template-save">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="テンプレート名"
              />
              <button onClick={handleSaveTemplate} className="save-template-btn">
                テンプレートとして保存
              </button>
            </div>

            {/* テンプレート使用 */}
            <div className="template-use">
              <select
                value={selectedTemplate || ''}
                onChange={(e) => setSelectedTemplate(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">テンプレートを選択</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.schedules.length}タスク)
                  </option>
                ))}
              </select>
              <button onClick={handleUseTemplate} className="use-template-btn">
                テンプレートを使用
              </button>
            </div>
          </div>
        </div>

        {/* 右側：スケジュール表示エリア */}
        <div className="right-panel">
          {/* スケジュールリスト */}
          {sortedSchedules.length === 0 ? (
            <p className="empty-message">スケジュールがありません</p>
          ) : (
            <div className="schedule-list">
              <h2>{currentDate.toLocaleDateString('ja-JP')}のスケジュール</h2>
              {sortedSchedules.map(schedule => (
                <div key={schedule.id} className={`schedule-item ${schedule.completed ? 'completed' : ''} ${schedule.isRequired ? 'must' : 'optional'}`}>
                  <div className="schedule-time">
                    <span className="time-badge">{formatTimeDisplay(schedule.startTime)}</span>
                    <span className="time-separator">-</span>
                    <span className="time-badge">{formatTimeDisplay(schedule.endTime)}</span>
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
                          value={editFormData.title}
                          onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                          className="edit-title-input"
                        />
                      ) : (
                        <h3 className="schedule-title">{schedule.title}</h3>
                      )}
                      {editingId === schedule.id ? (
                        <label className="edit-required">
                          <input
                            type="checkbox"
                            checked={editFormData.isRequired}
                            onChange={(e) => setEditFormData({ ...editFormData, isRequired: e.target.checked })}
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
                            <label>開始時間</label>
                            <div className="time-input-group">
                              <select
                                value={editFormData.startHour}
                                onChange={(e) => {
                                  const next = getNextHourTime(e.target.value, editFormData.startMinute);
                                  setEditFormData({
                                    ...editFormData,
                                    startHour: e.target.value,
                                    endHour: next.hour,
                                    endMinute: next.minute,
                                  });
                                }}
                              >
                                {Array.from({ length: 16 }, (_, i) => {
                                  const hour = i + 8;
                                  return (
                                    <option key={hour} value={hour.toString().padStart(2, '0')}>
                                      {hour.toString().padStart(2, '0')}
                                    </option>
                                  );
                                })}
                              </select>
                              <span className="time-separator">:</span>
                              <select
                                value={editFormData.startMinute}
                                onChange={(e) => {
                                  const next = getNextHourTime(editFormData.startHour, e.target.value);
                                  setEditFormData({
                                    ...editFormData,
                                    startMinute: e.target.value,
                                    endHour: next.hour,
                                    endMinute: next.minute,
                                  });
                                }}
                              >
                                <option value="00">00</option>
                                <option value="15">15</option>
                                <option value="30">30</option>
                                <option value="45">45</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>終了時間</label>
                            <div className="time-input-group">
                              <select
                                value={editFormData.endHour}
                                onChange={(e) => setEditFormData({ ...editFormData, endHour: e.target.value })}
                              >
                                {Array.from({ length: 16 }, (_, i) => {
                                  const hour = i + 8;
                                  return (
                                    <option key={hour} value={hour.toString().padStart(2, '0')}>
                                      {hour.toString().padStart(2, '0')}
                                    </option>
                                  );
                                })}
                              </select>
                              <span className="time-separator">:</span>
                              <select
                                value={editFormData.endMinute}
                                onChange={(e) => setEditFormData({ ...editFormData, endMinute: e.target.value })}
                              >
                                <option value="00">00</option>
                                <option value="15">15</option>
                                <option value="30">30</option>
                                <option value="45">45</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="edit-buttons">
                          <button onClick={handleSaveEdit} className="save-edit-btn">保存</button>
                          <button onClick={handleCancelEdit} className="cancel-edit-btn">キャンセル</button>
                        </div>
                      </div>
                    )}

                    {/* 進捗表示・入力 */}
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
                            onChange={(e) => handleUpdateProgress(schedule.id, parseInt(e.target.value))}
                            style={{
                              background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${(schedule.progress || 0)}%, #e0e0e0 ${(schedule.progress || 0)}%, #e0e0e0 100%)`
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
                          aria-label={`${schedule.title}を編集`}
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="delete-btn"
                          aria-label={`${schedule.title}を削除`}
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 統計情報 */}
          <div className="schedule-stats">
            <p>
              全タスク: {schedules.length} |
              完了: {schedules.filter(s => s.completed).length} |
              マスト: {schedules.filter(s => s.isRequired).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
