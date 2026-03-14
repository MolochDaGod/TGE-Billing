import { Storage } from "@google-cloud/storage";

let storage: Storage | null = null;

export function getGoogleCloudStorage(): Storage {
  if (storage) {
    return storage;
  }

  const projectId = process.env.GCS_PROJECT_ID || "crack-saga-476904-u9";
  const clientEmail = process.env.GCS_CLIENT_EMAIL;
  const privateKey = process.env.GCS_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error("GCS_CLIENT_EMAIL and GCS_PRIVATE_KEY must be set in Replit Secrets");
  }

  storage = new Storage({
    projectId,
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    },
  });

  return storage;
}

export async function uploadToGCS(
  bucketName: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ publicUrl: string; gsUrl: string }> {
  const gcs = getGoogleCloudStorage();
  const bucket = gcs.bucket(bucketName);
  const file = bucket.file(fileName);

  await file.save(fileBuffer, {
    contentType,
    metadata: {
      cacheControl: "public, max-age=31536000",
    },
  });

  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
  const gsUrl = `gs://${bucketName}/${fileName}`;

  return { publicUrl, gsUrl };
}

export async function downloadFromGCS(
  bucketName: string,
  fileName: string
): Promise<Buffer> {
  const gcs = getGoogleCloudStorage();
  const bucket = gcs.bucket(bucketName);
  const file = bucket.file(fileName);

  const [contents] = await file.download();
  return contents;
}

export async function deleteFromGCS(
  bucketName: string,
  fileName: string
): Promise<void> {
  const gcs = getGoogleCloudStorage();
  const bucket = gcs.bucket(bucketName);
  const file = bucket.file(fileName);

  await file.delete();
}

export async function listGCSBuckets(): Promise<string[]> {
  const gcs = getGoogleCloudStorage();
  const [buckets] = await gcs.getBuckets();
  return buckets.map((bucket) => bucket.name);
}

export async function listGCSFiles(bucketName: string): Promise<string[]> {
  const gcs = getGoogleCloudStorage();
  const bucket = gcs.bucket(bucketName);
  const [files] = await bucket.getFiles();
  return files.map((file) => file.name);
}
