import { createContext, useContext, useState } from "react";
import axios from "axios";

// Configure axios defaults
axios.defaults.baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
axios.defaults.timeout = 30000; // 30 seconds timeout

const ChartContext = createContext();

export const useChart = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a ChartProvider");
  }
  return context;
};

export const ChartProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [headers, setHeaders] = useState([]);

  // Fetch column headers for a specific file
  const fetchHeaders = async (fileId) => {
    if (!fileId) {
      setHeaders([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching headers for fileId:", fileId);

      // Try the charts headers endpoint first
      let response;
      try {
        response = await axios.get(`/api/charts/headers/${fileId}`);
        console.log("Charts headers response:", response.data);
      } catch (chartsError) {
        console.log(
          "Charts headers failed, trying file data endpoint:",
          chartsError.message
        );
        // Fallback to file data endpoint
        response = await axios.get(`/api/uploads/file-data/${fileId}`);
        console.log("File data response:", response.data);
      }

      if (response.data) {
        let headersData = [];

        // Handle different response formats
        if (response.data.success && response.data.headers) {
          headersData = response.data.headers;
        } else if (
          response.data.success &&
          response.data.data &&
          response.data.data.headers
        ) {
          headersData = response.data.data.headers;
        } else if (response.data.headers) {
          headersData = response.data.headers;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // If we get raw data, extract headers from first row
          const firstRow = response.data.data[0];
          if (firstRow && typeof firstRow === "object") {
            headersData = Object.keys(firstRow).map((key, index) => ({
              name: key,
              index: index,
              type: typeof firstRow[key] === "number" ? "numeric" : "text",
            }));
          }
        } else if (Array.isArray(response.data)) {
          headersData = response.data;
        }

        // Ensure headers are in the correct format
        if (Array.isArray(headersData)) {
          headersData = headersData.map((header, index) => {
            if (typeof header === "string") {
              return {
                name: header,
                index: index,
                type: "text",
              };
            } else if (header && typeof header === "object") {
              return {
                name:
                  header.name ||
                  header.column ||
                  header.field ||
                  header.key ||
                  `Column ${index + 1}`,
                index: header.index !== undefined ? header.index : index,
                type:
                  header.type || header.dataType || header.columnType || "text",
              };
            }
            return {
              name: `Column ${index + 1}`,
              index: index,
              type: "text",
            };
          });
        } else if (headersData && typeof headersData === "object") {
          // If headers is an object, convert to array
          headersData = Object.keys(headersData).map((key, index) => ({
            name: key,
            index: index,
            type: headersData[key] || "text",
          }));
        } else {
          headersData = [];
        }

        console.log("Processed headers:", headersData);
        setHeaders(headersData);
        setLoading(false);
        return headersData;
      } else {
        throw new Error("No data received from server");
      }
    } catch (err) {
      console.error("Error in fetchHeaders:", err);
      const errorMessage =
        err.response?.data?.error || err.message || "Failed to fetch headers";
      setError("Failed to fetch headers: " + errorMessage);
      setHeaders([]);
      setLoading(false);
      return [];
    }
  };

  // Generate chart data
  const generateChart = async (fileId, chartConfig) => {
    if (!fileId || !chartConfig) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(
        "Generating chart for fileId:",
        fileId,
        "with config:",
        chartConfig
      );

      const response = await axios.post(
        `/api/charts/chart-data/${fileId}`,
        chartConfig
      );

      console.log("Chart response received:", response.data);

      if (response.data && response.data.success) {
        setChartData(response.data);
        setLoading(false);
        return response.data;
      } else {
        throw new Error(response.data?.error || "Failed to generate chart");
      }
    } catch (err) {
      console.error("Error in generateChart:", err);
      setError(
        "Failed to generate chart: " +
          (err.response?.data?.error || err.message)
      );
      setChartData(null);
      setLoading(false);
      return null;
    }
  };

  // Generate aggregated data
  const generateAggregateData = async (fileId, aggregateConfig) => {
    if (!fileId || !aggregateConfig) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(
        "Generating aggregate data for fileId:",
        fileId,
        "with config:",
        aggregateConfig
      );

      const response = await axios.post(
        `/api/charts/chart-aggregate/${fileId}`,
        aggregateConfig
      );

      console.log("Aggregate response received:", response.data);

      if (response.data && response.data.success) {
        setLoading(false);
        return response.data;
      } else {
        throw new Error(
          response.data?.error || "Failed to generate aggregate data"
        );
      }
    } catch (err) {
      console.error("Error in generateAggregateData:", err);
      setError(
        "Failed to generate aggregate data: " +
          (err.response?.data?.error || err.message)
      );
      setLoading(false);
      return null;
    }
  };

  // Generate 3D chart data
  const generate3DChart = async (fileId, chartConfig) => {
    if (!fileId || !chartConfig) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `/api/charts/chart-3d/${fileId}`,
        chartConfig
      );

      if (response.data && response.data.success) {
        setLoading(false);
        return response.data;
      } else {
        throw new Error(response.data?.error || "Failed to generate 3D chart");
      }
    } catch (err) {
      console.error("Error generating 3D chart:", err);
      setError(
        "Failed to generate 3D chart: " +
          (err.response?.data?.error || err.message)
      );
      setLoading(false);
      return null;
    }
  };

  // Get all datasets
  const fetchDatasets = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/charts/datasets`);

      if (response.data && response.data.success) {
        setLoading(false);
        return response.data.datasets || [];
      } else {
        throw new Error(response.data?.error || "Failed to fetch datasets");
      }
    } catch (err) {
      console.error("Error fetching datasets:", err);
      setError(
        "Failed to fetch datasets: " +
          (err.response?.data?.error || err.message)
      );
      setLoading(false);
      return [];
    }
  };

  const clearError = () => setError(null);
  const clearChartData = () => setChartData(null);

  const value = {
    loading,
    error,
    chartData,
    headers,
    fetchHeaders,
    generateChart,
    generate3DChart,
    generateAggregateData,
    fetchDatasets,
    clearError,
    clearChartData,
  };

  return (
    <ChartContext.Provider value={value}>{children}</ChartContext.Provider>
  );
};
