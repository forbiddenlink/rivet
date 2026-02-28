'use client'

import { useState, useRef } from 'react'

interface FileUploadProps {
  onAnalyze: (content: string, fileName: string) => void
  isAnalyzing?: boolean
}

export function FileUpload({ onAnalyze, isAnalyzing }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i)
      if (!file) continue
      if (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        const content = await file.text()
        onAnalyze(content, file.name)
      }
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  return (
    <div className="w-full">
      <label htmlFor="file-upload" className="sr-only">
        Upload JavaScript or TypeScript files for analysis
      </label>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        aria-label="Drop zone for file upload. Click or drag files here."
        className={`relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-cyan-400 bg-cyan-400/10' : 'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50'
        } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          id="file-upload"
          name="file-upload"
          type="file"
          multiple
          accept=".ts,.tsx,.js,.jsx"
          onChange={handleChange}
          disabled={isAnalyzing}
          aria-label="Select JavaScript or TypeScript files to analyze"
          aria-describedby="file-upload-description"
          className="hidden"
        />
        <div className="space-y-2">
          <div className="text-sm font-medium text-purple-300">
            <span aria-hidden="true">📁</span> Drag & drop files or click to upload
          </div>
          <div id="file-upload-description" className="text-xs text-purple-400">
            Supported: .ts, .tsx, .js, .jsx
          </div>
        </div>
      </div>
      <div className="mt-4 text-xs text-purple-400" aria-hidden="true">
        <span aria-hidden="true">💡</span> Tip: Upload your TypeScript/JavaScript files for instant analysis
      </div>
    </div>
  )
}
