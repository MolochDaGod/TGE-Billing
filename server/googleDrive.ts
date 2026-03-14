import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

// Google Drive folder IDs — configurable via env vars so they can be updated
// without a code change. Falls back to the known TGE folder IDs.
const DRAFT_INVOICES_FOLDER_ID =
  process.env.GOOGLE_DRIVE_DRAFT_FOLDER_ID || '15eLIImIN3ugrwV5kBscM-pitNpg58TW5';
const SENT_INVOICES_FOLDER_ID =
  process.env.GOOGLE_DRIVE_SENT_FOLDER_ID || '1GjX-A2GKs-2e98exDkUCjVQQnUkBGufz';

// Company email that gets writer access to newly created Drive folders
export const COMPANY_DRIVE_EMAIL =
  process.env.GOOGLE_DRIVE_COMPANY_EMAIL || 'tgebilling@gmail.com';

export async function getGoogleDriveClient() {
  // Check for service account credentials from environment variable first
  const serviceAccountKey = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountKey) {
    try {
      // Service account authentication from environment variable
      const credentials = JSON.parse(serviceAccountKey);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
      return google.drive({ version: "v3", auth });
    } catch (e) {
      console.warn('[Google Drive] Failed to parse service account key from env, falling back to OAuth');
    }
  }
  
  // Fallback to file-based service account (for local development)
  const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json');
  if (fs.existsSync(serviceAccountPath)) {
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    return google.drive({ version: "v3", auth });
  }
  
  throw new Error(
    "Google Drive not configured. Set GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY env var or provide service-account-key.json"
  );
}

export async function uploadToGoogleDrive(
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
  folderId?: string,
  invoiceStatus?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> {
  const drive = await getGoogleDriveClient();

  const fileMetadata: any = {
    name: fileName,
  };

  // Route to appropriate folder based on invoice status
  if (invoiceStatus) {
    if (invoiceStatus === 'draft') {
      // Draft invoices go to TGE FORMS folder
      fileMetadata.parents = [DRAFT_INVOICES_FOLDER_ID];
    } else {
      // Sent, paid, overdue, cancelled go to SENT folder
      fileMetadata.parents = [SENT_INVOICES_FOLDER_ID];
    }
  } else if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const media = {
    mimeType,
    body: require("stream").Readable.from(fileBuffer),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: "id, name, webViewLink, webContentLink",
  });

  return {
    fileId: response.data.id!,
    webViewLink: response.data.webViewLink!,
    webContentLink: response.data.webContentLink || "",
  };
}

export async function downloadFromGoogleDrive(
  fileId: string
): Promise<Buffer> {
  const drive = await getGoogleDriveClient();

  const response = await drive.files.get(
    {
      fileId,
      alt: "media",
    },
    { responseType: "arraybuffer" }
  );

  return Buffer.from(response.data as ArrayBuffer);
}

export async function deleteFromGoogleDrive(fileId: string): Promise<void> {
  const drive = await getGoogleDriveClient();
  await drive.files.delete({ fileId });
}

export async function listGoogleDriveFiles(
  folderId?: string
): Promise<Array<{ id: string; name: string; mimeType: string }>> {
  const drive = await getGoogleDriveClient();

  const query = folderId ? `'${folderId}' in parents` : undefined;

  const response = await drive.files.list({
    q: query,
    fields: "files(id, name, mimeType, webViewLink)",
    pageSize: 100,
  });

  return (
    response.data.files?.map((file) => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
    })) || []
  );
}

export async function createGoogleDriveFolder(
  folderName: string,
  parentFolderId?: string
): Promise<{ folderId: string; webViewLink: string }> {
  const drive = await getGoogleDriveClient();

  const fileMetadata: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };

  if (parentFolderId) {
    fileMetadata.parents = [parentFolderId];
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id, webViewLink",
  });

  return {
    folderId: response.data.id!,
    webViewLink: response.data.webViewLink!,
  };
}

export async function shareGoogleDriveFile(
  fileId: string,
  email: string,
  role: "reader" | "writer" | "commenter" = "reader"
): Promise<void> {
  const drive = await getGoogleDriveClient();

  await drive.permissions.create({
    fileId,
    requestBody: {
      type: "user",
      role,
      emailAddress: email,
    },
  });
}

/**
 * Upload invoice data as JSON to Google Drive for backup/sync
 */
export async function uploadInvoiceDataToDrive(
  invoiceNumber: string,
  invoiceData: any,
  invoiceStatus: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
): Promise<{ fileId: string; webViewLink: string }> {
  const fileName = `invoice-${invoiceNumber}.json`;
  const jsonBuffer = Buffer.from(JSON.stringify(invoiceData, null, 2), 'utf-8');
  
  const result = await uploadToGoogleDrive(
    fileName,
    jsonBuffer,
    'application/json',
    undefined,
    invoiceStatus
  );
  
  return {
    fileId: result.fileId,
    webViewLink: result.webViewLink,
  };
}

/**
 * Download and parse all invoice JSON files from both Drive folders
 */
export async function syncInvoicesFromDrive(): Promise<any[]> {
  const drive = await getGoogleDriveClient();
  const invoices: any[] = [];
  
  // Sync from both folders
  const folders = [DRAFT_INVOICES_FOLDER_ID, SENT_INVOICES_FOLDER_ID];
  
  for (const folderId of folders) {
    try {
      // List all JSON files in folder
      const response = await drive.files.list({
        q: `'${folderId}' in parents and mimeType='application/json' and name contains 'invoice-'`,
        fields: "files(id, name, mimeType)",
        pageSize: 1000,
      });
      
      const files = response.data.files || [];
      
      // Download and parse each JSON file
      for (const file of files) {
        try {
          const fileData = await downloadFromGoogleDrive(file.id!);
          const invoiceData = JSON.parse(fileData.toString('utf-8'));
          invoices.push(invoiceData);
        } catch (error) {
          console.error(`Error parsing invoice ${file.name}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error syncing from folder ${folderId}:`, error);
    }
  }
  
  return invoices;
}
