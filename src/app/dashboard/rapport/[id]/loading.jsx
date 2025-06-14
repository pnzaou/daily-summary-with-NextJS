const Loading = () => {
  return (
    <div className="mt-16 p-4 max-w-4xl mx-auto animate-pulse space-y-6">
      {/* Back link skeleton */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
      {/* General Info & Revenue summary skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 space-y-4"
          >
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/4"></div>
            </div>
          </div>
        ))}
      </div>
      {/* Sales list skeleton */}
      <section className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 space-y-4">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"
          ></div>
        ))}
      </section>
      {/* Debts & Reglements skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <section
            key={i}
            className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 space-y-4"
          >
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="flex justify-between">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              </div>
            ))}
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mt-4"></div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default Loading;
