const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');

// Create interface for CLI interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify the readline question method
function promptUser(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer));
  });
}

// Mock data for testing
const mockImages = [
  { name: 'sunset.jpg', size: 1024 * 1024 * 2, type: 'image/jpeg' },
  { name: 'abstract.png', size: 1024 * 1024 * 1.5, type: 'image/png' },
  { name: 'forest.jpg', size: 1024 * 1024 * 3, type: 'image/jpeg' },
  { name: 'mountains.webp', size: 1024 * 1024 * 4.2, type: 'image/webp' },
  { name: 'city.jpg', size: 1024 * 1024 * 2.8, type: 'image/jpeg' },
  // Add some invalid items for testing validation
  { name: 'oversized.jpg', size: 1024 * 1024 * 15, type: 'image/jpeg' }, // Over 10MB
  { name: 'invalid.gif', size: 1024 * 1024 * 1, type: 'image/gif' }, // Wrong format
];

// Sample CSV with different validation scenarios
const mockCsvData = `filename,title,description,category,price,tags
"sunset.jpg","Beautiful Sunset","A stunning sunset over the ocean","nature",0,"sunset,nature,orange,sky"
"abstract.png","Abstract Patterns","Colorful abstract geometric patterns","abstract",5,"abstract,colorful,pattern"
"forest.jpg","Dark Forest","Mysterious dark forest scene","dark",0,"forest,dark,trees"
"space.jpg","Galaxy","Deep space nebula","space",10,"space,stars,galaxy"
"","Missing Filename","This row has no filename","nature",0,"error,test"
"city.jpg","","This row has no title","colorful",8,"city,urban"
"invalid.csv","Invalid Category","This has an invalid category","nonexistent",5,"error,test"`;

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

// Initial state of the component
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
  isUploading: false,
  validationMode: 'warning', // 'warning' or 'strict'
  fileErrors: [],
  csvErrors: []
};

// Helper to print colored text
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
};

function log(text, color = 'reset') {
  console.log(colors[color] + text + colors.reset);
}

// Validation helper functions
function validateFile(file) {
  // Check file size
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: `File ${file.name} exceeds 10MB limit` };
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: `File ${file.name} is not a supported image format` };
  }

  return { valid: true };
}

function validateCsvRow(row, index) {
  const errors = [];
  
  // Required fields
  if (!row.title?.trim()) errors.push(`Row ${index + 1}: Missing title`);
  
  // Filename validation
  if (!row.filename?.trim()) {
    errors.push(`Row ${index + 1}: Missing filename`);
  }

  // Category validation
  if (row.category && !categories.some(c => c.value === row.category)) {
    errors.push(`Row ${index + 1}: Invalid category "${row.category}"`);
  }
  
  // Price validation
  if (row.price && (isNaN(parseFloat(row.price)) || parseFloat(row.price) < 0)) {
    errors.push(`Row ${index + 1}: Price must be a non-negative number`);
  }

  return { valid: errors.length === 0, errors };
}

// Test functions for different workflow steps
async function testFileUpload(options = {}) {
  log('\n=== TESTING: File Upload ===', 'blue');
  
  // Reset state
  state.files = [];
  state.fileErrors = [];
  state.activeTab = 'upload';
  
  // Set validation mode
  if (options.validationMode) {
    state.validationMode = options.validationMode;
    log(`Validation mode set to: ${state.validationMode}`, 'yellow');
  }
  
  // Filter images based on options
  let imageSet = [...mockImages];
  if (options.includeInvalid === false) {
    imageSet = mockImages.filter(img => {
      const validation = validateFile(img);
      return validation.valid;
    });
  }
  
  // Process the files
  const newErrors = [];
  const validFiles = [];
  
  imageSet.forEach(file => {
    const validation = validateFile(file);
    if (validation.valid) {
      validFiles.push(file);
    } else {
      newErrors.push(validation.error || `Invalid file: ${file.name}`);
    }
  });
  
  // Update error state
  state.fileErrors = newErrors;
  
  // Handle validation based on mode
  if (newErrors.length > 0) {
    if (state.validationMode === 'strict' && validFiles.length === 0) {
      log("File validation failed. No valid files were found.", 'red');
      log("Errors:", 'red');
      newErrors.forEach(err => log(`  - ${err}`, 'red'));
      return false;
    } else {
      log(`${newErrors.length} file(s) rejected:`, state.validationMode === 'strict' ? 'red' : 'yellow');
      newErrors.forEach(err => log(`  - ${err}`, state.validationMode === 'strict' ? 'red' : 'yellow'));
    }
  }
  
  // Create new file objects for valid files
  const newFiles = validFiles.map(file => {
    return {
      id: uuidv4(),
      file,
      preview: `mock-preview-url-for-${file.name}`,
      status: 'idle',
      progress: 0,
      metadata: { 
        title: file.name.split('.')[0], 
        description: '',
        category: state.defaultMetadata.category,
        price: state.defaultMetadata.price,
        tags: []
      }
    };
  });
  
  state.files = [...state.files, ...newFiles];
  
  // Show results
  log(`Added ${state.files.length} files to the upload queue:`, 'green');
  state.files.forEach(file => {
    log(`  - ${file.file.name} (${Math.round(file.file.size / 1024)} KB)`, 'cyan');
  });
  
  if (state.files.length > 0) {
    state.activeTab = 'metadata';
    log('Moving to metadata tab', 'yellow');
    return true;
  }
  
  return false;
}

