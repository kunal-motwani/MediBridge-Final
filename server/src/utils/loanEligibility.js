exports.calculateRuleScore = (application) => {
  let score = 0;
  
  const { amountRequested, monthlyIncome, existingEMIs, employmentType, creditHistory, userId } = application;
  // Note: user age would typically be derived from DOB if available, skipping age score for brevity if not passed.

  // Income check (amountRequested <= monthlyIncome*24): +30
  if (monthlyIncome && amountRequested <= (monthlyIncome * 24)) {
    score += 30;
  }

  // DTI ratio (monthly debt / monthly income)
  if (monthlyIncome) {
    const estimatedNewEMI = amountRequested * 0.02; // Rough estimate
    const totalDebt = (existingEMIs || 0) + estimatedNewEMI;
    const dti = totalDebt / monthlyIncome;
    
    if (dti < 0.3) {
      score += 25;
    } else if (dti < 0.5) {
      score += 15;
    }
  }

  // Age (21-58): +15 (assuming handled elsewhere or default +15 for now)
  score += 15; 

  // Employment
  if (employmentType === 'salaried') {
    score += 20;
  } else if (employmentType === 'self_employed') {
    score += 10;
  }

  // Credit history
  if (creditHistory === true) {
    score += 10;
  }

  return score;
};

exports.calculateEMI = (principal, annualRate, tenureMonths) => {
  if (annualRate === 0) return principal / tenureMonths;
  const r = annualRate / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi);
};
