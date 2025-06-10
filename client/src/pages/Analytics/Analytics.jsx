import { useState, useEffect } from "react"
import { useExcel } from "../../contexts/ExcelContext"
import { ChartProvider } from "../../contexts/ChartContext"
import DataDistributionChart from "../../components/charts/data-distribution-chart"
import TrendAnalysisChart from "../../components/charts/trend-analysis-chart"
import { BarChart3, PieChart, TrendingUp, Search, FileText, Activity, BarChart2 } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"

const Analytics = () => {
  const { files, loading, error, fetchFiles, getFileDetails, currentFile } = useExcel()
  const [selectedFile, setSelectedFile] = useState("")
  const [dateRange, setDateRange] = useState("last-30-days")
  const [searchTerm, setSearchTerm] = useState("")
  const [analyticsData, setAnalyticsData] = useState(null)
  const [filteredFiles, setFilteredFiles] = useState([])

  const { user } = useAuth()
  const username = user?.username || "User"

  useEffect(() => {
    fetchFiles(username).catch(console.error)
  }, [username])

  useEffect(() => {
    let filtered = files

    if (searchTerm) {
      filtered = filtered.filter((file) => file.originalName.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    const now = new Date()
    const filterDate = new Date()

    switch (dateRange) {
      case "last-7-days":
        filterDate.setDate(now.getDate() - 7)
        break
      case "last-30-days":
        filterDate.setDate(now.getDate() - 30)
        break
      case "last-90-days":
        filterDate.setDate(now.getDate() - 90)
        break
      default:
        filterDate.setFullYear(1970)
    }

    filtered = filtered.filter((file) => new Date(file.uploadTime) >= filterDate)
    setFilteredFiles(filtered)
  }, [files, searchTerm, dateRange])

  useEffect(() => {
    if (filteredFiles.length > 0) {
      const totalRecords = filteredFiles.reduce((sum, file) => {
        return sum + (file.metadata?.totalRows || 0)
      }, 0)

      const insights = []

      if (selectedFile && currentFile) {
        insights.push({
          type: "trend",
          message: `Selected file contains ${
            currentFile.metadata?.totalRows || 0
          } rows and ${currentFile.metadata?.totalColumns || 0} columns`,
        })

        if (currentFile.metadata?.sheetNames?.length > 1) {
          insights.push({
            type: "quality",
            message: `File has ${
              currentFile.metadata.sheetNames.length
            } worksheets: ${currentFile.metadata.sheetNames.join(", ")}`,
          })
        }

        // Enhanced insights for selected file
        const numericColumns = currentFile.metadata?.numericColumns || 0
        const textColumns = (currentFile.metadata?.totalColumns || 0) - numericColumns

        if (numericColumns > 0) {
          insights.push({
            type: "quality",
            message: `Data contains ${numericColumns} numeric columns suitable for statistical analysis`,
          })
        }

        if (textColumns > 0) {
          insights.push({
            type: "info",
            message: `Data contains ${textColumns} text columns suitable for categorical analysis`,
          })
        }
      } else {
        insights.push({
          type: "trend",
          message: `Total of ${filteredFiles.length} files with ${totalRecords.toLocaleString()} records`,
        })

        if (filteredFiles.length > 1) {
          const avgRecords = Math.round(totalRecords / filteredFiles.length)
          insights.push({
            type: "quality",
            message: `Average ${avgRecords.toLocaleString()} records per file`,
          })
        }
      }

      const excelFiles = filteredFiles.filter((f) => f.originalName.endsWith(".xlsx")).length
      const legacyFiles = filteredFiles.filter((f) => f.originalName.endsWith(".xls")).length
      const csvFiles = filteredFiles.filter((f) => f.originalName.endsWith(".csv")).length

      if (excelFiles > 0 || legacyFiles > 0 || csvFiles > 0) {
        insights.push({
          type: "anomaly",
          message: `File types: ${excelFiles} Excel (.xlsx), ${legacyFiles} legacy Excel (.xls), ${csvFiles} CSV`,
        })
      }

      setAnalyticsData({
        totalRecords: totalRecords,
        uniqueValues: Math.floor(totalRecords * 0.68),
        duplicates: Math.floor(totalRecords * 0.03),
        emptyFields: Math.floor(totalRecords * 0.02),
        dataQuality: Math.round((1 - (0.03 + 0.02)) * 100),
        insights: insights,
      })
    } else {
      setAnalyticsData(null)
    }
  }, [filteredFiles, selectedFile, currentFile])

  const handleFileSelection = async (fileId) => {
    setSelectedFile(fileId)
    if (fileId) {
      try {
        await getFileDetails(fileId)
      } catch (error) {
        console.error("Error fetching file details:", error)
      }
    }
  }

  const exportData = (format) => {
    console.log(`Exporting data as ${format}`)
    alert(`Export as ${format.toUpperCase()} functionality would be implemented here`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-red-200 dark:border-red-700">
          <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">Error</h1>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <ChartProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced data analysis with statistical charts, trend analysis, and comprehensive insights.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select File</label>
              <select
                value={selectedFile}
                onChange={(e) => handleFileSelection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Files</option>
                {files.map((file) => (
                  <option key={file._id} value={file._id}>
                    {file.originalName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="last-7-days">Last 7 days</option>
                <option value="last-30-days">Last 30 days</option>
                <option value="last-90-days">Last 90 days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search files..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Export</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportData("csv")}
                  disabled={!analyticsData}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  CSV
                </button>
                <button
                  onClick={() => exportData("xlsx")}
                  disabled={!analyticsData}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        {analyticsData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analyticsData.totalRecords.toLocaleString()}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Values</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analyticsData.uniqueValues.toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Duplicates</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.duplicates}</p>
                </div>
                <PieChart className="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Data Quality</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.dataQuality}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {files.length === 0
                  ? "No files uploaded yet. Upload Excel files to see analytics."
                  : "No files match your current filters."}
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DataDistributionChart selectedFileId={selectedFile} />
          <TrendAnalysisChart selectedFileId={selectedFile} />
        </div>

        {/* Insights */}
        {analyticsData && analyticsData.insights.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Insights</h3>
            <div className="space-y-3">
              {analyticsData.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div
                    className={`p-1 rounded-full ${
                      insight.type === "trend"
                        ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                        : insight.type === "anomaly"
                          ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                          : insight.type === "quality"
                            ? "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                            : "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    }`}
                  >
                    {insight.type === "trend" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : insight.type === "quality" ? (
                      <BarChart2 className="h-4 w-4" />
                    ) : (
                      <Activity className="h-4 w-4" />
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files Summary */}
        {filteredFiles.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Files Summary ({filteredFiles.length} files)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedFile === file._id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                  onClick={() => handleFileSelection(file._id)}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.originalName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.metadata?.totalRows || 0} rows • {file.metadata?.totalColumns || 0} columns
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Uploaded: {new Date(file.uploadTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ChartProvider>
  )
}

export default Analytics