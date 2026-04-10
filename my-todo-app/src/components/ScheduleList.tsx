import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Schedule, ScheduleFormData } from '../types/schedule';
import { useCurrentTime } from '../hooks/useCurrentTime';
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
  onReorder: (fromId: number, toId: number) => void;
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
  onReorder,
}: ScheduleListProps) {
  const currentTime = useCurrentTime();
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

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
        <div
          key={schedule.id}
          draggable
          onDragStart={() => setDragId(schedule.id)}
          onDragEnd={() => { setDragId(null); setDragOverId(null); }}
          onDragOver={e => { e.preventDefault(); setDragOverId(schedule.id); }}
          onDrop={e => {
            e.preventDefault();
            if (dragId !== null && dragId !== schedule.id) {
              onReorder(dragId, schedule.id);
            }
            setDragId(null);
            setDragOverId(null);
          }}
          className={`schedule-drag-wrapper${dragId === schedule.id ? ' dragging' : ''}${dragOverId === schedule.id && dragId !== schedule.id ? ' drag-over' : ''}`}
        >
          <ScheduleItem
            schedule={schedule}
            currentTime={currentTime}
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
