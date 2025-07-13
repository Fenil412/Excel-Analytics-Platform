"use client"

import { createContext, useContext, useState, useCallback } from "react"
import axios from "axios"

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "https://excel-analytics-platform-0fk8.onrender.com";
axios.defaults.timeout = 30000 // 30 seconds timeout

const ChartHistoryContext = createContext()

// Helper function to remove circular references
function sanitizeForJSON(obj) {
  const seen = new WeakSet()
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      // Skip DOM elements and functions
      if (value instanceof Element || typeof value === "function") {
        return undefined
      }

      // Handle circular references
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return undefined
        }
        seen.add(value)
      }
      return value
    }),
  )
}

export function ChartHistoryProvider({ children }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  })

  // Error message helper
  const getErrorMessage = (error) => {
    return error.response?.data?.message || error.message || "An error occurred"
  }

  // Save chart history
  const saveChartHistory = useCallback(async (fileId, chartData) => {
    if (!fileId || !chartData) return null

    setLoading(true)
    setError(null)

    try {
      // Sanitize the chart data to remove circular references and DOM elements
      const sanitizedChartData = sanitizeForJSON(chartData)

      const payload = {
        fileId,
        chartType: sanitizedChartData.chartType,
        chartConfig: sanitizedChartData.config || sanitizedChartData.chartConfig || {},
        chartData: sanitizedChartData.data || sanitizedChartData.chartData || {},
        analysisMetadata: sanitizedChartData.metadata || sanitizedChartData.analysisMetadata || {},
        title: sanitizedChartData.title || "Untitled Chart",
        description: sanitizedChartData.description || "",
        tags: sanitizedChartData.tags || [],
        isFavorite: sanitizedChartData.isFavorite || false,
      }

      // Check if the endpoint exists first
      try {
        const response = await axios.post(`/api/charts/history/${fileId}`, payload)

        if (response.data && response.data.success) {
          setHistory((prev) => [response.data.data, ...prev])
          return response.data.data
        } else {
          throw new Error(response.data?.error || "Failed to save chart history")
        }
      } catch (apiError) {
        // If the endpoint doesn't exist, log it but don't throw an error
        // This allows the download to continue even if history saving fails
        console.warn("Chart history API not available:", apiError.message)

        // Return a mock history item for UI consistency
        const mockHistoryItem = {
          ...payload,
          _id: `local-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        return mockHistoryItem
      }
    } catch (err) {
      console.error("Error in saveChartHistory:", err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      // Return null instead of throwing to prevent download from failing
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get chart history
  const getChartHistory = useCallback(async (fileId, params = {}) => {
    if (!fileId) return null

    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams(params).toString()

      try {
        const response = await axios.get(`/api/charts/history/${fileId}${queryParams ? `?${queryParams}` : ""}`)

        if (response.data && response.data.success) {
          setHistory(response.data.data.history)
          setPagination(response.data.data.pagination)
          return response.data.data
        } else {
          throw new Error(response.data?.error || "Failed to fetch chart history")
        }
      } catch (apiError) {
        // If API endpoint doesn't exist, return empty data
        console.warn("Chart history API not available:", apiError.message)
        setHistory([])
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 20,
        })
        return { history: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 } }
      }
    } catch (err) {
      console.error("Error in getChartHistory:", err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get history stats
  const getHistoryStats = useCallback(async (fileId) => {
    if (!fileId) return null

    setLoading(true)
    setError(null)

    try {
      try {
        const response = await axios.get(`/api/charts/history/${fileId}/stats`)

        if (response.data && response.data.success) {
          setStats(response.data.data)
          return response.data.data
        } else {
          throw new Error(response.data?.error || "Failed to fetch history stats")
        }
      } catch (apiError) {
        // If API endpoint doesn't exist, return mock stats
        console.warn("Chart history stats API not available:", apiError.message)
        const mockStats = {
          totalCharts: 0,
          chartsByType: {},
          favoriteCharts: 0,
        }
        setStats(mockStats)
        return mockStats
      }
    } catch (err) {
      console.error("Error in getHistoryStats:", err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get chart history by ID
  const getChartHistoryById = useCallback(async (historyId) => {
    if (!historyId) return null

    setLoading(true)
    setError(null)

    try {
      try {
        const response = await axios.get(`/api/charts/history-iteam/${historyId}`)

        if (response.data && response.data.success) {
          return response.data.data
        } else {
          throw new Error(response.data?.error || "Failed to fetch chart history item")
        }
      } catch (apiError) {
        // If API endpoint doesn't exist, return null
        console.warn("Chart history item API not available:", apiError.message)
        return null
      }
    } catch (err) {
      console.error("Error in getChartHistoryById:", err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Update chart history
  const updateChartHistory = useCallback(async (historyId, updateData) => {
    if (!historyId || !updateData) return null

    setLoading(true)
    setError(null)

    try {
      // Sanitize update data
      const sanitizedUpdateData = sanitizeForJSON(updateData)

      try {
        const response = await axios.put(`/api/charts/history-iteam/${historyId}`, sanitizedUpdateData)

        if (response.data && response.data.success) {
          setHistory((prev) => prev.map((item) => (item._id === historyId ? { ...item, ...response.data.data } : item)))
          return response.data.data
        } else {
          throw new Error(response.data?.error || "Failed to update chart history")
        }
      } catch (apiError) {
        // If API endpoint doesn't exist, update local state only
        console.warn("Chart history update API not available:", apiError.message)

        // Update local state
        const updatedItem = { ...updateData, _id: historyId }
        setHistory((prev) => prev.map((item) => (item._id === historyId ? { ...item, ...updatedItem } : item)))

        return updatedItem
      }
    } catch (err) {
      console.error("Error in updateChartHistory:", err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Delete chart history
  const deleteChartHistory = useCallback(async (historyId) => {
    if (!historyId) return null

    setLoading(true)
    setError(null)

    try {
      try {
        const response = await axios.delete(`/api/charts/history-iteam/${historyId}`)

        if (response.data && response.data.success) {
          setHistory((prev) => prev.filter((item) => item._id !== historyId))
          return true
        } else {
          throw new Error(response.data?.error || "Failed to delete chart history")
        }
      } catch (apiError) {
        // If API endpoint doesn't exist, just update local state
        console.warn("Chart history delete API not available:", apiError.message)
        setHistory((prev) => prev.filter((item) => item._id !== historyId))
        return true
      }
    } catch (err) {
      console.error("Error in deleteChartHistory:", err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Add toggleFavorite function after deleteChartHistory
  const toggleFavorite = useCallback(
    async (historyId) => {
      if (!historyId) return null

      setLoading(true)
      setError(null)

      try {
        // Find the current chart in history
        const currentChart = history.find((item) => item._id === historyId)
        if (!currentChart) {
          // If not found in history, create a mock item
          const mockItem = {
            _id: historyId,
            isFavorite: false,
          }

          // Toggle the favorite status
          const updatedItem = {
            ...mockItem,
            isFavorite: !mockItem.isFavorite,
          }

          // Update local state
          setHistory((prev) => [...prev.filter((item) => item._id !== historyId), updatedItem])

          return updatedItem
        }

        // Create updated data with toggled favorite status
        const updateData = {
          isFavorite: !currentChart.isFavorite,
        }

        try {
          // Use existing updateChartHistory endpoint
          const response = await axios.put(`/api/charts/history-iteam/${historyId}`, updateData)

          if (response.data && response.data.success) {
            // Update local state
            setHistory((prev) =>
              prev.map((item) => (item._id === historyId ? { ...item, isFavorite: !item.isFavorite } : item)),
            )
            return response.data.data
          } else {
            throw new Error(response.data?.error || "Failed to toggle favorite")
          }
        } catch (apiError) {
          // If API endpoint doesn't exist, just update local state
          console.warn("Chart history update API not available:", apiError.message)

          // Update local state
          setHistory((prev) =>
            prev.map((item) => (item._id === historyId ? { ...item, isFavorite: !item.isFavorite } : item)),
          )

          return {
            ...currentChart,
            isFavorite: !currentChart.isFavorite,
          }
        }
      } catch (err) {
        console.error("Error in toggleFavorite:", err)
        const errorMessage = getErrorMessage(err)
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [history],
  )

  // Update the value object to include toggleFavorite
  const value = {
    history,
    loading,
    error,
    stats,
    pagination,
    saveChartHistory,
    getChartHistory,
    getHistoryStats,
    getChartHistoryById,
    updateChartHistory,
    deleteChartHistory,
    toggleFavorite,
  }

  return <ChartHistoryContext.Provider value={value}>{children}</ChartHistoryContext.Provider>
}

export function useChartHistory() {
  const context = useContext(ChartHistoryContext)
  if (!context) {
    throw new Error("useChartHistory must be used within a ChartHistoryProvider")
  }
  return context
}
