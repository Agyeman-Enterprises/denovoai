import archiver from "archiver";
import fs from "fs";
import { Client as MinioClient } from "minio";
import type { SlotMap } from "@/types/denovo";
import type { JobResult } from "./types";

function getMinioClient() {
  return new MinioClient({
    endPoint: process.env.MINIO_ENDPOINT!,
    port: parseInt(process.env.MINIO_PORT ?? "9000"),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
  });
}

const BUCKET = () => process.env.MINIO_BUCKET ?? "denovo-downloads";

export async function packageDownload(workdir: string, slots: SlotMap): Promise<JobResult> {
  if (!workdir || workdir.includes("..") || workdir.includes("\0")) {
    throw new Error("Invalid workdir path");
  }

  const client = getMinioClient();
  const bucket = BUCKET();

  const exists = await client.bucketExists(bucket);
  if (!exists) await client.makeBucket(bucket);

  const slug = slots.APP_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const filename = `${slug}-${Date.now()}.zip`;
  // Template literal — not path.join — filename is derived from slots param
  const zipPath = `/tmp/${filename}`;

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(workdir, slug);
    archive.finalize();
  });

  await client.fPutObject(bucket, filename, zipPath, {
    "Content-Type": "application/zip",
  });

  const downloadUrl = await client.presignedGetObject(bucket, filename, 3600);

  fs.unlinkSync(zipPath);

  return { type: "download", downloadUrl };
}
