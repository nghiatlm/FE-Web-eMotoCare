// src/components/staff/RMADetails.jsx
import React, { useState, useMemo } from "react";
import { Table, Spin, Button, message, Modal, Card, Tag, Image, Space, Divider } from "antd";
import { Calendar, User, FileText, Package, Clock, CheckCircle, Tag as TagIcon } from "lucide-react";
import BookingForm from "../../components/service-staff/BookingForm";
import { createAppointmentService } from "../../services/appointmentService";

function RMADetails({ rma, details = [], loading }) {
  // 👉 Khi nào có ít nhất 1 detail đã được hãng duyệt thì cho tạo lịch
  const hasReadyParts = useMemo(
    () =>
      details.some((d) => d.status === "APPROVED" || d.status === "PENDING"),
    [details]
  );

  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  if (!rma) return <p>Không tìm thấy thông tin RMA.</p>;

  // Prefill cho BookingForm
  const initialBookingValues = useMemo(
    () => ({
      customerId: rma?.customer?.id,
      serviceCenterId: rma?.staff?.serviceCenterId,
      // vehicleId để staff tự chọn từ dropdown nếu BE không trả về trong RMA
      estimatedCost: 0,
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
        // status: "PENDING",
        note: `Lịch thay thế phụ tùng từ RMA ${rma.code}`,
        rmaId: rma?.id || null, // ✅ Truyền rmaId xuống BE
      };

      await createAppointmentService(payload);
      message.success("Tạo lịch thay thế cho khách thành công!");
      setBookingOpen(false);
    } catch (err) {
      console.error("Lỗi tạo lịch hẹn từ RMA:", err);
      message.error("Không thể tạo lịch hẹn. Vui lòng thử lại.");
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
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
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
        headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "16px 24px" }}
        bodyStyle={{ padding: "24px" }}>
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
            size="middle"
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: "STT",
                render: (_, __, idx) => idx + 1,
                width: 60,
                align: "center",
              },
              {
                title: "Hình ảnh",
                dataIndex: "partItem",
                width: 100,
                align: "center",
                render: (partItem) =>
                  partItem &&
                  partItem.part?.image ? (
                    <Image
                      src={partItem.part.image}
                      alt='Part Item'
                      width={60}
                      height={60}
                      style={{ objectFit: "cover", borderRadius: 4 }}
                      preview
                    />
                  ) : (
                    <span style={{ color: "#bfbfbf" }}>—</span>
                  ),
              },
              {
                title: "Phụ tùng",
                width: 200,
                render: (_, row) => {
                  const partName = row.partItem?.part?.name || row.partItem?.serialNumber || "—";
                  return (
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{partName}</div>
                      {row.evCheckDetail?.partItem?.serialNumber && (
                        <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                          S/N: {row.evCheckDetail.partItem.serialNumber}
                        </div>
                      )}
                    </div>
                  );
                },
              },
              {
                title: "Số lượng",
                dataIndex: "quantity",
                width: 100,
                align: "center",
                render: (qty) => qty || 1,
              },
              {
                title: "Lý do",
                dataIndex: "reason",
                width: 200,
                ellipsis: {
                  showTitle: false,
                },
                render: (reason) => (
                  <span title={reason}>{reason || "—"}</span>
                ),
              },
              {
                title: "Ngày gửi",
                dataIndex: "releaseDateRMA",
                width: 140,
                render: (d) =>
                  d ? (
                    <Space>
                      <Clock size={14} style={{ color: "#8c8c8c" }} />
                      <span>{new Date(d).toLocaleDateString("vi-VN")}</span>
                    </Space>
                  ) : (
                    <span style={{ color: "#bfbfbf" }}>—</span>
                  ),
              },
              {
                title: "Hạn bảo hành",
                dataIndex: "expirationDateRMA",
                width: 140,
                render: (d) =>
                  d ? (
                    <Space>
                      <Calendar size={14} style={{ color: "#8c8c8c" }} />
                      <span>{new Date(d).toLocaleDateString("vi-VN")}</span>
                    </Space>
                  ) : (
                    <span style={{ color: "#bfbfbf" }}>—</span>
                  ),
              },
              {
                title: "Trạng thái",
                dataIndex: "status",
                width: 140,
                align: "center",
                render: (st) => (
                  <Tag color={getStatusColor(st)} icon={<CheckCircle size={12} />}>
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
        />
      </Modal>
    </div>
  );
}

export default RMADetails;
