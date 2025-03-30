'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/blog/image-upload'
import { MultiImageUpload } from '@/components/blog/multi-image-upload'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/use-toast'

export default function UITestPage() {
  const [value, setValue] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState('tab1')
  const [switchValue, setSwitchValue] = useState(false)
  const [progressValue, setProgressValue] = useState(30)
  
  const handleImageUpload = (url: string) => {
    console.log('Image uploaded:', url)
    setValue(url)
    toast({
      title: 'Image Uploaded',
      description: 'Test image was successfully uploaded',
    })
  }
  
  const handleRemoveImage = () => {
    setValue('')
  }
  
  const handleMultiImageUpload = (urls: string[]) => {
    console.log('Multiple images uploaded:', urls)
    toast({
      title: 'Multiple Images Uploaded',
      description: `${urls.length} images were successfully uploaded`,
    })
  }

  return (
    <div className="container py-10 space-y-10">
      <h1 className="text-3xl font-bold">UI Components Test Page</h1>
      
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Tabs</h2>
        <Tabs defaultValue="tab1" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <Card>
              <CardHeader>
                <CardTitle>Tab 1 Content</CardTitle>
                <CardDescription>Testing tabs component</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the content for Tab 1</p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setSelectedTab('tab2')}>Go to Tab 2</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="tab2">
            <Card>
              <CardHeader>
                <CardTitle>Tab 2 Content</CardTitle>
                <CardDescription>Testing tabs component</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the content for Tab 2</p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setSelectedTab('tab3')}>Go to Tab 3</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="tab3">
            <Card>
              <CardHeader>
                <CardTitle>Tab 3 Content</CardTitle>
                <CardDescription>Testing tabs component</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the content for Tab 3</p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setSelectedTab('tab1')}>Go to Tab 1</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Dialog</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>This is a test dialog to verify component functionality</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>Dialog content goes here</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Form Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-input">Input</Label>
              <Input id="test-input" placeholder="Test input field" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="test-select">Select</Label>
              <Select>
                <SelectTrigger id="test-select">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="test-switch" 
                checked={switchValue} 
                onCheckedChange={setSwitchValue} 
              />
              <Label htmlFor="test-switch">Switch {switchValue ? 'On' : 'Off'}</Label>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Badge Variants</Label>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Progress</Label>
              <Progress value={progressValue} className="w-full" />
              <div className="flex justify-between">
                <Button 
                  size="sm" 
                  onClick={() => setProgressValue(p => Math.max(0, p - 10))}
                >
                  Decrease
                </Button>
                <span>{progressValue}%</span>
                <Button 
                  size="sm" 
                  onClick={() => setProgressValue(p => Math.min(100, p + 10))}
                >
                  Increase
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Image Upload</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="mb-2 block">Single Image Upload</Label>
            <ImageUpload
              onChange={handleImageUpload}
              onRemove={handleRemoveImage}
              value={value}
            />
          </div>
          
          <div>
            <Label className="mb-2 block">Multi Image Upload</Label>
            <MultiImageUpload
              onImagesSelected={handleMultiImageUpload}
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><span>+</span></Button>
        </div>
      </div>
    </div>
  )
} 