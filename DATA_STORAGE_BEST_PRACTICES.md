# Data Storage Best Practices - T.G.E. Billing
## Invoice Storage, Backups, and Admin/Employee Data Management

**Last Updated:** November 2025

---

## 🎯 **Overview**

This document outlines best practices for storing, organizing, and protecting critical business data including:
- 📄 **Invoices & Financial Records**
- 📸 **Before/After Job Photos**
- 📋 **Work Orders & Compliance Documents**
- 👥 **Admin & Employee Created Data**
- 💾 **Database Backups**

---

## 📄 **1. Invoice Storage Best Practices**

### **A. Invoice Retention Requirements**

**Legal Requirements (Texas):**
- ✅ **Minimum Retention:** 7 years (IRS requirement)
- ✅ **Electronic Storage:** Legally acceptable (IRS guidelines)
- ✅ **Format:** PDF (preferred), images, or electronic records
- ✅ **Accessibility:** Must be retrievable for audits

**Best Practice for T.G.E. Billing:**
```
Keep ALL invoices indefinitely (disk space is cheap, legal risk is expensive)
```

---

### **B. Invoice File Naming Convention**

**Format:**
```
INV-[YYYY]-[NUMBER]-[CLIENT_LAST_NAME]-[AMOUNT].pdf

Examples:
INV-2025-00001-Smith-$1250.00.pdf
INV-2025-00234-Johnson-$850.50.pdf
INV-2025-01567-ABC_Electric_Corp-$12500.00.pdf
```

**Why This Format:**
- ✅ Sortable by date (year first)
- ✅ Unique invoice number prevents duplicates
- ✅ Client name makes it searchable
- ✅ Amount visible without opening file
- ✅ Works across all operating systems

---

### **C. Invoice Directory Structure**

**Recommended Folder Organization:**

```
/invoices/
├── 2023/
│   ├── 01-January/
│   │   ├── INV-2023-00001-Smith-$500.00.pdf
│   │   ├── INV-2023-00002-Jones-$1200.00.pdf
│   │   └── ...
│   ├── 02-February/
│   └── ... (12 months)
├── 2024/
│   ├── 01-January/
│   └── ...
├── 2025/
│   ├── 01-January/
│   ├── 02-February/
│   └── ...
└── paid/
    ├── 2023/
    ├── 2024/
    └── 2025/
```

**Benefits:**
- Easy to find invoices by date
- Separate paid vs unpaid (optional)
- Works well for tax preparation
- Compatible with backup systems

---

### **D. Invoice PDF Generation**

**Required Elements in Every Invoice PDF:**

```typescript
// Invoice PDF must include:
✅ Company name: "T.G.E. Billing"
✅ License number: "Texas Master Electrician #750779"
✅ Business address
✅ Phone & email
✅ Invoice number (unique, sequential)
✅ Invoice date
✅ Due date
✅ Client name & address
✅ Itemized services (description, qty, rate, amount)
✅ Subtotal, tax (if applicable), total
✅ Payment terms
✅ Payment instructions (check, card, online link)
✅ Footer: "Thank you for your business!"
```

**PDF Library Recommendation:**
- **For ElectraPro:** Use `puppeteer` or `jsPDF`
- **Reason:** Generate from HTML template (easier to style)
- **Storage:** Replit Object Storage (see section 2)

---

### **E. Invoice Metadata Storage**

**In PostgreSQL Database (`invoices` table):**

```sql
-- Store these in database for fast querying:
- invoice_id (UUID)
- invoice_number (INV-2025-00001)
- client_id (FK to clients table)
- created_by (admin/employee user_id)
- issue_date
- due_date
- subtotal
- tax_amount
- total_amount
- status (draft, sent, paid, overdue, cancelled)
- pdf_url (link to stored PDF in Object Storage)
- stripe_payment_intent_id (if paid via Stripe)
- paid_at (timestamp)
- notes
```