async function testCsvImport(options = {}) {
  log('\n=== TESTING: CSV Import ===', 'blue');
  
  // Reset CSV data
  state.csvData = [];
  state.csvErrors = [];
  
  // Parse CSV data
  const csvToUse = options.csvData || mockCsvData;
  const lines = csvToUse.split('\n');
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
    log(`  Row ${i+1}: ${row.filename || '(no filename)'} - "${row.title || '(no title)'}"`, 'cyan');
  });
  
  // Validate CSV
  const errors = [];
  state.csvData.forEach((row, i) => {
    const validation = validateCsvRow(row, i);
    if (!validation.valid) {
      errors.push(...validation.errors);
    }
  });
  
  state.csvErrors = errors;
  
  if (errors.length) {
    log(`CSV validation: ${errors.length} errors found`, 'red');
    errors.forEach(err => log(`  - ${err}`, 'red'));
    
    if (state.validationMode === 'strict' && options.skipStrictCheck !== true) {
      log('In strict mode, CSV import would fail', 'red');
      return false;
    } else {
      log('In warning mode, CSV import would proceed with warnings', 'yellow');
    }
  } else {
    log('CSV validation passed successfully', 'green');
  }
  
  return true;
}

async function testMatchCsvToImages() {
  log('\n=== TESTING: Matching CSV data to images ===', 'blue');
  
  if (state.files.length === 0) {
    log("No files found. Please upload files first.", 'red');
    return false;
  }
  
  if (state.csvData.length === 0) {
    log("No CSV data found. Please import CSV first.", 'red');
    return false;
  }
  
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
        if (csvFilename && (file.file.name.includes(csvFilename) || csvFilename.includes(file.file.name))) {
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
  return true;
}

async function testApplySharedMetadata() {
  log('\n=== TESTING: Applying shared metadata ===', 'blue');
  
  if (state.files.length === 0) {
    log("No files found. Please upload files first.", 'red');
    return false;
  }
  
  // Get metadata to apply
  const description = await promptUser("Enter shared description (or press Enter for default): ");
  const category = await promptUser(`Enter category (${categories.map(c => c.value).join(', ')}): `);
  const tagsInput = await promptUser("Enter tags separated by commas: ");
  
  // Update default metadata
  state.defaultMetadata = {
    ...state.defaultMetadata,
    description: description || 'High-quality wallpaper for desktop and mobile',
    category: categories.some(c => c.value === category) ? category : state.defaultMetadata.category,
    tags: tagsInput ? tagsInput.split(',').map(t => t.trim()) : ['wallpaper', 'high-resolution']
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
  return true;
}

async function testUpload(options = {}) {
  log('\n=== TESTING: Upload process ===', 'blue');
  
  if (state.files.length === 0) {
    log("No files found. Please upload files first.", 'red');
    return false;
  }
  
  state.isUploading = true;
  const filesToUpload = state.files.filter(f => f.status !== 'success');
  state.processingCount = { total: filesToUpload.length, completed: 0 };
  
  log(`Starting upload of ${filesToUpload.length} files...`, 'yellow');
  
  // Set failure rate (percentage of files that will fail)
  const failureRate = options.failureRate !== undefined ? options.failureRate : 20;
  log(`Simulating ${failureRate}% failure rate for testing`, 'yellow');
  
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
          
          // Determine if this file should fail based on failure rate
          const shouldFail = Math.random() * 100 < failureRate;
          
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
      }, 300);
    });
  });
  
  // Handle the results
  try {
    const results = await Promise.allSettled(uploadPromises);
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
    
    return true;
  } catch (error) {
    log('Error in upload process:', 'red');
    log(error.message, 'red');
    return false;
  }
}

