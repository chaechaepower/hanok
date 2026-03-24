export const SCHEDULE_DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export const getScheduleToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const getScheduleMaxDate = (today: Date) => {
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);
  return maxDate;
};

export const getDefaultScheduleTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  return { hour: now.getHours(), minute: now.getMinutes() };
};

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const getCalendarDays = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];

  for (let i = 0; i < first.getDay(); i += 1) {
    days.push(null);
  }

  for (let date = 1; date <= last.getDate(); date += 1) {
    days.push(new Date(year, month, date));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
};

export const mergeDateAndTime = (date: Date, hour: number, minute: number) => {
  const scheduled = new Date(date);
  scheduled.setHours(hour, minute, 0, 0);
  return scheduled;
};
