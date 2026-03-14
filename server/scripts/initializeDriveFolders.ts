import { storage } from '../storage';
import { StorageService } from '../storageService';

async function initializeDriveFolders() {
  console.log('🚀 Initializing Google Drive folders for admin/employee users...\n');
  
  try {
    const users = await storage.getAllUsers();
    const adminEmployeeUsers = users.filter(
      u => (u.role === 'admin' || u.role === 'employee')
    );
    
    console.log(`Found ${adminEmployeeUsers.length} admin/employee users`);
    console.log('────────────────────────────────────────────────────\n');
    
    let created = 0;
    let existing = 0;
    let errors = 0;
    
    for (const user of adminEmployeeUsers) {
      try {
        if (user.drive_folder_id && user.drive_folder_url) {
          console.log(`✓ ${user.name} (${user.role})`);
          console.log(`  Folder exists: ${user.drive_folder_url}\n`);
          existing++;
          continue;
        }
        
        console.log(`📁 Creating folder for ${user.name} (${user.role})...`);
        
        const folder = await StorageService.createUserDriveFolder(user);
        
        if (folder) {
          await storage.updateUser(user.id, {
            drive_folder_id: folder.folderId,
            drive_folder_url: folder.webViewLink,
          });
          
          console.log(`✅ Created successfully!`);
          console.log(`   Folder ID: ${folder.folderId}`);
          console.log(`   Link: ${folder.webViewLink}\n`);
          created++;
        }
      } catch (error) {
        console.error(`❌ Error creating folder for ${user.name}:`, error);
        errors++;
      }
    }
    
    console.log('────────────────────────────────────────────────────');
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ✓ Already existed: ${existing}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📁 Total admin/employee users: ${adminEmployeeUsers.length}`);
    console.log('────────────────────────────────────────────────────\n');
    
    if (errors === 0) {
      console.log('🎉 Success! All folders are ready.');
      console.log('💡 Access folders at: https://drive.google.com (tgebilling@gmail.com)\n');
    } else {
      console.log('⚠️  Some folders failed to create. Check errors above.\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

console.log('╔═══════════════════════════════════════════════════╗');
console.log('║  Google Drive Folder Initialization Script       ║');
console.log('║  ElectraPro - T.G.E. Billing                     ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

initializeDriveFolders();
