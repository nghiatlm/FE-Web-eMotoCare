import { STATUS_COLORS, STATUS_MAP, UI_COLORS } from "../../utils/constants";
import { Button, Tag, Divider, Select, Card, Spin, Modal, Space, Typography, Input } from "antd";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, UserCheck, Car, Hash, Palette, Wrench, User, Phone, Mail, Calendar, Clock, Building, FileText } from "lucide-react";

const { Text } = Typography;

const translateColor = (color) => {
  if (!color) return "";
  const colorUpper = String(color).trim().toUpperCase();
  const colorMap = {
    "BLUE": "Xanh dương",
    "RED": "Đỏ",
    "GREEN": "Xanh lá",
    "YELLOW": "Vàng",
    "BLACK": "Đen",
    "WHITE": "Trắng",
    "GRAY": "Xám",
    "GREY": "Xám",
    "SILVER": "Bạc",
    "GOLD": "Vàng",
    "ORANGE": "Cam",
    "PURPLE": "Tím",
    "PINK": "Hồng",
    "BROWN": "Nâu",
  };
  return colorMap[colorUpper] || color;
};

import { fetchTechnicians } from "../../services/staffsService";
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

import Payment from "../../components/service-staff/Payment";
import PaymentInfo from "../../components/service-staff/PaymentInfo";
import PaymentHistory from "../../components/service-staff/PaymentHistory";
import BatteryDetailContent from "../../components/technician/BatteryDetailContent";
import RepairModeEVCheck from "../../components/technician/detail-content/RepairModeEVCheck";
import RMARepairModeEVCheck from "../../components/technician/detail-content/RMARepairModeEVCheck";
import MaintenanceModeEVCheck from "../../components/technician/detail-content/MaintenanceModeEVCheck";
import CampaignModeEVCheck from "../../components/technician/detail-content/CampaignModeEVCheck";
import { useBookings } from "../../hooks/useBookings";
import useAppointmentHub from "../../hooks/useAppointmentHub";

