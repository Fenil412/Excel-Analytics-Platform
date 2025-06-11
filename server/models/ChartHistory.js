const mongoose = require('mongoose');

const chartHistorySchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    index: true
  },
  chartType: {
    type: String,
    required: true,
    enum: ['bar', 'line', 'pie', 'scatter', 'area', '3d-bar', '3d-line', '3d-scatter', 'aggregate']
  },
  chartConfig: {
    type: Object,
    required: true
  },
  chartData: {
    type: Object,
    required: true
  },
  analysisMetadata: {
    xAxis: String,
    yAxis: [String],
    zAxis: String,
    aggregationType: String,
    groupBy: String,
    filters: Object,
    dateRange: {
      start: Date,
      end: Date
    }
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  isFavorite: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
chartHistorySchema.index({ fileId: 1, createdAt: -1 });
chartHistorySchema.index({ fileId: 1, chartType: 1 });
chartHistorySchema.index({ fileId: 1, isFavorite: 1 });

module.exports = mongoose.model('ChartHistory', chartHistorySchema);