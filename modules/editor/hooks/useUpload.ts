"use client";

import { useCallback, useState } from "react";

export interface UploadResult {
  url: string;
  assetId: string;
  previewUrl: string;
}

interface UseUploadReturn {
  uploadFile: (file: File) => Promise<UploadResult | null>;
  getUploadUrl: (mimeType: string) => Promise<{ url: string; fields?: Record<string, string> } | null>;
  isUploading: boolean;
  progress: number;
}

/**
 * Хук для загрузки файлов в S3 через presigned URL.
 */
export function useUpload(): UseUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const getUploadUrl = useCallback(
    async (mimeType: string): Promise<{ url: string; fields?: Record<string, string> } | null> => {
      try {
        const res = await fetch(
          `/api/assets/upload-url?mime_type=${encodeURIComponent(mimeType)}`,
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to get upload URL");
        }
        const json = await res.json();
        return json.data ?? json;
      } catch (err) {
        console.error("[useUpload] getUploadUrl error:", err);
        return null;
      }
    },
    [],
  );

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setIsUploading(true);
      setProgress(0);

      try {
        const uploadData = await getUploadUrl(file.type);
        if (!uploadData) throw new Error("Failed to get upload URL");

        const result = await new Promise<UploadResult | null>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              setProgress(Math.round((event.loaded / event.total) * 100));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const assetId =
                uploadData.fields?.key?.split("/").pop()?.split(".")[0] ??
                crypto.randomUUID();
              resolve({
                url: uploadData.url,
                assetId,
                previewUrl: `${uploadData.url}/${uploadData.fields?.key ?? ""}`,
              });
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Upload failed")));

          xhr.open("POST", uploadData.url);
          if (uploadData.fields) {
            const formData = new FormData();
            Object.entries(uploadData.fields).forEach(([key, value]) => {
              formData.append(key, value as string);
            });
            formData.append("file", file);
            xhr.send(formData);
          } else {
            xhr.setRequestHeader("Content-Type", file.type);
            xhr.send(file);
          }
        });

        return result;
      } catch (err) {
        console.error("[useUpload] uploadFile error:", err);
        return null;
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [getUploadUrl],
  );

  return { uploadFile, getUploadUrl, isUploading, progress };
}
