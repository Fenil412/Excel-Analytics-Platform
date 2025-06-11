import { useState, useEffect } from "react";
import {
  Settings,
  RefreshCw,
  Download,
  TrendingUp,
  AlertTriangle,
  Activity,
  X,
  Eye,
  EyeOff,
  CuboidIcon as Cube,
  Layers,
  RotateCcw,
} from "lucide-react";
import { useChart } from "../../contexts/ChartContext";
import ChartConfigModal from "./chart-config-modal";
import ChartRenderer from "./chart-renderer";

const TrendAnalysisChart = ({ selectedFileId, className = "" }) => {
  const {
    loading,
    error,
    chartData,
    headers,
    fetchHeaders,
    generate3DChart,
    generateAggregateData,
    clearError,
    clearChartData,
  } = useChart();

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [localChartData, setLocalChartData] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [trendInsights, setTrendInsights] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [headersLoading, setHeadersLoading] = useState(false);
  const [trendMetrics, setTrendMetrics] = useState(null);
  const [showStatusMessages, setShowStatusMessages] = useState(true);
  const [chart3DData, setChart3DData] = useState(null); // NEW: 3D chart data
  const [show3DChart, setShow3DChart] = useState(false); // NEW: 3D chart visibility
  const [chartDimension, setChartDimension] = useState("2d"); // NEW: 2D/3D toggle
  const [globalChartInfo, setGlobalChartInfo] = useState(null); // NEW: Global chart data info

  useEffect(() => {
    if (selectedFileId) {
      setHeadersLoading(true);
      setLocalChartData(null);
      setChart3DData(null); // NEW: Clear 3D data
      setCurrentConfig(null);
      setTrendInsights([]);
      setTrendMetrics(null);
      setGlobalChartInfo(null); // NEW: Clear global info
      clearError();

      // NEW: Monitor global chart data changes
      if (chartData) {
        setGlobalChartInfo({
          hasData: true,
          timestamp: new Date().toISOString(),
          dataKeys: Object.keys(chartData),
        });
      }

      fetchHeaders(selectedFileId)
        .then((result) => {
          if (result && result.length >= 2) {
            const numericHeaders = result.filter((h) =>
              ["numeric", "number", "float", "integer", "decimal"].includes(
                h?.type || h?.dataType || "text"
              )
            );

            const textHeaders = result.filter(
              (h) =>
                !["numeric", "number", "float", "integer", "decimal"].includes(
                  h?.type || h?.dataType || "text"
                )
            );

            if (numericHeaders.length > 0) {
              const yAxisColumn = numericHeaders[0]?.name;
              const xAxisColumn =
                textHeaders.length > 0
                  ? textHeaders[0]?.name
                  : result.find((h) => h?.name !== yAxisColumn)?.name;

              if (yAxisColumn && xAxisColumn) {
                if (chartDimension === "3d" && numericHeaders.length >= 3) {
                  // NEW: Auto-generate 3D chart
                  const chart3DConfig = {
                    xAxis: numericHeaders[0]?.name,
                    yAxis: numericHeaders[1]?.name,
                    zAxis: numericHeaders[2]?.name,
                    chartType: "scatter3d",
                    limit: 100,
                    chartTitle: `3D Trend: ${numericHeaders[0]?.name}, ${numericHeaders[1]?.name}, ${numericHeaders[2]?.name}`,
                  };
                  handleGenerate3DChart(chart3DConfig); // NEW: 3D chart generation
                } else {
                  // Original 2D trend logic
                  const defaultConfig = {
                    chartType: "line",
                    xAxis: xAxisColumn,
                    yAxis: yAxisColumn,
                    aggregateFunction: "sum",
                    limit: 100,
                    chartTitle: `${yAxisColumn} Trend Over ${xAxisColumn}`,
                  };
                  handleGenerateChart(defaultConfig);
                }
              }
            }
          }
        })
        .catch(console.error)
        .finally(() => setHeadersLoading(false));
    } else {
      setLocalChartData(null);
      setChart3DData(null); // NEW: Clear 3D data
      setCurrentConfig(null);
      setTrendInsights([]);
      setTrendMetrics(null);
      setGlobalChartInfo(null); // NEW: Clear global info
      clearError();
    }
  }, [selectedFileId, chartDimension]);

  // NEW: Monitor global chartData changes
  useEffect(() => {
    if (chartData) {
      setGlobalChartInfo({
        hasData: true,
        timestamp: new Date().toISOString(),
        dataKeys: Object.keys(chartData),
        dataSize: JSON.stringify(chartData).length,
      });
    } else {
      setGlobalChartInfo(null);
    }
  }, [chartData]);

  // NEW: Generate 3D chart using generate3DChart()
  const handleGenerate3DChart = async (config) => {
    if (!selectedFileId || !config) return;

    setLocalLoading(true);
    clearError();

    try {
      console.log("Generating 3D chart with generate3DChart():", config);
      const result = await generate3DChart(selectedFileId, config);

      if (result && result.success) {
        setChart3DData(result);
        setCurrentConfig(config);
        setShow3DChart(true);
        console.log("3D chart generated successfully:", result);

        // Calculate 3D-specific insights
        calculate3DInsights(result);
      } else {
        throw new Error(result?.error || "Failed to generate 3D chart");
      }
    } catch (err) {
      console.error("Error generating 3D chart:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  // NEW: Calculate insights for 3D data
  const calculate3DInsights = (data) => {
    if (!data?.data) return;

    const insights = [];

    insights.push({
      type: "info",
      message: `3D chart generated with ${data.data.length || 0} data points`,
    });

    if (data.xAxis && data.yAxis && data.zAxis) {
      insights.push({
        type: "positive",
        message: `Three-dimensional analysis: ${data.xAxis} vs ${data.yAxis} vs ${data.zAxis}`,
      });
    }

    insights.push({
      type: "neutral",
      message: "3D visualization allows for multi-dimensional trend analysis",
    });

    setTrendInsights(insights);
  };

  const validateConfig = (config) => {
    const errors = [];

    if (!config) {
      errors.push("Configuration is required");
      return errors;
    }

    if (!headers || headers.length === 0) {
      errors.push("No column headers available");
      return errors;
    }

    const headerNames = headers.map((h) => h?.name || h).filter(Boolean);

    if (chartDimension === "3d") {
      // NEW: 3D chart validation
      if (!config.xAxis || !config.yAxis || !config.zAxis) {
        errors.push("X, Y, and Z axes are required for 3D charts");
      }

      if (config.xAxis && !headerNames.includes(config.xAxis)) {
        errors.push(`X-axis column "${config.xAxis}" not found`);
      }
      if (config.yAxis && !headerNames.includes(config.yAxis)) {
        errors.push(`Y-axis column "${config.yAxis}" not found`);
      }
      if (config.zAxis && !headerNames.includes(config.zAxis)) {
        errors.push(`Z-axis column "${config.zAxis}" not found`);
      }

      const axes = [config.xAxis, config.yAxis, config.zAxis].filter(Boolean);
      if (new Set(axes).size !== axes.length) {
        errors.push("X, Y, and Z axes must be different columns");
      }
    } else {
      // Original 2D validation
      if (!config.xAxis) {
        errors.push("X-axis column is required");
      } else if (!headerNames.includes(config.xAxis)) {
        errors.push(`X-axis column "${config.xAxis}" not found`);
      }

      if (!config.yAxis) {
        errors.push("Y-axis column is required");
      } else if (!headerNames.includes(config.yAxis)) {
        errors.push(`Y-axis column "${config.yAxis}" not found`);
      }

      if (config.xAxis === config.yAxis) {
        errors.push("X-axis and Y-axis cannot be the same column");
      }
    }

    return errors;
  };

  const calculateTrendMetrics = (data) => {
    if (!data?.data?.datasets?.[0]) return null;

    const values = data.data.datasets[0].data;
    const labels = data.data.labels || [];
    if (values.length < 2) return null;

    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const percentChange = firstValue
      ? ((lastValue - firstValue) / firstValue) * 100
      : 0;

    const windowSize = Math.min(5, Math.floor(values.length / 3));
    const movingAverage = [];
    for (let i = windowSize - 1; i < values.length; i++) {
      const sum = values
        .slice(i - windowSize + 1, i + 1)
        .reduce((a, b) => a + b, 0);
      movingAverage.push(sum / windowSize);
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      values.length;
    const volatility = Math.sqrt(variance);

    let upwardTrends = 0;
    let downwardTrends = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) upwardTrends++;
      else if (values[i] < values[i - 1]) downwardTrends++;
    }

    const trendDirection =
      upwardTrends > downwardTrends
        ? "upward"
        : downwardTrends > upwardTrends
        ? "downward"
        : "stable";

    return {
      percentChange: percentChange.toFixed(2),
      volatility: volatility.toFixed(2),
      mean: mean.toFixed(2),
      trendDirection,
      upwardTrends,
      downwardTrends,
      movingAverage,
      maxValue: Math.max(...values),
      minValue: Math.min(...values),
      maxIndex: values.indexOf(Math.max(...values)),
      minIndex: values.indexOf(Math.min(...values)),
    };
  };

  const handleGenerateChart = async (config) => {
    if (!selectedFileId) return;

    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      console.error("Validation failed:", validationErrors);
      return;
    }

    if (chartDimension === "3d") {
      // NEW: Use 3D chart generation
      await handleGenerate3DChart(config);
      return;
    }

    // Original 2D trend logic
    setLocalLoading(true);
    clearError();

    try {
      const requestConfig = {
        groupBy: config.xAxis,
        aggregateField: config.yAxis,
        aggregateFunction: config.aggregateFunction || "sum",
        limit: config.limit || 100,
      };

      console.log("Making trend chart API request with config:", requestConfig);
      const result = await generateAggregateData(selectedFileId, requestConfig);

      if (
        result &&
        result.success &&
        result.data &&
        Array.isArray(result.data)
      ) {
        if (result.data.length === 0) {
          throw new Error("No data returned for trend analysis");
        }

        const finalData = {
          labels: result.data.map(
            (item) => item.label || item.name || "Unknown"
          ),
          datasets: [
            {
              data: result.data.map((item) => item.value ?? 0),
            },
          ],
        };

        const chartResult = {
          data: finalData,
          chartType: config.chartType,
          xAxis: config.xAxis,
          yAxis: config.yAxis,
          title:
            config.chartTitle || `${config.yAxis} Trend Over ${config.xAxis}`,
        };

        setLocalChartData(chartResult);
        setCurrentConfig(config);
        setTrendInsights(calculateTrendInsights(chartResult));
        setTrendMetrics(calculateTrendMetrics(chartResult));
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Error generating chart:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const calculateTrendInsights = (data) => {
    if (!data?.data?.datasets?.[0]) return [];

    const values = data.data.datasets[0].data;
    const labels = data.data.labels || [];
    if (values.length < 2) return [];

    const insights = [];
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const percentChange = firstValue
      ? ((lastValue - firstValue) / firstValue) * 100
      : 0;

    if (percentChange > 10) {
      insights.push({
        type: "positive",
        message: `Strong upward trend: ${percentChange.toFixed(
          1
        )}% increase from start to end`,
      });
    } else if (percentChange > 5) {
      insights.push({
        type: "positive",
        message: `Moderate upward trend: ${percentChange.toFixed(
          1
        )}% increase from start to end`,
      });
    } else if (percentChange < -10) {
      insights.push({
        type: "negative",
        message: `Strong downward trend: ${Math.abs(percentChange).toFixed(
          1
        )}% decrease from start to end`,
      });
    } else if (percentChange < -5) {
      insights.push({
        type: "negative",
        message: `Moderate downward trend: ${Math.abs(percentChange).toFixed(
          1
        )}% decrease from start to end`,
      });
    } else {
      insights.push({
        type: "neutral",
        message: `Stable trend: ${Math.abs(percentChange).toFixed(
          1
        )}% change from start to end`,
      });
    }

    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const maxIndex = values.indexOf(maxValue);
    const minIndex = values.indexOf(minValue);

    insights.push({
      type: "info",
      message: `Peak value: ${maxValue} at ${
        labels[maxIndex] || `point ${maxIndex + 1}`
      }`,
    });
    insights.push({
      type: "info",
      message: `Lowest value: ${minValue} at ${
        labels[minIndex] || `point ${minIndex + 1}`
      }`,
    });

    return insights;
  };

  const handleRefresh = () => {
    if (currentConfig && selectedFileId) {
      if (chartDimension === "3d") {
        handleGenerate3DChart(currentConfig); // NEW: Refresh 3D chart
      } else {
        handleGenerateChart(currentConfig);
      }
    }
  };

  // NEW: Reset all chart data using clearChartData()
  const handleResetAll = () => {
    clearError();
    clearChartData(); // NEW: Clear global chart data
    setLocalChartData(null);
    setChart3DData(null);
    setCurrentConfig(null);
    setTrendInsights([]);
    setTrendMetrics(null);
    setGlobalChartInfo(null);
  };

  const handleExport = () => {
    if (!localChartData && !chart3DData) return;

    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        chartDimension, // NEW: Include dimension info
        globalChartInfo, // NEW: Include global chart info
        loading, // NEW: Include loading state
        trendData: localChartData
          ? localChartData.data.labels.map((label, index) => ({
              [localChartData.xAxis]: label,
              [localChartData.yAxis]:
                localChartData.data.datasets[0].data[index],
            }))
          : null,
        chart3DData, // NEW: Include 3D data
        trendInsights,
        trendMetrics,
      };

      const csvContent = [
        "# Enhanced Trend Analysis Chart Export",
        `# Chart Dimension: ${chartDimension}`,
        `# Global Loading State: ${loading}`,
        `# Global Chart Data Available: ${globalChartInfo ? "Yes" : "No"}`,
        "",
      ];

      if (localChartData) {
        csvContent.push(
          "# 2D Trend Data",
          Object.keys(exportData.trendData[0] || {}).join(","),
          ...exportData.trendData.map((row) => Object.values(row).join(","))
        );
      }

      if (chart3DData) {
        csvContent.push(
          "",
          "# 3D Chart Data",
          JSON.stringify(chart3DData, null, 2)
        );
      }

      if (trendInsights.length > 0) {
        csvContent.push(
          "",
          "# Trend Insights",
          "Insight,Type",
          ...trendInsights.map(
            (i, idx) => `"${idx + 1}. ${i.message}",${i.type}`
          )
        );
      }

      const blob = new Blob([csvContent.join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `enhanced-trend-analysis-${chartDimension}-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleConfigOpen = () => {
    if (!selectedFileId) return alert("Select a file first");
    if (headersLoading) return alert("Headers are still loading.");
    if (!headers.length) return alert("No headers found.");
    setIsConfigOpen(true);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Enhanced Trend Analysis
        </h3>
        <div className="flex space-x-2">
          {/* NEW: 2D/3D Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
            <button
              onClick={() => setChartDimension("2d")}
              className={`px-2 py-1 text-xs rounded flex items-center space-x-1 ${
                chartDimension === "2d"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800"
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>2D</span>
            </button>
            <button
              onClick={() => setChartDimension("3d")}
              className={`px-2 py-1 text-xs rounded flex items-center space-x-1 ${
                chartDimension === "3d"
                  ? "bg-purple-500 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800"
              }`}
            >
              <Cube className="h-3 w-3" />
              <span>3D</span>
            </button>
          </div>

          <button
            onClick={() => setShowStatusMessages(!showStatusMessages)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            title={
              showStatusMessages
                ? "Hide Status Messages"
                : "Show Status Messages"
            }
          >
            {showStatusMessages ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>

          {/* NEW: 3D Chart Toggle */}
          {chart3DData && (
            <button
              onClick={() => setShow3DChart(!show3DChart)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              title="Toggle 3D Chart"
            >
              <Cube className="h-4 w-4" />
            </button>
          )}

          {(localChartData || chart3DData) && (
            <>
              <button
                onClick={handleRefresh}
                disabled={localLoading || loading}
                className="p-2 text-gray-600 dark:text-gray-400"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    localLoading || loading ? "animate-spin" : ""
                  }`}
                />
              </button>

              {/* NEW: Reset All Button */}
              <button
                onClick={handleResetAll}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                title="Reset All Data"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={handleExport}
                className="p-2 text-gray-600 dark:text-gray-400"
              >
                <Download className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={handleConfigOpen}
            disabled={
              !selectedFileId || localLoading || headersLoading || loading
            }
            className="p-2 text-gray-600 dark:text-gray-400"
          >
            <Settings
              className={`h-4 w-4 ${
                headersLoading || loading ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Enhanced Status Messages */}
      {showStatusMessages && (
        <div className="space-y-2 mb-4">
          {/* NEW: Global Chart Data Status */}
          {globalChartInfo && (
            <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-md">
              <div className="flex items-center justify-between">
                <p className="text-xs text-cyan-600 dark:text-cyan-400">
                  Global Chart Data: {globalChartInfo.dataSize} bytes | Keys:{" "}
                  {globalChartInfo.dataKeys.join(", ")}
                </p>
                <button
                  onClick={() => setShowStatusMessages(false)}
                  className="text-cyan-400 hover:text-cyan-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* NEW: Chart Dimension Status */}
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-xs text-purple-600 dark:text-purple-400">
                Chart Dimension: {chartDimension.toUpperCase()} | Method:{" "}
                {chartDimension === "3d"
                  ? "generate3DChart()"
                  : "generateAggregateData()"}
              </p>
              <button
                onClick={() => setShowStatusMessages(false)}
                className="text-purple-400 hover:text-purple-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* NEW: Loading State Status */}
          {loading && (
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
              <div className="flex items-center justify-between">
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Global loading state active...
                </p>
                <button
                  onClick={() => setShowStatusMessages(false)}
                  className="text-orange-400 hover:text-orange-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {selectedFileId && headersLoading && (
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-center justify-between">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Loading column headers...
                </p>
                <button
                  onClick={() => setShowStatusMessages(false)}
                  className="text-blue-400 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {selectedFileId && !headersLoading && headers.length > 0 && (
            <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center justify-between">
                <p className="text-xs text-green-600 dark:text-green-400">
                  Headers: {headers.length} | 2D Chart:{" "}
                  {localChartData ? "✓" : "✗"} | 3D Chart:{" "}
                  {chart3DData ? "✓" : "✗"}
                </p>
                <button
                  onClick={() => setShowStatusMessages(false)}
                  className="text-green-400 hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">
                Failed to generate {chartDimension} trend chart
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-line">
                {error}
              </p>
              <button
                onClick={clearError}
                className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: 3D Chart Display */}
      {show3DChart && chart3DData && (
        <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md">
          <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
            3D Chart Data
          </h4>
          <div className="bg-purple-100 dark:bg-purple-800 p-3 rounded max-h-40 overflow-auto">
            <pre className="text-xs text-purple-700 dark:text-purple-300">
              {JSON.stringify(chart3DData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="h-80 mb-4">
        {localLoading || loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading {chartDimension} chart using{" "}
              {chartDimension === "3d"
                ? "generate3DChart()"
                : "generateAggregateData()"}
              ...
            </p>
          </div>
        ) : localChartData || chart3DData ? (
          chartDimension === "3d" && chart3DData ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Cube className="h-16 w-16 mb-4 text-purple-500" />
              <p className="text-center text-gray-600 dark:text-gray-400">
                3D Chart Generated Successfully
                <br />
                <span className="text-sm">
                  Toggle 3D data view above to see raw data
                </span>
              </p>
            </div>
          ) : (
            localChartData && (
              <ChartRenderer
                chartData={localChartData}
                chartType={currentConfig?.chartType || "line"}
                title={localChartData.title}
              />
            )
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">
              {selectedFileId
                ? headers.length > 0
                  ? `Click settings to configure ${chartDimension} trend analysis`
                  : headersLoading
                  ? "Loading headers..."
                  : "No headers available"
                : "Select a file to view enhanced trend analysis"}
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Trend Metrics */}
      {trendMetrics && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Trend Metrics ({chartDimension} analysis)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-auto min-h-[80px] flex flex-col">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
                Overall Change
              </p>
              <p
                className={`text-xl font-bold ${
                  Number.parseFloat(trendMetrics.percentChange) > 0
                    ? "text-green-600 dark:text-green-400"
                    : Number.parseFloat(trendMetrics.percentChange) < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {trendMetrics.percentChange}%
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-auto min-h-[80px] flex flex-col">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
                Volatility
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {trendMetrics.volatility}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-auto min-h-[80px] flex flex-col">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
                Direction
              </p>
              <p
                className={`text-xl font-bold capitalize ${
                  trendMetrics.trendDirection === "upward"
                    ? "text-green-600 dark:text-green-400"
                    : trendMetrics.trendDirection === "downward"
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {trendMetrics.trendDirection}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg h-auto min-h-[80px] flex flex-col">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
                Average
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {trendMetrics.mean}
              </p>
            </div>
          </div>
        </div>
      )}

      {trendInsights.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Trend Insights
          </h4>
          <div className="space-y-2">
            {trendInsights.map((insight, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 p-2 rounded-md text-sm ${
                  insight.type === "positive"
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : insight.type === "negative"
                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                    : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                }`}
              >
                <Activity className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{insight.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ChartConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onGenerate={handleGenerateChart}
        headers={headers}
        title={`Configure ${
          chartDimension === "3d" ? "3D" : "2D"
        } Trend Analysis Chart`}
        allowedTypes={
          chartDimension === "3d"
            ? ["scatter3d", "surface3d", "mesh3d"]
            : ["line", "area", "bar", "scatter"]
        }
      />
    </div>
  );
};

export default TrendAnalysisChart;
