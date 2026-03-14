# Enhanced Invoice Features — TGE Operations

## Overview
The invoice system includes auto-save, parts catalog integration, file uploads, and Google Drive integration.

## New Features

### 1. Auto-Save Drafts ✅
**How it works:**
- Invoices automatically save as drafts every 2 seconds as you type
- No need to manually click "Save" while filling out the form
- A green badge appears showing the last auto-save time
- Drafts are stored with status "draft" until you finalize them

**Benefits:**
- Never lose your work if the browser crashes
- Switch between invoices without worrying about saving
- Perfect for partially completed invoices

**Usage:**
1. Start creating a new invoice
2. Select a client and begin filling fields
3. Watch for the green "Draft auto-saved" badge to appear
4. Continue working - it saves automatically every 2 seconds
5. Click "Save Invoice" when ready to finalize

---

### 2. Parts Catalog Integration ✅
**Sample parts included:**
- 15A Circuit Breaker ($12.50)
- 20A GFCI Outlet ($24.95)
- Romex 12/2 Wire ($89.99)
- LED Recessed Light ($15.75)
- Junction Box 4x4 ($3.25)
- Wire Nuts Pack ($8.50)
- Smoke Detector ($32.00)
- Dimmer Switch ($28.50)

**How to use:**
1. Click "+ Add Item" to create a line item
2. Click the "Parts" button next to the description field
3. Browse your parts catalog in the popup dialog
4. Click any part to automatically fill:
   - Description (name + details)
   - Unit price (from catalog)
   - Quantity (defaults to 1)
5. Adjust quantity as needed

**Managing parts catalog:**
- View all parts: GET /api/parts
- Add new part: POST /api/parts
- Update part: PATCH /api/parts/:id
- Delete part: DELETE /api/parts/:id

**Part fields:**
- name (required)
- description
- category (Breakers, Outlets, Wire, Lighting, Boxes, Connectors, Safety, Switches)
- manufacturer
- part_number
- unit_price (required)
- quantity_in_stock
- reorder_level
- image_url (for parts with images)
- tags (array of keywords)

---

### 3. File Upload System ✅
**Upload options:**
- Company logos
- Product images
- Invoice attachments
- Parts images

**How to upload:**
1. In the invoice form, find the "Attachments" section
2. Click "Upload Logo" for company branding
3. Click "Upload Images" for product photos (supports multiple)
4. Files are stored in Google Drive automatically
5. Files are linked to the invoice for easy access

**Supported formats:**
- Images: JPG, PNG, GIF, WebP
- Documents: PDF (auto-generated from invoices)

**Storage:**
- All files stored in Google Drive
- Accessible via web_view_link
- Organized by user folder
- Linked to invoices, jobs, or clients

---

### 4. Google Drive PDF Upload ✅
**Automatic PDF generation:**
- Professional invoice PDFs with T.G.E. Billing branding
- Texas Master Electrician License #750779 displayed
- Client information and itemized costs
- Tax breakdown and totals

**How to upload to Drive:**
1. Save your invoice (auto-saved or manually)
2. Click "Upload to Drive" button
3. PDF is generated automatically
4. File uploads to your Google Drive
5. Link opens in new tab to view the PDF
6. File is accessible from Google Drive forever

**PDF includes:**
- Invoice number and date
- Client name and contact
- Line items with descriptions, quantities, prices
- Subtotal, tax (8.25%), and total
- Company branding and license number
- Professional formatting

---

### 5. AI Assistant Quick Assist ✅
**Get help while creating invoices:**
1. Click the AI assistant button in the header
2. The TGE Assistant panel opens
3. Ask questions like:
   - "What's the standard markup for this service?"
   - "Help me describe this line item"
   - "What tax rate should I use?"
4. The assistant provides instant answers and suggestions

**The assistant can help with:**
- Pricing guidance
- Description writing
- Compliance questions
- Business best practices

---

## API Endpoints

### Parts Catalog
```
GET    /api/parts              # List all active parts
GET    /api/parts/:id          # Get single part
POST   /api/parts              # Create new part
PATCH  /api/parts/:id          # Update part
DELETE /api/parts/:id          # Soft delete (marks inactive)
```

### Invoice Enhancements
```
POST   /api/invoices/auto-save              # Auto-save draft invoice
POST   /api/invoices/:id/upload-to-drive    # Generate PDF and upload to Drive
```

