const express = require('express');
const { body, param, query } = require('express-validator');
const ChartHistoryController = require('../controllers/ChartHistoryController');
const { validateDatasetId } = require('../middleware/validation'); // Assuming you have this

const router = express.Router();

// Validation middleware for chart history
const validateChartHistory = [
  body('chartType')
    .isIn(['bar', 'line', 'pie', 'scatter', 'area', '3d-bar', '3d-line', '3d-scatter', 'aggregate'])
    .withMessage('Invalid chart type'),
  body('chartConfig')
    .isObject()
    .withMessage('Chart configuration must be an object'),
  body('chartData')
    .isObject()
    .withMessage('Chart data must be an object'),
  body('title')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Title must be a string with maximum 200 characters'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Description must be a string with maximum 1000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

const validateHistoryUpdate = [
  body('title')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Title must be a string with maximum 200 characters'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Description must be a string with maximum 1000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite must be a boolean')
];

const validateHistoryQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('chartType')
    .optional()
    .isIn(['bar', 'line', 'pie', 'scatter', 'area', '3d-bar', '3d-line', '3d-scatter', 'aggregate'])
    .withMessage('Invalid chart type'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title', 'chartType'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Routes
router.post('/history/:fileId', validateDatasetId, validateChartHistory, ChartHistoryController.saveChartHistory);
router.get('/history/:fileId', validateDatasetId, validateHistoryQuery, ChartHistoryController.getChartHistory);
router.get('/history/:fileId/stats', validateDatasetId, ChartHistoryController.getHistoryStats);
router.get('/history-iteam/:historyId', param('historyId').isMongoId(), ChartHistoryController.getChartHistoryById);
router.put('/history-iteam/:historyId', param('historyId').isMongoId(), validateHistoryUpdate, ChartHistoryController.updateChartHistory);
router.delete('/history-iteam/:historyId', param('historyId').isMongoId(), ChartHistoryController.deleteChartHistory);

module.exports = router;