"use client";

const STORAGE_KEY_SHOP_ID = "debug_shop_id";
const STORAGE_KEY_USER_ID = "debug_user_id";

export function setDebugAuth(shopId: string, userId: string): void {
  localStorage.setItem(STORAGE_KEY_SHOP_ID, shopId);
  localStorage.setItem(STORAGE_KEY_USER_ID, userId);
}

export function getDebugAuth(): { shopId: string | null; userId: string | null } {
  if (typeof window === "undefined") return { shopId: null, userId: null };
  return {
    shopId: localStorage.getItem(STORAGE_KEY_SHOP_ID),
    userId: localStorage.getItem(STORAGE_KEY_USER_ID),
  };
}

export function clearDebugAuth(): void {
  localStorage.removeItem(STORAGE_KEY_SHOP_ID);
  localStorage.removeItem(STORAGE_KEY_USER_ID);
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: string;
}

async function apiFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const { shopId, userId } = getDebugAuth();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (shopId) headers["x-shop-id"] = shopId;
  if (userId) headers["x-user-id"] = userId;

  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    const body: ApiErrorResponse = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  const body: ApiSuccessResponse<T> = await res.json();
  return body.data;
}

// ── API methods ──

export function fetchTemplates(format?: string) {
  const params = format ? `?format=${format}` : "";
  return apiFetch<TemplateDTO[]>(`/api/templates${params}`);
}

export function fetchOrdersByShop(shopId: string) {
  return apiFetch<OrderDTO[]>(`/api/shops/${shopId}/orders`);
}

export function fetchPrintJobs() {
  return apiFetch<PrintJobDTO[]>("/api/print-jobs");
}

export function createOrder(input: {
  designId: string;
  designVersion: number;
  quantity: number;
  customerName?: string;
  customerPhone?: string;
}) {
  return apiFetch<OrderDTO>("/api/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createPrintJob(input: { orderId: string }) {
  return apiFetch<PrintJobDTO>("/api/print-jobs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function saveDesign(input: {
  designId: string;
  format: "A4" | "A3";
  widthMM: number;
  heightMM: number;
  bleedMM: number;
  objects: unknown[];
  schemaVersion: number;
}) {
  return apiFetch<unknown>("/api/designs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAssetUploadUrl(input: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  widthPx?: number;
  heightPx?: number;
}) {
  return apiFetch<{ uploadUrl: string; key: string; asset: unknown }>(
    "/api/assets/upload-url",
    { method: "POST", body: JSON.stringify(input) },
  );
}

// ── DTO types mirroring server records ──

export interface TemplateDTO {
  id: string;
  shop_id: string;
  name: string;
  format: "A4" | "A3";
  width_mm: string;
  height_mm: string;
  bleed_mm: string;
  base_design_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderDTO {
  id: string;
  shop_id: string;
  design_id: string;
  design_version: number;
  quantity: number;
  status: "created" | "queued" | "printed" | "cancelled";
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrintJobDTO {
  id: string;
  shop_id: string;
  order_id: string;
  design_id: string;
  design_version: number;
  printer_format: "A4" | "A3";
  dpi: 300;
  bleed_mm: string;
  status: "queued" | "rendering" | "ready" | "failed";
  pdf_asset_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
