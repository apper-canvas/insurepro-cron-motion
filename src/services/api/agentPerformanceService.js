import agentPerformanceData from "@/services/mockData/agentPerformance.json";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const agentPerformanceService = {
  getAll: async () => {
    await delay(400);
    return [...agentPerformanceData].sort((a, b) => b.totalRevenue - a.totalRevenue);
  },

  getById: async (id) => {
    await delay(300);
    const agent = agentPerformanceData.find(a => a.Id === parseInt(id));
    if (!agent) {
      throw new Error(`Agent with ID ${id} not found`);
    }
    return { ...agent };
  },

  getTopPerformers: async (limit = 3) => {
    await delay(350);
    return [...agentPerformanceData]
      .sort((a, b) => {
        const scoreA = (a.totalRevenue / 1000) + (a.clientSatisfaction * 20) + (a.policiesSold * 10);
        const scoreB = (b.totalRevenue / 1000) + (b.clientSatisfaction * 20) + (b.policiesSold * 10);
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(a => ({ ...a }));
  },

  getByMetric: async (metric = "revenue", order = "desc") => {
    await delay(400);
    const sortFunctions = {
      revenue: (a, b) => order === "desc" ? b.totalRevenue - a.totalRevenue : a.totalRevenue - b.totalRevenue,
      policies: (a, b) => order === "desc" ? b.policiesSold - a.policiesSold : a.policiesSold - b.policiesSold,
      satisfaction: (a, b) => order === "desc" ? b.clientSatisfaction - a.clientSatisfaction : a.clientSatisfaction - b.clientSatisfaction,
      clients: (a, b) => order === "desc" ? b.activeClients - a.activeClients : a.activeClients - b.activeClients,
      claims: (a, b) => order === "desc" ? b.claimsHandled - a.claimsHandled : a.claimsHandled - b.claimsHandled
    };

    const sortFn = sortFunctions[metric] || sortFunctions.revenue;
    return [...agentPerformanceData].sort(sortFn);
  },

  searchByName: async (searchTerm) => {
    await delay(300);
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [...agentPerformanceData];
    
    return agentPerformanceData
      .filter(a => a.agentName.toLowerCase().includes(term))
      .map(a => ({ ...a }));
  }
};

export default agentPerformanceService;