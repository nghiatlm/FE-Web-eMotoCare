import { STATUS_COLORS, STATUS_MAP } from "../../utils/constants";
import { Button, Tag, Divider, Select, Card, Spin, Modal } from "antd";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, UserCheck } from "lucide-react";

import { fetchTechnicians } from "../../services/staffsService";
import TechnicianBookingDetailDrawer from "../../components/technician/TechnicanBookingDetailDrawer";
import {
  changeAppointmentStatusService,
  approveAppointmentService,
} from "../../services/appointmentService";
import { getAppointmentById } from "../../api/appointmentsApi";

import {
  createEVCheckService,
  fetchEVCheckByAppointmentService,
  fetchEVCheckDetailsServiceRe,
} from "../../services/evcheckService";
import { getLaborCostByRemediesService } from "../../services/priceserviceService";
import { getPartItemByIdService } from "../../services/partitemsService";

import Payment from "../../components/service-staff/Payment";
import PaymentInfo from "../../components/service-staff/PaymentInfo";
import PaymentHistory from "../../components/service-staff/PaymentHistory";
import { useBookings } from "../../hooks/useBookings";
import useAppointmentHub from "../../hooks/useAppointmentHub";

export default function StaffBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, updateStatus, fetchBookings } = useBookings();
  
  // Tìm booking từ danh sách đã có
  const bookingFromList = data.find(b => b.id === id);
  
  // ✅ State riêng cho booking detail để có thể reload độc lập
  const [booking, setBooking] = useState(bookingFromList);
  const [loadingBooking, setLoadingBooking] = useState(false);
  
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [currentEVCheckId, setCurrentEVCheckId] = useState(null);
  const [showTechnicianDrawer, setShowTechnicianDrawer] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [technicianFromEVCheck, setTechnicianFromEVCheck] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationFee, setCancellationFee] = useState(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [isPendingCancel, setIsPendingCancel] = useState(false); // ✅ Track xem có đang chờ thanh toán để hủy không

  // ✅ Ref để lưu loadBookingDetail function
  const loadBookingDetailRef = useRef(null);

  // ✅ Load booking detail từ API
  const loadBookingDetail = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoadingBooking(true);
      console.log("🔄 [StaffBookingDetailPage] Loading booking detail for ID:", id);
      const res = await getAppointmentById(id);
      const bookingData = res?.data?.data || res?.data || res;
      if (bookingData) {
        setBooking(bookingData);
        
        // ✅ Nếu khách đã hủy từ mobile và có cancellationFee, set vào state
        // Khi khách hủy, status đã là CANCELED và có cancellationFee từ backend
        if (bookingData.status === "CANCELED" && bookingData.cancellationFee > 0) {
          setCancellationFee(bookingData.cancellationFee);
          setIsPendingCancel(false); // ✅ Không phải đang chờ hủy, mà là thanh toán phí hủy đã có
        }
        
        console.log("✅ [StaffBookingDetailPage] Loaded booking detail - Status:", bookingData.status, "ID:", bookingData.id, "CancellationFee:", bookingData.cancellationFee, "CancelledBy:", bookingData.cancelledBy);
      } else {
        console.warn("⚠️ [StaffBookingDetailPage] No booking data found");
      }
    } catch (error) {
      console.error("❌ [StaffBookingDetailPage] Lỗi load booking detail:", error);
    } finally {
      setLoadingBooking(false);
    }
  }, [id]);

  // ✅ Lưu function vào ref để dùng trong SignalR callback
  useEffect(() => {
    loadBookingDetailRef.current = loadBookingDetail;
  }, [loadBookingDetail]);

  // ✅ Load booking detail khi component mount hoặc id thay đổi
  useEffect(() => {
    loadBookingDetail();
  }, [loadBookingDetail]);

  // ✅ Cập nhật booking khi bookingFromList thay đổi (từ useBookings)
  useEffect(() => {
    if (bookingFromList) {
      setBooking(bookingFromList);
    }
  }, [bookingFromList]);

  const status = booking?.status?.toUpperCase();
  
  // ✅ Lấy technician từ booking hoặc từ EVCheck
  const currentTechnician = booking?.technician || technicianFromEVCheck;

  // ✅ Kết nối SignalR để nhận real-time updates cho appointment
  useAppointmentHub((entity, data) => {
    console.log("🔄 [StaffBookingDetailPage] SignalR: Appointment updated", { 
      entity, 
      data, 
      currentId: id,
      appointmentId: data?.id || data?.appointmentId || null
    });
    
    // ✅ Luôn reload booking detail khi nhận được SignalR update
    console.log("✅ [StaffBookingDetailPage] SignalR: Reloading booking detail...");
    
    // ✅ Reload booking detail từ ref để tránh stale closure
    if (loadBookingDetailRef.current) {
      loadBookingDetailRef.current();
    }
    
    // ✅ Cũng reload danh sách để đồng bộ
    if (fetchBookings) {
      fetchBookings();
    }
  });

  useEffect(() => {
    const loadTechs = async () => {
      if (status !== "CHECKED_IN") return;

      try {
        setLoadingTechs(true);
        const list = await fetchTechnicians();
        setTechnicians(list);
      } catch {
        toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể tải danh sách kỹ thuật viên"));
      } finally {
        setLoadingTechs(false);
      }
    };

    if (booking) {
      loadTechs();
      setSelectedTechnician(null);
    }
  }, [booking, status]);

  useEffect(() => {
    const loadEV = async () => {
      if (!booking?.id) return;

      try {
        const evCheck = await fetchEVCheckByAppointmentService(booking.id);
        if (evCheck) {
          setCurrentEVCheckId(evCheck.id);
          // ✅ Lấy technician từ evCheck nếu có
          const tech = evCheck.taskExecutor || evCheck.technician || null;
          if (tech) {
            setTechnicianFromEVCheck(tech);
          }
        }
      } catch {}
    };

    if (booking) loadEV();
  }, [booking]);

  // ✅ Hiển thị loading khi đang load dữ liệu
  if (loading || loadingBooking) {
    return (
      <div style={{ padding: 24, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  // ✅ Chỉ hiển thị "Không tìm thấy" khi đã load xong mà không có dữ liệu
  if (!booking) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: "#999" }}>Không tìm thấy lịch hẹn</p>
            <Button onClick={() => navigate("/staff/booking/list")} style={{ marginTop: 16 }}>
              Quay lại danh sách
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleAssignTechnician = async () => {
    if (!selectedTechnician)
      return toast.warning("Vui lòng chọn kỹ thuật viên");

    try {
      const payload = {
        appointmentId: booking.id,
        taskExecutorId: selectedTechnician.id,
      };

      const res = await createEVCheckService(payload);
      const evCheckId = res?.id || res?.data?.id;
      if (evCheckId) {
        setCurrentEVCheckId(evCheckId);
        setTechnicianFromEVCheck(selectedTechnician); // ✅ Cập nhật technician ngay lập tức
      }

      if (status === "APPROVED") {
        await changeAppointmentStatusService(booking.id, "CHECKED_IN");
        updateStatus(booking.id, "CHECKED_IN", selectedTechnician);
      } else {
        updateStatus(booking.id, booking.status, selectedTechnician);
      }

      toast.success("Đã gán kỹ thuật viên và tạo EVCheck!");
    } catch (error) {
      console.error("Lỗi gán kỹ thuật viên:", error);
      toast.error((error?.response?.data?.message || error?.data?.message || error?.message || "Không thể gán kỹ thuật viên!"));
    }
  };

  // ✅ Tính phí hủy (laborCost) từ các hạng mục đã có trong EVCheck
  const calculateCancellationFee = async () => {
    try {
      // ✅ Lấy EVCheck từ appointment
      const evCheck = await fetchEVCheckByAppointmentService(booking.id);
      if (!evCheck || !evCheck.id) {
        return 0; // Không có EVCheck thì không có phí hủy
      }

      // ✅ Lấy danh sách EVCheck details
      const evCheckDetailsRes = await fetchEVCheckDetailsServiceRe(evCheck.id);
      const details = evCheckDetailsRes?.evCheckDetails || [];

      if (details.length === 0) {
        return 0; // Không có hạng mục thì không có phí hủy
      }

      // ✅ Tính tổng laborCost từ các hạng mục
      // Lấy partTypeId từ partItem.part.partType.id (theo cấu trúc API)
      console.log("🔍 [calculateCancellationFee] Details:", details);
      
      let totalLaborCost = 0;
      const laborCostPromises = details.map(async (detail, index) => {
        // ✅ Lấy partItemId từ detail
        const partItemId = detail.partItemId || detail.partItem?.id || null;
        
        if (!partItemId) {
          console.warn(`⚠️ [calculateCancellationFee] Detail ${index} - Không có partItemId`);
          return 0;
        }
        
        // ✅ Gọi API để lấy thông tin đầy đủ của partItem (vehicle part item)
        let partTypeId = null;
        try {
          const partItemDetail = await getPartItemByIdService(partItemId);
          console.log(`🔍 [calculateCancellationFee] Detail ${index} - partItemDetail từ API:`, partItemDetail);
          
          // ✅ Lấy partTypeId từ partItem.part.partType.id (cấu trúc vehicle part item)
          partTypeId = 
            partItemDetail?.part?.partType?.id || 
            partItemDetail?.partTypeId ||
            null;
          
          console.log(`🔍 [calculateCancellationFee] Detail ${index} - partTypeId từ API: ${partTypeId}`);
        } catch (error) {
          console.error(`❌ [calculateCancellationFee] Lỗi lấy partItem ${partItemId}:`, error);
          // ✅ Fallback: thử lấy từ detail.partItem nếu có
          partTypeId = detail.partItem?.part?.partType?.id || null;
        }
        
        // ✅ Lấy remedies (biện pháp) từ detail
        const remedies = detail.remedies || "NONE";
        
        console.log(`🔍 [calculateCancellationFee] Detail ${index} - partTypeId: ${partTypeId}, remedies: ${remedies}`);
        
        // ✅ Chỉ tính phí khi có partTypeId và remedies
        if (!partTypeId || !remedies) {
          console.warn(`⚠️ [calculateCancellationFee] Detail ${index} - Thiếu partTypeId hoặc remedies:`, { 
            partTypeId, 
            remedies,
            partItemId
          });
          return 0;
        }
        
        // ✅ Gọi API lấy laborCost theo partTypeId và remedies
        try {
          console.log(`📞 [calculateCancellationFee] Gọi API với partTypeId: ${partTypeId}, remedies: ${remedies}`);
          const laborCost = await getLaborCostByRemediesService(partTypeId, remedies);
          console.log(`✅ [calculateCancellationFee] LaborCost cho partTypeId: ${partTypeId}, remedies: ${remedies} = ${laborCost}`);
          return laborCost || 0;
        } catch (error) {
          console.error(`❌ [calculateCancellationFee] Lỗi lấy laborCost cho partTypeId: ${partTypeId}, remedies: ${remedies}:`, error);
          return 0;
        }
      });

      const laborCosts = await Promise.all(laborCostPromises);
      totalLaborCost = laborCosts.reduce((sum, cost) => sum + cost, 0);

      return totalLaborCost;
    } catch (error) {
      console.error("❌ Lỗi tính phí hủy:", error);
      return 0; // Nếu lỗi thì trả về 0
    }
  };

  // ✅ Xử lý khi click nút hủy
  const handleCancelClick = async () => {
    setIsCalculatingFee(true);
    try {
      const fee = await calculateCancellationFee();
      setCancellationFee(fee);
      setIsCancelModalOpen(true);
    } catch (error) {
      console.error("Lỗi tính phí hủy:", error);
      toast.error((error?.response?.data?.message || error?.data?.message || error?.message || "Không thể tính phí hủy. Vui lòng thử lại!"));
    } finally {
      setIsCalculatingFee(false);
    }
  };

  // ✅ TRƯỜNG HỢP 1: Xác nhận hủy lịch hẹn (Staff hủy trên UI)
  // Flow: Tính tiền → Thanh toán → Cập nhật status thành CANCELED
  const handleConfirmCancel = async () => {
    setIsCancelModalOpen(false);
    
    // ✅ Nếu có phí hủy, mở modal thanh toán trước (chưa cập nhật status)
    if (cancellationFee > 0) {
      setIsPendingCancel(true); // ✅ Đánh dấu đang chờ thanh toán để hủy (staff hủy)
      setIsPaymentModalOpen(true);
      toast.info("Vui lòng thanh toán phí hủy để hoàn tất việc hủy lịch hẹn.");
    } else {
      // ✅ Nếu không có phí hủy, cập nhật status ngay
      try {
        await changeAppointmentStatusService(booking.id, "CANCELED", {
          cancellationFee: 0,
          cancelledBy: "STAFF"
        });
        updateStatus(booking.id, "CANCELED", booking.technician);
        toast.success("Đã hủy lịch hẹn thành công!");
        navigate("/staff/booking/list");
      } catch (e) {
        toast.error((e?.response?.data?.message || e?.data?.message || e?.message || "Không thể hủy lịch hẹn!"));
      }
    }
  };

  // ✅ Xử lý sau khi thanh toán thành công
  const handlePaymentSuccess = async (paymentResult) => {
    if (isPendingCancel) {
      // ✅ TRƯỜNG HỢP 1: Staff hủy trên UI
      // Tính tiền → Thanh toán → Cập nhật status thành CANCELED
      try {
        await changeAppointmentStatusService(booking.id, "CANCELED", {
          cancellationFee: cancellationFee,
          cancelledBy: "STAFF"
        });
        
        updateStatus(booking.id, "CANCELED", booking.technician);
        setIsPendingCancel(false);
        toast.success("Đã thanh toán phí hủy và hủy lịch hẹn thành công!");
        navigate("/staff/booking/list");
      } catch (e) {
        toast.error((e?.response?.data?.message || e?.data?.message || e?.message || "Không thể cập nhật trạng thái hủy!"));
        setIsPendingCancel(false);
      }
    } else if (status === "CANCELED") {
      // ✅ TRƯỜNG HỢP 2: Khách hủy từ mobile/UI khách
      // Trạng thái đã là CANCELED → Tính tiền → Thanh toán → CHỈ cập nhật payment status, KHÔNG cập nhật appointment status
      toast.success("Đã thanh toán phí hủy thành công!");
      await loadBookingDetail(); // ✅ Reload để cập nhật thông tin booking (payment status)
    }
  };

  // ✅ Tính phí hủy (laborCost) từ các hạng mục đã có trong EVCheck
  const calculateCancellationFee = async () => {
    try {
      // ✅ Lấy EVCheck từ appointment
      const evCheck = await fetchEVCheckByAppointmentService(booking.id);
      if (!evCheck || !evCheck.id) {
        return 0; // Không có EVCheck thì không có phí hủy
      }

      // ✅ Lấy danh sách EVCheck details
      const evCheckDetailsRes = await fetchEVCheckDetailsServiceRe(evCheck.id);
      const details = evCheckDetailsRes?.evCheckDetails || [];

      if (details.length === 0) {
        return 0; // Không có hạng mục thì không có phí hủy
      }

      // ✅ Tính tổng laborCost từ các hạng mục
      // Lấy partTypeId từ partItem.part.partType.id (theo cấu trúc API)
      console.log("🔍 [calculateCancellationFee] Details:", details);
      
      let totalLaborCost = 0;
      const laborCostPromises = details.map(async (detail, index) => {
        // ✅ Lấy partItemId từ detail
        const partItemId = detail.partItemId || detail.partItem?.id || null;
        
        if (!partItemId) {
          console.warn(`⚠️ [calculateCancellationFee] Detail ${index} - Không có partItemId`);
          return 0;
        }
        
        // ✅ Gọi API để lấy thông tin đầy đủ của partItem (vehicle part item)
        let partTypeId = null;
        try {
          const partItemDetail = await getPartItemByIdService(partItemId);
          console.log(`🔍 [calculateCancellationFee] Detail ${index} - partItemDetail từ API:`, partItemDetail);
          
          // ✅ Lấy partTypeId từ partItem.part.partType.id (cấu trúc vehicle part item)
          partTypeId = 
            partItemDetail?.part?.partType?.id || 
            partItemDetail?.partTypeId ||
            null;
          
          console.log(`🔍 [calculateCancellationFee] Detail ${index} - partTypeId từ API: ${partTypeId}`);
        } catch (error) {
          console.error(`❌ [calculateCancellationFee] Lỗi lấy partItem ${partItemId}:`, error);
          // ✅ Fallback: thử lấy từ detail.partItem nếu có
          partTypeId = detail.partItem?.part?.partType?.id || null;
        }
        
        // ✅ Lấy remedies (biện pháp) từ detail
        const remedies = detail.remedies || "NONE";
        
        console.log(`🔍 [calculateCancellationFee] Detail ${index} - partTypeId: ${partTypeId}, remedies: ${remedies}`);
        
        // ✅ Chỉ tính phí khi có partTypeId và remedies
        if (!partTypeId || !remedies) {
          console.warn(`⚠️ [calculateCancellationFee] Detail ${index} - Thiếu partTypeId hoặc remedies:`, { 
            partTypeId, 
            remedies,
            partItemId
          });
          return 0;
        }
        
        // ✅ Gọi API lấy laborCost theo partTypeId và remedies
        try {
          console.log(`📞 [calculateCancellationFee] Gọi API với partTypeId: ${partTypeId}, remedies: ${remedies}`);
          const laborCost = await getLaborCostByRemediesService(partTypeId, remedies);
          console.log(`✅ [calculateCancellationFee] LaborCost cho partTypeId: ${partTypeId}, remedies: ${remedies} = ${laborCost}`);
          return laborCost || 0;
        } catch (error) {
          console.error(`❌ [calculateCancellationFee] Lỗi lấy laborCost cho partTypeId: ${partTypeId}, remedies: ${remedies}:`, error);
          return 0;
        }
      });

      const laborCosts = await Promise.all(laborCostPromises);
      totalLaborCost = laborCosts.reduce((sum, cost) => sum + cost, 0);

      return totalLaborCost;
    } catch (error) {
      console.error("❌ Lỗi tính phí hủy:", error);
      return 0; // Nếu lỗi thì trả về 0
    }
  };

  // ✅ Xử lý khi click nút hủy
  const handleCancelClick = async () => {
    setIsCalculatingFee(true);
    try {
      const fee = await calculateCancellationFee();
      setCancellationFee(fee);
      setIsCancelModalOpen(true);
    } catch (error) {
      console.error("Lỗi tính phí hủy:", error);
      toast.error("Không thể tính phí hủy. Vui lòng thử lại!");
    } finally {
      setIsCalculatingFee(false);
    }
  };

  // ✅ TRƯỜNG HỢP 1: Xác nhận hủy lịch hẹn (Staff hủy trên UI)
  // Flow: Tính tiền → Thanh toán → Cập nhật status thành CANCELED
  const handleConfirmCancel = async () => {
    setIsCancelModalOpen(false);
    
    // ✅ Nếu có phí hủy, mở modal thanh toán trước (chưa cập nhật status)
    if (cancellationFee > 0) {
      setIsPendingCancel(true); // ✅ Đánh dấu đang chờ thanh toán để hủy (staff hủy)
      setIsPaymentModalOpen(true);
      toast.info("Vui lòng thanh toán phí hủy để hoàn tất việc hủy lịch hẹn.");
    } else {
      // ✅ Nếu không có phí hủy, cập nhật status ngay
      try {
        await changeAppointmentStatusService(booking.id, "CANCELED", {
          cancellationFee: 0,
          cancelledBy: "STAFF"
        });
        updateStatus(booking.id, "CANCELED", booking.technician);
        toast.success("Đã hủy lịch hẹn thành công!");
        navigate("/staff/booking/list");
      } catch (e) {
        toast.error(e.message || "Không thể hủy lịch hẹn!");
      }
    }
  };

  // ✅ Xử lý sau khi thanh toán thành công
  const handlePaymentSuccess = async (paymentResult) => {
    if (isPendingCancel) {
      // ✅ TRƯỜNG HỢP 1: Staff hủy trên UI
      // Tính tiền → Thanh toán → Cập nhật status thành CANCELED
      try {
        await changeAppointmentStatusService(booking.id, "CANCELED", {
          cancellationFee: cancellationFee,
          cancelledBy: "STAFF"
        });
        
        updateStatus(booking.id, "CANCELED", booking.technician);
        setIsPendingCancel(false);
        toast.success("Đã thanh toán phí hủy và hủy lịch hẹn thành công!");
        navigate("/staff/booking/list");
      } catch (e) {
        toast.error(e.message || "Không thể cập nhật trạng thái hủy!");
        setIsPendingCancel(false);
      }
    } else if (status === "CANCELED") {
      // ✅ TRƯỜNG HỢP 2: Khách hủy từ mobile/UI khách
      // Trạng thái đã là CANCELED → Tính tiền → Thanh toán → CHỈ cập nhật payment status, KHÔNG cập nhật appointment status
      toast.success("Đã thanh toán phí hủy thành công!");
      await loadBookingDetail(); // ✅ Reload để cập nhật thông tin booking (payment status)
    }
  };

  const handleChangeStatus = async (newStatus) => {
    try {
      if (newStatus === "APPROVED") {
        await approveAppointmentService(booking.id);
      } else {
        await changeAppointmentStatusService(booking.id, newStatus);
      }

      toast.success(`Cập nhật trạng thái: ${STATUS_MAP[newStatus]}`);
      updateStatus(booking.id, newStatus, booking.technician);
      navigate("/staff/booking/list");
    } catch (e) {
      toast.error((e?.response?.data?.message || e?.data?.message || e?.message || "Không thể cập nhật trạng thái!"));
    }
  };

  const handleManualCheckIn = async () => {
    if (!booking.checkinQRCode) {
      toast.error("Lịch hẹn chưa có mã QR check-in!");
      return;
    }

    try {
      await changeAppointmentStatusService(booking.id, "CHECKED_IN", {
        code: booking.code,
        checkinQRCode: booking.checkinQRCode,
      });

      toast.success("Check-in thành công!");
      updateStatus(booking.id, "CHECKED_IN");
    } catch (error) {
      console.error("Lỗi check-in:", error);
      toast.error((error?.response?.data?.message || error?.data?.message || error?.message || "Check-in thất bại!"));
    }
  };

  return (
    <>
      <div style={{ padding: 24, width: "100%", background: "#fff7f3", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate("/staff/booking/list")}
            style={{ color: "#ff4d4f" }}
          >
            Quay lại
          </Button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#c41e0e" }}>
              Chi tiết lịch hẹn: {booking.code}
            </h2>
            <Tag
              color={STATUS_COLORS[status]}
              style={{ fontSize: 14, padding: "4px 12px" }}>
              {STATUS_MAP[status] || status}
            </Tag>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* GENERAL INFO */}
          <Card
            style={{ marginBottom: 24, borderRadius: 8 }}
            bodyStyle={{ padding: "24px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
              Thông tin chung
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
              <p style={{ margin: 0 }}>
                <strong>Mã lịch hẹn:</strong> {booking.code}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Người đặt:</strong> {booking.customer?.firstName}{" "}
                {booking.customer?.lastName}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Ngày hẹn:</strong>{" "}
                {new Date(booking.appointmentDate).toLocaleDateString("vi-VN")}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Thời gian:</strong>{" "}
                {booking.slotTime ? (() => {
                  const [start, end] = booking.slotTime.replace("H", "").split("_");
                  return `${start}:00-${end}:00`;
                })() : "—"}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Trung tâm dịch vụ:</strong> {booking.serviceCenter?.name || ""}
              </p>
              {(booking?.type || "").toUpperCase() === "MAINTENANCE_TYPE" && (
                <div>
                  <strong>Giai đoạn bảo dưỡng:</strong> {booking.maintenanceStage?.name || ""}
                </div>
              )}
              {booking.note && (
                <p style={{ margin: 0, gridColumn: "1 / -1" }}>
                  <strong>Ghi chú:</strong> {booking.note}
                </p>
              )}
            </div>
          </Card>

          {/* QR CODE DISPLAY */}
          {status === "APPROVED" && booking.checkinQRCode && (
            <Card
              style={{ marginBottom: 24, borderRadius: 8 }}
              bodyStyle={{ padding: "24px", textAlign: "center" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
                Mã QR Check-in
              </h3>
              <img
                src={booking.checkinQRCode}
                alt='QR Check-in'
                style={{ width: 200, margin: "0 auto", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
              />
              <p style={{ marginTop: 16, color: "#666", fontSize: 14 }}>
                Khách dùng mã này để thực hiện check-in tại quầy.
              </p>

              <div style={{ marginTop: 24 }}>
                <Button
                  type='primary'
                  size='large'
                  danger
                  onClick={handleManualCheckIn}
                  style={{ minWidth: 200 }}>
                  Check-in ngay
                </Button>
              </div>
            </Card>
          )}

          {/* ASSIGN TECHNICIAN */}
          {status === "CHECKED_IN" && !currentTechnician && (
            <Card 
              style={{ 
                marginBottom: 24,
                borderRadius: 8,
                border: "1px solid #f0f0f0"
              }}
              bodyStyle={{ padding: "20px" }}>
              <h3 style={{ 
                marginBottom: 16, 
                fontSize: 16, 
                fontWeight: 600,
                color: "#262626",
                paddingBottom: 12,
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <UserPlus size={16} color="#595959" />
                Chọn kỹ thuật viên
              </h3>
              <div style={{ marginBottom: 16 }}>
                <Select
                  style={{ width: "100%" }}
                  placeholder='Chọn kỹ thuật viên'
                  loading={loadingTechs}
                  value={selectedTechnician?.id}
                  options={technicians.map((t) => ({
                    value: t.id,
                    label: `${t.firstName} ${t.lastName}${t.staffCode ? ` (${t.staffCode})` : ''}`,
                  }))}
                  onChange={(value) =>
                    setSelectedTechnician(technicians.find((t) => t.id === value))
                  }
                />
              </div>
              <Button
                type='primary'
                block
                disabled={!selectedTechnician || loadingTechs}
                loading={loadingTechs}
                onClick={handleAssignTechnician}>
                Xác nhận kỹ thuật viên
              </Button>
            </Card>
          )}

          {currentTechnician && (
            <Card 
              style={{ 
                marginBottom: 24,
                borderRadius: 8,
                border: "1px solid #f0f0f0"
              }}
              bodyStyle={{ padding: "20px" }}>
              <h3 style={{ 
                marginBottom: 12, 
                fontSize: 16, 
                fontWeight: 600,
                color: "#262626",
                paddingBottom: 12,
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <UserCheck size={16} color="#595959" />
                Kỹ thuật viên phụ trách
              </h3>
              <p style={{ margin: 0, fontSize: 15, color: "#262626" }}>
                <strong>{currentTechnician.firstName} {currentTechnician.lastName}</strong>
                {currentTechnician.staffCode && (
                  <span style={{ color: "#8c8c8c", marginLeft: 8 }}>
                    ({currentTechnician.staffCode})
                  </span>
                )}
              </p>
            </Card>
          )}

          <Card
            style={{ marginBottom: 24, borderRadius: 8 }}
            bodyStyle={{ padding: "24px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
              Kết quả kiểm tra EVCheck
            </h3>
            {!currentTechnician ? (
              <div style={{ textAlign: "center", color: "#999", padding: "20px 0" }}>
                Kỹ thuật viên chưa thực hiện kiểm tra.
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type='primary'
                  onClick={() => setShowTechnicianDrawer(true)}>
                  Xem chi tiết EVCheck
                </Button>
              </div>
            )}
          </Card>

          {/* ✅ Thông báo khi lịch hẹn bị hủy */}
          {status === "CANCELED" && (
            <Card
              style={{ 
                marginBottom: 24, 
                borderRadius: 8,
                border: "2px solid #ff4d4f",
                backgroundColor: "#fff1f0"
              }}
              bodyStyle={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: "50%", 
                  backgroundColor: "#ff4d4f", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  color: "white",
                  fontSize: 20,
                  fontWeight: "bold"
                }}>
                  !
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#c41e0e" }}>
                    Lịch hẹn đã bị hủy
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#666" }}>
                    {/* ✅ Phân biệt ai đã hủy */}
                    {booking.cancelledBy === "CUSTOMER" || booking.cancelledBy === "MOBILE" ? (
                      "Khách hàng đã hủy lịch hẹn này từ ứng dụng mobile."
                    ) : booking.cancelledBy === "STAFF" || booking.cancelledBy === "WEB" ? (
                      "Nhân viên đã hủy lịch hẹn này từ hệ thống web."
                    ) : (
                      "Lịch hẹn đã bị hủy."
                    )}
                  </p>
                </div>
              </div>
              
              {/* ✅ Hiển thị phí hủy nếu có */}
              {booking.cancellationFee > 0 ? (
                <div style={{ 
                  marginTop: 16, 
                  padding: 16, 
                  backgroundColor: "#fff7e6", 
                  borderRadius: 8, 
                  border: "1px solid #ffd591" 
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, color: "#d46b08", fontWeight: 600 }}>
                        Phí hủy lịch hẹn:
                      </p>
                      <p style={{ margin: "8px 0 0 0", fontSize: 20, color: "#d46b08", fontWeight: 700 }}>
                        {booking.cancellationFee.toLocaleString("vi-VN")} VNĐ
                      </p>
                    </div>
                    <Button
                      type="primary"
                      danger
                      size="large"
                      onClick={() => {
                        // ✅ Sử dụng cancellationFee từ booking (đã có từ API khi khách hủy)
                        setCancellationFee(booking.cancellationFee);
                        setIsPendingCancel(false); // ✅ Không phải đang chờ hủy, mà là thanh toán phí hủy đã có
                        setIsPaymentModalOpen(true);
                      }}>
                      Thanh toán phí hủy
                    </Button>
                  </div>
                </div>
              ) : (
                // ✅ Nếu chưa có phí hủy, hiển thị nút để tính phí hủy
                <div style={{ 
                  marginTop: 16, 
                  padding: 16, 
                  backgroundColor: "#f0f0f0", 
                  borderRadius: 8, 
                  border: "1px solid #d9d9d9" 
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, color: "#595959", fontWeight: 600 }}>
                        Chưa tính phí hủy lịch hẹn
                      </p>
                      <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#8c8c8c" }}>
                        Vui lòng tính phí hủy dựa trên các hạng mục đã kiểm tra
                      </p>
                    </div>
                    <Button
                      type="primary"
                      danger
                      size="large"
                      loading={isCalculatingFee}
                      onClick={async () => {
                        // ✅ TRƯỜNG HỢP 2: Khách đã hủy từ mobile/UI khách
                        // Flow: Trạng thái đã CANCELED → Tính tiền → Thanh toán → CHỈ cập nhật payment status, KHÔNG cập nhật appointment status
                        setIsCalculatingFee(true);
                        try {
                          const fee = await calculateCancellationFee();
                          if (fee > 0) {
                            setCancellationFee(fee);
                            setIsPendingCancel(false); // ✅ Không phải đang chờ hủy, mà là thanh toán phí hủy cho lịch đã hủy
                            setIsPaymentModalOpen(true);
                          } else {
                            toast.info("Không có phí hủy cho lịch hẹn này.");
                          }
                        } catch (error) {
                          console.error("Lỗi tính phí hủy:", error);
                          toast.error((error?.response?.data?.message || error?.data?.message || error?.message || "Không thể tính phí hủy. Vui lòng thử lại!"));
                        } finally {
                          setIsCalculatingFee(false);
                        }
                      }}>
                       Thanh toán phí hủy
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Thông tin thanh toán / Lịch sử thanh toán */}
          {currentTechnician && (
            <div style={{ marginBottom: 24 }}>
              {status === "COMPLETED" ? (
                // ✅ Đã hoàn thành: Hiển thị lịch sử thanh toán (không có nút thanh toán)
                <PaymentHistory booking={booking} />
              ) : (status === "REPAIR_COMPLETED" || status === "QUOTE_APPROVED") ? (
                // ✅ Chưa hoàn thành: Hiển thị thông tin thanh toán (có nút "Xử lý thanh toán")
                <PaymentInfo
                  booking={booking}
                  onOpenPayment={() => setIsPaymentModalOpen(true)}
                />
              ) : null}
            </div>
          )}

          <Divider />

          {/* ACTION BUTTONS */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            {status === "PENDING" && (
              <>
                <Button 
                  danger 
                  onClick={handleCancelClick}
                  loading={isCalculatingFee}>
                  Hủy
                </Button>
                <Button
                  type='primary'
                  onClick={() => handleChangeStatus("APPROVED")}
                  style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" }}>
                  Chấp nhận
                </Button>
              </>
            )}
            {(status === "APPROVED" || status === "CHECKED_IN") && (
              <Button 
                danger 
                onClick={handleCancelClick}
                loading={isCalculatingFee}>
                Hủy lịch hẹn
              </Button>
            )}
            {(status === "INSPECTION_COMPLETED" || status === "QUOTE_APPROVED") && (
              <Button 
                danger 
                onClick={handleCancelClick}
                loading={isCalculatingFee}>
                Hủy lịch hẹn
              </Button>
            )}
            {status === "REPAIR_COMPLETED" && (
              <Button
                type='primary'
                onClick={() => setIsPaymentModalOpen(true)}
                style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" }}>
                Hoàn tất / Thanh toán
              </Button>
            )}
            {/* ✅ Khi đã hủy, không hiển thị nút hành động */}
            {status === "CANCELED" && (
              <div style={{ color: "#999", fontSize: 14 }}>
                Lịch hẹn đã bị hủy
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <TechnicianBookingDetailDrawer
        booking={booking}
        open={showTechnicianDrawer}
        onClose={() => setShowTechnicianDrawer(false)}
        initialEVCheckId={currentEVCheckId}
        readOnly
      />

      <Payment
        open={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          // ✅ Nếu đang chờ thanh toán để hủy mà đóng modal, reset state
          if (isPendingCancel) {
            setIsPendingCancel(false);
          }
        }}
        booking={booking}
        onPaymentSuccess={handlePaymentSuccess}
        cancellationFee={cancellationFee}
        isPendingCancel={isPendingCancel}
      />

      {/* ✅ Modal xác nhận hủy lịch hẹn */}
      <Modal
        title="Xác nhận hủy lịch hẹn"
        open={isCancelModalOpen}
        onOk={handleConfirmCancel}
        onCancel={() => setIsCancelModalOpen(false)}
        okText="Xác nhận hủy"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}>
        <div style={{ padding: "16px 0" }}>
          {cancellationFee > 0 ? (
            <>
              <p style={{ fontSize: 16, marginBottom: 12, fontWeight: 500 }}>
                Bạn có chắc muốn hủy lịch hẹn này?
              </p>
              <div style={{ 
                padding: 16, 
                backgroundColor: "#fff7e6", 
                borderRadius: 8, 
                border: "1px solid #ffd591",
                marginTop: 16 
              }}>
                <p style={{ margin: 0, fontSize: 14, color: "#d46b08", fontWeight: 600 }}>
                  ⚠️ Phí hủy lịch hẹn:
                </p>
                <p style={{ margin: "8px 0 0 0", fontSize: 20, color: "#d46b08", fontWeight: 700 }}>
                  {cancellationFee.toLocaleString("vi-VN")} VNĐ
                </p>
                <p style={{ margin: "8px 0 0 0", fontSize: 12, color: "#8c8c8c" }}>
                  Phí này được tính dựa trên các hạng mục đã thực hiện trong quá trình kiểm tra.
                </p>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 16 }}>
              Bạn có chắc muốn hủy lịch hẹn này? Không có phí hủy.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}

