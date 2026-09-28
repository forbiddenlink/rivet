'use client'

import { useRef, useState } from 'react'

const ACCEPTED = ['.ts', '.tsx', '.js', '.jsx']
const MAX_BYTES = 200_000

interface FileUploadProps {
  onLoad: (content: string, fileName: string) => void
  /** Name of the file currently in the editor, if it came from an upload. */
  loadedName: string | null
  disabled?: boolean
}

/**
 * Loads one file into the editor. The web scan reads a single file, so extra
 * files and unsupported types are reported instead of silently dropped.
 */
export function FileUpload({ onLoad, loadedName, disabled }: FileUploadProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const handleFiles = async (files: FileList) => {
    const list = Array.from(files)
    const file = list.find((f) => ACCEPTED.some((ext) => f.name.endsWith(ext)))
    const skipped = list.filter((f) => f !== file).map((f) => f.name)

    if (!file) {
      setNotice(
        list.length
          ? `Skipped ${skipped.join(', ')}: only ${ACCEPTED.join(', ')} files can be scanned.`
          : null
      )
      return
    }
    if (file.size > MAX_BYTES) {
      setNotice(`${file.name} is over 200 KB. Use the CLI for larger files.`)
      return
    }
    onLoad(await file.text(), file.name)
    setNotice(
      skipped.length
        ? `Loaded ${file.name}. Skipped ${skipped.join(', ')}: the dashboard scans one file at a time.`
        : null
    )
  }

  const onDrag = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  return (
    <div className="upload">
      <input
        ref={inputRef}
        id="file-upload"
        type="file"
        aria-label="Choose a file to scan"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        className="drop"
        data-active={dragActive ? '' : undefined}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragEnter={onDrag}
        onDragOver={onDrag}
        onDragLeave={onDrag}
        onDrop={(e) => {
          onDrag(e)
          setDragActive(false)
          void handleFiles(e.dataTransfer.files)
        }}
        aria-describedby="file-upload-hint"
      >
        <b>Choose a file or drop it here</b>
        <span id="file-upload-hint">.ts, .tsx, .js or .jsx, up to 200 KB</span>
      </button>
      {loadedName && (
        <p className="file-row">
          <span>{loadedName}</span>
          <span className="file-row__ok">In editor</span>
        </p>
      )}
      <p className="upload__notice" role="status">
        {notice}
      </p>
    </div>
  )
}
