type IconName =
  | 'account'
  | 'statement'
  | 'check'
  | 'x'
  | 'warning'
  | 'print'
  | 'droplet'
  | 'bolt'
  | 'phone'
  | 'broadcast'
  | 'tv'
  | 'shield'
  | 'globe'
  | 'building'
  | 'home'
  | 'flame'
  | 'chart'
  | 'transfer'
  | 'package'
  | 'arrowUp'
  | 'arrowDown'

interface UiIconProps {
  name: IconName
  size?: number
  strokeWidth?: number
}

export default function UiIcon({
  name,
  size = 20,
  strokeWidth = 1.9
}: UiIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  }

  return (
    <svg {...common} aria-hidden="true">
      {name === 'account' && (
        <>
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <path d="M2 10h20" />
        </>
      )}
      {name === 'statement' && (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8M8 17h5" />
        </>
      )}
      {name === 'check' && <path d="m5 12 4 4L19 6" />}
      {name === 'x' && <path d="M18 6 6 18M6 6l12 12" />}
      {name === 'warning' && (
        <>
          <path d="M12 3 2 20h20L12 3z" />
          <path d="M12 9v4M12 17h.01" />
        </>
      )}
      {name === 'print' && (
        <>
          <path d="M6 9V2h12v7" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <path d="M6 14h12v8H6z" />
        </>
      )}
      {name === 'droplet' && (
        <path d="M12 2s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11z" />
      )}
      {name === 'bolt' && <path d="m13 2-9 13h7l-1 7 9-13h-7l1-7z" />}
      {name === 'phone' && (
        <>
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <path d="M11 18h2" />
        </>
      )}
      {name === 'broadcast' && (
        <>
          <path d="M4.9 19.1a10 10 0 0 1 0-14.2M8.5 15.5a5 5 0 0 1 0-7" />
          <circle cx="12" cy="12" r="2" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7m3.6-10.6a10 10 0 0 1 0 14.2" />
        </>
      )}
      {name === 'tv' && (
        <>
          <rect x="3" y="5" width="18" height="12" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </>
      )}
      {name === 'shield' && (
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      )}
      {name === 'globe' && (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
        </>
      )}
      {name === 'building' && (
        <>
          <path d="M3 21h18M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-6h6v6M9 9h.01M12 9h.01M15 9h.01M9 12h.01M12 12h.01M15 12h.01" />
        </>
      )}
      {name === 'home' && (
        <>
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v11h14V10M9 21v-6h6v6" />
        </>
      )}
      {name === 'flame' && (
        <path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-9-2 2-3 3-3 6-2-1-3-3-3-5-3 3-4 5-4 8a7 7 0 0 0 7 7z" />
      )}
      {name === 'chart' && <path d="M3 3v18h18M7 16l4-4 3 3 5-7" />}
      {name === 'transfer' && (
        <path d="M8 7h13M8 7l4-4M8 7l4 4M16 17H3m13 0-4-4m4 4-4 4" />
      )}
      {name === 'package' && (
        <>
          <path d="m21 8-9-5-9 5 9 5 9-5z" />
          <path d="M3 8v8l9 5 9-5V8M12 13v8" />
        </>
      )}
      {name === 'arrowUp' && <path d="M12 19V5m0 0-6 6m6-6 6 6" />}
      {name === 'arrowDown' && <path d="M12 5v14m0 0-6-6m6 6 6-6" />}
    </svg>
  )
}
