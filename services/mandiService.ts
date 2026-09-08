// src/services/mandiService.ts

// --- 1. CONFIGURATION ---
const OGD_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const BASE_URL = "https://api.data.gov.in/resource/" + OGD_RESOURCE_ID;
const GOVT_API_KEY = "579b464db66ec23bdd000001a99fdd68d5184ae7526ef4cf3d3c2c2a"; 

// --- STATE VALIDATION MAPPING ---
const STATE_VALIDATION: Record<string, string[]> = {
  "Uttar Pradesh": ["Agra", "Aligarh", "Allahabad", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Badaun", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar", "Lakhimpur Kheri", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Shahjahanpur", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Nawanshahr", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "SAS Nagar", "Tarn Taran"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurgaon", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Mewat", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandsaur", "Mandla", "Mau", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"]
}; 

export interface MandiRecord {
  id: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  min_price: number; // Converted to number for math
  max_price: number;
  modal_price: number;
  arrival_date: string;
}

// --- 2. REALISTIC PRICE RANGES (Backup Data) ---
const BACKUP_PRICES: Record<string, { min: number, max: number }> = {
  "Wheat": { min: 2150, max: 2450 },
  "Rice": { min: 2800, max: 3900 },
  "Potato": { min: 900, max: 1300 },
  "Tomato": { min: 1800, max: 2800 },
  "Onion": { min: 2500, max: 3500 },
  "Mustard": { min: 4900, max: 5500 },
  "Cotton": { min: 6000, max: 7200 },
  "Sugarcane": { min: 340, max: 380 }
};

// --- 3. HELPER: Generate Mock Data (If API Fails) ---
const generateMockData = (state: string, district: string, commodity: string): MandiRecord[] => {
  const base = BACKUP_PRICES[commodity] || { min: 2000, max: 3000 };
  const randomPrice = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
  const today = new Date().toISOString().split('T')[0];

  return [
    {
      id: "1", state, district,
      market: `${district} Main Mandi`,
      commodity, variety: "FAQ",
      min_price: base.min, max_price: base.max,
      modal_price: randomPrice(base.min + 50, base.max - 50),
      arrival_date: today
    },
    {
      id: "2", state, district,
      market: `${district} Rural Hub`,
      commodity, variety: "Desi",
      min_price: base.min - 100, max_price: base.max - 100,
      modal_price: randomPrice(base.min, base.max - 150),
      arrival_date: today
    },
    {
      id: "3", state, district,
      market: `Nearby ${state} Market`,
      commodity, variety: "Hybrid",
      min_price: base.min + 100, max_price: base.max + 200,
      modal_price: randomPrice(base.min + 100, base.max + 50),
      arrival_date: today
    }
  ].sort((a, b) => b.modal_price - a.modal_price);
};

// --- 4. HELPER: Validate State-District Combination ---
const validateStateDistrict = (state: string, district: string): boolean => {
  const validDistricts = STATE_VALIDATION[state];
  if (!validDistricts) {
    console.warn(`❌ State "${state}" not found in validation mapping`);
    return false;
  }
  
  // Check if district exists in the state (case-insensitive)
  const isValid = validDistricts.some(d => 
    d.toLowerCase() === district.toLowerCase() || 
    d.toLowerCase().includes(district.toLowerCase()) ||
    district.toLowerCase().includes(d.toLowerCase())
  );
  
  if (!isValid) {
    console.warn(`❌ District "${district}" not found in state "${state}". Valid districts: ${validDistricts.slice(0, 5).join(', ')}...`);
    return false;
  }
  
  console.log(`✅ Valid combination: ${district}, ${state}`);
  return true;
};

// --- 5. HELPER: Find Correct State for District ---
const findCorrectState = (district: string): string | null => {
  for (const [state, districts] of Object.entries(STATE_VALIDATION)) {
    if (districts.some(d => 
      d.toLowerCase() === district.toLowerCase() || 
      d.toLowerCase().includes(district.toLowerCase()) ||
      district.toLowerCase().includes(d.toLowerCase())
    )) {
      return state;
    }
  }
  return null;
};

