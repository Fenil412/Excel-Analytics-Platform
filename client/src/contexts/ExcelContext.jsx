import { createContext, useContext, useState, useCallback  } from "react"
import axios from "axios"

// Add axios configuration
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
axios.defaults.timeout = 10000;

const ExcelContext = createContext()

export const useExcel = () => useContext(ExcelContext)

export const ExcelProvider = ({ children }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentFile, setCurrentFile] = useState(null)

  // Excel file operations
  const fetchFiles = useCallback( async (username) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`/api/uploads/user-files/${username}`)
      setFiles(response.data)
      setLoading(false)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to fetch files"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  },[])

  const uploadFile = async (file, username) => {
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('excelFile', file) // Changed from 'file' to 'excelFile' to match backend
      formData.append('username', username)
      
      const response = await axios.post(`/api/uploads/upload-excel`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      
      // Fetch updated file list after successful upload
      await fetchFiles(username)
      setLoading(false)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Upload failed"
      setError(errorMessage)
      setLoading(false)
      throw new Error(errorMessage)
    }
  }

  const getFileDetails = async (fileId) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`/api/uploads/file-data/${fileId}`)      
      setCurrentFile(response.data)
      setLoading(false)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to get file details"
      setError(errorMessage)
      setLoading(false)
      throw new Error(errorMessage)
    }
  }

  const deleteFile = async (fileId, username) => {
    setLoading(true)
    setError(null)
    try {
      await axios.delete(`/api/uploads/delete-file/${fileId}`)
      // Refresh the file list after deletion
      await fetchFiles(username)
      setLoading(false)
      return true
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to delete file"
      setError(errorMessage)
      setLoading(false)
      throw new Error(errorMessage)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <ExcelContext.Provider
      value={{
        files,
        loading,
        error,
        currentFile,
        fetchFiles,
        uploadFile,
        getFileDetails,
        deleteFile,
        clearError,
        setError,
      }}
    >
      {children}
    </ExcelContext.Provider>
  )
}

export default ExcelContext