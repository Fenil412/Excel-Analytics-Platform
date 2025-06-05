import { useState, useEffect } from "react";
import StatsCard from "./StatsCard";
import {
  FileSpreadsheet,
  Users,
  Database,
  BarChart3,
  PieChart,
  Activity,
  Eye,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useExcel } from "../../contexts/ExcelContext";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalRecords: 0,
    activeUsers: 0,
    processingTime: "0ms",
  });

  const { files, fetchFiles, loading, error, deleteFile } = useExcel();
  const { user } = useAuth();
  const username = user?.username || "User";

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Loading...";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    if (diffHours > 0)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffMinutes > 0)
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;

    return "Just now";
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        await deleteFile(fileId, username);
        // Files will be automatically updated by the context
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }
  };

  useEffect(() => {
    fetchFiles(username).catch(console.error);
  }, [username]);

  useEffect(() => {
    setStats({
      totalFiles: files.length,
      totalRecords: files.reduce(
        (sum, file) => sum + (file.metadata?.totalRows || 0),
        0
      ),
      activeUsers: 1,
      processingTime: "1.2s",
    });
  }, [files]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's an overview of your Excel analytics platform.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Files"
          value={files.length}
          icon={FileSpreadsheet}
          trend="up"
          trendValue="+12%"
          color="blue"
        />
        <StatsCard
          title="Total Records"
          value={files
            .reduce((sum, file) => sum + (file.metadata?.totalRows || 0), 0)
            .toLocaleString()}
          icon={Database}
          trend="up"
          trendValue="+8%"
          color="green"
        />
        <StatsCard
          title="Total Sheets"
          value={files.reduce(
            (sum, file) => sum + (file.metadata?.sheetNames?.length || 0),
            0
          )}
          icon={PieChart}
          trend="up"
          trendValue="+3%"
          color="purple"
        />
        <StatsCard
          title="Avg File Size"
          value={
            files.length > 0
              ? formatFileSize(
                  files.reduce(
                    (sum, file) => sum + (file.metadata?.fileSize || 0),
                    0
                  ) / files.length
                )
              : "0 MB"
          }
          icon={Activity}
          trend="down"
          trendValue="-15%"
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Types Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              File Types
            </h3>
            <BarChart3 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="space-y-3">
            {files.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Excel Files (.xlsx)
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {
                      files.filter((f) => f.originalName.endsWith(".xlsx"))
                        .length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Legacy Excel (.xls)
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {
                      files.filter((f) => f.originalName.endsWith(".xls"))
                        .length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    CSV Files
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {
                      files.filter((f) => f.originalName.endsWith(".csv"))
                        .length
                    }
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No files uploaded yet
              </p>
            )}
          </div>
        </div>

        {/* Upload Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upload Statistics
            </h3>
            <PieChart className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total Size
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatFileSize(
                  files.reduce(
                    (sum, file) => sum + (file.metadata?.fileSize || 0),
                    0
                  )
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Largest File
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {files.length > 0
                  ? formatFileSize(
                      Math.max(...files.map((f) => f.metadata?.fileSize || 0))
                    )
                  : "0 MB"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Avg Sheets per File
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {files.length > 0
                  ? Math.round(
                      files.reduce(
                        (sum, file) =>
                          sum + (file.metadata?.sheetNames?.length || 0),
                        0
                      ) / files.length
                    )
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Files */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Files ({files.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          {files.length > 0 ? (
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
                    Sheets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tick
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {files.map((file) => (
                  <tr
                    key={file._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileSpreadsheet className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {file.originalName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.metadata?.fileSize || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {file.metadata?.sheetNames?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {file.metadata?.totalRows?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(file?.uploadTime)}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            window.open(file.downloadUrl, "_blank")
                          }
                          className="text-blue-600 hover:underline dark:text-blue-400"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file._id)}
                          className="text-red-600 hover:underline dark:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center">
              <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No files uploaded yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