// --- 6. MAIN FETCH FUNCTION (Hybrid with Validation) ---
export const fetchLiveMandiPrices = async (state: string, district: string, commodity: string = "") => {
  try {
    // A. Validate State-District Combination First
    console.log(`🔍 Validating: ${district}, ${state}`);
    const isValidCombination = validateStateDistrict(state, district);
    
    if (!isValidCombination) {
      // Try to find the correct state for this district
      const correctState = findCorrectState(district);
      if (correctState && correctState !== state) {
        console.log(`🔄 Auto-correcting: ${district} belongs to ${correctState}, not ${state}`);
        state = correctState;
      } else {
        console.warn(`⚠️ Could not validate ${district} in any state. Using fallback data.`);
        throw new Error("Invalid state-district combination");
      }
    }

    // B. Try Real API First
    let url = `${BASE_URL}?api-key=${GOVT_API_KEY}&format=json&limit=50&filters[state]=${state}&filters[district]=${district}`;
    if (commodity && commodity !== "") {
      url += `&filters[commodity]=${commodity}`;
    }

    console.log("🌐 Fetching Real Data:", url);
    const response = await fetch(url);
    const data = await response.json();

    // C. Check if Real Data Exists and Validate Response
    if (data.records && data.records.length > 0) {
      console.log(`✅ Found ${data.records.length} real records.`);
      
      // Validate API response data for correct state/district
      const validatedRecords = data.records.filter((rec: any) => {
        const recState = rec.state?.trim();
        const recDistrict = rec.district?.trim();
        
        // Check if the API response matches our expected state/district
        const stateMatch = recState?.toLowerCase() === state.toLowerCase();
        const districtMatch = recDistrict?.toLowerCase() === district.toLowerCase() ||
                            recDistrict?.toLowerCase().includes(district.toLowerCase()) ||
                            district.toLowerCase().includes(recDistrict?.toLowerCase());
        
        if (!stateMatch || !districtMatch) {
          console.warn(`⚠️ Filtering out mismatched record: ${recDistrict}, ${recState} (expected: ${district}, ${state})`);
          return false;
        }
        
        return true;
      });

      if (validatedRecords.length === 0) {
        console.warn("⚠️ API returned data but no valid records after filtering");
        throw new Error("No valid records found");
      }

      console.log(`✅ ${validatedRecords.length} validated records remaining`);
      
      // Clean and Map Validated Data
      return validatedRecords.map((rec: any, index: number) => ({
        id: `api-${index}`,
        state: rec.state,
        district: rec.district,
        market: rec.market,
        commodity: rec.commodity,
        variety: rec.variety,
        min_price: parseFloat(rec.min_price),
        max_price: parseFloat(rec.max_price),
        modal_price: parseFloat(rec.modal_price),
        arrival_date: rec.arrival_date
      })) as MandiRecord[];
    } 
    
    // D. If API is empty, throw to catch block to trigger backup
    throw new Error("No API data found");

  } catch (error) {
    console.warn("⚠️ API Failed/Empty. Switching to Simulation Mode for:", district, state);
    // E. Fallback to Smart Simulation with validated state
    return generateMockData(state, district, commodity || "Wheat");
  }
};

// --- 5. HELPER: Analytics ---
export const findBestMandi = (records: MandiRecord[]) => {
  if (!records || records.length === 0) return null;

  // Ensure sorting (Highest Price First)
  const sorted = [...records].sort((a, b) => b.modal_price - a.modal_price);
  
  const best = sorted[0];
  
  // Calculate average of the set
  const total = sorted.reduce((sum, item) => sum + item.modal_price, 0);
  const average = total / sorted.length;

  // Calculate Percentage Difference
  const diff = best.modal_price - average;
  const percent = ((diff / average) * 100).toFixed(1);

  return {
    bestMandiName: best.market,
    bestPrice: best.modal_price,
    percentHigher: percent
  };
};