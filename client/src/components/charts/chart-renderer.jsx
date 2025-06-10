import { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts";

const ChartRenderer = ({ chartData, chartType, title, className = "" }) => {
  const processedData = useMemo(() => {
    if (!chartData || !chartData.data) return [];

    // Handle different chart data formats
    if (chartData.data.labels && chartData.data.datasets) {
      // Chart.js format - convert to Recharts format
      const labels = chartData.data.labels;
      const dataset = chartData.data.datasets[0];

      return labels.map((label, index) => ({
        name: label,
        value: dataset.data[index],
        x: dataset.data[index],
        y: dataset.data[index],
        fill: dataset.backgroundColor?.[index] || "#8884d8",
      }));
    } else if (Array.isArray(chartData.data)) {
      // Direct array format
      return chartData.data.map((item, index) => ({
        name: item.label || item.name || `Item ${index + 1}`,
        value: item.value || item.y || 0,
        x: item.x || index,
        y: item.y || item.value || 0,
        z: item.z,
        fill: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      }));
    }

    return [];
  }, [chartData]);

  // Generate histogram data
  const histogramData = useMemo(() => {
    if (chartType !== "histogram" || !processedData.length) return [];

    const values = processedData
      .map((d) => d.value)
      .filter((v) => typeof v === "number");
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
    const binWidth = (max - min) / binCount;

    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + i * binWidth).toFixed(1)}-${(
        min +
        (i + 1) * binWidth
      ).toFixed(1)}`,
      count: 0,
      binStart: min + i * binWidth,
      binEnd: min + (i + 1) * binWidth,
    }));

    values.forEach((value) => {
      const binIndex = Math.min(
        Math.floor((value - min) / binWidth),
        binCount - 1
      );
      bins[binIndex].count++;
    });

    return bins;
  }, [processedData, chartType]);

  // Generate box plot data
  const boxPlotData = useMemo(() => {
    if (chartType !== "boxplot" || !processedData.length) return null;

    const values = processedData
      .map((d) => d.value)
      .filter((v) => typeof v === "number")
      .sort((a, b) => a - b);
    if (values.length === 0) return null;

    const q1Index = Math.floor(values.length * 0.25);
    const q2Index = Math.floor(values.length * 0.5);
    const q3Index = Math.floor(values.length * 0.75);

    const q1 = values[q1Index];
    const median = values[q2Index];
    const q3 = values[q3Index];
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    const outliers = values.filter((v) => v < lowerFence || v > upperFence);
    const min = Math.max(Math.min(...values), lowerFence);
    const max = Math.min(Math.max(...values), upperFence);

    return {
      min,
      q1,
      median,
      q3,
      max,
      outliers,
      mean: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }, [processedData, chartType]);

  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7c7c",
    "#8dd1e1",
    "#d084d0",
    "#ffb347",
    "#87ceeb",
    "#dda0dd",
    "#98fb98",
  ];

  const renderChart = () => {
    if (!processedData.length && chartType !== "boxplot") {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      );
    }

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Value" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Value"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
                name="Value"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "histogram":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={histogramData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: "Frequency",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                formatter={(value, name) => [value, "Frequency"]}
              />
              <Bar dataKey="count" fill="#82ca9d" name="Frequency" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "boxplot":
        if (!boxPlotData) {
          return (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">
                No numeric data available for box plot
              </p>
            </div>
          );
        }

        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={[
                {
                  name: "Distribution",
                  min: boxPlotData.min,
                  q1: boxPlotData.q1,
                  median: boxPlotData.median,
                  q3: boxPlotData.q3,
                  max: boxPlotData.max,
                  mean: boxPlotData.mean,
                },
              ]}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                formatter={(value, name) => [value?.toFixed(2), name]}
              />

              {/* Box plot visualization using bars */}
              <Bar
                dataKey="min"
                fill="transparent"
                stroke="#8884d8"
                strokeWidth={2}
              />
              <Bar dataKey="q1" fill="#8884d8" fillOpacity={0.3} />
              <Bar dataKey="median" fill="#ff7c7c" />
              <Bar dataKey="q3" fill="#8884d8" fillOpacity={0.3} />
              <Bar
                dataKey="max"
                fill="transparent"
                stroke="#8884d8"
                strokeWidth={2}
              />

              {/* Mean line */}
              <ReferenceLine
                y={boxPlotData.mean}
                stroke="#ff7c7c"
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case "pie":
      case "doughnut":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                innerRadius={chartType === "doughnut" ? 60 : 0}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(1)}%`
                }
              >
                {processedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="X"
                tick={{ fontSize: 12 }}
                label={{
                  value: "X Axis",
                  position: "insideBottom",
                  offset: -10,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Y"
                tick={{ fontSize: 12 }}
                label={{ value: "Y Axis", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                formatter={(value, name) => [value, name]}
              />
              <Legend />
              <Scatter name="Data Points" data={processedData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">
              Unsupported chart type: {chartType}
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`w-full h-full ${className}`}>
      {title && (
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h4>
      )}
      <div className="w-full h-80">{renderChart()}</div>
      {chartData && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          {processedData.length} data points
          {chartData.xAxis && chartData.yAxis && (
            <>
              {" "}
              • {chartData.xAxis} vs {chartData.yAxis}
            </>
          )}
          {chartType === "histogram" && <> • {histogramData.length} bins</>}
          {chartType === "boxplot" && boxPlotData && (
            <>
              {" "}
              • Median: {boxPlotData.median.toFixed(2)} • IQR:{" "}
              {(boxPlotData.q3 - boxPlotData.q1).toFixed(2)}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChartRenderer;