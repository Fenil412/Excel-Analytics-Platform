const ChartHistory = require('../models/ChartHistory');
const { validationResult } = require('express-validator');

class ChartHistoryController {
  // Save chart analysis to history
  static async saveChartHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { fileId } = req.params;
      const {
        chartType,
        chartConfig,
        chartData,
        analysisMetadata,
        title,
        description,
        tags
      } = req.body;

      const chartHistory = new ChartHistory({
        fileId,
        chartType,
        chartConfig,
        chartData,
        analysisMetadata,
        title: title || `${chartType} Chart - ${new Date().toLocaleDateString()}`,
        description: description || '',
        tags: tags || []
      });

      const savedHistory = await chartHistory.save();

      res.status(201).json({
        success: true,
        message: 'Chart analysis saved to history',
        data: savedHistory
      });
    } catch (error) {
      console.error('Error saving chart history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save chart history',
        error: error.message
      });
    }
  }

  // Get chart history for a specific file
  static async getChartHistory(req, res) {
    try {
      const { fileId } = req.params;
      const { 
        page = 1, 
        limit = 20, 
        chartType, 
        isFavorite,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = { fileId };
      
      if (chartType) {
        query.chartType = chartType;
      }
      
      if (isFavorite !== undefined) {
        query.isFavorite = isFavorite === 'true';
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [history, total] = await Promise.all([
        ChartHistory.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        ChartHistory.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          history,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching chart history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chart history',
        error: error.message
      });
    }
  }

  // Get specific chart history by ID
  static async getChartHistoryById(req, res) {
    try {
      const { historyId } = req.params;

      const history = await ChartHistory.findById(historyId);
      
      if (!history) {
        return res.status(404).json({
          success: false,
          message: 'Chart history not found'
        });
      }

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error fetching chart history by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chart history',
        error: error.message
      });
    }
  }

  // Update chart history (title, description, tags, favorite status)
  static async updateChartHistory(req, res) {
    try {
      const { historyId } = req.params;
      const { title, description, tags, isFavorite } = req.body;

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (tags !== undefined) updateData.tags = tags;
      if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
      updateData.updatedAt = new Date();

      const updatedHistory = await ChartHistory.findByIdAndUpdate(
        historyId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedHistory) {
        return res.status(404).json({
          success: false,
          message: 'Chart history not found'
        });
      }

      res.json({
        success: true,
        message: 'Chart history updated successfully',
        data: updatedHistory
      });
    } catch (error) {
      console.error('Error updating chart history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update chart history',
        error: error.message
      });
    }
  }

  // Delete chart history
  static async deleteChartHistory(req, res) {
    try {
      const { historyId } = req.params;

      const deletedHistory = await ChartHistory.findByIdAndDelete(historyId);

      if (!deletedHistory) {
        return res.status(404).json({
          success: false,
          message: 'Chart history not found'
        });
      }

      res.json({
        success: true,
        message: 'Chart history deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting chart history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete chart history',
        error: error.message
      });
    }
  }

  // Get chart history statistics
  static async getHistoryStats(req, res) {
    try {
      const { fileId } = req.params;

      const stats = await ChartHistory.aggregate([
        { $match: { fileId } },
        {
          $group: {
            _id: null,
            totalCharts: { $sum: 1 },
            favoriteCharts: {
              $sum: { $cond: [{ $eq: ['$isFavorite', true] }, 1, 0] }
            },
            chartTypeBreakdown: {
              $push: '$chartType'
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalCharts: 1,
            favoriteCharts: 1,
            chartTypeBreakdown: 1
          }
        }
      ]);

      // Count chart types
      const chartTypeCounts = {};
      if (stats.length > 0 && stats[0].chartTypeBreakdown) {
        stats[0].chartTypeBreakdown.forEach(type => {
          chartTypeCounts[type] = (chartTypeCounts[type] || 0) + 1;
        });
      }

      res.json({
        success: true,
        data: {
          totalCharts: stats.length > 0 ? stats[0].totalCharts : 0,
          favoriteCharts: stats.length > 0 ? stats[0].favoriteCharts : 0,
          chartTypeCounts
        }
      });
    } catch (error) {
      console.error('Error fetching history stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch history statistics',
        error: error.message
      });
    }
  }
}

module.exports = ChartHistoryController;