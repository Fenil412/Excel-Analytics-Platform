import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../components/ui/use-toast"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { Upload, FileSpreadsheet, User, Settings } from "lucide-react"
import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

const DashboardPage = () => {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  })
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || "",
        email: user.email || "",
      })
    }
  }, [user])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ]

      if (validTypes.includes(file.type)) {
        setSelectedFile(file)
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please select an Excel file (.xlsx or .xls)",
        })
      }
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "No File Selected",
        description: "Please select an Excel file to upload",
      })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("excelFile", selectedFile)

    try {
      const response = await axios.post(`${API_URL}/api/uploads/excel`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      toast({
        title: "Success",
        description: "File uploaded successfully!",
      })

      setSelectedFile(null)
      // Reset file input
      const fileInput = document.getElementById("file-upload")
      if (fileInput) fileInput.value = ""
    } catch (error) {
      console.error("Upload failed:", error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload file. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setIsUpdatingProfile(true)

    try {
      const result = await updateProfile(profileData)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "upload", label: "Upload Excel", icon: Upload },
    { id: "profile", label: "Profile", icon: Settings },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, {user?.username}!</p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Profile</h3>
                    <p className="text-gray-600">Manage your account</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileSpreadsheet className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Excel Analytics</h3>
                    <p className="text-gray-600">Upload and analyze files</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow border">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Settings className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Settings</h3>
                    <p className="text-gray-600">Configure preferences</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="max-w-2xl">
              <div className="bg-white p-6 rounded-lg shadow border">
                <h2 className="text-xl font-semibold mb-4">Upload Excel File</h2>
                <p className="text-gray-600 mb-6">
                  Upload your Excel files (.xlsx or .xls) for analysis. Maximum file size: 10MB.
                </p>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Excel File
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  {selectedFile && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Selected file:</strong> {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-500">Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}

                  <button
                    onClick={handleFileUpload}
                    disabled={!selectedFile || isUploading}
                    className={`w-full py-2 px-4 rounded-md font-medium ${
                      !selectedFile || isUploading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isUploading ? "Uploading..." : "Upload File"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="max-w-2xl">
              <div className="bg-white p-6 rounded-lg shadow border">
                <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={profileData.username}
                      onChange={handleProfileChange}
                      required
                      minLength={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input
                      type="text"
                      value={user?.role || "user"}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className={`w-full py-2 px-4 rounded-md font-medium ${
                      isUpdatingProfile
                        ? "bg-gray-400 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isUpdatingProfile ? "Updating..." : "Update Profile"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default DashboardPage
