'use client';

import { useSession } from 'next-auth/react';
import { SessionProvider } from 'next-auth/react';
import type { ReactElement } from 'react';

// ─── Datos simulados para el dashboard (en prod vendrían de la API) ───
const MOCK_STATS = [
  { label: 'Kg Cosechados (mes)', value: '4,820', icon: 'weight', color: 'emerald', change: '+12%', up: true },
  { label: 'Campaña Activa',      value: '2026-A', icon: 'tag',    color: 'gold',    change: 'Funda #7', up: true },
  { label: 'Lotes Activos',       value: '6',     icon: 'map',    color: 'blue',    change: '3 en cosecha', up: true },
  { label: 'Alertas de Margen',   value: '2',     icon: 'alert',  color: 'red',     change: '>4% error', up: false },
];

const MOCK_RECENT = [
  { id: '1', fecha: '2026-06-16', lote: 'L-01 Noreste', agricultor: 'Carlos Moreno', bruto: '312 kg', neto: '278 kg', estado: 'SYNCED' },
  { id: '2', fecha: '2026-06-16', lote: 'L-03 Sur',     agricultor: 'María Tipán',   bruto: '287 kg', neto: '255 kg', estado: 'PENDING' },
  { id: '3', fecha: '2026-06-15', lote: 'L-02 Centro',  agricultor: 'José Alvarado', bruto: '405 kg', neto: '363 kg', estado: 'SYNCED' },
  { id: '4', fecha: '2026-06-15', lote: 'L-01 Noreste', agricultor: 'Carlos Moreno', bruto: '298 kg', neto: '265 kg', estado: 'SYNCED' },
  { id: '5', fecha: '2026-06-14', lote: 'L-04 Este',    agricultor: 'Ana Vargas',    bruto: '189 kg', neto: '168 kg', estado: 'SYNCING' },
];

function StatIcon({ type }: { type: string }) {
  const icons: Record<string, ReactElement> = {
    weight: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    tag:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    map:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    alert:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  };
  return icons[type] ?? null;
}

function SyncBadge({ status }: { status: string }) {
  const config: Record<string, { cls: string; label: string }> = {
    SYNCED:  { cls: 'badge badge-emerald', label: 'Sincronizado' },
    PENDING: { cls: 'badge badge-gold',    label: 'Pendiente' },
    SYNCING: { cls: 'badge badge-blue',    label: 'Sincronizando' },
  };
  const c = config[status] ?? { cls: 'badge badge-gray', label: status };
  return <span className={c.cls}>{c.label}</span>;
}

// Gráfico de barras simple SVG
function BarChart() {
  const data = [
    { label: 'L-01', value: 610, color: '#10b981' },
    { label: 'L-02', value: 405, color: '#10b981' },
    { label: 'L-03', value: 287, color: '#f59e0b' },
    { label: 'L-04', value: 189, color: '#10b981' },
    { label: 'L-05', value: 320, color: '#10b981' },
    { label: 'L-06', value: 148, color: '#ef4444' },
  ];
  const max = Math.max(...data.map(d => d.value));
  const chartH = 120;

  return (
    <svg viewBox={`0 0 ${data.length * 60} ${chartH + 30}`} style={{ width: '100%', height: '160px' }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * chartH;
        const x = i * 60 + 10;
        const y = chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={40} height={barH} fill={d.color} opacity={0.8} rx={4} />
            <text x={x + 20} y={chartH + 16} textAnchor="middle" fill="#9ca3af" fontSize="11">{d.label}</text>
            <text x={x + 20} y={y - 4} textAnchor="middle" fill="#e2e8f0" fontSize="10">{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DashboardInner() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <div>
      {/* Saludo */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>
            Bienvenido, <span className="text-emerald">{user?.nombres ?? '...'}</span> 👋
          </h1>
          <p>Panel de control — Finca Jirah · Pitahaya Amarilla · {new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href="/dashboard/campo/pesaje" className="btn btn-primary btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Pesaje
          </a>
        </div>
      </div>

      {/* Stat Cards — CU-06.1 */}
      <div className="stats-grid">
        {MOCK_STATS.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon stat-icon-${stat.color}`}>
              <StatIcon type={stat.icon} />
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <div className={`stat-change ${stat.up ? 'stat-change-up' : 'stat-change-down'}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {stat.up ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
              </svg>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico + Actividad */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Kg por lote */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem' }}>Kg por lote — Junio 2026</h3>
            <span className="badge badge-emerald">Mes actual</span>
          </div>
          <BarChart />
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', display: 'inline-block' }} /> Dentro del margen</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} /> Fuera del margen</span>
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="table-container">
          <div className="table-header" style={{ paddingBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem' }}>Actividad reciente</h3>
            <a href="/dashboard/campo/pesaje" className="btn btn-ghost btn-sm">Ver todo →</a>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Lote</th>
                <th>Agricultor</th>
                <th>Neto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_RECENT.map(row => (
                <tr key={row.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{row.fecha}</td>
                  <td style={{ fontWeight: 500 }}>{row.lote}</td>
                  <td>{row.agricultor}</td>
                  <td style={{ fontWeight: 600, color: 'var(--emerald-400)' }}>{row.neto}</td>
                  <td><SyncBadge status={row.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patrones de diseño — info card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(245,158,11,0.04) 100%)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>🏗️</div>
          <div>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--emerald-400)' }}>Arquitectura implementada</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {[
                { name: 'State', desc: 'Ciclo PENDING→SYNCING→SYNCED' },
                { name: 'Strategy', desc: 'Cálculo margen ±4%' },
                { name: 'Observer', desc: 'Reactividad de conectividad' },
                { name: 'Adapter', desc: 'IndexedDB ↔ Prisma' },
              ].map(p => (
                <div key={p.name} style={{ background: 'var(--bg-input)', padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{p.name}</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{p.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <SessionProvider>
      <DashboardInner />
    </SessionProvider>
  );
}
