import { useState, useEffect } from 'react';

const getCurrentTimeString = (): string => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

export function useCurrentTime(): string {
  const [currentTime, setCurrentTime] = useState(getCurrentTimeString);

  useEffect(() => {
    const tick = () => setCurrentTime(getCurrentTimeString());
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  return currentTime;
}
