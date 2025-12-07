/**
 * Extract error message from backend API response
 * Handles different error response structures from axios and API
 * 
 * @param {Error} error - The error object from catch block
 * @param {string} defaultMessage - Default message if no error message found
 * @returns {string} - The error message to display
 */
export const getErrorMessage = (error, defaultMessage = "Đã có lỗi xảy ra. Vui lòng thử lại.") => {
  if (!error) return defaultMessage;

  // Check different error response structures
  // 1. Axios error with response.data.message
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // 2. API response with data.message (after axios interceptor unwraps response.data)
  if (error?.data?.message) {
    return error.data.message;
  }

  // 3. Direct error message
  if (error?.message) {
    return error.message;
  }

  // 4. String error
  if (typeof error === "string") {
    return error;
  }

  // 5. Fallback to default message
  return defaultMessage;
};

