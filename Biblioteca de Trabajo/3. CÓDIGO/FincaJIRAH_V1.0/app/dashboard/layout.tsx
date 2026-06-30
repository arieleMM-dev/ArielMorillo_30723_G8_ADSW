'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { useState, useEffect } from 'react';

// ─── Componentes del Patrón Observer para conectividad ───
function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`sync-indicator ${isOnline ? 'sync-online' : 'sync-offline'}`} title={isOnline ? 'Conectado' : 'Sin conexión — datos guardados localmente'}>
      <span className="sync-dot" />
      {isOnline ? 'En línea' : 'Sin conexión'}
    </div>
  );
}

// ─── Sidebar Navigation ───
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  )},
  { href: '/dashboard/personal', label: 'Personal', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ), adminOnly: true },
  { href: '/dashboard/catalogos', label: 'Catálogos', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  )},
];

const FIELD_ITEMS = [
  { href: '/dashboard/campo/pesaje', label: 'Pesaje Bruto', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
  )},
  { href: '/dashboard/campo/clasificacion', label: 'Clasificación', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  )},
];

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;
  const initials = user ? `${user.nombres?.[0] ?? ''}${user.apellidos?.[0] ?? ''}`.toUpperCase() : '?';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, marginRight: '12px', background: 'white' }}>
            <img src="/Logo.jpeg" alt="Logo Finca Jirah" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div className="sidebar-brand">Finca <span>Jirah</span></div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sistema Agrícola</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">General</span>
          {NAV_ITEMS.filter(item => !item.adminOnly || user?.rol === 'ADMIN').map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          <span className="nav-section-label" style={{ marginTop: '0.75rem' }}>Campo</span>
          {FIELD_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
              <span className="badge badge-gold" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>PWA</span>
            </Link>
          ))}

          <Link
            href="/dashboard/perfil"
            className={`nav-item ${pathname === '/dashboard/perfil' ? 'active' : ''}`}
            style={{ marginTop: 'auto' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Mi Perfil
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={() => signOut({ callbackUrl: '/login' })}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.nombres} {user?.apellidos}</div>
              <div className="user-role">{user?.rol}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            {NAV_ITEMS.concat(FIELD_ITEMS as any).find(i => pathname.startsWith(i.href))?.label ?? 'Jirah'}
          </div>
          <div className="topbar-actions">
            <Link href="/dashboard/perfil" style={{ textDecoration: 'none' }}>
              <div className="user-avatar" style={{ width: 36, height: 36, fontSize: '0.85rem', cursor: 'pointer' }}>{initials}</div>
            </Link>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  );
}
