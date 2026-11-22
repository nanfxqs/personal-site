export type JournalDatePrecision = 'day' | 'minute';

export interface JournalDateInput {
  date: Date;
  datePrecision?: JournalDatePrecision;
}

const beijingFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function getBeijingParts(date: Date) {
  const parts = beijingFormatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
  };
}

export function formatJournalDate(
  date: Date,
  precision: JournalDatePrecision = 'day',
): string {
  const { year, month, day, hour, minute } = getBeijingParts(date);
  if (precision === 'minute') {
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
  return `${year}-${month}-${day}`;
}

export function formatJournalDateTimeAttr(
  date: Date,
  precision: JournalDatePrecision = 'day',
): string {
  const { year, month, day, hour, minute } = getBeijingParts(date);
  if (precision === 'minute') {
    return `${year}-${month}-${day}T${hour}:${minute}+08:00`;
  }
  return `${year}-${month}-${day}`;
}

export function getJournalSortTimestamp(
  date: Date,
  precision: JournalDatePrecision = 'day',
): number {
  if (precision === 'minute') {
    return date.getTime();
  }
  const { year, month, day } = getBeijingParts(date);
  return Date.parse(`${year}-${month}-${day}T00:00:00+08:00`);
}

export function compareJournalPosts<
  T extends { id: string; data: JournalDateInput },
>(a: T, b: T): number {
  const diff =
    getJournalSortTimestamp(b.data.date, b.data.datePrecision) -
    getJournalSortTimestamp(a.data.date, a.data.datePrecision);
  if (diff !== 0) return diff;
  return b.id.localeCompare(a.id);
}
