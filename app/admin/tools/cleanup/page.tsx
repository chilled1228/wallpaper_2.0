"use client";

/**
 * Admin Cleanup Utility Page
 * 
 * This page provides a web UI for cleaning up Firebase Storage and Firestore data
 * during development and testing.
 */

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function CleanupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    storageFiles: number;
    firestoreDocs: number;
    deletedStorage: number;
    deletedFirestore: number;
    errors: string[];
  }>({
    storageFiles: 0,
    firestoreDocs: 0,
    deletedStorage: 0,
    deletedFirestore: 0,
    errors: [],
  });
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Check what needs to be deleted
  const checkData = async () => {
    setIsLoading(true);
    setProgress(0);
    const errors: string[] = [];
    
    try {
      // Check Storage
      const wallpapersRef = ref(storage, 'wallpapers');
      const storageResult = await listAll(wallpapersRef);
      setProgress(50);
      
      // Check Firestore
      const wallpapersCollection = collection(db, 'wallpapers');
      const snapshot = await getDocs(wallpapersCollection);
      setProgress(100);
      
      setResults({
        ...results,
        storageFiles: storageResult.items.length,
        firestoreDocs: snapshot.docs.length,
        errors: [],
      });
      
      setShowConfirm(storageResult.items.length > 0 || snapshot.docs.length > 0);
      
    } catch (error) {
      console.error('Error checking data:', error);
      errors.push(`Error checking data: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
      setResults(prev => ({ ...prev, errors }));
    }
  };
  
  // Perform the actual cleanup
  const performCleanup = async () => {
    setIsLoading(true);
    setProgress(0);
    const errors: string[] = [];
    let deletedStorage = 0;
    let deletedFirestore = 0;
    
    try {
      // Delete Storage Files
      const wallpapersRef = ref(storage, 'wallpapers');
      const storageResult = await listAll(wallpapersRef);
      const totalItems = storageResult.items.length + 1; // Add 1 to avoid division by zero
      let processedItems = 0;
      
      for (const item of storageResult.items) {
        try {
          await deleteObject(item);
          deletedStorage++;
        } catch (error) {
          console.error(`Error deleting storage file ${item.name}:`, error);
          errors.push(`Failed to delete file ${item.name}`);
        }
        
        processedItems++;
        setProgress(Math.round((processedItems / totalItems) * 50));
      }
      
      // Delete Firestore Documents
      const wallpapersCollection = collection(db, 'wallpapers');
      const snapshot = await getDocs(wallpapersCollection);
      const totalDocs = snapshot.docs.length + 1; // Add 1 to avoid division by zero
      let processedDocs = 0;
      
      for (const docSnapshot of snapshot.docs) {
        try {
          await deleteDoc(doc(db, 'wallpapers', docSnapshot.id));
          deletedFirestore++;
        } catch (error) {
          console.error(`Error deleting document ${docSnapshot.id}:`, error);
          errors.push(`Failed to delete document ${docSnapshot.id}`);
        }
        
        processedDocs++;
        setProgress(50 + Math.round((processedDocs / totalDocs) * 50));
      }
      
    } catch (error) {
      console.error('Error during cleanup:', error);
      errors.push(`Error during cleanup: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
      setProgress(100);
      setResults(prev => ({
        ...prev,
        deletedStorage,
        deletedFirestore,
        errors: [...prev.errors, ...errors],
      }));
      setShowConfirm(false);
      
      // Refresh data after cleanup
      setTimeout(() => {
        checkData();
      }, 1000);
    }
  };
  
  useEffect(() => {
    // Check data when component mounts
    checkData();
  }, []);
  
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Wallpaper Cleanup Utility</h1>
        <Button 
          variant="outline" 
          onClick={checkData} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>
      
      {isLoading && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress < 50 ? 'Checking storage files...' : 'Checking database documents...'}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Firebase Storage
            </CardTitle>
            <CardDescription>
              Wallpaper image files stored in Cloud Storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="text-5xl font-bold mb-2">{results.storageFiles}</div>
              <div className="text-muted-foreground">files found</div>
              
              {results.deletedStorage > 0 && (
                <div className="mt-4 text-sm text-green-600">
                  {results.deletedStorage} files successfully deleted
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Firestore Database
            </CardTitle>
            <CardDescription>
              Wallpaper documents stored in Firestore
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="text-5xl font-bold mb-2">{results.firestoreDocs}</div>
              <div className="text-muted-foreground">documents found</div>
              
              {results.deletedFirestore > 0 && (
                <div className="mt-4 text-sm text-green-600">
                  {results.deletedFirestore} documents successfully deleted
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {results.errors.length > 0 && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-red-700">
              {results.errors.map((error, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Cleanup Actions</CardTitle>
          <CardDescription>
            Delete all wallpaper data from both Firebase Storage and Firestore Database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showConfirm ? (
            <Button
              variant="destructive"
              size="lg"
              onClick={() => setShowConfirm(true)}
              disabled={isLoading || (results.storageFiles === 0 && results.firestoreDocs === 0)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Delete All Wallpaper Data
            </Button>
          ) : (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <div className="text-red-700 flex items-start gap-2 mb-4">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Warning: This action cannot be undone</p>
                  <p className="text-sm">
                    You are about to delete {results.storageFiles} storage files and {results.firestoreDocs} database documents.
                    This will remove all wallpaper data from your application.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={performCleanup}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Confirm Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="mb-8 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Server-Side Cleanup</CardTitle>
          <CardDescription>
            Use the server-side admin API to clean up data (recommended)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-blue-700">
              If you're experiencing permission issues with client-side cleanup, use this server-side method which has full admin access.
            </p>
            
            <Button 
              variant="default"
              size="lg"
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const response = await fetch('/api/cleanup');
                  const data = await response.json();
                  
                  if (data.success) {
                    setResults(prev => ({
                      ...prev,
                      deletedStorage: data.filesDeleted,
                      deletedFirestore: data.documentsDeleted,
                      errors: [],
                    }));
                    
                    // Refresh data after cleanup
                    setTimeout(() => {
                      checkData();
                    }, 1000);
                  } else {
                    setResults(prev => ({
                      ...prev,
                      errors: [...prev.errors, `Server error: ${data.error}`],
                    }));
                  }
                } catch (error) {
                  setResults(prev => ({
                    ...prev,
                    errors: [...prev.errors, `Error calling cleanup API: ${error instanceof Error ? error.message : String(error)}`],
                  }));
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Cleaning up...
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5 mr-2" />
                  Clean Up Using Server API
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-700 space-y-3">
            <p>
              This utility helps you clean up wallpaper data during development and testing.
              Use it to reset your database and storage when needed.
            </p>
            
            <div className="bg-white rounded p-3 border border-blue-100">
              <p className="font-medium text-sm mb-2">Important Notes:</p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>You must be logged in as an admin to use this utility</li>
                <li>This will delete <strong>ALL</strong> wallpaper data - this cannot be undone</li>
                <li>After cleanup, you'll need to upload and publish wallpapers again</li>
                <li>This operation may take some time for large datasets</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 