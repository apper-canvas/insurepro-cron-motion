import { motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";

const StatCard = ({ title, value, trend, trendValue, icon, iconBg, gradient }) => {
  const isPositive = trend === "up";

  return (
    <motion.div
      whileHover={{ y: -4, shadow: "0 8px 16px rgba(0,0,0,0.1)" }}
      className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg || "bg-gradient-to-br from-primary-500 to-primary-600"}`}>
          <ApperIcon name={icon} size={24} className="text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            <ApperIcon name={isPositive ? "TrendingUp" : "TrendingDown"} size={14} />
            {trendValue}
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
      <p className={`text-3xl font-bold bg-gradient-to-r ${gradient || "from-primary-600 to-primary-800"} bg-clip-text text-transparent`}>
        {value}
      </p>
    </motion.div>
  );
};

export default StatCard;