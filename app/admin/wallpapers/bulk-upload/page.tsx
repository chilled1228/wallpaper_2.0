'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db, storage, auth } from '@/lib/firebase';
import { collection, addDoc, Timestamp, doc, getDoc, getDocs, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { useDropzone } from 'react-dropzone';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Image as ImageIcon, AlertCircle, CheckCircle2, X, FileText, HelpCircle, Search, Download, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Papa from 'papaparse';
import React from 'react';
import { FixedSizeGrid } from 'react-window';

type FileStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: FileStatus;
  progress: number;
  error?: string;
  metadata: {
    title: string;
    description: string;
    category: string;
    price: number;
    tags: string[];
    dimensions?: string;
  };
  downloadURL?: string;
  uploadTask?: any; // Reference to the uploadTask for cancellation
  isCanceled?: boolean;
  isRetrying?: boolean;
  isPendingPublication?: boolean; // Flag to track if the file needs to be published to Firestore
}

interface CategoryOption {
  label: string;
  value: string;
}

// Default categories as a starting point
const defaultCategories: CategoryOption[] = [
  { label: 'Abstract', value: 'abstract' },
  { label: 'Nature', value: 'nature' },
  { label: 'Minimalist', value: 'minimalist' },
  { label: 'Dark', value: 'dark' },
  { label: 'Colorful', value: 'colorful' },
  { label: 'Technology', value: 'technology' },
  { label: 'Space', value: 'space' },
  { label: 'Art', value: 'art' }
];

// Sample CSV template data
const CSV_TEMPLATE = `filename,title,description,category,price,tags
"sunset.jpg","Sunset Mountain","Beautiful sunset over mountains","nature",0,"sunset,mountains,nature"
"abstract.png","Abstract Pattern","Colorful abstract pattern","abstract",5,"abstract,colorful,pattern"
"forest.jpg","Dark Forest","Mysterious dark forest scene","dark",0,"forest,dark,trees"`;

// Add validation helper functions near the top of the file
const validateFile = (file: File): { valid: boolean; error?: string } => {
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
};

// Remove the category validation from csv row validation - we'll handle it differently
const validateCsvRow = (
  row: { [key: string]: string }, 
  index: number, 
  availableFiles?: File[],
  availableCategories?: CategoryOption[]
): { valid: boolean; errors: string[]; newCategory?: string } => {
  const errors: string[] = [];
  let newCategory: string | undefined;
  
  // Required fields
  if (!row.title?.trim()) errors.push(`Row ${index + 1}: Missing title`);
  
  // Filename validation (add this check)
  if (!row.filename?.trim()) {
    errors.push(`Row ${index + 1}: Missing filename`);
  } else if (availableFiles && availableFiles.length > 0) {
    // Check if the filename exists in the uploaded files
    const fileExists = availableFiles.some(file => 
      file.name === row.filename.trim() || 
      file.name.includes(row.filename.trim()) || 
      row.filename.trim().includes(file.name)
    );
    
    if (!fileExists) {
      errors.push(`Row ${index + 1}: File "${row.filename.trim()}" not found in uploaded files (will be skipped)`);
    }
  }

  // Category validation - if provided but not in available categories, mark as new
  if (row.category && availableCategories) {
    const categoryExists = availableCategories.some(c => c.value === row.category.toLowerCase());
    if (!categoryExists) {
      // If category doesn't exist, mark it as new but don't add error
      newCategory = row.category.trim();
    }
  }
  
  // Price validation
  if (row.price && (isNaN(parseFloat(row.price)) || parseFloat(row.price) < 0)) {
    errors.push(`Row ${index + 1}: Price must be a non-negative number`);
  }

  return { valid: errors.length === 0, errors, newCategory };
};

