import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const ChartHistoryContext = createContext();

export function ChartHistoryProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });

  // Configure axios defaults
  axios.defaults.baseURL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  axios.defaults.timeout = 30000; // 30 seconds timeout

  const handleApiCall = async (apiCall) => {
    try {
      setError(null);
      const response = await apiCall();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "API call failed");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Operation failed");
      }

      return data.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      throw err;
    }
  };

  const saveChartHistory = useCallback(
    async (fileId, data) => {
      return handleApiCall(async () => {
        return fetch(`${axios.defaults.baseURL}/charts/history/${fileId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      });
    },
    [axios.defaults.baseURL]
  );

  const getChartHistory = useCallback(
    async (fileId, params = {}) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams(params).toString();
        const url = `${axios.defaults.baseURL}/charts/history/${fileId}${
          queryParams ? `?${queryParams}` : ""
        }`;

        const result = await handleApiCall(async () => fetch(url));

        setHistory(result.history);
        setPagination(result.pagination);
      } finally {
        setLoading(false);
      }
    },
    [axios.defaults.baseURL]
  );

  const getChartHistoryById = useCallback(
    async (historyId) => {
      return handleApiCall(async () => {
        return fetch(
          `${axios.defaults.baseURL}/charts/history-item/${historyId}`
        );
      });
    },
    [axios.defaults.baseURL]
  );

  const updateChartHistory = useCallback(
    async (historyId, data) => {
      const result = await handleApiCall(async () => {
        return fetch(
          `${axios.defaults.baseURL}/charts/history-item/${historyId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );
      });

      // Update local state
      setHistory((prev) =>
        prev.map((item) =>
          item._id === historyId ? { ...item, ...result } : item
        )
      );

      return result;
    },
    [axios.defaults.baseURL]
  );

  const deleteChartHistory = useCallback(
    async (historyId) => {
      await handleApiCall(async () => {
        return fetch(
          `${axios.defaults.baseURL}/charts/history-item/${historyId}`,
          {
            method: "DELETE",
          }
        );
      });

      // Update local state
      setHistory((prev) => prev.filter((item) => item._id !== historyId));
    },
    [axios.defaults.baseURL]
  );

  const getHistoryStats = useCallback(
    async (fileId) => {
      const result = await handleApiCall(async () => {
        return fetch(
          `${axios.defaults.baseURL}/charts/history/${fileId}/stats`
        );
      });

      setStats(result);
    },
    [axios.defaults.baseURL]
  );

  const toggleFavorite = useCallback(
    async (historyId, isFavorite) => {
      await updateChartHistory(historyId, { isFavorite });
    },
    [updateChartHistory]
  );

  const value = {
    history,
    stats,
    loading,
    error,
    pagination,
    saveChartHistory,
    getChartHistory,
    getChartHistoryById,
    updateChartHistory,
    deleteChartHistory,
    getHistoryStats,
    toggleFavorite,
  };

  return (
    <ChartHistoryContext.Provider value={value}>
      {children}
    </ChartHistoryContext.Provider>
  );
}

export function useChartHistory() {
  const context = useContext(ChartHistoryContext);
  if (context === undefined) {
    throw new Error(
      "useChartHistory must be used within a ChartHistoryProvider"
    );
  }
  return context;
}
