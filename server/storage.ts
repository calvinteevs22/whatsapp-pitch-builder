// Storage helpers — uses AWS S3 (or S3-compatible endpoint like R2/MinIO) when
// credentials are configured, otherwise writes to local /uploads/ directory.
// Note: local /uploads/ is ephemeral on Railway (wiped on redeploy) but images
// work for the lifetime of the container. This is preferable to base64-in-MySQL
// which causes SELECT failures due to max_allowed_packet limits.

import fs from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

// ---------------------------------------------------------------------------
// S3 configuration
// ---------------------------------------------------------------------------

interface S3Config {
  client: S3Client;
  bucket: string;
  publicUrl?: string;
}

function tryGetS3Config(): S3Config | null {
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET;

  if (!region || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  const endpoint = process.env.S3_ENDPOINT; // optional, e.g. for R2 or MinIO

  const client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  });

  return { client, bucket, publicUrl: process.env.S3_PUBLIC_URL };
}

// ---------------------------------------------------------------------------
// Local fallback (no S3) — writes to /uploads/ directory
// ---------------------------------------------------------------------------

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function localPut(
  key: string,
  data: Buffer | Uint8Array | string,
  _contentType: string = "application/octet-stream"
): { key: string; url: string } {
  ensureUploadsDir();
  const filePath = path.join(UPLOADS_DIR, key.replace(/\//g, "_"));
  const buf = typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);
  fs.writeFileSync(filePath, buf);
  const filename = path.basename(filePath);
  return { key, url: `/uploads/${filename}` };
}

function localGet(key: string): { key: string; url: string } {
  const filename = key.replace(/\//g, "_");
  return { key, url: `/uploads/${filename}` };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Upload `data` to S3 (or local disk) under `relKey`.
 *
 * Returns `{ key, url }` where `url` is:
 *   - the S3_PUBLIC_URL-prefixed URL when S3_PUBLIC_URL is set, or
 *   - a virtual-hosted-style S3 URL (`https://<bucket>.s3.<region>.amazonaws.com/<key>`), or
 *   - a `/uploads/<filename>` path when running without S3 credentials (served statically).
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const s3 = tryGetS3Config();

  if (!s3) {
    return localPut(key, data, contentType);
  }

  const body =
    typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);

  await s3.client.send(
    new PutObjectCommand({
      Bucket: s3.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  let url: string;
  if (s3.publicUrl) {
    const base = s3.publicUrl.replace(/\/+$/, "");
    url = `${base}/${key}`;
  } else {
    const region = process.env.S3_REGION!;
    const endpoint = process.env.S3_ENDPOINT;
    if (endpoint) {
      const base = endpoint.replace(/\/+$/, "");
      url = `${base}/${s3.bucket}/${key}`;
    } else {
      url = `https://${s3.bucket}.s3.${region}.amazonaws.com/${key}`;
    }
  }

  return { key, url };
}

/**
 * Obtain a presigned download URL for `relKey`.
 *
 * Falls back to a `file://` path when S3 credentials are not configured.
 * The presigned URL expires in 1 hour by default.
 */
export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const s3 = tryGetS3Config();

  if (!s3) {
    return localGet(key);
  }

  const url = await getSignedUrl(
    s3.client,
    new GetObjectCommand({ Bucket: s3.bucket, Key: key }),
    { expiresIn }
  );

  return { key, url };
}
