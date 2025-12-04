// src/components/staff/RMADetails.jsx
import React, { useState, useMemo } from "react";
import { Table, Spin, Button, Modal, Card, Tag, Image, Space, Divider, Typography, Tooltip } from "antd";
import { toast } from "@/components/ui/sonner";
import { Calendar, User, FileText, Package, Clock, CheckCircle, Tag as TagIcon } from "lucide-react";

const { Text } = Typography;
import BookingForm from "../../components/service-staff/BookingForm";
import { createAppointmentService, approveAppointmentService } from "../../services/appointmentService";
import { getAppointmentById } from "../../api/appointmentsApi";
import { getPartById } from "../../api/partsApi";
import { getPartItemByIdService } from "../../services/partitemsService";

// ✅ Component để hiển thị tên phụ tùng (có thể gọi API nếu cần)
function PartNameCell({ row }) {
  const [partName, setPartName] = React.useState("");
  const [serialNumber, setSerialNumber] = React.useState("");
  
  React.useEffect(() => {
    const loadPartInfo = async () => {
      const evCheckDetail = row.evCheckDetail;
      const partItem = evCheckDetail?.partItem || row.partItem;
      const part = partItem?.part;
      
      // ✅ Ưu tiên lấy tên từ part.name
      let name = part?.name || "";
      
      // ✅ Nếu không có part.name, thử lấy từ part.code
      if (!name && part?.code) {
        name = part.code;
      }
      
      // ✅ Nếu vẫn không có, thử lấy từ serialNumber
      if (!name && partItem?.serialNumber) {
        name = partItem.serialNumber;
      }
      
      // ✅ Nếu vẫn không có và có partItemId, gọi API để lấy thông tin
      if (!name && partItem?.id) {
        try {
          const partItemData = await getPartItemByIdService(partItem.id);
          const partData = partItemData?.part || {};
          name = partData.name || partData.code || partItemData.serialNumber || "";
        } catch (err) {
          console.error(`❌ Lỗi lấy thông tin phụ tùng ${partItem.id}:`, err);
        }
      }
      
      // ✅ Nếu vẫn không có, hiển thị "—" thay vì ID
      setPartName(name || "—");
      setSerialNumber(partItem?.serialNumber || "");
    };
    
    loadPartInfo();
  }, [row]);
  
  return (
    <div>
      <div style={{ fontWeight: 500, marginBottom: 2, fontSize: 12 }}>{partName || "—"}</div>
      {serialNumber && partName !== serialNumber && (
        <div style={{ fontSize: 11, color: "#8c8c8c" }}>
          S/N: {serialNumber}
        </div>
      )}
    </div>
  );
}

