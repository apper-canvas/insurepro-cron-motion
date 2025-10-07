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
    
    const fraudScore = calculateFraudScore(claimData);
    const fraudFlags = determineFraudFlags(claimData, fraudScore);
    const riskMultiplier = fraudScore > 60 ? 1.2 : fraudScore > 30 ? 1.1 : 1.0;
    const reserveAmount = Math.round(claimData.amountRequested * riskMultiplier);
    
    const newClaim = {
      ...claimData,
      Id: maxId + 1,
      amountApproved: 0,
      status: fraudScore > 50 ? "Pending" : "Pending",
      fraudScore,
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
  let score = 0;
  
  if (claimData.amountRequested > 10000) score += 30;
  else if (claimData.amountRequested > 5000) score += 15;
  
  if (!claimData.photos || claimData.photos.length === 0) score += 25;
  else if (claimData.photos.length < 2) score += 10;
  
  if (!claimData.description || claimData.description.length < 50) score += 20;
  
  const clientClaims = claims.filter(c => c.clientId === claimData.clientId);
  if (clientClaims.length > 2) score += 15;
  
  return Math.min(score, 100);
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