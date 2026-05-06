"use client";

import { useState, useEffect } from "react";
import { setDebugAuth, getDebugAuth, clearDebugAuth } from "@/lib/api-client";
import Link from "next/link";

export default function DebugPage() {
  const [shopId, setShopId] = useState("");
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "fail">("idle");

  useEffect(() => {
    const auth = getDebugAuth();
    if (auth.shopId) setShopId(auth.shopId);
    if (auth.userId) setUserId(auth.userId);
  }, []);

  function handleSave() {
    if (!shopId.trim() || !userId.trim()) {
      setMessage("Both Shop ID and User ID are required");
      return;
    }
    setDebugAuth(shopId.trim(), userId.trim());
    setMessage("Auth saved to localStorage");
    setStatus("idle");
  }

  function handleClear() {
    clearDebugAuth();
    setShopId("");
    setUserId("");
    setMessage("Auth cleared");
    setStatus("idle");
  }

  async function handleCheck() {
    setStatus("checking");
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        setStatus("ok");
        setMessage("API /api/templates — OK");
      } else {
        const body = await res.json();
        setStatus("fail");
        setMessage(`API error: ${body.error ?? res.statusText}`);
      }
    } catch (e) {
      setStatus("fail");
      setMessage(`Network error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans">
      <h1 className="text-2xl font-bold mb-6">🔧 Print-SaaS Debug Console</h1>

      {/* Auth panel */}
      <section className="mb-8 max-w-lg rounded border border-zinc-300 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Multi-tenant Auth (headers)</h2>
        <div className="mb-3 space-y-2">
          <label className="block text-sm font-medium text-zinc-700">
            Shop ID (x-shop-id)
            <input
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            User ID (x-user-id)
            <input
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="rounded bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          >
            Save Auth
          </button>
          <button
            onClick={handleClear}
            className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
          >
            Clear
          </button>
          <button
            onClick={handleCheck}
            className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
          >
            Test API
          </button>
        </div>
        {status === "checking" && <p className="mt-2 text-sm text-zinc-500">Checking…</p>}
        {status === "ok" && <p className="mt-2 text-sm text-green-600">{message}</p>}
        {status === "fail" && <p className="mt-2 text-sm text-red-600">{message}</p>}
        {message && status === "idle" && <p className="mt-2 text-sm text-zinc-600">{message}</p>}
      </section>

      {/* Navigation */}
      <section className="max-w-lg rounded border border-zinc-300 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Dashboard Pages</h2>
        <nav className="space-y-2">
          <Link
            href="/templates"
            className="block rounded bg-zinc-100 px-4 py-3 text-sm font-medium hover:bg-zinc-200"
          >
            📄 Templates
          </Link>
          <Link
            href="/orders"
            className="block rounded bg-zinc-100 px-4 py-3 text-sm font-medium hover:bg-zinc-200"
          >
            📦 Orders
          </Link>
          <Link
            href="/print-jobs"
            className="block rounded bg-zinc-100 px-4 py-3 text-sm font-medium hover:bg-zinc-200"
          >
            🖨️ Print Jobs
          </Link>
          <Link
            href="/editor/new"
            className="block rounded bg-zinc-100 px-4 py-3 text-sm font-medium hover:bg-zinc-200"
          >
            ✏️ Editor
          </Link>
        </nav>
      </section>

      <footer className="mt-8 text-xs text-zinc-400">
        Print-SaaS MVP
        {" · "}
        <a
          href="https://github.com/YVS79/print-saas"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
