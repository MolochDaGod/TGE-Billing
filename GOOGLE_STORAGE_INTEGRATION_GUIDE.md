# Google Storage Integration Guide - T.G.E. Billing ElectraPro

## Overview

ElectraPro uses a dual-storage system for managing files:
1. **Google Drive** - Document management for admin/employee users (accessible via tgebilling@gmail.com)
2. **Google Cloud Storage** - Scalable blob storage for job photos and large files

---

## 🎯 Architecture

### **Automatic User Folders**

When an admin or employee user is created, ElectraPro automatically:
1. Creates a personal Google Drive folder named `TGE - [User Name] ([Role])`
2. Shares the folder with tgebilling@gmail.com (write access)
3. Stores the folder ID and URL in the user's database record
4. All documents uploaded by that user automatically save to their folder

**Example folder names:**
- `TGE - John Smith (admin)`
- `TGE - Sarah Johnson (employee)`

---

## 📋 Prerequisites

### **1. Google Cloud Project Setup**

**Your project details:**
- Project ID: `crack-saga-476904-u9`
- Project Number: `1009244502007`
- Service Account Email: `service-1009244502007@gs-project-accounts.iam.gserviceaccount.com`

### **2. Required APIs**

Enable these APIs in Google Cloud Console:

```
✅ Google Drive API
✅ Cloud Storage API
✅ Identity and Access Management (IAM) API
```

**Enable via Console:**
https://console.cloud.google.com/apis/library?project=crack-saga-476904-u9

### **3. Service Account Configuration**

**Create Service Account Key:**
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=crack-saga-476904-u9
2. Select: `service-1009244502007@gs-project-accounts.iam.gserviceaccount.com`
3. Click "Keys" → "Add Key" → "Create New Key"
4. Choose: **JSON**
5. Download the key file (keep it secure!)

**Required Roles:**
- Storage Admin (for Google Cloud Storage)
- Service Account Token Creator (for Drive API)

---

## 🔐 Environment Variables Setup

### **Step 1: Extract Service Account Credentials**

Open your downloaded JSON key file and extract these values:

