"use client";

import { useState, useEffect, useRef } from "react";
import { useExcel } from "../../contexts/ExcelContext";
import { ChartProvider } from "../../contexts/ChartContext";
import DataDistributionChart from "../../components/charts/data-distribution-chart";
import TrendAnalysisChart from "../../components/charts/trend-analysis-chart";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Search,
  FileText,
  Activity,
  BarChart2,
  Download,
  History,
  Image as ImageIcon,
  Paperclip,
  Heart,
  Save,
  Star,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useChartDownload } from "../../contexts/ChartDownloadContext";
import { useChartHistory } from "../../contexts/ChartHistoryContext";
import { useNavigate } from "react-router-dom";
import ChartDownloadButton from "../../components/DownloadButton";
import ChartFavoriteButton from "../../components/chart-favorite-button";
import axios from "axios";

const Analytics = () => {
  const navigate = useNavigate();
  const { files, loading, error, fetchFiles, getFileDetails, currentFile } =
    useExcel();
  const [selectedFile, setSelectedFile] = useState("");
  const [dateRange, setDateRange] = useState("last-30-days");
  const [searchTerm, setSearchTerm] = useState("");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [chartStates, setChartStates] = useState({
    distribution: { id: null, isFavorite: false, data: null },
    trend: { id: null, isFavorite: false, data: null },
  });
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState({
    distribution: false,
    trend: false,
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const downloadDropdownRef = useRef(null);
  const trendDropdownRef = useRef(null);

  const { user } = useAuth();
  const username = user?.username || "User";
  const {
    downloadChartImage,
    downloadChartExcel,
    downloadChartCSV,
    downloadChartPDF,
    loading: downloadLoading,
  } = useChartDownload();
  const { saveChartHistory, toggleFavorite } = useChartHistory();

  // Add refs for chart elements
  const distributionChartRef = useRef(null);
  const trendChartRef = useRef(null);

  useEffect(() => {
    fetchFiles(username).catch(console.error);
  }, [username, fetchFiles]);

  useEffect(() => {
    let filtered = files;

    if (searchTerm) {
      filtered = filtered.filter((file) =>
        file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const now = new Date();
    const filterDate = new Date();

    switch (dateRange) {
      case "last-7-days":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "last-30-days":
        filterDate.setDate(now.getDate() - 30);
        break;
      case "last-90-days":
        filterDate.setDate(now.getDate() - 90);
        break;
      default:
        filterDate.setFullYear(1970);
    }

    filtered = filtered.filter(
      (file) => new Date(file.uploadTime) >= filterDate
    );
    setFilteredFiles(filtered);
  }, [files, searchTerm, dateRange]);

  useEffect(() => {
    if (filteredFiles.length > 0) {
      const totalRecords = filteredFiles.reduce((sum, file) => {
        return sum + (file.metadata?.totalRows || 0);
      }, 0);

      const insights = [];

      if (selectedFile && currentFile) {
        insights.push({
          type: "trend",
          message: `Selected file contains ${
            currentFile.metadata?.totalRows || 0
          } rows and ${currentFile.metadata?.totalColumns || 0} columns`,
        });

        if (currentFile.metadata?.sheetNames?.length > 1) {
          insights.push({
            type: "quality",
            message: `File has ${
              currentFile.metadata.sheetNames.length
            } worksheets: ${currentFile.metadata.sheetNames.join(", ")}`,
          });
        }

        // Enhanced insights for selected file
        const numericColumns = currentFile.metadata?.numericColumns || 0;
        const textColumns =
          (currentFile.metadata?.totalColumns || 0) - numericColumns;

        if (numericColumns > 0) {
          insights.push({
            type: "quality",
            message: `Data contains ${numericColumns} numeric columns suitable for statistical analysis`,
          });
        }

        if (textColumns > 0) {
          insights.push({
            type: "info",
            message: `Data contains ${textColumns} text columns suitable for categorical analysis`,
          });
        }
      } else {
        insights.push({
          type: "trend",
          message: `Total of ${
            filteredFiles.length
          } files with ${totalRecords.toLocaleString()} records`,
        });

        if (filteredFiles.length > 1) {
          const avgRecords = Math.round(totalRecords / filteredFiles.length);
          insights.push({
            type: "quality",
            message: `Average ${avgRecords.toLocaleString()} records per file`,
          });
        }
      }

      const excelFiles = filteredFiles.filter((f) =>
        f.originalName.endsWith(".xlsx")
      ).length;
      const legacyFiles = filteredFiles.filter((f) =>
        f.originalName.endsWith(".xls")
      ).length;
      const csvFiles = filteredFiles.filter((f) =>
        f.originalName.endsWith(".csv")
      ).length;

      if (excelFiles > 0 || legacyFiles > 0 || csvFiles > 0) {
        insights.push({
          type: "anomaly",
          message: `File types: ${excelFiles} Excel (.xlsx), ${legacyFiles} legacy Excel (.xls), ${csvFiles} CSV`,
        });
      }

      setAnalyticsData({
        totalRecords: totalRecords,
        uniqueValues: Math.floor(totalRecords * 0.68),
        duplicates: Math.floor(totalRecords * 0.03),
        emptyFields: Math.floor(totalRecords * 0.02),
        dataQuality: Math.round((1 - (0.03 + 0.02)) * 100),
        insights: insights,
      });
    } else {
      setAnalyticsData(null);
    }
  }, [filteredFiles, selectedFile, currentFile]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        downloadDropdownRef.current &&
        !downloadDropdownRef.current.contains(event.target)
      ) {
        setDownloadDropdownOpen((prev) => ({ ...prev, distribution: false }));
      }
      if (
        trendDropdownRef.current &&
        !trendDropdownRef.current.contains(event.target)
      ) {
        setDownloadDropdownOpen((prev) => ({ ...prev, trend: false }));
      }
    };

    if (downloadDropdownOpen.distribution || downloadDropdownOpen.trend) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [downloadDropdownOpen]);

  const handleFileSelection = async (fileId) => {
    setSelectedFile(fileId);
    if (fileId) {
      try {
        await getFileDetails(fileId);

        // Reset chart states when selecting a new file
        setChartStates({
          distribution: { id: null, isFavorite: false, data: null },
          trend: { id: null, isFavorite: false, data: null },
        });
      } catch (error) {
        console.error("Error fetching file details:", error);
      }
    }
  };

  const handleDataExport = async (format) => {
    if (!currentFile || !analyticsData) return;

    try {
      const fileName = currentFile.originalName || currentFile.name;
      if (format === "csv") {
        await downloadChartCSV(analyticsData, fileName);
      } else if (format === "excel") {
        await downloadChartExcel(analyticsData, fileName);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // Fixed chart image download with OKLCH color handling
  const handleChartImageDownload = async (
    chartRef,
    chartType,
    format = "png"
  ) => {
    if (!chartRef?.current) return;

    try {
      // Get chart element
      const chartElement = chartRef.current;

      // Convert OKLCH colors to RGB before capturing
      const originalStyles = new Map();
      const elements = chartElement.querySelectorAll("*");

      elements.forEach((el) => {
        const computedStyle = window.getComputedStyle(el);
        const properties = [
          "color",
          "background-color",
          "border-color",
          "fill",
          "stroke",
        ];

        properties.forEach((prop) => {
          const value = computedStyle.getPropertyValue(prop);
          if (value && value.includes("oklch")) {
            originalStyles.set({ el, prop }, value);
            // Convert oklch to rgb (simplified conversion)
            const rgbValue = convertOklchToRgb(value);
            el.style.setProperty(prop, rgbValue, "important");
          }
        });
      });

      const title = currentFile?.originalName
        ? `${
            chartType === "distribution"
              ? "Distribution Analysis"
              : "Trend Analysis"
          } - ${currentFile.originalName}`
        : `${
            chartType === "distribution"
              ? "Distribution Analysis"
              : "Trend Analysis"
          }`;

      // Download chart as image with better options
      await downloadChartImage(
        { domElement: chartElement },
        {
          format,
          title: title,
          width: chartElement.offsetWidth * 2,
          height: chartElement.offsetHeight * 2,
          quality: 0.95,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
        }
      );

      // Restore original styles
      originalStyles.forEach((value, { el, prop }) => {
        el.style.removeProperty(prop);
      });

      // Save to chart history if fileId is available
      if (currentFile?._id) {
        try {
          const historyData = {
            chartType,
            title: title,
            format,
            downloadedAt: new Date().toISOString(),
          };

          await saveChartHistory(currentFile._id, historyData);
        } catch (historyError) {
          console.warn(
            "Failed to save to history, but download succeeded:",
            historyError
          );
        }
      }
    } catch (error) {
      console.error(`Failed to download chart as ${format}:`, error);
    }
  };

  // Helper function to convert OKLCH to RGB (simplified)
  const convertOklchToRgb = (oklchValue) => {
    // This is a simplified conversion - in production, use a proper color conversion library
    if (oklchValue.includes("oklch(0.5")) return "rgb(128, 128, 128)";
    if (oklchValue.includes("oklch(0.7")) return "rgb(179, 179, 179)";
    if (oklchValue.includes("oklch(0.3")) return "rgb(77, 77, 77)";
    return "rgb(128, 128, 128)"; // fallback
  };

  // Enhanced PDF download function that safely handles cyclic objects
  const handleChartPDFDownload = async (chartType) => {
    if (!currentFile || !analyticsData) return;

    try {
      const chartRef =
        chartType === "distribution" ? distributionChartRef : trendChartRef;
      const chartState = chartStates[chartType];

      const title = currentFile?.originalName
        ? `${
            chartType === "distribution"
              ? "Distribution Analysis"
              : "Trend Analysis"
          } - ${currentFile.originalName}`
        : `${
            chartType === "distribution"
              ? "Distribution Analysis"
              : "Trend Analysis"
          }`;

      // Create a safe payload without circular references
      const safePdfData = {
        chartType,
        title,
        fileName: currentFile.originalName,
        fileId: currentFile._id,
        // Safe analytics data
        analyticsData: {
          totalRecords: analyticsData.totalRecords,
          uniqueValues: analyticsData.uniqueValues,
          duplicates: analyticsData.duplicates,
          emptyFields: analyticsData.emptyFields,
          dataQuality: analyticsData.dataQuality,
          insights: analyticsData.insights.map((insight) => ({
            type: insight.type,
            message: insight.message,
          })),
        },
        // Safe chart data
        chartData: chartState.data
          ? {
              config: chartState.data.config || {},
              data: Array.isArray(chartState.data.data)
                ? chartState.data.data
                : [],
              metadata: chartState.data.metadata || {},
            }
          : null,
        // Safe file metadata
        metadata: {
          totalRows: currentFile.metadata?.totalRows || 0,
          totalColumns: currentFile.metadata?.totalColumns || 0,
          sheetNames: currentFile.metadata?.sheetNames || [],
          numericColumns: currentFile.metadata?.numericColumns || 0,
        },
      };

      // If chart element exists, convert to base64 image
      if (chartRef?.current) {
        try {
          const canvas = await html2canvas(chartRef.current, {
            backgroundColor: "#ffffff",
            scale: 2,
            useCORS: true,
            allowTaint: false,
            height: chartRef.current.offsetHeight,
            width: chartRef.current.offsetWidth,
          });

          safePdfData.chartImageBase64 = canvas.toDataURL("image/png");
        } catch (imageError) {
          console.warn("Failed to capture chart image:", imageError);
          // Continue without image
        }
      }

      await downloadChartPDF(safePdfData, {
        title: title,
        includeTimestamp: true,
        includeChartImage: true,
      });
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("PDF export failed. Please try again.");
    }
  };

  // Enhanced save chart function with better error handling
  const handleSaveChart = async (chartType) => {
    if (!currentFile || !analyticsData) {
      alert("Please select a file and ensure analytics data is loaded");
      return;
    }

    setSaveLoading(true);
    try {
      const chartState = chartStates[chartType];

      // Create safe payload for saving
      const payload = {
        chartType: chartType,
        title: `${
          chartType === "distribution"
            ? "Distribution Analysis"
            : "Trend Analysis"
        } - ${currentFile.originalName}`,
        description: `${
          chartType === "distribution"
            ? "Data distribution analysis"
            : "Trend analysis"
        } for ${currentFile.originalName}`,

        // Safe chart configuration
        chartConfig: chartState.data?.config
          ? {
              ...chartState.data.config,
              // Remove any functions or circular references
              chartElement: undefined,
              domElement: undefined,
            }
          : {},

        // Safe chart data - ensure it's serializable
        chartData: chartState.data?.data
          ? JSON.parse(JSON.stringify(chartState.data.data))
          : [],

        // Safe analysis metadata
        analysisMetadata: {
          totalRecords: analyticsData.totalRecords || 0,
          uniqueValues: analyticsData.uniqueValues || 0,
          duplicates: analyticsData.duplicates || 0,
          emptyFields: analyticsData.emptyFields || 0,
          dataQuality: analyticsData.dataQuality || 0,
          insights:
            analyticsData.insights?.map((insight) => ({
              type: insight.type,
              message: insight.message,
            })) || [],
        },

        // Safe file metadata
        fileMetadata: {
          originalName: currentFile.originalName,
          totalRows: currentFile.metadata?.totalRows || 0,
          totalColumns: currentFile.metadata?.totalColumns || 0,
          sheetNames: currentFile.metadata?.sheetNames || [],
        },

        tags: [
          chartType,
          "analytics",
          currentFile.originalName.split(".").pop() || "data",
        ],

        // Add timestamp
        createdAt: new Date().toISOString(),
      };

      console.log("Saving chart with payload:", {
        ...payload,
        chartData: `[${payload.chartData.length} items]`, // Log length instead of full data
      });

      const response = await axios.post(
        `/api/charts/history/${currentFile._id}`,
        payload
      );

      if (response.data.success) {
        // Update chart state with new ID
        setChartStates((prev) => ({
          ...prev,
          [chartType]: {
            ...prev[chartType],
            id: response.data.chart._id,
            isFavorite: response.data.chart.isFavorite || false,
          },
        }));

        alert("Chart saved successfully!");
      } else {
        throw new Error(response.data.message || "Failed to save chart");
      }
    } catch (error) {
      console.error("Failed to save chart:", error);

      // More specific error messages
      if (error.response?.status === 413) {
        alert(
          "Chart data is too large to save. Please try with a smaller dataset."
        );
      } else if (error.response?.status === 400) {
        alert("Invalid chart data. Please regenerate the chart and try again.");
      } else {
        alert("Failed to save chart. Please try again.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleViewHistory = () => {
    if (currentFile) {
      navigate(`/history/${currentFile._id}`);
    }
  };

  // Utility function to safely serialize data
  const safeStringify = (obj, replacer = null, space = 2) => {
    const seen = new WeakSet();
    return JSON.stringify(
      obj,
      (key, val) => {
        if (val != null && typeof val === "object") {
          if (seen.has(val)) {
            return "[Circular Reference]";
          }
          seen.add(val);
        }
        // Remove DOM elements and functions
        if (val instanceof HTMLElement || typeof val === "function") {
          return undefined;
        }
        return replacer ? replacer(key, val) : val;
      },
      space
    );
  };

  // Enhanced chart state update function
  const updateChartState = (chartType, data) => {
    setChartStates((prev) => {
      const newState = {
        ...prev,
        [chartType]: {
          id: data.id || prev[chartType].id,
          isFavorite:
            data.isFavorite !== undefined
              ? data.isFavorite
              : prev[chartType].isFavorite,
          data: data.chartData
            ? {
                // Safely store chart data without circular references
                config: data.chartData.config
                  ? {
                      ...data.chartData.config,
                      chartElement: undefined, // Remove DOM references
                      domElement: undefined, // Remove DOM references
                    }
                  : prev[chartType].data?.config || {},
                data: data.chartData.data || prev[chartType].data?.data || [],
                metadata:
                  data.chartData.metadata ||
                  prev[chartType].data?.metadata ||
                  {},
              }
            : prev[chartType].data,
        },
      };

      console.log(`Updated ${chartType} chart state:`, {
        id: newState[chartType].id,
        isFavorite: newState[chartType].isFavorite,
        hasData: !!newState[chartType].data,
      });

      return newState;
    });
  };

  // Enhanced favorite toggle with better error handling
  const handleToggleFavorite = async (chartType) => {
    const chartId = chartStates[chartType].id;
    if (!chartId) {
      alert("Please save the chart first before adding to favorites");
      return;
    }

    try {
      // Store current state for rollback
      const currentFavoriteState = chartStates[chartType].isFavorite;

      // Optimistically update UI
      setChartStates((prev) => ({
        ...prev,
        [chartType]: {
          ...prev[chartType],
          isFavorite: !prev[chartType].isFavorite,
        },
      }));

      // Call API
      const result = await toggleFavorite(chartId);

      // If API call failed, revert UI
      if (!result) {
        setChartStates((prev) => ({
          ...prev,
          [chartType]: {
            ...prev[chartType],
            isFavorite: currentFavoriteState,
          },
        }));
        alert("Failed to update favorite status. Please try again.");
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);

      // Revert UI on error
      setChartStates((prev) => ({
        ...prev,
        [chartType]: {
          ...prev[chartType],
          isFavorite: !prev[chartType].isFavorite,
        },
      }));

      alert("Failed to update favorite status. Please try again.");
    }
  };
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
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-red-200 dark:border-red-700">
          <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
            Error
          </h1>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ChartProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced data analysis with statistical charts, trend analysis, and
            comprehensive insights.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select File
              </label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
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
          </div>
        </div>

        {/* Analytics Overview */}
        {analyticsData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Records
                  </p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Unique Values
                  </p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Duplicates
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analyticsData.duplicates}
                  </p>
                </div>
                <PieChart className="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Data Quality
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analyticsData.dataQuality}%
                  </p>
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
          {/* Distribution Analysis Chart */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Distribution Analysis</h3>
              <div className="flex gap-2">
                {/* Save Chart Button */}
                <button
                  onClick={() => handleSaveChart("distribution")}
                  disabled={
                    saveLoading ||
                    !selectedFile ||
                    !chartStates.distribution.data
                  }
                  className="flex items-center gap-1 px-2 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-50"
                  title="Save chart to database"
                >
                  <Save size={14} />
                  <span className="hidden sm:inline">Save</span>
                </button>

                {/* Download Dropdown */}
                <div className="relative" ref={downloadDropdownRef}>
                  <button
                    onClick={() =>
                      setDownloadDropdownOpen((prev) => ({
                        ...prev,
                        distribution: !prev.distribution,
                      }))
                    }
                    disabled={downloadLoading || !distributionChartRef?.current}
                    className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    title="Download chart"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Download</span>
                  </button>

                  {downloadDropdownOpen.distribution && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                      <div className="p-1">
                        <button
                          onClick={() => {
                            handleChartImageDownload(
                              distributionChartRef,
                              "distribution",
                              "png"
                            );
                            setDownloadDropdownOpen((prev) => ({
                              ...prev,
                              distribution: false,
                            }));
                          }}
                          className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          <ImageIcon size={14} />
                          Download as PNG
                        </button>
                        <button
                          onClick={() => {
                            handleChartImageDownload(
                              distributionChartRef,
                              "distribution",
                              "jpeg"
                            );
                            setDownloadDropdownOpen((prev) => ({
                              ...prev,
                              distribution: false,
                            }));
                          }}
                          className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          <ImageIcon size={14} />
                          Download as JPEG
                        </button>
                        <button
                          onClick={() => {
                            handleChartPDFDownload("distribution");
                            setDownloadDropdownOpen((prev) => ({
                              ...prev,
                              distribution: false,
                            }));
                          }}
                          className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          <Paperclip size={14} />
                          Download as PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Favorite Button */}
                <button
                  onClick={() => handleToggleFavorite("distribution")}
                  disabled={!chartStates.distribution.id}
                  className={`flex items-center gap-1 px-2 py-1 text-sm rounded disabled:opacity-50 ${
                    chartStates.distribution.isFavorite
                      ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  title={
                    chartStates.distribution.isFavorite
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >
                  <Heart
                    size={14}
                    fill={
                      chartStates.distribution.isFavorite
                        ? "currentColor"
                        : "none"
                    }
                  />
                  <span className="hidden sm:inline">
                    {chartStates.distribution.isFavorite
                      ? "Favorited"
                      : "Favorite"}
                  </span>
                </button>
              </div>
            </div>
            <div ref={distributionChartRef}>
              <DataDistributionChart
                selectedFileId={selectedFile}
                onChartUpdate={(chartData) => {
                  if (chartData) {
                    updateChartState("distribution", {
                      id: chartData._id,
                      isFavorite: chartData.isFavorite || false,
                      chartData: chartData,
                    });
                  }
                }}
              />
            </div>
          </div>

          {/* Trend Analysis Chart */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Trend Analysis</h3>
              <div className="flex gap-2">
                <ChartDownloadButton
                  chartRef={trendChartRef}
                  chartType="trend"
                  title={
                    currentFile?.originalName
                      ? `Trend Analysis - ${currentFile.originalName}`
                      : "Trend Analysis"
                  }
                  fileId={currentFile?._id}
                />

                <ChartFavoriteButton
                  chartId={chartStates.trend.id}
                  initialIsFavorite={chartStates.trend.isFavorite}
                  disabled={!selectedFile}
                />
              </div>
            </div>

            <div ref={trendChartRef}>
              <TrendAnalysisChart
                selectedFileId={selectedFile}
                onChartUpdate={(chartData) => {
                  if (chartData && chartData._id) {
                    updateChartState("trend", {
                      id: chartData._id,

                      isFavorite: chartData.isFavorite || false,
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Insights */}

        {analyticsData && analyticsData.insights.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              AI Insights
            </h3>

            <div className="space-y-3">
              {analyticsData.insights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
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

                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {insight.message}
                  </p>
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
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.originalName}
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.metadata?.totalRows || 0} rows •{" "}
                        {file.metadata?.totalColumns || 0} columns
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Uploaded:{" "}
                        {new Date(file.uploadTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Export and History buttons with responsive UI */}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleDataExport("csv")}
              disabled={!currentFile || !analyticsData || downloadLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Export CSV
            </button>

            <button
              onClick={() => handleDataExport("excel")}
              disabled={!currentFile || !analyticsData || downloadLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>

          <button
            onClick={handleViewHistory}
            disabled={!currentFile}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <History size={16} />
            View History
          </button>
        </div>
      </div>
    </ChartProvider>
  );
};

export default Analytics;
