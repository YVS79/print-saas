import { Format } from "@/lib/types/domain";
import { getTemplatesByShop, TemplateRecord } from "@/server/repositories/template-repository";

export async function listTemplates(shopId: string, format?: Format): Promise<TemplateRecord[]> {
  return getTemplatesByShop(shopId, format);
}
