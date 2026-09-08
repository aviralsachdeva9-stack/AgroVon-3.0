// src/utils/config.ts

// Hardware device URL - can be overridden by environment variable
export const HARDWARE_URL = import.meta.env.VITE_HARDWARE_URL || "http://192.168.4.1/data";