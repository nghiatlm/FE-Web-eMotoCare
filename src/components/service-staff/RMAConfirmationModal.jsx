// file: RMAConfirmationModal.jsx

import { Modal, Button, List, Typography, message } from "antd";
import { useState } from "react";
// 🆕 Import service tạo RMA (Cập nhật đường dẫn thực tế của bạn)
import { createRMAService } from "../../services/rmaService"; // Giả định rmaService nằm ở đây
import { fetchServiceStaff } from "../../services/staffsService";
const { Text } = Typography;

export default function RMAConfirmationModal({
  open,
  onClose,
  booking,
  partsForRMA,
  onRMASuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ... (mapPartsToRMAItems)

  const handleCreateRMA = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      message.loading("Đang gửi yêu cầu RMA...", 0);

      // 🚨 BƯỚC KHẮC PHỤC: Gọi hàm fetchServiceStaff để lấy staffId
      const staff = await fetchServiceStaff();
      const staffId = staff?.id;

      if (!staffId) {
        throw new Error(
          "Không tìm thấy ID nhân viên (Service Staff) để tạo RMA."
        );
      }

      // Xây dựng Payload
      const payload = {
        // ...
        returnAddress: booking.garageAddress || "Địa chỉ trả hàng mặc định",
        note: `Yêu cầu RMA cho booking: ${booking.code}. Số lượng phụ tùng: ${partsForRMA.length}.`,
        createById: staffId, // 👈 ID Staff đã được lấy thành công
        customerId: booking.customer?.id,
        // ...
      };

      // 🎯 GỌI API TẠO RMA
      await createRMAService(payload);

      message.destroy();
      message.success(
        `Đã tạo yêu cầu RMA cho ${partsForRMA.length} phụ tùng thành công!`
      );

      onRMASuccess?.();
      onClose();
    } catch (error) {
      message.destroy();
      console.error("Lỗi tạo RMA:", error);
      message.error(
        error?.message ||
          "Không thể tạo yêu cầu RMA. Vui lòng kiểm tra console."
      );
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
      <p className='mb-4'>Xác nhận tạo yêu cầu RMA cho các phụ tùng sau:</p>

      <List
        bordered
        dataSource={partsForRMA}
        renderItem={(item) => (
          <List.Item>
            {/* Giả định cấu trúc item.partName tồn tại */}
            <Text strong>
              {item.partName || item.partItem?.part?.name || "Không rõ tên PT"}
            </Text>
            {/* Giả định item.partItem có các thuộc tính cần thiết */}
            <Text type='secondary' className='ml-2'>
              (SL: {item.quantity || 1}, PT ID: {item.partItem?.id})
            </Text>
            <Text type='danger' className='ml-auto'>
              Bảo hành hãng
            </Text>
          </List.Item>
        )}
      />
    </Modal>
  );
}