**In Object Storage (PDF files):**
- Actual invoice PDF
- Signed invoice (if customer signs)
- Related photos (before/after)

**Why Split:**
- Database = fast searches, filtering, reporting
- Object Storage = actual file storage (cheaper, scalable)

---

## 💾 **2. Replit Object Storage (App Storage)**

### **What is Replit Object Storage?**

**Replit's built-in file storage:**
- ✅ **Cost:** Free tier available, then pay-as-you-grow
- ✅ **Speed:** Fast CDN delivery
- ✅ **Scalability:** Handles GB-TB of files
- ✅ **Security:** Private by default, public URLs on demand
- ✅ **Backup:** Replit handles redundancy

**Perfect For:**
- Invoice PDFs
- Before/after job photos
- Employee-uploaded documents (permits, certifications)
- Company logos, branding assets
- Customer signatures
- Compliance documents

---

### **A. Setup Replit Object Storage**

**Step 1: Enable Object Storage**
```bash
# Already available - no installation needed!
# Replit Object Storage is built-in
```

**Step 2: Create Storage Buckets (Folders)**

```typescript
// Recommended bucket structure:
/invoices/        // Invoice PDFs
/job-photos/      // Before/after photos
/permits/         // Electrical permits & compliance docs
/certifications/  // Employee licenses, certifications
/signatures/      // Customer signature images
/company/         // Logo, branding assets
/backups/         // Database backups (JSON exports)
```

---

### **B. File Upload Best Practices**

**File Size Limits:**
- Images: Max 10 MB per file
- PDFs: Max 25 MB per file
- Videos: Max 100 MB per file

**Accepted File Types:**

**Invoices:**
- ✅ `.pdf` (preferred)
- ✅ `.html` (for email-friendly invoices)

**Photos:**
- ✅ `.jpg`, `.jpeg` (preferred - smaller file size)
- ✅ `.png` (for logos, graphics)
- ✅ `.webp` (modern, efficient)

**Documents:**
- ✅ `.pdf` (permits, contracts)
- ✅ `.docx`, `.xlsx` (editable documents)

**Signatures:**
- ✅ `.png` (transparent background)
- ✅ `.svg` (scalable)

---

### **C. File Naming for Object Storage**

**Format:**
```
[TYPE]_[DATE]_[ID]_[DESCRIPTION].[EXT]

Examples:
invoice_2025-01-15_00234_smith_panel_upgrade.pdf
photo_before_2025-01-15_job-567_kitchen_panel.jpg
photo_after_2025-01-15_job-567_kitchen_panel.jpg
permit_2025-01-10_permit-12345_residential_rewire.pdf
cert_2024-12-01_chris_tdlr_750779.pdf
signature_2025-01-15_client-abc123_approval.png
```

**Benefits:**
- Sortable by type and date
- Unique IDs prevent duplicates
- Descriptive names aid searching
- Clear before/after pairing

---

### **D. Access Control**

**Public vs Private Files:**

**PUBLIC (accessible to anyone with URL):**
- Company logo
- Marketing images
- Public portfolio photos (with client permission)

**PRIVATE (requires authentication):**
- ✅ Invoice PDFs
- ✅ Customer signatures
- ✅ Permits & compliance documents
- ✅ Employee certifications
- ✅ Before/after photos (unless client approved sharing)

**Implementation:**
```typescript
// When uploading a file:
const isPublic = fileType === 'logo' || fileType === 'marketing';

// Store in database:
{
  file_url: 'https://storage.replit.app/invoices/INV-2025-00001.pdf',
  is_public: false, // Requires auth to access
  uploaded_by: userId,
  access_roles: ['admin', 'employee'], // Who can view
}
```

---

## 📸 **3. Job Photos & Media Management**

### **A. Photo Organization**

