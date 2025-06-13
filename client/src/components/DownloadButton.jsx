"use client"

import { useState, useRef, useEffect } from "react"
import { Download, ChevronDown } from "lucide-react"
import { useChartDownload } from "../contexts/ChartDownloadContext"
import { useChartHistory } from "../contexts/ChartHistoryContext"

const DownloadButton = ({ chartRef, chartData, chartType, title, fileId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { downloadChartImage, loading } = useChartDownload()
  const { saveChartHistory } = useChartHistory()
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleDownload = async (format) => {
    if (!chartRef?.current) {
      console.error("Chart reference is not available")
      return
    }

    try {
      // Create a simplified chart config without DOM references or circular structures
      const chartConfig = {
        format,
        title: title || `${chartType}-chart`,
      }

      // Download the chart as image
      await downloadChartImage(
        { domElement: chartRef.current },
        {
          format,
          title: title || `${chartType}-chart`,
          width: chartRef.current.offsetWidth * 2, // Higher resolution
          height: chartRef.current.offsetHeight * 2,
          quality: 0.95,
        },
      )

      // Only try to save to history if fileId is provided
      if (fileId) {
        try {
          // Create a simplified version of chart data for history
          const historyData = {
            chartType,
            title: title || `${chartType} Chart`,
            format,
            downloadedAt: new Date().toISOString(),
          }

          await saveChartHistory(fileId, historyData)
        } catch (historyError) {
          // Log but don't fail the download if history saving fails
          console.warn("Failed to save to history, but download succeeded:", historyError)
        }
      }

      setIsOpen(false)
    } catch (error) {
      console.error(`Failed to download chart as ${format}:`, error)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading || !chartRef?.current}
        className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
        title="Download chart"
      >
        <Download size={14} />
        <span className="hidden sm:inline">Download</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
          <div className="p-1">
            <button
              onClick={() => handleDownload("png")}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Download as PNG
            </button>
            <button
              onClick={() => handleDownload("jpeg")}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Download as JPEG
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DownloadButton
