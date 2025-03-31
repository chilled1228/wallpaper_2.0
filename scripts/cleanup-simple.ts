/**
 * SIMPLE CLEANUP SCRIPT
 * 
 * This script is designed to run in a browser environment through Next.js
 * It requires the user to be logged in as an admin
 */

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';

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
  
  // Check what needs to be deleted
  const checkData = async () => {
    setIsLoading(true);
    const errors: string[] = [];
    
    try {
      // Check Storage
      const wallpapersRef = ref(storage, 'wallpapers');
      const storageResult = await listAll(wallpapersRef);
      
      // Check Firestore
      const wallpapersCollection = collection(db, 'wallpapers');
      const snapshot = await getDocs(wallpapersCollection);
      
      setResults({
        ...results,
        storageFiles: storageResult.items.length,
        firestoreDocs: snapshot.docs.length,
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
    const errors: string[] = [];
    let deletedStorage = 0;
    let deletedFirestore = 0;
    
    try {
      // Delete Storage Files
      const wallpapersRef = ref(storage, 'wallpapers');
      const storageResult = await listAll(wallpapersRef);
      
      for (const item of storageResult.items) {
        try {
          await deleteObject(item);
          deletedStorage++;
        } catch (error) {
          console.error(`Error deleting storage file ${item.name}:`, error);
          errors.push(`Failed to delete file ${item.name}`);
        }
      }
      
      // Delete Firestore Documents
      const wallpapersCollection = collection(db, 'wallpapers');
      const snapshot = await getDocs(wallpapersCollection);
      
      for (const docSnapshot of snapshot.docs) {
        try {
          await deleteDoc(doc(db, 'wallpapers', docSnapshot.id));
          deletedFirestore++;
        } catch (error) {
          console.error(`Error deleting document ${docSnapshot.id}:`, error);
          errors.push(`Failed to delete document ${docSnapshot.id}`);
        }
      }
      
    } catch (error) {
      console.error('Error during cleanup:', error);
      errors.push(`Error during cleanup: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
      setResults(prev => ({
        ...prev,
        deletedStorage,
        deletedFirestore,
        errors: [...prev.errors, ...errors],
      }));
      setShowConfirm(false);
    }
  };
  
  useEffect(() => {
    // Check data when component mounts
    checkData();
  }, []);
  
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Wallpaper Cleanup Utility</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Firebase Storage</h3>
            <p className="text-2xl font-bold">{results.storageFiles} files</p>
            {results.deletedStorage > 0 && (
              <p className="text-green-600 text-sm mt-1">{results.deletedStorage} files deleted</p>
            )}
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Firestore Database</h3>
            <p className="text-2xl font-bold">{results.firestoreDocs} documents</p>
            {results.deletedFirestore > 0 && (
              <p className="text-green-600 text-sm mt-1">{results.deletedFirestore} documents deleted</p>
            )}
          </div>
        </div>
        
        {results.errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-800 mb-2">Errors</h3>
            <ul className="text-sm text-red-700 list-disc pl-5">
              {results.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <button
            onClick={checkData}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 transition"
          >
            Refresh Data
          </button>
          
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isLoading || (results.storageFiles === 0 && results.firestoreDocs === 0)}
              className={`px-4 py-2 rounded-md text-white transition ${
                isLoading || (results.storageFiles === 0 && results.firestoreDocs === 0)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Delete All Data
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={performCleanup}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition"
              >
                Confirm Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <h2 className="text-xl font-semibold text-yellow-800 mb-3">Instructions</h2>
        <p className="mb-3">
          This utility allows you to clean up all wallpaper data from both Firebase Storage and Firestore Database.
          Use this during testing to reset your data.
        </p>
        <p className="font-medium">Important Notes:</p>
        <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
          <li>You must be logged in as an admin to use this utility</li>
          <li>This will delete <strong>ALL</strong> wallpaper data - this cannot be undone</li>
          <li>After cleanup, you'll need to upload and publish wallpapers again</li>
        </ul>
      </div>
    </div>
  );
} 