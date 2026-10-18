import type { Daily, Lab, Med, MedLog, Meal, BowelLog, SymptomLog } from './db';
import { LAB_KINDS, fmtLab } from './labs';
import { dateLabel, isoDay, startOfDay } from './dates';
import { TAGS, type Phase } from './foods';
import { lifestyleEffects, suspectFoods } from './insights';
import { adherence, scheduleLabel } from './meds';
import { foodPatterns, triggerInsights } from './tolerance';

export type ReportInput = {
  name: string;
  from: number;
  to: number;
  meals: Meal[];
  symptoms: SymptomLog[];
  bowel: BowelLog[];
  phases: { phase: Phase; started_at: number }[];
  meds: Med[];
  logs: MedLog[];
  daily: Daily[];
  /** all lab results (the report shows the window plus the value before it, for context) */
  labs?: Lab[];
};

const DAY = 86400000;
// print colours (always light, it's paper)
const C = {
  ink: '#1D2B22',
  soft: '#5E6B62',
  faint: '#9AA59D',
  line: '#E3E7DD',
  well: '#F1F3EC',
  lettuce: '#3F7F26',
  good: '#2DB357',
  warn: '#D99A00',
  bad: '#E5483D',
  apricot: '#F2A35E',
  flare: '#F26B3A',
  peri: '#6E6AF0',
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const pct = (x: number) => `%${Math.round(x * 100)}`;
const fmt1 = (x: number) => x.toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const short = (ms: number) => new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
const tone = (b: number) => (b <= 2 ? C.apricot : b <= 4 ? C.good : b === 5 ? C.warn : C.bad);

function phaseAt(phases: ReportInput['phases'], t: number): Phase {
  let p: Phase = 'remisyon';
  for (const x of phases) if (x.started_at <= t) p = x.phase;
  return p;
}

export function summarize(r: ReportInput) {
  const days: number[] = [];
  for (let d = startOfDay(r.from); d < r.to; d = startOfDay(d + DAY * 1.5)) days.push(d);
  const loggedDays = new Set([...r.bowel.map((b) => isoDay(b.at)), ...r.symptoms.map((s) => isoDay(s.at)), ...r.meals.map((m) => isoDay(m.eaten_at))]);
  const bowelDays = new Set(r.bowel.map((b) => isoDay(b.at)));
  const perDay = bowelDays.size ? r.bowel.length / bowelDays.size : 0;
  const flareDays = days.filter((d) => phaseAt(r.phases, d + DAY - 1) === 'atak').length;
  const pains = r.symptoms.map((s) => s.pain);
  const adh = adherence(r.meds, r.logs, r.from, Math.min(r.to, Date.now())); // future doses aren't missed yet
  const due = adh.reduce((a, x) => a + x.due, 0);
  const taken = adh.reduce((a, x) => a + x.taken, 0);
  return {
    days,
    loggedDays: loggedDays.size,
    perDay,
    loose: r.bowel.filter((b) => b.bristol >= 6).length,
    bloodDays: new Set(r.bowel.filter((b) => b.blood).map((b) => isoDay(b.at))).size,
    urgency: r.bowel.filter((b) => b.urgency).length,
    painAvg: pains.length ? pains.reduce((a, b) => a + b, 0) / pains.length : null,
    painMax: pains.length ? Math.max(...pains) : null,
    severeDays: new Set(r.symptoms.filter((s) => s.pain >= 4).map((s) => isoDay(s.at))).size,
    flareDays,
    adherence: due ? taken / due : null,
    adh,
    currentPhase: phaseAt(r.phases, r.to),
  };
}

const REACTION = [
  { label: 'sorunsuz', color: C.good },
  { label: 'hafif şikayet', color: C.warn },
  { label: 'belirgin şikayet', color: C.bad },
];
const weekday = (ms: number) => new Date(ms).toLocaleDateString('tr-TR', { weekday: 'short' });
const hhmm = (ms: number) => new Date(ms).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
const isTobacco = (m: Meal) => m.tags.split(',').includes('sigara');

/**
 * Day-by-day diary: every sitting with its time, what was eaten and how the patient marked it,
 * next to that day's bowel movements and highest pain. Days without any record are left out.
 */
function diaryHtml(r: ReportInput) {
  const days = new Map<string, { at: number; meals: Meal[]; bowel: BowelLog[]; pain: number | null; phase: Phase }>();
  const day = (t: number) => {
    const k = isoDay(t);
    if (!days.has(k)) days.set(k, { at: startOfDay(t), meals: [], bowel: [], pain: null, phase: phaseAt(r.phases, startOfDay(t) + DAY - 1) });
    return days.get(k)!;
  };
  for (const m of r.meals) if (m.eaten_at >= r.from && m.eaten_at < r.to) day(m.eaten_at).meals.push(m);
  for (const b of r.bowel) if (b.at >= r.from && b.at < r.to) day(b.at).bowel.push(b);
  for (const x of r.symptoms) {
    if (x.at < r.from || x.at >= r.to) continue;
    const d = day(x.at);
    d.pain = Math.max(d.pain ?? 0, x.pain);
  }
  if (!days.size) return '';

  const rows = [...days.values()]
    .sort((a, b) => a.at - b.at)
    .map((d) => {
      // one line per sitting (items eaten together share a group)
      const sittings = new Map<string, Meal[]>();
      for (const m of [...d.meals].sort((a, b) => a.eaten_at - b.eaten_at || a.id - b.id)) {
        const k = m.group_id ?? `m${m.id}`;
        sittings.set(k, [...(sittings.get(k) ?? []), m]);
      }
      const lines = [...sittings.values()]
        .map((items) => {
          const food = items.filter((m) => !isTobacco(m));
          const smoke = items.length - food.length;
          const reaction = food.find((m) => m.reaction != null)?.reaction;
          const note = food.find((m) => m.reaction_note)?.reaction_note;
          const what = [food.map((m) => esc(m.name)).join(', '), smoke ? '<span class="soft">sigara/tütün</span>' : ''].filter(Boolean).join(', ');
          const mark = !food.length
            ? ''
            : reaction != null
              ? `<span class="rx" style="color:${REACTION[reaction].color}"><i style="background:${REACTION[reaction].color}"></i>${REACTION[reaction].label}</span>`
              : '<span class="rx faint"><i class="o"></i>işaretlenmedi</span>';
          return `<div class="meal"><span class="t">${hhmm(items[0].eaten_at)}</span><span class="w">${what}${note ? ` <span class="soft">“${esc(note)}”</span>` : ''}</span>${mark}</div>`;
        })
        .join('');
      const n = d.bowel.length;
      const avgB = n ? Math.round(d.bowel.reduce((a, b) => a + b.bristol, 0) / n) : null;
      const blood = d.bowel.some((b) => b.blood);
      const bowel = n
        ? `<b>${n}</b> <span style="color:${tone(avgB!)}">B${avgB}</span>${blood ? ' <span style="color:' + C.bad + '">kan</span>' : ''}`
        : '<span class="faint">–</span>';
      const pain = d.pain == null ? '<span class="faint">–</span>' : `<b style="color:${d.pain >= 4 ? C.bad : d.pain >= 2 ? C.warn : C.ink}">${d.pain}</b>`;
      return `<tr class="avoid"><td class="d"><b>${short(d.at)}</b> <span class="soft">${weekday(d.at)}</span>${d.phase === 'atak' ? `<div style="color:${C.flare};font-weight:600">atak</div>` : ''}</td><td>${lines || '<span class="faint">yemek kaydı yok</span>'}</td><td class="num">${bowel}</td><td class="num">${pain}</td></tr>`;
    })
    .join('');

  return `<h2 class="break">Beslenme ve semptom günlüğü</h2>
  <p class="soft" style="margin:0 0 6px">Gün gün yenenler, hastanın her öğün için işaretlediği tepki, o günkü tuvalet sayısı (B: ortalama Bristol tipi) ve en yüksek karın ağrısı (0–5). Kayıt olmayan günler gösterilmedi.</p>
  <table class="diary">
    <thead><tr><th style="width:62px">Gün</th><th>Öğünler ve tepki</th><th class="num" style="width:64px">Tuvalet</th><th class="num" style="width:34px">Ağrı</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

/** Lab results and weight: last value in the window, change from the one before, every value in the window. */
function labsHtml(r: ReportInput) {
  const labs = r.labs ?? [];
  const rows = LAB_KINDS.map((k) => {
    const all = labs.filter((l) => l.kind === k.key).sort((a, b) => a.at - b.at);
    const inside = all.filter((l) => l.at >= r.from && l.at < r.to);
    if (!inside.length) return '';
    const last = inside[inside.length - 1];
    const before = all.filter((l) => l.at < last.at).pop();
    const change = before ? `${last.value >= before.value ? '+' : '−'}${fmtLab(k.key, Math.abs(last.value - before.value))} <span class="soft">(${short(before.at)}'e göre)</span>` : '<span class="soft">–</span>';
    const series = inside.map((l) => `${short(l.at)}: ${fmtLab(k.key, l.value)}`).join(' · ');
    return `<tr><td>${esc(k.label)}</td><td class="num"><b>${fmtLab(k.key, last.value)}</b> <span class="soft">${short(last.at)}</span></td><td>${change}</td><td class="soft">${series}</td></tr>`;
  }).join('');
  const days = r.daily.filter((d) => d.day >= isoDay(r.from) && d.day < isoDay(r.to));
  const fevers = days.filter((d) => d.temp != null);
  const water = days.map((d) => d.water).filter((x): x is number => x != null);
  const extra = [
    fevers.length ? `Ateş kaydedilen gün: ${fevers.length} (en yüksek ${fmt1(Math.max(...fevers.map((d) => d.temp!)))} °C)` : '',
    water.length ? `Günlük ortalama sıvı: ${fmt1(water.reduce((a, b) => a + b, 0) / water.length)} bardak (${water.length} gün)` : '',
  ].filter(Boolean);
  if (!rows && !extra.length) return '';
  return `<div class="avoid"><h2>Tahliller, kilo ve genel durum</h2>
  ${rows ? `<table><tr><th>Ölçüm</th><th class="num">Son değer</th><th>Değişim</th><th>Dönem içindeki değerler</th></tr>${rows}</table>` : ''}
  ${extra.length ? `<p class="soft" style="margin-top:6px">${extra.join('. ')}.</p>` : ''}</div>`;
}

