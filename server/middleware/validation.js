const { body, param, validationResult } = require("express-validator")

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    })
  }
  next()
}

// Chart data validation rules
const validateChartRequest = [
  body("xAxis").notEmpty().withMessage("X-axis is required"),
  body("yAxis").notEmpty().withMessage("Y-axis is required"),
  body("chartType").isIn(["bar", "line", "pie", "doughnut", "scatter"]).withMessage("Invalid chart type"),
  body("limit").optional().isInt({ min: 1, max: 1000 }).withMessage("Limit must be between 1 and 1000"),
  handleValidationErrors,
]

// 3D chart validation rules
const validate3DChartRequest = [
  body("xAxis").notEmpty().withMessage("X-axis is required"),
  body("yAxis").notEmpty().withMessage("Y-axis is required"),
  body("zAxis").optional().isString(),
  body("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
]

// Enhanced aggregate data validation rules
const validateAggregateRequest = [
  // For statistical charts, only column is required
  body().custom((value, { req }) => {
    const { chartType, column, groupBy, aggregateField } = req.body

    // For statistical charts (histogram, boxplot)
    if (chartType === "histogram" || chartType === "boxplot") {
      if (!column) {
        throw new Error("Column is required for statistical charts")
      }
      return true
    }

    // For regular aggregation charts
    if (!groupBy) {
      throw new Error("Group by field is required for aggregation charts")
    }
    if (!aggregateField) {
      throw new Error("Aggregate field is required for aggregation charts")
    }

    return true
  }),
  body("aggregateFunction")
    .optional()
    .isIn(["sum", "avg", "average", "count", "max", "min", "median", "std", "stddev"])
    .withMessage("Invalid aggregate function"),
  body("binCount").optional().isInt({ min: 5, max: 100 }).withMessage("Bin count must be between 5 and 100"),
  body("limit").optional().isInt({ min: 1, max: 10000 }).withMessage("Limit must be between 1 and 10000"),
  handleValidationErrors,
]

// Dataset ID validation
const validateDatasetId = [param("fileId").isMongoId().withMessage("Invalid dataset ID format"), handleValidationErrors]

module.exports = {
  validateChartRequest,
  validate3DChartRequest,
  validateAggregateRequest,
  validateDatasetId,
  handleValidationErrors,
}
