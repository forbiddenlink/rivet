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

  const handleDrag = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
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
      {/* The input lives outside the button: a file input nested inside a button is
          invalid HTML, and the browser swallows the click that should open the picker. */}
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
      {/* A real button gives keyboard activation, focus ring, and disabled state for
          free, so the hand-rolled tabIndex and Enter/Space handling can go. */}
      <button
        type="button"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        disabled={isAnalyzing}
        aria-label="Drop zone for file upload. Click or drag files here."
        aria-describedby="file-upload-description"
        className={`dropzone${dragActive ? ' dropzone--active' : ''}`}
      >
        <span className="dropzone__title">Drop files or click to browse</span>
        <span id="file-upload-description" className="dropzone__hint">
          .ts · .tsx · .js · .jsx
        </span>
      </button>
    </div>
  )
}
