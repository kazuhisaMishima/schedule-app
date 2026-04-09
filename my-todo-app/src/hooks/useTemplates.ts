import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Schedule, ScheduleTemplate } from '../types/schedule';
import { loadTemplatesFromStorage, saveTemplatesToStorage } from '../utils/storage';

export interface UseTemplatesReturn {
  templates: ScheduleTemplate[];
  templateName: string;
  setTemplateName: Dispatch<SetStateAction<string>>;
  handleSaveTemplate: (schedules: Schedule[]) => void;
  handleApplyTemplate: (template: ScheduleTemplate, setSchedules: Dispatch<SetStateAction<Schedule[]>>, schedules: Schedule[]) => void;
  handleDeleteTemplate: (id: number) => void;
}

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>(loadTemplatesFromStorage);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    saveTemplatesToStorage(templates);
  }, [templates]);

  const handleSaveTemplate = (schedules: Schedule[]) => {
    if (!templateName.trim() || schedules.length === 0) {
      alert('テンプレート名を入力し、スケジュールを追加してください');
      return;
    }
    setTemplates(prev => [...prev, {
      id: prev.length > 0 ? Math.max(...prev.map(t => t.id)) + 1 : 1,
      name: templateName.trim(),
      schedules: schedules.map(s => ({
        title: s.title,
        startTime: s.startTime,
        endTime: s.endTime,
        completed: s.completed,
        progress: s.progress,
        notes: s.notes,
        isRequired: s.isRequired,
      })),
    }]);
    setTemplateName('');
    alert('テンプレートを保存しました！');
  };

  const handleApplyTemplate = (
    template: ScheduleTemplate,
    setSchedules: Dispatch<SetStateAction<Schedule[]>>,
    schedules: Schedule[],
  ) => {
    const base = schedules.length > 0 ? Math.max(...schedules.map(s => s.id)) : 0;
    setSchedules(prev => [...prev, ...template.schedules.map((s, i) => ({
      ...s, id: base + i + 1,
    }))]);
    alert('テンプレートを適用しました！');
  };

  const handleDeleteTemplate = (id: number) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return {
    templates,
    templateName,
    setTemplateName,
    handleSaveTemplate,
    handleApplyTemplate,
    handleDeleteTemplate,
  };
}
