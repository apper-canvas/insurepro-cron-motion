import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import StatCard from "@/components/molecules/StatCard";
import Badge from "@/components/atoms/Badge";
import SearchBar from "@/components/molecules/SearchBar";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import agentPerformanceService from "@/services/api/agentPerformanceService";

const AgentPerformance = () => {
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMetric, setFilterMetric] = useState("revenue");

  useEffect(() => {
    loadAgentPerformance();
  }, []);

  useEffect(() => {
    filterAgents();
  }, [searchTerm, filterMetric, agents]);

  const loadAgentPerformance = async () => {
    try {
      setLoading(true);
      setError("");

      const [agentsData, topPerformersData] = await Promise.all([
        agentPerformanceService.getAll(),
        agentPerformanceService.getTopPerformers(3)
      ]);

      setAgents(agentsData);
      setFilteredAgents(agentsData);
      setTopPerformers(topPerformersData);
    } catch (err) {
      setError(err.message || "Failed to load agent performance data");
      toast.error("Failed to load agent performance data");
    } finally {
      setLoading(false);
    }
  };

  const filterAgents = async () => {
    try {
      let filtered = [...agents];

      if (searchTerm) {
        filtered = await agentPerformanceService.searchByName(searchTerm);
      }

      if (filterMetric && filterMetric !== "all") {
        filtered = await agentPerformanceService.getByMetric(filterMetric, "desc");
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filtered = filtered.filter(a => a.agentName.toLowerCase().includes(term));
        }
      }

      setFilteredAgents(filtered);
    } catch (err) {
      toast.error("Failed to filter agents");
    }
  };

  const getSatisfactionBadge = (score) => {
    if (score >= 4.7) return { variant: "success", text: "Excellent" };
    if (score >= 4.4) return { variant: "primary", text: "Good" };
    if (score >= 4.0) return { variant: "warning", text: "Average" };
    return { variant: "danger", text: "Needs Improvement" };
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadAgentPerformance} />;

  const totalAgents = agents.length;
  const avgSatisfaction = (agents.reduce((sum, a) => sum + a.clientSatisfaction, 0) / totalAgents).toFixed(1);
  const totalRevenue = agents.reduce((sum, a) => sum + a.totalRevenue, 0);
  const totalPolicies = agents.reduce((sum, a) => sum + a.policiesSold, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Performance</h1>
        <p className="text-slate-600">Track and analyze agent metrics including policies, revenue, and client satisfaction</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Agents"
          value={totalAgents}
          icon="Users"
          iconBg="bg-gradient-to-br from-primary-500 to-primary-600"
          gradient="from-primary-600 to-primary-800"
        />
        <StatCard
          title="Total Revenue"
          value={`$${(totalRevenue / 1000).toFixed(0)}K`}
          icon="DollarSign"
          iconBg="bg-gradient-to-br from-green-500 to-green-600"
          gradient="from-green-600 to-green-800"
        />
        <StatCard
          title="Total Policies"
          value={totalPolicies}
          icon="FileText"
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
          gradient="from-blue-600 to-blue-800"
        />
        <StatCard
          title="Avg Satisfaction"
          value={`${avgSatisfaction}/5.0`}
          icon="Star"
          iconBg="bg-gradient-to-br from-amber-500 to-amber-600"
          gradient="from-amber-600 to-amber-800"
        />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPerformers.map((agent, index) => (
            <div key={agent.Id} className="relative bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border-2 border-primary-200">
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                #{index + 1}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {agent.agentName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{agent.agentName}</p>
                  <p className="text-sm text-slate-600">{agent.specialization}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Revenue:</span>
                  <span className="font-semibold text-gray-900">${(agent.totalRevenue / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Policies:</span>
                  <span className="font-semibold text-gray-900">{agent.policiesSold}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Satisfaction:</span>
                  <span className="font-semibold text-gray-900">{agent.clientSatisfaction}/5.0</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search agents by name..."
            />
          </div>
          <select
            value={filterMetric}
            onChange={(e) => setFilterMetric(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Agents</option>
            <option value="revenue">Sort by Revenue</option>
            <option value="policies">Sort by Policies</option>
            <option value="satisfaction">Sort by Satisfaction</option>
            <option value="clients">Sort by Active Clients</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAgents.map((agent) => {
            const satisfactionBadge = getSatisfactionBadge(agent.clientSatisfaction);
            
            return (
              <div key={agent.Id} className="border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {agent.agentName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{agent.agentName}</h3>
                      <p className="text-sm text-slate-600">{agent.specialization}</p>
                      <p className="text-xs text-slate-500">{agent.region}</p>
                    </div>
                  </div>
                  <Badge variant={satisfactionBadge.variant}>{satisfactionBadge.text}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ApperIcon name="DollarSign" size={16} className="text-green-600" />
                      <span className="text-xs font-medium text-slate-600">Revenue</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">${(agent.totalRevenue / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ApperIcon name="FileText" size={16} className="text-blue-600" />
                      <span className="text-xs font-medium text-slate-600">Policies</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{agent.policiesSold}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Client Satisfaction:</span>
                    <span className="font-semibold text-gray-900">{agent.clientSatisfaction}/5.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Active Clients:</span>
                    <span className="font-semibold text-gray-900">{agent.activeClients}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Claims Handled:</span>
                    <span className="font-semibold text-gray-900">{agent.claimsHandled}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Avg Response Time:</span>
                    <span className="font-semibold text-gray-900">{agent.avgResponseTime}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAgents.length === 0 && (
          <div className="text-center py-12">
            <ApperIcon name="Users" size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No agents found matching your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentPerformance;