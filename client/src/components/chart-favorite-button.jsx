"use client"

import { Star } from "lucide-react"
import { useChartHistory } from "../contexts/ChartHistoryContext"
import { useState, useEffect } from "react"

// In chart-favorite-button.jsx
const ChartFavoriteButton = ({ chartId, initialIsFavorite = false, disabled = false }) => {
  const { toggleFavorite, loading } = useChartHistory();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  const handleToggleFavorite = async () => {
    if (disabled || !chartId || loading) return;

    try {
      const newFavoriteState = !isFavorite;
      setIsFavorite(newFavoriteState);
      
      const result = await toggleFavorite(chartId);
      
      if (!result) {
        setIsFavorite(!newFavoriteState);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      setIsFavorite(isFavorite);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={disabled || loading || !chartId}
      className={`p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors
        ${isFavorite ? "text-yellow-500" : "text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"}`}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star size={16} className={isFavorite ? "fill-yellow-500" : ""} />
    </button>
  );
};

export default ChartFavoriteButton
