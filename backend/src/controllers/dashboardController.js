const dashboardService = require('../services/dashboardService');

class DashboardController {
  async getMetrics(req, res, next) {
    try {
      const metrics = await dashboardService.getDashboardMetrics();
      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
