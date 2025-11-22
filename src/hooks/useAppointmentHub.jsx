import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

/**
 * Hook để kết nối SignalR và listen updates cho Appointment/Booking
 * Khi có appointment mới hoặc cập nhật, sẽ tự động reload danh sách booking
 * 
 * @param {Function} onUpdate - Callback khi nhận được update (sẽ gọi để reload data)
 */
export default function useAppointmentHub(onUpdate) {
  const connectionRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);

  // ✅ Cập nhật ref khi onUpdate thay đổi (tránh stale closure)
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    // ✅ Tạm thời disable SignalR cho Appointment nếu backend chưa hỗ trợ
    // Nếu backend chưa implement SignalR notification cho Appointment,
    // hook này sẽ không kết nối và app vẫn hoạt động bình thường
    // (chỉ cần reload trang để thấy booking mới)
    
    // Lấy token từ localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    const token = user?.token || "";

    if (!token) {
      console.warn("⚠️ No token found, cannot connect to SignalR hub");
      return;
    }
    
    // ✅ Kiểm tra xem có nên kết nối SignalR không
    // Tạm thời disable vì backend chưa có SignalR hub cho Appointment
    // Có thể bật lại khi backend đã implement SignalR notification
    const ENABLE_APPOINTMENT_SIGNALR = import.meta.env.VITE_ENABLE_APPOINTMENT_SIGNALR === "true";
    
    if (!ENABLE_APPOINTMENT_SIGNALR) {
      console.log("ℹ️ Appointment SignalR is disabled. Real-time updates will not work.");
      console.log("ℹ️ Set VITE_ENABLE_APPOINTMENT_SIGNALR=true in .env to enable when backend is ready.");
      return;
    }

    // Lấy API base URL từ env
    let API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    
    if (!API_BASE_URL) {
      API_BASE_URL = "https://bemodernestate.site";
      console.warn("⚠️ VITE_API_BASE_URL not set, using default:", API_BASE_URL);
    }
    
    // ✅ Loại bỏ `/api` khỏi URL vì hub URL không có `/api`
    // Ví dụ: `http://localhost:8083/api` → `http://localhost:8083`
    // Hoặc: `https://bemodernestate.site/api` → `https://bemodernestate.site`
    let baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
    
    const hubUrl = `${baseUrl}/hubs/notify`;

    console.log("🔌 Connecting to Appointment SignalR hub:", hubUrl);

    // Tạo connection
    // ✅ Backend yêu cầu negotiate trước (có connection ID trong log trước)
    // ✅ Gửi token trong cả Authorization header (cho negotiate) và accessTokenFactory (cho WebSocket)
    // ✅ Fallback transport: WebSockets → ServerSentEvents (disabled vì SSE không hỗ trợ headers)
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

      // ✅ Nếu là dữ liệu của Appointment (tạo mới, cập nhật, hoặc thay đổi trạng thái)
      if (entity === "Appointment") {
        console.log("🔄 Appointment updated, reloading bookings...");
        console.log("📦 Appointment data:", data);
        
        // Gọi callback để reload data (dùng ref để tránh stale closure)
        if (onUpdateRef.current && typeof onUpdateRef.current === "function") {
          onUpdateRef.current();
        }
      }
    };

    // Start connection với fallback transport
    const startConnection = async () => {
      try {
        await connection.start();
        console.log("✅ Connected to Appointment SignalR hub");
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
        
        // ✅ Không fallback SSE vì EventSource không hỗ trợ custom headers và cũng sẽ fail 401
        console.warn("ℹ️ Real-time updates for Appointment are disabled.");
        console.warn("ℹ️ Backend may need to configure SignalR to accept token from query parameter.");
        console.warn("ℹ️ App will continue to work normally, but you'll need to reload page to see new bookings.");
      }
    };

    startConnection();

    // ✅ Setup event handlers (sẽ được gọi cho cả WebSocket và fallback)
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
  }, []); // ✅ Chỉ chạy một lần khi component mount

  return connectionRef.current;
}

