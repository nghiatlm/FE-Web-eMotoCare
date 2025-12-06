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

    // nếu hub AllowAnonymous thì token cũng được, không có cũng không sao
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = user?.token;

    // base URL có /api thì bỏ đi
    let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://bemodernestate.site/api";
    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
    const hubUrl = `${baseUrl}/hubs/notify`;

    console.log("🔌 Connecting to EVCheck SignalR hub:", hubUrl);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        // hub AllowAnonymous nên không bắt buộc, nhưng để cũng được
        accessTokenFactory: token ? () => token : undefined,
        // 🔒 CHỈ dùng LongPolling cho chắc, giống Appointment
        transport: signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    const handleReceiveCreate = (entity, data) => {
      console.log("📩 [useEVCheckHub] ReceiveCreate:", { entity, data, evCheckId, hasCallback: !!onUpdateRef.current });
      // Nếu là dữ liệu của EVCheck và ID trùng
      if (entity === "EVCheck" && data?.id === evCheckId) {
        console.log("🔄 [useEVCheckHub] EVCheck created, reloading data...");
        if (onUpdateRef.current) {
          try {
            // ✅ Truyền entity và data vào callback nếu callback chấp nhận tham số
            if (onUpdateRef.current.length > 0) {
              console.log("📩 [useEVCheckHub] Calling callback with params:", { entity, data });
              onUpdateRef.current(entity, data);
            } else {
              console.log("📩 [useEVCheckHub] Calling callback without params");
              onUpdateRef.current();
            }
          } catch (error) {
            console.error("❌ [useEVCheckHub] Error in callback:", error);
          }
        } else {
          console.warn("⚠️ [useEVCheckHub] No callback registered");
        }
      }
    };

    const handleReceiveUpdate = (entity, data) => {
      console.log("📩 [useEVCheckHub] ReceiveUpdate:", { entity, data, evCheckId, hasCallback: !!onUpdateRef.current });
      // Nếu là dữ liệu của EVCheck và ID trùng
      if (entity === "EVCheck" && data?.id === evCheckId) {
        console.log("🔄 [useEVCheckHub] EVCheck updated, reloading data...");
        if (onUpdateRef.current) {
          try {
            // ✅ Truyền entity và data vào callback nếu callback chấp nhận tham số
            if (onUpdateRef.current.length > 0) {
              console.log("📩 [useEVCheckHub] Calling callback with params:", { entity, data });
              onUpdateRef.current(entity, data);
            } else {
              console.log("📩 [useEVCheckHub] Calling callback without params");
              onUpdateRef.current();
            }
          } catch (error) {
            console.error("❌ [useEVCheckHub] Error in callback:", error);
          }
        } else {
          console.warn("⚠️ [useEVCheckHub] No callback registered");
        }
      }
    };

    // ✅ Đăng ký listeners trước khi start
    connection.on("ReceiveCreate", handleReceiveCreate);
    connection.on("ReceiveUpdate", handleReceiveUpdate);
    connection.on("ReceiveDelete", (entity, data) => {
      console.log("📩 [useEVCheckHub] ReceiveDelete:", { entity, data, evCheckId });
      // Nếu là dữ liệu của EVCheck và ID trùng
      if (entity === "EVCheck" && data?.id === evCheckId) {
        console.log("🔄 [useEVCheckHub] EVCheck deleted, reloading data...");
        if (onUpdateRef.current) {
          try {
            // ✅ Truyền entity và data vào callback nếu callback chấp nhận tham số
            if (onUpdateRef.current.length > 0) {
              onUpdateRef.current(entity, data);
            } else {
              onUpdateRef.current();
            }
          } catch (error) {
            console.error("❌ [useEVCheckHub] Error in callback:", error);
          }
        }
      }
    });

    connection.onreconnected((id) => console.log("✅ [useEVCheckHub] SignalR reconnected:", id));
    connection.onreconnecting((e) => console.log("🔄 [useEVCheckHub] SignalR reconnecting...", e));
    connection.onclose((e) => console.log("❌ [useEVCheckHub] SignalR connection closed:", e));

    // ✅ Start connection và xử lý lỗi
    const startConnection = async () => {
      try {
        await connection.start();
        console.log("✅ Connected to EVCheck SignalR hub");
        console.log("📡 Connection ID:", connection.connectionId);
      } catch (err) {
        // ✅ Ignore AbortError (xảy ra khi cleanup được gọi trước khi start hoàn tất)
        if (err.name === "AbortError" || 
            err.message?.includes("AbortError") || 
            err.message?.includes("stop() was called") ||
            err.message?.includes("Failed to start the HttpConnection before stop()")) {
          console.log("ℹ️ [useEVCheckHub] Connection start aborted (cleanup called)");
          return;
        }
        
        // ✅ Xử lý lỗi 404 - endpoint không tồn tại
        if (err.message?.includes("404") || err.statusCode === 404) {
          console.warn("⚠️ [useEVCheckHub] Endpoint not found (404). Hub URL:", hubUrl);
          console.warn("ℹ️ Backend may need to configure SignalR route for EVCheck.");
          console.warn("ℹ️ Real-time updates disabled, app vẫn chạy bình thường.");
          return;
        }
        
        console.error("❌ [useEVCheckHub] EVCheck SignalR connection error:", err);
        console.warn("ℹ️ Real-time updates disabled, app vẫn chạy bình thường.");
      }
    };

    startConnection();

    // ✅ Cleanup function
    return () => {
      if (connectionRef.current) {
        console.log("🔌 [useEVCheckHub] Cleanup: Disconnecting from SignalR hub");
        
        const currentConnection = connectionRef.current;
        connectionRef.current = null; // ✅ Set null trước để tránh race condition
        
        try {
          // ✅ Kiểm tra state và cleanup
          if (currentConnection.state !== signalR.HubConnectionState.Disconnected) {
            currentConnection.off("ReceiveCreate", handleReceiveCreate);
            currentConnection.off("ReceiveUpdate", handleReceiveUpdate);
            currentConnection.off("ReceiveDelete");
            
            // ✅ Stop và ignore AbortError
            currentConnection.stop().catch(err => {
              // ✅ Ignore các lỗi khi cleanup (có thể connection đã đóng)
              if (!err.message?.includes("AbortError") && 
                  !err.message?.includes("stop() was called") &&
                  !err.message?.includes("Cannot start")) {
                console.warn("⚠️ [useEVCheckHub] Error during stop:", err.message);
              }
            });
          }
        } catch (err) {
          // ✅ Ignore cleanup errors
          if (!err.message?.includes("AbortError")) {
            console.warn("⚠️ [useEVCheckHub] Cleanup error:", err.message);
          }
        }
      }
    };
  }, [evCheckId]); // ✅ Chỉ depend vào evCheckId, không depend vào onUpdate

  return connectionRef.current;
}

