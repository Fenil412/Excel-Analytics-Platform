const ChartHistory = require('../models/ChartHistory');

// Middleware to automatically save successful chart requests to history
const autoSaveToHistory = (chartType) => {
  return async (req, res, next) => {
    // Store original res.json method
    const originalJson = res.json;
    
    // Override res.json to intercept successful responses
    res.json = function(data) {
      // Only save to history if the response is successful and contains chart data
      if (data && data.success && data.data && req.body.saveToHistory !== false) {
        // Don't await this to avoid blocking the response
        saveToHistoryAsync(req, chartType, data.data).catch(error => {
          console.error('Error auto-saving to history:', error);
        });
      }
      
      // Call original res.json
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Async function to save chart data to history
async function saveToHistoryAsync(req, chartType, responseData) {
  try {
    const { fileId } = req.params;
    const { title, description, tags, ...chartConfig } = req.body;

    // Create chart history entry
    const chartHistory = new ChartHistory({
      fileId,
      chartType,
      chartConfig: responseData.chartConfig,
      chartData: responseData.chartData,
      analysisMetadata: extractAnalysisMetadata(req.body, chartType),
      title: title || `Auto-saved ${chartType} Chart - ${new Date().toLocaleDateString()}`,
      description: description || 'Automatically saved chart analysis',
      tags: tags || []
    });

    await chartHistory.save();
  } catch (error) {
    // Log error but don't throw to avoid affecting the main response
    console.error('Failed to auto-save chart to history:', error);
  }
}

// Extract analysis metadata from request body based on chart type
function extractAnalysisMetadata(body, chartType) {
  const metadata = {};

  // Common fields
  if (body.xAxis) metadata.xAxis = body.xAxis;
  if (body.yAxis) metadata.yAxis = body.yAxis;
  if (body.zAxis) metadata.zAxis = body.zAxis;
  if (body.filters) metadata.filters = body.filters;

  // Chart type specific fields
  switch (chartType) {
    case 'aggregate':
      if (body.aggregationType) metadata.aggregationType = body.aggregationType;
      if (body.groupBy) metadata.groupBy = body.groupBy;
      break;
    case '3d-bar':
    case '3d-line':
    case '3d-scatter':
      if (body.zAxis) metadata.zAxis = body.zAxis;
      break;
  }

  // Date range if present
  if (body.startDate && body.endDate) {
    metadata.dateRange = {
      start: new Date(body.startDate),
      end: new Date(body.endDate)
    };
  }

  return metadata;
}

// Middleware to check if user has permission to access chart history
const checkHistoryPermission = async (req, res, next) => {
  try {
    // Add your permission logic here
    // For now, allowing all requests
    // You might want to check user ownership of the fileId
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Access denied to chart history'
    });
  }
};

module.exports = {
  autoSaveToHistory,
  checkHistoryPermission
};