export default function StaffBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, updateStatus, fetchBookings } = useBookings();
  
  const bookingFromList = data.find(b => b.id === id);
  
  const [booking, setBooking] = useState(bookingFromList);
  const [loadingBooking, setLoadingBooking] = useState(false);
  
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [currentEVCheckId, setCurrentEVCheckId] = useState(null);
  const [evCheckStatus, setEvCheckStatus] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [technicianFromEVCheck, setTechnicianFromEVCheck] = useState(null);
  const [selectedBatteryDetail, setSelectedBatteryDetail] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationFee, setCancellationFee] = useState(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [isPendingCancel, setIsPendingCancel] = useState(false);
  const [checkinCodeInput, setCheckinCodeInput] = useState("");

  const loadBookingDetailRef = useRef(null);

  const loadBookingDetail = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoadingBooking(true);
      const res = await getAppointmentById(id);
      const bookingData = res?.data?.data || res?.data || res;
      if (bookingData) {
        setBooking(bookingData);
        
        if (bookingData.status === "CANCELED" && bookingData.cancellationFee > 0) {
          setCancellationFee(bookingData.cancellationFee);
          setIsPendingCancel(false);
        }
        
      } else {
      }
    } catch (error) {
    } finally {
      setLoadingBooking(false);
    }
  }, [id]);

  useEffect(() => {
    loadBookingDetailRef.current = loadBookingDetail;
  }, [loadBookingDetail]);

  useEffect(() => {
    loadBookingDetail();
  }, [loadBookingDetail]);

  useEffect(() => {
    if (bookingFromList) {
      setBooking(bookingFromList);
    }
  }, [bookingFromList]);

  const status = booking?.status?.toUpperCase();
  
  const currentTechnician = booking?.technician || technicianFromEVCheck;

  useAppointmentHub((entity, data) => {
    if (loadBookingDetailRef.current) {
      loadBookingDetailRef.current();
    }
    
    if (fetchBookings) {
      fetchBookings();
    }
  });

  useEffect(() => {
    const loadTechs = async () => {
      if (status !== "CHECKED_IN") return;

      try {
        setLoadingTechs(true);
        const serviceCenterId = 
          booking?.serviceCenterId || 
          booking?.serviceCenter?.id ||
          null;
        
        let finalServiceCenterId = serviceCenterId;
        if (!finalServiceCenterId) {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          finalServiceCenterId = 
            user?.accountResponse?.serviceCenterId || 
            user?.serviceCenterId || 
            user?.staff?.serviceCenterId ||
            user?.accountResponse?.staff?.serviceCenterId ||
            null;
        }
        
        const list = await fetchTechnicians(finalServiceCenterId);
        setTechnicians(list);
      } catch (err) {
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
          let evCheckData = null;
          if (Array.isArray(evCheck)) {
            evCheckData = evCheck[evCheck.length - 1];
          } else if (evCheck?.data?.rowDatas && Array.isArray(evCheck.data.rowDatas)) {
            evCheckData = evCheck.data.rowDatas[evCheck.data.rowDatas.length - 1];
          } else if (evCheck?.rowDatas && Array.isArray(evCheck.rowDatas)) {
            evCheckData = evCheck.rowDatas[evCheck.rowDatas.length - 1];
          } else {
            evCheckData = evCheck;
          }

          if (evCheckData) {
            setCurrentEVCheckId(evCheckData.id);
            setEvCheckStatus(evCheckData.status || null);
            const tech = evCheckData.taskExecutor || evCheckData.technician || null;
          if (tech) {
            setTechnicianFromEVCheck(tech);
            }
          }
        }
      } catch {}
    };

    if (booking) loadEV();
  }, [booking]);

  if (loading || loadingBooking) {
    return (
      <div style={{ padding: 24, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Spin size="large" />
      </div>
    );
  }

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
        setTechnicianFromEVCheck(selectedTechnician);
      }

      if (status === "APPROVED") {
        await changeAppointmentStatusService(booking.id, "CHECKED_IN");
        updateStatus(booking.id, "CHECKED_IN", selectedTechnician);
      } else {
        updateStatus(booking.id, booking.status, selectedTechnician);
      }

      toast.success("Đã gán kỹ thuật viên và tạo EVCheck!");
    } catch (error) {
      toast.error((error?.response?.data?.message || error?.data?.message || error?.message || "Không thể gán kỹ thuật viên!"));
    }
  };

  const calculateCancellationFee = async () => {
    try {
      const evCheck = await fetchEVCheckByAppointmentService(booking.id);
      if (!evCheck || !evCheck.id) {
        return 0;
      }

      const evCheckDetailsRes = await fetchEVCheckDetailsServiceRe(evCheck.id);
      const details = evCheckDetailsRes?.evCheckDetails || [];

      if (details.length === 0) {
        return 0;
      }

      const feeEligibleDetails = details.filter((detail) => {
        const status = (detail.status || "").toUpperCase();
        const remedies = (detail.remedies || "").toUpperCase();
        
        const isWorkDone = status === "COMPLETED" || status === "IN_PROGRESS";
        
        const isValidRemedy = remedies === "REPAIR" || remedies === "REPLACE" || remedies === "TUNE";
        
        return isWorkDone && isValidRemedy;
      });
      
      
      if (feeEligibleDetails.length === 0) {
        return 0;
      }
      
      let totalLaborCost = 0;
      const laborCostPromises = feeEligibleDetails.map(async (detail, index) => {
        let partTypeId = 
          detail._partTypeId ||
          detail?.partItem?.part?.partType?.id || 
          detail?.maintenanceStageDetail?.part?.partType?.id ||
          null;
        
        if (!partTypeId) {
          const partItemId = detail.partItemId || detail.partItem?.id || null;
          if (partItemId) {
            try {
              const { getPartItemByIdService } = await import("../../services/partitemsService");
              const partItemDetail = await getPartItemByIdService(partItemId);
              partTypeId = partItemDetail?.part?.partType?.id || null;
            } catch (error) {
            }
          }
        }
        
        const remedies = detail.remedies || "NONE";
        
        
        if (!partTypeId || !remedies) {
          return 0;
        }
        
        try {
          const laborCost = await getLaborCostByRemediesService(partTypeId, remedies);
          return laborCost || 0;
        } catch (error) {
          return 0;
        }
      });

      const laborCosts = await Promise.all(laborCostPromises);
      totalLaborCost = laborCosts.reduce((sum, cost) => sum + cost, 0);

      return totalLaborCost;
    } catch (error) {
      return 0;
    }
  };

  const handleCancelClick = async () => {
    setIsCalculatingFee(true);
    try {
      const fee = await calculateCancellationFee();
      setCancellationFee(fee);
      setIsCancelModalOpen(true);
    } catch (error) {
      toast.error((error?.response?.data?.message || error?.data?.message || error?.message || "Không thể tính phí hủy. Vui lòng thử lại!"));
    } finally {
      setIsCalculatingFee(false);
    }
  };

  const handleConfirmCancel = async () => {
    setIsCancelModalOpen(false);
    
    if (cancellationFee > 0) {
      setIsPendingCancel(true);
      setIsPaymentModalOpen(true);
      toast.info("Vui lòng thanh toán phí hủy để hoàn tất việc hủy lịch hẹn.");
    } else {
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


  const handlePaymentSuccess = async (paymentResult) => {
    if (isPendingCancel) {


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


      toast.success("Đã thanh toán phí hủy thành công!");
      await loadBookingDetail();
    } else {


      toast.success("Thanh toán thành công!");
      await loadBookingDetail();
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


    if (!checkinCodeInput || checkinCodeInput.trim() === "") {
      toast.error("Vui lòng nhập mã lịch hẹn để check-in!");
      return;
    }


    if (checkinCodeInput.trim().toUpperCase() !== booking.code?.toUpperCase()) {
      toast.error("Mã lịch hẹn không khớp! Vui lòng kiểm tra lại.");
      return;
    }

    try {
      await changeAppointmentStatusService(booking.id, "CHECKED_IN", {
        code: booking.code,
        checkinQRCode: booking.checkinQRCode,
      });

      toast.success("Check-in thành công!");
      updateStatus(booking.id, "CHECKED_IN");
      setCheckinCodeInput("");
    } catch (error) {
      toast.error((error?.response?.data?.message || error?.data?.message || error?.message || "Check-in thất bại!"));
    }
  };

  return (
    <>
      <div style={{ padding: 24, width: "100%", background: "#fff7f3", minHeight: "100vh" }}>
        
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
          
          <Card
            style={{ borderRadius: 12, border: "1px solid #e8e8e8", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 24 }}
            bodyStyle={{ padding: "24px" }}>
            <h3 style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              marginBottom: 16, 
              color: "#d4380d", 
              borderBottom: "1px solid #f0f0f0", 
              paddingBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <Hash size={16} color="#d4380d" />
              Thông tin chung
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px 40px" }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ 
                  marginBottom: 8, 
                  paddingBottom: 8, 
                  borderBottom: "2px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <Calendar size={18} style={{ color: UI_COLORS.PRIMARY_RED }} />
                  <Text strong style={{ fontSize: 15, color: UI_COLORS.PRIMARY_RED }}>
                    Thông tin lịch hẹn
                  </Text>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                    <Space size={8}>
                      <Hash size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                      <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "120px" }}>
                        Mã lịch hẹn:
                      </Text>
                    </Space>
                    <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                      {booking.code}
                    </Text>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                    <Space size={8}>
                      <Calendar size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                      <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "120px" }}>
                        Ngày hẹn:
                      </Text>
                    </Space>
                    <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                {new Date(booking.appointmentDate).toLocaleDateString("vi-VN")}
                    </Text>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                    <Space size={8}>
                      <Clock size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                      <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "120px" }}>
                        Thời gian đặt lịch:
                      </Text>
                    </Space>
                    <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                      {booking.slotTime ? (() => {
                        const [start, end] = booking.slotTime.replace("H", "").split("_");
                        return `${start}:00-${end}:00`;
                      })() : ""}
                    </Text>
                  </div>

                  
                  {(() => {

                    const actualCheckinTime = booking.checkinTime || booking.actualCheckinTime || booking.checkedInAt || 
                      (booking.status === "CHECKED_IN" && booking.updatedAt ? booking.updatedAt : null);
                    
                    if (!actualCheckinTime) return null;
                    

                    const appointmentDateTime = booking.appointmentDate ? new Date(booking.appointmentDate) : null;
                    let scheduledTime = null;
                    if (appointmentDateTime && booking.slotTime) {
                      const [startHour] = booking.slotTime.replace("H", "").split("_");
                      scheduledTime = new Date(appointmentDateTime);
                      scheduledTime.setHours(parseInt(startHour, 10), 0, 0, 0);
                    }
                    
                    const checkinDateTime = new Date(actualCheckinTime);
                    

                    if (scheduledTime && checkinDateTime < scheduledTime) {
                      return (
                        <>
                          <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                            <Space size={8}>
                              <Clock size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                              <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "120px" }}>
                                Thời gian check-in:
                              </Text>
                            </Space>
                            <Text strong style={{ fontSize: 14, color: "#52c41a" }}>
                              {checkinDateTime.toLocaleString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </div>
                         
                        </>
                      );
                    }
                    return null;
                  })()}

                  <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                    <Space size={8}>
                      <Building size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                      <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "120px" }}>
                        Trung tâm dịch vụ:
                      </Text>
                    </Space>
                    <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                      {booking.serviceCenter?.name || ""}
                    </Text>
                  </div>
                  
                  {(booking?.type || "").toUpperCase() === "MAINTENANCE_TYPE" && booking.maintenanceStage?.name && (
                    <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                      <Space size={8}>
                        <Wrench size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                        <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "120px" }}>
                          Giai đoạn bảo dưỡng:
                        </Text>
                      </Space>
                      <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                        {booking.maintenanceStage?.name || ""}
                      </Text>
                    </div>
                  )}
                  
                  {booking.note && (
                    <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-start", gap: "12px" }}>
                      <Space size={8}>
                        <Hash size={16} style={{ color: UI_COLORS.PRIMARY_RED, marginTop: 2 }} />
                        <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "120px" }}>
                          Ghi chú:
                        </Text>
                      </Space>
                      <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY, flex: 1 }}>
                        {booking.note}
                      </Text>
                    </div>
                  )}
                </div>
              </div>

              
              {booking.customer && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ 
                    marginBottom: 8, 
                    paddingBottom: 8, 
                    borderBottom: "2px solid #f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}>
                    <User size={18} style={{ color: UI_COLORS.PRIMARY_RED }} />
                    <Text strong style={{ fontSize: 15, color: UI_COLORS.PRIMARY_RED }}>
                      Thông tin khách hàng
                    </Text>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {(booking.customer.firstName || booking.customer.lastName) && (
                      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                        <Space size={8}>
                          <User size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "120px" }}>
                            Họ tên:
                          </Text>
                        </Space>
                        <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                          {`${booking.customer.firstName || ""} ${booking.customer.lastName || ""}`.trim() || ""}
                        </Text>
                      </div>
                    )}
                    
                    <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                      <Space size={8}>
                        <Phone size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                        <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "120px" }}>
                          SĐT:
                        </Text>
                      </Space>
                      <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                        {booking.customer.account?.phone || booking.customer.phoneNumber || booking.customer.phone || ""}
                      </Text>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                      <Space size={8}>
                        <Mail size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                        <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "120px" }}>
                          Email:
                        </Text>
                      </Space>
                      <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                        {booking.customer.account?.email || booking.customer.email || ""}
                      </Text>
                    </div>
                  </div>
                </div>
              )}

              
              {booking?.vehicle && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ 
                    marginBottom: 8, 
                    paddingBottom: 8, 
                    borderBottom: "2px solid #f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}>
                    <Car size={18} style={{ color: UI_COLORS.PRIMARY_RED }} />
                    <Text strong style={{ fontSize: 15, color: UI_COLORS.PRIMARY_RED }}>
                      Thông tin phương tiện
                    </Text>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {(booking.vehicle.modelName || booking.vehicle.model?.name) && (
                      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                        <Space size={8}>
                          <Car size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "120px" }}>
                            Mẫu xe:
                          </Text>
                        </Space>
                        <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                          {booking.vehicle.modelName || booking.vehicle.model?.name}
                        </Text>
                      </div>
                    )}
                    
                    {booking.vehicle.engineNumber && (
                      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                        <Space size={8}>
                          <Wrench size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "120px" }}>
                            Số máy:
                          </Text>
                        </Space>
                        <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                          {booking.vehicle.engineNumber}
                        </Text>
                      </div>
                    )}

                    {booking?.vehicle?.chassisNumber && (
                      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                        <Space size={8}>
                          <Hash size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "120px" }}>
                            Số khung (VIN):
                          </Text>
                        </Space>
                        <Tag 
                          color={UI_COLORS.TAG_RED} 
                          style={{ 
                            borderRadius: 6, 
                            padding: "4px 12px",
                            fontSize: 13,
                            fontWeight: 500,
                            border: "none",
                          }}
                        >
                          {booking.vehicle.chassisNumber}
                        </Tag>
                      </div>
                    )}
                    
                    {translateColor(booking.vehicle.color) && (
                      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                        <Space size={8}>
                          <Palette size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "120px" }}>
                            Màu sắc:
                          </Text>
                        </Space>
                        <Tag 
                          color={UI_COLORS.TAG_RED} 
                          style={{ 
                            borderRadius: 6, 
                            padding: "4px 12px",
                            fontSize: 13,
                            fontWeight: 500,
                            border: "none",
                          }}
                        >
                          {translateColor(booking.vehicle.color)}
                        </Tag>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>


          
          {currentTechnician && (
            <Card 
              style={{ 
                marginBottom: 24,
                borderRadius: 12,
                border: "1px solid #e8e8e8",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
              }}
              bodyStyle={{ padding: "24px" }}>
              <h3 style={{ 
                fontSize: 16, 
                fontWeight: 600,
                marginBottom: 16,
                color: "#d4380d", 
                borderBottom: "1px solid #f0f0f0", 
                paddingBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <UserCheck size={16} color="#d4380d" />
                Kỹ thuật viên phụ trách
              </h3>
              <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <Space size={8}>
                  <UserCheck size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                  <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "60px" }}>
                    Tên:
                  </Text>
                </Space>
                <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                  {currentTechnician.firstName} {currentTechnician.lastName}
                </Text>
                {currentTechnician.staffCode && (
                  <>
                    <Space size={8} style={{ marginLeft: 390 }}>
                      <Hash size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                      <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>
                        Mã NV:
                      </Text>
                    </Space>
                    <Tag color="red" style={{ borderRadius: 6, fontSize: 12 }}>
                      {currentTechnician.staffCode}
                    </Tag>
                  </>
                )}
              </div>
            </Card>
          )}

          
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

              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
                <div style={{ width: "100%", maxWidth: 400 }}>
                  <Input
                    placeholder="Nhập mã lịch hẹn để check-in"
                    value={checkinCodeInput}
                    onChange={(e) => setCheckinCodeInput(e.target.value)}
                    onPressEnter={handleManualCheckIn}
                    size="large"
                    style={{
                      borderRadius: 8,
                      fontSize: 14,
                      textAlign: "center",
                      textTransform: "uppercase"
                    }}
                    allowClear
                  />
                </div>
                <Button
                  type='primary'
                  size='large'
                  danger
                  onClick={handleManualCheckIn}
                  disabled={!checkinCodeInput || checkinCodeInput.trim() === ""}
                  style={{ minWidth: 200 }}>
                  Check-in
                </Button>
              </div>
            </Card>
          )}

          
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
                    label: `${t.firstName} ${t.lastName}${t.staffCode ? ` - ${t.staffCode}` : ''}`,
                  }))}
                  onChange={(value) =>
                    setSelectedTechnician(technicians.find((t) => t.id === value))
                  }
                />
              </div>
              <Button
                type='primary'
                block
                danger
                disabled={!selectedTechnician || loadingTechs}
                loading={loadingTechs}
                onClick={handleAssignTechnician}>
                Xác nhận kỹ thuật viên
              </Button>
            </Card>
          )}



          
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

                        setCancellationFee(booking.cancellationFee);
                        setIsPendingCancel(false);
                        setIsPaymentModalOpen(true);
                      }}>
                      Thanh toán phí hủy
                    </Button>
                  </div>
              </div>
            ) : (

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


                        setIsCalculatingFee(true);
                        try {
                          const fee = await calculateCancellationFee();
                          if (fee > 0) {
                            setCancellationFee(fee);
                            setIsPendingCancel(false);
                            setIsPaymentModalOpen(true);
                          } else {
                            toast.info("Không có phí hủy cho lịch hẹn này.");
                          }
                        } catch (error) {
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

          
          {currentTechnician && currentEVCheckId && (
            <Card 
              style={{ 
                marginBottom: 24,
                borderRadius: 12,
                border: "1px solid #e8e8e8",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
              }}
              bodyStyle={{ padding: "24px" }}>
              <h3 style={{ 
                fontSize: 16, 
                fontWeight: 600,
                marginBottom: 16,
                color: "#d4380d", 
                borderBottom: "1px solid #f0f0f0",
                paddingBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <FileText size={16} color="#d4380d" />
                {(() => {
                  const isRepair = (booking?.type || "").toUpperCase() === "REPAIR_TYPE";
                  const isMaintenance = (booking?.type || "").toUpperCase() === "MAINTENANCE_TYPE";
                  const isCampaign = (booking?.type || "").toUpperCase() === "CAMPAIGN_TYPE";
                  
                  if (isRepair) return "Phiếu sửa chữa";
                  if (isMaintenance) return evCheckStatus === "REPAIR_IN_PROGRESS" ? "Tiến hành sửa chữa" : "Kết quả kiểm tra EVCheck";
                  if (isCampaign) return "Phiếu kiểm tra chiến dịch";
                  return "Phiếu kiểm tra";
                })()}
              </h3>
              {(() => {
                const isRepair = (booking?.type || "").toUpperCase() === "REPAIR_TYPE";
                const isMaintenance = (booking?.type || "").toUpperCase() === "MAINTENANCE_TYPE";
                const isCampaign = (booking?.type || "").toUpperCase() === "CAMPAIGN_TYPE";
                const chassisConfirmed = !!booking?.vehicle?.chassisNumber;
                const note = (booking?.note || "").toLowerCase();
                const isRMABooking = note.includes("lịch thay") && note.includes("rma");

                if (isRepair && chassisConfirmed) {
                  return isRMABooking ? (
                    <RMARepairModeEVCheck
                      key={`rma-repair-${currentEVCheckId}-${refreshKey}`}
                      booking={booking}
                      evCheckId={currentEVCheckId}
                      onRefresh={() => {
                        setRefreshKey((prev) => prev + 1);
                        loadBookingDetail();
                      }}
                      readOnly={true}
                      forceEmpty={!currentEVCheckId}
                      onViewBatteryDetail={(batteryData, evCheckDetailId) => {
                        setSelectedBatteryDetail({ batteryData, evCheckDetailId });
                      }}
                    />
                  ) : (
                    <RepairModeEVCheck
                      key={`repair-${currentEVCheckId}-${refreshKey}`}
                      booking={booking}
                      evCheckId={currentEVCheckId}
                      onRefresh={() => {
                        setRefreshKey((prev) => prev + 1);
                        loadBookingDetail();
                      }}
                      readOnly={true}
                      forceEmpty={!currentEVCheckId}
                      onViewBatteryDetail={(batteryData, evCheckDetailId) => {
                        setSelectedBatteryDetail({ batteryData, evCheckDetailId });
                      }}
                    />
                  );
                } else if (isMaintenance) {
                  return (
                    <MaintenanceModeEVCheck
                      key={`maintenance-${currentEVCheckId}-${evCheckStatus}-${refreshKey}`}
                      booking={booking}
                      evCheckId={currentEVCheckId}
                      evCheckStatus={evCheckStatus}
                      setEvCheckStatus={setEvCheckStatus}
                      readOnly={true}
                      onRefresh={() => {
                        setRefreshKey((prev) => prev + 1);
                        loadBookingDetail();
                      }}
                    />
                  );
                } else if (isCampaign) {
                  return (
                    <CampaignModeEVCheck
                      key={`campaign-${currentEVCheckId}-${refreshKey}`}
                      booking={booking}
                      evCheckId={currentEVCheckId}
                      evCheckStatus={evCheckStatus}
                      onRefresh={() => {
                        setRefreshKey((prev) => prev + 1);
                        loadBookingDetail();
                      }}
                      readOnly={true}
                      forceEmpty={!currentEVCheckId}
                    />
                  );
                }
                return null;
              })()}
            </Card>
          )}

          
          {selectedBatteryDetail && (
          <Card
              style={{ 
                marginBottom: 24,
                borderRadius: 12,
                border: "1px solid #e8e8e8",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
              }}
            bodyStyle={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  margin: 0,
                  color: "#d4380d", 
                  borderBottom: "1px solid #f0f0f0", 
                  paddingBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flex: 1
                }}>
                  <FileText size={16} color="#d4380d" />
                  Chi tiết Pin
            </h3>
                <Button
                  type="text" 
                  onClick={() => setSelectedBatteryDetail(null)}
                  style={{ color: "#8c8c8c" }}
                >
                  ✕
                </Button>
              </div>
              <BatteryDetailContent batteryData={selectedBatteryDetail.batteryData} />
          </Card>
          )}

          
          {currentTechnician && currentEVCheckId && (
            <div style={{ marginBottom: 24 }}>
              {status === "COMPLETED" ? (

                <PaymentHistory booking={booking} />
              ) : (status === "REPAIR_COMPLETED" || status === "QUOTE_APPROVED") ? (

              <PaymentInfo
                booking={booking}
                onOpenPayment={() => setIsPaymentModalOpen(true)}
              />
              ) : null}
            </div>
          )}

          <Divider />

          
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
            
            {status === "CANCELED" && (
              <div style={{ color: "#999", fontSize: 14 }}>
                Lịch hẹn đã bị hủy
              </div>
            )}
          </div>
        </motion.div>
      </div>


      <Payment
        open={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);

          if (isPendingCancel) {
            setIsPendingCancel(false);
          }
        }}
        booking={booking}
        onPaymentSuccess={handlePaymentSuccess}
        cancellationFee={cancellationFee}
        isPendingCancel={isPendingCancel}
      />

      
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

