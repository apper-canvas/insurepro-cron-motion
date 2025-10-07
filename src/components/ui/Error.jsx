import ApperIcon from "@/components/ApperIcon";

const Error = ({ message = "Something went wrong", onRetry }) => {
  return (
    <div className="w-full h-[calc(100vh-200px)] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <ApperIcon name="AlertCircle" size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Oops! Something went wrong</h2>
        <p className="text-gray-600 mb-8">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <ApperIcon name="RotateCw" size={18} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default Error;