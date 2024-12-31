'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, ImageIcon, Loader2 } from 'lucide-react'

export function ImageUploadSection() {
  const [preview, setPreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      setImageFile(file)
      setGeneratedPrompt(null) // Reset prompt when new image is uploaded
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  })

  const generatePrompt = async () => {
    if (!imageFile) return

    setIsLoading(true)
    try {
      // Convert image to base64
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          resolve(base64String.split(',')[1]) // Remove data URL prefix
        }
        reader.readAsDataURL(imageFile)
      })

      // Call Gemini API
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          mimeType: imageFile.type,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate prompt')
      }

      const data = await response.json()
      setGeneratedPrompt(data.prompt)
    } catch (error) {
      console.error('Error generating prompt:', error)
      // You might want to show an error message to the user
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 mb-8 md:mb-16">
      <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-4 md:gap-8">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            relative flex flex-col items-center justify-center
            min-h-[300px] md:min-h-[400px] p-4 md:p-8 rounded-3xl border-2 border-dashed
            transition-colors cursor-pointer
            ${isDragActive 
              ? 'border-[#0066FF] bg-[#0066FF]/5' 
              : 'border-[#eaeaea] hover:border-[#0066FF] hover:bg-[#fafafa]'
            }
          `}
        >
          <input {...getInputProps()} />
          
          {preview ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-[360px] rounded-2xl object-contain"
            />
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 mb-6 rounded-full bg-[#fafafa] flex items-center justify-center">
                <Upload className="w-8 h-8 text-[#666666]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Drop your image here
              </h3>
              <p className="text-[#666666] mb-6">
                or click to browse from your computer
              </p>
              <div className="flex items-center gap-2 text-[14px] text-[#666666]">
                <ImageIcon className="w-4 h-4" />
                Supports JPG, PNG and WEBP
              </div>
            </div>
          )}
        </div>

        {/* Generate Prompt Section */}
        <div className="bg-[#fafafa] rounded-3xl p-8">
          <h3 className="text-xl font-semibold mb-4">
            Generate Image Description
          </h3>
          <p className="text-[#666666] mb-6">
            Upload an image and our AI will generate a detailed description that you can use as a prompt.
          </p>
          {generatedPrompt && (
            <div className="mb-6 p-4 bg-white rounded-lg border border-[#eaeaea]">
              <p className="text-sm">{generatedPrompt}</p>
            </div>
          )}
          <button 
            className="w-full px-4 py-3 text-[14px] font-medium text-white bg-black rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={!preview || isLoading}
            onClick={generatePrompt}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Prompt'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

