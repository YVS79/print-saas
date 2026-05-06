import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-sm font-semibold text-zinc-800">
            ← Debug Console
          </Link>
          <nav className="flex gap-4 text-sm text-zinc-600">
            <Link href="/templates" className="hover:text-zinc-900">
              Templates
            </Link>
            <Link href="/orders" className="hover:text-zinc-900">
              Orders
            </Link>
            <Link href="/print-jobs" className="hover:text-zinc-900">
              Print Jobs
            </Link>
            <Link href="/editor/new" className="hover:text-zinc-900">
              Editor
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
