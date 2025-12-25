import { useState, useEffect } from "react";
import {
  fetchAppointments,
  createAppointmentService,
} from "../services/appointmentService";
import { fetchTechnicianByAccountId } from "../services/staffsService";
import { getStaffByAccountId } from "../api/staffsApi";
import useAppointmentHub from "./useAppointmentHub";

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

  const getServiceCenterId = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const accountId = user?.accountResponse?.id;
      
      if (!accountId) {
        return user?.staff?.serviceCenterId || 
               user?.accountResponse?.staff?.serviceCenterId || 
               user?.accountResponse?.serviceCenterId ||
               user?.serviceCenterId ||
               null;
      }

      // ✅ Lấy serviceCenterId từ staff của user hiện tại
      const staffResponse = await getStaffByAccountId(accountId);
      const staffData = staffResponse?.data?.rowDatas?.[0] || 
                        staffResponse?.data?.[0] ||
                        staffResponse?.data?.data ||
                        staffResponse?.data ||
                        staffResponse;
      
      return staffData?.serviceCenterId || 
             staffData?.serviceCenter?.id ||
             user?.staff?.serviceCenterId || 
             user?.accountResponse?.staff?.serviceCenterId || 
             user?.accountResponse?.serviceCenterId ||
             user?.serviceCenterId ||
             null;
    } catch (error) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.staff?.serviceCenterId || 
             user?.accountResponse?.staff?.serviceCenterId || 
             user?.accountResponse?.serviceCenterId ||
             user?.serviceCenterId ||
             null;
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const roleName = user?.accountResponse?.roleName;
      const accountId = user?.accountResponse?.id;

      let list = [];

      if (roleName === "ROLE_TECHNICIAN" && accountId) {
        const technician = await fetchTechnicianByAccountId(accountId);
        const staffId = technician?.id;
        
        if (staffId) {
          const res = await fetchAppointments({ 
            page: 1, 
            pageSize: 1000,
            technicianId: staffId
          });
          list = res?.data?.rowDatas || res?.data || res || [];
        }
      } else {
        const serviceCenterId = await getServiceCenterId();
        const res = await fetchAppointments({ 
          page: 1, 
          pageSize: 1000,
          serviceCenterId 
        });
        list = res?.data?.rowDatas || [];
      }

      setData(list);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (payload) => {
    try {
      await createAppointmentService(payload);
      await fetchBookings();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useAppointmentHub(() => {
    fetchBookings();
  });

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
