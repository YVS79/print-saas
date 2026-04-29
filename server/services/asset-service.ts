import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createAsset, AssetRecord } from "@/server/repositories/asset-repository";
import { setTenantShopId, setTenantUserId } from "@/server/db/tenant-session";
import { withTransaction } from "@/server/db/transaction";

export interface UploadAssetResponse {
  uploadUrl: string;
  key: string;
  asset: AssetRecord;
}

function getS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "us-east-1";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

  return new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials:
      accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey,
          }
        : undefined,
  });
}

const s3Client = getS3Client();

export async function createAssetUpload(input: {
  shopId: string;
  actorUserId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  widthPx?: number;
  heightPx?: number;
}): Promise<UploadAssetResponse> {
  const bucket = process.env.S3_BUCKET ?? "print-saas";
  const key = `${input.shopId}/${Date.now()}-${input.fileName}`;
  const expiresIn = Number(process.env.S3_PRESIGN_EXPIRES_SEC ?? 900);

  const uploadUrl = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: input.mimeType,
    }),
    { expiresIn },
  );

  const asset = await withTransaction(async () => {
    await setTenantShopId(input.shopId);
    await setTenantUserId(input.actorUserId);

    return createAsset({
      shopId: input.shopId,
      key,
      bucket,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      widthPx: input.widthPx,
      heightPx: input.heightPx,
      createdByUserId: input.actorUserId,
    });
  });

  return {
    uploadUrl,
    key,
    asset,
  };
}
