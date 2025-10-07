import analyticsData from "@/services/mockData/analytics.json";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const analyticsService = {
  getAll: async () => {
    await delay(300);
    return [...analyticsData];
  },

  getByDateRange: async (startDate, endDate) => {
    await delay(400);
    return analyticsData
      .filter(a => {
        const date = new Date(a.date);
        return date >= new Date(startDate) && date <= new Date(endDate);
      })
      .map(a => ({ ...a }));
  },

  getCurrentMetrics: async () => {
    await delay(300);
    const latest = analyticsData[analyticsData.length - 1];
    const previous = analyticsData[analyticsData.length - 2];
    
    const calculateChange = (current, prev) => {
      if (!prev) return 0;
      return ((current - prev) / prev * 100).toFixed(1);
    };

    return {
      totalPremiums: latest.totalPremiums,
      premiumsChange: calculateChange(latest.totalPremiums, previous.totalPremiums),
      activePolicies: latest.activePolicies,
      policiesChange: calculateChange(latest.activePolicies, previous.activePolicies),
      totalClaims: latest.totalClaims,
      claimsChange: calculateChange(latest.totalClaims, previous.totalClaims),
      lossRatio: (latest.lossRatio * 100).toFixed(1),
      lossRatioChange: calculateChange(latest.lossRatio, previous.lossRatio)
    };
  }
};

export default analyticsService;