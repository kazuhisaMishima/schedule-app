import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Schedule, ScheduleFormData } from '../types/schedule';
import { TimeSelect } from './TimeSelect';

const getNextHourTime = (hour: string, minute: string) => {
  const h = Math.min(parseInt(hour, 10) + 1, 23);
  return { hour: h.toString().padStart(2, '0'), minute };
};

interface ScheduleItemProps {
  schedule: Schedule;
  editingId: number | null;
  editForm: ScheduleFormData;
  setEditForm: Dispatch<SetStateAction<ScheduleFormData>>;
  onToggleCompleted: (id: number) => void;
  onUpdateProgress: (id: number, progress: number) => void;
  onEditSchedule: (id: number) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteSchedule: (id: number) => void;
  onUpdateNotes: (id: number, notes: string) => void;
}

export function ScheduleItem({
  schedule,
  editingId,
  editForm,
  setEditForm,
  onToggleCompleted,
  onUpdateProgress,
  onEditSchedule,
  onSaveEdit,
  onCancelEdit,
  onDeleteSchedule,
  onUpdateNotes,
}: ScheduleItemProps) {
  const isEditing = editingId === schedule.id;
  const [showNotes, setShowNotes] = useState(false);

  return (
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
            onChange={() => onToggleCompleted(schedule.id)}
            aria-label={`${schedule.title}を完了にする`}
          />
          {isEditing ? (
            <input
              type="text"
              value={editForm.title}
              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
              className="edit-title-input"
            />
          ) : (
            <h3 className="schedule-title">{schedule.title}</h3>
          )}
          {isEditing ? (
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

        {isEditing && (
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
              <button onClick={onSaveEdit} className="save-edit-btn">保存</button>
              <button onClick={onCancelEdit} className="cancel-edit-btn">キャンセル</button>
            </div>
          </div>
        )}

        {!schedule.completed && !isEditing && (
          <div className="progress-section">
            <label htmlFor={`progress-${schedule.id}`}>進捗率</label>
            <div className="progress-container">
              <input
                id={`progress-${schedule.id}`}
                type="range"
                min="0"
                max="100"
                value={schedule.progress || 0}
                onChange={e => onUpdateProgress(schedule.id, parseInt(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${schedule.progress || 0}%, #e0e0e0 ${schedule.progress || 0}%, #e0e0e0 100%)`
                }}
              />
              <span className="progress-text">{schedule.progress || 0}%</span>
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="action-buttons">
            <button onClick={() => onEditSchedule(schedule.id)} className="edit-btn">編集</button>
            <button
              onClick={() => setShowNotes(v => !v)}
              className={`notes-toggle-btn${showNotes ? ' active' : ''}`}
            >メモ</button>
            <button onClick={() => onDeleteSchedule(schedule.id)} className="delete-btn">削除</button>
          </div>
        )}

        {!isEditing && showNotes && (
          <textarea
            className="notes-textarea"
            placeholder="メモを入力..."
            value={schedule.notes || ''}
            onChange={e => onUpdateNotes(schedule.id, e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
