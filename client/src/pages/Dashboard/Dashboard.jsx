import { useState, useEffect } from "react"
import StatsCard from "./StatsCard"
import { FileSpreadsheet, Users, Database, BarChart3, PieChart, Activity } from "lucide-react"

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalRecords: 0,
    activeUsers: 0,
    processingTime: "0ms",
  })

  const [recentFiles, setRecentFiles] = useState([])

  useEffect(() => {
    // Simulate fetching dashboard data
    setStats({
      totalFiles: 156,
      totalRecords: 45678,
      activeUsers: 23,
      processingTime: "1.2s",
    })

    setRecentFiles([
      { id: 1, name: "Sales_Data_Q4.xlsx", size: "2.3 MB", uploadedAt: "2 hours ago", status: "processed" },
      { id: 2, name: "Employee_Records.xlsx", size: "1.8 MB", uploadedAt: "5 hours ago", status: "processing" },
      { id: 3, name: "Inventory_Report.xlsx", size: "3.1 MB", uploadedAt: "1 day ago", status: "processed" },
      { id: 4, name: "Financial_Summary.xlsx", size: "4.2 MB", uploadedAt: "2 days ago", status: "processed" },
    ])
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's an overview of your Excel analytics platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Files"
          value={stats.totalFiles}
          icon={FileSpreadsheet}
          trend="up"
          trendValue="+12%"
          color="blue"
        />
        <StatsCard
          title="Total Records"
          value={stats.totalRecords.toLocaleString()}
          icon={Database}
          trend="up"
          trendValue="+8%"
          color="green"
        />
        <StatsCard
          title="Active Users"
          value={stats.activeUsers}
          icon={Users}
          trend="up"
          trendValue="+3%"
          color="purple"
        />
        <StatsCard
          title="Avg Processing Time"
          value={stats.processingTime}
          icon={Activity}
          trend="down"
          trendValue="-15%"
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Placeholder 1 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Trends</h3>
            <BarChart3 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Chart will be rendered here</p>
          </div>
        </div>

        {/* Chart Placeholder 2 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">File Types Distribution</h3>
            <PieChart className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Chart will be rendered here</p>
          </div>
        </div>
      </div>

      {/* Recent Files */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Files</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{file.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {file.uploadedAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        file.status === "processed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                      }`}
                    >
                      {file.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
