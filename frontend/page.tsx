import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#F2F5F8] p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-[#0B1F3B] mb-4">Nova Bank</h1>
        <p className="text-xl text-[#2F5D8C] mb-8">
          Manage your finances effortlessly
        </p>

        <nav className="flex flex-wrap justify-center gap-4">
          <Link href="/accounts" className="btn-primary px-6 py-3">
            Accounts
          </Link>
          <Link href="/bank-transfer" className="btn-primary px-6 py-3">
            Bank Transfer
          </Link>
          <Link href="/pay-bills" className="btn-primary px-6 py-3">
            Pay Bills
          </Link>
          <Link href="/e-statement" className="btn-primary px-6 py-3">
            E-Statement
          </Link>
          <Link href="/smart-spend" className="btn-primary px-6 py-3">
            Smart Spend
          </Link>
        </nav>
      </div>
    </main>
  )
}
