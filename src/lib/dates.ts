const tr = 'tr-TR';

export function timeLabel(ms: number) {
  return new Date(ms).toLocaleTimeString(tr, { hour: '2-digit', minute: '2-digit' });
}

export function dayKey(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function dayLabel(ms: number) {
  const today = new Date();
  const d = new Date(ms);
  const diff = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86400000,
  );
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Dün';
  if (diff < 7) return d.toLocaleDateString(tr, { weekday: 'long' });
  return d.toLocaleDateString(tr, { day: 'numeric', month: 'long' });
}

export function relative(ms: number) {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 60) return `${min} dk önce`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} saat önce`;
  return `${dayLabel(ms).toLocaleLowerCase(tr)} ${timeLabel(ms)}`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Gece kuşu';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export function daysSince(ms: number) {
  return Math.max(0, Math.floor((Date.now() - ms) / 86400000));
}

/** Current time; kept as a helper so render-time code stays pure. */
export function now() {
  return Date.now();
}

export function todayLabel() {
  return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
}

/** Local calendar day as YYYY-MM-DD. */
export function isoDay(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Local midnight of the given time. */
export function startOfDay(ms: number) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Midnight of a YYYY-MM-DD string in local time. */
export function fromIsoDay(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).getTime();
}

export function dateLabel(ms: number) {
  return new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}
