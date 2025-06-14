import React from "react";

const Loading = () => {
  return (
    <div className="mt-16 p-4 animate-pulse">
      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 space-y-4"
          >
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Table Skeleton */}
      <div className="overflow-x-auto bg-gray-200 dark:bg-gray-700 rounded-lg">
        <table className="min-w-full">
          <thead>
            <tr>
              {["Date", "Activité", "Ventes", "Total Cash", "Actions"].map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-2 text-left text-sm font-medium text-gray-400 dark:text-gray-500"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, idx) => (
              <tr
                key={idx}
                className="border-t border-gray-300 dark:border-gray-600"
              >
                {Array(5)
                  .fill(null)
                  .map((__, j) => (
                    <td key={j} className="px-4 py-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Loading;
