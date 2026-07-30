'use client'

import { useRef, useState } from 'react'

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
      if (
        file.name.endsWith('.ts') ||
        file.name.endsWith('.tsx') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.jsx')
      ) {
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
    <div>
      <label htmlFor="file-upload" className="sr-only">
        Upload JavaScript or TypeScript files for analysis
      </label>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        aria-label="Drop zone for file upload. Click or drag files here."
        className={`dropzone${dragActive ? ' dropzone--active' : ''}`}
        style={isAnalyzing ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
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
          className="sr-only"
        />
        <p className="dropzone__title">Drop files or click to browse</p>
        <p id="file-upload-description" className="dropzone__hint">
          .ts · .tsx · .js · .jsx
        </p>
      </div>
    </div>
  )
}
