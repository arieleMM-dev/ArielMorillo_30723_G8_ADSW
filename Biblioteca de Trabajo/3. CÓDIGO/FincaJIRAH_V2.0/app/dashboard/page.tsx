'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SessionProvider } from 'next-auth/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type KgPorLote = { codigo: string; kg: number; alertas: number };
type Actividad = {
  id: string; fechaRegistro: string; pesoNetoKg: number; pesoBrutoKg: number;
  lote: { codigo: string; nombre: string }; campana: { codigo: string };
  agricultor: { nombres: string; apellidos: string };
  clasificacion: { dentroDelMargen: boolean; auditFlag: boolean } | null;
};
type Stats = {
  kgTotal: number; totalPesajes: number; alertasMargen: number;
  lotesConActividad: number;
  campanaActiva: { codigo: string; nombre: string; funda: string } | null;
  actividadReciente: Actividad[];
  kgPorLote: KgPorLote[];
  campanas: { id: string; codigo: string; nombre: string; isActive: boolean }[];
  lotes: { id: string; codigo: string; nombre: string }[];
};

function DashboardContent() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros CU-06.1.x
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [loteId,     setLoteId]     = useState('');
  const [campanaId,  setCampanaId]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fechaDesde) params.set('fechaDesde', fechaDesde);
      if (fechaHasta) params.set('fechaHasta', fechaHasta);
      if (loteId)     params.set('loteId', loteId);
      if (campanaId)  params.set('campanaId', campanaId);
      const r = await fetch(`/api/dashboard/stats?${params}`).then(r => r.json());
      setStats(r);
    } finally { setLoading(false); }
  }, [fechaDesde, fechaHasta, loteId, campanaId]);

  useEffect(() => { load(); }, [load]);

  // Exportar CSV
  function exportarCSV() {
    if (!stats?.actividadReciente.length) return;
    const rows = stats.actividadReciente.map(a => [
      new Date(a.fechaRegistro).toLocaleDateString('es-EC'),
      a.campana.codigo,
      `${a.lote.codigo} - ${a.lote.nombre}`,
      `${a.agricultor.nombres} ${a.agricultor.apellidos}`,
      a.pesoBrutoKg.toFixed(2),
      a.pesoNetoKg.toFixed(2),
      a.clasificacion ? (a.clasificacion.dentroDelMargen ? 'OK' : 'ALERTA') : 'SIN CLASIFICAR',
    ]);
    const csv = [
      ['Fecha', 'Campaña', 'Lote', 'Agricultor', 'Peso Bruto (kg)', 'Peso Neto (kg)', 'Estado'],
      ...rows,
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `reporte_jirah_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // CU-06.1.4: Exportar PDF
  function exportarPDF() {
    if (!stats?.actividadReciente.length) return;
    const doc = new jsPDF();
    doc.text(`Reporte Finca Jirah - ${new Date().toLocaleDateString('es-EC')}`, 14, 15);
    const body = stats.actividadReciente.map(a => [
      new Date(a.fechaRegistro).toLocaleDateString('es-EC'),
      a.campana.codigo,
      `${a.lote.codigo} - ${a.lote.nombre}`,
      `${a.agricultor.nombres} ${a.agricultor.apellidos}`,
      a.pesoBrutoKg.toFixed(2),
      a.pesoNetoKg.toFixed(2),
      a.clasificacion ? (a.clasificacion.dentroDelMargen ? 'OK' : 'ALERTA') : 'PENDIENTE'
    ]);
    autoTable(doc, {
      head: [['Fecha', 'Campaña', 'Lote', 'Agricultor', 'Bruto (kg)', 'Neto (kg)', 'Estado']],
      body,
      startY: 20,
    });
    doc.save(`reporte_jirah_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  // CU-06.1.4: Exportar Excel
  function exportarExcel() {
    if (!stats?.actividadReciente.length) return;
    const data = stats.actividadReciente.map(a => ({
      Fecha: new Date(a.fechaRegistro).toLocaleDateString('es-EC'),
      Campaña: a.campana.codigo,
      Lote: `${a.lote.codigo} - ${a.lote.nombre}`,
      Agricultor: `${a.agricultor.nombres} ${a.agricultor.apellidos}`,
      'Peso Bruto (kg)': a.pesoBrutoKg,
      'Peso Neto (kg)': a.pesoNetoKg,
      Estado: a.clasificacion ? (a.clasificacion.dentroDelMargen ? 'OK' : 'ALERTA') : 'PENDIENTE'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Actividad Reciente');
    XLSX.writeFile(workbook, `reporte_jirah_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  const hoy = new Date();
  const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const fechaStr = `${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;

  const maxKg = stats?.kgPorLote.length ? Math.max(...stats.kgPorLote.map(l => l.kg)) : 1;

  const syncStatus = (a: Actividad) => {
    if (!a.clasificacion) return { label: 'Pendiente', cls: 'badge-amber' };
    if (a.clasificacion.auditFlag) return { label: 'Auditoria', cls: 'badge-red' };
    return { label: 'Clasificado', cls: 'badge-green' };
  };

  return (
    <div>
      {/* Bienvenida */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Bienvenido, <span style={{ color: 'var(--accent)' }}>{user?.nombres ?? '...'}</span> 👋
          </h1>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Panel de control — Finca Jirah · Pitahaya Amarilla · {fechaStr}
          </div>
        </div>
        <Link href="/dashboard/campo/pesaje" className="btn btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Pesaje
        </Link>
      </div>

      {/* Filtros CU-06.1.1 – 06.1.3 */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)', marginRight: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filtros:
        </div>
        <input type="date" className="form-input" style={{ width: 160 }} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} placeholder="Desde" />
        <input type="date" className="form-input" style={{ width: 160 }} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} placeholder="Hasta" />
        <select className="form-input form-select" style={{ width: 180 }} value={loteId} onChange={e => setLoteId(e.target.value)}>
          <option value="">Todos los lotes</option>
          {stats?.lotes.map(l => <option key={l.id} value={l.id}>{l.codigo} — {l.nombre}</option>)}
        </select>
        <select className="form-input form-select" style={{ width: 200 }} value={campanaId} onChange={e => setCampanaId(e.target.value)}>
          <option value="">Todas las campañas</option>
          {stats?.campanas.map(c => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
        </select>
        {(fechaDesde || fechaHasta || loteId || campanaId) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFechaDesde(''); setFechaHasta(''); setLoteId(''); setCampanaId(''); }}>
            Limpiar
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
          </div>
          <div className="stat-label">Kg Cosechados</div>
          <div className="stat-value">{loading ? '...' : stats?.kgTotal.toLocaleString('es-EC', { maximumFractionDigits: 0 }) ?? 0}</div>
          <div className="stat-sub">{stats?.totalPesajes ?? 0} registros de pesaje</div>
        </div>

        <div className="stat-card">
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--amber-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber-600)', marginBottom: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
          </div>
          <div className="stat-label">Campaña Activa</div>
          <div className="stat-value" style={{ fontSize: '1.3rem' }}>{loading ? '...' : stats?.campanaActiva?.codigo ?? '—'}</div>
          <div className="stat-sub">{stats?.campanaActiva?.nombre ?? 'Sin campaña activa'}</div>
        </div>

        <div className="stat-card">
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-600)', marginBottom: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </div>
          <div className="stat-label">Lotes con Actividad</div>
          <div className="stat-value">{loading ? '...' : stats?.lotesConActividad ?? 0}</div>
          <div className="stat-sub">en el período seleccionado</div>
        </div>

        <div className="stat-card">
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--red-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red-600)', marginBottom: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div className="stat-label">Alertas de Margen</div>
          <div className="stat-value" style={{ color: (stats?.alertasMargen ?? 0) > 0 ? 'var(--red-600)' : 'var(--text-primary)' }}>
            {loading ? '...' : stats?.alertasMargen ?? 0}
          </div>
          <div className="stat-sub" style={{ color: (stats?.alertasMargen ?? 0) > 0 ? 'var(--red-500)' : 'var(--text-muted)' }}>
            clasificaciones fuera de ±4%
          </div>
        </div>
      </div>

      {/* Gráfico + Tabla */}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Gráfico de barras por lote */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Kg Netos por Lote</span>
            {(fechaDesde || fechaHasta) && (
              <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>Filtrado</span>
            )}
          </div>
          {!stats?.kgPorLote.length ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <p>No existen registros de cosecha para los parámetros seleccionados.</p>
            </div>
          ) : (
            <>
              <div className="bar-chart">
                {stats.kgPorLote.map(l => {
                  const pct = maxKg > 0 ? (l.kg / maxKg) * 100 : 0;
                  return (
                    <div key={l.codigo} className="bar-item">
                      <div className="bar-value">{l.kg >= 1000 ? `${(l.kg/1000).toFixed(1)}t` : `${l.kg.toFixed(0)}`}</div>
                      <div className="bar-fill" style={{ height: `${pct}%`, background: l.alertas > 0 ? 'var(--amber-500)' : 'var(--green-500)' }} />
                      <div className="bar-label">{l.codigo}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--green-500)', display: 'inline-block' }} />
                  Dentro del margen
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--amber-500)', display: 'inline-block' }} />
                  Con alertas de descuadre
                </span>
              </div>
            </>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="table-container">
          <div className="table-header">
            <span className="card-title">Actividad Reciente</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="btn btn-ghost btn-sm" onClick={exportarCSV} title="Exportar CSV (CU-06.1.4)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                CSV
              </button>
              <button className="btn btn-ghost btn-sm" onClick={exportarExcel} title="Exportar Excel (CU-06.1.4)">
                Excel
              </button>
              <button className="btn btn-ghost btn-sm" onClick={exportarPDF} title="Exportar PDF (CU-06.1.4)">
                PDF
              </button>
            </div>
          </div>
          {!stats?.actividadReciente.length ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <p>No existen registros de cosecha para los parámetros seleccionados.</p>
            </div>
          ) : (
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
                {stats.actividadReciente.map(a => {
                  const { label, cls } = syncStatus(a);
                  return (
                    <tr key={a.id} style={{ cursor: 'default' }}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(a.fechaRegistro).toLocaleDateString('es-EC', { day:'2-digit', month:'short' })}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        <span className="mono fw-600">{a.lote.codigo}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{a.lote.nombre}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {a.agricultor.nombres} {a.agricultor.apellidos}
                      </td>
                      <td className="fw-600" style={{ color: 'var(--accent)' }}>{a.pesoNetoKg.toFixed(2)} kg</td>
                      <td><span className={`badge ${cls}`}>{label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <SessionProvider>
      <DashboardContent />
    </SessionProvider>
  );
}
