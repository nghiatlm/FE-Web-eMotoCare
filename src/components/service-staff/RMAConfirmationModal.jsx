// src/components/service-staff/RMAConfirmationModal.jsx
import { Modal, Button, List, Typography, message } from "antd";
import { useState } from "react";

import {
  createRMAService,
  createRMADetailService,
} from "../../services/rmaService";
import { fetchServiceStaff } from "../../services/staffsService";

const { Text } = Typography;

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
      return message.warning("Không có phụ tùng nào đủ điều kiện RMA.");
    }

    try {
      setIsSubmitting(true);
      message.loading("Đang tạo yêu cầu RMA...", 0);

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
      const now = new Date();
      const expiration = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 ngày

      for (const item of partsForRMA) {
        const detailPayload = {
          rmaId,
          evCheckDetailId: item.id,
          quantity: item.quantity || 1,
          reason: item.NoiDung || item.result || "Lỗi kỹ thuật / hư hỏng",
          releaseDateRMA: now.toISOString(),
          expirationDateRMA: expiration.toISOString(),
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

      message.destroy();
      message.success("Tạo yêu cầu RMA thành công!");
      onRMASuccess?.();
      onClose();
    } catch (err) {
      message.destroy();
      console.error("❌ Lỗi tạo RMA:", err);
      message.error(err?.message || "Không thể tạo RMA.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title='🚨 Xác nhận Tạo Yêu cầu RMA'
      open={open}
      onCancel={onClose}
      confirmLoading={isSubmitting}
      footer={[
        <Button key='back' onClick={onClose} disabled={isSubmitting}>
          Hủy
        </Button>,
        <Button
          key='submit'
          type='primary'
          danger
          onClick={handleCreateRMA}
          loading={isSubmitting}>
          Xác nhận &amp; Tạo RMA
        </Button>,
      ]}>
      <p className='mb-4'>
        Xác nhận tạo <b>01 yêu cầu RMA</b> cho <b>{partsForRMA.length} phụ tùng</b> sau:
        <br />
        {/* <span className='text-sm text-gray-500'>
          (Mỗi phụ tùng sẽ tạo 1 RMADetail, tất cả gom vào 1 RMA)
        </span> */}
      </p>

      <List
        bordered
        dataSource={partsForRMA}
        renderItem={(item) => (
          <List.Item>
            <div className='flex flex-col w-full'>
              <div className='flex items-center justify-between'>
                <Text strong>
                  {item.partName ||
                    item.partItem?.part?.name ||
                    "Không rõ tên PT"}
                </Text>
                <Text type='danger'>Bảo hành hãng</Text>
              </div>
              <div className='text-xs text-gray-500 mt-1'>
                SL: {item.quantity || 1} | PartItem ID: {item.partItem?.id} | EV
                Detail ID: {item.id}
              </div>
            </div>
          </List.Item>
        )}
      />
    </Modal>
  );
}
