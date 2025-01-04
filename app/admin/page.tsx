'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  credits: number;
  isAdmin: boolean;
  createdAt: string;
}

interface WebsiteMetadata {
  title: string;
  description: string;
  keywords: string;
}

interface BlogPost {
  id: string;
  title: string;
  status: string;
  author: {
    name: string;
  };
  publishedAt: Timestamp;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<WebsiteMetadata>({
    title: '',
    description: '',
    keywords: ''
  });
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        console.log('No user found, redirecting to auth...');
        router.push('/auth?redirect=/admin');
        return;
      }

      console.log('Checking admin status for user:', user.email);
      try {
        // Force token refresh to ensure we have the latest claims
        await auth.currentUser?.getIdToken(true);
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        console.log('User document exists:', userDocSnap.exists());
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          console.log('User data:', userData);
          
          if (!userData?.isAdmin) {
            console.log('User is not admin, redirecting to home...');
            router.push('/');
            return;
          }
          console.log('User is admin, proceeding...');
          setIsAdmin(true);
          fetchUsers();
        } else {
          console.log('User document does not exist');
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setError('Failed to verify admin status. Please try logging out and back in.');
        router.push('/');
      }
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchMetadata();
      fetchBlogPosts();
    }
  }, [isAdmin]);

  const fetchMetadata = async () => {
    try {
      const metadataRef = doc(db, 'metadata', 'website');
      const metadataSnap = await getDoc(metadataRef);
      
      if (metadataSnap.exists()) {
        setMetadata(metadataSnap.data() as WebsiteMetadata);
      } else {
        // Initialize with default values if document doesn't exist
        const defaultMetadata = {
          title: 'PromptBase',
          description: 'Your AI Prompt Management Tool',
          keywords: '',
          lastUpdated: new Date().toISOString()
        };
        await setDoc(metadataRef, defaultMetadata);
        setMetadata(defaultMetadata);
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
      setError('Failed to fetch website metadata');
    }
  };

  const updateMetadata = async () => {
    setIsMetadataLoading(true);
    try {
      const metadataRef = doc(db, 'metadata', 'website');
      const metadataSnap = await getDoc(metadataRef);
      
      const updatedMetadata = {
        ...metadata,
        lastUpdated: new Date().toISOString()
      };

      if (metadataSnap.exists()) {
        await updateDoc(metadataRef, updatedMetadata);
      } else {
        await setDoc(metadataRef, updatedMetadata);
      }
      setError(null);
    } catch (error: any) {
      console.error('Error updating metadata:', error);
      setError(error.message || 'Failed to update metadata');
    } finally {
      setIsMetadataLoading(false);
    }
  };

  const fetchUsers = async () => {
    console.log('Fetching users...');
    try {
      const usersRef = collection(db, 'users');
      console.log('Getting users collection...');
      const usersSnapshot = await getDocs(usersRef);
      console.log('Users snapshot size:', usersSnapshot.size);
      
      const usersData = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('User data:', doc.id, data);
        return {
          id: doc.id,
          email: data.email || '',
          credits: data.credits || 0,
          isAdmin: data.isAdmin || false,
          createdAt: data.createdAt || new Date().toISOString(),
        } as User;
      });
      
      console.log('Processed users data:', usersData);
      setUsers(usersData);
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please check your admin privileges and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserCredits = async (userId: string, newCredits: number) => {
    console.log('Updating credits for user:', userId, 'New credits:', newCredits);
    
    if (isNaN(newCredits) || newCredits < 0) {
      setError('Credits must be a valid positive number');
      return;
    }

    setUpdateLoading(userId);
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      await updateDoc(userRef, {
        credits: Number(newCredits),
        lastUpdated: new Date().toISOString()
      });
      
      console.log('Credits updated successfully');
      await fetchUsers(); // Refresh the list
      setError(null);
    } catch (error: any) {
      console.error('Error updating credits:', error);
      setError(error.message || 'Failed to update credits');
    } finally {
      setUpdateLoading(null);
    }
  };

  const handleCreditUpdate = (userId: string, input: HTMLInputElement) => {
    const newCredits = parseInt(input.value);
    if (isNaN(newCredits)) {
      setError('Please enter a valid number');
      return;
    }
    updateUserCredits(userId, newCredits);
  };

  const fetchBlogPosts = async () => {
    try {
      const blogPostsRef = collection(db, 'blog_posts');
      const blogPostsSnapshot = await getDocs(blogPostsRef);
      const blogPostsData = blogPostsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          status: data.status,
          author: {
            name: data.author?.name || ''
          },
          publishedAt: data.publishedAt
        } as BlogPost;
      });
      setBlogPosts(blogPostsData);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setError('Failed to fetch blog posts');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'blog_posts', postId));
        fetchBlogPosts();
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleDuplicatePost = async (postId: string) => {
    try {
      // Get the original post
      const postDoc = await getDoc(doc(db, 'blog_posts', postId));
      if (!postDoc.exists()) return;

      const originalPost = postDoc.data();
      
      // Create new post data maintaining original status and publishedAt if published
      const newPostData = {
        ...originalPost,
        title: `${originalPost.title} (Copy)`,
        updatedAt: Timestamp.now(),
        // Maintain original status and publishedAt
        status: originalPost.status,
        publishedAt: originalPost.status === 'published' ? Timestamp.now() : null
      };

      // Create a new document
      const newDocRef = doc(collection(db, 'blog_posts'));
      await setDoc(newDocRef, newPostData);
      
      // Refresh the posts list
      fetchBlogPosts();
    } catch (error) {
      console.error('Error duplicating post:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-4">You need to be an admin to access this page.</p>
        <Button onClick={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button 
          onClick={fetchUsers}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Refresh Users
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Website Metadata Section */}
        <div className="rounded-md border p-6">
          <h2 className="text-xl font-semibold mb-4">Website Metadata</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Website Title
              </label>
              <Input
                id="title"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter website title"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <Input
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter website description"
              />
            </div>
            <div>
              <label htmlFor="keywords" className="block text-sm font-medium mb-1">
                Keywords
              </label>
              <Input
                id="keywords"
                value={metadata.keywords}
                onChange={(e) => setMetadata(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="Enter keywords (comma-separated)"
              />
            </div>
            <Button
              onClick={updateMetadata}
              disabled={isMetadataLoading}
            >
              {isMetadataLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Update Metadata
            </Button>
          </div>
        </div>

        {/* Users Table Section */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Admin Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            defaultValue={user.credits}
                            className="w-24"
                            min="0"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const target = e.target as HTMLInputElement;
                                handleCreditUpdate(user.id, target);
                              }
                            }}
                            onChange={(e) => {
                              // Clear error when user starts typing
                              if (error) setError(null);
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                              handleCreditUpdate(user.id, input);
                            }}
                            disabled={updateLoading === user.id}
                          >
                            Update
                          </Button>
                          {updateLoading === user.id && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.isAdmin ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {/* Future actions can be added here */}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Blog Posts Management Section */}
        <div className="rounded-md border p-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Blog Posts</h2>
            <Button
              onClick={() => router.push('/admin/blog/new')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Create New Post
            </Button>
          </div>

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3">Title</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Author</th>
                  <th scope="col" className="px-6 py-3">Published</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogPosts.map((post) => (
                  <tr key={post.id} className="bg-background border-b">
                    <td className="px-6 py-4 font-medium">
                      {post.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        post.status === 'published' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      )}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {post.author.name}
                    </td>
                    <td className="px-6 py-4">
                      {post.publishedAt ? formatDistanceToNow(post.publishedAt.toDate(), { addSuffix: true }) : 'Draft'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/blog/edit/${post.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicatePost(post.id)}
                        >
                          Duplicate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {blogPosts.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No blog posts yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 