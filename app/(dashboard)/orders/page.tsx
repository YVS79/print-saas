"use client";

import { useEffect, useState } from "react";
import {
  createOrder,
  fetchOrdersByShop,
  fetchPrintJobs,
  createPrintJob,
  getDebugAuth,
  OrderDTO,
  PrintJobDTO,
} from "@/lib/api-client";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create order form
  const [designId, setDesignId] = useState("");
  const [designVersion, setDesignVersion] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [createMsg, setCreateMsg] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Print job
  const [printJobs, setPrintJobs] = useState<PrintJobDTO[]>([]);
  const [printMsg, setPrintMsg] = useState<string | null>(null);
  const [sendingPrint, setSendingPrint] = useState(false);

  function loadOrders() {
    const auth = getDebugAuth();
    if (!auth.shopId) {
      setError("Set Shop ID on the debug page first");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchOrdersByShop(auth.shopId)
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function loadPrintJobs() {
    setPrintMsg(null);
    fetchPrintJobs()
      .then(setPrintJobs)
      .catch((e) => setPrintMsg(`Error: ${e.message}`));
  }

  useEffect(() => {
    loadOrders();
    loadPrintJobs();
  }, []);

  async function handleCreate() {
    if (!designId.trim()) {
      setCreateMsg("Design ID is required");
      return;
    }
    setCreating(true);
    setCreateMsg(null);
    try {
      await createOrder({
        designId: designId.trim(),
        designVersion,
        quantity,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
      });
      setCreateMsg("Order created!");
      setDesignId("");
      setDesignVersion(1);
      setQuantity(1);
      setCustomerName("");
      setCustomerPhone("");
      loadOrders();
    } catch (e) {
      setCreateMsg(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleSendToPrint(orderId: string) {
    setSendingPrint(true);
    setPrintMsg(null);
    try {
      const job = await createPrintJob({ orderId });
      setPrintMsg(
        `Print job ${job.id.slice(0, 8)}… created (status: ${job.status})`,
      );
      loadPrintJobs();
    } catch (e) {
      setPrintMsg(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSendingPrint(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-800">📦 Orders</h1>

      {/* Create form */}
      <section className="mb-8 rounded border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Create Order</h2>
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700">
            Design ID
            <input
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              value={designId}
              onChange={(e) => setDesignId(e.target.value)}
              placeholder="uuid"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Version
            <input
              type="number"
              min={1}
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              value={designVersion}
              onChange={(e) => setDesignVersion(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Quantity
            <input
              type="number"
              min={1}
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Customer name
            <input
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Customer phone
            <input
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </label>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="rounded bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create Order"}
        </button>
        {createMsg && (
          <p
            className={`mt-2 text-sm ${
              createMsg.startsWith("Failed") ? "text-red-600" : "text-green-600"
            }`}
          >
            {createMsg}
          </p>
        )}
      </section>

      {/* Orders list */}
      {loading && <p className="text-sm text-zinc-500">Loading orders…</p>}
      {error && <p className="text-sm text-red-600">Error: {error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p className="mb-6 text-sm text-zinc-500">No orders yet.</p>
      )}

      <div className="mb-8 space-y-2">
        {orders.map((o) => (
          <div
            key={o.id}
            className="flex items-center justify-between rounded border border-zinc-200 bg-white p-3"
          >
            <div className="text-sm">
              <p className="font-medium text-zinc-800">
                #{o.id.slice(0, 8)} · {o.status}
              </p>
              <p className="text-zinc-500">
                Design: {o.design_id.slice(0, 8)} v{o.design_version} · Qty:{" "}
                {o.quantity}
              </p>
              {(o.customer_name || o.customer_phone) && (
                <p className="text-zinc-400">
                  {o.customer_name ?? "—"} / {o.customer_phone ?? "—"}
                </p>
              )}
            </div>
            <button
              onClick={() => handleSendToPrint(o.id)}
              disabled={sendingPrint}
              className="rounded border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 disabled:opacity-50"
            >
              Print
            </button>
          </div>
        ))}
      </div>

      {/* Print jobs panel */}
      <section className="rounded border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Print Jobs ({printJobs.length})</h2>
        {printMsg && (
          <p
            className={`mb-2 text-sm ${
              printMsg.startsWith("Failed") ? "text-red-600" : "text-green-600"
            }`}
          >
            {printMsg}
          </p>
        )}
        <div className="space-y-1 text-xs text-zinc-600">
          {printJobs.map((j) => (
            <div key={j.id} className="flex gap-3 rounded bg-zinc-50 px-3 py-2">
              <span className="font-mono text-zinc-400">
                #{j.id.slice(0, 8)}
              </span>
              <span
                className={
                  j.status === "ready"
                    ? "text-green-600"
                    : j.status === "failed"
                      ? "text-red-600"
                      : "text-zinc-600"
                }
              >
                {j.status}
              </span>
              <span className="text-zinc-400">
                {j.printer_format} · v{j.design_version}
              </span>
              {j.error_message && (
                <span className="text-red-500">{j.error_message}</span>
              )}
            </div>
          ))}
          {printJobs.length === 0 && (
            <p className="text-zinc-400">No print jobs yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
