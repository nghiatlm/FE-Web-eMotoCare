// src/hooks/useBookings.js
import { useState, useEffect } from "react";
import {
  fetchAppointments,
  createAppointmentService,
} from "../services/appointmentService";
import { fetchServiceStaff } from "../services/staffsService";

export const useBookings = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const STATUS_FLOW = {
    PENDING: ["APPROVED", "CANCELED"],
    APPROVED: ["CHECKED_IN"],
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

  // ✅ Lấy serviceCenterId từ staff hiện tại
  const getServiceCenterId = async () => {
    try {
      const staff = await fetchServiceStaff();
      const staffData = staff?.data?.data || staff?.data || staff;
      return staffData?.serviceCenterId || null;
    } catch (error) {
      console.error("Lỗi lấy serviceCenterId:", error);
      // Fallback: lấy từ localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.staff?.serviceCenterId || 
             user?.accountResponse?.staff?.serviceCenterId || 
             null;
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // ✅ Lấy serviceCenterId và filter theo trung tâm
      const serviceCenterId = await getServiceCenterId();
      const res = await fetchAppointments({ 
        page: 1, 
        pageSize: 20,
        serviceCenterId 
      });
      const list = res?.data?.rowDatas || [];
      setData(list);
      console.log("Fetched bookings:", list.length, "serviceCenterId:", serviceCenterId);
    } catch (error) {
      console.error("Lỗi fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (payload) => {
    try {
      await createAppointmentService(payload);
      await fetchBookings();
    } catch (err) {
      console.error("Lỗi tạo booking:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // CẬP NHẬT TRẠNG THÁI – LUÔN FETCH LẠI KHI GÁN KỸ THUẬT VIÊN
  const updateStatus = (id, newStatus, selectedTechnician = null) => {
    setData(prev =>
      prev.map(b =>
        b.id === id
          ? {
              ...b,
              status: (newStatus || b.status).toUpperCase(),
              technician: selectedTechnician || b.technician || null,
            }
          : b
      )
    );
    // luôn refetch để đồng bộ từ BE (nhất là quan hệ technician)
    fetchBookings();
  };
  

  return {
    data,
    loading,
    fetchBookings,
    updateStatus,
    canUpdateStatus,
    createBooking,
  };
};
