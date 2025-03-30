'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc, deleteDoc, Timestamp, query, where, orderBy, limit } from 'firebase/firestore';
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
import { Loader2, Plus, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

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
  publishedAt: {
    toDate?: () => Date;
    seconds?: number;
    nanoseconds?: number;
  } | string | null;
}

interface Prompt {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  createdAt: string;
  imageUrl: string;
}

interface DashboardStats {
  totalPrompts: number;
  freePrompts: number;
  totalUsers: number;
  recentPrompts: Prompt[];
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
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
  const [stats, setStats] = useState<DashboardStats>({
    totalPrompts: 0,
    freePrompts: 0,
    totalUsers: 0,
    recentPrompts: []
  });
  const [token, setToken] = useState<string>('');

  const fetchStats = async () => {
    try {
      const promptsSnapshot = await getDocs(collection(db, 'wallpapers'));
      const totalPrompts = promptsSnapshot.size;

      const freePromptsQuery = query(collection(db, 'wallpapers'), where('price', '==', 0));
      const freePromptsSnapshot = await getDocs(freePromptsQuery);
      const freePrompts = freePromptsSnapshot.size;

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      const recentPromptsQuery = query(
        collection(db, 'wallpapers'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentPromptsSnapshot = await getDocs(recentPromptsQuery);
      const recentPrompts = recentPromptsSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        category: doc.data().category,
        price: doc.data().price,
        createdAt: doc.data().createdAt,
        imageUrl: doc.data().imageUrl
      }));

      setStats({
        totalPrompts,
        freePrompts,
        totalUsers,
        recentPrompts
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    console.log('Fetching users...');
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || '',
        credits: doc.data().credits || 0,
        isAdmin: doc.data().isAdmin || false,
        createdAt: doc.data().createdAt || new Date().toISOString()
      }));
      
      setUsers(usersData);
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    }
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (!user) {
          console.log('No user found, redirecting to auth...');
          router.push('/auth?redirect=/admin');
          return;
        }

        const token = await auth.currentUser?.getIdToken(true);
        if (!token) {
          throw new Error('Failed to get auth token');
        }
        setToken(token);

        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists() || !userDocSnap.data()?.isAdmin) {
          console.log('User is not admin, redirecting to home...');
          router.push('/');
          return;
        }

        setIsAdmin(true);
        await Promise.all([
          fetchUsers(),
          fetchMetadata(),
          fetchBlogPosts(),
          fetchStats()
        ]).catch(error => {
          console.error('Error fetching initial data:', error);
        });
      } catch (error) {
        console.error('Error checking admin status:', error);
        setError('Failed to verify admin status. Please try logging out and back in.');
        router.push('/');
      }
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading, router]);

  const fetchMetadata = async () => {
    try {
      const metadataRef = doc(db, 'metadata', 'website');
      const metadataSnap = await getDoc(metadataRef);
      
      if (metadataSnap.exists()) {
        setMetadata(metadataSnap.data() as WebsiteMetadata);
      } else {
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
      await fetchUsers();
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
      const postDoc = await getDoc(doc(db, 'blog_posts', postId));
      if (!postDoc.exists()) return;

      const originalPost = postDoc.data();
      
      const newPostData = {
        ...originalPost,
        title: `${originalPost.title} (Copy)`,
        updatedAt: Timestamp.now(),
        status: originalPost.status,
        publishedAt: originalPost.status === 'published' ? Timestamp.now() : null
      };

      const newDocRef = doc(collection(db, 'blog_posts'));
      await setDoc(newDocRef, newPostData);
      
      fetchBlogPosts();
    } catch (error) {
      console.error('Error duplicating post:', error);
    }
  };

  const formatPublishedDate = (publishedAt: any) => {
    if (!publishedAt) return 'Draft';
    
    try {
      if (publishedAt?.toDate) {
        return formatDistanceToNow(publishedAt.toDate(), { addSuffix: true });
      }
      
      if (typeof publishedAt === 'string') {
        return formatDistanceToNow(new Date(publishedAt), { addSuffix: true });
      }
      
      if (publishedAt.seconds) {
        return formatDistanceToNow(new Date(publishedAt.seconds * 1000), { addSuffix: true });
      }
      
      return 'Draft';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Draft';
    }
  };

  if (typeof window === 'undefined') {
    return null;
  }

  if (authLoading || (!isAdmin && isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-4">You need to be an admin to access this page.</p>
        <Button onClick={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrompts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Prompts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.freePrompts}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent Prompts</h2>
        </div>
        <div className="space-y-2">
          {stats.recentPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div>
                <h3 className="font-medium text-sm">{prompt.title}</h3>
                <p className="text-xs text-muted-foreground">{prompt.category}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">
                  {prompt.price === 0 ? 'Free' : prompt.price ? `$${prompt.price.toFixed(2)}` : '$0.00'}
                </span>
                <Link href={`/admin/prompts/${prompt.id}`}>
                  <Button variant="ghost" size="sm" className="h-8">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blog Posts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Blog Posts</h2>
          <Button
            onClick={() => router.push('/admin/blog/new')}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      post.status === 'published' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    )}>
                      {post.status}
                    </span>
                  </TableCell>
                  <TableCell>{post.author.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatPublishedDate(post.publishedAt)}
                  </TableCell>
                  <TableCell>
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
                        className="text-destructive"
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
                  </TableCell>
                </TableRow>
              ))}
              {blogPosts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No blog posts yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Website Settings</h2>
        </div>
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Website Title</Label>
              <Input
                id="title"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                value={metadata.keywords}
                onChange={(e) => setMetadata(prev => ({ ...prev, keywords: e.target.value }))}
                className="mt-1"
              />
            </div>
            <Button
              onClick={updateMetadata}
              disabled={isMetadataLoading}
              size="sm"
            >
              {isMetadataLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Update Settings
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 