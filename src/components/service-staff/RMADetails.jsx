// src/components/staff/RMADetails.jsx
import React, { useState, useMemo } from "react";
import { Table, Spin, Button, Modal, Card, Tag, Image, Space, Divider, Typography } from "antd";
import { toast } from "@/components/ui/sonner";
import { Calendar, User, FileText, Package, Clock, CheckCircle, Tag as TagIcon } from "lucide-react";

const { Text } = Typography;
import BookingForm from "../../components/service-staff/BookingForm";
import { createAppointmentService } from "../../services/appointmentService";
import { getPartById } from "../../api/partsApi";

// ✅ Component để hiển thị thông tin phụ tùng thay thế
function ReplacePartInfo({ replacePart }) {
  const [partInfo, setPartInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  // ✅ Debug: log replacePart để kiểm tra
  React.useEffect(() => {
    console.log("🔍 ReplacePartInfo - replacePart:", replacePart);
  }, [replacePart]);

  React.useEffect(() => {
    if (replacePart?.partId && !partInfo) {
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
  }, [replacePart?.partId]);

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
      toast.success("Tạo lịch thay thế cho khách thành công!");
      setBookingOpen(false);
    } catch (err) {
      console.error("Lỗi tạo lịch hẹn từ RMA:", err);
      toast.error("Không thể tạo lịch hẹn. Vui lòng thử lại.");
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
                          {record.reason && (
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
                                  Lý do RMA
                                </Text>
                              </div>
                              <Text style={{ fontSize: 14, color: "#ad6800", lineHeight: 1.6, marginLeft: 14 }}>
                                {record.reason}
                              </Text>
                            </div>
                          )}

                          {/* Kết quả kiểm tra */}
                          {record.result && (
                            <div style={{ 
                              padding: "14px 16px",
                              backgroundColor: "#fff1f0",
                              borderRadius: 6,
                              borderLeft: "4px solid #ff4d4f"
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <div style={{ 
                                  width: 6, 
                                  height: 6, 
                                  borderRadius: "50%", 
                                  backgroundColor: "#ff4d4f" 
                                }} />
                                <Text strong style={{ fontSize: 13, color: "#cf1322" }}>
                                  Kết quả kiểm tra
                                </Text>
                              </div>
                              <Text style={{ fontSize: 14, color: "#cf1322", lineHeight: 1.6, whiteSpace: "pre-wrap", marginLeft: 14 }}>
                                {record.result}
                              </Text>
                            </div>
                          )}

                          {/* Giải pháp */}
                          {record.solution && (
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
                              </div>
                            </div>
                          )}

                          {/* Empty state */}
                          {!record.reason && !record.result && !record.solution && (
                            <div style={{ 
                              padding: "40px 20px", 
                              textAlign: "center",
                              backgroundColor: "#fafafa",
                              borderRadius: 6
                            }}>
                              <FileText size={36} style={{ color: "#d9d9d9", marginBottom: 12 }} />
                              <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
                                Chưa có thông tin từ hãng
                              </Text>
                            </div>
                          )}
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
                width: 60,
                align: "center",
              },
              {
                title: "Hình ảnh",
                width: 100,
                align: "center",
                render: (_, row) => {
                  const imageUrl = 
                    row.evCheckDetail?.partItem?.part?.image ||
                    row.partItem?.part?.image;
                  
                  return imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt='Part Item'
                      width={60}
                      height={60}
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
                width: 200,
                render: (_, row) => {
                  // Ưu tiên lấy từ evCheckDetail.partItem.part
                  const partName = 
                    row.evCheckDetail?.partItem?.part?.name ||
                    row.partItem?.part?.name ||
                    row.evCheckDetail?.partItem?.serialNumber ||
                    row.partItem?.serialNumber ||
                    "—";
                  
                  const serialNumber = 
                    row.evCheckDetail?.partItem?.serialNumber ||
                    row.partItem?.serialNumber;
                  
                  return (
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{partName}</div>
                      {serialNumber && (
                        <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                          S/N: {serialNumber}
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
                title: "Kết quả",
                dataIndex: "result",
                width: 200,
                ellipsis: {
                  showTitle: false,
                },
                render: (result) => (
                  result ? (
                    <span title={result} style={{ color: "#ff4d4f", fontWeight: 500 }}>
                      {result}
                    </span>
                  ) : (
                    <span style={{ color: "#bfbfbf" }}>—</span>
                  )
                ),
              },
              {
                title: "Giải pháp",
                dataIndex: "solution",
                width: 150,
                align: "center",
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
                  
                  return (
                    <Tag color={colorMap[solution] || "default"}>
                      {solutionMap[solution] || solution}
                    </Tag>
                  );
                },
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
                  <Tag color={getStatusColor(st)} >
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
