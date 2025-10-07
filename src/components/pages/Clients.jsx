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
import clientService from "@/services/api/clientService";
import policyService from "@/services/api/policyService";
import claimService from "@/services/api/claimService";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPolicies, setClientPolicies] = useState([]);
  const [clientClaims, setClientClaims] = useState([]);
  const [activeTab, setActiveTab] = useState("info");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    riskProfile: "Low"
  });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchQuery, statusFilter]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await clientService.getAll();
      setClients(data);
    } catch (err) {
      setError(err.message || "Failed to load clients");
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = [...clients];

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    setFilteredClients(filtered);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await clientService.create(formData);
      toast.success("Client created successfully!");
      setShowCreateModal(false);
      resetForm();
      loadClients();
    } catch (err) {
      toast.error(err.message || "Failed to create client");
    }
  };

  const handleViewClient = async (client) => {
    setSelectedClient(client);
    setActiveTab("info");
    try {
      const [policies, claims] = await Promise.all([
        policyService.getByClientId(client.Id),
        claimService.getByClientId(client.Id)
      ]);
      setClientPolicies(policies);
      setClientClaims(claims);
      setShowDetailModal(true);
    } catch (err) {
      toast.error("Failed to load client details");
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      riskProfile: "Low"
    });
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadClients} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clients</h1>
          <p className="text-slate-600">Manage your client directory</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <ApperIcon name="Plus" size={20} />
          Add Client
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search clients by name or email..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border-2 border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {filteredClients.length === 0 ? (
          <Empty
            title="No clients found"
            description="Get started by adding your first client"
            actionLabel="Add Client"
            onAction={() => setShowCreateModal(true)}
            icon="Users"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Risk Profile</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.Id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-white">
                            {client.firstName[0]}{client.lastName[0]}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {client.firstName} {client.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{client.email}</td>
                    <td className="py-3 px-4 text-slate-600">{client.phone}</td>
                    <td className="py-3 px-4">
                      <Badge variant={client.riskProfile === "Low" ? "success" : client.riskProfile === "Medium" ? "warning" : "danger"}>
                        {client.riskProfile}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={client.status === "Active" ? "success" : "default"}>
                        {client.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" onClick={() => handleViewClient(client)}>
                        <ApperIcon name="Eye" size={16} />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
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
        title="Add New Client"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="First Name"
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <FormField
              label="Last Name"
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
          <FormField
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <FormField
            label="Phone"
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <FormField
            label="Address"
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <FormField
            label="Date of Birth"
            type="date"
            required
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
          <FormField
            label="Risk Profile"
            type="select"
            required
            value={formData.riskProfile}
            onChange={(e) => setFormData({ ...formData, riskProfile: e.target.value })}
            options={[
              { value: "Low", label: "Low Risk" },
              { value: "Medium", label: "Medium Risk" },
              { value: "High", label: "High Risk" }
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} type="button">
              Cancel
            </Button>
            <Button type="submit">Create Client</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : "Client Details"}
        size="lg"
      >
        {selectedClient && (
          <div className="space-y-6">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab("info")}
                className={`px-6 py-3 font-medium transition-colors ${activeTab === "info" ? "border-b-2 border-primary-600 text-primary-600" : "text-slate-600 hover:text-slate-900"}`}
              >
                Information
              </button>
              <button
                onClick={() => setActiveTab("policies")}
                className={`px-6 py-3 font-medium transition-colors ${activeTab === "policies" ? "border-b-2 border-primary-600 text-primary-600" : "text-slate-600 hover:text-slate-900"}`}
              >
                Policies ({clientPolicies.length})
              </button>
              <button
                onClick={() => setActiveTab("claims")}
                className={`px-6 py-3 font-medium transition-colors ${activeTab === "claims" ? "border-b-2 border-primary-600 text-primary-600" : "text-slate-600 hover:text-slate-900"}`}
              >
                Claims ({clientClaims.length})
              </button>
            </div>

            {activeTab === "info" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Email</label>
                  <p className="text-gray-900 mt-1">{selectedClient.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Phone</label>
                  <p className="text-gray-900 mt-1">{selectedClient.phone}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-slate-600">Address</label>
                  <p className="text-gray-900 mt-1">{selectedClient.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Date of Birth</label>
                  <p className="text-gray-900 mt-1">{format(new Date(selectedClient.dateOfBirth), "MMMM dd, yyyy")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Risk Profile</label>
                  <div className="mt-1">
                    <Badge variant={selectedClient.riskProfile === "Low" ? "success" : selectedClient.riskProfile === "Medium" ? "warning" : "danger"}>
                      {selectedClient.riskProfile}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <div className="mt-1">
                    <Badge variant={selectedClient.status === "Active" ? "success" : "default"}>
                      {selectedClient.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Member Since</label>
                  <p className="text-gray-900 mt-1">{format(new Date(selectedClient.createdAt), "MMMM dd, yyyy")}</p>
                </div>
              </div>
            )}

            {activeTab === "policies" && (
              <div className="space-y-3">
                {clientPolicies.map((policy) => (
                  <div key={policy.Id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">{policy.policyNumber}</p>
                      <Badge variant={policy.status === "Active" ? "success" : policy.status === "Expiring" ? "warning" : "default"}>
                        {policy.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{policy.type}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Premium: ${policy.premium}/year</span>
                      <span className="text-sm text-slate-600">Expires: {format(new Date(policy.endDate), "MMM dd, yyyy")}</span>
                    </div>
                  </div>
                ))}
                {clientPolicies.length === 0 && (
                  <p className="text-center text-slate-600 py-8">No policies found</p>
                )}
              </div>
            )}

            {activeTab === "claims" && (
              <div className="space-y-3">
                {clientClaims.map((claim) => (
                  <div key={claim.Id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">Claim #{claim.Id}</p>
                      <Badge variant={claim.status === "Approved" ? "success" : claim.status === "Denied" ? "danger" : "warning"}>
                        {claim.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{claim.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Requested: ${claim.amountRequested.toLocaleString()}</span>
                      <span className="text-sm text-slate-600">
                        {format(new Date(claim.submittedAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                ))}
                {clientClaims.length === 0 && (
                  <p className="text-center text-slate-600 py-8">No claims found</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Clients;