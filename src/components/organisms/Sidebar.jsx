import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import React from "react";
import ApperIcon from "@/components/ApperIcon";

const menuItems = [
    { path: "/dashboard", icon: "LayoutDashboard", label: "Dashboard" },
    { path: "/clients", icon: "Users", label: "Clients" },
    { path: "/policies", icon: "FileText", label: "Policies" },
    { path: "/claims", icon: "ClipboardList", label: "Claims" },
    { path: "/analytics", icon: "BarChart3", label: "Analytics" },
    { path: "/agent-performance", icon: "TrendingUp", label: "Agent Performance" },
];

const Sidebar = () => {
  return (
<aside className="hidden lg:block w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex-shrink-0">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md"
                  : "text-slate-700 hover:bg-slate-100"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <ApperIcon name={item.icon} size={20} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
              <ApperIcon name="Sparkles" size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">AI Assistant</p>
              <p className="text-xs text-slate-600">Ready to help</p>
            </div>
          </div>
          <button className="w-full px-3 py-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-sm font-medium rounded-lg hover:from-accent-600 hover:to-accent-700 transition-all duration-200 shadow-md hover:shadow-lg">
            Get Insights
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;