const express = require("express")
const router = express.Router()
const {
  validateChartRequest,
  validate3DChartRequest,
  validateAggregateRequest,
  validateDatasetId,
} = require("../middleware/validation")
const ChartController = require("../controllers/charts")


router.get("/headers/:fileId", validateDatasetId, ChartController.columnHeader);
router.post("/chart-data/:fileId", validateDatasetId, validateChartRequest, ChartController.chartData);
router.post("/chart-3d/:fileId", validateDatasetId, validate3DChartRequest, ChartController.chart3DData);
router.post("/chart-aggregate/:fileId", validateDatasetId, validateAggregateRequest, ChartController.aggregateData);
router.get("/datasets", ChartController.getAllDatasets);

module.exports = router