// Menu for interactive testing
async function showMenu() {
  log('\n=== BULK UPLOAD TESTING MENU ===', 'magenta');
  log('1. Test file validation and upload', 'cyan');
  log('2. Test CSV import and validation', 'cyan');
  log('3. Test CSV-to-image matching', 'cyan');
  log('4. Test shared metadata application', 'cyan');
  log('5. Test upload process', 'cyan');
  log('6. Run full workflow simulation', 'cyan');
  log('7. Toggle validation mode (current: ' + state.validationMode + ')', 'cyan');
  log('8. Reset state', 'cyan');
  log('9. Exit', 'cyan');
  
  const choice = await promptUser('\nEnter your choice (1-9): ');
  
  switch (choice) {
    case '1':
      await testFileUpload({ 
        includeInvalid: await promptUser('Include invalid files? (y/n): ') === 'y'
      });
      break;
    case '2':
      await testCsvImport({
        skipStrictCheck: await promptUser('Skip strict validation check? (y/n): ') === 'y'
      });
      break;
    case '3':
      await testMatchCsvToImages();
      break;
    case '4':
      await testApplySharedMetadata();
      break;
    case '5':
      await testUpload({
        failureRate: parseInt(await promptUser('Failure rate (0-100%): ') || '20')
      });
      break;
    case '6':
      await runFullWorkflow();
      break;
    case '7':
      state.validationMode = state.validationMode === 'warning' ? 'strict' : 'warning';
      log(`Validation mode switched to: ${state.validationMode}`, 'yellow');
      break;
    case '8':
      resetState();
      log('State has been reset', 'yellow');
      break;
    case '9':
      log('Exiting test script...', 'yellow');
      rl.close();
      return false;
    default:
      log('Invalid choice, please try again', 'red');
  }
  
  return true;
}

function resetState() {
  state = {
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
    isUploading: false,
    validationMode: state.validationMode, // Preserve current validation mode
    fileErrors: [],
    csvErrors: []
  };
}

async function runFullWorkflow() {
  log('\n=== RUNNING FULL WORKFLOW SIMULATION ===', 'magenta');
  
  // Step 1: File upload
  log('\nStep 1: File Upload', 'bold');
  const includeInvalid = await promptUser('Include invalid files? (y/n): ') === 'y';
  const fileUploadSuccess = await testFileUpload({ includeInvalid });
  
  if (!fileUploadSuccess) {
    log('File upload failed, aborting workflow', 'red');
    return;
  }
  
  // Step 2: CSV import
  log('\nStep 2: CSV Import', 'bold');
  const csvImportSuccess = await testCsvImport({ skipStrictCheck: true });
  
  if (!csvImportSuccess) {
    log('CSV import failed, aborting workflow', 'red');
    return;
  }
  
  // Step 3: Match CSV to images
  log('\nStep 3: CSV-Image Matching', 'bold');
  const matchingSuccess = await testMatchCsvToImages();
  
  if (!matchingSuccess) {
    log('CSV-Image matching failed, aborting workflow', 'red');
    return;
  }
  
  // Step 4: Apply shared metadata
  log('\nStep 4: Shared Metadata', 'bold');
  const metadataSuccess = await testApplySharedMetadata();
  
  if (!metadataSuccess) {
    log('Metadata application failed, aborting workflow', 'red');
    return;
  }
  
  // Step 5: Upload
  log('\nStep 5: Upload Process', 'bold');
  const failureRate = parseInt(await promptUser('Failure rate for testing (0-100%): ') || '20');
  const uploadSuccess = await testUpload({ failureRate });
  
  if (!uploadSuccess) {
    log('Upload process failed', 'red');
  } else {
    log('\nFull workflow simulation completed successfully!', 'green');
  }
}

// Main function to start interactive testing
async function startInteractiveTesting() {
  log('=== Bulk Upload Component Interactive Testing ===', 'bold');
  log('This script simulates the behavior of the bulk upload component', 'cyan');
  log('You can test individual functions or run a full workflow simulation', 'cyan');
  
  let continueRunning = true;
  while (continueRunning) {
    continueRunning = await showMenu();
  }
  
  process.exit(0);
}

// Start the interactive testing
startInteractiveTesting(); 