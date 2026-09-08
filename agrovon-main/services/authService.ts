// ─── DUMMY AUTH SERVICE ───────────────────────────────────────────────────────
// Firebase & reCAPTCHA fully removed.
// Rules:
//   • Any 10-digit number  →  OTP "sent" (a random 6-digit code is shown in console)
//   • Any 6-digit OTP      →  Login succeeds
// ─────────────────────────────────────────────────────────────────────────────

/** Simulate sending an OTP. Always returns true for any 10-digit number. */
export const requestOTP = async (phoneNumber: string): Promise<boolean> => {
  const digits = phoneNumber.replace(/\D/g, '');

  // Basic check — must be 10 digits
  if (digits.length !== 10) return false;

  // Generate a random 6-digit code just for display/debug purposes
  const dummyCode = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`[DUMMY AUTH] OTP for +91${digits}: ${dummyCode}  (any 6 digits will work)`);

  // Simulate a small network delay so the UI feels realistic
  await new Promise((res) => setTimeout(res, 800));

  return true;
};

/** Simulate verifying OTP. Any 6-digit code is accepted. */
export const verifyOTP = async (code: string): Promise<boolean> => {
  const clean = code.replace(/\D/g, '');

  if (clean.length !== 6) return false;

  // Simulate a small network delay
  await new Promise((res) => setTimeout(res, 600));

  console.log('[DUMMY AUTH] OTP verified — login success');
  return true;
};