// ✅ Component để hiển thị thông tin phụ tùng thay thế
function ReplacePartInfo({ replacePart }) {
  const [partInfo, setPartInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  // ✅ Debug: log replacePart để kiểm tra
  React.useEffect(() => {
    console.log("🔍 ReplacePartInfo - replacePart:", replacePart);
  }, [replacePart]);

  // ✅ Ưu tiên lấy part.name và part.code từ replacePart.part (response mới)
  React.useEffect(() => {
    if (replacePart?.part?.name || replacePart?.part?.code) {
      // ✅ Response mới đã có sẵn part object
      setPartInfo({
        name: replacePart.part.name,
        code: replacePart.part.code,
      });
    } else if (replacePart?.partId && !partInfo) {
      // ✅ Fallback: gọi API nếu không có part object
      const loadPartInfo = async () => {
        try {
          setLoading(true);
          const res = await getPartById(replacePart.partId);
          const data = res?.data?.data || res?.data || res;
          if (data) {
            setPartInfo({
              name: data.name,
              code: data.code,
            });
          }
        } catch (err) {
          console.error("Lỗi lấy thông tin part:", err);
        } finally {
          setLoading(false);
        }
      };
      loadPartInfo();
    }
  }, [replacePart?.part, replacePart?.partId]);

  // ✅ Kiểm tra xem có thông tin nào để hiển thị không
  const hasAnyInfo = 
    partInfo?.name || 
    partInfo?.code || 
    replacePart?.serialNumber || 
    replacePart?.partId ||
    (replacePart?.quantity !== undefined && replacePart?.quantity !== null) ||
    (replacePart?.price !== undefined && replacePart?.price !== null && replacePart?.price > 0) ||
    replacePart?.warrantyPeriod ||
    (replacePart?.warantyStartDate && replacePart?.warantyEndDate);

  // ✅ Luôn hiển thị nếu có replacePart object (để debug)
  if (!replacePart) {
    console.warn("⚠️ ReplacePartInfo: replacePart is null/undefined");
    return null;
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #d9e7ff" }}>
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8, fontWeight: 500 }}>
        Phụ tùng thay thế:
      </Text>
      <div style={{ 
        padding: "12px", 
        backgroundColor: "#f0f5ff", 
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        gap: 6
      }}>
        {/* Tên phụ tùng */}
        {partInfo?.name && (
          <div style={{ display: "flex", gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, minWidth: 80 }}>Tên:</Text>
            <Text strong style={{ fontSize: 13, color: "#1890ff" }}>{partInfo.name}</Text>
          </div>
        )}
        {partInfo?.code && (
          <div style={{ display: "flex", gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, minWidth: 80 }}>Mã:</Text>
            <Text style={{ fontSize: 13, fontFamily: "monospace", color: "#595959" }}>{partInfo.code}</Text>
          </div>
        )}
        {/* Serial Number - luôn hiển thị nếu có */}
        {replacePart?.serialNumber && (
          <div style={{ display: "flex", gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, minWidth: 80 }}>Số seri:</Text>
            <Text style={{ fontSize: 13, fontFamily: "monospace", color: "#1890ff", fontWeight: 500 }}>
              {replacePart.serialNumber}
            </Text>
          </div>
        )}
        {/* Part ID - hiển thị nếu có nhưng chưa load được part info */}
        {replacePart?.partId && !partInfo && !loading && (
          <div style={{ display: "flex", gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, minWidth: 80 }}>Part ID:</Text>
            <Text style={{ fontSize: 13, fontFamily: "monospace", color: "#595959" }}>
              {replacePart.partId}
            </Text>
          </div>
        )}
        {/* Số lượng */}
        {replacePart?.quantity !== undefined && replacePart?.quantity !== null && (
          <div style={{ display: "flex", gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, minWidth: 80 }}>Số lượng:</Text>
            <Text style={{ fontSize: 13, color: "#595959" }}>{replacePart.quantity}</Text>
          </div>
        )}
        {/* Giá */}
        {replacePart?.price !== undefined && replacePart?.price !== null && replacePart?.price > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, minWidth: 80 }}>Giá:</Text>
            <Text strong style={{ fontSize: 13, color: "#52c41a" }}>
              {Number(replacePart.price).toLocaleString("vi-VN")} ₫
            </Text>
          </div>
        )}
        {/* Bảo hành */}
        {replacePart?.warrantyPeriod && (
          <div style={{ display: "flex", gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, minWidth: 80 }}>Bảo hành:</Text>
            <Text style={{ fontSize: 13, color: "#595959" }}>
              {replacePart.warrantyPeriod} tháng
            </Text>
          </div>
        )}
        {/* Thời gian bảo hành */}
        {replacePart?.warantyStartDate && replacePart?.warantyEndDate && (
          <div style={{ display: "flex", gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, minWidth: 80 }}>Thời gian BH:</Text>
            <Text style={{ fontSize: 13, color: "#595959" }}>
              {new Date(replacePart.warantyStartDate).toLocaleDateString("vi-VN")} - {new Date(replacePart.warantyEndDate).toLocaleDateString("vi-VN")}
            </Text>
          </div>
        )}
        {loading && (
          <Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>
            Đang tải thông tin...
          </Text>
        )}
        {/* Debug info - có thể xóa sau */}
        {!hasAnyInfo && !loading && (
          <Text type="secondary" style={{ fontSize: 11, color: "#999", fontStyle: "italic" }}>
            (Chưa có thông tin phụ tùng thay thế)
          </Text>
        )}
      </div>
    </div>
  );
}

