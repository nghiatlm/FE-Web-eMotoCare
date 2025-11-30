import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";

// Global error handler để suppress lỗi từ browser extensions
window.addEventListener("unhandledrejection", (event) => {
  const errorMessage = event.reason?.message || event.reason?.toString() || "";
  const errorString = errorMessage.toLowerCase();
  
  // Suppress các lỗi phổ biến từ browser extensions
  if (
    errorString.includes("message channel closed") ||
    errorString.includes("channel closed") ||
    errorString.includes("extension context invalidated") ||
    errorString.includes("receiving end does not exist")
  ) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
