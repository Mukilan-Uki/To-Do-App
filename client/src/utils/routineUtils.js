export const todayKey = () => new Date().toISOString().slice(0, 10);

export const parseTime = (timeStr) => {
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  return h * 60 + (m || 0);
};

export const formatTime12 = (timeStr) => {
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

export const getCurrentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

export const isHealthCategory = (cat) =>
  ['health', 'workout', 'wellness'].includes((cat || '').toLowerCase());

export const getActiveRoutineItem = (items) => {
  if (!items?.length) return null;
  const sorted = [...items].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  const now = getCurrentMinutes();

  let active = null;
  for (let i = 0; i < sorted.length; i++) {
    const start = parseTime(sorted[i].time);
    const end = start + (sorted[i].duration || 30);
    const nextStart = sorted[i + 1] ? parseTime(sorted[i + 1].time) : 24 * 60;

    if (now >= start && now < Math.max(end, nextStart)) {
      active = sorted[i];
      break;
    }
    if (now >= start && now < end) {
      active = sorted[i];
      break;
    }
  }

  if (!active) {
    const upcoming = sorted.find((item) => parseTime(item.time) > now);
    return upcoming || sorted[sorted.length - 1];
  }
  return active;
};

export const getRoutineProgress = (items) => {
  if (!items?.length) return 0;
  const key = todayKey();
  const done = items.filter((i) => i.completedDates?.includes(key)).length;
  return Math.round((done / items.length) * 100);
};

export const isItemCompletedToday = (item) =>
  item?.completedDates?.includes(todayKey());
