import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import SearchBar from '@/components/molecules/SearchBar';
import Select from '@/components/atoms/Select';
import Modal from '@/components/molecules/Modal';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import Empty from '@/components/ui/Empty';
import claimService from '@/services/api/claimService';
import policyService from '@/services/api/policyService';
import clientService from '@/services/api/clientService';

const ApprovalWorkflows = () => {
  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [clients, setClients] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [actionReason, setActionReason] = useState("");

  // Simulated user role - in production, this would come from auth context
  const [userRole] = useState("L2_APPROVER"); // L1_APPROVER, L2_APPROVER, L3_APPROVER

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterClaims();
  }, [claims, searchQuery, levelFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [claimsData, policiesData, clientsData] = await Promise.all([
        claimService.getAll(),
        policyService.getAll(),
        clientService.getAll()
      ]);
      setClaims(claimsData);
      setPolicies(policiesData);
      setClients(clientsData);
    } catch (err) {
      setError(err.message || "Failed to load data");
      toast.error(err.message || "Failed to load workflow data");
    } finally {
      setLoading(false);
    }
  };

  const filterClaims = () => {
    let filtered = [...claims];

    // Filter by workflow status
    if (statusFilter !== "All") {
      if (statusFilter === "Pending") {
        filtered = filtered.filter(c => 
          c.status === "Pending L1" || 
          c.status === "Pending L2" || 
          c.status === "Pending L3"
        );
      } else {
        filtered = filtered.filter(c => c.status === statusFilter);
      }
    }

    // Filter by approval level
    if (levelFilter !== "All") {
      filtered = filtered.filter(c => c.workflowLevel === levelFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(claim =>
        claim.Id.toString().includes(query) ||
        getClientName(claim.clientId).toLowerCase().includes(query) ||
        getPolicyNumber(claim.policyId).toLowerCase().includes(query)
      );
    }

    setFilteredClaims(filtered);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.Id === parseInt(clientId));
    return client ? client.name : "Unknown Client";
  };

  const getPolicyNumber = (policyId) => {
    const policy = policies.find(p => p.Id === parseInt(policyId));
    return policy ? policy.policyNumber : "Unknown Policy";
  };

  const getRiskLevel = (score, confidence) => {
    const isHighConfidence = confidence >= 70;
    if (score > 60) return { 
      level: "high", 
      color: "red", 
      label: isHighConfidence ? "HIGH RISK" : "PROBABLE RISK" 
    };
    if (score > 30) return { 
      level: "medium", 
      color: "amber", 
      label: isHighConfidence ? "MEDIUM RISK" : "POSSIBLE RISK" 
    };
    return { level: "low", color: "green", label: "LOW RISK" };
  };

  const canUserApprove = (claim) => {
    if (claim.status === "Pending L1" && userRole === "L1_APPROVER") return true;
    if (claim.status === "Pending L2" && (userRole === "L2_APPROVER" || userRole === "L3_APPROVER")) return true;
    if (claim.status === "Pending L3" && userRole === "L3_APPROVER") return true;
    return false;
  };

  const getWorkflowLevelBadge = (level) => {
    const levelMap = {
      "L1": { variant: "success", label: "Level 1" },
      "L2": { variant: "warning", label: "Level 2" },
      "L3": { variant: "danger", label: "Level 3" }
    };
    return levelMap[level] || { variant: "default", label: level };
  };

  const handleApprove = async (claimId) => {
    if (!actionReason.trim()) {
      toast.error("Please provide approval reason");
      return;
    }

    try {
      await claimService.approveWorkflow(claimId, userRole, actionReason);
      const claim = claims.find(c => c.Id === claimId);
      toast.success(`Claim #${claimId} approved at ${claim.workflowLevel}`);
      setShowDetailModal(false);
      setActionReason("");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to approve claim");
    }
  };

  const handleDeny = async (claimId) => {
    if (!actionReason.trim()) {
      toast.error("Please provide denial reason");
      return;
    }

    try {
      await claimService.denyWorkflow(claimId, userRole, actionReason);
      toast.success(`Claim #${claimId} denied`);
      setShowDetailModal(false);
      setActionReason("");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to deny claim");
    }
  };

  const handleEscalate = async (claimId) => {
    if (!actionReason.trim()) {
      toast.error("Please provide escalation reason");
      return;
    }

    try {
      await claimService.escalateWorkflow(claimId, userRole, actionReason);
      toast.success(`Claim #${claimId} escalated to next level`);
      setShowDetailModal(false);
      setActionReason("");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to escalate claim");
    }
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approval Workflows</h1>
          <p className="text-slate-600 mt-1">Multi-level claim approval management</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info" className="text-lg px-4 py-2">
            <ApperIcon name="Shield" size={20} className="mr-2" />
            {userRole.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending L1</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">
                {claims.filter(c => c.status === "Pending L1").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <ApperIcon name="Clock" size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending L2</p>
              <p className="text-3xl font-bold text-amber-700 mt-1">
                {claims.filter(c => c.status === "Pending L2").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <ApperIcon name="AlertCircle" size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending L3</p>
              <p className="text-3xl font-bold text-red-700 mt-1">
                {claims.filter(c => c.status === "Pending L3").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <ApperIcon name="AlertTriangle" size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Approved</p>
              <p className="text-3xl font-bold text-green-700 mt-1">
                {claims.filter(c => c.status === "Approved").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <ApperIcon name="CheckCircle" size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by Claim ID, Client, or Policy..."
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "All", label: "All Statuses" },
              { value: "Pending", label: "All Pending" },
              { value: "Pending L1", label: "Pending L1" },
              { value: "Pending L2", label: "Pending L2" },
              { value: "Pending L3", label: "Pending L3" },
              { value: "Approved", label: "Approved" },
              { value: "Denied", label: "Denied" }
            ]}
          />
          <Select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            options={[
              { value: "All", label: "All Levels" },
              { value: "L1", label: "Level 1" },
              { value: "L2", label: "Level 2" },
              { value: "L3", label: "Level 3" }
            ]}
          />
        </div>
      </div>

      {/* Workflows Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredClaims.length === 0 ? (
          <Empty message="No workflows found matching your criteria" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Claim ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Workflow Level</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Risk Assessment</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Submitted</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => {
                  const risk = getRiskLevel(claim.fraudScore, claim.confidenceLevel || 0);
                  const levelBadge = getWorkflowLevelBadge(claim.workflowLevel);
                  const userCanApprove = canUserApprove(claim);

                  return (
                    <tr key={claim.Id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">#{claim.Id}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{getClientName(claim.clientId)}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">${claim.amountRequested.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={levelBadge.variant}>{levelBadge.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={risk.level === "high" ? "danger" : risk.level === "medium" ? "warning" : "success"}>
                            {risk.label}
                          </Badge>
                          <span className="text-sm text-slate-600">{claim.fraudScore}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          claim.status === "Approved" ? "success" : 
                          claim.status === "Denied" ? "danger" : 
                          "warning"
                        }>
                          {claim.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm">
                        {format(new Date(claim.submittedAt), "MMM dd, yyyy")}
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedClaim(claim);
                            setShowDetailModal(true);
                            setActionReason("");
                          }}
                        >
                          <ApperIcon name={userCanApprove ? "CheckSquare" : "Eye"} size={16} />
                          {userCanApprove ? "Review" : "View"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setActionReason("");
        }}
        title={`Claim #${selectedClaim?.Id} - Workflow Review`}
        size="lg"
      >
        {selectedClaim && (
          <div className="space-y-6">
            {/* Workflow Progress */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Progress</h3>
              <div className="flex items-center justify-between">
                <div className={`flex flex-col items-center ${selectedClaim.workflowLevel === "L1" ? "opacity-100" : "opacity-50"}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedClaim.status === "Pending L1" ? "bg-blue-500" : 
                    selectedClaim.workflowLevel === "L1" && selectedClaim.status !== "Pending L1" ? "bg-green-500" : 
                    "bg-slate-300"
                  }`}>
                    <ApperIcon name="User" size={20} className="text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mt-2">Level 1</p>
                  <p className="text-xs text-slate-500">&lt;$10k</p>
                </div>

                <div className="flex-1 h-1 bg-slate-300 mx-2">
                  <div className={`h-full ${selectedClaim.workflowLevel !== "L1" ? "bg-green-500" : "bg-slate-300"}`} />
                </div>

                <div className={`flex flex-col items-center ${selectedClaim.workflowLevel === "L2" ? "opacity-100" : "opacity-50"}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedClaim.status === "Pending L2" ? "bg-amber-500" : 
                    selectedClaim.workflowLevel === "L2" && selectedClaim.status !== "Pending L2" ? "bg-green-500" : 
                    "bg-slate-300"
                  }`}>
                    <ApperIcon name="Users" size={20} className="text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mt-2">Level 2</p>
                  <p className="text-xs text-slate-500">$10k-$50k</p>
                </div>

                <div className="flex-1 h-1 bg-slate-300 mx-2">
                  <div className={`h-full ${selectedClaim.workflowLevel === "L3" ? "bg-green-500" : "bg-slate-300"}`} />
                </div>

                <div className={`flex flex-col items-center ${selectedClaim.workflowLevel === "L3" ? "opacity-100" : "opacity-50"}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedClaim.status === "Pending L3" ? "bg-red-500" : 
                    selectedClaim.status === "Approved" ? "bg-green-500" : 
                    "bg-slate-300"
                  }`}>
                    <ApperIcon name="Shield" size={20} className="text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mt-2">Level 3</p>
                  <p className="text-xs text-slate-500">&gt;$50k</p>
                </div>
              </div>
            </div>

            {/* Claim Details */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Client</label>
                  <p className="text-gray-900 mt-1 font-semibold">{getClientName(selectedClaim.clientId)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Policy</label>
                  <p className="text-gray-900 mt-1 font-semibold">{getPolicyNumber(selectedClaim.policyId)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Amount Requested</label>
                  <p className="text-2xl font-bold text-primary-700 mt-1">
                    ${selectedClaim.amountRequested.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Current Status</label>
                  <Badge variant={
                    selectedClaim.status === "Approved" ? "success" : 
                    selectedClaim.status === "Denied" ? "danger" : 
                    "warning"
                  } className="mt-1">
                    {selectedClaim.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-gradient-to-br from-amber-50 to-red-50 rounded-xl p-6 border-2 border-amber-200">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  getRiskLevel(selectedClaim.fraudScore, selectedClaim.confidenceLevel || 0).color === "red" ? 
                  "bg-gradient-to-br from-red-500 to-red-600" : 
                  getRiskLevel(selectedClaim.fraudScore, selectedClaim.confidenceLevel || 0).color === "amber" ? 
                  "bg-gradient-to-br from-amber-500 to-amber-600" : 
                  "bg-gradient-to-br from-green-500 to-green-600"
                }`}>
                  <ApperIcon name="AlertTriangle" size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
                  <p className="text-sm text-slate-600">Fraud Score: {selectedClaim.fraudScore}% | Confidence: {selectedClaim.confidenceLevel || 0}%</p>
                </div>
              </div>
              <Badge variant={
                getRiskLevel(selectedClaim.fraudScore, selectedClaim.confidenceLevel || 0).level === "high" ? "danger" : 
                getRiskLevel(selectedClaim.fraudScore, selectedClaim.confidenceLevel || 0).level === "medium" ? "warning" : 
                "success"
              }>
                {getRiskLevel(selectedClaim.fraudScore, selectedClaim.confidenceLevel || 0).label}
              </Badge>
            </div>

            {/* Approval History */}
            {selectedClaim.approvalHistory && selectedClaim.approvalHistory.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval History</h3>
                <div className="space-y-3">
                  {selectedClaim.approvalHistory.map((history, index) => (
                    <div key={index} className="flex items-start gap-3 border-l-4 border-primary-500 pl-4 py-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={history.action === "approved" ? "success" : history.action === "denied" ? "danger" : "warning"}>
                            {history.action.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium text-slate-700">{history.approvalLevel}</span>
                          <span className="text-xs text-slate-500">
                            by {history.approver}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{history.reason}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(history.timestamp), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Section */}
            {canUserApprove(selectedClaim) && (
              <div className="border-t border-slate-200 pt-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Decision Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Provide detailed reason for your decision..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows="3"
                />
                
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="danger" onClick={() => handleDeny(selectedClaim.Id)}>
                    <ApperIcon name="X" size={18} />
                    Deny
                  </Button>
                  <Button variant="warning" onClick={() => handleEscalate(selectedClaim.Id)}>
                    <ApperIcon name="ArrowUp" size={18} />
                    Escalate
                  </Button>
                  <Button onClick={() => handleApprove(selectedClaim.Id)}>
                    <ApperIcon name="CheckCircle" size={18} />
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalWorkflows;