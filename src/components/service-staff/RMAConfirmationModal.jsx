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

    try {
      setIsSubmitting(true);
      message.loading("Đang tạo yêu cầu RMA...", 0);

      // Lấy staff ID
      const staffInfo = await fetchServiceStaff();
      const staffData = staffInfo?.data?.data || staffInfo?.data || staffInfo;
      const staffId = staffData?.id;

      if (!staffId) throw new Error("Không tìm thấy Service Staff.");

      // 🔥 STEP 1 — Tạo RMA header (chỉ 1)
      const rmaPayload = {
        returnAddress: "Địa chỉ kho eMotoCare",
        createById: staffId,
        note: `Yêu cầu RMA cho booking ${booking.code}`,
      };

      console.log("📤 Create RMA:", rmaPayload);

      const rma = await createRMAService(rmaPayload);
      const rmaId = rma?.id || rma?.data?.id;

      if (!rmaId) throw new Error("Không tìm thấy rmaId trong response.");

      // 🔥 STEP 2 — Loop từng EVCheckDetail tạo detail
      for (const item of partsForRMA) {
        const detailPayload = {
          rmaId,
          evCheckDetailId: item.id,
          partItemId: item.partItem?.id,
          quantity: item.quantity || 1,
          unit: item.unit || "cái",
          description: item.NoiDung || "",
        };

        console.log("📤 Tạo RMADetail:", detailPayload);
        await createRMADetailService(detailPayload);
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
          Xác nhận & Tạo RMA
        </Button>,
      ]}>
      <p className='mb-4'>
        Xác nhận tạo yêu cầu RMA cho các phụ tùng sau (mỗi phụ tùng sẽ tạo 1 RMA
        riêng):
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
                SL: {item.quantity || 1} | PT ID: {item.partItem?.id} | EV
                Detail ID: {item.id}
              </div>
            </div>
          </List.Item>
        )}
      />
    </Modal>
  );
}
