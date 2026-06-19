import { auth0 } from '@/lib/auth0'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import AccountNumberLookup from '@/components/AccountNumberLookup'
import { ToastProvider } from '@/components/Toast'

export default async function BankAccountsPage() {
  const session = await auth0.getSession()
  if (!session) redirect('/auth/login')

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <header className="page-header">
            <div className="page-title">My Accounts</div>
            <div className="header-actions">
              <div className="avatar-btn">
                <img src={session.user.picture ?? '/avatar.png'} alt="User" />
              </div>
            </div>
          </header>

          <div className="page-body">
            <AccountNumberLookup />
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}
