import policiesData from "@/services/mockData/policies.json";

let policies = [...policiesData];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const policyService = {
  getAll: async () => {
    await delay(300);
    return [...policies];
  },

  getById: async (id) => {
    await delay(200);
    const policy = policies.find(p => p.Id === parseInt(id));
    if (!policy) throw new Error("Policy not found");
    return { ...policy };
  },

  getByClientId: async (clientId) => {
    await delay(300);
    return policies.filter(p => p.clientId === parseInt(clientId)).map(p => ({ ...p }));
  },

  create: async (policyData) => {
    await delay(400);
    const maxId = policies.reduce((max, p) => Math.max(max, p.Id), 0);
    const newPolicy = {
      ...policyData,
      Id: maxId + 1,
      policyNumber: `POL-${new Date().getFullYear()}-${String(maxId + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
      status: "Active"
    };
    policies.push(newPolicy);
    return { ...newPolicy };
  },

  update: async (id, policyData) => {
    await delay(300);
    const index = policies.findIndex(p => p.Id === parseInt(id));
    if (index === -1) throw new Error("Policy not found");
    policies[index] = { ...policies[index], ...policyData };
    return { ...policies[index] };
  },

  delete: async (id) => {
    await delay(300);
    const index = policies.findIndex(p => p.Id === parseInt(id));
    if (index === -1) throw new Error("Policy not found");
    policies.splice(index, 1);
    return true;
  },

  generateQuote: async (quoteData) => {
    await delay(500);
    const baseRates = {
      "Auto Insurance": 1000,
      "Home Insurance": 1500,
      "Life Insurance": 2000,
      "Health Insurance": 1800
    };

    const riskMultipliers = {
      "Low": 0.9,
      "Medium": 1.0,
      "High": 1.3
    };

    const baseRate = baseRates[quoteData.policyType] || 1200;
    const riskMultiplier = riskMultipliers[quoteData.riskProfile] || 1.0;
    const coverageMultiplier = quoteData.coverageLevel === "Basic" ? 0.8 : quoteData.coverageLevel === "Premium" ? 1.3 : 1.0;
    
    const calculatedPremium = Math.round(baseRate * riskMultiplier * coverageMultiplier);

    return {
      calculatedPremium,
      breakdown: {
        baseRate,
        riskAdjustment: Math.round(baseRate * (riskMultiplier - 1)),
        coverageAdjustment: Math.round(baseRate * (coverageMultiplier - 1))
      }
    };
  }
};

export default policyService;