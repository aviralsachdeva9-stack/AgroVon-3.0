import { supabase } from '../supabaseClient';
import { SensorData } from './espService';

// --- 1. UPLOAD (Map Uppercase -> Lowercase) ---
export const uploadReading = async (data: SensorData) => {
  const { error } = await supabase
    .from('sensor_readings')
    .insert([
      {
        timestamp: Date.now(),
        n: data.N,        // Send N to n column
        p: data.P,        // Send P to p column
        k: data.K,        // Send K to k column
        moisture: data.moisture,
        temp: data.temp
      }
    ]);

  if (error) {
    console.error("❌ UPLOAD ERROR:", error.message);
  } else {
    console.log("✅ Data sent to Supabase!"); 
  }
};

// --- 2. LISTEN (Map Lowercase -> Uppercase) ---
export const listenToHistory = (callback: (data: any[]) => void) => {
  
  const fetchLatest = async () => {
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) {
      console.error("❌ FETCH ERROR:", error.message);
    } else if (data) {
      // Convert database lowercase (n,p,k) back to App uppercase (N,P,K)
      const formattedData = data.map(row => ({
        ...row,
        N: row.n,
        P: row.p,
        K: row.k
      }));
      console.log("✅ History Loaded:", formattedData.length, "rows");
      callback(formattedData);
    }
  };

  // Run immediately
  fetchLatest();

  // Listen for new data
  const channel = supabase
    .channel('sensor-updates')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
      () => {
        console.log("⚡ New data detected!");
        fetchLatest();
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
};