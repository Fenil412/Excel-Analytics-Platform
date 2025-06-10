import { useState, useEffect } from "react";
import {
  Settings,
  RefreshCw,
  Download,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { useChart } from "../../contexts/ChartContext";
import ChartConfigModal from "./chart-config-modal";
import ChartRenderer from "./chart-renderer";

const DataDistributionChart = ({ selectedFileId, className = "" }) => {
  const { error, headers, fetchHeaders, generateAggregateData, clearError } =
    useChart();

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [headersLoading, setHeadersLoading] = useState(false);
  const [distributionStats, setDistributionStats] = useState(null);

  useEffect(() => {
    if (selectedFileId) {
      console.log(
        "DataDistributionChart: Fetching headers for fileId:",
        selectedFileId
      );
      setHeadersLoading(true);
      setChartData(null);
      setCurrentConfig(null);
      setDistributionStats(null);
      clearError();

      fetchHeaders(selectedFileId)
        .then((result) => {
          console.log("Headers fetch completed:", result);

          // Auto-generate default chart if we have valid data
          if (result && result.length > 0) {
            // Find numeric columns for statistical analysis
            const numericHeaders = result.filter((h) =>
              ["numeric", "number", "float", "integer", "decimal"].includes(
                h?.type || h?.dataType || "text"
              )
            );

            if (numericHeaders.length > 0) {
              const yAxisColumn = numericHeaders[0]?.name;

              // Auto-generate histogram for first numeric column
              const defaultConfig = {
                chartType: "histogram",
                yAxis: yAxisColumn,
                limit: 1000,
                chartTitle: `Distribution of ${yAxisColumn}`,
                binCount: 20,
              };
              console.log(
                "Auto-generating histogram with config:",
                defaultConfig
              );
              handleGenerateChart(defaultConfig);
            }
          }
        })
        .catch((err) => {
          console.error("Headers fetch failed:", err);
        })
        .finally(() => {
          setHeadersLoading(false);
        });
    } else {
      setChartData(null);
      setCurrentConfig(null);
      setDistributionStats(null);
      clearError();
    }
  }, [selectedFileId]);

  const validateConfig = (config) => {
    const errors = [];

    if (!config) {
      errors.push("Configuration is required");
      return errors;
    }

    // Validate headers are available
    if (!headers || headers.length === 0) {
      errors.push("No column headers available");
      return errors;
    }

    const headerNames = headers.map((h) => h?.name || h).filter(Boolean);

    // Validate chart type specific requirements
    if (["histogram", "boxplot"].includes(config.chartType)) {
      if (!config.yAxis) {
        errors.push("Data column is required for statistical charts");
      } else if (!headerNames.includes(config.yAxis)) {
        errors.push(
          `Column "${
            config.yAxis
          }" not found. Available columns: ${headerNames.join(", ")}`
        );
      }
    } else {
      // Regular charts need both axes
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
    }

    return errors;
  };

  const calculateDistributionStats = (data) => {
    if (!data || !Array.isArray(data)) return null;

    const values = data
      .map((item) => item.value)
      .filter((v) => typeof v === "number" && !isNaN(v));
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const mode = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    const modeValue = Object.keys(mode).reduce((a, b) =>
      mode[a] > mode[b] ? a : b
    );

    const variance =
      values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    return {
      count: values.length,
      mean: mean.toFixed(2),
      median: median.toFixed(2),
      mode: Number.parseFloat(modeValue).toFixed(2),
      stdDev: stdDev.toFixed(2),
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
      range: (Math.max(...values) - Math.min(...values)).toFixed(2),
    };
  };

  const handleGenerateChart = async (config) => {
    if (!selectedFileId) {
      console.error("No file selected");
      return;
    }

    // Validate configuration before making API call
    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      const errorMessage =
        "Configuration validation failed:\n" + validationErrors.join("\n");
      console.error("Validation failed:", validationErrors);
      clearError();
      return;
    }

    setLocalLoading(true);
    clearError();

    try {
      console.log(
        "DataDistributionChart: Generating chart with config:",
        config
      );

      let requestConfig;

      if (["histogram", "boxplot"].includes(config.chartType)) {
        // For statistical charts, send column and chartType
        requestConfig = {
          column: config.yAxis,
          chartType: config.chartType,
          binCount: config.binCount || 20,
          limit: config.limit || 1000,
        };
      } else {
        // For regular charts, use aggregation
        requestConfig = {
          groupBy: config.xAxis,
          aggregateField: config.yAxis,
          aggregateFunction: config.aggregateFunction || "sum",
          limit: config.limit || 100,
        };
      }

      console.log("Making API request with config:", requestConfig);
      const result = await generateAggregateData(selectedFileId, requestConfig);

      if (
        result &&
        result.success &&
        result.data &&
        Array.isArray(result.data)
      ) {
        if (result.data.length === 0) {
          throw new Error(`No data returned for the selected configuration. Please check:
• Column "${config.yAxis}" contains valid data
• Data is not filtered out by your criteria
• Column names match exactly (case-sensitive)`);
        }

        // Process the data
        const chartResult = {
          data: {
            labels: result.data.map(
              (item) => item.label || item.name || "Unknown"
            ),
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
        };

        setChartData(chartResult);
        setCurrentConfig(config);
        setDistributionStats(calculateDistributionStats(result.data));
        console.log(
          "DataDistributionChart: Chart generated successfully:",
          chartResult
        );
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Error generating distribution chart:", err);
      // Error is already handled in the context
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRefresh = () => {
    if (currentConfig && selectedFileId) {
      console.log("DataDistributionChart: Refreshing chart");
      handleGenerateChart(currentConfig);
    }
  };

  const handleExport = () => {
    if (!chartData) return;

    try {
      const csvData = chartData.data.labels.map((label, index) => ({
        [chartData.xAxis || "Category"]: label,
        [chartData.yAxis || "Value"]: chartData.data.datasets[0].data[index],
      }));

      const csvContent = [
        "# Chart Data",
        Object.keys(csvData[0]).join(","),
        ...csvData.map((row) => Object.values(row).join(",")),
      ];

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
          `Range,${distributionStats.range}`
        );
      }

      const blob = new Blob([csvContent.join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data-distribution-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting data:", err);
    }
  };

  const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 137.5) % 360;
      colors.push(`hsl(${hue}, 70%, 50%)`);
    }
    return colors;
  };

  const handleConfigOpen = () => {
    if (!selectedFileId) {
      alert("Please select a file first");
      return;
    }
    if (headersLoading) {
      alert("Headers are still loading. Please wait a moment and try again.");
      return;
    }
    if (headers.length === 0) {
      alert("No headers found. Please check if the file contains valid data.");
      return;
    }
    setIsConfigOpen(true);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Data Distribution Analysis
        </h3>
        <div className="flex space-x-2">
          {chartData && (
            <>
              <button
                onClick={handleRefresh}
                disabled={localLoading}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                title="Refresh Chart"
              >
                <RefreshCw
                  className={`h-4 w-4 ${localLoading ? "animate-spin" : ""}`}
                />
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
            disabled={!selectedFileId || localLoading || headersLoading}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
            title="Configure Chart"
          >
            <Settings
              className={`h-4 w-4 ${headersLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Headers Status */}
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
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
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
            chartType={currentConfig?.chartType || "bar"}
            title={chartData.title}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">
              {selectedFileId
                ? headers.length > 0
                  ? "Click the settings icon to configure and generate your data distribution chart"
                  : headersLoading
                  ? "Loading headers..."
                  : "No headers available. Please check your file."
                : "Select a file to view data distribution analysis"}
            </p>
          </div>
        )}
      </div>

      {/* Distribution Statistics */}
      {distributionStats && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Distribution Statistics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">Count</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {distributionStats.count}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">Mean</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {distributionStats.mean}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">Median</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {distributionStats.median}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Std Dev
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {distributionStats.stdDev}
              </p>
            </div>
          </div>
        </div>
      )}

      <ChartConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onGenerate={handleGenerateChart}
        headers={headers}
        title="Configure Data Distribution Chart"
        allowedTypes={[
          "histogram",
          "boxplot",
          "bar",
          "pie",
          "doughnut",
          "scatter",
        ]}
      />
    </div>
  );
};

export default DataDistributionChart;
