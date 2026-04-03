import React, { useCallback } from 'react'
import { Upload, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

export interface ImageData {
  file: File
  preview: string
}

interface ImageUploadProps {
  image: ImageData | null
  onImageChange: (image: ImageData | null) => void
  maxSizeMB?: number
}

const ImageUpload: React.FC<ImageUploadProps> = ({ image, onImageChange, maxSizeMB = 10 }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        const reader = new FileReader()
        reader.onloadend = () => {
          onImageChange({
            file,
            preview: reader.result as string,
          })
        }
        reader.readAsDataURL(file)
      }
    },
    [onImageChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
  })

  if (image) {
    return (
      <div className="relative">
        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 animate-scale-in">
          <img
            src={image.preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
        <button
          onClick={() => onImageChange(null)}
          className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
        >
          <X size={20} className="text-gray-700" />
        </button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`
        aspect-square border-2 border-dashed rounded-2xl
        flex flex-col items-center justify-center
        cursor-pointer transition-colors
        ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }
      `}
    >
      <input {...getInputProps()} />
      <Upload
        size={48}
        className={`mb-4 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`}
      />
      <p className="text-lg font-medium text-gray-700 mb-2">
        {isDragActive ? 'Drop image here' : 'Drag & drop an image'}
      </p>
      <p className="text-sm text-gray-500">
        or click to browse (max {maxSizeMB}MB)
      </p>
      <p className="text-xs text-gray-400 mt-2">
        PNG, JPG, GIF, or WebP
      </p>
    </div>
  )
}

export default ImageUpload
