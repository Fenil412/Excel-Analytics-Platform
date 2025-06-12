import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const ChartDownloadContext = createContext();

export function ChartDownloadProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableFormats, setAvailableFormats] = useState(null);

  // Configure axios defaults
  axios.defaults.baseURL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  axios.defaults.timeout = 30000; // 30 seconds timeout

  const handleDownload = async (url, body, filename) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method: body ? "POST" : "GET",
        headers: body
          ? {
              "Content-Type": "application/json",
            }
          : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Download failed" }));
        throw new Error(errorData.message || "Download failed");
      }

      // Get filename from response headers or use provided filename
      const contentDisposition = response.headers.get("content-disposition");
      const extractedFilename =
        contentDisposition?.match(/filename="(.+)"/)?.[1] ||
        filename ||
        "download";

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = extractedFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Download failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const downloadChartImage = useCallback(
    async (chartConfig, options = {}) => {
      const { format = "png", width = 800, height = 600, title } = options;
      const queryParams = new URLSearchParams({
        format,
        width: width.toString(),
        height: height.toString(),
      }).toString();

      await handleDownload(
        `${axios.defaults.baseURL}/charts/download/image?${queryParams}`,
        { chartConfig, title },
        `chart.${format}`
      );
    },
    [axios.defaults.baseURL]
  );

  const downloadChartExcel = useCallback(
    async (chartData, title, metadata) => {
      await handleDownload(
        `${axios.defaults.baseURL}/charts/download/excel`,
        { chartData, title, metadata },
        `${title || "chart_data"}.xlsx`
      );
    },
    [axios.defaults.baseURL]
  );

  const downloadChartCSV = useCallback(
    async (chartData, title) => {
      await handleDownload(
        `${axios.defaults.baseURL}/charts/download/csv`,
        { chartData, title },
        `${title || "chart_data"}.csv`
      );
    },
    [axios.defaults.baseURL]
  );

  const downloadChartPDF = useCallback(
    async (options) => {
      await handleDownload(
        `${axios.defaults.baseURL}/charts/download/pdf`,
        options,
        `${options.title || "chart_report"}.pdf`
      );
    },
    [axios.defaults.baseURL]
  );

  const getDownloadFormats = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(
        `${axios.defaults.baseURL}/charts/download/formats`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch download formats");
      }

      const data = await response.json();
      if (data.success) {
        setAvailableFormats(data.data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch formats";
      setError(errorMessage);
    }
  }, [axios.defaults.baseURL]);

  const value = {
    loading,
    error,
    availableFormats,
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
  if (context === undefined) {
    throw new Error(
      "useChartDownload must be used within a ChartDownloadProvider"
    );
  }
  return context;
}
