import { uploadToGCS, downloadFromGCS, deleteFromGCS } from "./googleCloudStorage";
import {
  uploadToGoogleDrive,
  downloadFromGoogleDrive,
  deleteFromGoogleDrive,
  createGoogleDriveFolder,
  shareGoogleDriveFile,
  COMPANY_DRIVE_EMAIL,
} from "./googleDrive";
import { nanoid } from "nanoid";
import path from "path";
import type { User } from "../shared/schema";

export type StorageProvider = "gcs" | "google-drive";

export interface UploadOptions {
  provider: StorageProvider;
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
  category?: "invoice" | "job-photo" | "document" | "other";
  folderId?: string;
}

export interface StorageMetadata {
  provider: StorageProvider;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  publicUrl?: string;
  fileId?: string;
  bucketName?: string;
  gsUrl?: string;
  webViewLink?: string;
  uploadedAt: Date;
}

const DEFAULT_GCS_BUCKET = "tgebilling-files";

export class StorageService {
  static async createUserDriveFolder(
    user: User
  ): Promise<{ folderId: string; webViewLink: string } | null> {
    if (user.role !== "admin" && user.role !== "employee") {
      return null;
    }

    if (user.drive_folder_id && user.drive_folder_url) {
      return {
        folderId: user.drive_folder_id,
        webViewLink: user.drive_folder_url,
      };
    }

    const folderName = `TGE - ${user.name} (${user.role})`;
    const folder = await createGoogleDriveFolder(folderName);

    await shareGoogleDriveFile(folder.folderId, COMPANY_DRIVE_EMAIL, "writer");

    return {
      folderId: folder.folderId,
      webViewLink: folder.webViewLink,
    };
  }

  static async uploadFileForUser(
    user: User,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    category: "invoice" | "job-photo" | "document" | "other" = "other"
  ): Promise<StorageMetadata> {
    let folderId: string | undefined;

    if (user.role === "admin" || user.role === "employee") {
      if (!user.drive_folder_id) {
        throw new Error("User drive folder not initialized. Please create folder first.");
      }
      folderId = user.drive_folder_id;
    }

    return await this.uploadFile({
      provider: "google-drive",
      fileName,
      fileBuffer,
      mimeType,
      category,
      folderId,
    });
  }

  static async uploadFile(options: UploadOptions): Promise<StorageMetadata> {
    const {
      provider,
      fileName,
      fileBuffer,
      mimeType,
      category = "other",
      folderId,
    } = options;

    const timestamp = new Date().toISOString().split("T")[0];
    const uniqueId = nanoid(8);
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);
    const uniqueFileName = `${timestamp}-${baseName}-${uniqueId}${extension}`;

    const metadata: StorageMetadata = {
      provider,
      fileName: uniqueFileName,
      originalName: fileName,
      mimeType,
      size: fileBuffer.length,
      category,
      uploadedAt: new Date(),
    };

    if (provider === "gcs") {
      const bucketName = process.env.GCS_BUCKET_NAME || DEFAULT_GCS_BUCKET;
      const { publicUrl, gsUrl } = await uploadToGCS(
        bucketName,
        uniqueFileName,
        fileBuffer,
        mimeType
      );

      metadata.bucketName = bucketName;
      metadata.publicUrl = publicUrl;
      metadata.gsUrl = gsUrl;
    } else if (provider === "google-drive") {
      const result = await uploadToGoogleDrive(
        uniqueFileName,
        fileBuffer,
        mimeType,
        folderId
      );

      metadata.fileId = result.fileId;
      metadata.webViewLink = result.webViewLink;
      metadata.publicUrl = result.webContentLink || result.webViewLink;
    }

    return metadata;
  }

  static async downloadFile(
    provider: StorageProvider,
    identifier: string
  ): Promise<Buffer> {
    if (provider === "gcs") {
      const bucketName = process.env.GCS_BUCKET_NAME || DEFAULT_GCS_BUCKET;
      return await downloadFromGCS(bucketName, identifier);
    } else if (provider === "google-drive") {
      return await downloadFromGoogleDrive(identifier);
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  static async deleteFile(
    provider: StorageProvider,
    identifier: string
  ): Promise<void> {
    if (provider === "gcs") {
      const bucketName = process.env.GCS_BUCKET_NAME || DEFAULT_GCS_BUCKET;
      await deleteFromGCS(bucketName, identifier);
    } else if (provider === "google-drive") {
      await deleteFromGoogleDrive(identifier);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  static async createDriveFolder(
    folderName: string,
    parentFolderId?: string
  ): Promise<{ folderId: string; webViewLink: string }> {
    return await createGoogleDriveFolder(folderName, parentFolderId);
  }

  static async initializeDefaultFolders(): Promise<{
    invoices: string;
    jobPhotos: string;
    documents: string;
  }> {
    const invoicesFolder = await createGoogleDriveFolder("TGE - Invoices");
    const jobPhotosFolder = await createGoogleDriveFolder("TGE - Job Photos");
    const documentsFolder = await createGoogleDriveFolder("TGE - Documents");

    return {
      invoices: invoicesFolder.folderId,
      jobPhotos: jobPhotosFolder.folderId,
      documents: documentsFolder.folderId,
    };
  }
}
