import React from "react";

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {["Date", "Activité", "Ventes", "Total Cash", "Actions"].map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...Array(5)].map((_, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {[...Array(5)].map((__, colIdx) => (
                  <td key={colIdx} className="px-4 py-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
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
