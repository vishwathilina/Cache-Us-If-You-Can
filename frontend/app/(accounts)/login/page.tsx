export default function LoginPage() {
  return (
    <div className="login-bg">
      <div className="login-card">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 32 }}>
          <img
            src="/loginlogo.png"
            alt="Nova Bank"
            style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.1)' }}
          />
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: '1.5px' }}>
              NOVA BANK
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase' }}>
              Smart Banking
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            Welcome Back
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>
            Sign in securely to access your accounts, transfers, and financial insights.
          </p>
        </div>

        {/* Security badges */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            marginBottom: 28,
            flexWrap: 'wrap',
          }}
        >
          {['256-bit SSL', 'Auth0 Secured', 'ACID Compliant'].map((b) => (
            <span
              key={b}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(168,85,247,0.15)',
                color: '#c084fc',
                border: '1px solid rgba(168,85,247,0.25)',
              }}
            >
              ✓ {b}
            </span>
          ))}
        </div>

        {/* Auth0 login button */}
        <a
          href="/auth/login"
          style={{
            display: 'block',
            background: 'linear-gradient(135deg, #6b21a8, #7c3aed)',
            color: '#fff',
            padding: '15px 32px',
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 16,
            textDecoration: 'none',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
            transition: 'all 0.2s',
            letterSpacing: '0.5px',
          }}
        >
          Sign In with Auth0
        </a>

        <p
          style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: 12,
            marginTop: 20,
            lineHeight: 1.5,
          }}
        >
          By signing in you agree to our Terms of Service and Privacy Policy.
          Your session is protected by cryptographic JWT tokens.
        </p>
      </div>
    </div>
  )
}
