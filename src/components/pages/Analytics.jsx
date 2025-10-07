import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Chart from "react-apexcharts";
import { format, subDays } from "date-fns";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import analyticsService from "@/services/api/analyticsService";

const Analytics = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("7");

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));
      const data = await analyticsService.getByDateRange(startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0]);
      setAnalytics(data);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadAnalytics} />;

  const premiumsChartOptions = {
    chart: { type: "area", toolbar: { show: false }, animations: { enabled: true, easing: "easeinout", speed: 800 } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 } },
    colors: ["#1e3a8a", "#0d9488"],
    xaxis: { categories: analytics.map(a => format(new Date(a.date), "MMM dd")), labels: { style: { colors: "#64748b" } } },
    yaxis: { labels: { style: { colors: "#64748b" }, formatter: (val) => `$${(val / 1000).toFixed(0)}K` } },
    grid: { borderColor: "#e2e8f0", strokeDashArray: 4 },
    legend: { position: "top", horizontalAlign: "left", labels: { colors: "#475569" } },
    tooltip: { theme: "light", y: { formatter: (val) => `$${val.toLocaleString()}` } }
  };

  const premiumsSeries = [
    { name: "Total Premiums", data: analytics.map(a => a.totalPremiums) },
    { name: "Total Claims", data: analytics.map(a => a.totalClaims) }
  ];

  const lossRatioChartOptions = {
    chart: { type: "line", toolbar: { show: false }, animations: { enabled: true } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    colors: ["#f59e0b"],
    xaxis: { categories: analytics.map(a => format(new Date(a.date), "MMM dd")), labels: { style: { colors: "#64748b" } } },
    yaxis: { labels: { style: { colors: "#64748b" }, formatter: (val) => `${(val * 100).toFixed(1)}%` }, min: 0, max: 0.5 },
    grid: { borderColor: "#e2e8f0", strokeDashArray: 4 },
    markers: { size: 4, strokeWidth: 2, fillOpacity: 1 },
    tooltip: { theme: "light", y: { formatter: (val) => `${(val * 100).toFixed(1)}%` } }
  };

  const lossRatioSeries = [{ name: "Loss Ratio", data: analytics.map(a => a.lossRatio) }];

  const policiesChartOptions = {
    chart: { type: "bar", toolbar: { show: false }, animations: { enabled: true } },
    plotOptions: { bar: { borderRadius: 8, columnWidth: "60%", distributed: false } },
    dataLabels: { enabled: false },
    colors: ["#1e3a8a"],
    xaxis: { categories: analytics.map(a => format(new Date(a.date), "MMM dd")), labels: { style: { colors: "#64748b" } } },
    yaxis: { labels: { style: { colors: "#64748b" } } },
    grid: { borderColor: "#e2e8f0", strokeDashArray: 4 },
    tooltip: { theme: "light" }
  };

  const policiesSeries = [{ name: "Active Policies", data: analytics.map(a => a.activePolicies) }];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-slate-600">Real-time business intelligence and insights</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2.5 rounded-lg border-2 border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <ApperIcon name="DollarSign" size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Premiums</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                ${(analytics[analytics.length - 1]?.totalPremiums / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <ApperIcon name="FileText" size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Active Policies</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                {analytics[analytics.length - 1]?.activePolicies}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
              <ApperIcon name="TrendingDown" size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Loss Ratio</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                {(analytics[analytics.length - 1]?.lossRatio * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Premium & Claims Trends</h2>
        <Chart options={premiumsChartOptions} series={premiumsSeries} type="area" height={350} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Loss Ratio Analysis</h2>
          <Chart options={lossRatioChartOptions} series={lossRatioSeries} type="line" height={300} />
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Active Policies Growth</h2>
          <Chart options={policiesChartOptions} series={policiesSeries} type="bar" height={300} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;