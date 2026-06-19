'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { palette } from '@/lib/palette'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="nav-icon"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    )
  },
  {
    label: 'My Accounts',
    path: '/bank-accounts',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="nav-icon"
      >
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 10h20" />
      </svg>
    )
  },
  {
    label: 'Bank Transfer',
    path: '/bank-transfer',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="nav-icon"
      >
        <path d="M8 7H21M8 7l4-4M8 7l4 4" />
        <path d="M16 17H3m13 0 4 4m-4-4-4 4" />
      </svg>
    )
  },
  {
    label: 'Pay Bills',
    path: '/pay-bills',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="nav-icon"
      >
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    )
  },
  {
    label: 'Smart Spend',
    path: '/smart-spend',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="nav-icon"
      >
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-4 4" />
      </svg>
    )
  },
  {
    label: 'E-Statement',
    path: '/e-statement',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="nav-icon"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="13" y2="17" />
      </svg>
    )
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) return
    fetch('/api/v1/users')
      .then((r) => r.json())
      .then((profile: { isAdmin?: boolean }) => setIsAdmin(!!profile.isAdmin))
      .catch(() => {})
  }, [user])

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <img src="/novabank-logo.png" alt="Nova Bank" />
        <div className="sidebar-logo-text">
          NOVA BANK
          <span>Smart Banking</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`nav-item ${pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Admin link – only visible when JWT has admin role */}
      {isAdmin && (
        <div style={{ padding: '0 12px', marginBottom: 8 }}>
          <Link
            href="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 12,
              background:
                pathname === '/admin'
                  ? 'rgba(239,68,68,0.25)'
                  : 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#fca5a5',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              letterSpacing: 0.3
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              style={{ width: 16, height: 16, flexShrink: 0 }}
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Admin Panel
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 4px',
              marginBottom: 8
            }}
          >
            <img
              src={user.picture ?? '/avatar.png'}
              alt={user.name ?? 'User'}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #2F5D8C'
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: palette.textOnBlue,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user.name ?? user.email}
              </div>
              <div style={{ fontSize: 11, color: palette.textOnBlueMuted }}>
                Verified
              </div>
            </div>
          </div>
        )}

        <a
          href="/auth/logout"
          className="nav-item"
          style={{ color: 'rgba(239,68,68,0.8)' }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="nav-icon"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </a>
      </div>
    </aside>
  )
}
