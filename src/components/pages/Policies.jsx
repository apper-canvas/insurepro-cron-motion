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
import policyService from "@/services/api/policyService";
import clientService from "@/services/api/clientService";

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [clients, setClients] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteResult, setQuoteResult] = useState(null);

  const [formData, setFormData] = useState({
    clientId: "",
    type: "Auto Insurance",
    coverageLevel: "Standard",
    startDate: "",
    endDate: "",
    premium: 0
  });

  const [quoteData, setQuoteData] = useState({
    clientId: "",
    policyType: "Auto Insurance",
    riskProfile: "Low",
    coverageLevel: "Standard"
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPolicies();
  }, [policies, searchQuery, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [policiesData, clientsData] = await Promise.all([
        policyService.getAll(),
        clientService.getAll()
      ]);
      setPolicies(policiesData);
      setClients(clientsData);
    } catch (err) {
      setError(err.message || "Failed to load policies");
      toast.error("Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  const filterPolicies = () => {
    let filtered = [...policies];

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    setFilteredPolicies(filtered);
  };

  const handleGenerateQuote = async (e) => {
    e.preventDefault();
    try {
      const result = await policyService.generateQuote(quoteData);
      setQuoteResult(result);
      toast.success("Quote generated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to generate quote");
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    try {
      await policyService.create(formData);
      toast.success("Policy created successfully!");
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to create policy");
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: "",
      type: "Auto Insurance",
      coverageLevel: "Standard",
      startDate: "",
      endDate: "",
      premium: 0
    });
    setCurrentStep(1);
  };

  const resetQuoteForm = () => {
    setQuoteData({
      clientId: "",
      policyType: "Auto Insurance",
      riskProfile: "Low",
      coverageLevel: "Standard"
    });
    setQuoteResult(null);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.Id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : "Unknown";
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadData} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Policies</h1>
          <p className="text-slate-600">Manage insurance policies and generate quotes</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowQuoteModal(true)}>
            <ApperIcon name="Calculator" size={20} />
            Generate Quote
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <ApperIcon name="Plus" size={20} />
            Create Policy
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search policies by number or type..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border-2 border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Expiring">Expiring</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        {filteredPolicies.length === 0 ? (
          <Empty
            title="No policies found"
            description="Create your first insurance policy or generate a quote"
            actionLabel="Create Policy"
            onAction={() => setShowCreateModal(true)}
            icon="FileText"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Policy Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Premium</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">End Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((policy) => (
                  <tr key={policy.Id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                          <ApperIcon name="FileText" size={20} className="text-white" />
                        </div>
                        <span className="font-medium text-gray-900">{policy.policyNumber}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{getClientName(policy.clientId)}</td>
                    <td className="py-3 px-4 text-slate-600">{policy.type}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900">${policy.premium.toLocaleString()}</span>
                      <span className="text-slate-600 text-sm">/year</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {format(new Date(policy.endDate), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={policy.status === "Active" ? "success" : policy.status === "Expiring" ? "warning" : "default"}>
                        {policy.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showQuoteModal}
        onClose={() => {
          setShowQuoteModal(false);
          resetQuoteForm();
        }}
        title="AI Quote Generator"
        size="md"
      >
        {!quoteResult ? (
          <form onSubmit={handleGenerateQuote} className="space-y-4">
            <FormField
              label="Client"
              type="select"
              required
              value={quoteData.clientId}
              onChange={(e) => setQuoteData({ ...quoteData, clientId: e.target.value })}
              options={[
                { value: "", label: "Select Client" },
                ...clients.map(c => ({ value: c.Id, label: `${c.firstName} ${c.lastName}` }))
              ]}
            />
            <FormField
              label="Policy Type"
              type="select"
              required
              value={quoteData.policyType}
              onChange={(e) => setQuoteData({ ...quoteData, policyType: e.target.value })}
              options={[
                { value: "Auto Insurance", label: "Auto Insurance" },
                { value: "Home Insurance", label: "Home Insurance" },
                { value: "Life Insurance", label: "Life Insurance" },
                { value: "Health Insurance", label: "Health Insurance" }
              ]}
            />
            <FormField
              label="Risk Profile"
              type="select"
              required
              value={quoteData.riskProfile}
              onChange={(e) => setQuoteData({ ...quoteData, riskProfile: e.target.value })}
              options={[
                { value: "Low", label: "Low Risk" },
                { value: "Medium", label: "Medium Risk" },
                { value: "High", label: "High Risk" }
              ]}
            />
            <FormField
              label="Coverage Level"
              type="select"
              required
              value={quoteData.coverageLevel}
              onChange={(e) => setQuoteData({ ...quoteData, coverageLevel: e.target.value })}
              options={[
                { value: "Basic", label: "Basic Coverage" },
                { value: "Standard", label: "Standard Coverage" },
                { value: "Premium", label: "Premium Coverage" }
              ]}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowQuoteModal(false)} type="button">
                Cancel
              </Button>
              <Button type="submit">
                <ApperIcon name="Sparkles" size={18} />
                Generate Quote
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6 border-2 border-primary-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                  <ApperIcon name="Sparkles" size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI-Generated Quote</h3>
                  <p className="text-sm text-slate-600">Based on risk assessment</p>
                </div>
              </div>
              <div className="text-center py-4">
                <p className="text-sm text-slate-600 mb-2">Recommended Annual Premium</p>
                <p className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  ${quoteResult.calculatedPremium.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Premium Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Base Rate</span>
                  <span className="font-semibold text-gray-900">${quoteResult.breakdown.baseRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Risk Adjustment</span>
                  <span className={`font-semibold ${quoteResult.breakdown.riskAdjustment >= 0 ? "text-red-600" : "text-green-600"}`}>
                    {quoteResult.breakdown.riskAdjustment >= 0 ? "+" : ""}${quoteResult.breakdown.riskAdjustment.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Coverage Adjustment</span>
                  <span className={`font-semibold ${quoteResult.breakdown.coverageAdjustment >= 0 ? "text-red-600" : "text-green-600"}`}>
                    {quoteResult.breakdown.coverageAdjustment >= 0 ? "+" : ""}${quoteResult.breakdown.coverageAdjustment.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => resetQuoteForm()}>
                Generate New Quote
              </Button>
              <Button onClick={() => {
                setShowQuoteModal(false);
                setShowCreateModal(true);
                setFormData({ ...formData, clientId: quoteData.clientId, type: quoteData.policyType, premium: quoteResult.calculatedPremium });
              }}>
                Create Policy
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Policy"
        size="md"
      >
        <form onSubmit={handleCreatePolicy} className="space-y-4">
          <FormField
            label="Client"
            type="select"
            required
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            options={[
              { value: "", label: "Select Client" },
              ...clients.map(c => ({ value: c.Id, label: `${c.firstName} ${c.lastName}` }))
            ]}
          />
          <FormField
            label="Policy Type"
            type="select"
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: "Auto Insurance", label: "Auto Insurance" },
              { value: "Home Insurance", label: "Home Insurance" },
              { value: "Life Insurance", label: "Life Insurance" },
              { value: "Health Insurance", label: "Health Insurance" }
            ]}
          />
          <FormField
            label="Coverage Level"
            type="select"
            required
            value={formData.coverageLevel}
            onChange={(e) => setFormData({ ...formData, coverageLevel: e.target.value })}
            options={[
              { value: "Basic", label: "Basic Coverage" },
              { value: "Standard", label: "Standard Coverage" },
              { value: "Premium", label: "Premium Coverage" }
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Start Date"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <FormField
              label="End Date"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
          <FormField
            label="Annual Premium"
            type="number"
            required
            value={formData.premium}
            onChange={(e) => setFormData({ ...formData, premium: parseFloat(e.target.value) })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} type="button">
              Cancel
            </Button>
            <Button type="submit">Create Policy</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Policies;