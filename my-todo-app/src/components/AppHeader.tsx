import { useRef } from 'react';
import { formatDateKey } from '../utils/storage';

interface AppHeaderProps {
  currentDate: Date;
  changeDate: (updater: Date | ((d: Date) => Date)) => void;
  totalCount: number;
  completedCount: number;
  mustCount: number;
}

export function AppHeader({ currentDate, changeDate, totalCount, completedCount, mustCount }: AppHeaderProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="app-header">
      <div className="date-nav">
        <button
          className="date-nav-btn"
          onClick={() => changeDate(d => new Date(d.getTime() - 86400000))}
        >◀</button>
        <div className="date-field-wrapper">
          <input
            ref={dateInputRef}
            type="date"
            className="date-input"
            value={formatDateKey(currentDate)}
            onChange={e => {
              const d = new Date(e.target.value + 'T00:00:00');
              if (!isNaN(d.getTime())) changeDate(d);
            }}
          />
          <span className="weekday-label">
            ({currentDate.toLocaleDateString('ja-JP', { weekday: 'short' })})
          </span>
          <button
            className="calendar-picker-btn"
            onClick={() => dateInputRef.current?.showPicker()}
            aria-label="カレンダーを開く"
          >
            📅
          </button>
        </div>
        <button
          className="date-nav-btn"
          onClick={() => changeDate(d => new Date(d.getTime() + 86400000))}
        >▶</button>
        <button className="today-btn" onClick={() => changeDate(new Date())}>今日</button>
      </div>
      <div className="stats-bar">
        <span className="stat">{totalCount} タスク</span>
        <span className="stat-sep">|</span>
        <span className="stat stat-done">{completedCount} 完了</span>
        <span className="stat-sep">|</span>
        <span className="stat">{mustCount} マスト</span>
      </div>
    </header>
  );
}
