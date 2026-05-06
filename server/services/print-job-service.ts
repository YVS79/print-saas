import { NotFoundError } from "@/lib/errors";
import { setTenantShopId } from "@/server/db/tenant-session";
import { withTransaction } from "@/server/db/transaction";
import {
  PrintJobRecord,
  createPrintJob,
  getShopPrintJobs,
  updatePrintJobStatus,
} from "@/server/repositories/print-job-repository";
import { requireOrderForShop } from "@/server/services/order-service";
import { requireDesignVersion } from "@/server/services/design-service";

export async function listPrintJobsForShop(shopId: string): Promise<PrintJobRecord[]> {
  return getShopPrintJobs(shopId);
}

export async function createPrintJobForOrder(input: {
  shopId: string;
  orderId: string;
}): Promise<PrintJobRecord> {
  return withTransaction(async () => {
    await setTenantShopId(input.shopId);
    const order = await requireOrderForShop(input.shopId, input.orderId);
    const design = await requireDesignVersion({
      shopId: input.shopId,
      designId: order.design_id,
      version: order.design_version,
    });

    return createPrintJob({
      shopId: input.shopId,
      orderId: order.id,
      designId: order.design_id,
      designVersion: order.design_version,
      printerFormat: design.format,
      bleedMM: Number(design.bleed_mm),
    });
  });
}

export async function markPrintJobRendering(input: {
  shopId: string;
  printJobId: string;
}): Promise<PrintJobRecord> {
  return withTransaction(async () => {
    await setTenantShopId(input.shopId);
    const job = await updatePrintJobStatus({
      shopId: input.shopId,
      printJobId: input.printJobId,
      status: "rendering",
    });
    if (!job) {
      throw new NotFoundError("Print job not found");
    }
    return job;
  });
}

export async function markPrintJobReady(input: {
  shopId: string;
  printJobId: string;
}): Promise<PrintJobRecord> {
  return withTransaction(async () => {
    await setTenantShopId(input.shopId);
    const job = await updatePrintJobStatus({
      shopId: input.shopId,
      printJobId: input.printJobId,
      status: "ready",
    });
    if (!job) {
      throw new NotFoundError("Print job not found");
    }
    return job;
  });
}

export async function markPrintJobFailed(input: {
  shopId: string;
  printJobId: string;
  errorMessage: string;
}): Promise<PrintJobRecord> {
  return withTransaction(async () => {
    await setTenantShopId(input.shopId);
    const job = await updatePrintJobStatus({
      shopId: input.shopId,
      printJobId: input.printJobId,
      status: "failed",
      errorMessage: input.errorMessage,
    });
    if (!job) {
      throw new NotFoundError("Print job not found");
    }
    return job;
  });
}

/**
 * Placeholder for upcoming background PDF worker integration.
 * Expected flow:
 * queued -> rendering -> ready | failed
 */
export async function enqueuePrintRender(_input: {
  shopId: string;
  printJobId: string;
}): Promise<void> {
  void _input;
  return Promise.resolve();
}
