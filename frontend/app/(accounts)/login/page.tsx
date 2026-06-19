import { palette } from '@/lib/palette'

export default function LoginPage() {
  return (
    <div className="login-bg">
      <div className="login-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            marginBottom: 32
          }}
        >
          <img
            src="/novabank-logo.png"
            alt="Nova Bank"
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              objectFit: 'contain'
            }}
          />
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                color: palette.text,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '1.5px'
              }}
            >
              NOVA BANK
            </div>
            <div
              style={{
                color: palette.textMuted,
                fontSize: 11,
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}
            >
              Smart Banking
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              color: palette.text,
              fontSize: 26,
              fontWeight: 800,
              marginBottom: 8
            }}
          >
            Welcome Back
          </h1>
          <p style={{ color: palette.textMuted, fontSize: 14, lineHeight: 1.6 }}>
            Sign in securely to access your accounts, transfers, and financial
            insights.
          </p>
        </div>

        <a href="/auth/login" className="btn-primary" style={{ display: 'block', textDecoration: 'none' }}>
          Sign In
        </a>

        <p
          style={{
            color: palette.textMuted,
            fontSize: 12,
            marginTop: 20,
            lineHeight: 1.5
          }}
        >
          By signing in you agree to our Terms of Service and Privacy Policy.
          Your session is protected by cryptographic JWT tokens.
        </p>
      </div>
    </div>
  )
}
