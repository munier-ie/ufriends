export async function sendOtpSms(phone: string, code: string) {
  // TODO: Integrate a real SMS provider (e.g., Twilio, Termii)
  // For now, we log to server console to simulate sending.
  console.log(`[SMS] to ${phone}: code=${code}`)
}