export function reportHtml(r: ReportInput) {
  const s = summarize(r);
  const rangeDays = s.days.length;

  // ----- daily strip -----
  const byDay = new Map<string, { n: number; bristol: number; blood: boolean; pain: number | null }>();
  for (const b of r.bowel) {
    const k = isoDay(b.at);
    const cur = byDay.get(k) ?? { n: 0, bristol: 0, blood: false, pain: null };
    cur.n++;
    cur.bristol += b.bristol;
    cur.blood ||= !!b.blood;
    byDay.set(k, cur);
  }
  for (const x of r.symptoms) {
    const k = isoDay(x.at);
    const cur = byDay.get(k) ?? { n: 0, bristol: 0, blood: false, pain: null };
    cur.pain = Math.max(cur.pain ?? 0, x.pain);
    byDay.set(k, cur);
  }
  const maxN = Math.max(3, ...[...byDay.values()].map((d) => d.n));
  const colW = `${(100 / rangeDays).toFixed(3)}%`;
  const bars = s.days
    .map((d) => {
      const v = byDay.get(isoDay(d));
      const h = v?.n ? Math.max(6, (v.n / maxN) * 70) : 2;
      const c = v?.n ? tone(Math.round(v.bristol / v.n)) : C.line;
      return `<div class="col" style="width:${colW}"><div class="bar" style="height:${h}px;background:${c}">${v?.blood ? '<i></i>' : ''}</div></div>`;
    })
    .join('');
  const painStrip = s.days
    .map((d) => {
      const p = byDay.get(isoDay(d))?.pain;
      const c = p == null ? C.well : p >= 4 ? C.bad : p >= 2 ? C.peri : '#C9C7FA';
      return `<div class="cell" style="width:${colW};background:${c}"></div>`;
    })
    .join('');
  const phaseStrip = s.days
    .map((d) => `<div class="cell" style="width:${colW};background:${phaseAt(r.phases, d + DAY - 1) === 'atak' ? C.flare : '#CFE6BC'}"></div>`)
    .join('');
  const ticks = s.days
    .map((d, i) => (i % (rangeDays > 45 ? 14 : 7) === 0 ? `<span style="left:${((i / rangeDays) * 100).toFixed(2)}%">${short(d)}</span>` : ''))
    .join('');

  // ----- bristol distribution -----
  const bristolCounts = [1, 2, 3, 4, 5, 6, 7].map((t) => r.bowel.filter((b) => b.bristol === t).length);
  const bMax = Math.max(1, ...bristolCounts);
  const bristolRows = bristolCounts
    .map(
      (n, i) =>
        `<tr><td class="lbl">Tip ${i + 1}</td><td style="width:75%"><div class="hbar"><div style="width:${(n / bMax) * 100}%;background:${tone(i + 1)}"></div></div></td><td class="num">${n}</td></tr>`,
    )
    .join('');

  // ----- symptoms -----
  const avg = (k: 'pain' | 'bloating' | 'gas' | 'fatigue') =>
    r.symptoms.length ? fmt1(r.symptoms.reduce((a, x) => a + x[k], 0) / r.symptoms.length) : '–';
  const maxOf = (k: 'pain' | 'bloating' | 'gas' | 'fatigue') => (r.symptoms.length ? String(Math.max(...r.symptoms.map((x) => x[k]))) : '–');

  // ----- meds -----
  const medRows = s.adh.length
    ? s.adh
        .map(
          (a) =>
            `<tr><td><b>${esc(a.med.name)}</b>${a.med.dose ? ` <span class="soft">${esc(a.med.dose)}</span>` : ''}${a.med.active ? '' : ' <span class="soft">(bırakıldı)</span>'}</td><td class="soft">${esc(scheduleLabel(a.med))}</td><td class="num">${a.taken}/${a.due}</td><td class="num"><b style="color:${a.taken / a.due >= 0.9 ? C.good : a.taken / a.due >= 0.7 ? C.warn : C.bad}">${pct(a.taken / a.due)}</b></td></tr>`,
        )
        .join('')
    : `<tr><td colspan="4" class="soft">Bu dönemde ilaç kaydı yok.</td></tr>`;

  // ----- triggers -----
  const food = r.meals.filter((m) => !isTobacco(m));
  const rated = food.filter((m) => m.reaction != null);
  const smokeDays = new Set(r.meals.filter(isTobacco).map((m) => isoDay(m.eaten_at))).size;
  const byReaction = [0, 1, 2].map((v) => rated.filter((m) => m.reaction === v).length);
  const foodSummary = [
    `${food.length} yemek kaydı: ${byReaction[0]} sorunsuz, ${byReaction[1]} hafif şikayet, ${byReaction[2]} belirgin şikayet, ${food.length - rated.length} işaretlenmedi.`,
    smokeDays ? `Sigara/tütün ${smokeDays} gün kaydedildi.` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const { triggers } = triggerInsights(rated);
  const suspects = suspectFoods(food, r.symptoms, r.bowel).foods;
  const patterns = foodPatterns(rated);
  // only mention stress/sleep when the difference is worth a doctor's attention
  const life = lifestyleEffects(r.daily.filter((d) => d.day >= isoDay(r.from) && d.day <= isoDay(r.to)), r.symptoms, r.bowel, r.meals).filter(
    (e) => Math.abs(e.high - e.low) >= 0.15,
  );

  const li = (items: string[]) => (items.length ? `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>` : '<p class="soft">Yeterli kayıt yok.</p>');

  // ----- stress & sleep averages -----
  const dailyIn = r.daily.filter((d) => d.day >= isoDay(r.from) && d.day <= isoDay(r.to));
  const stressVals = dailyIn.map((d) => d.stress).filter((x): x is number => x != null);
  const sleepH = dailyIn.map((d) => d.sleep_h).filter((x): x is number => x != null);
  const STRESS = ['sakin', 'normal', 'gergin', 'çok stresli'];

  // ----- notes -----
  const notes = [
    ...r.symptoms.filter((x) => x.note).map((x) => ({ at: x.at, t: `Semptom: ${x.note}` })),
    ...r.bowel.filter((x) => x.note).map((x) => ({ at: x.at, t: `Tuvalet: ${x.note}` })),
    ...dailyIn.filter((d) => d.note).map((d) => ({ at: new Date(`${d.day}T12:00:00`).getTime(), t: `Gün: ${d.note}` })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 20);

  const tile = (label: string, value: string, sub = '', color = C.ink) =>
    `<div class="tile"><div class="tl">${label}</div><div class="tv" style="color:${color}">${value}</div><div class="ts">${sub}</div></div>`;

  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>
  @page { margin: 28px 30px; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'SF Pro Text', Helvetica, Arial, sans-serif; color: ${C.ink}; font-size: 10.5px; line-height: 1.45; margin: 0; }
  h1 { font-size: 20px; margin: 0; letter-spacing: -0.2px; }
  h2 { page-break-after: avoid; font-size: 12.5px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 1px solid ${C.line}; color: ${C.lettuce}; text-transform: uppercase; letter-spacing: 0.6px; }
  .head { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid ${C.ink}; padding-bottom: 8px; }
  .soft { color: ${C.soft}; } .faint { color: ${C.faint}; }
  .tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .tile { border: 1px solid ${C.line}; border-radius: 8px; padding: 7px 9px; }
  .tl { font-size: 9px; color: ${C.soft}; text-transform: uppercase; letter-spacing: 0.4px; }
  .tv { font-size: 18px; font-weight: 700; margin-top: 2px; }
  .ts { font-size: 9px; color: ${C.faint}; min-height: 12px; }
  .chart { position: relative; }
  .bars { display: flex; align-items: flex-end; height: 72px; border-bottom: 1px solid ${C.line}; }
  .col { display: flex; justify-content: center; }
  .bar { width: 72%; border-radius: 2px 2px 0 0; position: relative; }
  .bar i { position: absolute; top: -6px; left: 50%; margin-left: -2px; width: 4px; height: 4px; border-radius: 2px; background: ${C.bad}; }
  .strip { display: flex; height: 9px; margin-top: 3px; }
  .cell { border-right: 1px solid #fff; }
  .ticks { position: relative; height: 14px; margin-top: 3px; }
  .ticks span { position: absolute; font-size: 8.5px; color: ${C.faint}; }
  .rowlbl { font-size: 8.5px; color: ${C.soft}; margin-top: 6px; }
  .legend { display: flex; gap: 12px; flex-wrap: wrap; font-size: 9px; color: ${C.soft}; margin-top: 6px; }
  .legend b { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; vertical-align: -1px; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 4px 6px; border-bottom: 1px solid ${C.line}; text-align: left; vertical-align: top; }
  th { font-size: 9px; color: ${C.soft}; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 600; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  td.lbl { width: 50px; color: ${C.soft}; }
  .hbar { height: 8px; background: ${C.well}; border-radius: 4px; overflow: hidden; } .hbar div { height: 100%; border-radius: 4px; }
  .cols { display: flex; gap: 18px; } .cols > div { flex: 1; }
  ul { margin: 4px 0 0; padding-left: 16px; } li { margin: 2px 0; }
  .note { font-size: 9px; color: ${C.faint}; margin-top: 18px; border-top: 1px solid ${C.line}; padding-top: 8px; }
  .avoid { page-break-inside: avoid; }
  .break { page-break-before: always; margin-top: 0; }
  thead { display: table-header-group; }
  .diary td { padding: 5px 6px; }
  .diary td.d { white-space: nowrap; }
  .meal { display: flex; gap: 8px; align-items: baseline; padding: 1px 0; }
  .meal .t { color: ${C.faint}; width: 30px; flex: none; font-variant-numeric: tabular-nums; }
  .meal .w { flex: 1; }
  .rx { flex: none; font-size: 9px; font-weight: 600; white-space: nowrap; }
  .rx i { display: inline-block; width: 6px; height: 6px; border-radius: 3px; margin-right: 4px; vertical-align: 1px; }
  .rx i.o { border: 1px solid ${C.faint}; width: 4px; height: 4px; }
  </style></head><body>
  <div class="head">
    <div>
      <div class="soft" style="font-size:9px;letter-spacing:0.6px;text-transform:uppercase">Crohnic · Hasta takip özeti</div>
      <h1>${esc(r.name || 'Hasta')}</h1>
    </div>
    <div style="text-align:right">
      <b>${dateLabel(r.from)} – ${dateLabel(r.to - 1)}</b>
      <div class="soft">${rangeDays} gün · ${s.loggedDays} günde kayıt var · Hazırlandı: ${dateLabel(Date.now())}</div>
    </div>
  </div>

  <h2>Özet</h2>
  <div class="tiles">
    ${tile('Şu anki dönem', s.currentPhase === 'atak' ? 'Atak' : 'Remisyon', `${s.flareDays} gün atak`, s.currentPhase === 'atak' ? C.flare : C.lettuce)}
    ${tile('Tuvalet / gün', s.perDay ? fmt1(s.perDay) : '–', `${r.bowel.length} kayıt`)}
    ${tile('Sulu (Tip 6–7)', String(s.loose), r.bowel.length ? pct(s.loose / r.bowel.length) : '', s.loose ? C.bad : C.ink)}
    ${tile('Kanlı gün', String(s.bloodDays), `${s.urgency} kez aciliyet`, s.bloodDays ? C.bad : C.ink)}
    ${tile('Karın ağrısı', s.painAvg != null ? `${fmt1(s.painAvg)}/5` : '–', s.painMax != null ? `en yüksek ${s.painMax} · ${s.severeDays} şiddetli gün` : '')}
    ${tile('İlaç uyumu', s.adherence != null ? pct(s.adherence) : '–', s.adh.length ? `${s.adh.length} ilaç` : 'kayıt yok', s.adherence == null ? C.ink : s.adherence >= 0.9 ? C.good : s.adherence >= 0.7 ? C.warn : C.bad)}
  </div>

  <div class="chart avoid">
  <h2>Günlük seyir</h2>
    <div class="rowlbl">Tuvalet sayısı (renk: ortalama Bristol, kırmızı nokta: kan)</div>
    <div class="bars">${bars}</div>
    <div class="rowlbl">En yüksek karın ağrısı</div>
    <div class="strip">${painStrip}</div>
    <div class="rowlbl">Dönem</div>
    <div class="strip">${phaseStrip}</div>
    <div class="ticks">${ticks}</div>
    <div class="legend">
      <span><b style="background:${C.good}"></b>Bristol 3–4</span><span><b style="background:${C.apricot}"></b>1–2 sert</span>
      <span><b style="background:${C.warn}"></b>5</span><span><b style="background:${C.bad}"></b>6–7 sulu</span>
      <span><b style="background:#C9C7FA"></b>Ağrı 0–1</span><span><b style="background:${C.peri}"></b>2–3</span><span><b style="background:${C.bad}"></b>4–5</span>
      <span><b style="background:#CFE6BC"></b>Remisyon</span><span><b style="background:${C.flare}"></b>Atak</span>
    </div>
  </div>

  <div class="cols avoid">
    <div>
      <h2>Bristol dağılımı</h2>
      <table>${bristolRows}</table>
    </div>
    <div>
      <h2>Semptomlar (0–5)</h2>
      <table>
        <tr><th></th><th class="num">Ortalama</th><th class="num">En yüksek</th></tr>
        <tr><td>Karın ağrısı</td><td class="num">${avg('pain')}</td><td class="num">${maxOf('pain')}</td></tr>
        <tr><td>Şişkinlik</td><td class="num">${avg('bloating')}</td><td class="num">${maxOf('bloating')}</td></tr>
        <tr><td>Gaz</td><td class="num">${avg('gas')}</td><td class="num">${maxOf('gas')}</td></tr>
        <tr><td>Yorgunluk</td><td class="num">${avg('fatigue')}</td><td class="num">${maxOf('fatigue')}</td></tr>
      </table>
      <p class="soft" style="margin:6px 0 0">${r.symptoms.length} semptom kaydı.${stressVals.length ? ` Ortalama stres: ${STRESS[Math.round(stressVals.reduce((a, b) => a + b, 0) / stressVals.length)]}.` : ''}${sleepH.length ? ` Ortalama uyku: ${fmt1(sleepH.reduce((a, b) => a + b, 0) / sleepH.length)} saat.` : ''}</p>
    </div>
  </div>

  ${labsHtml(r)}

  <div class="avoid">
  <h2>İlaçlar</h2>
  <table>
    <tr><th>İlaç</th><th>Kullanım</th><th class="num">Alınan</th><th class="num">Uyum</th></tr>
    ${medRows}
  </table>
  </div>

  <div class="avoid">
  <h2>Beslenme ve olası tetikleyiciler</h2>
  <div class="cols">
    <div>
      <b>Şikayetle ilişkili içerikler</b>
      ${li(triggers.slice(0, 6).map((t) => `${esc(TAGS[t.tag].label)} <span class="soft">(${t.stat.n} kayıtta ${t.stat.mild + t.stat.bad} kez)</span>`))}
      <b style="display:block;margin-top:8px">Şikayetten 2–24 saat önce sık yenenler</b>
      ${li(suspects.map((f) => `${esc(f.name)} <span class="soft">(${f.hit}/${f.n})</span>`))}
    </div>
    <div>
      <b>Çoğu zaman şikayet yaptığını işaretlediği yemekler</b>
      ${li(patterns.dokunan.slice(0, 8).map((x) => `${esc(x.name)} <span class="soft">(${x.hits}/${x.n}${x.note ? `, ${esc(x.note)}` : ''})</span>`))}
      ${patterns.bazen.length ? `<b style="display:block;margin-top:8px">Ara sıra şikayet yaptığı yemekler</b>${li(patterns.bazen.slice(0, 6).map((x) => `${esc(x.name)} <span class="soft">(${x.hits}/${x.n}${x.note ? `, ${esc(x.note)}` : ''})</span>`))}` : ''}
      <b style="display:block;margin-top:8px">Sorunsuz yediği yemekler</b>
      ${li(patterns.dokunmayan.slice(0, 8).map((x) => `${esc(x.name)} <span class="soft">(${x.n} kez)</span>`))}
    </div>
  </div>
  ${
    life.length
      ? `<p style="margin-top:8px">${life
          .map((e) => `<b>${e.label}:</b> ${e.highLabel.toLowerCase()} şikayet oranı ${pct(e.high)}, ${e.lowLabel.toLowerCase()} ${pct(e.low)}.`)
          .join(' ')}</p>`
      : ''
  }
  <p class="soft">${foodSummary}</p>
  </div>

  ${notes.length ? `<h2>Notlar</h2><table>${notes.map((n) => `<tr><td class="soft" style="width:70px;white-space:nowrap">${short(n.at)}</td><td>${esc(n.t)}</td></tr>`).join('')}</table>` : ''}

  ${diaryHtml(r)}

  <div class="note">Bu özet, hastanın Crohnic uygulamasında kendi tuttuğu kayıtlardan otomatik oluşturulmuştur. İlişkiler istatistiksel eğilimdir, tanı ya da tedavi önerisi değildir.</div>
  </body></html>`;
}
