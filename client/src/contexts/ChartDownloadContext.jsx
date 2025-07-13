import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "https://excel-analytics-platform-0fk8.onrender.com";
axios.defaults.timeout = 30000; // 30 seconds timeout

const ChartDownloadContext = createContext();

export function ChartDownloadProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Error message helper
  const getErrorMessage = (error) => {
    return (
      error.response?.data?.message || error.message || "An error occurred"
    );
  };

  // Download chart as image directly from DOM element
  const downloadChartAsImage = useCallback((chartElement, options = {}) => {
    if (!chartElement)
      return Promise.reject(new Error("No chart element provided"));

    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      try {
        // Create a canvas element
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        // Set dimensions
        const width = options.width || chartElement.offsetWidth;
        const height = options.height || chartElement.offsetHeight;

        canvas.width = width;
        canvas.height = height;

        // Use html2canvas with proper configuration
        import("html2canvas")
          .then((html2canvasModule) => {
            const html2canvas = html2canvasModule.default;

            html2canvas(chartElement, {
              backgroundColor: options.backgroundColor || "#ffffff",
              scale: options.scale || 2, // Higher scale for better quality
              logging: false,
              useCORS: true,
              allowTaint: true,
              // Avoid using modern CSS features that html2canvas doesn't support
              ignoreElements: (element) => {
                const style = window.getComputedStyle(element);
                return (
                  style.color?.includes("oklch") ||
                  style.backgroundColor?.includes("oklch")
                );
              },
            })
              .then((canvas) => {
                // Convert to blob and download
                canvas.toBlob(
                  (blob) => {
                    if (!blob) {
                      reject(new Error("Failed to create image blob"));
                      setLoading(false);
                      return;
                    }

                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `${options.title || "chart"}.${
                      options.format || "png"
                    }`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    setLoading(false);
                    resolve(true);
                  },
                  `image/${options.format || "png"}`,
                  options.quality || 0.95
                );
              })
              .catch((err) => {
                console.error("html2canvas error:", err);
                setError(getErrorMessage(err));
                setLoading(false);
                reject(err);
              });
          })
          .catch((err) => {
            console.error("Failed to load html2canvas:", err);
            setError(getErrorMessage(err));
            setLoading(false);
            reject(err);
          });
      } catch (err) {
        console.error("Error in downloadChartAsImage:", err);
        setError(getErrorMessage(err));
        setLoading(false);
        reject(err);
      }
    });
  }, []);

  // Download chart as image
  const downloadChartImage = useCallback(
    async (chartConfig, options = {}) => {
      if (!chartConfig) return null;

      setLoading(true);
      setError(null);

      try {
        // If DOM element is provided, use client-side rendering
        if (chartConfig.domElement) {
          return await downloadChartAsImage(chartConfig.domElement, options);
        }

        // Otherwise use server-side rendering
        console.log(
          "Downloading chart image with config:",
          chartConfig,
          "options:",
          options
        );

        const response = await axios.post(
          `/api/charts/download/image`,
          { chartConfig, ...options },
          { responseType: "blob" }
        );

        console.log("Image download response received");

        const blob = new Blob([response.data], {
          type: response.headers["content-type"],
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${options.title || "chart"}.${
          options.format || "png"
        }`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true;
      } catch (err) {
        console.error("Error in downloadChartImage:", err);
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [downloadChartAsImage]
  );

  // Download chart data as Excel
  const downloadChartExcel = useCallback(
    async (chartData, title, metadata = {}) => {
      if (!chartData) return null;

      setLoading(true);
      setError(null);

      try {
        console.log("Downloading chart Excel with data:", chartData);

        const response = await axios.post(
          `/api/charts/download/excel`,
          { chartData, title, metadata },
          { responseType: "blob" }
        );

        console.log("Excel download response received");

        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title || "chart_data"}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true;
      } catch (err) {
        console.error("Error in downloadChartExcel:", err);
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Download chart data as CSV
  const downloadChartCSV = useCallback(async (chartData, title) => {
    if (!chartData) return null;

    setLoading(true);
    setError(null);

    try {
      console.log("Downloading chart CSV with data:", chartData);

      const response = await axios.post(
        `/api/charts/download/csv`,
        { chartData, title },
        { responseType: "blob" }
      );

      console.log("CSV download response received");

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title || "chart_data"}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      console.error("Error in downloadChartCSV:", err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper function to clean chart data for safe transmission
  const cleanChartDataForTransmission = (data) => {
    if (!data) return null;

    const seen = new WeakSet();

    const clean = (obj) => {
      if (obj === null || typeof obj !== "object") {
        return obj;
      }

      if (seen.has(obj)) {
        return "[Circular Reference]";
      }

      seen.add(obj);

      // Remove DOM elements, functions, and other non-serializable types
      if (
        obj instanceof HTMLElement ||
        obj instanceof Element ||
        obj instanceof Node ||
        typeof obj === "function" ||
        obj instanceof RegExp ||
        obj instanceof Date
      ) {
        return undefined;
      }

      if (Array.isArray(obj)) {
        return obj.map(clean).filter((item) => item !== undefined);
      }

      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = clean(value);
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }

      return cleaned;
    };

    return clean(data);
  };

  // Enhanced downloadChartPDF function with safe serialization
  const downloadChartPDF = useCallback(async (chartData, options = {}) => {
    if (!chartData) return null;

    setLoading(true);
    setError(null);

    try {
      console.log("Preparing PDF download...");

      // Create a safe payload by removing circular references and DOM elements
      const safePdfPayload = {
        // Basic chart info
        chartType: chartData.chartType || options.chartType || "unknown",
        title: options.title || chartData.title || "Chart Report",
        fileName: chartData.fileName || "chart-report",

        // Safe analytics data
        analyticsData: chartData.analyticsData
          ? {
              totalRecords: chartData.analyticsData.totalRecords || 0,
              uniqueValues: chartData.analyticsData.uniqueValues || 0,
              duplicates: chartData.analyticsData.duplicates || 0,
              emptyFields: chartData.analyticsData.emptyFields || 0,
              dataQuality: chartData.analyticsData.dataQuality || 0,
              insights: (chartData.analyticsData.insights || []).map(
                (insight) => ({
                  type: insight.type,
                  message: insight.message,
                })
              ),
            }
          : null,

        // Safe chart data - only serializable data
        chartData: chartData.chartData
          ? {
              data: Array.isArray(chartData.chartData.data)
                ? chartData.chartData.data.map((item) => {
                    // Ensure each data item is serializable
                    if (typeof item === "object" && item !== null) {
                      const safeItem = {};
                      for (const [key, value] of Object.entries(item)) {
                        // Only include primitive values and arrays of primitives
                        if (
                          typeof value === "string" ||
                          typeof value === "number" ||
                          typeof value === "boolean" ||
                          (Array.isArray(value) &&
                            value.every(
                              (v) =>
                                typeof v === "string" ||
                                typeof v === "number" ||
                                typeof v === "boolean"
                            ))
                        ) {
                          safeItem[key] = value;
                        }
                      }
                      return safeItem;
                    }
                    return item;
                  })
                : [],
              config: chartData.chartData.config
                ? {
                    // Only include safe config properties
                    type: chartData.chartData.config.type,
                    title: chartData.chartData.config.title,
                    xAxis: chartData.chartData.config.xAxis,
                    yAxis: chartData.chartData.config.yAxis,
                    colors: chartData.chartData.config.colors,
                    // Exclude functions and DOM elements
                  }
                : {},
            }
          : null,

        // Safe metadata
        metadata: chartData.metadata
          ? {
              totalRows: chartData.metadata.totalRows || 0,
              totalColumns: chartData.metadata.totalColumns || 0,
              sheetNames: chartData.metadata.sheetNames || [],
              numericColumns: chartData.metadata.numericColumns || 0,
            }
          : null,

        // Chart image if provided
        chartImageBase64: chartData.chartImageBase64 || null,

        // Options
        includeTimestamp: options.includeTimestamp !== false,
        includeChartImage: options.includeChartImage !== false,

        // Timestamp
        generatedAt: new Date().toISOString(),
      };

      // Validate payload is serializable
      try {
        JSON.stringify(safePdfPayload);
      } catch (serializationError) {
        console.error("Payload serialization failed:", serializationError);
        throw new Error("Chart data contains non-serializable content");
      }

      console.log("Sending PDF request with safe payload:", {
        chartType: safePdfPayload.chartType,
        title: safePdfPayload.title,
        hasAnalyticsData: !!safePdfPayload.analyticsData,
        hasChartData: !!safePdfPayload.chartData,
        hasChartImage: !!safePdfPayload.chartImageBase64,
      });

      // Make API request
      const response = await axios.post(
        `/api/charts/download/pdf`,
        safePdfPayload,
        {
          responseType: "blob",
          timeout: 30000, // 30 second timeout
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("PDF download response received, creating blob...");

      // Handle the PDF blob response
      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safePdfPayload.title.replace(
        /[<>:"/\\|?*]/g,
        "-"
      )}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("PDF download completed successfully");
      return true;
    } catch (err) {
      console.error("Error in downloadChartPDF:", err);

      let errorMessage = "Failed to generate PDF report";

      if (err.response) {
        // Server responded with error status
        if (err.response.status === 413) {
          errorMessage = "Chart data is too large for PDF generation";
        } else if (err.response.status === 400) {
          errorMessage = "Invalid chart data provided";
        } else if (err.response.status === 500) {
          errorMessage = "Server error during PDF generation";
        } else {
          errorMessage = `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
        // Request made but no response
        errorMessage = "Network error - unable to reach server";
      } else if (err.message.includes("serializable")) {
        errorMessage = "Chart data contains invalid content";
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Request timeout - PDF generation took too long";
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  // Get available download formats
  const getDownloadFormats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/charts/download/formats`);

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(
          response.data?.error || "Failed to fetch download formats"
        );
      }
    } catch (err) {
      console.error("Error in getDownloadFormats:", err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    loading,
    error,
    downloadChartImage,
    downloadChartExcel,
    downloadChartCSV,
    downloadChartPDF,
    getDownloadFormats,
  };

  return (
    <ChartDownloadContext.Provider value={value}>
      {children}
    </ChartDownloadContext.Provider>
  );
}

export function useChartDownload() {
  const context = useContext(ChartDownloadContext);
  if (!context) {
    throw new Error(
      "useChartDownload must be used within a ChartDownloadProvider"
    );
  }
  return context;
}
