import { useState, useEffect } from "react";
import {
  X,
  BarChart3,
  LineChart,
  PieChart,
  ScatterChartIcon as Scatter,
  AreaChart,
  BarChart2,
  Activity,
} from "lucide-react";

const ChartConfigModal = ({
  isOpen,
  onClose,
  onGenerate,
  headers = [],
  title = "Configure Chart",
  allowedTypes = [
    "bar",
    "line",
    "pie",
    "doughnut",
    "scatter",
    "area",
    "histogram",
    "boxplot",
  ],
}) => {
  const [config, setConfig] = useState({
    chartType: "bar",
    xAxis: "",
    yAxis: "",
    zAxis: "",
    chartTitle: "",
    limit: 100,
    aggregateFunction: "sum",
    binCount: 20,
    showOutliers: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setConfig({
        chartType: allowedTypes[0] || "bar",
        xAxis: "",
        yAxis: "",
        zAxis: "",
        chartTitle: "",
        limit: 100,
        aggregateFunction: "sum",
        binCount: 20,
        showOutliers: true,
      });
      setErrors({});
    }
  }, [isOpen, allowedTypes]);

  const chartTypes = [
    { value: "bar", label: "Bar Chart", icon: BarChart3, category: "basic" },
    { value: "line", label: "Line Chart", icon: LineChart, category: "basic" },
    { value: "area", label: "Area Chart", icon: AreaChart, category: "basic" },
    { value: "pie", label: "Pie Chart", icon: PieChart, category: "basic" },
    {
      value: "doughnut",
      label: "Doughnut Chart",
      icon: PieChart,
      category: "basic",
    },
    {
      value: "scatter",
      label: "Scatter Plot",
      icon: Scatter,
      category: "advanced",
    },
    {
      value: "histogram",
      label: "Histogram",
      icon: BarChart2,
      category: "statistical",
    },
    {
      value: "boxplot",
      label: "Box Plot",
      icon: Activity,
      category: "statistical",
    },
  ].filter((type) => allowedTypes.includes(type.value));

  const aggregateFunctions = [
    { value: "sum", label: "Sum" },
    { value: "avg", label: "Average" },
    { value: "count", label: "Count" },
    { value: "max", label: "Maximum" },
    { value: "min", label: "Minimum" },
    { value: "median", label: "Median" },
    { value: "std", label: "Standard Deviation" },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!config.xAxis && !["histogram", "boxplot"].includes(config.chartType)) {
      newErrors.xAxis = "X-axis is required";
    }

    if (!config.yAxis && config.chartType !== "boxplot") {
      newErrors.yAxis = "Y-axis is required";
    }

    if (config.limit < 1 || config.limit > 10000) {
      newErrors.limit = "Limit must be between 1 and 10,000";
    }

    if (
      config.chartType === "histogram" &&
      (config.binCount < 5 || config.binCount > 100)
    ) {
      newErrors.binCount = "Bin count must be between 5 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      console.log("Submitting enhanced chart config:", config);
      onGenerate(config);
      onClose();
    }
  };

  const handleInputChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  // Filter headers by type
  const numericHeaders = headers.filter((h) => {
    const type = h?.type || h?.dataType || "text";
    return ["numeric", "number", "float", "integer", "decimal"].includes(type);
  });

  const allHeaders = headers.filter(
    (h) => h && (h.name || typeof h === "string")
  );

  const getChartTypesByCategory = (category) => {
    return chartTypes.filter((type) => type.category === category);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {headers.length === 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>No headers available.</strong> Please make sure a file
                is selected and headers are loaded.
              </p>
            </div>
          )}

          {/* Chart Type Selection - Organized by Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Chart Type
            </label>

            {/* Basic Charts */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Basic Charts
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {getChartTypesByCategory("basic").map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleInputChange("chartType", type.value)}
                      className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                        config.chartType === type.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-medium text-center">
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Charts */}
            {getChartTypesByCategory("advanced").length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Advanced Charts
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {getChartTypesByCategory("advanced").map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          handleInputChange("chartType", type.value)
                        }
                        className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                          config.chartType === type.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-medium text-center">
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Statistical Charts */}
            {getChartTypesByCategory("statistical").length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Statistical Charts
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {getChartTypesByCategory("statistical").map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          handleInputChange("chartType", type.value)
                        }
                        className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                          config.chartType === type.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-medium text-center">
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Chart Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chart Title (Optional)
            </label>
            <input
              type="text"
              value={config.chartTitle}
              onChange={(e) => handleInputChange("chartTitle", e.target.value)}
              placeholder="Enter chart title..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Axis Selection - Conditional based on chart type */}
          {!["histogram", "boxplot"].includes(config.chartType) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  X-Axis *
                </label>
                <select
                  value={config.xAxis}
                  onChange={(e) => handleInputChange("xAxis", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.xAxis
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  disabled={headers.length === 0}
                >
                  <option value="">
                    {headers.length === 0
                      ? "No headers available"
                      : "Select X-Axis"}
                  </option>
                  {allHeaders.map((header, index) => {
                    const headerName =
                      header?.name || header || `Column ${index + 1}`;
                    const headerType =
                      header?.type || header?.dataType || "unknown";
                    return (
                      <option
                        key={`x-${index}-${headerName}`}
                        value={headerName}
                      >
                        {headerName} ({headerType})
                      </option>
                    );
                  })}
                </select>
                {errors.xAxis && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.xAxis}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Y-Axis *
                </label>
                <select
                  value={config.yAxis}
                  onChange={(e) => handleInputChange("yAxis", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.yAxis
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  disabled={headers.length === 0}
                >
                  <option value="">
                    {headers.length === 0
                      ? "No headers available"
                      : "Select Y-Axis"}
                  </option>
                  {(numericHeaders.length > 0
                    ? numericHeaders
                    : allHeaders
                  ).map((header, index) => {
                    const headerName =
                      header?.name || header || `Column ${index + 1}`;
                    const headerType =
                      header?.type || header?.dataType || "unknown";
                    return (
                      <option
                        key={`y-${index}-${headerName}`}
                        value={headerName}
                      >
                        {headerName} ({headerType})
                      </option>
                    );
                  })}
                </select>
                {errors.yAxis && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.yAxis}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Single axis for histogram and box plot */}
          {["histogram", "boxplot"].includes(config.chartType) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Column *
              </label>
              <select
                value={config.yAxis}
                onChange={(e) => handleInputChange("yAxis", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.yAxis
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                disabled={headers.length === 0}
              >
                <option value="">
                  {headers.length === 0
                    ? "No headers available"
                    : "Select Data Column"}
                </option>
                {(numericHeaders.length > 0 ? numericHeaders : allHeaders).map(
                  (header, index) => {
                    const headerName =
                      header?.name || header || `Column ${index + 1}`;
                    const headerType =
                      header?.type || header?.dataType || "unknown";
                    return (
                      <option
                        key={`data-${index}-${headerName}`}
                        value={headerName}
                      >
                        {headerName} ({headerType})
                      </option>
                    );
                  }
                )}
              </select>
              {errors.yAxis && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.yAxis}
                </p>
              )}
            </div>
          )}

          {/* Additional Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Limit
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={config.limit}
                onChange={(e) =>
                  handleInputChange(
                    "limit",
                    Number.parseInt(e.target.value) || 100
                  )
                }
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.limit
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.limit && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.limit}
                </p>
              )}
            </div>

            {!["histogram", "boxplot"].includes(config.chartType) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aggregate Function
                </label>
                <select
                  value={config.aggregateFunction}
                  onChange={(e) =>
                    handleInputChange("aggregateFunction", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {aggregateFunctions.map((func) => (
                    <option key={func.value} value={func.value}>
                      {func.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {config.chartType === "histogram" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Bins
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={config.binCount}
                  onChange={(e) =>
                    handleInputChange(
                      "binCount",
                      Number.parseInt(e.target.value) || 20
                    )
                  }
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.binCount
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.binCount && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.binCount}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={headers.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Generate Chart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChartConfigModal;
