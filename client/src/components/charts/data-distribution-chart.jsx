import { useState, useEffect } from "react"
import { Settings, RefreshCw, Download, AlertTriangle, BarChart3, X, Eye, EyeOff, Database, Trash2 } from "lucide-react"
import { useChart } from "../../contexts/ChartContext"
import ChartConfigModal from "./chart-config-modal"
import ChartRenderer from "./chart-renderer"
import { useAuth } from "../../contexts/AuthContext"

const DataDistributionChart = ({ selectedFileId, className = "" }) => {
  const {
    loading,
    error,
    chartData,
    headers,
    fetchHeaders,
    generateChart,
    generateAggregateData,
    fetchDatasets,
    clearError,
    clearChartData,
  } = useChart()

  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [localChartData, setLocalChartData] = useState(null)
  const [currentConfig, setCurrentConfig] = useState(null)
  const [localLoading, setLocalLoading] = useState(false)
  const [headersLoading, setHeadersLoading] = useState(false)
  const [distributionStats, setDistributionStats] = useState(null)
  const [showStatusMessages, setShowStatusMessages] = useState(true)
  const [chartMode, setChartMode] = useState("aggregate")
  const [showDatasets, setShowDatasets] = useState(false) // NEW: Dataset visibility state

  const { user } = useAuth()
  const username = user?.username || "User"

  // NEW: User-specific dataset management
  const [userDatasets, setUserDatasets] = useState([])
  const [selectedDatasetId, setSelectedDatasetId] = useState(null)
  const [showAllDatasets, setShowAllDatasets] = useState(false)

  // NEW: Enhanced dataset name mapping
  const getDatasetDisplayName = (dataset) => {
    if (!dataset) return "Unknown Dataset"

    // Priority order for dataset name
    if (dataset.originalName) return dataset.originalName
    if (dataset.name) return dataset.name
    if (dataset.filename) return dataset.filename
    if (dataset.title) return dataset.title
    if (dataset._id) return `Dataset ${dataset._id.slice(-6)}`
    if (dataset.id) return `Dataset ${dataset.id.slice(-6)}`

    return "Unnamed Dataset"
  }

  useEffect(() => {
    if (selectedFileId) {
      console.log("EnhancedDataDistributionChart: Initializing with fileId:", selectedFileId)
      setHeadersLoading(true)
      setLocalChartData(null)
      setCurrentConfig(null)
      setDistributionStats(null)
      clearError()
      clearChartData()

      loadAvailableDatasets()

      fetchHeaders(selectedFileId)
        .then((result) => {
          console.log("Headers fetch completed:", result)

          if (result && result.length > 0) {
            const numericHeaders = result.filter((h) =>
              ["numeric", "number", "float", "integer", "decimal"].includes(h?.type || h?.dataType || "text"),
            )

            if (numericHeaders.length > 0) {
              const yAxisColumn = numericHeaders[0]?.name

              if (chartMode === "aggregate") {
                const defaultConfig = {
                  chartType: "histogram",
                  yAxis: yAxisColumn,
                  limit: 1000,
                  chartTitle: `Distribution of ${yAxisColumn}`,
                  binCount: 20,
                }
                handleGenerateChart(defaultConfig)
              } else {
                const basicConfig = {
                  chartType: "bar",
                  xAxis: result.find((h) => h.name !== yAxisColumn)?.name || result[1]?.name,
                  yAxis: yAxisColumn,
                  chartTitle: `Basic Distribution: ${yAxisColumn}`,
                  limit: 50,
                }
                handleGenerateBasicChart(basicConfig)
              }
            }
          }
        })
        .catch((err) => {
          console.error("Headers fetch failed:", err)
        })
        .finally(() => {
          setHeadersLoading(false)
        })
    } else {
      setLocalChartData(null)
      setCurrentConfig(null)
      setDistributionStats(null)
      setUserDatasets([])
      clearError()
      clearChartData()
    }
  }, [selectedFileId, chartMode])

  const loadAvailableDatasets = async () => {
    try {
      console.log("Loading datasets for user:", username)
      const datasetList = await fetchDatasets()

      // NEW: Filter datasets by current user
      const userFilteredDatasets = (datasetList || []).filter((dataset) => {
        // Check if dataset belongs to current user
        return (
          dataset.username === username ||
          dataset.userId === user?.id ||
          dataset.owner === username ||
          dataset.uploadedBy === username
        )
      })

      // Enhanced dataset processing with name mapping
      const processedDatasets = userFilteredDatasets.map((dataset) => ({
        ...dataset,
        displayName: getDatasetDisplayName(dataset),
        id: dataset._id || dataset.id,
        isSelected: dataset._id === selectedFileId || dataset.id === selectedFileId,
      }))

      setUserDatasets(processedDatasets)
      console.log(
        `User ${username} datasets loaded:`,
        processedDatasets.map((d) => d.displayName),
      )
    } catch (err) {
      console.error("Failed to load user datasets:", err)
    }
  }

  // NEW: Handle dataset selection for chart generation
  const handleDatasetSelect = (datasetId) => {
    setSelectedDatasetId(datasetId)
    setSelectedFileId(datasetId) // This should trigger chart regeneration

    // Update selected state in datasets
    setUserDatasets((prev) =>
      prev.map((dataset) => ({
        ...dataset,
        isSelected: dataset.id === datasetId,
      })),
    )

    console.log("Dataset selected for chart generation:", datasetId)
  }

  const handleGenerateBasicChart = async (config) => {
    if (!selectedFileId || !config) return

    setLocalLoading(true)
    clearError()

    try {
      console.log("Generating basic chart with generateChart():", config)
      const result = await generateChart(selectedFileId, config)

      if (result && result.success) {
        setLocalChartData(result)
        setCurrentConfig(config)
        console.log("Basic chart generated successfully:", result)
      } else {
        throw new Error(result?.error || "Failed to generate basic chart")
      }
    } catch (err) {
      console.error("Error generating basic chart:", err)
    } finally {
      setLocalLoading(false)
    }
  }

  const validateConfig = (config) => {
    const errors = []

    if (!config) {
      errors.push("Configuration is required")
      return errors
    }

    if (!headers || headers.length === 0) {
      errors.push("No column headers available")
      return errors
    }

    const headerNames = headers.map((h) => h?.name || h).filter(Boolean)

    if (chartMode === "basic") {
      if (!config.xAxis) {
        errors.push("X-axis column is required for basic charts")
      } else if (!headerNames.includes(config.xAxis)) {
        errors.push(`X-axis column "${config.xAxis}" not found`)
      }

      if (!config.yAxis) {
        errors.push("Y-axis column is required")
      } else if (!headerNames.includes(config.yAxis)) {
        errors.push(`Y-axis column "${config.yAxis}" not found`)
      }

      if (config.xAxis === config.yAxis) {
        errors.push("X-axis and Y-axis cannot be the same column")
      }
    } else {
      if (["histogram", "boxplot"].includes(config.chartType)) {
        if (!config.yAxis) {
          errors.push("Data column is required for statistical charts")
        } else if (!headerNames.includes(config.yAxis)) {
          errors.push(`Column "${config.yAxis}" not found`)
        }
      } else {
        if (!config.xAxis || !config.yAxis) {
          errors.push("Both X-axis and Y-axis columns are required")
        }
      }
    }

    return errors
  }

  const calculateDistributionStats = (data) => {
    if (!data || !Array.isArray(data)) return null

    const values = data.map((item) => item.value).filter((v) => typeof v === "number" && !isNaN(v))
    if (values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const median = sorted[Math.floor(sorted.length / 2)]
    const mode = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1
      return acc
    }, {})
    const modeValue = Object.keys(mode).reduce((a, b) => (mode[a] > mode[b] ? a : b))

    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    return {
      count: values.length,
      mean: mean.toFixed(2),
      median: median.toFixed(2),
      mode: Number.parseFloat(modeValue).toFixed(2),
      stdDev: stdDev.toFixed(2),
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
      range: (Math.max(...values) - Math.min(...values)).toFixed(2),
    }
  }

  const handleGenerateChart = async (config) => {
    if (!selectedFileId) {
      console.error("No file selected")
      return
    }

    const validationErrors = validateConfig(config)
    if (validationErrors.length > 0) {
      console.error("Validation failed:", validationErrors)
      return
    }

    if (chartMode === "basic") {
      await handleGenerateBasicChart(config)
      return
    }

    // Original aggregate logic
    setLocalLoading(true)
    clearError()

    try {
      let requestConfig

      if (["histogram", "boxplot"].includes(config.chartType)) {
        requestConfig = {
          column: config.yAxis,
          chartType: config.chartType,
          binCount: config.binCount || 20,
          limit: config.limit || 1000,
        }
      } else {
        requestConfig = {
          groupBy: config.xAxis,
          aggregateField: config.yAxis,
          aggregateFunction: config.aggregateFunction || "sum",
          limit: config.limit || 100,
        }
      }

      console.log("Making aggregate API request with config:", requestConfig)
      const result = await generateAggregateData(selectedFileId, requestConfig)

      if (result && result.success && result.data && Array.isArray(result.data)) {
        if (result.data.length === 0) {
          throw new Error("No data returned for the selected configuration")
        }

        // NEW: Enhanced data processing with dataset name mapping
        const chartResult = {
          data: {
            labels: result.data.map((item) => {
              const label = item.label || item.name || "Unknown"
              return getDatasetDisplayName({ name: label, originalName: label }) || label
            }),
            datasets: [
              {
                data: result.data.map((item) => item.value || 0),
                backgroundColor: generateColors(result.data.length),
              },
            ],
          },
          chartType: config.chartType,
          xAxis: config.xAxis,
          yAxis: config.yAxis,
          title: config.chartTitle || `${config.yAxis} Distribution`,
        }

        setLocalChartData(chartResult)
        setCurrentConfig(config)
        setDistributionStats(calculateDistributionStats(result.data))
      } else {
        throw new Error("Invalid response format from server")
      }
    } catch (err) {
      console.error("Error generating distribution chart:", err)
    } finally {
      setLocalLoading(false)
    }
  }

  const handleRefresh = () => {
    if (currentConfig && selectedFileId) {
      console.log("Refreshing chart")
      handleGenerateChart(currentConfig)
    }
    loadAvailableDatasets()
  }

  const handleClearAll = () => {
    clearError()
    clearChartData()
    setLocalChartData(null)
    setCurrentConfig(null)
    setDistributionStats(null)
  }

  const handleExport = () => {
    if (!localChartData) return

    try {
      const exportData = {
        chartData: localChartData.data.labels.map((label, index) => ({
          [localChartData.xAxis || "Category"]: getDatasetDisplayName({ name: label }) || label,
          [localChartData.yAxis || "Value"]: localChartData.data.datasets[0].data[index],
        })),
        distributionStats,
        datasets: userDatasets.map((d) => ({ id: d.id, name: d.displayName })), // NEW: Include dataset names
        chartMode,
        globalChartData: chartData,
      }

      const csvContent = [
        "# Enhanced Data Distribution Chart Export",
        `# User: ${username}`,
        `# Chart Mode: ${chartMode}`,
        `# Available User Datasets: ${userDatasets.length}`,
        `# Global Loading State: ${loading}`,
        "",
        "# User Dataset Names",
        "ID,Name,Upload Date",
        ...userDatasets.map((d) => `${d.id},"${d.displayName}","${d.uploadTime || "Unknown"}"`),
        "",
        "# Chart Data",
        Object.keys(exportData.chartData[0] || {}).join(","),
        ...exportData.chartData.map((row) => Object.values(row).join(",")),
      ]

      if (distributionStats) {
        csvContent.push(
          "",
          "# Distribution Statistics",
          "Statistic,Value",
          `Count,${distributionStats.count}`,
          `Mean,${distributionStats.mean}`,
          `Median,${distributionStats.median}`,
          `Mode,${distributionStats.mode}`,
          `Standard Deviation,${distributionStats.stdDev}`,
          `Minimum,${distributionStats.min}`,
          `Maximum,${distributionStats.max}`,
          `Range,${distributionStats.range}`,
        )
      }

      const blob = new Blob([csvContent.join("\n")], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `enhanced-data-distribution-${Date.now()}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error exporting data:", err)
    }
  }

  const generateColors = (count) => {
    const colors = []
    for (let i = 0; i < count; i++) {
      const hue = (i * 137.5) % 360
      colors.push(`hsl(${hue}, 70%, 50%)`)
    }
    return colors
  }

  const handleConfigOpen = () => {
    if (!selectedFileId) {
      alert("Please select a file first")
      return
    }
    if (headersLoading) {
      alert("Headers are still loading. Please wait a moment and try again.")
      return
    }
    if (headers.length === 0) {
      alert("No headers found. Please check if the file contains valid data.")
      return
    }
    setIsConfigOpen(true)
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enhanced Data Distribution Analysis</h3>
        <div className="flex space-x-2">
          {/* Chart Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
            <button
              onClick={() => setChartMode("aggregate")}
              className={`px-2 py-1 text-xs rounded ${
                chartMode === "aggregate"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800"
              }`}
            >
              Aggregate
            </button>
            <button
              onClick={() => setChartMode("basic")}
              className={`px-2 py-1 text-xs rounded ${
                chartMode === "basic"
                  ? "bg-green-500 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800"
              }`}
            >
              Basic
            </button>
          </div>

          <button
            onClick={() => setShowStatusMessages(!showStatusMessages)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            title={showStatusMessages ? "Hide Status Messages" : "Show Status Messages"}
          >
            {showStatusMessages ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>

          {/* Dataset Toggle */}
          <button
            onClick={() => setShowDatasets(!showDatasets)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            title="Toggle Datasets"
          >
            <Database className="h-4 w-4" />
          </button>

          {localChartData && (
            <>
              <button
                onClick={handleRefresh}
                disabled={localLoading || loading}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                title="Refresh Chart"
              >
                <RefreshCw className={`h-4 w-4 ${localLoading || loading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={handleClearAll}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                title="Clear All Data"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <button
                onClick={handleExport}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                title="Export Data"
              >
                <Download className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={handleConfigOpen}
            disabled={!selectedFileId || localLoading || headersLoading || loading}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
            title="Configure Chart"
          >
            <Settings className={`h-4 w-4 ${headersLoading || loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* NEW: Enhanced User Dataset Display with Selection */}
      {showDatasets && userDatasets.length > 0 && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Your Datasets ({userDatasets.length})
            </h4>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAllDatasets(!showAllDatasets)}
                className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-700"
              >
                {showAllDatasets ? "Show Less" : "Show All"}
              </button>
              <button
                onClick={loadAvailableDatasets}
                className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-700"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {(showAllDatasets ? userDatasets : userDatasets.slice(0, 6)).map((dataset, index) => (
              <div
                key={dataset.id || index}
                onClick={() => handleDatasetSelect(dataset.id)}
                className={`text-xs p-3 rounded cursor-pointer transition-all duration-200 flex flex-col ${
                  dataset.isSelected
                    ? "bg-purple-200 dark:bg-purple-700 border-2 border-purple-400 dark:border-purple-500"
                    : "bg-purple-100 dark:bg-purple-800 border border-purple-200 dark:border-purple-600 hover:bg-purple-150 dark:hover:bg-purple-750"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium truncate text-purple-700 dark:text-purple-300">
                    {dataset.displayName}
                  </span>
                  {dataset.isSelected && (
                    <span className="text-purple-600 dark:text-purple-400 text-[10px] bg-purple-300 dark:bg-purple-600 px-1 rounded">
                      SELECTED
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {dataset.id && (
                    <span className="text-purple-500 dark:text-purple-400 text-[10px] block">
                      ID: {dataset.id.slice(-8)}
                    </span>
                  )}
                  {dataset.uploadTime && (
                    <span className="text-purple-500 dark:text-purple-400 text-[10px] block">
                      Uploaded: {new Date(dataset.uploadTime).toLocaleDateString()}
                    </span>
                  )}
                  {dataset.metadata?.totalRows && (
                    <span className="text-purple-500 dark:text-purple-400 text-[10px] block">
                      Rows: {dataset.metadata.totalRows.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!showAllDatasets && userDatasets.length > 6 && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setShowAllDatasets(true)}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 underline"
              >
                Show {userDatasets.length - 6} more datasets
              </button>
            </div>
          )}

          {selectedDatasetId && (
            <div className="mt-3 p-2 bg-purple-200 dark:bg-purple-700 rounded text-xs">
              <span className="text-purple-700 dark:text-purple-300 font-medium">Selected for chart generation:</span>
              <span className="text-purple-600 dark:text-purple-400 ml-1">
                {userDatasets.find((d) => d.id === selectedDatasetId)?.displayName || "Unknown"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* NEW: Empty state for no user datasets */}
      {showDatasets && userDatasets.length === 0 && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-md text-center">
          <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">No datasets found for user: {username}</p>
          <button
            onClick={loadAvailableDatasets}
            className="mt-2 text-xs px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            Refresh Datasets
          </button>
        </div>
      )}

      {/* Enhanced Status Messages */}
      {showStatusMessages && (
        <div className="space-y-2 mb-4">
          {loading && (
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
              <div className="flex items-center justify-between">
                <p className="text-xs text-orange-600 dark:text-orange-400">Global loading state active...</p>
                <button onClick={() => setShowStatusMessages(false)} className="text-orange-400 hover:text-orange-600">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                Chart Mode: {chartMode} | Method:{" "}
                {chartMode === "basic" ? "generateChart()" : "generateAggregateData()"} | Your Datasets:{" "}
                {userDatasets.length}
              </p>
              <button onClick={() => setShowStatusMessages(false)} className="text-indigo-400 hover:text-indigo-600">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {selectedFileId && headersLoading && (
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-center justify-between">
                <p className="text-xs text-blue-600 dark:text-blue-400">Loading column headers...</p>
                <button onClick={() => setShowStatusMessages(false)} className="text-blue-400 hover:text-blue-600">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {selectedFileId && !headersLoading && headers.length > 0 && (
            <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center justify-between">
                <p className="text-xs text-green-600 dark:text-green-400">
                  Found {headers.length} columns | Datasets: {userDatasets.length} | Global Chart Data:{" "}
                  {chartData ? "Available" : "None"}
                </p>
                <button onClick={() => setShowStatusMessages(false)} className="text-green-400 hover:text-green-600">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">
                Failed to generate {chartMode} chart
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-line">{error}</p>
              <button onClick={clearError} className="mt-2 text-xs text-red-500 hover:text-red-700 underline">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-80 mb-4">
        {localLoading || loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading {chartMode} chart data using{" "}
              {chartMode === "basic" ? "generateChart()" : "generateAggregateData()"}...
            </p>
          </div>
        ) : localChartData ? (
          <ChartRenderer
            chartData={localChartData}
            chartType={currentConfig?.chartType || "bar"}
            title={localChartData.title}
            datasets={userDatasets} // NEW: Pass datasets for name mapping
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">
              {selectedFileId
                ? headers.length > 0
                  ? `Click settings to configure ${chartMode} chart generation`
                  : headersLoading
                    ? "Loading headers..."
                    : "No headers available"
                : "Select a file to view enhanced data distribution analysis"}
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Distribution Statistics */}
      {distributionStats && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Distribution Statistics ({chartMode} mode)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-auto min-h-[80px] flex flex-col">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">Count</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{distributionStats.count}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-auto min-h-[80px] flex flex-col">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">Mean</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{distributionStats.mean}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-auto min-h-[80px] flex flex-col">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">Median</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{distributionStats.median}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-auto min-h-[80px] flex flex-col">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">Std Dev</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{distributionStats.stdDev}</p>
            </div>
          </div>
        </div>
      )}

      <ChartConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onGenerate={handleGenerateChart}
        headers={headers}
        datasets={userDatasets} // NEW: Pass datasets for name mapping
        title={`Configure ${chartMode === "basic" ? "Basic" : "Aggregate"} Data Distribution Chart`}
        allowedTypes={
          chartMode === "basic"
            ? ["bar", "line", "area", "scatter"]
            : ["histogram", "boxplot", "bar", "pie", "doughnut", "scatter"]
        }
      />
    </div>
  )
}

export default DataDistributionChart
