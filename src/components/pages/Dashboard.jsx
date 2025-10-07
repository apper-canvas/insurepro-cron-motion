import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { format } from "date-fns";
import ApperIcon from "@/components/ApperIcon";
import StatCard from "@/components/molecules/StatCard";
import Badge from "@/components/atoms/Badge";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import analyticsService from "@/services/api/analyticsService";
import policyService from "@/services/api/policyService";
import claimService from "@/services/api/claimService";
import clientService from "@/services/api/clientService";

const Dashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [expiringPolicies, setExpiringPolicies] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topAgents, setTopAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [metricsData, policies, claims, clients, topPerformers] = await Promise.all([
        analyticsService.getCurrentMetrics(),
        policyService.getAll(),
        claimService.getAll(),
        clientService.getAll(),
        (async () => {
          try {
            const { default: agentPerformanceService } = await import("@/services/api/agentPerformanceService");
            return await agentPerformanceService.getTopPerformers(3);
          } catch {
            return [];
          }
        })()
      ]);

setMetrics(metricsData);
      setTopAgents(topPerformers);

      const expiring = policies
        .filter(p => p.status === "Expiring" || new Date(p.endDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
        .slice(0, 5);
      setExpiringPolicies(expiring);

      const pending = claims.filter(c => c.status === "Pending").slice(0, 5);
      setPendingClaims(pending);

      const activities = [
        ...claims.slice(0, 3).map(c => ({
          type: "claim",
          icon: "ClipboardList",
          title: `Claim ${c.status}`,
          description: `Claim #${c.Id} - $${c.amountRequested.toLocaleString()}`,
          timestamp: c.submittedAt,
          status: c.status
        })),
        ...policies.slice(0, 2).map(p => ({
          type: "policy",
          icon: "FileText",
          title: "Policy Created",
          description: `${p.type} - ${p.policyNumber}`,
          timestamp: p.createdAt,
          status: p.status
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
      setRecentActivity(activities);

    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadDashboardData} />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-slate-600">Monitor your insurance operations at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Premiums"
          value={`$${(metrics.totalPremiums / 1000).toFixed(0)}K`}
          trend={parseFloat(metrics.premiumsChange) >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(metrics.premiumsChange)}%`}
          icon="DollarSign"
          iconBg="bg-gradient-to-br from-green-500 to-green-600"
          gradient="from-green-600 to-green-800"
        />
        <StatCard
          title="Active Policies"
          value={metrics.activePolicies}
          trend={parseFloat(metrics.policiesChange) >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(metrics.policiesChange)}%`}
          icon="FileText"
          iconBg="bg-gradient-to-br from-primary-500 to-primary-600"
          gradient="from-primary-600 to-primary-800"
        />
        <StatCard
          title="Pending Claims"
          value={pendingClaims.length}
          icon="Clock"
          iconBg="bg-gradient-to-br from-amber-500 to-amber-600"
          gradient="from-amber-600 to-amber-800"
        />
        <StatCard
          title="Loss Ratio"
          value={`${metrics.lossRatio}%`}
          trend={parseFloat(metrics.lossRatioChange) <= 0 ? "up" : "down"}
          trendValue={`${Math.abs(metrics.lossRatioChange)}%`}
          icon="TrendingDown"
          iconBg="bg-gradient-to-br from-secondary-500 to-secondary-600"
          gradient="from-secondary-600 to-secondary-800"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Expiring Policies</h2>
            <button
              onClick={() => navigate("/policies")}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {expiringPolicies.map((policy) => (
              <div key={policy.Id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                    <ApperIcon name="Calendar" size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{policy.policyNumber}</p>
                    <p className="text-sm text-slate-600">{policy.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(policy.endDate), "MMM dd, yyyy")}
                  </p>
                  <Badge variant="warning">Expiring</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Fraud Alerts</h2>
            <button
              onClick={() => navigate("/claims")}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {pendingClaims
              .filter(c => c.fraudScore > 30)
              .slice(0, 5)
              .map((claim) => {
                const riskLevel = claim.fraudScore > 60 ? "high" : claim.fraudScore > 30 ? "medium" : "low";
                const riskColor = riskLevel === "high" ? "red" : riskLevel === "medium" ? "amber" : "green";
                
                return (
                  <div key={claim.Id} className={`flex items-center justify-between p-3 bg-${riskColor}-50 rounded-lg border border-${riskColor}-200 hover:bg-${riskColor}-100 transition-colors`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br from-${riskColor}-500 to-${riskColor}-600 rounded-lg flex items-center justify-center`}>
                        <ApperIcon name="AlertTriangle" size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Claim #{claim.Id}</p>
                        <p className="text-sm text-slate-600">${claim.amountRequested.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">Risk: {claim.fraudScore}%</p>
                      <Badge variant={riskLevel === "high" ? "danger" : "warning"}>
                        {riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
</div>

      {topAgents.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Top Performing Agents</h2>
            <button
              onClick={() => navigate("/agent-performance")}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topAgents.map((agent, index) => (
              <div key={agent.Id} className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all">
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow">
                  #{index + 1}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                    {agent.agentName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{agent.agentName}</p>
                    <p className="text-xs text-slate-600">{agent.specialization}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Revenue:</span>
                    <span className="font-semibold text-gray-900">${(agent.totalRevenue / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Policies:</span>
                    <span className="font-semibold text-gray-900">{agent.policiesSold}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Satisfaction:</span>
                    <span className="font-semibold text-gray-900">{agent.clientSatisfaction}/5.0</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <ApperIcon name={activity.icon} size={20} className="text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-slate-600">{activity.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm text-slate-600">
                  {format(new Date(activity.timestamp), "MMM dd, HH:mm")}
                </p>
                <Badge variant={activity.status === "Approved" ? "success" : activity.status === "Denied" ? "danger" : "warning"}>
                  {activity.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;