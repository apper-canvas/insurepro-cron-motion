import claimsData from "@/services/mockData/claims.json";
let claims = [...claimsData];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const claimService = {
  getAll: async () => {
    await delay(300);
    return [...claims];
  },

  getById: async (id) => {
    await delay(200);
    const claim = claims.find(c => c.Id === parseInt(id));
    if (!claim) throw new Error("Claim not found");
    return { ...claim };
  },

  getByClientId: async (clientId) => {
    await delay(300);
    return claims.filter(c => c.clientId === parseInt(clientId)).map(c => ({ ...c }));
  },

  getByPolicyId: async (policyId) => {
    await delay(300);
    return claims.filter(c => c.policyId === parseInt(policyId)).map(c => ({ ...c }));
  },

  create: async (claimData) => {
await delay(400);
const maxId = claims.reduce((max, c) => Math.max(max, c.Id), 0);
    
    const { score: fraudScore, factors: fraudFactors } = calculateFraudScore(claimData);
    const confidenceLevel = calculateConfidenceLevel(claimData, fraudFactors);
    const fraudFlags = determineFraudFlags(claimData, fraudScore);
    const riskMultiplier = fraudScore > 60 ? 1.2 : fraudScore > 30 ? 1.1 : 1.0;
    const reserveAmount = Math.round(claimData.amountRequested * riskMultiplier);
    
    const newClaim = {
      ...claimData,
      Id: maxId + 1,
      amountApproved: 0,
      status: fraudScore > 50 ? "Pending" : "Pending",
      fraudScore,
      confidenceLevel,
      fraudFactors,
      fraudFlags,
      reserveAmount,
      submittedAt: new Date().toISOString(),
      processedAt: null
    };
    claims.push(newClaim);
    return { ...newClaim };
  },

  update: async (id, claimData) => {
    await delay(300);
    const index = claims.findIndex(c => c.Id === parseInt(id));
    if (index === -1) throw new Error("Claim not found");
    claims[index] = { ...claims[index], ...claimData };
    return { ...claims[index] };
  },

  approve: async (id, approvedAmount) => {
    await delay(300);
    const index = claims.findIndex(c => c.Id === parseInt(id));
    if (index === -1) throw new Error("Claim not found");
    claims[index] = {
      ...claims[index],
      status: "Approved",
amountApproved: approvedAmount,
      processedAt: new Date().toISOString(),
      reserveAmount: Math.max(0, claims[index].amountRequested - approvedAmount)
    };
    return { ...claims[index] };
  },

  deny: async (id, reason) => {
    await delay(300);
    const index = claims.findIndex(c => c.Id === parseInt(id));
    if (index === -1) throw new Error("Claim not found");
    claims[index] = {
      ...claims[index],
status: "Denied",
      amountApproved: 0,
      denialReason: reason,
      reserveAmount: 0,
      processedAt: new Date().toISOString()
    };
    return { ...claims[index] };
  },

  delete: async (id) => {
    await delay(300);
    const index = claims.findIndex(c => c.Id === parseInt(id));
    if (index === -1) throw new Error("Claim not found");
    claims.splice(index, 1);
    return true;
  }
};

function calculateFraudScore(claimData) {
  const factors = getFraudFactors(claimData);
  
  // Weighted scoring algorithm
  const amountWeight = 0.30;
  const temporalWeight = 0.25;
  const dataCompletenessWeight = 0.20;
  const historicalWeight = 0.25;
  
  const amountScore = factors.amountRisk.score * amountWeight;
  const temporalScore = factors.temporalRisk.score * temporalWeight;
  const dataScore = factors.dataCompleteness.score * dataCompletenessWeight;
  const historicalScore = factors.historicalRisk.score * historicalWeight;
  
  const totalScore = Math.min(100, Math.round(
    amountScore + temporalScore + dataScore + historicalScore
  ));
  
  return {
    score: totalScore,
    factors: {
      amountRisk: { ...factors.amountRisk, contribution: Math.round(amountScore) },
      temporalRisk: { ...factors.temporalRisk, contribution: Math.round(temporalScore) },
      dataCompleteness: { ...factors.dataCompleteness, contribution: Math.round(dataScore) },
      historicalRisk: { ...factors.historicalRisk, contribution: Math.round(historicalScore) }
    }
  };
}

