const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Mock data for testing
const mockImages = [
  { name: 'sunset.jpg', size: 1024 * 1024 * 2, type: 'image/jpeg' },
  { name: 'abstract.png', size: 1024 * 1024 * 1.5, type: 'image/png' },
  { name: 'forest.jpg', size: 1024 * 1024 * 3, type: 'image/jpeg' },
  { name: 'mountains.webp', size: 1024 * 1024 * 4.2, type: 'image/webp' },
  { name: 'city.jpg', size: 1024 * 1024 * 2.8, type: 'image/jpeg' }
];

// Sample CSV that would match some of the images
const mockCsvData = `filename,title,description,category,price,tags
"sunset.jpg","Beautiful Sunset","A stunning sunset over the ocean","nature",0,"sunset,nature,orange,sky"
"abstract.png","Abstract Patterns","Colorful abstract geometric patterns","abstract",5,"abstract,colorful,pattern"
"forest.jpg","Dark Forest","Mysterious dark forest scene","dark",0,"forest,dark,trees"
"space.jpg","Galaxy","Deep space nebula","space",10,"space,stars,galaxy"`;

// Categories from the component
const categories = [
  { label: 'Abstract', value: 'abstract' },
  { label: 'Nature', value: 'nature' },
  { label: 'Minimalist', value: 'minimalist' },
  { label: 'Dark', value: 'dark' },
  { label: 'Colorful', value: 'colorful' },
  { label: 'Technology', value: 'technology' },
  { label: 'Space', value: 'space' },
  { label: 'Art', value: 'art' }
];

// Mock state of the component
let state = {
  files: [],
  csvData: [],
  activeTab: 'upload',
  workflowStep: 'upload',
  defaultMetadata: {
    title: '',
    description: '',
    category: 'abstract',
    price: 0,
    tags: []
  },
  processingCount: { total: 0, completed: 0 },
  uploadProgress: 0,
  isUploading: false
};

// Helper to print colored text
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(text, color = 'reset') {
  console.log(colors[color] + text + colors.reset);
}

// Simulate file drop functionality
function simulateFileDrop() {
  log('\n=== Step 1: Simulating file drop ===', 'blue');
  
  // Create mock file objects with UUID
  state.files = mockImages.map(img => ({
    id: uuidv4(),
    file: {
      name: img.name,
      size: img.size,
      type: img.type
    },
    preview: `mock-preview-url-for-${img.name}`,
    status: 'idle',
    progress: 0,
    metadata: { 
      title: img.name.split('.')[0], 
      description: '',
      category: state.defaultMetadata.category,
      price: state.defaultMetadata.price,
      tags: []
    }
  }));
  
  log(`Added ${state.files.length} files to the upload queue`, 'green');
  state.files.forEach(file => {
    log(`  - ${file.file.name} (${Math.round(file.file.size / 1024)} KB)`, 'cyan');
  });
  
  state.activeTab = 'metadata';
  log('Moving to metadata tab', 'yellow');
}

// Simulate CSV import
function simulateCsvImport() {
  log('\n=== Step 2: Simulating CSV import ===', 'blue');
  
  // Parse mock CSV data
  const lines = mockCsvData.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  state.csvData = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/"/g, '').trim());
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i];
      return obj;
    }, {});
  });
  
  log('CSV data imported:', 'green');
  state.csvData.forEach((row, i) => {
    log(`  Row ${i+1}: ${row.filename} - "${row.title}"`, 'cyan');
  });
  
  // Validate CSV
  const errors = [];
  state.csvData.forEach((row, i) => {
    if (!row.title) errors.push(`Row ${i+1}: Missing title`);
    if (!row.filename) errors.push(`Row ${i+1}: Missing filename`);
    if (row.category && !categories.some(c => c.value === row.category)) {
      errors.push(`Row ${i+1}: Invalid category "${row.category}"`);
    }
  });
  
  if (errors.length) {
    log('CSV validation errors:', 'red');
    errors.forEach(err => log(`  - ${err}`, 'red'));
  } else {
    log('CSV validation passed', 'green');
  }
}

// Simulate matching CSV to images
function simulateMatchCsvToImages() {
  log('\n=== Step 3: Matching CSV data to images ===', 'blue');
  
  // Create a lookup map of CSV data by filename
  const csvByFilename = new Map();
  state.csvData.forEach(row => {
    if (row.filename) {
      csvByFilename.set(row.filename.trim(), row);
    }
  });
  
  let matchedCount = 0;
  let partialMatchCount = 0;
  let unmatchedCount = 0;
  
  // Update files with matched CSV data
  state.files = state.files.map(file => {
    // Try exact filename match first
    let csvMatch = csvByFilename.get(file.file.name);
    let matchType = 'exact';
    
    // If no exact match, try partial match
    if (!csvMatch) {
      // Try to find partial matches
      for (const [csvFilename, data] of csvByFilename.entries()) {
        if (file.file.name.includes(csvFilename) || csvFilename.includes(file.file.name)) {
          csvMatch = data;
          matchType = 'partial';
          partialMatchCount++;
          break;
        }
      }
      
      if (!csvMatch) {
        unmatchedCount++;
      }
    } else {
      matchedCount++;
    }
    
    // Apply CSV data if matched
    if (csvMatch) {
      return {
        ...file,
        metadata: {
          title: csvMatch.title || file.metadata.title,
          description: csvMatch.description || file.metadata.description,
          category: csvMatch.category || file.metadata.category,
          price: csvMatch.price ? parseFloat(csvMatch.price) : file.metadata.price,
          tags: csvMatch.tags ? csvMatch.tags.split(',').map(tag => tag.trim()) : file.metadata.tags,
        },
        matchType
      };
    }
    
    return file;
  });
  
  log(`Match results: ${matchedCount} exact, ${partialMatchCount} partial, ${unmatchedCount} unmatched`, 'green');
  
  // Show each file's metadata after matching
  state.files.forEach(file => {
    const matchStatus = file.matchType === 'exact' ? '✓' : file.matchType === 'partial' ? '~' : '✗';
    log(`  ${matchStatus} ${file.file.name}:`, file.matchType === 'exact' ? 'green' : file.matchType === 'partial' ? 'yellow' : 'red');
    log(`    Title: ${file.metadata.title}`, 'cyan');
    log(`    Category: ${file.metadata.category}`, 'cyan');
    log(`    Price: ${file.metadata.price}`, 'cyan');
    log(`    Tags: ${file.metadata.tags.join(', ') || 'none'}`, 'cyan');
  });
  
  state.activeTab = 'review';
  log('Moving to review tab', 'yellow');
}

