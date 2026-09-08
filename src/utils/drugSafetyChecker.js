/**
 * Drug Interaction & Allergy Cross-Check Engine
 * Parses patient medical history, reported allergies, and current medications
 * to detect contraindications, drug interactions, and treatment safety alerts.
 */

export function crossCheckDrugSafety(historyText = '', conditionName = '') {
  const text = (historyText || '').toLowerCase();
  const cond = (conditionName || '').toLowerCase();
  const alerts = [];

  // 1. Topical Steroid Misuse / Prolonged Use Warning
  if (text.includes('hydrocortisone') || text.includes('steroid') || text.includes('betnovate') || text.includes('clobetasol')) {
    if (cond.includes('fungal') || cond.includes('tinea') || cond.includes('ringworm')) {
      alerts.push({
        severity: 'High',
        title: 'CRITICAL CONTRAINDICATION: Topical Steroid Misuse on Fungal Lesion',
        message: 'Patient reports using topical steroids. Applying steroids to fungal infections causes "Tinea Incognito", accelerating fungal spread while masking redness.'
      });
    } else {
      alerts.push({
        severity: 'Medium',
        title: 'Topical Corticosteroid Monitoring Warning',
        message: 'Patient reports current steroid use. Limit OTC hydrocortisone to under 7 consecutive days to avoid skin thinning (atrophy) or striae.'
      });
    }
  }

  // 2. Penicillin / Beta-Lactam Allergy
  if (text.includes('penicillin') || text.includes('amoxicillin') || text.includes('ampicillin')) {
    alerts.push({
      severity: 'High',
      title: 'Drug Allergy Flagged: Penicillin / Beta-Lactam Allergy',
      message: 'Patient reports Penicillin allergy. If oral antibiotics are required for bacterial skin infection (impetigo/cellulitis), avoid penicillin-class agents and substitute Macrolides (Azithromycin) or Cephalosporins under physician guidance.'
    });
  }

  // 3. Sulfa Allergy
  if (text.includes('sulfa') || text.includes('sulfonamide') || text.includes('bactrim')) {
    alerts.push({
      severity: 'High',
      title: 'Drug Allergy Flagged: Sulfa Allergy',
      message: 'Avoid topical Silver Sulfadiazine or oral Trimethoprim-Sulfamethoxazole.'
    });
  }

  // 4. Asthma / Atopic Triad
  if (text.includes('asthma') || text.includes('allergic rhinitis') || text.includes('hay fever')) {
    alerts.push({
      severity: 'Info',
      title: 'Atopic Triad Family/Personal History Identified',
      message: 'Associated with Atopic Dermatitis flare-ups. Prioritize barrier repair creams containing ceramides and avoid synthetic fragranced products.'
    });
  }

  // 5. Aspirin / Salicylic Acid Sensitivity
  if (text.includes('aspirin') || text.includes('salicylate')) {
    alerts.push({
      severity: 'Medium',
      title: 'Salicylate Sensitivity Warning',
      message: 'Avoid high-concentration topical salicylic acid acne washes or keratolytic gels.'
    });
  }

  return alerts;
}
