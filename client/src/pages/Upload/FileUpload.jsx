import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, CheckCircle, AlertCircle, FileSpreadsheet, Loader } from "lucide-react"
import { useExcel } from "../../contexts/ExcelContext"
import { useAuth } from "../../contexts/AuthContext";

const FileUpload = () => {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const { uploadFile, error, clearError } = useExcel()

  const { user } = useAuth();
  const username = user?.username || "User";

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: "pending",
      progress: 0,
      error: null,
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: true,
  })

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const uploadSingleFile = async (fileItem) => {
    try {
      // Update status to uploading
      setFiles((prev) => prev.map((f) => (f.id === fileItem.id ? { ...f, status: "uploading" } : f)))

      // Simulate progress for UI feedback
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20
        if (progress < 90) {
          setUploadProgress((prev) => ({ ...prev, [fileItem.id]: progress }))
        }
      }, 200)

      // Upload the file
      const result = await uploadFile(fileItem.file, username)
      
      // Complete progress
      clearInterval(progressInterval)
      setUploadProgress((prev) => ({ ...prev, [fileItem.id]: 100 }))

      // Update status to uploaded
      setFiles((prev) => prev.map((f) => (f.id === fileItem.id ? { ...f, status: "uploaded", result } : f)))
      
      return result
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileItem.id ? { ...f, status: "error", error: error.message } : f)),
      )
      throw error
    }
  }

  const uploadFiles = async () => {
    setUploading(true)
    clearError()

    const pendingFiles = files.filter(f => f.status === "pending")
    
    for (const fileItem of pendingFiles) {
      try {
        await uploadSingleFile(fileItem)
      } catch (error) {
        console.error(`Failed to upload ${fileItem.file.name}:`, error)
      }
    }

    setUploading(false)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Clear global error when component unmounts
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upload Files</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your Excel files for analysis. Supported formats: .xlsx, .xls, .csv
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button 
              onClick={clearError}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          {isDragActive ? (
            <p className="text-lg text-blue-600 dark:text-blue-400">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                Drag & drop files here, or click to select files
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Maximum file size: 10MB per file</p>
            </div>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Selected Files ({files.length})</h3>
              <button
                onClick={uploadFiles}
                disabled={uploading || files.every((f) => f.status === "uploaded" || f.status === "uploading")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <div className="flex items-center">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Uploading...
                  </div>
                ) : (
                  "Upload All"
                )}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center flex-1">
                  <FileSpreadsheet className="h-8 w-8 text-green-500 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{fileItem.file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(fileItem.file.size)}</p>

                    {/* Progress Bar */}
                    {fileItem.status === "uploading" && (
                      <div className="mt-2">
                        <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress[fileItem.id] || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {Math.round(uploadProgress[fileItem.id] || 0)}%
                        </p>
                      </div>
                    )}

                    {/* Success Message */}
                    {fileItem.status === "uploaded" && fileItem.result && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Uploaded successfully • {fileItem.result.sheetNames?.length || 0} sheets detected
                      </p>
                    )}

                    {/* Error Message */}
                    {fileItem.error && <p className="text-xs text-red-500 mt-1">{fileItem.error}</p>}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Status Icon */}
                  {fileItem.status === "uploaded" && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {fileItem.status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                  {fileItem.status === "uploading" && <Loader className="h-5 w-5 text-blue-500 animate-spin" />}

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(fileItem.id)}
                    disabled={fileItem.status === "uploading"}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload