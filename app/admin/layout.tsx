'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Image,
  Users,
  Settings,
  Menu,
  X,
  Loader2,
  FileText,
  PanelTopClose,
  Database,
  Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

interface SubMenuItem {
  name: string;
  href: string;
  description: string;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  description: string;
  submenu?: SubMenuItem[];
}

interface NavigationSection {
  category: string;
  items: MenuItem[];
}

// Navigation structure with categories
const navigation: NavigationSection[] = [
  {
    category: 'Overview',
    items: [
      {
        name: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        description: 'Admin dashboard with stats'
      },
      {
        name: 'Back to Main Site',
        href: '/',
        icon: Home,
        description: 'Return to website'
      }
    ]
  },
  {
    category: 'Content',
    items: [
      {
        name: 'Wallpapers',
        href: '/admin/wallpapers',
        icon: Image,
        description: 'Manage wallpapers',
        submenu: [
          {
            name: 'All Wallpapers',
            href: '/admin/wallpapers',
            description: 'View and edit wallpapers'
          },
          {
            name: 'Bulk Upload',
            href: '/admin/wallpapers/bulk-upload',
            description: 'Upload multiple wallpapers at once'
          }
        ]
      },
      {
        name: 'Blog',
        href: '/admin/blog',
        icon: FileText,
        description: 'Manage blog posts'
      }
    ]
  },
  {
    category: 'Management',
    items: [
      {
        name: 'Users',
        href: '/admin/users',
        icon: Users,
        description: 'User management'
      },
      {
        name: 'Storage',
        href: '/admin/storage',
        icon: Database,
        description: 'Manage storage providers',
        submenu: [
          {
            name: 'Overview',
            href: '/admin/storage',
            description: 'Storage dashboard'
          },
          {
            name: 'R2 Storage',
            href: '/admin/storage/r2',
            description: 'Cloudflare R2 for wallpapers'
          },
          {
            name: 'R2 Setup',
            href: '/admin/storage/r2/setup',
            description: 'Configure Cloudflare R2'
          }
        ]
      },
      {
        name: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        description: 'Site settings'
      },
      {
        name: 'Database Migration',
        href: '/admin/migrate',
        icon: Database,
        description: 'Database migration tools'
      }
    ]
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [adminName, setAdminName] = useState('')

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser
      if (!user) {
        router.push('/auth?redirect=/admin')
        return
      }

      try {
        await user.getIdToken(true)
        const userDocRef = doc(db, 'users', user.uid)
        const userDocSnap = await getDoc(userDocRef)
        
        if (!userDocSnap.exists() || !userDocSnap.data()?.isAdmin) {
          router.push('/')
          return
        }

        setAdminName(userDocSnap.data()?.name || user.email?.split('@')[0] || 'Admin')
        setIsAdmin(true)
        setIsLoading(false)
      } catch (error) {
        router.push('/')
      }
    }

    checkAdminStatus()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-4">You need to be an admin to access this page.</p>
        <Button onClick={() => router.push('/')}>Go Home</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 transform bg-background border-r shadow-lg transition-transform duration-200 ease-in-out lg:hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="flex items-center justify-between px-4 h-16 border-b">
            <div className="flex items-center">
              <PanelTopClose className="h-6 w-6 text-primary mr-2" />
              <span className="font-semibold">Admin Panel</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 p-4 border-b">
            <Avatar>
              <AvatarFallback>{adminName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{adminName}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>

          <div className="py-2 flex-1 overflow-y-auto">
            {navigation.map((section) => (
              <div key={section.category} className="px-3 py-2">
                <h3 className="mb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.category}
                </h3>
                {section.items.map((item) => (
                  <div key={item.name} className="mb-1">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        pathname === item.href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                      onClick={() => setSidebarOpen(false)}
                      title={item.description}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                    
                    {/* Submenu */}
                    {item.submenu && (
                      <div className="pl-8 mt-1 space-y-1">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.name}
                            href={subitem.href}
                            className={cn(
                              "flex items-center py-1.5 px-3 text-sm rounded-md transition-colors",
                              pathname === subitem.href
                                ? "text-primary bg-primary/5"
                                : "text-muted-foreground hover:bg-muted"
                            )}
                            onClick={() => setSidebarOpen(false)}
                            title={subitem.description}
                          >
                            {subitem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {section !== navigation[navigation.length - 1] && (
                  <Separator className="my-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-72 border-r shadow-sm">
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-6 border-b">
            <PanelTopClose className="h-6 w-6 text-primary mr-2" />
            <span className="font-semibold">Admin Panel</span>
          </div>
          
          <div className="flex items-center gap-2 p-4 border-b">
            <Avatar>
              <AvatarFallback>{adminName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{adminName}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>

          <div className="py-2 flex-1 overflow-y-auto">
            {navigation.map((section) => (
              <div key={section.category} className="px-3 py-2">
                <h3 className="mb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.category}
                </h3>
                {section.items.map((item) => (
                  <div key={item.name} className="mb-1">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        pathname === item.href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                      title={item.description}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                    
                    {/* Submenu */}
                    {item.submenu && (
                      <div className="pl-8 mt-1 space-y-1">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.name}
                            href={subitem.href}
                            className={cn(
                              "flex items-center py-1.5 px-3 text-sm rounded-md transition-colors",
                              pathname === subitem.href
                                ? "text-primary bg-primary/5"
                                : "text-muted-foreground hover:bg-muted"
                            )}
                            title={subitem.description}
                          >
                            {subitem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {section !== navigation[navigation.length - 1] && (
                  <Separator className="my-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <div className="lg:hidden h-16"></div> {/* Spacer for mobile */}
        <main className="flex-1 container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  )
} 