```json
{
  "type": "service_account",
  "project_id": "crack-saga-476904-u9",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-1009244502007@gs-project-accounts.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

### **Step 2: Add to Replit Secrets**

Add these secrets in the Replit Secrets panel (🔒 icon in sidebar):

| Secret Name | Value | Example |
|-------------|-------|---------|
| `GCS_PROJECT_ID` | `crack-saga-476904-u9` | Your Google Cloud Project ID |
| `GCS_CLIENT_EMAIL` | `service-1009244502007@gs-project-accounts.iam.gserviceaccount.com` | From JSON `client_email` |
| `GCS_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` | **Entire** private key from JSON |
| `GCS_BUCKET_NAME` | `tgebilling-files` | (Optional) Custom bucket name |

**IMPORTANT:** For `GCS_PRIVATE_KEY`:
- Copy the ENTIRE private_key value including:
  - `-----BEGIN PRIVATE KEY-----`
  - All the encoded key data
  - `-----END PRIVATE KEY-----`
- Keep the `\n` characters (they represent newlines)
- The value should look like: `-----BEGIN PRIVATE KEY-----\nMIIEvgIBA...==\n-----END PRIVATE KEY-----\n`

---

## 🪣 Google Cloud Storage Bucket Setup

### **Step 1: Create Bucket**

```bash
# Via Google Cloud Console
1. Go to: https://console.cloud.google.com/storage/browser?project=crack-saga-476904-u9
2. Click "Create Bucket"
3. Bucket name: tgebilling-files
4. Location: us-central1 (or your preferred region)
5. Storage class: Standard
6. Access control: Uniform
7. Click "Create"
```

### **Step 2: Set Bucket Permissions**

```bash
# Grant service account full access
1. Click on bucket name "tgebilling-files"
2. Go to "Permissions" tab
3. Click "Grant Access"
4. Add principal: service-1009244502007@gs-project-accounts.iam.gserviceaccount.com
5. Role: "Storage Object Admin"
6. Click "Save"
```

### **Step 3: Configure CORS (for web uploads)**

Create a `cors.json` file:

```json
[
  {
    "origin": ["https://tgebilling.pro", "https://t-g-e.replit.app", "https://t-g-e.replit.dev"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS configuration:

```bash
gsutil cors set cors.json gs://tgebilling-files
```

---

## 🚗 Google Drive Connection

### **Already Configured!**

✅ Google Drive connection is already set up via Replit
✅ Authenticated with tgebilling@gmail.com
✅ Full Drive API access enabled

**No additional setup needed for Google Drive!**

---

## 💾 Database Schema

### **Users Table (Updated)**

```typescript
users {
  id: varchar (UUID)
  name: text
  email: text
  role: text (admin, employee, client)
  
  // NEW: Google Drive integration
  drive_folder_id: text        // Google Drive folder ID
  drive_folder_url: text       // Direct link to folder
  
  created_at: timestamp
}
```

### **Files Table (New)**

```typescript
files {
  id: varchar (UUID)
  uploaded_by: varchar → users.id
  
  // File metadata
  file_name: text              // Unique filename
  original_name: text          // Original uploaded name
  mime_type: text             // File type
  file_size: integer          // Size in bytes
  category: text              // invoice, job-photo, document, other
  storage_provider: text      // google-drive or gcs
  
  // Google Drive fields
  drive_file_id: text
  drive_folder_id: text
  web_view_link: text
  web_content_link: text
  
  // Google Cloud Storage fields
  gcs_bucket_name: text
  gcs_file_path: text
  gcs_public_url: text
  
  // Related entities
  invoice_id: varchar → invoices.id
  job_id: varchar → jobs.id
  client_id: varchar → clients.id
  
  // Metadata
  description: text
  tags: text[]
  is_deleted: boolean
  
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 🔧 API Usage

### **Create User Drive Folder**

```typescript
import { StorageService } from './server/storageService';
import { storage } from './server/storage';

// When creating admin/employee user
const user = await storage.createUser({
  name: "John Smith",
  email: "john@example.com",
  role: "admin", // or "employee"
  ...
});

// Create their personal Drive folder
const folder = await StorageService.createUserDriveFolder(user);

if (folder) {
  // Update user with folder details
  await storage.updateUser(user.id, {
    drive_folder_id: folder.folderId,
    drive_folder_url: folder.webViewLink,
  });
  
  console.log(`✅ Created folder for ${user.name}: ${folder.webViewLink}`);
}
```

### **Upload File to User's Folder**

```typescript
import { StorageService } from './server/storageService';
import { storage } from './server/storage';

// Upload invoice PDF for admin user
const user = await storage.getUserById(userId);
const fileBuffer = await fs.readFile('invoice.pdf');

const metadata = await StorageService.uploadFileForUser(
  user,
  'invoice-12345.pdf',
  fileBuffer,
  'application/pdf',
  'invoice'
);

// Save file metadata to database
const fileRecord = await storage.createFile({
  uploaded_by: user.id,
  file_name: metadata.fileName,
  original_name: metadata.originalName,
  mime_type: metadata.mimeType,
  file_size: metadata.size,
  category: 'invoice',
  storage_provider: 'google-drive',
  drive_file_id: metadata.fileId,
  drive_folder_id: user.drive_folder_id,
  web_view_link: metadata.webViewLink,
  web_content_link: metadata.publicUrl,
  invoice_id: invoiceId, // optional
});

console.log(`✅ File uploaded: ${metadata.webViewLink}`);
```

### **Upload to Google Cloud Storage**

```typescript
import { StorageService } from './server/storageService';

// Upload job photo to GCS
const photoBuffer = await fs.readFile('job-photo.jpg');

const metadata = await StorageService.uploadFile({
  provider: 'gcs',
  fileName: 'job-photo-001.jpg',
  fileBuffer: photoBuffer,
  mimeType: 'image/jpeg',
  category: 'job-photo',
});

console.log(`✅ Photo uploaded: ${metadata.publicUrl}`);
// Public URL: https://storage.googleapis.com/tgebilling-files/2025-01-15-job-photo-001-abc12345.jpg
```

### **Download File**

```typescript
import { StorageService } from './server/storageService';

// Download from Google Drive
const fileBuffer = await StorageService.downloadFile(
  'google-drive',
  driveFileId
);

// Download from GCS
const photoBuffer = await StorageService.downloadFile(
  'gcs',
  'job-photo-001.jpg'
);
```

---

## 🚀 Initialization Script

### **Create Folders for Existing Users**

Create `server/scripts/initializeDriveFolders.ts`:

```typescript
import { storage } from '../storage';
import { StorageService } from '../storageService';

async function initializeDriveFolders() {
  console.log('🚀 Initializing Google Drive folders for admin/employee users...\n');
  
  const users = await storage.getAllUsers();
  const adminEmployeeUsers = users.filter(
    u => u.role === 'admin' || u.role === 'employee'
  );
  
  console.log(`Found ${adminEmployeeUsers.length} admin/employee users`);
  
  for (const user of adminEmployeeUsers) {
    try {
      if (user.drive_folder_id && user.drive_folder_url) {
        console.log(`✓ ${user.name} - Folder already exists: ${user.drive_folder_url}`);
        continue;
      }
      
      console.log(`Creating folder for ${user.name} (${user.role})...`);
      
      const folder = await StorageService.createUserDriveFolder(user);
      
      if (folder) {
        await storage.updateUser(user.id, {
          drive_folder_id: folder.folderId,
          drive_folder_url: folder.webViewLink,
        });
        
        console.log(`✅ ${user.name} - Created: ${folder.webViewLink}\n`);
      }
    } catch (error) {
      console.error(`❌ Error creating folder for ${user.name}:`, error);
    }
  }
  
  console.log('\n✅ Done! All folders created.');
}

initializeDriveFolders().catch(console.error);
```

**Run the script:**

```bash
tsx server/scripts/initializeDriveFolders.ts
```

---

## 📁 Folder Structure in Google Drive

After initialization, tgebilling@gmail.com will see:

```
My Drive
├── TGE - John Doe (admin)
│   ├── 2025-01-15-invoice-12345-abc12345.pdf
│   ├── 2025-01-15-job-report-abc12345.docx
│   └── ...
├── TGE - Sarah Johnson (employee)
│   ├── 2025-01-14-client-contract-xyz67890.pdf
│   ├── 2025-01-14-safety-checklist-xyz67890.pdf
│   └── ...
└── TGE - Mike Williams (employee)
    └── ...
```

**Each folder:**
- Shared with tgebilling@gmail.com (write access)
- Contains all documents uploaded by that user
- Organized by date in filenames
- Accessible via web link stored in database

---

## 🔍 File Naming Convention

All uploaded files follow this pattern:

```
{DATE}-{ORIGINAL_NAME}-{UNIQUE_ID}.{EXT}
```

**Examples:**
- `2025-01-15-invoice-12345-AbC7x9Yz.pdf`
- `2025-01-14-job-photo-001-Kl3mN8Pq.jpg`
- `2025-01-13-contract-smith-Qr5sT2Uv.docx`

**Benefits:**
- Chronological sorting
- No filename collisions
- Maintains original name for context
- Unique identifier for tracking

---

## 📊 Storage Costs

### **Google Drive**
- ✅ **FREE** for tgebilling@gmail.com Google Workspace account
- 30GB+ storage included
- Unlimited for Google Workspace Business plans

### **Google Cloud Storage**
- **Standard Storage:** $0.020 per GB/month
- **Data Transfer:** Free for first 1GB/month
- **Example costs:**
  - 10GB storage: ~$0.20/month
  - 100GB storage: ~$2.00/month
  - 1TB storage: ~$20/month

**Recommendation:** Use Google Drive for documents (free), GCS for large media files.

---

## 🛡️ Security Best Practices

### **Service Account Key Security**

✅ **DO:**
- Store service account key in Replit Secrets
- Never commit key to version control
- Rotate keys every 90 days
- Use least-privilege IAM roles

❌ **DON'T:**
- Hardcode credentials in source code
- Share key files via email or Slack
- Commit `.json` key files to Git
- Use keys for multiple projects

### **File Access Control**

- Admin/Employee folders: Shared with tgebilling@gmail.com only
- Client uploads: No folder sharing (isolated)
- GCS buckets: Service account access only
- Database records: Track all file operations

---

## 🧪 Testing Checklist

### **Google Drive Integration**

- [ ] Create admin user → Folder created automatically
- [ ] Create employee user → Folder created automatically
- [ ] Create client user → No folder created (correct)
- [ ] Upload file as admin → Saves to admin's folder
- [ ] Upload file as employee → Saves to employee's folder
- [ ] View folder in Google Drive as tgebilling@gmail.com
- [ ] Download file via API
- [ ] Delete file (soft delete in database)

### **Google Cloud Storage Integration**

- [ ] Upload job photo → Saved to GCS bucket
- [ ] Upload large file → Saved to GCS bucket
- [ ] Get public URL → Accessible via browser
- [ ] Download file via API
- [ ] Delete file from bucket

---

## 🐛 Troubleshooting

### **Error: "GCS_CLIENT_EMAIL and GCS_PRIVATE_KEY must be set"**

**Cause:** Missing environment variables

**Solution:**
1. Add `GCS_CLIENT_EMAIL` to Replit Secrets
2. Add `GCS_PRIVATE_KEY` to Replit Secrets
3. Restart the workflow

---

### **Error: "Google Drive not connected"**

**Cause:** Google Drive Replit connection not set up

**Solution:**
1. Check Google Drive connection in Replit integrations
2. Re-authenticate if needed
3. Verify `REPLIT_CONNECTORS_HOSTNAME` env var exists

---

### **Error: "Error:0909006C:PEM routines"**

**Cause:** Private key formatting issue

**Solution:**
1. Ensure `GCS_PRIVATE_KEY` includes `\n` characters
2. Don't manually format the key
3. Copy entire value from JSON file as-is
4. The code automatically converts `\n` to actual newlines

---

### **Error: "Bucket does not exist"**

**Cause:** GCS bucket not created

**Solution:**
1. Create bucket: https://console.cloud.google.com/storage/browser?project=crack-saga-476904-u9
2. Name it `tgebilling-files` (or your custom name)
3. Grant service account "Storage Object Admin" role

---

### **Error: "Insufficient Permission"**

**Cause:** Service account lacks required roles

**Solution:**
1. Go to IAM: https://console.cloud.google.com/iam-admin/iam?project=crack-saga-476904-u9
2. Find: `service-1009244502007@gs-project-accounts.iam.gserviceaccount.com`
3. Add roles:
   - Storage Admin
   - Service Account Token Creator

---

## 📞 Support

**Google Cloud Console:**
https://console.cloud.google.com/?project=crack-saga-476904-u9

**Service Account:**
service-1009244502007@gs-project-accounts.iam.gserviceaccount.com

**Google Drive Access:**
tgebilling@gmail.com

**Documentation:**
- Google Drive API: https://developers.google.com/drive/api
- Google Cloud Storage: https://cloud.google.com/storage/docs
- Replit Secrets: https://docs.replit.com/programming-ide/workspace-features/secrets

---

## ✅ Summary

**ElectraPro Storage System:**

1. **Admin/Employee Users:**
   - Get personal Google Drive folder automatically
   - All uploads save to their folder
   - Accessible via tgebilling@gmail.com

2. **Client Users:**
   - No personal folder
   - Uploads saved to general location
   - Restricted access

3. **Large Files:**
   - Job photos → Google Cloud Storage
   - Invoices/Documents → Google Drive
   - Public URLs for GCS files

4. **Database Tracking:**
   - Every file logged in `files` table
   - Links to invoices, jobs, clients
   - Soft delete (never truly removed)

**Setup Time:** ~15 minutes
**Cost:** Free (Google Drive) + Minimal (GCS)
**Maintenance:** None (fully automated)

🎉 **Your professional document management system is ready!**
