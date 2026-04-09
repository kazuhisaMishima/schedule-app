import type { Dispatch, SetStateAction } from 'react';
import type { Schedule, ScheduleFormData } from '../types/schedule';
import { InlineInsertForm } from './InlineInsertForm';
import { ScheduleItem } from './ScheduleItem';

interface ScheduleListProps {
  sortedSchedules: Schedule[];
  insertAfterId: number | null;
  setInsertAfterId: Dispatch<SetStateAction<number | null>>;
  onConfirmInsert: (form: ScheduleFormData) => void;
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

export function ScheduleList({
  sortedSchedules,
  insertAfterId,
  setInsertAfterId,
  onConfirmInsert,
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
}: ScheduleListProps) {
  return (
    <div className="schedule-list">
      {insertAfterId === -1 ? (
        <InlineInsertForm
          onConfirm={onConfirmInsert}
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
          <ScheduleItem
            schedule={schedule}
            editingId={editingId}
            editForm={editForm}
            setEditForm={setEditForm}
            onToggleCompleted={onToggleCompleted}
            onUpdateProgress={onUpdateProgress}
            onEditSchedule={onEditSchedule}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onDeleteSchedule={onDeleteSchedule}
            onUpdateNotes={onUpdateNotes}
          />
          {insertAfterId === schedule.id ? (
            <InlineInsertForm
              onConfirm={onConfirmInsert}
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
  );
}
