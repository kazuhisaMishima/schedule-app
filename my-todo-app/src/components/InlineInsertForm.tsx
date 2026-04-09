import { useState } from 'react';
import type { ScheduleFormData } from '../types/schedule';
import { INITIAL_FORM_DATA } from '../types/schedule';
import { TimeSelect } from './TimeSelect';

const getNextHourTime = (hour: string, minute: string) => {
  const h = Math.min(parseInt(hour, 10) + 1, 23);
  return { hour: h.toString().padStart(2, '0'), minute };
};

interface InlineInsertFormProps {
  onConfirm: (form: ScheduleFormData) => void;
  onCancel: () => void;
}

export function InlineInsertForm({ onConfirm, onCancel }: InlineInsertFormProps) {
  const [form, setForm] = useState<ScheduleFormData>(INITIAL_FORM_DATA);
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