// Add a small component for file upload status visualization
const FileProgressIndicator = React.memo(({ file }: { file: UploadFile }) => {
  // Helper function to determine the progress bar color based on progress and status
  const getProgressColor = () => {
    if (file.status === 'error') return 'bg-red-500';
    if (file.status === 'success') return 'bg-green-500';
    if (file.progress < 30) return 'bg-blue-500';
    if (file.progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Helper function to get a human-readable status message
  const getStatusMessage = () => {
    if (file.status === 'error') return `Error: ${file.error || 'Upload failed'}`;
    if (file.status === 'success') return 'Upload complete';
    if (file.status === 'uploading') {
      if (file.isCanceled) return 'Cancelled';
      if (file.isRetrying) return `Retrying... ${file.progress}%`;
      return `Uploading... ${file.progress}%`;
    }
    return 'Waiting to upload';
  };

  // Get status icon based on file state
  const getStatusIcon = () => {
    if (file.status === 'error') return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
    if (file.status === 'success') return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    if (file.status === 'uploading') return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />;
    return <Upload className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusMessage()}</span>
      </div>
      
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getProgressColor()} transition-all duration-300 ease-out`}
          style={{ width: `${file.progress}%` }}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if status or progress changes
  return (
    prevProps.file.status === nextProps.file.status &&
    prevProps.file.progress === nextProps.file.progress &&
    prevProps.file.error === nextProps.file.error &&
    prevProps.file.isCanceled === nextProps.file.isCanceled &&
    prevProps.file.isRetrying === nextProps.file.isRetrying
  );
});

// Helper function to process image before upload - resize if too large
const processImageForUpload = async (file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.85): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Skip processing for small files (less than 500KB)
    if (!file.type.startsWith('image/') || file.size < 500 * 1024) {
      resolve(file);
      return;
    }

    // For extremely large files, use higher compression
    const adjustedQuality = file.size > 5 * 1024 * 1024 ? 0.7 : quality;
    
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      // Only resize if image dimensions exceed limits
      if (img.width <= maxWidth && img.height <= maxHeight && file.size < 2 * 1024 * 1024) {
        resolve(file);
        return;
      }

      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = img.width;
      let newHeight = img.height;
      
      if (newWidth > maxWidth) {
        newHeight = Math.floor(newHeight * (maxWidth / newWidth));
        newWidth = maxWidth;
      }
      
      if (newHeight > maxHeight) {
        newWidth = Math.floor(newWidth * (maxHeight / newHeight));
        newHeight = maxHeight;
      }

      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw and resize image on canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // Fall back to original if can't get context
        return;
      }
      
      // Use better quality rendering
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Choose optimal format - WebP if supported
      const newFormat = 'image/webp';
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // Fall back to original if blob creation fails
            return;
          }
          
          // Only use the processed image if it's actually smaller
          if (blob.size >= file.size) {
            console.log(`Processed image not smaller, using original: ${file.name}`);
            resolve(file);
            return;
          }
          
          // Create new file from blob
          const newFile = new File([blob], file.name.replace(/\.(jpg|jpeg|png)$/i, '.webp'), {
            type: newFormat,
            lastModified: Date.now(),
          });
          
          console.log(`Optimized: ${file.name} from ${Math.round(file.size / 1024)}KB to ${Math.round(newFile.size / 1024)}KB`);
          resolve(newFile);
        },
        newFormat,
        adjustedQuality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      console.warn(`Failed to process image: ${file.name}, using original`);
      resolve(file); // Fall back to original on error
    };

    img.src = url;
  });
};

export default function BulkUploadPage() {
  // Add console log at component mount
  useEffect(() => {
    console.log('BulkUploadPage mounted');
    // Log Firebase auth state
    console.log('Auth state on mount:', auth.currentUser ? 'User authenticated' : 'User not authenticated');
    
    // Log if Firebase is initialized
    console.log('Firebase initialized:', !!db && !!auth && !!storage);
  }, []);
  
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [defaultMetadata, setDefaultMetadata] = useState({
    title: '',
    description: '',
    category: 'abstract',
    price: 0,
    tags: [] as string[],
  });
  // Add state for dynamic categories
  const [categories, setCategories] = useState<CategoryOption[]>(defaultCategories);
  const [useSharedMetadata, setUseSharedMetadata] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingCount, setProcessingCount] = useState({ total: 0, completed: 0 });
  const [csvData, setCsvData] = useState<{ [key: string]: string }[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isCsvUploaded, setIsCsvUploaded] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [workflowStep, setWorkflowStep] = useState<'upload' | 'metadata' | 'review' | 'publishing'>('upload');
  const [uploadedImageIds, setUploadedImageIds] = useState<string[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [validationMode, setValidationMode] = useState<'strict' | 'warning'>('warning');
  const [pinterestQuery, setPinterestQuery] = useState('');
  const [isPinterestLoading, setIsPinterestLoading] = useState(false);
  const [pinterestResults, setPinterestResults] = useState<any[]>([]);
  const [selectedPinterestImages, setSelectedPinterestImages] = useState<string[]>([]);
  const [isUploadCanceled, setIsUploadCanceled] = useState(false);
  const [activeUploadTasks, setActiveUploadTasks] = useState<Map<string, any>>(new Map());
  // Add a queue for completed uploads that need to be saved to Firestore
  const [pendingFirestoreSaves, setPendingFirestoreSaves] = useState<Array<{ data: any, fileId: string }>>([]);
  // Add state for tracking unpublished uploads
  const [unpublishedUploads, setUnpublishedUploads] = useState<{ fileId: string; downloadURL: string }[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  
  // Function to fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Check if 'categories' collection exists
        const categoriesRef = collection(db, 'categories');
        const snapshot = await getDocs(categoriesRef);
        
        if (!snapshot.empty) {
          const fetchedCategories = snapshot.docs.map(doc => ({
            value: doc.id,
            label: doc.data().name || doc.id.charAt(0).toUpperCase() + doc.id.slice(1)
          }));
          
          // Merge with default categories, avoiding duplicates
          const mergedCategories = [...defaultCategories];
          
          fetchedCategories.forEach(category => {
            if (!mergedCategories.some(c => c.value === category.value)) {
              mergedCategories.push(category);
            }
          });
          
          setCategories(mergedCategories);
          console.log('Loaded categories from Firestore:', mergedCategories);
        } else {
          console.log('No categories found in Firestore, using defaults');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    if (auth.currentUser) {
      fetchCategories();
    }
  }, [auth.currentUser]);

  // Function to add a new category to Firestore
  const addCategoryToFirestore = async (categoryValue: string, categoryLabel?: string) => {
    try {
      const normalizedValue = categoryValue.toLowerCase().trim();
      const normalizedLabel = (categoryLabel || categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1)).trim();
      
      // Check if category already exists in state
      if (categories.some(c => c.value === normalizedValue)) {
        console.log(`Category ${normalizedValue} already exists`);
        return;
      }
      
      // Create a new doc in 'categories' collection with the value as the ID
      const categoryRef = doc(db, 'categories', normalizedValue);
      
      // Add data
      await setDoc(categoryRef, {
        name: normalizedLabel,
        value: normalizedValue,
        createdAt: Timestamp.now(),
        createdBy: auth.currentUser?.uid
      });
      
      // Add to local state
      setCategories(prev => [
        ...prev,
        { label: normalizedLabel, value: normalizedValue }
      ]);
      
      console.log(`Added new category: ${normalizedLabel} (${normalizedValue})`);
      
      return { label: normalizedLabel, value: normalizedValue };
    } catch (error) {
      console.error('Error adding category to Firestore:', error);
      return null;
    }
  };

  // Function to update file progress with throttling and batching
  const progressUpdatesRef = useRef<Map<string, number>>(new Map());
  const progressUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // We'll use a more efficient approach to batch updates
  const batchUpdateProgress = useCallback(() => {
    if (progressUpdatesRef.current.size === 0) return;
    
    setFiles(prev => {
      // Create a new array only if we actually have changes
      let hasChanges = false;
      const newFiles = prev.map(file => {
        const progress = progressUpdatesRef.current.get(file.id);
        if (progress !== undefined && progress !== file.progress) {
          hasChanges = true;
          return { ...file, progress };
        }
        return file;
      });
      
      // Only trigger a re-render if we actually changed something
      return hasChanges ? newFiles : prev;
    });
    
    // Clear the update map after applying
    progressUpdatesRef.current.clear();
  }, []);
  
  const updateFileProgress = useCallback((fileId: string, progress: number) => {
    // Store the latest progress value in the ref
    progressUpdatesRef.current.set(fileId, progress);
    
    // If we already have a timer, don't set another one
    if (progressUpdateTimerRef.current) return;
    
    // Set a timer to batch update all progress changes
    progressUpdateTimerRef.current = setTimeout(() => {
      batchUpdateProgress();
      progressUpdateTimerRef.current = null;
    }, 250); // Batch updates every 250ms
  }, [batchUpdateProgress]);
  
  // Clean up the timer on unmount
  useEffect(() => {
    return () => {
      if (progressUpdateTimerRef.current) {
        clearTimeout(progressUpdateTimerRef.current);
      }
    };
  }, []);

  // Handle cleanup on unmount
  useEffect(() => {
    // Check auth status on mount
    const checkIfAdmin = async () => {
      console.log('Checking admin status...');
      try {
        // Set loading state
        setIsLoading(true);
        
        // Check if user is logged in
        const user = auth.currentUser;
        console.log('Current user:', user?.email || 'No user');
        
        if (!user) {
          // Redirect to login if not signed in
          console.log('No user found, redirecting to auth...');
          router.push('/auth?redirect=/admin/wallpapers/bulk-upload');
          return;
        }
        
        // Check if user is an admin
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        console.log('User doc exists:', userDoc.exists());
        const userData = userDoc.data();
        console.log('User data:', userData);
        const hasAdminRole = userData?.isAdmin === true;
        console.log('Has admin role:', hasAdminRole);
        
        setIsAdmin(hasAdminRole);
        
        if (!hasAdminRole) {
          // Redirect if not admin
          console.log('Not an admin, redirecting...');
          router.push('/');
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast({
          title: "Authentication Error",
          description: "Failed to verify your credentials. Please try again.",
          variant: "destructive",
        });
        router.push('/auth?redirect=/admin/wallpapers/bulk-upload');
      } finally {
        setIsLoading(false);
      }
    };
    
    console.log('Running checkIfAdmin...');
    checkIfAdmin();
    
    // Cleanup function - cancel any ongoing uploads when component unmounts
    return () => {
      // Cancel all active uploads on unmount
      activeUploadTasks.forEach((uploadTask) => {
        if (uploadTask && typeof uploadTask.cancel === 'function') {
          try {
            uploadTask.cancel();
          } catch (error) {
            console.error('Error cancelling upload on unmount:', error);
          }
        }
      });
    };
  }, [router, activeUploadTasks]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Reset error state
    setFileErrors([]);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    // Validate each file
    acceptedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        newErrors.push(validation.error || `Invalid file: ${file.name}`);
      }
    });

    // Update error state
    if (newErrors.length > 0) {
      setFileErrors(newErrors);
      if (validationMode === 'strict' && validFiles.length === 0) {
        // If strict mode and no valid files, show error toast
        toast({
          title: "File validation failed",
          description: "No valid files were found. Check the error list for details.",
          variant: "destructive"
        });
        return; // Don't process any files
      } else if (newErrors.length > 0) {
        // In warning mode or if there are some valid files, show warning toast
        toast({
          title: `${newErrors.length} file(s) rejected`,
          description: "Some files didn't meet the requirements and were skipped.",
          variant: "default"
        });
      }
    }

    // Create new file objects for valid files
    const newFiles = validFiles.map(file => {
      return {
        id: uuidv4(),
        file,
        preview: URL.createObjectURL(file),
        status: 'idle' as FileStatus,
        progress: 0,
        metadata: { ...defaultMetadata, title: file.name.split('.')[0] }
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
  }, [defaultMetadata, validationMode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const handleRemoveFile = (id: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
    
    // If no files left, reset to upload step
    if (files.length === 1) {
      setActiveTab('upload');
    }
  };

  const updateFileMetadata = (id: string, metadata: Partial<UploadFile['metadata']>) => {
    setFiles(prev => prev.map(file => 
      file.id === id 
        ? { ...file, metadata: { ...file.metadata, ...metadata } } 
        : file
    ));
  };

  const addTag = () => {
    if (tagInput.trim() && !defaultMetadata.tags.includes(tagInput.trim())) {
      setDefaultMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setDefaultMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const applySharedMetadataToAll = () => {
    setFiles(prevFiles => prevFiles.map(file => ({
      ...file,
      metadata: {
        ...file.metadata,
        ...(defaultMetadata.category ? { category: defaultMetadata.category } : {}),
        ...(defaultMetadata.price !== undefined ? { price: defaultMetadata.price } : {}),
        ...(defaultMetadata.description ? { description: defaultMetadata.description } : {})
      }
    })));

    toast({
      title: "Default metadata applied",
      description: "Shared metadata has been applied to all images",
      variant: "default",
    });
  };

  const cancelAllUploads = useCallback(() => {
    // Set upload canceled flag
    setIsUploadCanceled(true);
    
    // Cancel all active upload tasks
    activeUploadTasks.forEach((uploadTask, fileId) => {
      if (uploadTask) {
        try {
          uploadTask.cancel();
        } catch (error) {
          console.error(`Error canceling upload for file ${fileId}:`, error);
        }
      }
    });
    
    // Clear the active tasks map
    setActiveUploadTasks(new Map());
    
    // Update file statuses for all uploading files
    setFiles(prev => prev.map(f => 
      f.status === 'uploading' ? { ...f, status: 'error', error: 'Upload canceled', isCanceled: true } : f
    ));
    
    // Reset upload state
    setIsUploading(false);
    
    toast({
      title: "Upload canceled",
      description: "All uploads have been canceled",
      variant: "default",
    });
  }, [activeUploadTasks]);
  
  const cancelUpload = useCallback((fileId: string) => {
    const uploadTask = activeUploadTasks.get(fileId);
    
    if (uploadTask) {
      try {
        // Cancel the Firebase upload task
        uploadTask.cancel();
        
        // Remove from active tasks
        const newTasks = new Map(activeUploadTasks);
        newTasks.delete(fileId);
        setActiveUploadTasks(newTasks);
        
        // Update file status
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'error', error: 'Upload canceled', isCanceled: true } : f
        ));
        
        toast({
          title: "Upload canceled",
          description: "File upload has been canceled",
          variant: "default",
        });
      } catch (error) {
        console.error(`Error canceling upload for file ${fileId}:`, error);
      }
    }
  }, [activeUploadTasks]);
  
  const retryUpload = useCallback(async (fileId: string) => {
    const fileToRetry = files.find(f => f.id === fileId);
    
    if (!fileToRetry) return;
    
    // Update file status to indicate retry
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'uploading', progress: 0, error: undefined, isRetrying: true, isCanceled: false } : f
    ));
    
    try {
      // Upload the file
      const downloadURL = await uploadWallpaper({...fileToRetry, status: 'uploading', progress: 0});
      
      // Update file status to success
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'success', downloadURL, progress: 100, isRetrying: false } : f
      ));
      
      toast({
        title: "Retry successful",
        description: `Successfully uploaded ${fileToRetry.file.name}`,
        variant: "default",
      });
    } catch (error) {
      console.error(`Error retrying upload for ${fileToRetry.file.name}:`, error);
      
      // Update file status to error
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'error', 
          error: (error as Error)?.message || 'Retry failed',
          isRetrying: false 
        } : f
      ));
      
      toast({
        title: "Retry failed",
        description: `Failed to upload ${fileToRetry.file.name}`,
        variant: "destructive",
      });
    }
  }, [files]);

  // Add a useEffect to process Firestore saves in the background
  useEffect(() => {
    // Only process if there are pending saves and we're not already processing
    if (pendingFirestoreSaves.length === 0) return;
    
    // Process one save at a time to avoid overwhelming Firestore
    const processSave = async () => {
      // Get the first item but don't remove it yet
      const item = pendingFirestoreSaves[0];
      
      try {
        // Add to Firestore
        await addDoc(collection(db, 'wallpapers'), item.data);
        console.log(`Successfully saved metadata for file ID: ${item.fileId}`);
      } catch (error) {
        console.error(`Error saving metadata for file ID: ${item.fileId}:`, error);
      } finally {
        // Remove this item from the queue regardless of success/failure
        setPendingFirestoreSaves(prev => prev.slice(1));
      }
    };
    
    // Start processing with a delay to avoid UI freezes
    const timer = setTimeout(processSave, 100);
    
    // Cleanup
    return () => clearTimeout(timer);
  }, [pendingFirestoreSaves, db]);

  // Update the uploadWallpaper function to use this queue
  const uploadWallpaper = async (fileData: UploadFile): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Generate a unique filename with timestamp to avoid overwrites
        const timestamp = Date.now();
        const fileExtension = fileData.file.name.split('.').pop() || 'jpeg';
        const filename = `${fileData.id}-${timestamp}-${fileData.file.name}`;
        
        // Create storage reference
        const storageRef = ref(storage, `wallpapers/${filename}`);
        
        // Create upload task
        const uploadTask = uploadBytesResumable(storageRef, fileData.file);
        
        // Store the upload task reference in the file data for potential cancellation
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, uploadTask } : f
        ));
        
        // Listen for state changes
        uploadTask.on(
          'state_changed',
          // Progress callback
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            // Update file progress
            setFiles(prev => prev.map(f => 
              f.id === fileData.id ? { ...f, progress } : f
            ));
          },
          // Error callback
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          // Success callback
          async () => {
            try {
              // Get download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Remove the upload task reference since it's complete
              setFiles(prev => prev.map(f => 
                f.id === fileData.id ? { ...f, uploadTask: undefined } : f
              ));
              
              resolve(downloadURL);
            } catch (error) {
              console.error('Error getting download URL:', error);
              reject(error);
            }
          }
        );
      } catch (error) {
        console.error('Error setting up upload:', error);
        reject(error);
      }
    });
  };

  // Add a function to clean up file resources
  const cleanupFileResources = useCallback((fileId: string) => {
    // Find the file
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    // Revoke the object URL to free up memory
    if (file.preview) {
      try {
        URL.revokeObjectURL(file.preview);
      } catch (err) {
        console.warn('Error revoking object URL:', err);
      }
    }
    
    // Remove any references to large objects
    setFiles(prev => {
      const fileIndex = prev.findIndex(f => f.id === fileId);
      if (fileIndex === -1) return prev;
      
      const newFiles = [...prev];
      // Keep the file in the list but clean up memory-intensive properties
      // This maintains the UI state but frees memory
      if (newFiles[fileIndex].status === 'success') {
        newFiles[fileIndex] = {
          ...newFiles[fileIndex],
          // Remove reference to the File object to free memory
          file: new File([], newFiles[fileIndex].file.name, { type: newFiles[fileIndex].file.type }),
          // Clear upload task reference
          uploadTask: undefined
        };
      }
      return newFiles;
    });
  }, [files]);

  // Add a hook to cleanup resources for completed files
  useEffect(() => {
    const successfulFiles = files.filter(file => 
      file.status === 'success' && file.file.size > 0 // Only clean files with actual data
    );
    
    if (successfulFiles.length > 0) {
      // Clean up resources after a short delay to ensure UI updates complete
      const timer = setTimeout(() => {
        successfulFiles.forEach(file => cleanupFileResources(file.id));
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [files, cleanupFileResources]);

  // Add this function before the handleUpload function
  const getOptimalConcurrency = () => {
    // Determine appropriate concurrency based on file sizes
    const filesToUpload = files.filter(f => f.status !== 'success');
    if (filesToUpload.length === 0) return 3; // Default concurrency
    
    const averageFileSize = filesToUpload.reduce((sum, file) => sum + file.file.size, 0) / filesToUpload.length;
    
    // If average file size > 5MB, use 2 concurrent uploads
    if (averageFileSize > 5 * 1024 * 1024) return 2;
    // If average file size > 2MB, use 3 concurrent uploads
    if (averageFileSize > 2 * 1024 * 1024) return 3;
    // Otherwise use 4 concurrent uploads
    return 4;
  };

  // Sequential upload function - one file at a time
  const handleUpload = async () => {
    // Skip if already uploading or no files to upload
    if (isUploading || files.length === 0 || files.every(f => f.status === 'success')) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setIsUploadCanceled(false); // Reset cancellation state

    // Only upload files that haven't been uploaded yet or had errors
    const filesToUpload = files.filter(f => f.status !== 'success' && !f.isCanceled);
    const totalFiles = filesToUpload.length;
    let completedFiles = 0;

    try {
      // Process one file at a time
      for (let i = 0; i < filesToUpload.length; i++) {
        // Exit loop if upload was canceled
        if (isUploadCanceled) break;
        
        const fileData = filesToUpload[i];
        
        // Mark file as uploading
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'uploading', progress: 0 } : f
        ));
        
        try {
          // Upload single file
          console.log(`Uploading file ${i+1}/${totalFiles}: ${fileData.file.name}`);
          const downloadURL = await uploadWallpaper(fileData);
          
          // Mark as success and add to unpublished uploads
          setFiles(prev => prev.map(f => 
            f.id === fileData.id ? { 
              ...f, 
              status: 'success', 
              progress: 100,
              downloadURL,
              isPendingPublication: true 
            } : f
          ));
          
          // Add to unpublished uploads list
          if (downloadURL) {
            setUnpublishedUploads(prev => [...prev, { 
              fileId: fileData.id, 
              downloadURL 
            }]);
          }
          
          // Update progress
          completedFiles++;
          const progress = Math.round((completedFiles / totalFiles) * 100);
          setUploadProgress(progress);
          
          // Add a delay between uploads to prevent UI freezing and refresh issues
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Error uploading file ${fileData.id}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          
          setFiles(prev => prev.map(f => 
            f.id === fileData.id ? { ...f, status: 'error', error: errorMessage } : f
          ));
          
          // Add a short delay before continuing to the next file
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      // Show success toast if uploads weren't canceled
      if (!isUploadCanceled && completedFiles > 0) {
        toast({
          title: 'Upload Complete',
          description: `Successfully uploaded ${completedFiles} files to storage.`,
        });
      }
    } catch (error) {
      console.error('Upload process error:', error);
      if (!isUploadCanceled) {
        toast({
          title: 'Upload Error',
          description: 'Some files failed to upload. You can retry the failed uploads.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditFile = (fileId: string) => {
    const fileToEdit = files.find(f => f.id === fileId);
    if (!fileToEdit) return;
    
    // Open a dialog or set up state for editing the file
    setFiles(prev => prev.map(f => ({ ...f, isEditing: f.id === fileId })));
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);
    setCsvErrors([]);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          // Extract File objects from the UploadFile array for validation
          const fileObjects = files.map(f => f.file);
          
          // Validate CSV rows
          const errors: string[] = [];
          const newCategories: string[] = [];
          
          const rowValidations = (results.data as { [key: string]: string }[])
            .map((row, index) => validateCsvRow(row, index, fileObjects, categories));
          
          // Collect all validation errors and new categories
          rowValidations.forEach(validation => {
            if (!validation.valid) {
              errors.push(...validation.errors);
            }
            
            // Collect new categories
            if (validation.newCategory && !newCategories.includes(validation.newCategory)) {
              newCategories.push(validation.newCategory);
            }
          });
          
          // Add new categories if found
          if (newCategories.length > 0) {
            toast({
              title: `Found ${newCategories.length} new categories`,
              description: `Adding: ${newCategories.join(', ')}`,
              variant: "default",
            });
            
            // Add each new category to Firestore
            Promise.all(
              newCategories.map(category => addCategoryToFirestore(category))
            ).catch(error => console.error('Error adding categories:', error));
          }
          
          // Check for required columns
          const headerRow = results.meta.fields || [];
          const requiredColumns = ['title'];
          const missingColumns = requiredColumns.filter(col => !headerRow.includes(col));
          
          if (missingColumns.length > 0) {
            errors.unshift(`Missing required columns: ${missingColumns.join(', ')}`);
          }
          
          // Update state with data and errors
          setCsvData(results.data as { [key: string]: string }[]);
          setCsvErrors(errors);
          setIsCsvUploaded(true);
          
          if (errors.length > 0) {
            if (validationMode === 'strict') {
              toast({
                title: "CSV validation failed",
                description: `${errors.length} error(s) found. Please fix the issues and try again.`,
                variant: "destructive"
              });
            } else {
              toast({
                title: "CSV imported with warnings",
                description: `Imported with ${errors.length} issues that may affect the results.`,
                variant: "default"
              });
            }
          } else {
            toast({
              title: "CSV imported successfully",
              description: `Successfully imported ${results.data.length} rows of data`,
            });
          }
        } else {
          toast({
            title: "Empty CSV file",
            description: "The uploaded CSV file contains no data",
            variant: "destructive"
          });
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        setCsvErrors([`CSV parsing error: ${error.message}`]);
        toast({
          title: "CSV parsing error",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  const downloadCsvTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'wallpaper_template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetCsv = () => {
    setCsvData([]);
    setCsvFile(null);
    setIsCsvUploaded(false);
    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = '';
    }
  };

  const matchCsvToImages = () => {
    if (!csvData.length || !csvFile) {
      toast({
        title: "No CSV data found",
        description: "Please upload a valid CSV file first",
        variant: "default",
      });
      return;
    }

    // Create a lookup map of CSV data by filename
    const csvByFilename = new Map<string, typeof csvData[0]>();
    csvData.forEach(row => {
      if (row.filename) {
        csvByFilename.set(row.filename.trim(), row);
      }
    });

    let matchedCount = 0;
    let partialMatchCount = 0;
    let unmatchedCount = 0;
    let skippedCount = 0;
    const skippedFiles: string[] = [];

    // Check for CSV entries that don't have matching files
    csvByFilename.forEach((data, filename) => {
      const fileExists = files.some(file => 
        file.file.name === filename || 
        file.file.name.includes(filename) || 
        filename.includes(file.file.name)
      );

      if (!fileExists) {
        skippedCount++;
        skippedFiles.push(filename);
      }
    });

    // Update files with matched CSV data
    const updatedFiles = files.map(file => {
      // Try exact filename match first
      let csvMatch = csvByFilename.get(file.file.name);
      let matchType = 'exact';

      // If no exact match, try partial match (file name is a substring of CSV filename)
      if (!csvMatch) {
        // Convert map entries to array for safer iteration
        const entry = Array.from(csvByFilename.entries()).find(([csvFilename]) => 
          file.file.name.includes(csvFilename) || csvFilename.includes(file.file.name)
        );
        
        if (entry) {
          csvMatch = entry[1];
          matchType = 'partial';
          partialMatchCount++;
        } else {
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
          matchType // Store match type for UI indicators
        };
      }

      return file;
    });

    setFiles(updatedFiles);
    setIsCsvUploaded(true);
    
    let toastVariant: "default" | "destructive" = "default";
    let description = `Matched: ${matchedCount}, Partial matches: ${partialMatchCount}, Unmatched: ${unmatchedCount}`;
    
    if (skippedCount > 0) {
      description += `, Skipped ${skippedCount} CSV entries with missing files`;
      toastVariant = "destructive";
      
      // Log skipped files for debugging
      console.warn("Skipped files not found in upload:", skippedFiles);
    }
    
    toast({
      title: "CSV data applied",
      description,
      variant: toastVariant,
    });
    
    // Auto-advance to review tab if all images have metadata
    if (matchedCount + partialMatchCount === files.length) {
      setActiveTab('review');
    }
  };

  const fetchFromPinterest = async () => {
    if (!pinterestQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a search term to find wallpapers",
        variant: "destructive",
      });
      return;
    }

    setIsPinterestLoading(true);
    setPinterestResults([]);

    try {
      // Get current user token
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/pinterest?query=${encodeURIComponent(pinterestQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch from Pinterest');
      }
      
      const data = await response.json();
      setPinterestResults(data.wallpapers || []);
    } catch (error) {
      console.error('Pinterest fetch error:', error);
      toast({
        title: "Failed to fetch from Pinterest",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setIsPinterestLoading(false);
    }
  };

  const togglePinterestImageSelection = (imageId: string) => {
    setSelectedPinterestImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const addSelectedPinterestImages = async () => {
    if (selectedPinterestImages.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image from the results",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const selectedImages = pinterestResults.filter(img => 
        selectedPinterestImages.includes(img.id)
      );

      // Download each image and add to files state
      for (const image of selectedImages) {
        try {
          const response = await fetch(image.imageUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status}`);
          }
          
          const blob = await response.blob();
          const file = new File(
            [blob], 
            `pinterest-${image.id}.${blob.type.split('/')[1] || 'jpg'}`, 
            { type: blob.type }
          );
          
          // Create object URL for preview
          const preview = URL.createObjectURL(blob);
          
          // Add to files state
          const newFileId = uuidv4();
          setFiles(prev => [
            ...prev,
            {
              id: newFileId,
              file,
              preview,
              status: 'idle',
              progress: 0,
              metadata: {
                title: image.title || `Pinterest Wallpaper ${newFileId.substring(0, 8)}`,
                description: image.description || '',
                category: 'abstract', // Default category
                price: 0,
                tags: image.tags || [],
              }
            }
          ]);
        } catch (error) {
          console.error(`Error processing Pinterest image ${image.id}:`, error);
          toast({
            title: "Failed to process image",
            description: `Could not download image: ${image.id}`,
            variant: "destructive",
          });
        }
      }

      // Clear selection after adding
      setSelectedPinterestImages([]);
      
      // Switch to upload tab
      setActiveTab('upload');
      
      toast({
        title: "Images added",
        description: `Added ${selectedImages.length} images to upload queue`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error adding Pinterest images:', error);
      toast({
        title: "Failed to add images",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modify publishUploadsToFirestore function to clear unpublished uploads list after publishing
  const publishUploadsToFirestore = async () => {
    if (isPublishing || unpublishedUploads.length === 0) return;
    
    setIsPublishing(true);
    setPublishProgress(0);
    
    try {
      const totalFiles = unpublishedUploads.length;
      let completedFiles = 0;
      
      // Firestore has a limit of 500 operations per batch
      const BATCH_SIZE = 100; // Using a smaller batch size for stability
      
      // Process uploads in chunks
      for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = unpublishedUploads.slice(i, i + BATCH_SIZE);
        const chunkFileIds: string[] = [];
        
        // Add each document to the batch
        for (const { fileId, downloadURL } of chunk) {
          // Find the file to get its metadata
          const fileData = files.find(f => f.id === fileId);
          if (!fileData) continue;
          
          // Get the document reference with a new ID
          const docRef = doc(collection(db, 'wallpapers'));
          chunkFileIds.push(fileId);
          
          // Create wallpaper metadata
          const wallpaperData = {
            id: docRef.id,
            title: fileData.metadata.title,
            description: fileData.metadata.description,
            category: fileData.metadata.category,
            tags: fileData.metadata.tags,
            price: fileData.metadata.price,
            imageUrl: downloadURL,
            dimensions: fileData.metadata.dimensions || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          
          // Add to batch instead of immediate setDoc
          batch.set(docRef, wallpaperData);
        }
        
        // Commit the batch
        await batch.commit();
        
        // Mark the files in this chunk as published in UI
        setFiles(prev => prev.map(f => 
          chunkFileIds.includes(f.id) ? { ...f, isPendingPublication: false } : f
        ));
        
        // Update unpublished uploads by removing the published ones
        setUnpublishedUploads(prev => 
          prev.filter(item => !chunkFileIds.includes(item.fileId))
        );
        
        // Update progress
        completedFiles += chunk.length;
        const newProgress = Math.round((completedFiles / totalFiles) * 100);
        setPublishProgress(newProgress);
        
        // Small delay to avoid UI freezing
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Show success message
      toast({
        title: 'Success',
        description: `${completedFiles} wallpapers have been published to the database.`,
      });
      
    } catch (error) {
      console.error('Error during publication:', error);
      toast({
        title: 'Publication Error',
        description: 'An error occurred during publication. Some wallpapers may not have been published.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Unauthorized Access</h1>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Bulk Upload Wallpapers</h1>
        <p className="text-muted-foreground mt-2">Upload multiple wallpapers at once with metadata</p>
      </div>

      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="publish" className={unpublishedUploads.length > 0 ? "bg-yellow-100 text-yellow-800" : ""}>
            Publish {unpublishedUploads.length > 0 && `(${unpublishedUploads.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Image Files</CardTitle>
              <CardDescription>
                First, select and upload your wallpaper images. You'll add metadata in the next step.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  {isDragActive ? (
                    <p>Drop the files here ...</p>
                  ) : (
                    <>
                    <p>Drag & drop wallpaper files here, or click to select files</p>
                      <Button className="mt-2 bg-blue-600 hover:bg-blue-700">
                        Select Files
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-6">
              <p className="text-sm text-muted-foreground">
                {files.length} file(s) selected
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
              {files.length > 0 && (
                  <>
                    <Button 
                      variant="secondary" 
                      onClick={() => setActiveTab('metadata')}
                      className="flex-1 sm:flex-auto"
                    >
                      Add Metadata
                </Button>
                    <Button 
                      onClick={handleUpload}
                      disabled={isUploading || files.length === 0 || files.every(f => f.status === 'success')}
                      className="flex-1 sm:flex-auto bg-green-600 hover:bg-green-700"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Uploading 1 at a time...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload One by One
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardFooter>
          </Card>
          
          {/* Post-Upload Actions Card */}
          {unpublishedUploads.length > 0 && (
            <Card className="mt-6 border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                  Wallpapers Need Publishing
                </CardTitle>
                <CardDescription>
                  {unpublishedUploads.length} {unpublishedUploads.length === 1 ? 'wallpaper has' : 'wallpapers have'} been uploaded to storage but not yet saved to the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isPublishing ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Publishing wallpapers to database...
                      </span>
                      <span className="font-semibold">{publishProgress}%</span>
                    </div>
                    <Progress value={publishProgress} className="h-2" />
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Your wallpapers have been uploaded to storage but not yet published to the database. Publishing saves the wallpaper metadata and makes them visible on the site.
                    </p>
                    <div className="flex justify-end">
                    <Button
                        onClick={publishUploadsToFirestore} 
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        Publish {unpublishedUploads.length} Wallpapers to Database
                    </Button>
                  </div>
                  </div>
                )}
                  </CardContent>
                </Card>
          )}
          
          {files.length > 0 && (
            <div className="mt-6">
              {files.length > 12 ? (
                <VirtualizedFileGrid files={files} onRemove={handleRemoveFile} />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {files.map((file) => (
                    <FileCard key={file.id} file={file} onRemove={handleRemoveFile} />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle>Add Metadata</CardTitle>
              <CardDescription>
                Choose how to add metadata to your images: CSV import or manual entry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="csv" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="csv">CSV Import</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>
                
                <TabsContent value="csv" className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium">Import from CSV file</h3>
                        <p className="text-xs text-muted-foreground">Upload a CSV file with metadata matching your image filenames</p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={downloadCsvTemplate}>
                              <FileText className="h-4 w-4 mr-2" />
                              Download Template
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download a CSV template to see the required format</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        ref={csvFileInputRef}
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="flex-1"
                      />
                      {isCsvUploaded && (
                        <Button variant="outline" onClick={handleResetCsv}>
                          Reset
                        </Button>
                      )}
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-3 text-xs flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p>
                        CSV must include a <strong>filename</strong> column that matches your image filenames.
                        Other columns should include: title, description, category, price, tags (comma-separated).
                      </p>
                    </div>
                    
                    {isCsvUploaded && csvData.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted">
                                {Object.keys(csvData[0]).map((header) => (
                                  <th key={header} className="px-4 py-2 text-left font-medium">{header}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {csvData.slice(0, 5).map((row, i) => (
                                <tr key={i} className="border-t">
                                  {Object.values(row).map((value, j) => (
                                    <td key={j} className="px-4 py-2 truncate max-w-[200px]">{value}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {csvData.length > 5 && (
                          <div className="px-4 py-2 text-xs text-muted-foreground border-t">
                            Showing 5 of {csvData.length} rows
                          </div>
                        )}
                      </div>
                    )}
                    
                    {csvErrors.length > 0 && (
                      <Card className="border-destructive/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center text-destructive">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            CSV Validation Issues
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            {csvErrors.map((error, index) => (
                              <li key={index} className="text-muted-foreground">{error}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    
                    {isCsvUploaded && (
                      <Button onClick={matchCsvToImages}>
                        Apply CSV Data to Images
                      </Button>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">Shared Metadata</h3>
                      <p className="text-xs text-muted-foreground">Set default values to apply to all images</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="default-category">Category</Label>
                        <Select 
                          value={defaultMetadata.category} 
                          onValueChange={(value) => setDefaultMetadata(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger id="default-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="default-price">Price</Label>
                        <Input
                          id="default-price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={defaultMetadata.price}
                          onChange={(e) => setDefaultMetadata(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      
                      <div className="md:col-span-2 lg:col-span-1">
                        <Label htmlFor="default-description">Description</Label>
                        <Textarea
                          id="default-description"
                          placeholder="Enter a default description"
                          value={defaultMetadata.description}
                          onChange={(e) => setDefaultMetadata(prev => ({ ...prev, description: e.target.value }))}
                          className="resize-none h-10"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={applySharedMetadataToAll}>
                      Apply to All Images
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('upload')}
              >
                Back to Images
              </Button>
              <Button 
                onClick={() => setActiveTab('review')}
              >
                Next: Review & Publish
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="pinterest">
          <Card>
            <CardHeader>
              <CardTitle>Import from Pinterest</CardTitle>
              <CardDescription>
                Search and import wallpapers directly from Pinterest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search Pinterest for wallpapers..."
                    value={pinterestQuery}
                    onChange={(e) => setPinterestQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchFromPinterest()}
                  />
                </div>
                <Button 
                  onClick={fetchFromPinterest} 
                  disabled={isPinterestLoading || !pinterestQuery.trim()}
                >
                  {isPinterestLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search
                </Button>
              </div>

              {isPinterestLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : pinterestResults.length > 0 ? (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {pinterestResults.map((image) => (
                      <div 
                        key={image.id} 
                        className={`relative rounded-md overflow-hidden border aspect-[3/4] group cursor-pointer ${
                          selectedPinterestImages.includes(image.id) ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => togglePinterestImageSelection(image.id)}
                      >
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image.imageUrl})` }} />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-white text-center p-2">
                            <p className="text-sm font-medium line-clamp-2">{image.title}</p>
                            {image.tags && image.tags.length > 0 && (
                              <p className="text-xs text-gray-300 mt-1">
                                {image.tags.slice(0, 3).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedPinterestImages.includes(image.id) && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-between">
                    <p className="text-sm text-muted-foreground">
                      {selectedPinterestImages.length} of {pinterestResults.length} images selected
                    </p>
                    <Button
                      onClick={addSelectedPinterestImages}
                      disabled={selectedPinterestImages.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Add Selected to Upload Queue
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {pinterestQuery ? (
                    <p>No results found. Try a different search term.</p>
                  ) : (
                    <p>Enter a search term to find wallpapers on Pinterest.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Review Before Upload</CardTitle>
              <CardDescription>
                Review your wallpapers and make any final adjustments before uploading.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-base font-semibold">Upload Summary</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="p-3 shadow-sm">
                      <CardTitle className="text-base">Total Images</CardTitle>
                      <p className="text-2xl font-bold">{files.length}</p>
                    </Card>
                    <Card className="p-3 shadow-sm">
                      <CardTitle className="text-base">Processing</CardTitle>
                      <p className="text-2xl font-bold flex items-center">
                        {processingCount.completed}/{processingCount.total}
                        {isUploading && <Loader2 className="h-4 w-4 ml-2 animate-spin text-muted-foreground" />}
                      </p>
          </Card>
                    <Card className="p-3 shadow-sm">
                      <CardTitle className="text-base">Upload Progress</CardTitle>
                      <Progress value={uploadProgress} className="h-2 mt-2" />
                </Card>
            </div>
                  
                  {/* Add publication status card */}
                  {unpublishedUploads.length > 0 && (
                    <Card className="p-3 shadow-sm border-yellow-200 bg-yellow-50">
                      <CardTitle className="text-base flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
                        Pending Publication
                </CardTitle>
                      <p className="text-sm mt-2">
                        {unpublishedUploads.length} wallpapers are uploaded but not yet published to the database.
                      </p>
                      <Button 
                        onClick={publishUploadsToFirestore} 
                        className="mt-3 w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700"
                        disabled={isPublishing}
                      >
                        {isPublishing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          'Publish to Database'
                        )}
                            </Button>
                      {isPublishing && (
                        <Progress value={publishProgress} className="h-2 mt-2" />
                      )}
                      </Card>
                    )}
                  </div>

                {files.length > 0 && (
                  <div className="space-y-4">
                    <Separator />
                    <h3 className="text-base font-semibold">Upload Controls</h3>

                    <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                        onClick={() => setActiveTab('metadata')}
              >
                        Back to Metadata
              </Button>
                      
              <Button 
                        onClick={handleUpload}
                        disabled={isUploading || files.length === 0 || files.every(f => f.status === 'success')}
                        className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Uploading 1 at a time...
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 mr-2" />
                            Upload {files.length} Files One by One
                          </>
                        )}
              </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="publish">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Publish Wallpapers to Database
              </CardTitle>
                  <CardDescription>
                Publish your uploaded wallpapers to make them visible on the site
                  </CardDescription>
            </CardHeader>
            <CardContent>
              {unpublishedUploads.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <span className="block mb-2 text-4xl">📂</span>
                  <h3 className="text-lg font-medium mb-1">No Pending Publications</h3>
                  <p className="text-sm">Upload some wallpapers first, then come back to publish them</p>
                                  <Button 
                                    variant="outline" 
                    onClick={() => setActiveTab('upload')}
                    className="mt-4"
                                  >
                    Go to Upload
                                  </Button>
                              </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg font-medium text-yellow-800 mb-1 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                        {unpublishedUploads.length} Wallpapers Ready to Publish
                      </h3>
                      <p className="text-sm text-yellow-700">
                        These wallpapers are uploaded to storage but not yet published to the database
                              </p>
                            </div>
                            <Button
                      onClick={publishUploadsToFirestore}
                      disabled={isPublishing || unpublishedUploads.length === 0}
                      className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                      size="lg"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 mr-2" />
                          Publish All to Database
                        </>
                      )}
                            </Button>
                          </div>
                          
                  {isPublishing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Publishing in progress...
                        </span>
                        <span className="font-medium">{publishProgress}%</span>
                            </div>
                      <Progress value={publishProgress} className="h-2" />
                            </div>
                  )}
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {unpublishedUploads.map((item) => {
                        // Find the corresponding file for more details
                        const file = files.find(f => f.id === item.fileId);
                        if (!file) return null;
                        
                        return (
                          <Card key={item.fileId} className="overflow-hidden">
                            <div className="aspect-video relative bg-muted">
                              <img 
                                src={file.preview} 
                                alt={file.metadata.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                        </div>
                            <CardContent className="p-3">
                              <h4 className="text-sm font-medium truncate">{file.metadata.title}</h4>
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {file.metadata.category} • {file.metadata.price > 0 ? `$${file.metadata.price}` : 'Free'}
                              </p>
                              <div className="text-xs bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5 flex items-center mt-2 w-fit">
                                <span className="mr-1">⚠️</span> Pending publication
                      </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-800 mb-1">Need more publishing control?</h3>
                        <p className="text-sm text-blue-700 mb-3">
                          Use our dedicated Publish page to manage all your uploads, see publication status, and publish multiple files at once.
                        </p>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => router.push('/admin/wallpapers/publish')}
                          className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          Go to Publish Manager
                        </Button>
                      </div>
                    </div>
                  </div>
              </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={() => setActiveTab('review')}>
                Back to Review
              </Button>
              
              {unpublishedUploads.length > 0 && !isPublishing && (
              <Button
                  onClick={publishUploadsToFirestore}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                    <Upload className="h-4 w-4 mr-2" />
                  Publish All
              </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
              </div>
  );
};

// End of BulkUploadPage component 

// File card component to reduce repetition - optimize with memo
const FileCard = React.memo(({ file, onRemove }: { file: UploadFile; onRemove: (id: string) => void }) => {
  // Use a state for the file card hover state to avoid re-renders
  const [isHovered, setIsHovered] = useState(false);
  
  // Create a memoized handler for the remove action
  const handleRemove = useCallback(() => {
    onRemove(file.id);
  }, [file.id, onRemove]);
  
  // Only show remove button when hovered or on mobile
  const showRemoveButton = isHovered;
  
  return (
    <Card 
      className="overflow-hidden" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-square relative bg-muted">
        <img 
          src={file.preview} 
          alt={file.file.name}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {showRemoveButton && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={handleRemove}
                        >
                          <X className="h-4 w-4" />
                        </Button>
        )}
                      </div>
      <CardContent className="p-3">
        <p className="text-sm truncate">{file.file.name}</p>
        <p className="text-xs text-muted-foreground mt-1">{Math.round(file.file.size / 1024)} KB</p>
        <div className="mt-2">
          <FileProgressIndicator file={file} />
                        </div>
        <div className="mt-2">
          <FileStatusBadge file={file} />
                          </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these props have changed
  return (
    prevProps.file.id === nextProps.file.id &&
    prevProps.file.preview === nextProps.file.preview &&
    prevProps.file.status === nextProps.file.status &&
    prevProps.file.progress === nextProps.file.progress &&
    prevProps.file.error === nextProps.file.error &&
    prevProps.file.isPendingPublication === nextProps.file.isPendingPublication
  );
});

// Add a new component to show unpublished status
const FileStatusBadge = ({ file }: { file: UploadFile }) => {
  if (file.status === 'success' && file.isPendingPublication) {
    return (
      <div className="text-xs bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5 flex items-center">
        <span className="mr-1">⚠️</span> Pending publication
                        </div>
    );
  }
  
  if (file.status === 'success' && !file.isPendingPublication) {
    return (
      <div className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5 flex items-center">
        <span className="mr-1">✓</span> Published
                      </div>
    );
  }
  
  return null;
};

// Virtualized grid for efficient rendering of many files
const VirtualizedFileGrid = React.memo(({ 
  files, 
  onRemove 
}: { 
  files: UploadFile[];
  onRemove: (id: string) => void;
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  // Calculate grid dimensions
  const getColumnCount = () => {
    if (containerWidth < 640) return 1; // sm
    if (containerWidth < 768) return 2; // md
    if (containerWidth < 1024) return 3; // lg
    return 4; // xl
  };
  
  const columnCount = getColumnCount();
  const rowCount = Math.ceil(files.length / columnCount);
  
  // Calculate item size
  const getItemWidth = () => {
    const gap = 16; // equivalent to gap-4 in Tailwind
    return (containerWidth - (gap * (columnCount - 1))) / columnCount;
  };
  
  const itemWidth = getItemWidth();
  const itemHeight = itemWidth + 100; // Add some height for content below image
  
  const Cell = ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const fileIndex = rowIndex * columnCount + columnIndex;
    if (fileIndex >= files.length) return null;
    
    const file = files[fileIndex];
    
    return (
      <div style={{ ...style, padding: '8px' }}>
        <FileCard file={file} onRemove={onRemove} />
                      </div>
    );
  };
  
  return (
    <div ref={containerRef} className="w-full" style={{ height: `${Math.min(rowCount * itemHeight, 800)}px` }}>
      {containerWidth > 0 && (
        <FixedSizeGrid
          columnCount={columnCount}
          columnWidth={itemWidth}
          height={Math.min(rowCount * itemHeight, 800)}
          rowCount={rowCount}
          rowHeight={itemHeight}
          width={containerWidth}
          overscanRowCount={1}
          overscanColumnCount={1}
        >
          {Cell}
        </FixedSizeGrid>
      )}
    </div>
  );
});