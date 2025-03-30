'use client'

import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

export default function MigratePromptsToWallpapersPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    success: 0,
    skipped: 0,
    failed: 0
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = auth.currentUser
        
        if (!user) {
          router.push('/auth?redirect=/admin/migrate/migrate-prompts-to-wallpapers')
          return
        }

        // Force token refresh to ensure we have the latest claims
        await user.getIdToken(true)
        
        const userDocRef = doc(db, 'users', user.uid)
        const userDocSnap = await getDocs(collection(db, 'users'))
        
        // Check if user is admin
        let isUserAdmin = false
        userDocSnap.forEach(doc => {
          if (doc.id === user.uid && doc.data()?.isAdmin) {
            isUserAdmin = true
          }
        })
        
        if (!isUserAdmin) {
          router.push('/')
          return
        }

        setIsAdmin(true)
        setIsLoading(false)
      } catch (error: any) {
        console.error('Error checking admin status:', error)
        router.push('/')
      }
    }

    checkAdminStatus()
  }, [router])

  const handleMigration = async () => {
    try {
      setIsMigrating(true)
      setError(null)
      setProgress(0)
      
      // Get all documents from the prompts collection
      const promptsSnapshot = await getDocs(collection(db, 'prompts'))
      const totalPrompts = promptsSnapshot.size
      
      if (totalPrompts === 0) {
        toast({
          title: "No prompts found",
          description: "There are no prompts to migrate.",
          variant: "destructive"
        })
        setIsMigrating(false)
        return
      }
      
      setStats({
        total: totalPrompts,
        processed: 0,
        success: 0,
        skipped: 0,
        failed: 0
      })
      
      // Loop through each prompt and migrate to wallpapers collection
      let processed = 0
      let success = 0
      let skipped = 0
      let failed = 0
      
      for (const promptDoc of promptsSnapshot.docs) {
        try {
          const promptData = promptDoc.data()
          const promptId = promptDoc.id
          
          // Check if this document already exists in wallpapers collection
          const existingWallpaperDoc = await getDocs(collection(db, 'wallpapers'))
          let exists = false
          
          existingWallpaperDoc.forEach(doc => {
            if (doc.id === promptId) {
              exists = true
            }
          })
          
          if (exists) {
            console.log(`Skipping ${promptId} - already exists in wallpapers collection`)
            skipped++
          } else {
            // Create the new document in wallpapers collection with the same ID
            await setDoc(doc(db, 'wallpapers', promptId), promptData)
            console.log(`Migrated ${promptId} successfully`)
            success++
          }
        } catch (error) {
          console.error(`Failed to migrate document ${promptDoc.id}:`, error)
          failed++
        }
        
        processed++
        setProgress(Math.floor((processed / totalPrompts) * 100))
        setStats({
          total: totalPrompts,
          processed,
          success,
          skipped,
          failed
        })
      }
      
      setMigrationComplete(true)
      
      toast({
        title: "Migration complete",
        description: `Successfully migrated ${success} wallpapers, skipped ${skipped}, failed ${failed}`,
      })
    } catch (error: any) {
      console.error('Migration error:', error)
      setError(error.message || 'An unexpected error occurred during migration')
      
      toast({
        title: "Migration failed",
        description: error.message || 'An unexpected error occurred during migration',
        variant: "destructive"
      })
    } finally {
      setIsMigrating(false)
    }
  }
  
  const handleDeletePromptsCollection = async () => {
    if (!confirm('Are you sure you want to delete all documents in the prompts collection? This action CANNOT be undone!')) {
      return
    }
    
    try {
      setIsMigrating(true)
      
      // Get all documents from prompts collection
      const promptsSnapshot = await getDocs(collection(db, 'prompts'))
      const totalPrompts = promptsSnapshot.size
      
      if (totalPrompts === 0) {
        toast({
          title: "No prompts found",
          description: "There are no prompts to delete.",
        })
        setIsMigrating(false)
        return
      }
      
      // Delete each document
      let deleted = 0
      for (const promptDoc of promptsSnapshot.docs) {
        await deleteDoc(doc(db, 'prompts', promptDoc.id))
        deleted++
        setProgress(Math.floor((deleted / totalPrompts) * 100))
      }
      
      toast({
        title: "Deletion complete",
        description: `Successfully deleted ${deleted} documents from prompts collection`,
      })
    } catch (error: any) {
      console.error('Deletion error:', error)
      
      toast({
        title: "Deletion failed",
        description: error.message || 'An unexpected error occurred during deletion',
        variant: "destructive"
      })
    } finally {
      setIsMigrating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Migrate Prompts to Wallpapers</CardTitle>
          <CardDescription>
            This utility will migrate all documents from the 'prompts' collection to the 'wallpapers' collection.
            Any existing documents with the same ID in the wallpapers collection will be skipped.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {migrationComplete && (
            <Alert variant="success" className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/30 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Migration Complete</AlertTitle>
              <AlertDescription>
                Total: {stats.total}, Successful: {stats.success}, Skipped: {stats.skipped}, Failed: {stats.failed}
              </AlertDescription>
            </Alert>
          )}
          
          {isMigrating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Migration progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-muted-foreground pt-1">
                Processed {stats.processed} of {stats.total} documents 
                ({stats.success} success, {stats.skipped} skipped, {stats.failed} failed)
              </div>
            </div>
          )}
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md text-amber-800 dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-400">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Important Information</h4>
                <p className="text-sm">
                  This migration tool copies data from the 'prompts' collection to the 'wallpapers' collection.
                  Please make sure to test the application after migration to ensure everything works correctly.
                </p>
                <p className="text-sm mt-2">
                  The original 'prompts' collection will not be deleted automatically. You can delete it manually
                  after verifying that the migration was successful.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
          <div className="w-full sm:w-auto flex gap-3">
            <Button 
              onClick={handleMigration} 
              disabled={isMigrating}
              className="w-full sm:w-auto"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  Start Migration
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin')}
              disabled={isMigrating}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
          
          {migrationComplete && (
            <Button 
              variant="destructive" 
              onClick={handleDeletePromptsCollection}
              disabled={isMigrating}
              className="w-full sm:w-auto"
            >
              Delete 'prompts' Collection
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 