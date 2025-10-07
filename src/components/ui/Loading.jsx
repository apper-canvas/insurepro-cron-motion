const Loading = () => {
  return (
    <div className="w-full h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="space-y-6 w-full max-w-4xl px-6">
        {/* Header Skeleton */}
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-lg w-1/3"></div>
          <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-2/3"></div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl p-6 shadow-sm space-y-3">
              <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-1/2"></div>
              <div className="h-8 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="animate-pulse bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div className="h-6 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-1/4"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;