**Folder Structure:**
```
/job-photos/
├── 2025/
│   ├── job-00001-smith-panel-upgrade/
│   │   ├── before_kitchen_panel.jpg
│   │   ├── before_service_entrance.jpg
│   │   ├── after_kitchen_panel.jpg
│   │   ├── after_service_entrance.jpg
│   │   └── during_install_1.jpg
│   ├── job-00002-jones-rewire/
│   └── ...
└── 2024/
```

---

### **B. Photo Requirements**

**For Every Job, Take:**
1. **Before Photos** (minimum 2)
   - Existing panel/work area
   - Any issues/damage (close-up)

2. **During Photos** (minimum 3)
   - Work in progress
   - Key installation steps
   - Technician at work

3. **After Photos** (minimum 2)
   - Completed installation
   - Clean work area
   - Final result (close-up)

**Photo Specs:**
- Resolution: Minimum 1920x1080 (2MP)
- Format: JPEG (smaller file size)
- Lighting: Well-lit, clear view
- Include: Date/time stamp (camera metadata)

---

### **C. Photo Metadata**

**Store in Database:**
```sql
CREATE TABLE job_photos (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  photo_type TEXT, -- 'before', 'during', 'after'
  photo_url TEXT, -- Object Storage URL
  description TEXT,
  taken_by UUID REFERENCES users(id), -- Which tech took it
  taken_at TIMESTAMP,
  is_portfolio_approved BOOLEAN DEFAULT false, -- Can we share publicly?
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

---

## 👥 **4. Admin & Employee Data Storage**

### **A. User-Created Documents**

**Types of Documents:**
- Work orders
- Estimates/quotes
- Customer notes
- Compliance checklists
- Permit applications
- Inspection reports

**Storage Strategy:**
- **Structured Data:** PostgreSQL (text fields, JSON)
- **Files/PDFs:** Object Storage
- **Link:** Store Object Storage URL in database

---

### **B. Employee Certifications & Licenses**

**Required Documents (per Employee):**
- ✅ TDLR Electrician License (copy)
- ✅ Driver's License (for background check)
- ✅ Insurance Certificate
- ✅ Safety Training Certificates
- ✅ Continuing Education Credits

**Folder Structure:**
```
/certifications/
├── chris_rodriguez/
│   ├── tdlr_license_750779.pdf
│   ├── drivers_license.pdf
│   ├── insurance_cert_2025.pdf
│   └── safety_training_2025.pdf
├── john_smith/
└── ...
```

**Retention:**
- Keep current + past 7 years
- Renewal alerts: 30 days before expiration
- Store in database: expiration dates, renewal reminders

---

### **C. Admin-Only Documents**

**Sensitive Documents (Admin Access Only):**
- ✅ Financial statements
- ✅ Tax returns
- ✅ Employee contracts
- ✅ Insurance policies
- ✅ Business licenses & permits
- ✅ Bank statements
- ✅ Confidential client agreements

**Storage Location:**
- Replit Object Storage (private, encrypted)
- Access: Admin role only
- Audit log: Track who accessed what

---

## 💾 **5. Database Backup Strategy**

### **A. Replit Database Backups (Built-In)**

**Automatic Backups:**
- ✅ Replit automatically backs up PostgreSQL database
- ✅ Rollback capability (via Replit Checkpoints)
- ✅ Point-in-time recovery available
- ✅ Geographic redundancy (Neon Serverless)

**Manual Backups:**
```bash
# Export database to SQL file
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Store in Object Storage or download locally
```

---

### **B. Backup Schedule**

**Recommended Frequency:**

**CRITICAL DATA (Invoices, Payments, Jobs):**
- ✅ Daily automated backups
- ✅ Keep 30 daily backups
- ✅ Keep 12 monthly backups
- ✅ Keep 7 yearly backups

**MODERATE DATA (Clients, Work Orders):**
- ✅ Weekly automated backups
- ✅ Keep 8 weekly backups
- ✅ Keep 6 monthly backups

**LOW-PRIORITY DATA (Marketing, Content):**
- ✅ Monthly backups
- ✅ Keep 12 monthly backups

---

### **C. Backup Testing**

**Test Restore Process:**
- ✅ Monthly: Restore a backup to test environment
- ✅ Verify data integrity
- ✅ Document restore time (should be < 1 hour)

**Disaster Recovery Plan:**
1. Identify failure (data loss, corruption)
2. Stop production system
3. Restore from most recent clean backup
4. Verify data integrity
5. Resume operations
6. Investigate cause

---

## 🔐 **6. Security Best Practices**

### **A. Data Encryption**

**At Rest:**
- ✅ Replit Object Storage: Encrypted by default (AES-256)
- ✅ PostgreSQL Database: Encrypted by Neon Serverless
- ✅ Sensitive fields: Additional encryption (SSNs, credit cards - DON'T STORE!)

**In Transit:**
- ✅ HTTPS only (TLS 1.3)
- ✅ No HTTP access to files
- ✅ Secure API endpoints

---

### **B. Access Control**

**Role-Based Access:**

**ADMIN:**
- ✅ Full access to all data
- ✅ Can delete/modify any record
- ✅ View financial reports
- ✅ Access employee certifications
- ✅ Download backups

**EMPLOYEE:**
- ✅ View assigned jobs
- ✅ Upload job photos
- ✅ Create work orders
- ✅ View own certifications
- ❌ Cannot delete invoices
- ❌ Cannot view financial reports

**CLIENT:**
- ✅ View own invoices
- ✅ View own job history
- ✅ Make payments
- ❌ Cannot see other clients
- ❌ Cannot edit invoices

---

### **C. Audit Logging**

**Track Critical Actions:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT, -- 'invoice_created', 'invoice_deleted', 'payment_received'
  resource_type TEXT, -- 'invoice', 'client', 'payment'
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

**Log These Events:**
- ✅ Invoice creation, modification, deletion
- ✅ Payment processing
- ✅ User login/logout (failed attempts)
- ✅ File uploads/downloads
- ✅ Role changes
- ✅ Settings modifications

**Retention:**
- Keep audit logs for 7 years (compliance)
- Archive old logs to Object Storage (cheaper)

---

## 📊 **7. Data Retention Policies**

### **A. Financial Records**

**Invoices:**
- ✅ Retention: 7 years minimum (IRS requirement)
- ✅ Recommendation: Keep indefinitely
- ✅ Format: PDF + database record

**Payments:**
- ✅ Retention: 7 years minimum
- ✅ Include: Transaction ID, amount, date, method
- ✅ Stripe records: Keep payment intent IDs

---

### **B. Customer Data**

**Active Clients:**
- ✅ Retention: Indefinitely (while customer relationship exists)
- ✅ Include: Contact info, job history, notes

**Inactive Clients:**
- ✅ Retention: 7 years after last service
- ✅ Then: Archive or delete (GDPR/privacy)

**Customer Requests to Delete:**
- ✅ Right to be forgotten (GDPR/CCPA)
- ✅ Exception: Keep invoices/financial records (legal requirement)
- ✅ Action: Anonymize name/contact, keep transaction records

---

### **C. Job Photos & Media**

**Before/After Photos:**
- ✅ Retention: 3 years minimum
- ✅ Marketing use: Get client permission (written)
- ✅ Portfolio: Keep best examples indefinitely

**Work Orders:**
- ✅ Retention: 7 years (same as invoices)
- ✅ Compliance docs: Keep with permits

---

### **D. Employee Records**

**Active Employees:**
- ✅ Retention: Duration of employment + 7 years
- ✅ Include: Certifications, performance, training

**Former Employees:**
- ✅ Retention: 7 years after termination
- ✅ Required: Employment dates, position, pay rate
- ✅ Optional (after 7 years): Delete non-essential records

---

## 🛠️ **8. Implementation Checklist**

### **Immediate (Week 1):**
- [ ] Set up Replit Object Storage buckets
- [ ] Create invoice PDF generation system
- [ ] Implement file upload for job photos
- [ ] Test backup & restore process

### **Short-Term (Month 1):**
- [ ] Implement role-based access control for files
- [ ] Create audit logging system
- [ ] Set up automated daily backups
- [ ] Organize existing files into proper structure

### **Long-Term (Quarter 1):**
- [ ] Implement data retention automation (archive old files)
- [ ] Create admin dashboard for storage metrics
- [ ] Set up backup monitoring & alerts
- [ ] Document disaster recovery procedures

---

## 📈 **9. Storage Monitoring & Metrics**

### **Track These Metrics:**

**Storage Usage:**
- Total GB used (by category: invoices, photos, docs)
- Growth rate (MB/month)
- Cost projections

**Database Size:**
- Total rows (by table)
- Largest tables
- Query performance

**Backup Health:**
- Last successful backup timestamp
- Backup file size
- Backup duration
- Failed backups (alert!)

**Access Patterns:**
- Most accessed files
- Orphaned files (in storage but not in database)
- Duplicate files

---

## 💰 **10. Cost Optimization**

### **Reduce Storage Costs:**

**Compress Images:**
```javascript
// Before uploading, compress JPEG:
quality: 85%, // vs 100% - saves 50% space, minimal quality loss
format: 'jpeg' // vs PNG - smaller for photos
```

**Archive Old Data:**
- Move invoices older than 3 years to cheaper storage tier
- Keep database records, archive PDFs

**Delete Unused Files:**
- Orphaned uploads (uploaded but job cancelled)
- Duplicate photos
- Test/demo data

**Set Lifecycle Rules:**
- Auto-delete temp files after 30 days
- Move old backups to archive tier (if available)

---

## 🚨 **11. Security Incidents & Response**

### **If Data is Lost/Corrupted:**

1. **Immediate:** Stop all write operations
2. **Assess:** Determine scope (what data, when, how)
3. **Restore:** From most recent clean backup
4. **Verify:** Test restored data integrity
5. **Resume:** Gradual rollout, monitor closely
6. **Document:** What happened, how to prevent

### **If Unauthorized Access Detected:**

1. **Immediate:** Revoke access tokens, reset passwords
2. **Investigate:** Who accessed what, when
3. **Contain:** Lock down affected accounts
4. **Notify:** Customers if their data was accessed (legal requirement)
5. **Secure:** Fix vulnerability, update access controls
6. **Monitor:** Watch for further suspicious activity

---

## 📞 **12. Support & Resources**

### **Replit Documentation:**
- Object Storage: https://docs.replit.com/hosting/deployments/object-storage
- Database Backups: https://docs.replit.com/category/postgresql

### **Compliance Resources:**
- IRS Record Retention: https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records
- TDLR Requirements: https://www.tdlr.texas.gov/electricians/electricians.htm

### **Best Practices:**
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- OWASP Security Guidelines: https://owasp.org/

---

## ✅ **Summary: Quick Reference**

**Invoices:**
- Format: PDF
- Naming: INV-YYYY-NUMBER-CLIENT-AMOUNT.pdf
- Storage: Replit Object Storage + Database metadata
- Retention: 7 years minimum (keep indefinitely)

**Photos:**
- Format: JPEG (compressed)
- Naming: photo_before/after_DATE_JOBID_DESC.jpg
- Storage: Object Storage
- Retention: 3 years minimum

**Backups:**
- Frequency: Daily (critical), Weekly (moderate)
- Retention: 30 daily, 12 monthly, 7 yearly
- Test: Monthly restore test

**Access:**
- Admin: Full access
- Employee: Job-specific
- Client: Own data only

**Security:**
- Encryption: At rest & in transit
- Audit: Log all critical actions
- Review: Quarterly access audits

---

**Your data is your business. Protect it like it matters—because it does.** 🔒
