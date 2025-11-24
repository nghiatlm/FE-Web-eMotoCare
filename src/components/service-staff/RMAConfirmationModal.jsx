// src/components/service-staff/RMAConfirmationModal.jsx
import { Modal, Button, List, Typography, Card, Space, Tag, Divider } from "antd";
import { toast } from "@/components/ui/sonner";
import { useState } from "react";
import { AlertTriangle, Package, CheckCircle, XCircle } from "lucide-react";

import {
  createRMAService,
  createRMADetailService,
} from "../../services/rmaService";
import { fetchServiceStaff } from "../../services/staffsService";

const { Text, Title } = Typography;

export default function RMAConfirmationModal({
  open,
  onClose,
  booking,
  partsForRMA = [],
  onRMASuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateRMA = async () => {
    if (isSubmitting) return;

    if (!partsForRMA.length) {
      return toast.warning("Không có phụ tùng nào đủ điều kiện RMA.");
    }

    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading("Đang tạo yêu cầu RMA...");

      // 1. Lấy Service Staff
      const staffInfo = await fetchServiceStaff();
      const staffData = staffInfo?.data?.data || staffInfo?.data || staffInfo;
      const staffId = staffData?.id;
      if (!staffId) {
        throw new Error("Không tìm thấy Service Staff.");
      }

      // 2. Tạo RMA header (1 RMA cho tất cả phụ tùng)
      const rmaPayload = {
        returnAddress: booking.garageAddress || "Địa chỉ kho eMotoCare",
        note: `Yêu cầu RMA cho booking ${booking.code}`,
        createById: staffId,
      };

      console.log("📤 [RMAConfirmationModal] Create RMA payload:", rmaPayload);

      const rma = await createRMAService(rmaPayload);
      console.log("✅ [RMAConfirmationModal] RMA response:", rma);

      // ➜ Với response BE: { statusCode, success, message, data: { id } }
      const rmaId = rma?.id; // <<< CHỈ SỬA DÒNG NÀY
      if (!rmaId) {
        console.error("❌ Không lấy được rmaId từ response:", rma);
        throw new Error("Không tạo được RMA (thiếu rmaId).");
      }

      // 3. Tạo RMA detail cho từng EVCheckDetail
      // const now = new Date();
      // const expiration = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 ngày

      for (const item of partsForRMA) {
        const detailPayload = {
          rmaId,
          evCheckDetailId: item.id,
          quantity: item.quantity || 1,
          reason: item.NoiDung || item.result || "Lỗi kỹ thuật / hư hỏng",
          // releaseDateRMA: now.toISOString(),
          // expirationDateRMA: expiration.toISOString(),
          inspector: staffData?.fullName || staffData?.name || "",
          result: "",
          solution: item.remedies || "",
        };

        console.log(
          "📤 [RMAConfirmationModal] Tạo RMADetail payload:",
          detailPayload
        );
        const detailRes = await createRMADetailService(detailPayload);
        console.log("✅ [RMAConfirmationModal] RMADetail response:", detailRes);
      }

      toast.dismiss(loadingToast);
      toast.success("Tạo yêu cầu RMA thành công!");
      onRMASuccess?.();
      onClose();
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error("❌ Lỗi tạo RMA:", err);
      toast.error(err?.message || "Không thể tạo RMA.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <AlertTriangle size={20} style={{ color: "#ff4d4f" }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>Xác nhận Tạo Yêu cầu RMA</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      confirmLoading={isSubmitting}
      width={700}
      footer={[
        <Button 
          key='back' 
          onClick={onClose} 
          disabled={isSubmitting}
          size="large"
          style={{ height: "40px", fontSize: "15px" }}>
          Hủy
        </Button>,
        <Button
          key='submit'
          type='primary'
          danger
          onClick={handleCreateRMA}
          loading={isSubmitting}
          size="large"
          style={{ 
            height: "40px", 
            fontSize: "15px",
            fontWeight: 600,
          }}>
          Xác nhận &amp; Tạo RMA
        </Button>,
      ]}>
      <div style={{ padding: "8px 0" }}>
        {/* ✅ Thông báo */}
        <Card
          style={{
            marginBottom: 24,
            backgroundColor: "#fff7e6",
            borderColor: "#ffd591",
            borderRadius: 8,
          }}
          bodyStyle={{ padding: "16px" }}>
          <Space>
            <AlertTriangle size={18} style={{ color: "#fa8c16" }} />
            <div>
              <Text strong style={{ fontSize: 15 }}>
                Xác nhận tạo <Text style={{ color: "#ff4d4f" }}> yêu cầu bảo hành</Text> cho{" "}
                <Text style={{ color: "#ff4d4f" }}>{partsForRMA.length} phụ tùng</Text>
              </Text>
             
            </div>
          </Space>
        </Card>

        {/* ✅ Danh sách phụ tùng */}
        <Card
          title={
            <Space>
              <Package size={18} style={{ color: "#ff4d4f" }} />
              <span style={{ fontSize: 16, fontWeight: 600 }}>Danh sách phụ tùng</span>
            </Space>
          }
          style={{ borderRadius: 8 }}
          headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "12px 16px" }}
          bodyStyle={{ padding: "16px" }}>
          <List
            dataSource={partsForRMA}
            renderItem={(item, index) => (
              <List.Item
                style={{
                  padding: "16px",
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                  marginBottom: 12,
                  backgroundColor: "#fafafa",
                }}>
                <div style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <Space>
                        <Text strong style={{ fontSize: 15 }}>
                          {index + 1}. {item.partName ||
                            item.partItem?.part?.name ||
                            "Không rõ tên PT"}
                        </Text>
                        <Tag color="red" >
                          Bảo hành hãng
                        </Tag>
                      </Space>
                    </div>
                  </div>
                  <Divider style={{ margin: "8px 0" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, fontSize: 13 }}>
                    <div>
                      <Text type="secondary">Số lượng:</Text>{" "}
                      <Text strong>{item.quantity || 1}</Text>
                    </div>
                    {(item.partItem?.serialNumber || item.serialNumber) && (
                      <div>
                        <Text type="secondary">Số serial:</Text>{" "}
                        <Text strong style={{ color: "#262626" }}>
                          {item.partItem?.serialNumber || item.serialNumber}
                        </Text>
                      </div>
                    )}
                    {item.partItem?.part?.code && (
                      <div>
                        <Text type="secondary">Mã phụ tùng:</Text>{" "}
                        <Text strong style={{ color: "#262626" }}>
                          {item.partItem.part.code}
                        </Text>
                      </div>
                    )}
                    {item.result && item.result !== "Tốt" && (
                      <div>
                        <Text type="secondary">Kết quả:</Text>{" "}
                        <Text strong style={{ color: "#ff4d4f" }}>
                          {item.result}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </Modal>
  );
}