// Simulate applying shared metadata
function simulateApplySharedMetadata() {
  log('\n=== Step 4: Applying shared metadata ===', 'blue');
  
  // Update default metadata
  state.defaultMetadata = {
    ...state.defaultMetadata,
    description: 'High-quality wallpaper for desktop and mobile',
    category: 'nature',
    tags: ['wallpaper', 'high-resolution', '4k']
  };
  
  log('Updated shared metadata:', 'green');
  log(`  Description: ${state.defaultMetadata.description}`, 'cyan');
  log(`  Category: ${state.defaultMetadata.category}`, 'cyan');
  log(`  Tags: ${state.defaultMetadata.tags.join(', ')}`, 'cyan');
  
  // Apply to all files
  state.files = state.files.map(file => ({
    ...file,
    metadata: {
      ...file.metadata,
      description: state.defaultMetadata.description,
      category: state.defaultMetadata.category,
      tags: [...file.metadata.tags, ...state.defaultMetadata.tags.filter(t => !file.metadata.tags.includes(t))]
    }
  }));
  
  log('Shared metadata applied to all files', 'green');
}

// Simulate the upload process
function simulateUpload() {
  log('\n=== Step 5: Simulating upload process ===', 'blue');
  
  state.isUploading = true;
  const filesToUpload = state.files.filter(f => f.status !== 'success');
  state.processingCount = { total: filesToUpload.length, completed: 0 };
  
  log(`Starting upload of ${filesToUpload.length} files...`, 'yellow');
  
  // Simulate the async nature of uploads
  const uploadPromises = filesToUpload.map((file, index) => {
    return new Promise((resolve, reject) => {
      log(`Starting upload for ${file.file.name}...`, 'cyan');
      
      // Update file status to uploading
      state.files = state.files.map(f => 
        f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f
      );
      
      // Simulate progress updates
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5; // Random progress between 5-20%
        
        if (progress >= 100) {
          clearInterval(progressInterval);
          progress = 100;
          
          // 10% chance of error for testing error handling
          const shouldFail = Math.random() < 0.1;
          
          if (shouldFail) {
            log(`Upload failed for ${file.file.name}!`, 'red');
            state.files = state.files.map(f => 
              f.id === file.id ? { ...f, status: 'error', error: 'Simulated upload failure', progress } : f
            );
            reject(new Error('Simulated upload failure'));
          } else {
            log(`Upload completed for ${file.file.name}!`, 'green');
            const downloadURL = `https://firebasestorage.googleapis.com/mock-url/${file.id}`;
            state.files = state.files.map(f => 
              f.id === file.id ? { ...f, status: 'success', downloadURL, progress } : f
            );
            resolve(downloadURL);
          }
          
          // Update processing count
          state.processingCount.completed++;
          
          // Update overall progress
          state.uploadProgress = Math.round((state.processingCount.completed / state.processingCount.total) * 100);
          log(`Overall progress: ${state.uploadProgress}%`, 'yellow');
        } else {
          // Update progress
          state.files = state.files.map(f => 
            f.id === file.id ? { ...f, progress } : f
          );
          log(`${file.file.name}: ${progress}%`, 'cyan');
        }
      }, 500);
    });
  });
  
  // Handle the results
  Promise.allSettled(uploadPromises).then(results => {
    state.isUploading = false;
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    log('\n=== Upload Process Completed ===', 'blue');
    log(`Results: ${successful} succeeded, ${failed} failed`, successful === filesToUpload.length ? 'green' : 'yellow');
    
    // Final state summary
    log('\n=== Final State Summary ===', 'magenta');
    state.files.forEach(file => {
      const statusColor = file.status === 'success' ? 'green' : file.status === 'error' ? 'red' : 'yellow';
      log(`${file.file.name}: ${file.status.toUpperCase()} ${file.status === 'error' ? '- ' + file.error : ''}`, statusColor);
    });
  });
}

// Run the test scenario
function runTest() {
  log('=== Starting Bulk Upload Test Simulation ===', 'magenta');
  
  // Step 1: Simulate file drop
  simulateFileDrop();
  
  // Step 2: Simulate CSV import
  setTimeout(simulateCsvImport, 1000);
  
  // Step 3: Match CSV to images
  setTimeout(simulateMatchCsvToImages, 2000);
  
  // Step 4: Apply shared metadata
  setTimeout(simulateApplySharedMetadata, 3000);
  
  // Step 5: Start the upload process
  setTimeout(simulateUpload, 4000);
}

// Run the test
runTest();
