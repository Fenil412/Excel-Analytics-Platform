import { useState, useEffect } from "react";
import {
  Settings,
  RefreshCw,
  Download,
  TrendingUp,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { useChart } from "../../contexts/ChartContext";
import ChartConfigModal from "./chart-config-modal";
import ChartRenderer from "./chart-renderer";

const TrendAnalysisChart = ({ selectedFileId, className = "" }) => {
  const { error, headers, fetchHeaders, generateAggregateData, clearError } =
    useChart();

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [trendInsights, setTrendInsights] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [headersLoading, setHeadersLoading] = useState(false);
  const [trendMetrics, setTrendMetrics] = useState(null);

  useEffect(() => {
    if (selectedFileId) {
      setHeadersLoading(true);
      setChartData(null);
      setCurrentConfig(null);
      setTrendInsights([]);
      setTrendMetrics(null);
      clearError();

      fetchHeaders(selectedFileId)
        .then((result) => {
          if (result && result.length >= 2) {
            // Find numeric columns for Y-axis
            const numericHeaders = result.filter((h) =>
              ["numeric", "number", "float", "integer", "decimal"].includes(
                h?.type || h?.dataType || "text"
              )
            );

            // Find non-numeric columns for X-axis (better for trends)
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
                const defaultConfig = {
                  chartType: "line",
                  xAxis: xAxisColumn,
                  yAxis: yAxisColumn,
                  aggregateFunction: "sum",
                  limit: 100,
                  chartTitle: `${yAxisColumn} Trend Over ${xAxisColumn}`,
                };
                console.log(
                  "Auto-generating trend chart with config:",
                  defaultConfig
                );
                handleGenerateChart(defaultConfig);
              }
            }
          }
        })
        .catch(console.error)
        .finally(() => setHeadersLoading(false));
    } else {
      setChartData(null);
      setCurrentConfig(null);
      setTrendInsights([]);
      setTrendMetrics(null);
      clearError();
    }
  }, [selectedFileId]);

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

    if (!config.xAxis) {
      errors.push("X-axis column is required");
    } else if (!headerNames.includes(config.xAxis)) {
      errors.push(
        `X-axis column "${
          config.xAxis
        }" not found. Available columns: ${headerNames.join(", ")}`
      );
    }

    if (!config.yAxis) {
      errors.push("Y-axis column is required");
    } else if (!headerNames.includes(config.yAxis)) {
      errors.push(
        `Y-axis column "${
          config.yAxis
        }" not found. Available columns: ${headerNames.join(", ")}`
      );
    }

    if (config.xAxis === config.yAxis) {
      errors.push("X-axis and Y-axis cannot be the same column");
    }

    return errors;
  };

  const calculateTrendMetrics = (data) => {
    if (!data?.data?.datasets?.[0]) return null;

    const values = data.data.datasets[0].data;
    const labels = data.data.labels || [];
    if (values.length < 2) return null;

    // Calculate trend metrics
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const percentChange = firstValue
      ? ((lastValue - firstValue) / firstValue) * 100
      : 0;

    // Calculate moving average
    const windowSize = Math.min(5, Math.floor(values.length / 3));
    const movingAverage = [];
    for (let i = windowSize - 1; i < values.length; i++) {
      const sum = values
        .slice(i - windowSize + 1, i + 1)
        .reduce((a, b) => a + b, 0);
      movingAverage.push(sum / windowSize);
    }

    // Calculate volatility (standard deviation)
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      values.length;
    const volatility = Math.sqrt(variance);

    // Detect trend direction
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

    // Validate configuration
    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      console.error("Validation failed:", validationErrors);
      return;
    }

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
          throw new Error(`No data returned for trend analysis. Please check:
• Column "${config.yAxis}" contains valid data
• Column "${config.xAxis}" has groupable values
• Data is not filtered out by your criteria`);
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

        setChartData(chartResult);
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

    // Detect patterns
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const aboveMean = values.filter((v) => v > mean).length;
    const belowMean = values.filter((v) => v < mean).length;

    if (aboveMean > belowMean * 1.5) {
      insights.push({
        type: "positive",
        message: `Most values (${aboveMean}/${values.length}) are above average, indicating positive performance`,
      });
    } else if (belowMean > aboveMean * 1.5) {
      insights.push({
        type: "negative",
        message: `Most values (${belowMean}/${values.length}) are below average, indicating room for improvement`,
      });
    }

    return insights;
  };

  const handleRefresh = () => {
    if (currentConfig && selectedFileId) handleGenerateChart(currentConfig);
  };

  const handleExport = () => {
    if (!chartData) return;
    try {
      const csvData = chartData.data.labels.map((label, index) => ({
        [chartData.xAxis]: label,
        [chartData.yAxis]: chartData.data.datasets[0].data[index],
      }));

      const csvContent = [
        "# Trend Data",
        Object.keys(csvData[0]).join(","),
        ...csvData.map((row) => Object.values(row).join(",")),
        "",
        "# Trend Insights",
        "Insight,Type",
        ...trendInsights.map(
          (i, idx) => `"${idx + 1}. ${i.message}",${i.type}`
        ),
      ];

      if (trendMetrics) {
        csvContent.push(
          "",
          "# Trend Metrics",
          "Metric,Value",
          `Percent Change,${trendMetrics.percentChange}%`,
          `Volatility,${trendMetrics.volatility}`,
          `Mean,${trendMetrics.mean}`,
          `Trend Direction,${trendMetrics.trendDirection}`,
          `Upward Movements,${trendMetrics.upwardTrends}`,
          `Downward Movements,${trendMetrics.downwardTrends}`,
          `Maximum Value,${trendMetrics.maxValue}`,
          `Minimum Value,${trendMetrics.minValue}`
        );
      }

      const blob = new Blob([csvContent.join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trend-analysis-${Date.now()}.csv`;
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
          Advanced Trend Analysis
        </h3>
        <div className="flex space-x-2">
          {chartData && (
            <>
              <button
                onClick={handleRefresh}
                disabled={localLoading}
                className="p-2 text-gray-600 dark:text-gray-400"
              >
                <RefreshCw
                  className={`h-4 w-4 ${localLoading ? "animate-spin" : ""}`}
                />
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
            disabled={!selectedFileId || localLoading || headersLoading}
            className="p-2 text-gray-600 dark:text-gray-400"
          >
            <Settings
              className={`h-4 w-4 ${headersLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {selectedFileId && headersLoading && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Loading column headers...
          </p>
        </div>
      )}

      {selectedFileId && !headersLoading && headers.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            No headers found. Please check if the file contains valid data or
            try refreshing.
          </p>
        </div>
      )}

      {selectedFileId && !headersLoading && headers.length > 0 && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-600 dark:text-green-400">
            Found {headers.length} columns:{" "}
            {headers.map((h) => h?.name || h || "Unknown").join(", ")}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">
                Failed to generate aggregate data
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

      <div className="h-80 mb-4">
        {localLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading chart data...
            </p>
          </div>
        ) : chartData ? (
          <ChartRenderer
            chartData={chartData}
            chartType={currentConfig?.chartType || "line"}
            title={chartData.title}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">
              {selectedFileId
                ? headers.length > 0
                  ? "Click the settings icon to configure and generate your trend analysis chart"
                  : headersLoading
                  ? "Loading headers..."
                  : "No headers available. Please check your file."
                : "Select a file to view trend analysis"}
            </p>
          </div>
        )}
      </div>

      {/* Trend Metrics */}
      {trendMetrics && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Trend Metrics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Overall Change
              </p>
              <p
                className={`text-lg font-semibold ${
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
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Volatility
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {trendMetrics.volatility}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Direction
              </p>
              <p
                className={`text-lg font-semibold capitalize ${
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
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Average
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
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
        title="Configure Trend Analysis Chart"
        allowedTypes={["line", "area", "bar", "scatter"]}
      />
    </div>
  );
};

export default TrendAnalysisChart;
