const ExcelData = require("../models/ExcelData")
const DataProcessor = require("../utils/dataProcessor")

exports.columnHeader = async (req, res) => {
  try {
    const fileId = req.params.fileId

    // Fetch the dataset by ID from MongoDB
    const data = await ExcelData.findById(fileId)

    if (!data) {
      return res.status(404).json({ error: "Dataset not found" })
    }

    const headers = data.metadata?.headers
    const rows = data.sheetData?.rows || [] // Ensure sheetData.rows exists

    if (!headers || !Array.isArray(rows)) {
      return res.status(400).json({ error: "Invalid dataset structure: headers or rows missing" })
    }

    const headersWithTypes = headers.map((header, index) => {
      const columnData = rows.map((row) => row[index]).filter((val) => val !== null && val !== undefined)
      const dataType = DataProcessor.detectColumnType(columnData)

      return {
        name: header,
        index,
        type: dataType,
        sampleValues: columnData.slice(0, 5),
      }
    })

    res.json({
      success: true,
      headers: headersWithTypes,
      totalColumns: headers.length,
      totalRows: rows.length,
    })
  } catch (error) {
    console.error("Headers error:", error)
    res.status(500).json({ error: "Failed to fetch headers" })
  }
}

exports.chartData = async (req, res) => {
  try {
    const { fileId } = req.params
    const { xAxis, yAxis, chartType, limit = 100 } = req.body

    // Fetch from MongoDB
    const dataset = await ExcelData.findById(fileId)
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" })
    }

    const headers = dataset.metadata?.headers
    const rows = dataset.sheetData?.rows || []

    if (!headers || !Array.isArray(rows)) {
      return res.status(400).json({ error: "Invalid dataset structure: headers or rows missing" })
    }

    // Validate chart data
    const xIndex = headers.indexOf(xAxis)
    const yIndex = headers.indexOf(yAxis)

    if (xIndex === -1 || yIndex === -1) {
      return res.status(400).json({ error: "Invalid axis selection" })
    }

    const chartData = rows
      .slice(0, limit)
      .map((row) => ({
        x: row[xIndex],
        y: DataProcessor.cleanNumericData(row[yIndex]),
        label: String(row[xIndex]),
      }))
      .filter((item) => item.x != null && !isNaN(item.y))

    const formattedData = DataProcessor.formatDataForChart(chartData, chartType)

    res.json({
      success: true,
      chartType,
      data: formattedData,
      xAxis,
      yAxis,
      totalPoints: chartData.length,
    })
  } catch (error) {
    console.error("Chart data error:", error)
    res.status(500).json({ error: "Failed to generate chart data" })
  }
}

exports.chart3DData = async (req, res) => {
  try {
    const { fileId } = req.params
    const { xAxis, yAxis, zAxis, limit = 50 } = req.body

    // Fetch dataset from MongoDB (async)
    const dataset = await ExcelData.findById(fileId)
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" })
    }

    const headers = dataset.metadata?.headers
    const rows = dataset.sheetData?.rows || []

    if (!headers || !Array.isArray(rows)) {
      return res.status(400).json({ error: "Invalid dataset structure: headers or rows missing" })
    }

    const xIndex = headers.indexOf(xAxis)
    const yIndex = headers.indexOf(yAxis)
    const zIndex = zAxis ? headers.indexOf(zAxis) : -1

    if (xIndex === -1 || yIndex === -1) {
      return res.status(400).json({ error: "Invalid axis selection" })
    }

    // Create chart data
    const chartData = rows
      .slice(0, limit)
      .map((row, idx) => ({
        x: row[xIndex], // Use actual xAxis data value instead of index
        y: DataProcessor.cleanNumericData(row[yIndex]),
        z: zIndex !== -1 ? DataProcessor.cleanNumericData(row[zIndex]) : 0,
        label: String(row[xIndex]),
        value: DataProcessor.cleanNumericData(row[yIndex]),
      }))
      .filter((item) => item.x != null && !isNaN(item.y) && !isNaN(item.z))

    if (chartData.length === 0) {
      return res.status(400).json({ error: "No valid data points found for chart" })
    }

    // Normalize y values for visualization scale
    const maxY = Math.max(...chartData.map((d) => d.y))
    const normalizedData = chartData.map((item) => ({
      ...item,
      normalizedY: maxY > 0 ? (item.y / maxY) * 10 : 0,
    }))

    res.json({
      success: true,
      data: normalizedData,
      xAxis,
      yAxis,
      zAxis: zAxis || null,
      maxValue: maxY,
      totalPoints: chartData.length,
    })
  } catch (error) {
    console.error("3D Chart data error:", error)
    res.status(500).json({ error: "Failed to generate 3D chart data" })
  }
}

