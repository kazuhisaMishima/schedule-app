import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { DefaultTaskDef } from '../types/schedule';
import { BUILTIN_DEFAULTS } from '../types/schedule';
import { loadDefaultTasks, saveDefaultTasksToStorage } from '../utils/storage';

export interface UseDefaultTasksReturn {
  defaultTasks: DefaultTaskDef[];
  editingDefaults: DefaultTaskDef[];
  setEditingDefaults: Dispatch<SetStateAction<DefaultTaskDef[]>>;
  saveDefaults: () => void;
  resetDefaults: () => void;
}

export function useDefaultTasks(): UseDefaultTasksReturn {
  const [defaultTasks, setDefaultTasks] = useState<DefaultTaskDef[]>(loadDefaultTasks);
  const [editingDefaults, setEditingDefaults] = useState<DefaultTaskDef[]>(loadDefaultTasks);

  useEffect(() => {
    saveDefaultTasksToStorage(defaultTasks);
  }, [defaultTasks]);

  const saveDefaults = () => {
    setDefaultTasks(editingDefaults);
    alert('初期タスク設定を保存しました');
  };

  const resetDefaults = () => {
    setEditingDefaults(BUILTIN_DEFAULTS);
  };

  return {
    defaultTasks,
    editingDefaults,
    setEditingDefaults,
    saveDefaults,
    resetDefaults,
  };
}
