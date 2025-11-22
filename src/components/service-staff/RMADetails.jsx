// src/components/staff/RMADetails.jsx
import React, { useState, useMemo } from "react";
import { Table, Spin, Button, message, Modal, Card, Tag, Image, Space, Divider, Typography } from "antd";
import { Calendar, User, FileText, Package, Clock, CheckCircle, Tag as TagIcon } from "lucide-react";

const { Text } = Typography;
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
                
                return (
                  <div style={{ padding: "16px 24px", backgroundColor: "#fafafa", borderRadius: 8 }}>
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(2, 1fr)", 
                      gap: 16
                    }}>
                      {/* Thông tin phụ tùng */}
                      <Card
                        title={<span style={{ fontSize: 14, fontWeight: 600 }}>Thông tin phụ tùng</span>}
                        size="small"
                        style={{ backgroundColor: "#fff" }}
                        headStyle={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}
                        bodyStyle={{ padding: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                          {part?.name && (
                            <div>
                              <Text type="secondary">Tên phụ tùng:</Text>{" "}
                              <Text strong>{part.name}</Text>
                            </div>
                          )}
                          {partItem?.serialNumber && (
                            <div>
                              <Text type="secondary">Số serial:</Text>{" "}
                              <Text strong style={{ fontFamily: "monospace" }}>{partItem.serialNumber}</Text>
                            </div>
                          )}
                          {part?.code && (
                            <div>
                              <Text type="secondary">Mã phụ tùng:</Text>{" "}
                              <Text strong>{part.code}</Text>
                            </div>
                          )}
                          {evCheckDetail?.quantity && (
                            <div>
                              <Text type="secondary">Số lượng:</Text>{" "}
                              <Text strong>{evCheckDetail.quantity}</Text>
                            </div>
                          )}
                          {evCheckDetail?.unit && (
                            <div>
                              <Text type="secondary">Đơn vị:</Text>{" "}
                              <Text strong>{evCheckDetail.unit}</Text>
                            </div>
                          )}
                          {partItem?.price && (
                            <div>
                              <Text type="secondary">Giá phụ tùng:</Text>{" "}
                              <Text strong style={{ color: "#ff4d4f" }}>
                                {Number(partItem.price).toLocaleString("vi-VN")} ₫
                              </Text>
                            </div>
                          )}
                          {partItem?.warrantyPeriod && (
                            <div>
                              <Text type="secondary">Thời hạn bảo hành:</Text>{" "}
                              <Text strong>{partItem.warrantyPeriod} tháng</Text>
                            </div>
                          )}
                          {partItem?.warantyStartDate && partItem?.warantyEndDate && (
                            <div>
                              <Text type="secondary">Bảo hành từ:</Text>{" "}
                              <Text>
                                {new Date(partItem.warantyStartDate).toLocaleDateString("vi-VN")} - {new Date(partItem.warantyEndDate).toLocaleDateString("vi-VN")}
                              </Text>
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Thông tin hư hỏng */}
                      <Card
                        title={<span style={{ fontSize: 14, fontWeight: 600 }}>Thông tin hư hỏng</span>}
                        size="small"
                        style={{ backgroundColor: "#fff" }}
                        headStyle={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}
                        bodyStyle={{ padding: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                          {record.reason && (
                            <div>
                              <Text type="secondary">Lý do RMA:</Text>
                              <div style={{ marginTop: 4, padding: "8px 12px", backgroundColor: "#fff7e6", borderRadius: 4, border: "1px solid #ffd591" }}>
                                <Text strong style={{ color: "#d4380d" }}>{record.reason}</Text>
                              </div>
                            </div>
                          )}
                          {evCheckDetail?.result && evCheckDetail.result !== "Tốt" && (
                            <div>
                              <Text type="secondary">Kết quả kiểm tra:</Text>
                              <div style={{ marginTop: 4, padding: "8px 12px", backgroundColor: "#fff1f0", borderRadius: 4, border: "1px solid #ffccc7" }}>
                                <Text strong style={{ color: "#ff4d4f" }}>{evCheckDetail.result}</Text>
                              </div>
                            </div>
                          )}
                          {evCheckDetail?.remedies && (
                            <div>
                              <Text type="secondary">Biện pháp:</Text>{" "}
                              <Tag color={
                                evCheckDetail.remedies === "REPLACE" ? "red" :
                                evCheckDetail.remedies === "REPAIR" ? "blue" :
                                evCheckDetail.remedies === "CHECK" ? "cyan" : "default"
                              }>
                                {evCheckDetail.remedies === "REPLACE" ? "Thay thế" :
                                 evCheckDetail.remedies === "REPAIR" ? "Sửa chữa" :
                                 evCheckDetail.remedies === "CHECK" ? "Kiểm tra" :
                                 evCheckDetail.remedies === "NONE" ? "Bôi trơn" : evCheckDetail.remedies}
                              </Tag>
                            </div>
                          )}
                          {/* {evCheckDetail?.pricePart && (
                            <div>
                              <Text type="secondary">Giá phụ tùng (EVCheck):</Text>{" "}
                              <Text strong style={{ color: "#ff4d4f" }}>
                                {Number(evCheckDetail.pricePart).toLocaleString("vi-VN")} ₫
                              </Text>
                            </div>
                          )} */}
                          {/* {evCheckDetail?.priceService && (
                            <div>
                              <Text type="secondary">Giá dịch vụ:</Text>{" "}
                              <Text strong>
                                {Number(evCheckDetail.priceService).toLocaleString("vi-VN")} ₫
                              </Text>
                            </div>
                          )} */}
                          {/* {evCheckDetail?.totalAmount && (
                            <div>
                              <Text type="secondary">Tổng tiền:</Text>{" "}
                              <Text strong style={{ color: "#ff4d4f", fontSize: 15 }}>
                                {Number(evCheckDetail.totalAmount).toLocaleString("vi-VN")} ₫
                              </Text>
                            </div>
                          )} */}
                          {record.solution && (
                            <div>
                              <Text type="secondary">Giải pháp:</Text>{" "}
                              <Text>{record.solution}</Text>
                            </div>
                          )}
                          {evCheckDetail?.status && (
                            <div>
                              <Text type="secondary">Trạng thái EVCheck:</Text>{" "}
                              <Tag color={
                                evCheckDetail.status === "COMPLETED" ? "success" :
                                evCheckDetail.status === "IN_PROGRESS" ? "processing" :
                                "default"
                              }>
                                {evCheckDetail.status === "COMPLETED" ? "Hoàn thành" :
                                 evCheckDetail.status === "IN_PROGRESS" ? "Đang xử lý" :
                                 evCheckDetail.status}
                              </Tag>
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Thông tin RMA */}
                      <Card
                        title={<span style={{ fontSize: 14, fontWeight: 600 }}>Thông tin RMA</span>}
                        size="small"
                        style={{ backgroundColor: "#fff" }}
                        headStyle={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}
                        bodyStyle={{ padding: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                          {record.releaseDateRMA && (
                            <div>
                              <Text type="secondary">Ngày gửi:</Text>{" "}
                              <Text>{new Date(record.releaseDateRMA).toLocaleString("vi-VN")}</Text>
                            </div>
                          )}
                          {record.expirationDateRMA && (
                            <div>
                              <Text type="secondary">Hạn bảo hành:</Text>{" "}
                              <Text>{new Date(record.expirationDateRMA).toLocaleString("vi-VN")}</Text>
                            </div>
                          )}
                          {record.inspector && (
                            <div>
                              <Text type="secondary">Người kiểm tra:</Text>{" "}
                              <Text>{record.inspector}</Text>
                            </div>
                          )}
                          {record.result && (
                            <div>
                              <Text type="secondary">Kết quả xử lý:</Text>{" "}
                              <Text>{record.result}</Text>
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Thông tin liên quan */}
                      <Card
                        title={<span style={{ fontSize: 14, fontWeight: 600 }}>Thông tin liên quan</span>}
                        size="small"
                        style={{ backgroundColor: "#fff" }}
                        headStyle={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}
                        bodyStyle={{ padding: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                          {/* Khách hàng - luôn có từ rma */}
                          {customer && (
                            <div>
                              <Text type="secondary">Khách hàng:</Text>{" "}
                              <Text strong>
                                {customer.firstName || ""} {customer.lastName || ""}
                              </Text>
                              {customer.account?.phone && (
                                <div style={{ marginTop: 4 }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    📞 {customer.account.phone}
                                  </Text>
                                </div>
                              )}
                              {customer.customerCode && (
                                <div style={{ marginTop: 4 }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    Mã KH: {customer.customerCode}
                                  </Text>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Thông tin booking từ rma */}
                          {rma?.appointmentCode && (
                            <div>
                              <Text type="secondary">Mã booking:</Text>{" "}
                              <Text strong style={{ color: "#1890ff" }}>{rma.appointmentCode}</Text>
                            </div>
                          )}
                          
                          {/* Thông tin từ booking object nếu có */}
                          {booking?.code && (
                            <div>
                              <Text type="secondary">Mã booking:</Text>{" "}
                              <Text strong style={{ color: "#1890ff" }}>{booking.code}</Text>
                            </div>
                          )}
                          {booking?.appointmentDate && (
                            <div>
                              <Text type="secondary">Ngày hẹn:</Text>{" "}
                              <Text>{new Date(booking.appointmentDate).toLocaleDateString("vi-VN")}</Text>
                            </div>
                          )}
                          
                          {/* Thông tin xe */}
                          {vehicle?.modelName && (
                            <div>
                              <Text type="secondary">Xe:</Text>{" "}
                              <Text strong>{vehicle.modelName}</Text>
                              {vehicle.color && (
                                <Text type="secondary"> ({vehicle.color})</Text>
                              )}
                            </div>
                          )}
                          {vehicle?.chassisNumber && (
                            <div>
                              <Text type="secondary">Số khung:</Text>{" "}
                              <Text style={{ fontFamily: "monospace", fontSize: 12 }}>{vehicle.chassisNumber}</Text>
                            </div>
                          )}
                          {vehicle?.engineNumber && (
                            <div>
                              <Text type="secondary">Số máy:</Text>{" "}
                              <Text style={{ fontFamily: "monospace", fontSize: 12 }}>{vehicle.engineNumber}</Text>
                            </div>
                          )}
                          
                          {/* Kỹ thuật viên */}
                          {technician && (
                            <div>
                              <Text type="secondary">Kỹ thuật viên:</Text>{" "}
                              <Text>
                                {technician.firstName || ""} {technician.lastName || ""}
                              </Text>
                            </div>
                          )}
                          
                          {/* Thông tin EVCheck */}
                          {evCheck?.odometer && (
                            <div>
                              <Text type="secondary">Số km:</Text>{" "}
                              <Text strong>{Number(evCheck.odometer).toLocaleString("vi-VN")} km</Text>
                            </div>
                          )}
                          {evCheck?.createdAt && (
                            <div>
                              <Text type="secondary">Ngày kiểm tra:</Text>{" "}
                              <Text>{new Date(evCheck.createdAt).toLocaleString("vi-VN")}</Text>
                            </div>
                          )}
                          {evCheckDetail?.note && (
                            <div>
                              <Text type="secondary">Ghi chú:</Text>
                              <div style={{ marginTop: 4, padding: "8px 12px", backgroundColor: "#f0f0f0", borderRadius: 4 }}>
                                <Text style={{ fontSize: 12 }}>{evCheckDetail.note}</Text>
                              </div>
                            </div>
                          )}
                          
                          {/* Thông tin RMA */}
                          {rma?.code && (
                            <div>
                              <Text type="secondary">Mã RMA:</Text>{" "}
                              <Text strong style={{ color: "#ff4d4f" }}>{rma.code}</Text>
                            </div>
                          )}
                          {rma?.rmaDate && (
                            <div>
                              <Text type="secondary">Ngày tạo RMA:</Text>{" "}
                              <Text>{new Date(rma.rmaDate).toLocaleDateString("vi-VN")}</Text>
                            </div>
                          )}
                        </div>
                      </Card>
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
