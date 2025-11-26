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
    // ✅ Lấy API base URL từ env
    let API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    
    // ✅ Nếu không có env, dùng URL mặc định
    if (!API_BASE_URL) {
      API_BASE_URL = "https://bemodernestate.site";
      console.warn("⚠️ VITE_API_BASE_URL not set in .env file");
      console.warn("⚠️ Using default URL:", API_BASE_URL);
    }
    
    // ✅ Loại bỏ `/api` khỏi URL vì hub URL không có `/api`
    let baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
    const hubUrl = `${baseUrl}/hubs/notifyappointment`;

    console.log("🔌 Connecting to Appointment SignalR hub:", hubUrl);

    // Lấy token từ localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = user?.token || "";

    // Tạo connection - theo code mẫu: skipNegotiation: true
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || "",
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    // ✅ Listen for updates - Backend gửi các event: ReceiveCreate, ReceiveUpdate, ReceiveApproved, ReceiveDelete
    const handleReceiveCreate = (entity, data) => {
      console.log("📩 ReceiveCreate:", entity, data);
      if (entity === "Appointment") {
        console.log("🔄 Appointment created, reloading bookings...");
        if (onUpdateRef.current && typeof onUpdateRef.current === "function") {
          onUpdateRef.current();
        }
      }
    };

    const handleReceiveUpdate = (entity, data) => {
      console.log("📩 ReceiveUpdate:", entity, data);
      if (entity === "Appointment") {
        console.log("🔄 Appointment updated, reloading bookings...");
        if (onUpdateRef.current && typeof onUpdateRef.current === "function") {
          onUpdateRef.current();
        }
      }
    };

    const handleReceiveApproved = (entity, data) => {
      console.log("📩 ReceiveApproved:", entity, data);
      if (entity === "Appointment") {
        console.log("🔄 Appointment approved, reloading bookings...");
        if (onUpdateRef.current && typeof onUpdateRef.current === "function") {
          onUpdateRef.current();
        }
      }
    };

    const handleReceiveDelete = (entity, data) => {
      console.log("📩 ReceiveDelete:", entity, data);
      if (entity === "Appointment") {
        console.log("🔄 Appointment deleted, reloading bookings...");
        if (onUpdateRef.current && typeof onUpdateRef.current === "function") {
          onUpdateRef.current();
        }
      }
    };

    // Start connection - đơn giản như code mẫu
    connection.start()
      .then(() => {
        console.log("✅ Connected to Appointment SignalR hub");
        console.log("📡 Connection ID:", connection.connectionId);
        console.log("📡 Transport:", connection.connection?.transport?.name || "Unknown");
      })
      .catch(err => {
        console.error("❌ Appointment SignalR connection error:", err);
        console.warn("ℹ️ Real-time updates are disabled. App will continue to work normally.");
        console.warn("ℹ️ Reload page to see new bookings.");
      });

    // ✅ Listen các event từ backend: ReceiveCreate, ReceiveUpdate, ReceiveApproved, ReceiveDelete
    connection.on("ReceiveCreate", handleReceiveCreate);
    connection.on("ReceiveUpdate", handleReceiveUpdate);
    connection.on("ReceiveApproved", handleReceiveApproved);
    connection.on("ReceiveDelete", handleReceiveDelete);

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
        connectionRef.current.off("ReceiveCreate", handleReceiveCreate);
        connectionRef.current.off("ReceiveUpdate", handleReceiveUpdate);
        connectionRef.current.off("ReceiveApproved", handleReceiveApproved);
        connectionRef.current.off("ReceiveDelete", handleReceiveDelete);
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, []); // ✅ Chỉ chạy một lần khi component mount

  return connectionRef.current;
}

