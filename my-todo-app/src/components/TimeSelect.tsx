const HOUR_OPTIONS = Array.from({ length: 16 }, (_, i) => (i + 8).toString().padStart(2, '0'));
const MINUTE_OPTIONS = ['00', '15', '30', '45'];

interface TimeSelectProps {
  hour: string;
  minute: string;
  onHourChange: (h: string) => void;
  onMinuteChange: (m: string) => void;
  id?: string;
}

export function TimeSelect({ hour, minute, onHourChange, onMinuteChange, id }: TimeSelectProps) {
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
