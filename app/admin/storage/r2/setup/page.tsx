'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface ConfigStatus {
  endpoint: boolean;
  accessKeyId: boolean;
  secretAccessKey: boolean;
  bucketName: boolean;
  publicDomain?: boolean;
}

export default function R2SetupPage() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check R2 configuration
  const checkR2Config = async () => {
    setIsChecking(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch('/api/storage/r2/check-config');
      const data = await response.json();
      
      if (response.ok) {
        setConfigStatus(data.status);
      } else {
        setErrorMessage(data.error || 'Failed to check R2 configuration');
        setConfigStatus(null);
      }
    } catch (error) {
      console.error('Error checking R2 configuration:', error);
      setErrorMessage('Network error while checking R2 configuration');
      setConfigStatus(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Check config on first load
  useEffect(() => {
    checkR2Config();
  }, []);

  const isConfigured = configStatus && 
    configStatus.endpoint && 
    configStatus.accessKeyId && 
    configStatus.secretAccessKey && 
    configStatus.bucketName;

  return (
    <div className="container py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">R2 Storage Setup</h1>
        <p className="text-muted-foreground">Configure your Cloudflare R2 storage for wallpaper images</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Status</CardTitle>
          <CardDescription>
            Check if your Cloudflare R2 is properly configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ConfigStatusItem 
                name="R2 Endpoint" 
                envVar="CLOUDFLARE_R2_ENDPOINT" 
                isConfigured={configStatus?.endpoint}
                isLoading={isChecking}
              />
              <ConfigStatusItem 
                name="Access Key ID" 
                envVar="CLOUDFLARE_R2_ACCESS_KEY_ID" 
                isConfigured={configStatus?.accessKeyId}
                isLoading={isChecking}
              />
              <ConfigStatusItem 
                name="Secret Access Key" 
                envVar="CLOUDFLARE_R2_SECRET_ACCESS_KEY" 
                isConfigured={configStatus?.secretAccessKey}
                isLoading={isChecking}
              />
              <ConfigStatusItem 
                name="Bucket Name" 
                envVar="CLOUDFLARE_R2_BUCKET_NAME" 
                isConfigured={configStatus?.bucketName}
                isLoading={isChecking}
              />
              <ConfigStatusItem 
                name="Public Domain (Optional)" 
                envVar="CLOUDFLARE_R2_PUBLIC_DOMAIN" 
                isConfigured={configStatus?.publicDomain}
                isLoading={isChecking}
                optional
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={checkR2Config} disabled={isChecking}>
                {isChecking ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Configuration'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="setup">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="setup">Setup Instructions</TabsTrigger>
          <TabsTrigger value="env">Environment Variables</TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Setting up Cloudflare R2</CardTitle>
              <CardDescription>
                Follow these steps to set up Cloudflare R2 storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SetupStep 
                number={1} 
                title="Create a Cloudflare Account" 
                description="Sign up for Cloudflare if you don't already have an account"
                link={{
                  url: "https://dash.cloudflare.com/sign-up",
                  text: "Sign up for Cloudflare"
                }}
              />
              
              <SetupStep 
                number={2} 
                title="Enable R2 Storage" 
                description="Navigate to R2 in your Cloudflare dashboard and enable the service"
                link={{
                  url: "https://dash.cloudflare.com/?to=/:account/r2",
                  text: "Go to R2 Dashboard"
                }}
              />
              
              <SetupStep 
                number={3} 
                title="Create a Bucket" 
                description="Create a new bucket named 'wallpaper-images' (or your preferred name)"
              />
              
              <SetupStep 
                number={4} 
                title="Create API Tokens" 
                description="Create an R2 API token with read and write permissions"
                link={{
                  url: "https://dash.cloudflare.com/?to=/:account/r2/api-tokens",
                  text: "Create R2 API Token"
                }}
              />
              
              <SetupStep 
                number={5} 
                title="Configure Environment Variables" 
                description="Add the required environment variables to your .env.local file"
              />
              
              <SetupStep 
                number={6} 
                title="Restart Your Application" 
                description="Restart your Next.js application to apply the new environment variables"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="env" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>
                Add these variables to your .env.local file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
                <pre>{`# Cloudflare R2 Configuration
CLOUDFLARE_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=<your-access-key-id>
CLOUDFLARE_R2_SECRET_ACCESS_KEY=<your-secret-access-key>
CLOUDFLARE_R2_BUCKET_NAME=wallpaper-images

# Optional: Public Domain (if you've set up a public bucket)
CLOUDFLARE_R2_PUBLIC_DOMAIN=https://<your-public-domain>.r2.dev
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN=<your-public-domain>.r2.dev # Without https:// for Next.js Image component
`}</pre>
              </div>
              
              <div className="mt-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    After updating your environment variables, you'll need to restart your Next.js application.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper components

function ConfigStatusItem({ 
  name, 
  envVar, 
  isConfigured, 
  isLoading, 
  optional = false 
}: { 
  name: string; 
  envVar: string; 
  isConfigured?: boolean; 
  isLoading: boolean;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-card border">
      <div>
        <div className="font-medium">
          {name}
          {optional && <span className="ml-2 text-xs text-muted-foreground">(Optional)</span>}
        </div>
        <div className="text-xs text-muted-foreground">{envVar}</div>
      </div>
      <div>
        {isLoading ? (
          <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
        ) : isConfigured ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <AlertCircle className={`h-5 w-5 ${optional ? 'text-yellow-500' : 'text-red-500'}`} />
        )}
      </div>
    </div>
  );
}

function SetupStep({ 
  number, 
  title, 
  description, 
  link 
}: { 
  number: number; 
  title: string; 
  description: string;
  link?: { url: string; text: string };
}) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
          {number}
        </div>
        <div className="font-medium">{title}</div>
      </div>
      <div className="mt-2 pl-12">
        <p className="text-muted-foreground text-sm">{description}</p>
        {link && (
          <a 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center text-sm font-medium text-primary"
          >
            {link.text}
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        )}
      </div>
      {number < 6 && <Separator className="my-4" />}
    </div>
  );
} 