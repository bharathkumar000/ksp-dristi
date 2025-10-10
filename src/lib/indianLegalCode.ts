export interface LegalSection {
  crimeType: string;
  ipcSection: string;
  bnsSection: string;
  punishment: string;
  classification: string;
  kspProcedureRule: string;
}

export const INDIAN_LEGAL_CODE: LegalSection[] = [
  {
    crimeType: "Murder",
    ipcSection: "Section 302",
    bnsSection: "Section 103",
    punishment: "Death or Imprisonment for Life, and fine",
    classification: "Cognizable, Non-Bailable, Triable by Court of Session",
    kspProcedureRule: "Mandatory spot inspection by Inspector/DSP within 24 hours. Formal inquest report required. Forensic team dispatch is compulsory."
  },
  {
    crimeType: "Culpable Homicide",
    ipcSection: "Section 304",
    bnsSection: "Section 105",
    punishment: "Imprisonment for Life or up to 10 years, and fine",
    classification: "Cognizable, Non-Bailable, Triable by Court of Session",
    kspProcedureRule: "Establish intention vs knowledge. Post-mortem examination report must be secured within 48 hours."
  },
  {
    crimeType: "Kidnapping / Abduction",
    ipcSection: "Section 363 / 364A",
    bnsSection: "Section 137 / 140",
    punishment: "Imprisonment up to 7 years (10+ years for ransom), and fine",
    classification: "Cognizable, Non-Bailable, Triable by Magistrate/Session",
    kspProcedureRule: "Form a dedicated search team under Sub-Inspector immediately. Issue alert to checkpoints and border districts. Activate ANPR scanning."
  },
  {
    crimeType: "Rape / Sexual Assault",
    ipcSection: "Section 375 / 376",
    bnsSection: "Section 63 / 64",
    punishment: "Rigorous Imprisonment not less than 10 years up to Life, and fine",
    classification: "Cognizable, Non-Bailable, Triable by Court of Session",
    kspProcedureRule: "Victim statement must be recorded by a female officer. Medical exam to be completed within 24 hours under Section 164 of CrPC / Sec 184 of BNSS."
  },
  {
    crimeType: "Theft",
    ipcSection: "Section 378 / 379",
    bnsSection: "Section 303",
    punishment: "Imprisonment up to 3 years, or fine, or both",
    classification: "Cognizable, Bailable (Non-bailable for house theft), Triable by Magistrate",
    kspProcedureRule: "Instruct beat constables to verify second-hand metal dealer registries. Query MO pattern database for local repeat offenders."
  },
  {
    crimeType: "Extortion",
    ipcSection: "Section 383 / 384",
    bnsSection: "Section 308",
    punishment: "Imprisonment up to 3 years, or fine, or both",
    classification: "Cognizable, Non-Bailable, Triable by Magistrate",
    kspProcedureRule: "Trace payment links, phone records, and digital trails immediately. Apply for account freezing orders under Sec 102 CrPC / Sec 106 BNSS."
  },
  {
    crimeType: "Cheating / Fraud",
    ipcSection: "Section 415 / 420",
    bnsSection: "Section 316 / 318",
    punishment: "Imprisonment up to 7 years, and fine",
    classification: "Cognizable, Bailable/Non-Bailable depending on amount, Triable by Magistrate",
    kspProcedureRule: "Audit bank transactions and digital IPs. Standard bank notice under 91 CrPC / 94 BNSS to freeze bank accounts."
  },
  {
    crimeType: "Cyber Fraud / Scam",
    ipcSection: "Section 66D (IT Act)",
    bnsSection: "Section 66D IT Act / Section 318 BNS",
    punishment: "Imprisonment up to 3 years, and fine",
    classification: "Cognizable, Bailable, Triable by Magistrate",
    kspProcedureRule: "Register incident on the 1930 Cyber Helpline portal within golden hour. Issue notice to Nodal Officer of destination bank."
  },
  {
    crimeType: "Unnatural Offences / Bestiality / Animal Cruelty",
    ipcSection: "Section 377",
    bnsSection: "Section 325 (Animal Cruelty BNS) / PCA Act",
    punishment: "Imprisonment up to 10 years, and fine",
    classification: "Cognizable, Bailable (Non-bailable for serious injury), Triable by Magistrate",
    kspProcedureRule: "Secure CCTV recordings immediately. Coordinate veterinary inspection report. Record statement of cow/cattle owner immediately."
  },
  {
    crimeType: "Hurt / Grievous Hurt",
    ipcSection: "Section 319 / 320",
    bnsSection: "Section 114 / 115",
    punishment: "Imprisonment up to 1 year (up to 7 years for grievous), and fine",
    classification: "Cognizable, Bailable (Grievous hurt is Non-bailable)",
    kspProcedureRule: "Obtain Wound Certificate from Government Medical Officer. Collect blood-stained clothing and weapon if any."
  }
];

export function getLegalContextForPrompt(): string {
  return INDIAN_LEGAL_CODE.map(lc => {
    return `- **${lc.crimeType}**: Old Code: **IPC ${lc.ipcSection}** | New Code: **BNS ${lc.bnsSection}**
  - Punishment: ${lc.punishment}
  - Classification: ${lc.classification}
  - KSP Procedure Guideline: ${lc.kspProcedureRule}`;
  }).join('\n');
}
