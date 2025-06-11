import { useMemo } from "react"
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
} from "recharts"
import { CuboidIcon as Cube, Box, Layers3 } from "lucide-react"

const ChartRenderer = ({
  chartData,
  chartType,
  title,
  className = "",
  datasets = [], // NEW: Available datasets for name mapping
}) => {
  // NEW: Get dataset name by ID
  const getDatasetName = (datasetId) => {
    const dataset = datasets.find((d) => d.id === datasetId || d._id === datasetId)
    return dataset?.name || dataset?.originalName || datasetId || "Unknown Dataset"
  }

  const processedData = useMemo(() => {
    if (!chartData || !chartData.data) return []

    // Handle different chart data formats
    if (chartData.data.labels && chartData.data.datasets) {
      // Chart.js format - convert to Recharts format
      const labels = chartData.data.labels
      const dataset = chartData.data.datasets[0]

      return labels.map((label, index) => ({
        name: getDatasetName(label) || label, // NEW: Use dataset name mapping
        value: dataset.data[index],
        x: dataset.data[index],
        y: dataset.data[index],
        fill: dataset.backgroundColor?.[index] || "#8884d8",
      }))
    } else if (Array.isArray(chartData.data)) {
      // Direct array format
      return chartData.data.map((item, index) => ({
        name: getDatasetName(item.label || item.name) || item.label || item.name || `Item ${index + 1}`,
        value: item.value || item.y || 0,
        x: item.x || index,
        y: item.y || item.value || 0,
        z: item.z,
        fill: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      }))
    }

    return []
  }, [chartData, datasets])

  // Generate histogram data
  const histogramData = useMemo(() => {
    if (chartType !== "histogram" || !processedData.length) return []

    const values = processedData.map((d) => d.value).filter((v) => typeof v === "number")
    if (values.length === 0) return []

    const min = Math.min(...values)
    const max = Math.max(...values)
    const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)))
    const binWidth = (max - min) / binCount

    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`,
      count: 0,
      binStart: min + i * binWidth,
      binEnd: min + (i + 1) * binWidth,
    }))

    values.forEach((value) => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1)
      bins[binIndex].count++
    })

    return bins
  }, [processedData, chartType])

  // Generate box plot data
  const boxPlotData = useMemo(() => {
    if (chartType !== "boxplot" || !processedData.length) return null

    const values = processedData
      .map((d) => d.value)
      .filter((v) => typeof v === "number")
      .sort((a, b) => a - b)
    if (values.length === 0) return null

    const q1Index = Math.floor(values.length * 0.25)
    const q2Index = Math.floor(values.length * 0.5)
    const q3Index = Math.floor(values.length * 0.75)

    const q1 = values[q1Index]
    const median = values[q2Index]
    const q3 = values[q3Index]
    const iqr = q3 - q1
    const lowerFence = q1 - 1.5 * iqr
    const upperFence = q3 + 1.5 * iqr

    const outliers = values.filter((v) => v < lowerFence || v > upperFence)
    const min = Math.max(Math.min(...values), lowerFence)
    const max = Math.min(Math.max(...values), upperFence)

    return {
      min,
      q1,
      median,
      q3,
      max,
      outliers,
      mean: values.reduce((a, b) => a + b, 0) / values.length,
    }
  }, [processedData, chartType])

  // NEW: Process 3D data
  const process3DData = useMemo(() => {
    if (!["scatter3d", "surface3d", "mesh3d"].includes(chartType) || !chartData?.data) return null

    if (Array.isArray(chartData.data)) {
      return chartData.data.map((item, index) => ({
        x: item.x || item[chartData.xAxis] || 0,
        y: item.y || item[chartData.yAxis] || 0,
        z: item.z || item[chartData.zAxis] || 0,
        name: getDatasetName(item.name || item.label) || `Point ${index + 1}`,
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      }))
    }

    return null
  }, [chartData, chartType, datasets])

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
  ]

  // NEW: Render 3D Chart Placeholder
  const render3DChart = () => {
    const is3D = ["scatter3d", "surface3d", "mesh3d"].includes(chartType)
    if (!is3D) return null

    const IconComponent = chartType === "scatter3d" ? Cube : chartType === "surface3d" ? Layers3 : Box

    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
        <IconComponent className="h-24 w-24 mb-6 text-purple-500 animate-pulse" />
        <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-300 mb-2">
          {chartType === "scatter3d"
            ? "3D Scatter Plot"
            : chartType === "surface3d"
              ? "3D Surface Chart"
              : "3D Mesh Chart"}
        </h3>
        <p className="text-center text-purple-600 dark:text-purple-400 mb-4 max-w-md">
          3D visualization ready with {process3DData?.length || 0} data points
        </p>

        {/* 3D Data Summary */}
        {process3DData && process3DData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md max-w-md w-full">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">3D Data Summary</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400">X-Axis</p>
                <p className="font-medium text-gray-900 dark:text-white">{chartData?.xAxis || "X"}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400">Y-Axis</p>
                <p className="font-medium text-gray-900 dark:text-white">{chartData?.yAxis || "Y"}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400">Z-Axis</p>
                <p className="font-medium text-gray-900 dark:text-white">{chartData?.zAxis || "Z"}</p>
              </div>
            </div>

            {/* Sample data points */}
            <div className="mt-3 max-h-32 overflow-y-auto">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sample Points:</p>
              {process3DData.slice(0, 3).map((point, index) => (
                <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                  {point.name}: ({point.x.toFixed(2)}, {point.y.toFixed(2)}, {point.z.toFixed(2)})
                </div>
              ))}
              {process3DData.length > 3 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ...and {process3DData.length - 3} more points
                </p>
              )}
            </div>
          </div>
        )}

        <p className="text-sm text-purple-500 dark:text-purple-400 mt-4">3D rendering requires WebGL support</p>
      </div>
    )
  }

  const renderChart = () => {
    // NEW: Handle 3D charts
    if (["scatter3d", "surface3d", "mesh3d"].includes(chartType)) {
      return render3DChart()
    }

    if (!processedData.length && chartType !== "boxplot") {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      )
    }

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                formatter={(value, name, props) => [value, getDatasetName(props.payload?.name) || name]}
              />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Value" />
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                formatter={(value, name, props) => [value, getDatasetName(props.payload?.name) || name]}
              />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} name="Value" />
            </LineChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                formatter={(value, name, props) => [value, getDatasetName(props.payload?.name) || name]}
              />
              <Legend />
              <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Value" />
            </AreaChart>
          </ResponsiveContainer>
        )

      case "histogram":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
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
        )

      case "boxplot":
        if (!boxPlotData) {
          return (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">No numeric data available for box plot</p>
            </div>
          )
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
              <Bar dataKey="min" fill="transparent" stroke="#8884d8" strokeWidth={2} />
              <Bar dataKey="q1" fill="#8884d8" fillOpacity={0.3} />
              <Bar dataKey="median" fill="#ff7c7c" />
              <Bar dataKey="q3" fill="#8884d8" fillOpacity={0.3} />
              <Bar dataKey="max" fill="transparent" stroke="#8884d8" strokeWidth={2} />

              {/* Mean line */}
              <ReferenceLine y={boxPlotData.mean} stroke="#ff7c7c" strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        )

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
                label={({ name, percent }) => `${getDatasetName(name)}: ${(percent * 100).toFixed(1)}%`}
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                formatter={(value, name) => [value, getDatasetName(name)]}
              />
              <Legend formatter={(value) => getDatasetName(value)} />
            </PieChart>
          </ResponsiveContainer>
        )

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                formatter={(value, name, props) => [value, getDatasetName(props.payload?.name) || name]}
              />
              <Legend />
              <Scatter name="Data Points" data={processedData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        )

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Unsupported chart type: {chartType}</p>
          </div>
        )
    }
  }

  return (
    <div className={`w-full h-full ${className}`}>
      {title && <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">{title}</h4>}
      <div className="w-full h-80">{renderChart()}</div>
      {chartData && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          {["scatter3d", "surface3d", "mesh3d"].includes(chartType) ? (
            <>
              {process3DData?.length || 0} 3D data points
              {chartData.xAxis && chartData.yAxis && chartData.zAxis && (
                <>
                  {" "}
                  • {chartData.xAxis} × {chartData.yAxis} × {chartData.zAxis}
                </>
              )}
            </>
          ) : (
            <>
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
                  • Median: {boxPlotData.median.toFixed(2)} • IQR: {(boxPlotData.q3 - boxPlotData.q1).toFixed(2)}
                </>
              )}
            </>
          )}
          {/* NEW: User dataset count display */}
          {datasets.length > 0 && <> • {datasets.length} user datasets available</>}
        </div>
      )}
    </div>
  )
}

export default ChartRenderer
