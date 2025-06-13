import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChartHistory } from '../../contexts/ChartHistoryContext';
import { useChartDownload } from '../../contexts/ChartDownloadContext';
import { Download, ArrowLeft, Star, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';

const History = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const {
    history,
    stats,
    loading,
    error,
    getChartHistory,
    deleteChartHistory,
    toggleFavorite,
    getHistoryStats
  } = useChartHistory();
  const { downloadChartImage } = useChartDownload();

  useEffect(() => {
    if (fileId) {
      getChartHistory(fileId);
      getHistoryStats(fileId);
    }
  }, [fileId, getChartHistory, getHistoryStats]);

  const handleDownload = async (chart) => {
    try {
      await downloadChartImage(chart.chartConfig, {
        title: chart.title,
        format: 'png',
        width: 1200,
        height: 800
      });
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/analytics')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold">Chart History</h1>
        </div>
        {stats && (
          <div className="text-sm text-gray-600">
            Total Charts: {stats.totalCharts} | Favorites: {stats.totalFavorites}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : history.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">{item.title || 'Untitled Chart'}</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(item.createdAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(item)}
                    className="p-1.5 hover:bg-gray-100 rounded-full"
                    title="Download Chart"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => toggleFavorite(item._id, !item.isFavorite)}
                    className={`p-1.5 hover:bg-gray-100 rounded-full 
                      ${item.isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}
                    title="Toggle Favorite"
                  >
                    <Star size={16} />
                  </button>
                  <button
                    onClick={() => deleteChartHistory(item._id)}
                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <p className="text-gray-600">Type: {item.chartType}</p>
                {item.description && (
                  <p className="text-gray-500">{item.description}</p>
                )}
                {item.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No chart history found</p>
        </div>
      )}
    </div>
  );
};

export default History;