exports.aggregateData = async (req, res) => {
  try {
    const { fileId } = req.params
    const {
      groupBy,
      aggregateField,
      aggregateFunction = "sum",
      column,
      chartType,
      binCount = 20,
      limit = 1000,
    } = req.body

    console.log("Aggregate request body:", req.body)

    // Fetch from MongoDB
    const dataset = await ExcelData.findById(fileId)
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" })
    }

    const headers = dataset.metadata?.headers
    const rows = dataset.sheetData?.rows || []

    if (!headers || !Array.isArray(rows)) {
      return res.status(400).json({ error: "Invalid dataset structure: headers or rows missing" })
    }

    // Handle statistical charts (histogram, boxplot)
    if (chartType === "histogram" || chartType === "boxplot") {
      if (!column) {
        return res.status(400).json({ error: "Column is required for statistical charts" })
      }

      const columnIndex = headers.indexOf(column)
      if (columnIndex === -1) {
        return res.status(400).json({
          error: `Column "${column}" not found. Available columns: ${headers.join(", ")}`,
        })
      }

      // Get all values from the column
      const values = rows
        .map((row) => DataProcessor.cleanNumericData(row[columnIndex]))
        .filter((val) => !isNaN(val) && val !== null && val !== undefined)
        .slice(0, limit)

      if (values.length === 0) {
        return res.status(400).json({
          error: `No valid numeric data found in column "${column}"`,
        })
      }

      if (chartType === "histogram") {
        // Generate histogram bins
        const min = Math.min(...values)
        const max = Math.max(...values)
        const binWidth = (max - min) / binCount

        const bins = Array.from({ length: binCount }, (_, i) => ({
          range: `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`,
          count: 0,
          binStart: min + i * binWidth,
          binEnd: min + (i + 1) * binWidth,
        }))

        values.forEach((value) => {
          const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1)
          if (binIndex >= 0 && binIndex < bins.length) {
            bins[binIndex].count++
          }
        })

        const histogramData = bins.map((bin) => ({
          label: bin.range,
          value: bin.count,
          name: bin.range,
        }))

        return res.json({
          success: true,
          data: histogramData,
          chartType: "histogram",
          column,
          totalGroups: histogramData.length,
          totalValues: values.length,
        })
      } else if (chartType === "boxplot") {
        // Generate box plot data
        const sorted = [...values].sort((a, b) => a - b)
        const q1Index = Math.floor(sorted.length * 0.25)
        const q2Index = Math.floor(sorted.length * 0.5)
        const q3Index = Math.floor(sorted.length * 0.75)

        const q1 = sorted[q1Index]
        const median = sorted[q2Index]
        const q3 = sorted[q3Index]
        const iqr = q3 - q1
        const lowerFence = q1 - 1.5 * iqr
        const upperFence = q3 + 1.5 * iqr

        const outliers = sorted.filter((v) => v < lowerFence || v > upperFence)
        const min = Math.max(Math.min(...sorted), lowerFence)
        const max = Math.min(Math.max(...sorted), upperFence)
        const mean = values.reduce((a, b) => a + b, 0) / values.length

        const boxplotData = [
          {
            label: "Distribution",
            value: median,
            name: "Distribution",
            min,
            q1,
            median,
            q3,
            max,
            mean,
            outliers: outliers.length,
          },
        ]

        return res.json({
          success: true,
          data: boxplotData,
          chartType: "boxplot",
          column,
          totalGroups: 1,
          totalValues: values.length,
          statistics: { min, q1, median, q3, max, mean, outliers: outliers.length },
        })
      }
    }

    // Handle regular aggregation charts
    if (!groupBy || !aggregateField) {
      return res.status(400).json({
        error: "groupBy and aggregateField are required for aggregation charts",
      })
    }

    const groupIndex = headers.indexOf(groupBy)
    const valueIndex = headers.indexOf(aggregateField)

    if (groupIndex === -1) {
      return res.status(400).json({
        error: `Group by column "${groupBy}" not found. Available columns: ${headers.join(", ")}`,
      })
    }

    if (valueIndex === -1) {
      return res.status(400).json({
        error: `Aggregate field "${aggregateField}" not found. Available columns: ${headers.join(", ")}`,
      })
    }

    // Group and collect values
    const grouped = {}
    rows.forEach((row) => {
      const key = String(row[groupIndex] || "Unknown")
      const value = DataProcessor.cleanNumericData(row[valueIndex])
      if (!isNaN(value)) {
        if (!grouped[key]) {
          grouped[key] = []
        }
        grouped[key].push(value)
      }
    })

    if (Object.keys(grouped).length === 0) {
      return res.status(400).json({
        error: `No valid data found for grouping by "${groupBy}" and aggregating "${aggregateField}"`,
      })
    }

    // Aggregate with enhanced functions
    const aggregated = Object.entries(grouped)
      .map(([key, values]) => {
        let aggregatedValue
        switch (aggregateFunction.toLowerCase()) {
          case "sum":
            aggregatedValue = values.reduce((a, b) => a + b, 0)
            break
          case "avg":
          case "average":
            aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length
            break
          case "count":
            aggregatedValue = values.length
            break
          case "max":
            aggregatedValue = Math.max(...values)
            break
          case "min":
            aggregatedValue = Math.min(...values)
            break
          case "median":
            const sorted = [...values].sort((a, b) => a - b)
            const mid = Math.floor(sorted.length / 2)
            aggregatedValue = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
            break
          case "std":
          case "stddev":
            const mean = values.reduce((a, b) => a + b, 0) / values.length
            const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
            aggregatedValue = Math.sqrt(variance)
            break
          default:
            aggregatedValue = values.reduce((a, b) => a + b, 0)
        }

        return {
          label: key,
          value: Math.round(aggregatedValue * 100) / 100, // Round to 2 decimal places
          name: key,
        }
      })
      .filter(Boolean)

    res.json({
      success: true,
      data: aggregated,
      groupBy,
      aggregateField,
      aggregateFunction,
      totalGroups: aggregated.length,
    })
  } catch (error) {
    console.error("Aggregate data error:", error)
    res.status(500).json({ error: "Failed to aggregate data" })
  }
}

