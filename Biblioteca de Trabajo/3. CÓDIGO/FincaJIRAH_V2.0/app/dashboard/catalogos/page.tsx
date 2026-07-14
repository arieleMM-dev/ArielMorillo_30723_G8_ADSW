'use client';
import Link from 'next/link';

const MODULES = [
  {
    href: '/dashboard/catalogos/campanias',
    title: 'Campañas',
    desc: 'Ciclos de cosecha: código, funda, tara y comprador asignado.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/catalogos/lotes',
    title: 'Lotes',
    desc: 'Áreas físicas de cultivo con su superficie en hectáreas.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/catalogos/compradores',
    title: 'Compradores',
    desc: 'Directorio de exportadores y mayoristas con perfil de tolerancia.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

export default function CatalogosPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Catálogos</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 2, fontSize: '0.875rem' }}>
            Tablas maestras de control que nutren las operaciones de campo.
          </p>
        </div>
      </div>

      <div className="grid-3" style={{ marginTop: 4 }}>
        {MODULES.map(m => (
          <Link key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              cursor: 'pointer',
              transition: 'border-color var(--transition), box-shadow var(--transition)',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(34,197,94,0.08)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 44, height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)',
              }}>
                {m.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{m.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{m.desc}</div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                Gestionar →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
