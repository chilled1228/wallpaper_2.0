const fs = require('fs');
const path = require('path');
const https = require('https');

// Paths
const PUBLIC_DIR = path.join(process.cwd(), 'public');

// List of required fallback images
const requiredImages = [
  { 
    name: 'default-wallpaper.jpg',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'category-nature.jpg',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'category-landscape.jpg',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'category-abstract.jpg',
    url: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'category-minimal.jpg',
    url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'category-dark.jpg',
    url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'category-city.jpg',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'category-space.jpg',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'category-tech.jpg',
    url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'category-art.jpg',
    url: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'category-gradient.jpg',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'trending-wallpaper-1.jpg',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'trending-wallpaper-2.jpg',
    url: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'trending-wallpaper-3.jpg',
    url: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'trending-wallpaper-4.jpg',
    url: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'collection-work.jpg',
    url: 'https://images.unsplash.com/photo-1581896184337-1330180ac3e6?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'collection-calm.jpg',
    url: 'https://images.unsplash.com/photo-1459478309853-2c33a60058e7?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'collection-vibrant.jpg',
    url: 'https://images.unsplash.com/photo-1501696461415-6bd6660c6742?q=80&w=1200&auto=format&fit=crop'
  },
  { 
    name: 'featured-wallpaper.jpg',
    url: 'https://images.unsplash.com/photo-1485470733090-0aae1788d5af?q=80&w=1200&auto=format&fit=crop'
  },
  {
    name: 'devices-mockup.png',
    url: 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.jpg'
  }
];

// Function to download an image
function downloadImage(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image, status code: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${destination}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Ensure public directory exists
function ensurePublicDirectoryExists() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    console.log('Created public directory');
  }
}

// Function to check if file exists and has valid size
function isValidFile(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).size > 100;
  } catch (error) {
    return false;
  }
}

// Main function
async function ensureFallbackImages() {
  try {
    console.log('Checking for missing fallback images...');
    ensurePublicDirectoryExists();
    
    const promises = [];
    
    for (const image of requiredImages) {
      const filePath = path.join(PUBLIC_DIR, image.name);
      
      // Check if file exists and has content (size > 100 bytes)
      const fileExists = isValidFile(filePath);
      
      if (!fileExists) {
        console.log(`Missing or invalid file: ${image.name}`);
        promises.push(downloadImage(image.url, filePath));
      } else {
        console.log(`✓ Already exists: ${image.name}`);
      }
    }
    
    if (promises.length === 0) {
      console.log('All fallback images are already in place.');
    } else {
      console.log(`Downloading ${promises.length} missing images...`);
      await Promise.all(promises);
      console.log('All fallback images have been downloaded successfully.');
    }
  } catch (error) {
    console.error('Error ensuring fallback images:', error);
    process.exit(1);
  }
}

// Run the script
ensureFallbackImages(); 