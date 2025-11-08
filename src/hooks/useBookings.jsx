import { useState, useEffect } from "react";
import { fetchAppointments } from "../services/appointmentService";

export const useBookings = () => {
  const [data, setData] = useState([]); // danh sách booking
  const [loading, setLoading] = useState(false);

  // Flow trạng thái hợp lệ
  const STATUS_FLOW = {
    PENDING: ["APPROVED", "CANCELED"],
    APPROVED: ["CHECKED_IN", "CANCELED"],
    CHECKED_IN: ["QUOTE_APPROVED"],
    QUOTE_APPROVED: ["REPAIR_COMPLETED"],
    REPAIR_COMPLETED: ["COMPLETED"],
    COMPLETED: [],
    CANCELED: [],
  };

  const canUpdateStatus = (booking, newStatus) => {
    const currentStatus = booking.status?.toUpperCase();
    const nextList = STATUS_FLOW[currentStatus] || [];
    return nextList.includes(newStatus.toUpperCase());
  };

  // Fetch booking từ API
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetchAppointments();
      const list = res?.data?.rowDatas || [];
      setData(list);
    } catch (error) {
      console.error("Lỗi fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Cập nhật trạng thái / technician trong local state
  const updateStatus = (id, newStatus, selectedTechnician = null) => {
    setData((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: newStatus.toUpperCase(),
              technician: selectedTechnician || b.technician || null,
            }
          : b
      )
    );
  };

  return { data, loading, fetchBookings, updateStatus, canUpdateStatus };
};
