// Format Vietnamese phone numbers consistently for display
// - Accepts inputs like "0909000002", "+84909000002", "84 909 000 002", etc.
// - Returns a human-friendly string, e.g. "0909 000 002" or with +84 preserved
export function formatPhoneNumber(input) {
  if (!input) return "";

  const str = String(input).trim();

  // Preserve international prefix if explicitly provided
  const hasPlus84 = /^\+?84/.test(str);

  // Keep digits only
  const digits = str.replace(/\D/g, "");

  // Normalize to local leading 0 when it begins with country code 84
  let local = digits;
  if (digits.startsWith("84")) {
    local = `0${digits.slice(2)}`;
  }

  // If still longer than 11, trim to last 10 for safety
  if (local.length > 11) {
    local = local.slice(-10);
  }

  // Common VN mobiles are 10 digits starting with 0
  if (/^0\d{9}$/.test(local)) {
    // Format as 4-3-3: 0909 000 002
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }

  // Landlines 11 digits: 0xxx xxx xxxx (approximate)
  if (/^0\d{10}$/.test(local)) {
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }

  // Fallback: group by 3s from left
  return local.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

export default {
  formatPhoneNumber,
};


