import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import StatCard from "@/components/molecules/StatCard";
import FormField from "@/components/molecules/FormField";
import Modal from "@/components/molecules/Modal";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import reserveService from "@/services/api/reserveService";
import claimService from "@/services/api/claimService";

const Reserves = () => {
  const [reserveData, setReserveData] = useState(null);
  const [reserveHistory, setReserveHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const [adjustmentForm, setAdjustmentForm] = useState({
    claimId: "",
    adjustmentType: "increase",
    adjustmentAmount: 0,
    reason: "",
    adjustedBy: "System Administrator"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [reserves, history, stats, claimsData] = await Promise.all([
        reserveService.calculateTotalReserves(),
        reserveService.getReserveHistory(),
        reserveService.getStatistics(),
        claimService.getAll()
      ]);
      setReserveData(reserves);
      setReserveHistory(history);
      setStatistics(stats);
      setClaims(claimsData);
    } catch (err) {
      setError(err.message || "Failed to load reserve data");
      toast.error("Failed to load reserve data");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustReserve = async (e) => {
    e.preventDefault();
    try {
      const claim = claims.find(c => c.Id === parseInt(adjustmentForm.claimId));
      if (!claim) {
        toast.error("Claim not found");
        return;
      }

      const currentReserve = claim.status === "Pending" 
        ? claim.amountRequested 
        : Math.max(0, claim.amountRequested - claim.amountApproved);

      const newReserve = adjustmentForm.adjustmentType === "increase"
        ? currentReserve + adjustmentForm.adjustmentAmount
        : currentReserve - adjustmentForm.adjustmentAmount;

      const adjustmentData = {
        ...adjustmentForm,
        claimId: parseInt(adjustmentForm.claimId),
        previousReserve: currentReserve,
        newReserve: Math.max(0, newReserve)
      };

      await reserveService.adjustReserve(adjustmentData);
      toast.success("Reserve adjusted successfully!");
      setShowAdjustmentModal(false);
      resetForm();
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to adjust reserve");
    }
  };

  const resetForm = () => {
    setAdjustmentForm({
      claimId: "",
      adjustmentType: "increase",
      adjustmentAmount: 0,
      reason: "",
      adjustedBy: "System Administrator"
    });
    setSelectedClaim(null);
  };

  const getRiskBadgeVariant = (fraudScore) => {
    if (fraudScore > 60) return "danger";
    if (fraudScore > 30) return "warning";
    return "success";
  };

  const getRiskLabel = (fraudScore) => {
    if (fraudScore > 60) return "HIGH RISK";
    if (fraudScore > 30) return "MEDIUM";
    return "LOW";
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadData} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Reserves</h1>
          <p className="text-slate-600">Track and manage outstanding claims liabilities</p>
        </div>
        <Button onClick={() => setShowAdjustmentModal(true)}>
          <ApperIcon name="DollarSign" size={20} />
          Adjust Reserve
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Outstanding Reserves"
          value={`$${reserveData?.totalReserve.toLocaleString() || 0}`}
          icon="Shield"
          trend={{ value: statistics?.netAdjustment || 0, isPositive: statistics?.netAdjustment >= 0 }}
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          title="High Risk Claims Reserve"
          value={`$${reserveData?.highRiskReserve.toLocaleString() || 0}`}
          icon="AlertTriangle"
          subtitle={`${Math.round((reserveData?.highRiskReserve / reserveData?.totalReserve) * 100) || 0}% of total`}
          gradient="from-red-500 to-red-600"
        />
        <StatCard
          title="Average Reserve per Claim"
          value={`$${reserveData?.averageReserve.toLocaleString() || 0}`}
          icon="TrendingUp"
          subtitle={`${reserveData?.claimsCount || 0} active claims`}
          gradient="from-green-500 to-green-600"
        />
        <StatCard
          title="Total Adjustments"
          value={statistics?.totalAdjustments || 0}
          icon="ArrowUpDown"
          subtitle={`${statistics?.increases || 0} increases, ${statistics?.decreases || 0} decreases`}
          gradient="from-purple-500 to-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Reserve by Status</h2>
            <ApperIcon name="PieChart" size={20} className="text-slate-400" />
          </div>
          <div className="space-y-3">
            {reserveData?.breakdown.byStatus && Object.entries(reserveData.breakdown.byStatus).map(([status, amount]) => (
              <div key={status} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={status === "Approved" ? "success" : status === "Denied" ? "danger" : "warning"}>
                    {status}
                  </Badge>
                  <span className="text-sm text-slate-600">
                    {Math.round((amount / reserveData.totalReserve) * 100)}% of total
                  </span>
                </div>
                <span className="font-semibold text-gray-900">${Math.round(amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Reserve by Risk Level</h2>
            <ApperIcon name="Shield" size={20} className="text-slate-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <Badge variant="danger">HIGH RISK</Badge>
                <span className="text-sm text-slate-600">
                  {Math.round((reserveData?.highRiskReserve / reserveData?.totalReserve) * 100)}% of total
                </span>
              </div>
              <span className="font-semibold text-gray-900">${reserveData?.highRiskReserve.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-3">
                <Badge variant="warning">MEDIUM</Badge>
                <span className="text-sm text-slate-600">
                  {Math.round((reserveData?.mediumRiskReserve / reserveData?.totalReserve) * 100)}% of total
                </span>
              </div>
              <span className="font-semibold text-gray-900">${reserveData?.mediumRiskReserve.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <Badge variant="success">LOW</Badge>
                <span className="text-sm text-slate-600">
                  {Math.round((reserveData?.lowRiskReserve / reserveData?.totalReserve) * 100)}% of total
                </span>
              </div>
              <span className="font-semibold text-gray-900">${reserveData?.lowRiskReserve.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Reserve Adjustment History</h2>
          <Badge variant="info">{reserveHistory.length} adjustments</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Claim ID</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">New Reserve</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Adjusted By</th>
              </tr>
            </thead>
            <tbody>
              {reserveHistory.map((adjustment) => (
                <tr key={adjustment.Id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-slate-600">
                    {format(new Date(adjustment.adjustedAt), "MMM dd, yyyy")}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">#{adjustment.claimId}</span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={adjustment.adjustmentType === "increase" ? "danger" : "success"}>
                      {adjustment.adjustmentType === "increase" ? "Increase" : "Decrease"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${adjustment.adjustmentType === "increase" ? "text-red-600" : "text-green-600"}`}>
                      {adjustment.adjustmentType === "increase" ? "+" : "-"}${adjustment.adjustmentAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900">${adjustment.newReserve.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{adjustment.adjustedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Outstanding Claims Detail</h2>
          <Badge variant="warning">{claims.filter(c => c.status === "Pending").length} pending</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Claim ID</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Requested</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Approved</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Reserve Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Risk</th>
              </tr>
            </thead>
            <tbody>
              {claims.filter(c => c.status !== "Denied").map((claim) => {
                const reserveAmount = claim.status === "Pending" 
                  ? claim.amountRequested 
                  : Math.max(0, claim.amountRequested - claim.amountApproved);
                const riskMultiplier = claim.fraudScore > 60 ? 1.2 : claim.fraudScore > 30 ? 1.1 : 1.0;
                const adjustedReserve = Math.round(reserveAmount * riskMultiplier);

                return (
                  <tr key={claim.Id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">#{claim.Id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={claim.status === "Approved" ? "success" : "warning"}>
                        {claim.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600">${claim.amountRequested.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-600">${claim.amountApproved.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900">${adjustedReserve.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getRiskBadgeVariant(claim.fraudScore)}>
                        {getRiskLabel(claim.fraudScore)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showAdjustmentModal}
        onClose={() => {
          setShowAdjustmentModal(false);
          resetForm();
        }}
        title="Adjust Reserve Amount"
        size="md"
      >
        <form onSubmit={handleAdjustReserve} className="space-y-4">
          <FormField
            label="Claim"
            type="select"
            required
            value={adjustmentForm.claimId}
            onChange={(e) => {
              const claim = claims.find(c => c.Id === parseInt(e.target.value));
              setAdjustmentForm({ ...adjustmentForm, claimId: e.target.value });
              setSelectedClaim(claim);
            }}
            options={[
              { value: "", label: "Select Claim" },
              ...claims.filter(c => c.status !== "Denied").map(c => ({
                value: c.Id,
                label: `#${c.Id} - ${c.description.substring(0, 50)}...`
              }))
            ]}
          />

          {selectedClaim && (
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Current Reserve:</span>
                <span className="font-semibold text-gray-900">
                  ${(selectedClaim.status === "Pending" 
                    ? selectedClaim.amountRequested 
                    : Math.max(0, selectedClaim.amountRequested - selectedClaim.amountApproved)
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Fraud Risk:</span>
                <Badge variant={getRiskBadgeVariant(selectedClaim.fraudScore)}>
                  {getRiskLabel(selectedClaim.fraudScore)} ({selectedClaim.fraudScore}%)
                </Badge>
              </div>
            </div>
          )}

          <FormField
            label="Adjustment Type"
            type="select"
            required
            value={adjustmentForm.adjustmentType}
            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustmentType: e.target.value })}
            options={[
              { value: "increase", label: "Increase Reserve" },
              { value: "decrease", label: "Decrease Reserve" }
            ]}
          />

          <FormField
            label="Adjustment Amount"
            type="number"
            required
            value={adjustmentForm.adjustmentAmount}
            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustmentAmount: parseFloat(e.target.value) })}
            placeholder="Enter adjustment amount"
          />

          <FormField
            label="Reason for Adjustment"
            type="textarea"
            required
            rows={3}
            value={adjustmentForm.reason}
            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
            placeholder="Explain why this adjustment is necessary..."
          />

          <FormField
            label="Adjusted By"
            type="text"
            required
            value={adjustmentForm.adjustedBy}
            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustedBy: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowAdjustmentModal(false)} type="button">
              Cancel
            </Button>
            <Button type="submit">
              <ApperIcon name="Save" size={18} />
              Save Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Reserves;