exports.getAllDatasets = async (req, res) => {
  try {
    const datasets = await ExcelData.find(
      {},
      {
        filename: 1,
        originalName: 1,
        uploadTime: 1,
        "metadata.headers": 1,
        "metadata.rowCount": 1,
      },
    )

    const formatted = datasets.map((doc) => ({
      id: doc._id,
      filename: doc.filename,
      originalName: doc.originalName,
      headers: doc.metadata?.headers || [],
      rowCount: doc.metadata?.rowCount || 0,
      uploadedAt: doc.uploadTime,
    }))

    res.json({
      success: true,
      datasets: formatted,
    })
  } catch (error) {
    console.error("Datasets error:", error)
    res.status(500).json({ error: "Failed to fetch datasets" })
  }
}

function generateColors(count) {
  const colors = [
    "rgba(255, 99, 132, 0.8)",
    "rgba(54, 162, 235, 0.8)",
    "rgba(255, 205, 86, 0.8)",
    "rgba(75, 192, 192, 0.8)",
    "rgba(153, 102, 255, 0.8)",
    "rgba(255, 159, 64, 0.8)",
    "rgba(199, 199, 199, 0.8)",
    "rgba(83, 102, 255, 0.8)",
  ]

  const result = []
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length])
  }
  return result
}
