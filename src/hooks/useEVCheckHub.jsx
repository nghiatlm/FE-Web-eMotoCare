import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

/**
 * Hook để kết nối SignalR và listen updates cho EVCheck
 * @param {string} evCheckId - ID của EVCheck cần listen
 * @param {Function} onUpdate - Callback khi nhận được update (sẽ gọi để reload data)
 */
export default function useEVCheckHub(evCheckId, onUpdate) {
  const connectionRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);

  // ✅ Cập nhật ref khi onUpdate thay đổi
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!evCheckId) return;

    // Lấy token từ localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    const token = user?.token || "";

    if (!token) {
      console.warn("⚠️ No token found, cannot connect to SignalR hub");
      return;
    }

    // Lấy API base URL từ env
    let API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    
    // ✅ Nếu không có env, dùng URL mặc định (có thể thay đổi sau)
    if (!API_BASE_URL) {
      // ✅ Dùng URL từ code example hoặc URL thực tế của bạn
      // Có thể thay đổi URL này hoặc tạo file .env
      API_BASE_URL = "https://bemodernestate.site"; // ✅ Thay bằng URL thực tế của bạn
      console.warn("⚠️ VITE_API_BASE_URL not set in .env file");
      console.warn("⚠️ Using default URL:", API_BASE_URL);
      console.warn("⚠️ Please create .env file with: VITE_API_BASE_URL=https://your-api-url.com/api");
    }
    
    // ✅ Loại bỏ `/api` khỏi URL vì hub URL không có `/api`
    // Ví dụ: `http://localhost:8083/api` → `http://localhost:8083`
    // Hoặc: `https://bemodernestate.site/api` → `https://bemodernestate.site`
    let baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
    
    const hubUrl = `${baseUrl}/hubs/notify`;

    console.log("🔌 Connecting to SignalR hub:", hubUrl);

    // Tạo connection
    // ✅ Backend yêu cầu negotiate trước (có connection ID trong log trước)
    // ✅ Gửi token trong cả Authorization header (cho negotiate) và accessTokenFactory (cho WebSocket)
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: false, // ✅ Cần negotiate để backend tạo connection ID
        transport: signalR.HttpTransportType.WebSockets, // ✅ Ưu tiên WebSockets
        accessTokenFactory: () => token, // ✅ Token cho WebSocket connection (query parameter)
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Token cho negotiate request (Authorization header)
        },
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Retry sau 0s, 2s, 10s, 30s, sau đó mỗi 30s
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount === 1) return 2000;
          if (retryContext.previousRetryCount === 2) return 10000;
          return 30000;
        },
      })
      .build();

    connectionRef.current = connection;

    // ✅ Listen for updates - Định nghĩa trước để dùng trong startConnection
    const handleReceiveUpdate = (entity, data) => {
      console.log("📩 ReceiveUpdate:", entity, data);

      // Nếu là dữ liệu của EVCheck và ID trùng
      if (entity === "EVCheck" && data?.id === evCheckId) {
        console.log("🔄 EVCheck updated, reloading data...");
        // Gọi callback để reload data (dùng ref để tránh stale closure)
        if (onUpdateRef.current && typeof onUpdateRef.current === "function") {
          onUpdateRef.current();
        }
      }
    };

    // Start connection với fallback transport
    const startConnection = async () => {
      try {
        // ✅ Negotiate trước để lấy connection ID
        await connection.start();
        console.log("✅ Connected to EVCheck SignalR hub");
        console.log("📡 Connection ID:", connection.connectionId);
        console.log("📡 Transport:", connection.connection?.transport?.name || "Unknown");
      } catch (err) {
        console.warn("⚠️ SignalR WebSocket connection failed:", err.message);
        
        // ✅ Kiểm tra token
        if (!token) {
          console.warn("⚠️ No token available for SignalR connection");
          return;
        }
        
        // ✅ Nếu 401, có thể token không hợp lệ hoặc backend chưa cấu hình middleware
        if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
          console.warn("⚠️ Token authentication failed (401).");
          console.warn("ℹ️ Backend may need middleware to convert token from query parameter to Authorization header.");
          console.warn("ℹ️ Real-time updates are disabled. App will continue to work normally.");
          return;
        }
        
        // ✅ Không fallback SSE vì EventSource cũng không hỗ trợ custom headers
        console.warn("ℹ️ Real-time updates for EVCheck are disabled.");
        console.warn("ℹ️ Backend may need to configure SignalR to accept token from query parameter.");
        console.warn("ℹ️ App will continue to work normally, but EVCheck updates require page reload.");
      }
    };

    startConnection();

    connection.on("ReceiveUpdate", handleReceiveUpdate);

    // Handle reconnection
    connection.onreconnecting((error) => {
      console.log("🔄 SignalR reconnecting...", error);
    });

    connection.onreconnected((connectionId) => {
      console.log("✅ SignalR reconnected:", connectionId);
    });

    connection.onclose((error) => {
      console.log("❌ SignalR connection closed:", error);
    });

    // Cleanup
    return () => {
      if (connectionRef.current) {
        console.log("🔌 Disconnecting from SignalR hub");
        connectionRef.current.off("ReceiveUpdate", handleReceiveUpdate);
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [evCheckId]); // ✅ Chỉ depend vào evCheckId, không depend vào onUpdate

  return connectionRef.current;
}

