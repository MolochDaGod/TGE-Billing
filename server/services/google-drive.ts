import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

export async function getGoogleDriveClient() {
  // Service account from environment variable
  const serviceAccountKey = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountKey) {
    try {
      const credentials = JSON.parse(serviceAccountKey);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
      return google.drive({ version: 'v3', auth });
    } catch (e) {
      console.warn('[Google Drive Service] Failed to parse service account key from env');
    }
  }
  
  // Fallback to file-based service account (local development)
  const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json');
  if (fs.existsSync(serviceAccountPath)) {
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    return google.drive({ version: 'v3', auth });
  }
  
  throw new Error(
    'Google Drive not configured. Set GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY env var or provide service-account-key.json'
  );
}

export interface FolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

export async function findOrCreateFolder(folderName: string, parentFolderId?: string): Promise<FolderInfo> {
  try {
    const drive = await getGoogleDriveClient();
    
    let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    }
    
    const existingFolders = await drive.files.list({
      q: query,
      fields: 'files(id, name, webViewLink)',
      spaces: 'drive'
    });
    
    if (existingFolders.data.files && existingFolders.data.files.length > 0) {
      const folder = existingFolders.data.files[0];
      return {
        id: folder.id!,
        name: folder.name!,
        webViewLink: folder.webViewLink || undefined
      };
    }
    
    const fileMetadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }
    
    const newFolder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, webViewLink'
    });
    
    return {
      id: newFolder.data.id!,
      name: newFolder.data.name!,
      webViewLink: newFolder.data.webViewLink || undefined
    };
  } catch (error) {
    console.error('Error finding/creating folder:', error);
    throw error;
  }
}

export interface UploadedFile {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
}

export async function uploadFile(
  fileName: string, 
  content: Buffer | string, 
  mimeType: string, 
  folderId?: string
): Promise<UploadedFile> {
  try {
    const drive = await getGoogleDriveClient();
    
    const fileMetadata: any = { name: fileName };
    if (folderId) {
      fileMetadata.parents = [folderId];
    }
    
    const media = {
      mimeType,
      body: typeof content === 'string' ? Buffer.from(content) : content
    };
    
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, webViewLink, webContentLink'
    });
    
    return {
      id: file.data.id!,
      name: file.data.name!,
      webViewLink: file.data.webViewLink || undefined,
      webContentLink: file.data.webContentLink || undefined
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export async function uploadPDFToClientFolder(
  pdfBuffer: Buffer,
  fileName: string,
  clientName: string,
  folderType: 'invoices' | 'quotes' | 'contracts' | 'documents' = 'invoices'
): Promise<UploadedFile> {
  try {
    const tgeBillingFolder = await findOrCreateFolder('T.G.E. Billing');
    
    const clientsFolder = await findOrCreateFolder('Clients', tgeBillingFolder.id);
    
    const sanitizedClientName = clientName.replace(/[<>:"/\\|?*]/g, '_').trim();
    const clientFolder = await findOrCreateFolder(sanitizedClientName, clientsFolder.id);
    
    const typeFolder = await findOrCreateFolder(
      folderType.charAt(0).toUpperCase() + folderType.slice(1), 
      clientFolder.id
    );
    
    const uploadedFile = await uploadFile(fileName, pdfBuffer, 'application/pdf', typeFolder.id);
    
    console.log(`PDF uploaded to Google Drive: ${fileName} -> ${clientName}/${folderType}`);
    return uploadedFile;
  } catch (error) {
    console.error('Error uploading PDF to client folder:', error);
    throw error;
  }
}

export async function listFilesInFolder(folderId: string): Promise<Array<{id: string; name: string; mimeType: string}>> {
  try {
    const drive = await getGoogleDriveClient();
    
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType)',
      orderBy: 'modifiedTime desc'
    });
    
    return (response.data.files || []).map(file => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!
    }));
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

export async function deleteFile(fileId: string): Promise<void> {
  try {
    const drive = await getGoogleDriveClient();
    await drive.files.delete({ fileId });
    console.log(`File deleted from Google Drive: ${fileId}`);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}