### File Management
```
POST   /api/files/upload                    # Upload file (multipart/form-data)
GET    /api/files                           # List all files
GET    /api/files/invoice/:invoiceId        # Get files for invoice
DELETE /api/files/:id                       # Soft delete file
```

---

## Component Integration

### Using EnhancedInvoiceForm
```tsx
import { EnhancedInvoiceForm } from "@/components/enhanced-invoice-form";

// In your invoice creation dialog:
<EnhancedInvoiceForm
  invoice={selectedInvoice}  // undefined for new, or existing invoice object
  onSuccess={() => {
    // Called when invoice is saved
    setDialogOpen(false);
  }}
  onCancel={() => {
    // Called when user clicks cancel
    setDialogOpen(false);
  }}
/>
```

### Features included:
- ✅ Auto-save (2-second debounce)
- ✅ Parts catalog selector
- ✅ File upload (logo & images)
- ✅ Google Drive PDF upload
- ✅ AI assistant quick assist
- ✅ Real-time calculations
- ✅ Client selection from database
- ✅ Tax rate configuration
- ✅ Line item management

---

## Testing the Features

### Test Auto-Save:
1. Go to Invoices page
2. Click "Create Invoice"
3. Select a client
4. Start typing in any field
5. Wait 2 seconds - see "Draft auto-saved" badge appear
6. Refresh page and reopen - your work is saved

### Test Parts Catalog:
1. Create new invoice
2. Click "+ Add Item"
3. Click "Parts" button
4. Select "15A Circuit Breaker"
5. See description and price auto-fill
6. Adjust quantity and save

### Test File Upload:
1. In invoice form, find "Attachments" section
2. Click "Upload Logo"
3. Select an image file
4. See success toast notification
5. File is now in Google Drive

### Test Google Drive PDF:
1. Create and save an invoice
2. Click "Upload to Drive" button
3. Wait for "Uploading..." message
4. PDF opens in new tab automatically
5. Check your Google Drive - file is there!

### Test Sparky Assist:
1. While creating invoice, click "Ask Sparky"
2. AI assistant opens
3. Ask: "What markup should I use for electrical parts?"
4. Get instant professional advice

---

## Database Schema

### Parts Table
```sql
CREATE TABLE parts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  manufacturer TEXT,
  part_number TEXT,
  unit_price TEXT NOT NULL DEFAULT '0',
  quantity_in_stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  image_url TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

### Files Table (Enhanced)
- Added `part_id` foreign key for linking images to parts
- Supports both Google Drive and Google Cloud Storage
- Soft delete with `is_deleted` flag

---

## Best Practices

### For Auto-Save:
- Don't rely on auto-save for final submission
- Always click "Save Invoice" when ready to send
- Auto-save only creates drafts, not final invoices

### For Parts Catalog:
- Keep prices updated regularly
- Use descriptive names and categories
- Add manufacturer and part numbers for easy lookup
- Set reorder levels to avoid stockouts

### For File Uploads:
- Use logos sparingly (one per invoice)
- Compress images before upload
- Use descriptive filenames
- Keep files under 5MB for best performance

### For Google Drive:
- Upload PDF after invoice is finalized
- Share Drive links with clients for easy access
- Organize by client or date in Drive folders
- Set appropriate permissions on shared files

---

## Troubleshooting

### Auto-save not working?
- Check that you've selected a client
- Ensure at least one line item exists
- Look for network errors in browser console

### Parts not appearing?
- Run: `SELECT COUNT(*) FROM parts;` to verify data
- Check parts are marked `is_active = true`
- Refresh the invoice page

### File upload failing?
- Check file size (max 10MB)
- Ensure Google Drive connection is active
- Verify user has `drive_folder_id` set

### Google Drive PDF not generating?
- Save invoice first (must have an ID)
- Check invoice has all required fields
- Verify Google Drive API is accessible

---

## Next Steps

1. **Create more parts**: Add your entire inventory to the parts catalog
2. **Test with real invoices**: Use auto-save for your daily work
3. **Upload logos**: Add company branding to invoices
4. **Share PDFs**: Send Google Drive links to clients
5. **Train team**: Show employees how to use parts catalog

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify database connections
3. Test API endpoints directly
4. Ask Sparky AI for help!

---

**Created:** November 8, 2025  
**Version:** 1.0.0  
**License:** T.G.E. Billing Internal Use
