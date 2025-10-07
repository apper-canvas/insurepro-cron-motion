import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import SearchBar from "@/components/molecules/SearchBar";
import FormField from "@/components/molecules/FormField";
import Modal from "@/components/molecules/Modal";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import claimService from "@/services/api/claimService";
import policyService from "@/services/api/policyService";
import clientService from "@/services/api/clientService";

const Claims = () => {
  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [clients, setClients] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

const [formData, setFormData] = useState({
    policyId: "",
    clientId: "",
    incidentDate: "",
    description: "",
    amountRequested: 0,
    photos: [],
    claimDate: new Date().toISOString(),
    claimHistory: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterClaims();
  }, [claims, searchQuery, statusFilter]);

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
      setError(err.message || "Failed to load claims");
      toast.error("Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  const filterClaims = () => {
    let filtered = [...claims];

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.Id.toString().includes(searchQuery) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    setFilteredClaims(filtered);
  };

  const handleCreateClaim = async (e) => {
    e.preventDefault();
    try {
      await claimService.create(formData);
      toast.success("Claim submitted successfully!");
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to submit claim");
    }
  };

  const handleApproveClaim = async (claimId, amount) => {
    try {
await claimService.approve(claimId, amount);
      const claim = claims.find(c => c.Id === claimId);
      toast.success(`Claim approved! Confidence: ${claim?.confidenceLevel || 0}%`);
      setShowDetailModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to approve claim");
    }
  };

const handleDenyClaim = async (claimId) => {
    try {
      await claimService.deny(claimId, "Does not meet policy requirements");
      toast.success("Claim denied");
      setShowDetailModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to deny claim");
    }
  };

  const resetForm = () => {
setFormData({
      policyId: "",
      clientId: "",
      incidentDate: "",
      description: "",
      amountRequested: 0,
      photos: [],
      claimDate: new Date().toISOString(),
      claimHistory: 0
    });
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.Id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : "Unknown";
  };

  const getPolicyNumber = (policyId) => {
    const policy = policies.find(p => p.Id === policyId);
    return policy ? policy.policyNumber : "Unknown";
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

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadData} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Claims</h1>
          <p className="text-slate-600">Process claims with AI-powered fraud detection</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <ApperIcon name="Plus" size={20} />
          Submit Claim
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search claims by ID or description..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border-2 border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Denied">Denied</option>
          </select>
        </div>

        {filteredClaims.length === 0 ? (
          <Empty
            title="No claims found"
            description="Submit your first insurance claim for processing"
            actionLabel="Submit Claim"
            onAction={() => setShowCreateModal(true)}
            icon="ClipboardList"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Claim ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Policy</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Amount</th>
<th className="text-left py-3 px-4 font-semibold text-slate-700">Risk Assessment</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Confidence</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => {
const risk = getRiskLevel(claim.fraudScore, claim.confidenceLevel || 0);
                  return (
                    <tr key={claim.Id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">#{claim.Id}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{getClientName(claim.clientId)}</td>
                      <td className="py-3 px-4 text-slate-600">{getPolicyNumber(claim.policyId)}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">${claim.amountRequested.toLocaleString()}</span>
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
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${(claim.confidenceLevel || 0) >= 70 ? 'bg-green-500' : (claim.confidenceLevel || 0) >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${claim.confidenceLevel || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{claim.confidenceLevel || 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={claim.status === "Approved" ? "success" : claim.status === "Denied" ? "danger" : "warning"}>
                          {claim.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setSelectedClaim(claim);
                          setShowDetailModal(true);
                        }}>
                          <ApperIcon name="Eye" size={16} />
                          Review
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

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Submit New Claim"
        size="md"
      >
        <form onSubmit={handleCreateClaim} className="space-y-4">
          <FormField
            label="Policy"
            type="select"
            required
            value={formData.policyId}
            onChange={(e) => {
              const policy = policies.find(p => p.Id === parseInt(e.target.value));
              setFormData({ 
                ...formData, 
                policyId: e.target.value,
                clientId: policy ? policy.clientId : ""
              });
            }}
            options={[
              { value: "", label: "Select Policy" },
              ...policies.map(p => ({ value: p.Id, label: `${p.policyNumber} - ${p.type}` }))
            ]}
          />
          <FormField
            label="Incident Date"
            type="date"
            required
            value={formData.incidentDate}
            onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
          />
          <FormField
            label="Description"
            type="textarea"
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Provide detailed description of the incident..."
          />
          <FormField
            label="Amount Requested"
            type="number"
            required
            value={formData.amountRequested}
            onChange={(e) => setFormData({ ...formData, amountRequested: parseFloat(e.target.value) })}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Supporting Photos
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer">
              <ApperIcon name="Upload" size={32} className="text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} type="button">
              Cancel
            </Button>
            <Button type="submit">Submit Claim</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Claim #${selectedClaim?.Id} Details`}
        size="lg"
      >
        {selectedClaim && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Client</label>
                  <p className="text-gray-900 mt-1 font-semibold">{getClientName(selectedClaim.clientId)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Policy</label>
                  <p className="text-gray-900 mt-1 font-semibold">{getPolicyNumber(selectedClaim.policyId)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Incident Date</label>
                  <p className="text-gray-900 mt-1">{format(new Date(selectedClaim.incidentDate), "MMMM dd, yyyy")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Submitted</label>
                  <p className="text-gray-900 mt-1">{format(new Date(selectedClaim.submittedAt), "MMMM dd, yyyy")}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">Description</label>
              <p className="text-gray-900 bg-slate-50 p-4 rounded-lg">{selectedClaim.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
                <label className="text-sm font-medium text-slate-600">Amount Requested</label>
                <p className="text-2xl font-bold text-primary-700 mt-1">
                  ${selectedClaim.amountRequested.toLocaleString()}
                </p>
              </div>
              {selectedClaim.status === "Approved" && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <label className="text-sm font-medium text-slate-600">Amount Approved</label>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    ${selectedClaim.amountApproved.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

<div className="bg-gradient-to-br from-amber-50 to-red-50 rounded-xl p-6 border-2 border-amber-200">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getRiskLevel(selectedClaim.fraudScore, selectedClaim.confidenceLevel || 0).color === "red" ? "bg-gradient-to-br from-red-500 to-red-600" : getRiskLevel(selectedClaim.fraudScore, selectedClaim.confidenceLevel || 0).color === "amber" ? "bg-gradient-to-br from-amber-500 to-amber-600" : "bg-gradient-to-br from-green-500 to-green-600"}`}>
                  <ApperIcon name="AlertTriangle" size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Fraud Analysis</h3>
                  <p className="text-sm text-slate-600">Multi-factor risk assessment</p>
                </div>
              </div>

              {/* Risk Score and Confidence */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Risk Score</span>
                    <Badge variant={getRiskLevel(selectedClaim.fraudScore, selectedClaim.confidenceLevel || 0).level === "high" ? "danger" : getRiskLevel(selectedClaim.fraudScore, selectedClaim.confidenceLevel || 0).level === "medium" ? "warning" : "success"}>
                      {getRiskLevel(selectedClaim.fraudScore, selectedClaim.confidenceLevel || 0).label}
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${getRiskLevel(selectedClaim.fraudScore, selectedClaim.confidenceLevel || 0).color === "red" ? "bg-gradient-to-r from-red-500 to-red-600" : getRiskLevel(selectedClaim.fraudScore, selectedClaim.confidenceLevel || 0).color === "amber" ? "bg-gradient-to-r from-amber-500 to-amber-600" : "bg-gradient-to-r from-green-500 to-green-600"}`}
                      style={{ width: `${selectedClaim.fraudScore}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{selectedClaim.fraudScore}% fraud risk</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Confidence Level</span>
                    <Badge variant={(selectedClaim.confidenceLevel || 0) >= 70 ? "success" : (selectedClaim.confidenceLevel || 0) >= 40 ? "warning" : "danger"}>
                      {(selectedClaim.confidenceLevel || 0) >= 70 ? "HIGH" : (selectedClaim.confidenceLevel || 0) >= 40 ? "MEDIUM" : "LOW"}
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${(selectedClaim.confidenceLevel || 0) >= 70 ? "bg-gradient-to-r from-green-500 to-green-600" : (selectedClaim.confidenceLevel || 0) >= 40 ? "bg-gradient-to-r from-amber-500 to-amber-600" : "bg-gradient-to-r from-red-500 to-red-600"}`}
                      style={{ width: `${selectedClaim.confidenceLevel || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{selectedClaim.confidenceLevel || 0}% prediction confidence</p>
                </div>
              </div>

              {/* Fraud Factors Breakdown */}
              {selectedClaim.fraudFactors && (
                <div className="space-y-3 mb-4">
                  <p className="text-sm font-semibold text-slate-700">Risk Factor Breakdown:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedClaim.fraudFactors).map(([key, factor]) => (
                      <div key={key} className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-600">
                            {key === 'amountRisk' ? 'Amount Analysis' : 
                             key === 'temporalRisk' ? 'Timing Patterns' :
                             key === 'dataCompleteness' ? 'Data Quality' :
                             'Historical Patterns'}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{factor.contribution}pts</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                          <div
                            className={`h-2 rounded-full ${factor.score > 70 ? 'bg-red-500' : factor.score > 40 ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${factor.score}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{factor.score}% risk</span>
                          <span className="text-xs text-slate-500">Weight: {factor.weight}%</span>
                        </div>
                        {factor.reasons && factor.reasons.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            {factor.reasons.map((reason, idx) => (
                              <p key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                                <span className="text-amber-600 mt-0.5">•</span>
                                <span>{reason}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Indicators */}
              {selectedClaim.fraudFlags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Additional Risk Indicators:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedClaim.fraudFlags.map((flag, index) => (
                      <Badge key={index} variant="warning">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedClaim.status === "Pending" && (
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button variant="danger" onClick={() => handleDenyClaim(selectedClaim.Id)}>
                  <ApperIcon name="X" size={18} />
                  Deny Claim
                </Button>
                <Button onClick={() => handleApproveClaim(selectedClaim.Id, selectedClaim.amountRequested)}>
                  <ApperIcon name="CheckCircle" size={18} />
                  Approve Claim
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Claims;