function calculateConfidenceLevel(claimData, fraudFactors) {
  let confidence = 100;
  
  // Reduce confidence for missing data
  if (!claimData.description || claimData.description.length < 20) confidence -= 15;
  if (!claimData.photos || claimData.photos.length === 0) confidence -= 10;
  if (!claimData.incidentDate) confidence -= 10;
  
  // Increase confidence with strong patterns
  const totalContribution = Object.values(fraudFactors).reduce(
    (sum, factor) => sum + factor.contribution, 0
  );
  
  if (totalContribution > 60) confidence += 10;
  if (Object.values(fraudFactors).filter(f => f.score > 70).length >= 2) confidence += 5;
  
  // Normalize to 0-100 range
  return Math.max(0, Math.min(100, confidence));
}

function getFraudFactors(claimData) {
  const factors = {
    amountRisk: { score: 0, weight: 30, reasons: [] },
    temporalRisk: { score: 0, weight: 25, reasons: [] },
    dataCompleteness: { score: 0, weight: 20, reasons: [] },
    historicalRisk: { score: 0, weight: 25, reasons: [] }
  };
  
  // Amount Risk Analysis (30% weight)
  if (claimData.amountRequested > 50000) {
    factors.amountRisk.score += 40;
    factors.amountRisk.reasons.push("High claim amount (>$50k)");
  }
  if (claimData.amountRequested > 100000) {
    factors.amountRisk.score += 30;
    factors.amountRisk.reasons.push("Very high claim amount (>$100k)");
  }
  const amountIncrement = claimData.amountRequested % 1000 === 0;
  if (amountIncrement && claimData.amountRequested > 10000) {
    factors.amountRisk.score += 20;
    factors.amountRisk.reasons.push("Round number claim (possible estimation)");
  }
  
  // Temporal Risk Analysis (25% weight)
  const now = new Date();
  const incidentDate = new Date(claimData.incidentDate);
  const daysSinceIncident = Math.floor((now - incidentDate) / (1000 * 60 * 60 * 24));
  
  if (daysSinceIncident < 1) {
    factors.temporalRisk.score += 35;
    factors.temporalRisk.reasons.push("Same-day claim filing");
  }
  if (daysSinceIncident > 90) {
    factors.temporalRisk.score += 25;
    factors.temporalRisk.reasons.push("Late claim filing (>90 days)");
  }
  
  const isWeekend = incidentDate.getDay() === 0 || incidentDate.getDay() === 6;
  if (isWeekend) {
    factors.temporalRisk.score += 15;
    factors.temporalRisk.reasons.push("Weekend incident");
  }
  
  // Data Completeness Analysis (20% weight)
  if (!claimData.description || claimData.description.length < 20) {
    factors.dataCompleteness.score += 40;
    factors.dataCompleteness.reasons.push("Insufficient incident description");
  }
  if (!claimData.photos || claimData.photos.length === 0) {
    factors.dataCompleteness.score += 35;
    factors.dataCompleteness.reasons.push("No supporting photos");
  }
  if (!claimData.incidentDate) {
    factors.dataCompleteness.score += 25;
    factors.dataCompleteness.reasons.push("Missing incident date");
  }
  
  // Historical Risk Analysis (25% weight)
  if (claimData.claimHistory && claimData.claimHistory > 3) {
    factors.historicalRisk.score += 40;
    factors.historicalRisk.reasons.push("Multiple previous claims");
  }
  if (claimData.claimHistory && claimData.claimHistory > 5) {
    factors.historicalRisk.score += 30;
    factors.historicalRisk.reasons.push("Excessive claim history (>5 claims)");
  }
  
  // Policy age analysis
  if (claimData.claimDate) {
    const claimDate = new Date(claimData.claimDate);
    const policyMonths = Math.floor((claimDate - new Date(claimDate.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24 * 30));
    if (policyMonths < 6) {
      factors.historicalRisk.score += 20;
      factors.historicalRisk.reasons.push("New policy (<6 months)");
    }
  }
  
// Cap each factor at 100
  Object.keys(factors).forEach(key => {
    factors[key].score = Math.min(100, factors[key].score);
  });
  
  return factors;
}

function determineFraudFlags(claimData, fraudScore) {
  const flags = [];
  
  if (claimData.amountRequested > 10000) flags.push("High amount");
  if (!claimData.photos || claimData.photos.length === 0) flags.push("No photos provided");
  if (fraudScore > 60) flags.push("High fraud risk");
  
  const clientClaims = claims.filter(c => c.clientId === claimData.clientId);
  if (clientClaims.length > 2) flags.push("Multiple claims");
  
  return flags;
}

export default claimService;