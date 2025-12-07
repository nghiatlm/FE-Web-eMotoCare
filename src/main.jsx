import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";

// Global error handler để suppress lỗi từ browser extension
const handleUnhandledRejection = (event) => {
  const errorMessage = event.reason?.message || event.reason?.toString() || "";
  const errorString = errorMessage.toLowerCase();
  
  // Suppress các lỗi từ browser extension
  if (
    errorString.includes("message channel closed") ||
    errorString.includes("channel closed") ||
    errorString.includes("asynchronous response") ||
    errorString.includes("listener indicated an asynchronous response") ||
    errorString.includes("extension context invalidated") ||
    errorString.includes("receiving end does not exist") ||
    errorString.includes("message port closed")
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }
};

// Đăng ký handler với capture phase để catch sớm nhất
window.addEventListener("unhandledrejection", handleUnhandledRejection, { 
  capture: true, 
  passive: true 
});

// Backup: Suppress trong console.error nếu vẫn lọt qua
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(" ").toLowerCase();
  if (
    message.includes("asynchronous response") ||
    message.includes("message channel closed") ||
    message.includes("listener indicated")
  ) {
    // Suppress lỗi này
    return;
  }
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