function RMADetails({ rma, details = [], loading }) {
  // 👉 Khi nào có ít nhất 1 detail đã được hãng duyệt thì cho tạo lịch
  const hasReadyParts = useMemo(
    () =>
      details.some((d) => d.status === "APPROVED" ),
    [details]
  );

  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  if (!rma) return <p>Không tìm thấy thông tin RMA.</p>;

  // Prefill cho BookingForm - tự động lấy từ RMA
  const initialBookingValues = useMemo(
    () => ({
      customerId: rma?.customer?.id,
      vehicleId: rma?.vehicle?.id,
      chassisNumber: rma?.vehicle?.chassisNumber,
      serviceCenterId: rma?.staff?.serviceCenterId,
      estimatedCost: 0,
      // ✅ Truyền đầy đủ thông tin customer và vehicle để hiển thị
      customer: rma?.customer,
      vehicle: rma?.vehicle,
    }),
    [rma]
  );

  const handleOpenBooking = () => {
    setBookingOpen(true);
  };

  const handleCreateAppointment = async (values) => {
    try {
      setBookingLoading(true);

      const payload = {
        ...values,
        customerId: values.customerId || rma?.customer?.id,
        serviceCenterId: values.serviceCenterId || rma?.staff?.serviceCenterId,
        // tuỳ nghiệp vụ, mình coi đây là lịch hẹn bảo hành / thay thế
        type: "REPAIR_TYPE",
        status: "PENDING", // ✅ Tạo với status PENDING trước
        note: `Lịch thay thế phụ tùng từ RMA ${rma.code}`,
        rmaId: rma?.id || null, // ✅ Truyền rmaId xuống BE
      };

      // ✅ 1. Tạo appointment
      const newAppointment = await createAppointmentService(payload);
      const appointmentId = newAppointment?.id || newAppointment?.data?.id;
      
      if (!appointmentId) {
        throw new Error("Không nhận được ID của lịch hẹn sau khi tạo");
      }

      // ✅ 2. Tự động approve để tạo QR code (bỏ qua bước approve thủ công)
      try {
        await approveAppointmentService(appointmentId);
        
        // ✅ 3. Sau khi approve thành công, lấy thông tin appointment để xác nhận QR code đã được tạo
        const appointmentRes = await getAppointmentById(appointmentId);
        const appointment = appointmentRes?.data || appointmentRes;
        const checkinQRCode = appointment?.checkinQRCode;
        
        if (checkinQRCode) {
          toast.success("Tạo lịch thay thế và mã QR check-in thành công!");
        } else {
          toast.success("Tạo lịch thay thế và đã duyệt lịch hẹn thành công!");
        }
      } catch (approveError) {
        console.error("Lỗi approve appointment:", approveError);
        toast.warning("Tạo lịch hẹn thành công nhưng chưa tạo được QR code. Vui lòng duyệt lại sau.");
      }

      setBookingOpen(false);
    } catch (err) {
      console.error("Lỗi tạo lịch hẹn từ RMA:", err);
      toast.error(err?.response?.data?.message || err?.message || "Không thể tạo lịch hẹn. Vui lòng thử lại.");
    } finally {
      setBookingLoading(false);
    }
  };

  // ✅ Map status colors
  const getStatusColor = (status) => {
    const statusUpper = (status || "").toUpperCase();
    if (statusUpper === "APPROVED") return "success";
    if (statusUpper === "PENDING") return "processing";
    if (statusUpper === "REJECTED") return "error";
    if (statusUpper === "COMPLETED") return "success";
    return "default";
  };

  const getStatusText = (status) => {
    const statusUpper = (status || "").toUpperCase();
    const statusMap = {
      APPROVED: "Đã duyệt",
      PENDING: "Đang chờ",
      REJECTED: "Từ chối",
      COMPLETED: "Hoàn thành",
    };
    return statusMap[statusUpper] || status || "—";
  };

  return (
    <div style={{ padding: "24px", width: "100%", margin: "0 auto" }}>
      {/* ✅ CARD THÔNG TIN CHUNG */}
      <Card
        title={
          <Space>
            <TagIcon size={20} style={{ color: "#ff4d4f" }} />
            <span>Thông tin RMA</span>
          </Space>
        }
        style={{ marginBottom: 24, borderRadius: 8 }}
        headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "16px 24px" }}
        bodyStyle={{ padding: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
          <div>
            <Space>
              <FileText size={16} style={{ color: "#595959" }} />
              <span style={{ fontWeight: 600, color: "#595959" }}>Mã RMA:</span>
            </Space>
            <div style={{ marginTop: 4, fontSize: 16, fontWeight: 600, color: "#ff4d4f" }}>
              {rma.code}
            </div>
          </div>

    <div>
            <Space>
              <User size={16} style={{ color: "#595959" }} />
              <span style={{ fontWeight: 600, color: "#595959" }}>Khách hàng:</span>
            </Space>
            <div style={{ marginTop: 4, fontSize: 14 }}>
          {rma.customer
                ? `${rma.customer.firstName || ""} ${rma.customer.lastName || ""}`.trim() || "—"
                : "—"}
            </div>
          </div>

          <div>
            <Space>
              <Calendar size={16} style={{ color: "#595959" }} />
              <span style={{ fontWeight: 600, color: "#595959" }}>Ngày tạo:</span>
            </Space>
            <div style={{ marginTop: 4, fontSize: 14 }}>
              {rma.rmaDate
                ? new Date(rma.rmaDate).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
            : "—"}
            </div>
      </div>

          {rma.note && (
            <div style={{ gridColumn: "1 / -1" }}>
              <Space>
                <FileText size={16} style={{ color: "#595959" }} />
                <span style={{ fontWeight: 600, color: "#595959" }}>Ghi chú:</span>
              </Space>
              <div style={{ marginTop: 4, fontSize: 14, color: "#595959" }}>
                {rma.note}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ✅ NÚT TẠO LỊCH HẸN */}
      {hasReadyParts && (
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "flex-end" }}>
          <Button
            type='primary'
            size="large"
            icon={<Calendar size={18} />}
            style={{
              backgroundColor: "#ff4d4f",
              borderColor: "#ff4d4f",
              height: "40px",
              fontSize: "15px",
              fontWeight: 600,
              borderRadius: 8,
            }}
            onClick={handleOpenBooking}>
            Tạo lịch thay thế cho khách
          </Button>
        </div>
      )}

      {/* ✅ CARD BẢNG CHI TIẾT RMA */}
      <Card
        title={
          <Space>
            <Package size={20} style={{ color: "#ff4d4f" }} />
            <span>Danh sách phụ tùng RMA</span>
          </Space>
        }
        style={{ borderRadius: 8 }}
        headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "12px 16px" }}
        bodyStyle={{ padding: "12px" }}>
      {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <Spin size="large" />
        </div>
      ) : (
        <Table
          dataSource={details}
          rowKey='id'
          bordered
          pagination={false}
            size="small"
            scroll={{ x: false }}
            expandable={{
              expandedRowRender: (record) => {
                const evCheckDetail = record.evCheckDetail;
                const partItem = evCheckDetail?.partItem || record.partItem;
                const part = partItem?.part;
                
                // ✅ Lấy thông tin từ rma object (đã có sẵn) thay vì từ nested objects
                const customer = rma?.customer;
                const booking = rma?.appointment || evCheckDetail?.evCheck?.appointment;
                const vehicle = booking?.vehicle || rma?.vehicle;
                const technician = booking?.technician || rma?.technician;
                const evCheck = evCheckDetail?.evCheck;
                
                // ✅ Chỉ hiển thị thông tin nguyên nhân hư hỏng từ hãng (RMA detail)
                // ✅ Lấy replacePart từ record (theo cấu trúc API response)
                const replacePart = record.replacePart || evCheckDetail?.replacePart;
                
                // ✅ Debug: log để kiểm tra
                console.log("🔍 expandedRowRender - record:", record);
                console.log("🔍 expandedRowRender - replacePart:", replacePart);
                console.log("🔍 expandedRowRender - record.solution:", record.solution);
                
                const getSolutionLabel = (solution) => {
                  const solutionMap = {
                    REPLACE: "Thay thế",
                    REPAIR: "Sửa chữa",
                    CHECK: "Kiểm tra",
                    LUBRICATE: "Bôi trơn",
                    NONE: "Không có",
                  };
                  return solutionMap[solution] || solution;
                };

                const getSolutionColor = (solution) => {
                  const colorMap = {
                    REPLACE: "red",
                    REPAIR: "blue",
                    CHECK: "cyan",
                    LUBRICATE: "orange",
                    NONE: "default",
                  };
                  return colorMap[solution] || "default";
                };

                return (
                  <div style={{ padding: "20px 0", backgroundColor: "#f5f5f5" }}>
                    <div style={{ 
                      backgroundColor: "#fff", 
                      borderRadius: 8,
                      border: "1px solid #e0e0e0",
                      overflow: "hidden"
                    }}>
                      {/* Header với icon */}
                      <div style={{ 
                        background: "linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)",
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10
                      }}>
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: "50%", 
                          backgroundColor: "rgba(255,255,255,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <FileText size={20} style={{ color: "#fff" }} />
                        </div>
                        <Text strong style={{ fontSize: 16, color: "#fff" }}>
                          Thông tin từ hãng
                        </Text>
                      </div>

                      {/* Nội dung */}
                      <div style={{ padding: "20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {/* Lý do RMA */}
                          <div style={{ 
                            padding: "14px 16px",
                            backgroundColor: "#fffbf0",
                            borderRadius: 6,
                            borderLeft: "4px solid #faad14"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <div style={{ 
                                width: 6, 
                                height: 6, 
                                borderRadius: "50%", 
                                backgroundColor: "#faad14" 
                              }} />
                              <Text strong style={{ fontSize: 13, color: "#ad6800" }}>
                                Kết quả kiểm tra
                              </Text>
                            </div>
                            <Text style={{ fontSize: 14, color: "#ad6800", lineHeight: 1.6, marginLeft: 14 }}>
                              {record.result || "Chưa có thông tin"}
                            </Text>
                          </div>


                          {/* Giải pháp */}
                          <div style={{ 
                            padding: "14px 16px",
                            backgroundColor: "#f0f5ff",
                            borderRadius: 6,
                            borderLeft: "4px solid #1890ff"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                              <div style={{ 
                                width: 6, 
                                height: 6, 
                                borderRadius: "50%", 
                                backgroundColor: "#1890ff" 
                              }} />
                              <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
                                Giải pháp
                              </Text>
                            </div>
                            <div style={{ marginLeft: 14 }}>
                              {record.solution ? (
                                <>
                                  <Tag 
                                    color={getSolutionColor(record.solution)}
                                    style={{ 
                                      fontSize: 13, 
                                      padding: "4px 12px",
                                      borderRadius: 4,
                                      fontWeight: 500
                                    }}>
                                    {getSolutionLabel(record.solution)}
                                  </Tag>
                                  
                                  {/* Thông tin phụ tùng thay thế từ replacePart */}
                                  {record.solution === "REPLACE" && replacePart ? (
                                    <ReplacePartInfo replacePart={replacePart} />
                                  ) : record.solution === "REPLACE" ? (
                                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #d9e7ff" }}>
                                      <Text type="secondary" style={{ fontSize: 12, color: "#999", fontStyle: "italic" }}>
                                        Chưa có thông tin phụ tùng thay thế
                                      </Text>
                                    </div>
                                  ) : null}
                                </>
                              ) : (
                                <Text type="secondary" style={{ fontSize: 14, color: "#999", fontStyle: "italic" }}>
                                  Chưa có thông tin
                                </Text>
                              )}
                            </div>
                          </div>

                          {/* Thông tin phụ tùng thay thế từ hãng */}
                          <div style={{ 
                            padding: "14px 16px",
                            backgroundColor: "#f6ffed",
                            borderRadius: 6,
                            borderLeft: "4px solid #52c41a"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                              <div style={{ 
                                width: 6, 
                                height: 6, 
                                borderRadius: "50%", 
                                backgroundColor: "#52c41a" 
                              }} />
                              <Text strong style={{ fontSize: 13, color: "#389e0d" }}>
                                Phụ tùng thay thế từ hãng
                              </Text>
                            </div>
                            <div style={{ marginLeft: 14 }}>
                              {replacePart?.part?.name ? (
                                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                                  {/* Ảnh phụ tùng */}
                                  {replacePart.part.image && (
                                    <div style={{ flexShrink: 0 }}>
                                      <Image
                                        src={replacePart.part.image}
                                        alt={replacePart.part.name || "Phụ tùng"}
                                        style={{
                                          width: 120,
                                          height: 120,
                                          objectFit: "cover",
                                          borderRadius: 6,
                                          border: "1px solid #d9d9d9"
                                        }}
                                        preview={{
                                          mask: "Xem ảnh"
                                        }}
                                        fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
                                      />
                                    </div>
                                  )}
                                  {/* Thông tin phụ tùng */}
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                    <div style={{ display: "flex", gap: 8 }}>
                                      <Text type="secondary" style={{ fontSize: 12, minWidth: 80 }}>Tên:</Text>
                                      <Text strong style={{ fontSize: 14, color: "#389e0d" }}>
                                        {replacePart.part.name}
                                      </Text>
                                    </div>
                                    {replacePart.part.code && (
                                      <div style={{ display: "flex", gap: 8 }}>
                                        <Text type="secondary" style={{ fontSize: 12, minWidth: 80 }}>Mã:</Text>
                                        <Text style={{ fontSize: 13, fontFamily: "monospace", color: "#595959" }}>
                                          {replacePart.part.code}
                                        </Text>
                                      </div>
                                    )}
                                    {replacePart.serialNumber && (
                                      <div style={{ display: "flex", gap: 8 }}>
                                        <Text type="secondary" style={{ fontSize: 12, minWidth: 80 }}>Số seri:</Text>
                                        <Text style={{ fontSize: 13, fontFamily: "monospace", color: "#1890ff", fontWeight: 500 }}>
                                          {replacePart.serialNumber}
                                        </Text>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <Text type="secondary" style={{ fontSize: 14, color: "#999", fontStyle: "italic" }}>
                                  Chưa có thông tin
                                </Text>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              },
              rowExpandable: () => true,
            }}
          columns={[
            {
              title: "STT",
              render: (_, __, idx) => idx + 1,
              width: 50,
                align: "center",
              },
              {
                title: "Hình ảnh",
                width: 70,
                align: "center",
                render: (_, row) => {
                  const imageUrl = 
                    row.evCheckDetail?.partItem?.part?.image ||
                    row.partItem?.part?.image;
                  
                  return imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt='Part Item'
                      width={50}
                      height={50}
                      style={{ objectFit: "cover", borderRadius: 4 }}
                      preview
                    />
                  ) : (
                    <span style={{ color: "#bfbfbf" }}>—</span>
                  );
                },
            },
            {
              title: "Phụ tùng",
                width: 160,
                render: (_, row) => <PartNameCell row={row} />,
              },
              {
                title: "Số lượng",
                dataIndex: "quantity",
                width: 80,
                align: "center",
                render: (qty) => qty || 1,
              },
              {
                title: "Lý do",
                dataIndex: "reason",
                width: 140,
                ellipsis: {
                  showTitle: true,
                },
                render: (reason) => (
                  <Tooltip title={reason} placement="topLeft">
                    <span style={{ fontSize: 12 }}>{reason || "—"}</span>
                  </Tooltip>
                ),
              },
              {
                title: "Kết quả",
                dataIndex: "result",
                width: 140,
                ellipsis: {
                  showTitle: true,
                },
                render: (result) => (
                  result ? (
                    <Tooltip title={result} placement="topLeft">
                      <span title={result} style={{ color: "#ff4d4f", fontWeight: 500, fontSize: 12 }}>
                        {result}
                      </span>
                    </Tooltip>
                  ) : (
                    <span style={{ color: "#bfbfbf" }}>—</span>
                  )
                ),
            },
            {
                title: "Giải pháp",
                dataIndex: "solution",
                width: 130,
                align: "center",
                ellipsis: {
                  showTitle: true,
                },
                render: (solution) => {
                  if (!solution) return <span style={{ color: "#bfbfbf" }}>—</span>;
                  
                  const solutionMap = {
                    "REPLACE": "Thay thế",
                    "REPAIR": "Sửa chữa",
                    "CHECK": "Kiểm tra",
                    "LUBRICATE": "Bôi trơn",
                    "NONE": "Không có",
                  };
                  
                  const colorMap = {
                    "REPLACE": "red",
                    "REPAIR": "blue",
                    "CHECK": "cyan",
                    "LUBRICATE": "orange",
                    "NONE": "default",
                  };
                  
                  const solutionText = solutionMap[solution] || solution;
                  
                  return (
                    <Tooltip title={solutionText} placement="top">
                      <Tag 
                        color={colorMap[solution] || "default"} 
                        style={{ 
                          fontSize: 11,
                          padding: "2px 8px",
                          margin: 0,
                          maxWidth: "120px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "inline-block"
                        }}>
                        {solutionText}
                      </Tag>
                    </Tooltip>
                  );
                },
              },
            {
              title: "Trạng thái",
              dataIndex: "status",
                width: 100,
                align: "center",
                render: (st) => (
                  <Tag color={getStatusColor(st)} style={{ fontSize: 12 }}>
                    {getStatusText(st)}
                  </Tag>
                ),
            },
          ]}
        />
      )}
      </Card>

      {/* ✅ MODAL ĐẶT LỊCH HẸN */}
      <Modal
        title={
          <Space>
            <Calendar size={20} style={{ color: "#ff4d4f" }} />
            <span>Đặt lịch thay thế phụ tùng</span>
          </Space>
        }
        open={bookingOpen}
        onCancel={() => setBookingOpen(false)}
        footer={null}
        destroyOnClose
        width={900}
        style={{ top: 20 }}>
        <BookingForm
          onSubmit={handleCreateAppointment}
          loading={bookingLoading}
          initialValues={initialBookingValues}
          skipChassisNumber={true}
        />
      </Modal>
    </div>
  );
}

export default RMADetails;
