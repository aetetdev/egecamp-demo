/**
 * Panel grafikleri.
 *
 * Renk sırası doğrulandı (dataviz validate_palette, beyaz zemin): kategorik
 * sıralı 6 renk; komşu çiftlerde renk körlüğü ayrımı ΔE ≥ 17. Üç renk 3:1
 * altında kaldığı için her grafikte lejant + değer etiketi ya da tablo var.
 * Önceki dönem her zaman gri (vurgusuz) çizgi.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { num, tl, tlShort } from '../../lib/format'

export const SERIES = ['#e58a00', '#2a78d6', '#1baf7a', '#4a3aa7', '#e87ba4', '#008300']
export const MUTED = '#a7aba3'
const GRID = '#ece9e2'
const AXIS = { fontSize: 11, fill: '#7c8279' }

function TipBox({ title, rows }) {
  return (
    <div className="min-w-40 rounded-xl bg-white px-3 py-2.5 text-[12.5px] ring-1 ring-line card-lift-lg">
      <p className="mb-1.5 font-semibold text-char-900">{title}</p>
      {rows.map(([label, value, color]) => (
        <p key={label} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-char-500">
            {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
            {label}
          </span>
          <span className="tnum font-semibold text-char-900">{value}</span>
        </p>
      ))}
    </div>
  )
}

const compactAxis = (v) => (v >= 1e6 ? `${(v / 1e6).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} Mn` : v >= 1e3 ? `${Math.round(v / 1e3)} B` : v)

/** Ciro alanı + önceki dönem çizgisi */
export function RevenueChart({ data, metric = 'revenue', height = 280, compare = true }) {
  const prevKey = metric === 'revenue' ? 'prevRevenue' : 'prevOrders'
  const fmt = metric === 'revenue' ? tl : (v) => `${num(v)} sipariş`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.18} />
            <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: '#d9d5cc' }} minTickGap={24} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={48} tickFormatter={metric === 'revenue' ? compactAxis : undefined} allowDecimals={false} />
        <Tooltip
          cursor={{ stroke: '#cfd1cb', strokeWidth: 1 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TipBox
                title={label}
                rows={[
                  ['Bu dönem', fmt(payload[0].payload[metric]), SERIES[0]],
                  ...(compare ? [['Önceki dönem', fmt(payload[0].payload[prevKey]), MUTED]] : []),
                ]}
              />
            ) : null
          }
        />
        {compare && <Area type="monotone" dataKey={prevKey} stroke={MUTED} strokeWidth={1.5} fill="none" dot={false} activeDot={{ r: 4, fill: MUTED, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />}
        <Area type="monotone" dataKey={metric} stroke={SERIES[0]} strokeWidth={2} fill="url(#rev)" dot={false} activeDot={{ r: 5, fill: SERIES[0], stroke: '#fff', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Dikey sütunlar — aylık ciro vb. */
export function Columns({ data, dataKey = 'revenue', height = 260, color = SERIES[0], format = tl, highlightLast = true, name = 'Ciro' }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: '#d9d5cc' }} interval={0} minTickGap={4} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={48} tickFormatter={compactAxis} />
        <Tooltip cursor={{ fill: 'rgba(23,27,24,0.04)' }} content={({ active, payload, label }) => (active && payload?.length ? <TipBox title={label} rows={[[name, format(payload[0].value), color]]} /> : null)} />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={24}>
          {data.map((d, i) => (
            <Cell key={d.label} fill={color} fillOpacity={highlightLast && i !== data.length - 1 ? 0.55 : 1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Yatay çubuk listesi — HTML, etiketli (kategori, şehir, marka) */
export function BarList({ rows, format = tlShort, color = SERIES[0], max: maxProp, showShare = true }) {
  const total = rows.reduce((s, r) => s + r.value, 0)
  const max = maxProp ?? Math.max(...rows.map((r) => r.value), 1)
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="group">
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2 truncate text-char-700">
              {r.color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} />}
              <span className="truncate">{r.label}</span>
            </span>
            <span className="tnum shrink-0 font-semibold text-char-900">
              {format(r.value)}
              {showShare && total > 0 && <span className="ml-1.5 font-normal text-char-400">%{Math.round((r.value / total) * 100)}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? color }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Halka — en fazla 6 dilim, lejantta değer ve pay */
export function Donut({ rows, format = tlShort, height = 180, center, vertical = false }) {
  const total = rows.reduce((s, r) => s + r.value, 0)
  return (
    <div className={`flex flex-col items-center gap-5 ${vertical ? '' : 'sm:flex-row'}`}>
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="label" innerRadius="64%" outerRadius="100%" paddingAngle={1.5} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
              {rows.map((r, i) => (
                <Cell key={r.label} fill={r.color ?? SERIES[i % SERIES.length]} />
              ))}
            </Pie>
            <Tooltip content={({ active, payload }) => (active && payload?.length ? <TipBox title={payload[0].name} rows={[['Tutar', format(payload[0].value)], ['Pay', `%${Math.round((payload[0].value / total) * 100)}`]]} /> : null)} />
          </PieChart>
        </ResponsiveContainer>
        {center && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="tnum text-lg font-bold">{center[0]}</span>
            <span className="text-[11px] text-char-400">{center[1]}</span>
          </div>
        )}
      </div>
      <ul className="w-full space-y-2">
        {rows.map((r, i) => (
          <li key={r.label} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2 text-char-700">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: r.color ?? SERIES[i % SERIES.length] }} />
              <span className="truncate">{r.label}</span>
            </span>
            <span className="tnum shrink-0 font-semibold">
              {format(r.value)} <span className="font-normal text-char-400">%{total ? Math.round((r.value / total) * 100) : 0}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Haftalık yoğunluk ısı haritası — tek renk tonu (sıralı) */
export function Heatmap({ grid }) {
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  const max = Math.max(...grid.flat(), 1)
  const hours = Array.from({ length: 24 }, (_, h) => h)
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[36rem]">
        <div className="grid grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-[3px]">
          <span />
          {hours.map((h) => (
            <span key={h} className="tnum text-center text-[10px] text-char-400">
              {h % 3 === 0 ? h : ''}
            </span>
          ))}
          {grid.map((row, d) => (
            <div key={d} className="contents">
              <span className="text-[11px] leading-5 text-char-500">{days[d]}</span>
              {row.map((v, h) => {
                const t = v / max
                return (
                  <span
                    key={h}
                    title={`${days[d]} ${h}:00 — ${v} sipariş`}
                    className="h-5 rounded-[4px]"
                    style={{ background: t === 0 ? '#f3f1ec' : `rgba(229,138,0,${0.12 + t * 0.88})` }}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-char-400">
          Az
          {[0.12, 0.34, 0.56, 0.78, 1].map((a) => (
            <span key={a} className="h-3 w-5 rounded-[3px]" style={{ background: `rgba(229,138,0,${a})` }} />
          ))}
          Çok
        </div>
      </div>
    </div>
  )
}

/** Dönüşüm hunisi — sıralı basamaklar */
export function Funnel({ steps, base }) {
  return (
    <ol className="space-y-2">
      {steps.map(([label, share], i) => {
        const next = steps[i + 1]
        return (
          <li key={label}>
            <div className="flex items-center gap-3">
              <div className="relative h-9 flex-1 overflow-hidden rounded-lg bg-mist">
                <div className="h-full rounded-lg" style={{ width: `${Math.max(share, 1.5)}%`, background: SERIES[0], opacity: 0.35 + 0.65 * (1 - i / steps.length) }} />
                <span className="absolute inset-y-0 left-3 flex items-center text-[13px] font-medium text-char-900">{label}</span>
              </div>
              <span className="tnum w-28 shrink-0 text-right text-[13px]">
                <b>{num(Math.round((base * share) / 100))}</b> <span className="text-char-400">%{share.toLocaleString('tr-TR')}</span>
              </span>
            </div>
            {next && <p className="my-1 pl-3 text-[11px] text-char-400">↓ %{Math.round((next[1] / share) * 100)} devam etti</p>}
          </li>
        )
      })}
    </ol>
  )
}
