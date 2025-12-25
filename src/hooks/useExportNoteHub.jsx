import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

export default function useExportNoteHub(onUpdate) {
  const connectionRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = user?.token;

    let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://bemodernestate.site/api";
    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
    const hubUrl = `${baseUrl}/hubs/notifyexportnote`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: token ? () => token : undefined,
        transport: signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    const handleReceiveCreate = (entity, data) => {
      if (onUpdateRef.current) {
        try {
          if (onUpdateRef.current.length > 0) {
            onUpdateRef.current(entity, data);
          } else {
            onUpdateRef.current();
          }
        } catch (error) {
          console.error("Error in handleReceiveCreate:", error);
        }
      }
    };

    const handleReceiveUpdate = (entity, data) => {
      if (onUpdateRef.current) {
        try {
          if (onUpdateRef.current.length > 0) {
            onUpdateRef.current(entity, data);
          } else {
            onUpdateRef.current();
          }
        } catch (error) {
          console.error("Error in handleReceiveUpdate:", error);
        }
      }
    };

    connection.on("ReceiveCreate", handleReceiveCreate);
    connection.on("ReceiveUpdate", handleReceiveUpdate);
    connection.on("ReceiveDelete", (entity, data) => {
      if (onUpdateRef.current) {
        try {
          if (onUpdateRef.current.length > 0) {
            onUpdateRef.current(entity, data);
          } else {
            onUpdateRef.current();
          }
        } catch (error) {
          console.error("Error in handleReceiveDelete:", error);
        }
      }
    });

    const startConnection = async () => {
      try {
        await connection.start();
      } catch (err) {
        if (err.name === "AbortError" || 
            err.message?.includes("AbortError") || 
            err.message?.includes("stop() was called") ||
            err.message?.includes("Failed to start the HttpConnection before stop()")) {
          return;
        }
        
        if (err.message?.includes("404") || err.statusCode === 404) {
          return;
        }
      }
    };

    startConnection();

    return () => {
      if (connectionRef.current) {
        const currentConnection = connectionRef.current;
        connectionRef.current = null;
        
        try {
          if (currentConnection.state !== signalR.HubConnectionState.Disconnected) {
            currentConnection.off("ReceiveCreate", handleReceiveCreate);
            currentConnection.off("ReceiveUpdate", handleReceiveUpdate);
            currentConnection.off("ReceiveDelete");
            
            currentConnection.stop().catch(err => {
              if (!err.message?.includes("AbortError") && 
                  !err.message?.includes("stop() was called") &&
                  !err.message?.includes("Cannot start")) {
              }
            });
          }
        } catch (err) {
          if (!err.message?.includes("AbortError")) {
          }
        }
      }
    };
  }, []);

  return connectionRef.current;
}

