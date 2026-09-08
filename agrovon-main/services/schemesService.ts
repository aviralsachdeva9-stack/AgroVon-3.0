// src/services/schemesService.ts

export interface Scheme {
  id: string;
  name: string;
  provider: "Central Govt" | "State Govt (UP)" | "Insurance";
  description: string;
  eligibility: string[];
  documents: string[];
  benefit: string;
  deadline?: string;
  officialLink: string;
  category: "Subsidy" | "Insurance" | "Loan" | "Equipment";
}

export const SCHEMES_DATA: Scheme[] = [
  {
    id: "1",
    name: "PM Kisan Samman Nidhi",
    provider: "Central Govt",
    description: "Financial support of ₹6,000 per year to landholding farmer families, payable in three equal installments of ₹2,000 each.",
    eligibility: [
      "Must be a landholding farmer family",
      "Land must be cultivable",
      "Existing land ownership record required"
    ],
    documents: ["Aadhaar Card", "Land Ownership Papers (Khasra/Khatauni)", "Bank Passbook"],
    benefit: "₹6,000 / year",
    officialLink: "https://pmkisan.gov.in/",
    category: "Subsidy"
  },
  {
    id: "2",
    name: "Pradhan Mantri Fasal Bima Yojana",
    provider: "Insurance",
    description: "Crop insurance scheme providing financial support to farmers suffering crop loss/damage arising out of unforeseen events.",
    eligibility: [
      "Farmers with notified crops in notified areas",
      "Includes sharecroppers and tenant farmers"
    ],
    documents: ["Land Possession Certificate", "Aadhaar Card", "Bank Details", "Sowing Certificate"],
    benefit: "Insurance Cover (Varies)",
    deadline: "31st July (Kharif)",
    officialLink: "https://pmfby.gov.in/",
    category: "Insurance"
  },
  {
    id: "3",
    name: "Kisan Credit Card (KCC)",
    provider: "Central Govt",
    description: "Provides adequate and timely credit support from the banking system under a single window with flexible and simplified procedure.",
    eligibility: ["All farmers (owners/cultivators)", "Sharecroppers", "Self Help Groups"],
    documents: ["Application Form", "ID Proof", "Address Proof", "Land Records"],
    benefit: "Low Interest Loan (4% p.a.)",
    officialLink: "https://www.myscheme.gov.in/schemes/kcc",
    category: "Loan"
  },
  {
    id: "4",
    name: "UP Agriculture Machinery Subsidy",
    provider: "State Govt (UP)",
    description: "Subsidy on purchase of agricultural equipment like Rotavator, Tractor, and Solar Pumps to promote mechanization.",
    eligibility: ["Resident of Uttar Pradesh", "Registered on UP Agriculture Portal"],
    documents: ["Registration No.", "Aadhaar Card", "Bank Passbook"],
    benefit: "Up to 50% Subsidy",
    officialLink: "http://upagriculture.com/",
    category: "Equipment"
  },
  {
    id: "5",
    name: "Soil Health Card Scheme",
    provider: "Central Govt",
    description: "Govt provides a card with soil nutrient status of your holding and advice on dosage of fertilizers.",
    eligibility: ["All farmers"],
    documents: ["Soil Sample", "Aadhaar Card"],
    benefit: "Free Soil Testing",
    officialLink: "https://soilhealth.dac.gov.in/",
    category: "Subsidy"
  }
];

export const getSchemes = async (): Promise<Scheme[]> => {
  // Simulating API delay
  return new Promise((resolve) => {
    setTimeout(() => resolve(SCHEMES_DATA), 500);
  });
};