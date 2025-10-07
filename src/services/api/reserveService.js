import reservesData from "@/services/mockData/reserves.json";
import claimService from "@/services/api/claimService";

let reserves = [...reservesData];

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const reserveService = {
  async getAll() {
    await delay(300);
    return reserves.map(r => ({ ...r }));
  },

  async getById(id) {
    await delay(200);
    const reserve = reserves.find(r => r.Id === id);
    if (!reserve) {
      throw new Error("Reserve record not found");
    }
    return { ...reserve };
  },

  async calculateTotalReserves() {
    await delay(400);
    try {
      const claims = await claimService.getAll();
      
      let totalReserve = 0;
      let highRiskReserve = 0;
      let mediumRiskReserve = 0;
      let lowRiskReserve = 0;
      
      const reserveBreakdown = {
        byStatus: {
          Pending: 0,
          Approved: 0,
          Denied: 0
        },
        byRisk: {
          high: 0,
          medium: 0,
          low: 0
        },
        byPolicy: {}
      };

      claims.forEach(claim => {
        let reserveAmount = 0;
        
        if (claim.status === "Pending") {
          reserveAmount = claim.amountRequested;
        } else if (claim.status === "Approved") {
          reserveAmount = Math.max(0, claim.amountRequested - claim.amountApproved);
        }
        
        const riskMultiplier = claim.fraudScore > 60 ? 1.2 : claim.fraudScore > 30 ? 1.1 : 1.0;
        reserveAmount *= riskMultiplier;
        
        totalReserve += reserveAmount;
        
        reserveBreakdown.byStatus[claim.status] += reserveAmount;
        
        if (claim.fraudScore > 60) {
          highRiskReserve += reserveAmount;
          reserveBreakdown.byRisk.high += reserveAmount;
        } else if (claim.fraudScore > 30) {
          mediumRiskReserve += reserveAmount;
          reserveBreakdown.byRisk.medium += reserveAmount;
        } else {
          lowRiskReserve += reserveAmount;
          reserveBreakdown.byRisk.low += reserveAmount;
        }
        
        if (!reserveBreakdown.byPolicy[claim.policyId]) {
          reserveBreakdown.byPolicy[claim.policyId] = 0;
        }
        reserveBreakdown.byPolicy[claim.policyId] += reserveAmount;
      });

      return {
        totalReserve: Math.round(totalReserve),
        highRiskReserve: Math.round(highRiskReserve),
        mediumRiskReserve: Math.round(mediumRiskReserve),
        lowRiskReserve: Math.round(lowRiskReserve),
        breakdown: reserveBreakdown,
        claimsCount: claims.length,
        averageReserve: claims.length > 0 ? Math.round(totalReserve / claims.length) : 0
      };
    } catch (err) {
      throw new Error("Failed to calculate total reserves");
    }
  },

  async adjustReserve(adjustmentData) {
    await delay(500);
    
    const maxId = reserves.reduce((max, r) => Math.max(max, r.Id), 0);
    
    const newAdjustment = {
      ...adjustmentData,
      Id: maxId + 1,
      adjustedAt: new Date().toISOString()
    };
    
    reserves.unshift(newAdjustment);
    return { ...newAdjustment };
  },

  async getReserveHistory() {
    await delay(300);
    return reserves
      .sort((a, b) => new Date(b.adjustedAt) - new Date(a.adjustedAt))
      .map(r => ({ ...r }));
  },

  async getStatistics() {
    await delay(400);
    
    const totalAdjustments = reserves.length;
    const increases = reserves.filter(r => r.adjustmentType === "increase").length;
    const decreases = reserves.filter(r => r.adjustmentType === "decrease").length;
    
    const totalIncreaseAmount = reserves
      .filter(r => r.adjustmentType === "increase")
      .reduce((sum, r) => sum + r.adjustmentAmount, 0);
    
    const totalDecreaseAmount = reserves
      .filter(r => r.adjustmentType === "decrease")
      .reduce((sum, r) => sum + r.adjustmentAmount, 0);
    
    return {
      totalAdjustments,
      increases,
      decreases,
      totalIncreaseAmount: Math.round(totalIncreaseAmount),
      totalDecreaseAmount: Math.round(totalDecreaseAmount),
      netAdjustment: Math.round(totalIncreaseAmount - totalDecreaseAmount)
    };
  }
};

export default reserveService;