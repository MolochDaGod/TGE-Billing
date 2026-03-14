import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ICON_SIZES = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512];
const SOURCE_ICON = 'attached_assets/tgelogo_1763888346781.webp';
const OUTPUT_DIR = 'client/public';

async function generateIcons() {
  console.log('Generating PWA icons...');
  
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error('Source icon not found:', SOURCE_ICON);
    process.exit(1);
  }

  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    
    try {
      await sharp(SOURCE_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 26, g: 26, b: 26, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`Created: icon-${size}.png`);
    } catch (error) {
      console.error(`Failed to create icon-${size}.png:`, error);
    }
  }

  for (const size of [192, 512]) {
    const outputPath = path.join(OUTPUT_DIR, `icon-maskable-${size}.png`);
    
    try {
      const iconSize = Math.floor(size * 0.6);
      const padding = Math.floor((size - iconSize) / 2);
      
      const icon = await sharp(SOURCE_ICON)
        .resize(iconSize, iconSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();
      
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 229, g: 250, b: 0, alpha: 1 }
        }
      })
        .composite([{
          input: icon,
          top: padding,
          left: padding
        }])
        .png()
        .toFile(outputPath);
      
      console.log(`Created: icon-maskable-${size}.png`);
    } catch (error) {
      console.error(`Failed to create icon-maskable-${size}.png:`, error);
    }
  }

  const faviconPath = path.join(OUTPUT_DIR, 'favicon.png');
  try {
    await sharp(SOURCE_ICON)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 26, g: 26, b: 26, alpha: 1 }
      })
      .png()
      .toFile(faviconPath);
    
    console.log('Created: favicon.png');
  } catch (error) {
    console.error('Failed to create favicon.png:', error);
  }

  console.log('PWA icon generation complete!');
}

generateIcons().catch(console.error);
