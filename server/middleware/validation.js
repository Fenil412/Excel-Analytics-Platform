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

// Aggregate data validation rules
const validateAggregateRequest = [
  body("groupBy").notEmpty().withMessage("Group by field is required"),
  body("aggregateField").notEmpty().withMessage("Aggregate field is required"),
  body("aggregateFunction")
    .optional()
    .isIn(["sum", "avg", "count", "max", "min"])
    .withMessage("Invalid aggregate function"),
  handleValidationErrors,
]

// Dataset ID validation
const validateDatasetId = [
  param("fileId")
  .isMongoId()
  .withMessage("Invalid dataset ID format"),
handleValidationErrors,
]

module.exports = {
  validateChartRequest,
  validate3DChartRequest,
  validateAggregateRequest,
  validateDatasetId,
  handleValidationErrors,
}
