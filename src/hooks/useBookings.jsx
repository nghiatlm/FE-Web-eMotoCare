// src/hooks/useBookings.js
import { useState, useEffect } from "react";
import {
  fetchAppointments,
  createAppointmentService,
} from "../services/appointmentService";
import { fetchServiceStaff, fetchTechnicianByAccountId } from "../services/staffsService";
import useAppointmentHub from "./useAppointmentHub"; // ✅ Import hook SignalR cho Appointment

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
      // ✅ Kiểm tra role của user
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const roleName = user?.accountResponse?.roleName;
      const accountId = user?.accountResponse?.id;

      let list = [];

      if (roleName === "ROLE_TECHNICIAN" && accountId) {
        // ✅ Nếu là technician, lấy technician id (staffId) từ accountId
        const technician = await fetchTechnicianByAccountId(accountId);
        const staffId = technician?.id; // staffId chính là id của technician staff
        
        if (staffId) {
          // ✅ Gọi API get all với query param technicianId (staffId là id của technician)
          const res = await fetchAppointments({ 
            page: 1, 
            pageSize: 1000,
            technicianId: staffId // technicianId = staffId (id của technician)
          });
          list = res?.data?.rowDatas || res?.data || res || [];
          console.log("Fetched technician bookings:", list.length, "technicianId:", staffId);
        } else {
          console.warn("Không tìm thấy staffId cho technician với accountId:", accountId);
        }
      } else {
        // ✅ Nếu là staff/admin, lấy theo serviceCenterId
        const serviceCenterId = await getServiceCenterId();
        const res = await fetchAppointments({ 
          page: 1, 
          pageSize: 20,
          serviceCenterId 
        });
        list = res?.data?.rowDatas || [];
        console.log("Fetched staff bookings:", list.length, "serviceCenterId:", serviceCenterId);
      }

      setData(list);
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

  // ✅ Kết nối SignalR để nhận real-time updates cho Appointment
  // Khi staff tạo booking mới, cập nhật trạng thái, hoặc gán technician,
  // technician sẽ tự động nhận được update và reload danh sách
  useAppointmentHub(() => {
    console.log("🔄 SignalR: Appointment updated, reloading bookings...");
    fetchBookings(); // ✅ Tự động reload danh sách booking
  });

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
