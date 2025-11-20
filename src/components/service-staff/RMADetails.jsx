// src/components/staff/RMADetails.jsx
import React, { useState, useMemo } from "react";
import { Table, Spin, Button, message, Modal } from "antd";
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

  return (
    <div>
      {/* THÔNG TIN CHUNG */}
      <div className='mb-4 p-4 border rounded-lg bg-gray-50'>
        <p>
          <strong>Mã RMA:</strong> {rma.code}
        </p>
        <p>
          <strong>Khách hàng:</strong>{" "}
          {rma.customer
            ? `${rma.customer.firstName} ${rma.customer.lastName}`
            : "—"}
        </p>
        <p>
          <strong>Ngày tạo:</strong>{" "}
          {rma.rmaDate ? new Date(rma.rmaDate).toLocaleString("vi-VN") : "—"}
        </p>
        <p>
          <strong>Ghi chú:</strong> {rma.note || "—"}
        </p>
      </div>

      {/* 🔥 NÚT TẠO LỊCH HẸN – khi phụ tùng đã được approve/completed */}
      {hasReadyParts && (
        <div className='mb-4'>
          <Button
            type='primary'
            style={{ backgroundColor: "#16a34a" }}
            onClick={handleOpenBooking}>
            📅 Tạo lịch thay thế cho khách
          </Button>
        </div>
      )}

      {/* BẢNG CHI TIẾT RMA */}
      {loading ? (
        <div className='flex justify-center py-10'>
          <Spin />
        </div>
      ) : (
        <Table
          dataSource={details}
          rowKey='id'
          bordered
          pagination={false}
          columns={[
            {
              title: "STT",
              render: (_, __, idx) => idx + 1,
              width: 60,
            },
            {
              title: "Phụ tùng",
              render: (_, row) =>
                row.partItem?.part?.name || row.partItem?.serialNumber || "—",
            },
            {
              title: "Hình ảnh",
              dataIndex: "partItem",
              render: (partItem) =>
                partItem &&
                partItem.part.images &&
                partItem.part.images.length > 0 ? (
                  <img
                    src={partItem.part.images[0]}
                    alt='Part Item'
                    style={{ width: 50, height: 50, objectFit: "cover" }}
                  />
                ) : (
                  <span>—</span>
                ),
            },
            {
              title: "Số serial",
              render: (_, row) =>
                row.evCheckDetail?.partItem?.serialNumber || "—",
            },
            { title: "SL", dataIndex: "quantity", width: 80 },
            { title: "Lý do", dataIndex: "reason" },
            {
              title: "Ngày gửi",
              dataIndex: "releaseDateRMA",
              render: (d) =>
                d ? new Date(d).toLocaleDateString("vi-VN") : "—",
            },
            {
              title: "Hạn bảo hành",
              dataIndex: "expirationDateRMA",
              render: (d) =>
                d ? new Date(d).toLocaleDateString("vi-VN") : "—",
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              render: (st) => <span>{st || "—"}</span>,
            },
          ]}
        />
      )}

      {/* MODAL ĐẶT LỊCH HẸN */}
      <Modal
        title='Đặt lịch thay thế phụ tùng'
        open={bookingOpen}
        onCancel={() => setBookingOpen(false)}
        footer={null}
        destroyOnClose>
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
