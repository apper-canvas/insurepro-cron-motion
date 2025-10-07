import { useState } from "react";
import { motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";

const Header = ({ onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ApperIcon name="Menu" size={24} className="text-slate-700" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <ApperIcon name="Shield" size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              InsurePro
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors relative"
            >
              <ApperIcon name="Bell" size={22} className="text-slate-700" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
              >
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ApperIcon name="AlertTriangle" size={16} className="text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">High-Risk Claim Alert</p>
                        <p className="text-xs text-slate-600 mt-1">Claim #12845 flagged for review</p>
                        <p className="text-xs text-slate-400 mt-1">5 minutes ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ApperIcon name="FileText" size={16} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Policy Renewal Due</p>
                        <p className="text-xs text-slate-600 mt-1">15 policies expiring this week</p>
                        <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ApperIcon name="CheckCircle" size={16} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Claim Approved</p>
                        <p className="text-xs text-slate-600 mt-1">Claim #12820 processed successfully</p>
                        <p className="text-xs text-slate-400 mt-1">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">Sarah Johnson</p>
              <p className="text-xs text-slate-600">Senior Agent</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">SJ</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;