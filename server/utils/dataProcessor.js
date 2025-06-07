const XLSX = require("xlsx")

class DataProcessor {
  static processExcelFile(filePath) {
    try {
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // Convert to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      if (jsonData.length === 0) {
        throw new Error("Empty spreadsheet")
      }

      const headers = jsonData[0]
      const rows = jsonData.slice(1)

      return { headers, rows }
    } catch (error) {
      throw new Error(`Failed to process Excel file: ${error.message}`)
    }
  }

  static validateChartData(data, xAxis, yAxis) {
    if (!data || !data.headers || !data.rows) {
      throw new Error("Invalid data structure")
    }

    const xIndex = data.headers.indexOf(xAxis)
    const yIndex = data.headers.indexOf(yAxis)

    if (xIndex === -1) {
      throw new Error(`X-axis column '${xAxis}' not found`)
    }

    if (yIndex === -1) {
      throw new Error(`Y-axis column '${yAxis}' not found`)
    }

    return { xIndex, yIndex }
  }

  static cleanNumericData(value) {
    if (value === null || value === undefined || value === "") {
      return 0
    }

    const parsed = Number.parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }

  static detectColumnType(columnData) {
    const nonEmptyData = columnData.filter((val) => val !== null && val !== undefined && val !== "")

    if (nonEmptyData.length === 0) {
      return "empty"
    }

    const numericCount = nonEmptyData.filter((val) => !isNaN(Number.parseFloat(val))).length
    const dateCount = nonEmptyData.filter((val) => !isNaN(Date.parse(val))).length

    const numericRatio = numericCount / nonEmptyData.length
    const dateRatio = dateCount / nonEmptyData.length

    if (numericRatio > 0.8) return "numeric"
    if (dateRatio > 0.8) return "date"
    return "text"
  }

  static aggregateData(data, groupByColumn, valueColumn, aggregateFunction = "sum") {
    const grouped = {}

    data.forEach((row) => {
      const key = String(row[groupByColumn] || "Unknown")
      const value = this.cleanNumericData(row[valueColumn])

      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(value)
    })

    return Object.entries(grouped).map(([key, values]) => {
      let result

      switch (aggregateFunction.toLowerCase()) {
        case "sum":
          result = values.reduce((a, b) => a + b, 0)
          break
        case "average":
        case "avg":
          result = values.reduce((a, b) => a + b, 0) / values.length
          break
        case "count":
          result = values.length
          break
        case "max":
          result = Math.max(...values)
          break
        case "min":
          result = Math.min(...values)
          break
        default:
          result = values.reduce((a, b) => a + b, 0)
      }

      return {
        label: key,
        value: Math.round(result * 100) / 100, // Round to 2 decimal places
      }
    })
  }

  static generateChartColors(count) {
    const baseColors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#FF6384", "#C9CBCF"]

    const colors = []
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length])
    }

    return colors
  }

  static formatDataForChart(rawData, chartType, options = {}) {
    const { limit = 100, sortBy = null, sortOrder = "asc" } = options

    const processedData = rawData.slice(0, limit)

    // Sort data if requested
    if (sortBy) {
      processedData.sort((a, b) => {
        const aVal = a[sortBy]
        const bVal = b[sortBy]

        if (sortOrder === "desc") {
          return bVal - aVal
        }
        return aVal - bVal
      })
    }

    switch (chartType) {
      case "pie":
      case "doughnut":
        return {
          labels: processedData.map((item) => item.label),
          datasets: [
            {
              data: processedData.map((item) => item.value),
              backgroundColor: this.generateChartColors(processedData.length),
            },
          ],
        }

      case "scatter":
        return {
          datasets: [
            {
              label: "Data Points",
              data: processedData.map((item) => ({
                x: item.x,
                y: item.y,
              })),
              backgroundColor: "rgba(54, 162, 235, 0.6)",
              borderColor: "rgba(54, 162, 235, 1)",
            },
          ],
        }

      default: // bar, line
        return {
          labels: processedData.map((item) => item.label),
          datasets: [
            {
              label: "Values",
              data: processedData.map((item) => item.value),
              backgroundColor:
                chartType === "line" ? "rgba(75, 192, 192, 0.2)" : this.generateChartColors(processedData.length),
              borderColor: chartType === "line" ? "rgba(75, 192, 192, 1)" : "rgba(54, 162, 235, 1)",
              borderWidth: 1,
              fill: chartType === "line" ? false : true,
            },
          ],
        }
    }
  }
}

module.exports = DataProcessor
