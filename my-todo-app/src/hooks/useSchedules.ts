import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Schedule, ScheduleFormData } from '../types/schedule';
import { INITIAL_FORM_DATA } from '../types/schedule';
import { loadFromStorage, saveToStorage, loadDefaultTasks, saveArchive, loadArchive } from '../utils/storage';

const createSchedulesFromDefaults = (defs: ReturnType<typeof loadDefaultTasks>): Schedule[] =>
  defs.map((d, i) => ({
    id: i + 1,
    title: d.title,
    startTime: d.startTime,
    endTime: d.endTime,
    completed: false,
    progress: 0,
    notes: '',
    isRequired: d.isRequired,
    order: i,
  }));

const getInitialSchedules = (date: Date): Schedule[] => {
  const stored = loadFromStorage(date);
  if (stored !== null) return stored;
  return createSchedulesFromDefaults(loadDefaultTasks());
};

export interface UseSchedulesReturn {
  currentDate: Date;
  changeDate: (updater: Date | ((d: Date) => Date)) => void;
  schedules: Schedule[];
  setSchedules: Dispatch<SetStateAction<Schedule[]>>;
  sortedSchedules: Schedule[];
  completedCount: number;
  mustCount: number;
  editingId: number | null;
  setEditingId: Dispatch<SetStateAction<number | null>>;
  editForm: ScheduleFormData;
  setEditForm: Dispatch<SetStateAction<ScheduleFormData>>;
  insertAfterId: number | null;
  setInsertAfterId: Dispatch<SetStateAction<number | null>>;
  handleConfirmInsert: (form: ScheduleFormData) => void;
  handleEditSchedule: (id: number) => void;
  handleSaveEdit: () => void;
  handleDeleteSchedule: (id: number) => void;
  handleToggleCompleted: (id: number) => void;
  handleUpdateProgress: (id: number, progress: number) => void;
  handleUpdateNotes: (id: number, notes: string) => void;
  handleReorder: (fromId: number, toId: number) => void;
  handleSaveArchive: () => void;
  handleLoadArchive: () => void;
}

export function useSchedules(): UseSchedulesReturn {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>(() => getInitialSchedules(new Date()));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ScheduleFormData>(INITIAL_FORM_DATA);
  const [insertAfterId, setInsertAfterId] = useState<number | null>(null);

  useEffect(() => {
    saveToStorage(schedules, currentDate);
  }, [schedules, currentDate]);

  const changeDate = (updater: Date | ((d: Date) => Date)) => {
    const newDate = typeof updater === 'function' ? updater(currentDate) : updater;
    setCurrentDate(newDate);
    setSchedules(getInitialSchedules(newDate));
    setEditingId(null);
    setInsertAfterId(null);
  };

  const nextId = () =>
    schedules.length > 0 ? Math.max(...schedules.map(s => s.id)) + 1 : 1;

  const handleConfirmInsert = (form: ScheduleFormData) => {
    const startTime = `${form.startHour}:${form.startMinute}`;
    const endTime = `${form.endHour}:${form.endMinute}`;
    if (!form.title.trim() || startTime >= endTime) {
      alert('タイトルと正しい時間を入力してください');
      return;
    }
    const maxOrder = schedules.reduce((max, s) => Math.max(max, s.order ?? -1), -1);
    setSchedules(prev => [...prev, {
      id: nextId(),
      title: form.title.trim(),
      startTime,
      endTime,
      completed: false,
      progress: 0,
      notes: '',
      isRequired: form.isRequired,
      order: maxOrder + 1,
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

  const handleUpdateNotes = (id: number, notes: string) => {
    setSchedules(prev => prev.map(s =>
      s.id === id ? { ...s, notes } : s
    ));
  };

  const handleReorder = (fromId: number, toId: number) => {
    setSchedules(prev => {
      const sorted = [...prev].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        return a.startTime.localeCompare(b.startTime);
      });
      const fromIdx = sorted.findIndex(s => s.id === fromId);
      const toIdx = sorted.findIndex(s => s.id === toId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const reordered = [...sorted];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      return reordered.map((s, i) => ({ ...s, order: i }));
    });
  };

  const handleSaveArchive = () => {
    saveArchive(schedules, currentDate);
  };

  const handleLoadArchive = () => {
    const loaded = loadArchive(currentDate);
    if (loaded.length > 0) setSchedules(loaded);
  };

  const sortedSchedules = [...schedules].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    return a.startTime.localeCompare(b.startTime);
  });
  const completedCount = schedules.filter(s => s.completed).length;
  const mustCount = schedules.filter(s => s.isRequired).length;

  return {
    currentDate,
    changeDate,
    schedules,
    setSchedules,
    sortedSchedules,
    completedCount,
    mustCount,
    editingId,
    setEditingId,
    editForm,
    setEditForm,
    insertAfterId,
    setInsertAfterId,
    handleConfirmInsert,
    handleEditSchedule,
    handleSaveEdit,
    handleDeleteSchedule,
    handleToggleCompleted,
    handleUpdateProgress,
    handleUpdateNotes,
    handleReorder,
    handleSaveArchive,
    handleLoadArchive,
  };
}
