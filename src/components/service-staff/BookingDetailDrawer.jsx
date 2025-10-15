import { Drawer, Table, Button, Tag, Divider, Select } from "antd";
import { motion } from "framer-motion";
import { useState } from "react";
import MaintenanceContent from "./detail-content/MaintenanceContent";
import RepairContent from "./detail-content/RepairContent";
import WarrantyContent from "./detail-content/WarrantyContent";
import RecallContent from "./detail-content/RecallContent";

const statusColors = {
  Pending: "#faad14",
  Accepted: "#1677ff",
  Assigned: "#13c2c2",
  CheckedIn: "#722ed1",
  Diagnosed: "#fa541c",
  Approved: "#2f54eb",
  Completed: "#52c41a",
  Rejected: "#f5222d",
};

const mockTechnicians = [
  { id: 1, name: "Nguyễn Văn A", phone: "0901234567", specialty: "Điện" },
  { id: 2, name: "Trần Văn B", phone: "0902345678", specialty: "Động cơ" },
  { id: 3, name: "Lê Văn C", phone: "0903456789", specialty: "Khung gầm" },
];

// 👉 render phần nội dung khác nhau tùy loại dịch vụ
const renderServiceContent = (serviceType, booking) => {
  switch (serviceType) {
    case "Bảo dưỡng":
    case "Maintenance":
      return <MaintenanceContent booking={booking} />;
    case "Sửa chữa":
    case "Repair":
      return <RepairContent booking={booking} />;
    case "Bảo hành":
    case "Warranty":
      return <WarrantyContent booking={booking} />;
    case "Recall":
      return <RecallContent booking={booking} />;
    default:
      return (
        <div className='text-gray-500'>Không có dữ liệu dịch vụ phù hợp</div>
      );
  }
};

export default function BookingDetailDrawer({
  booking,
  open,
  onClose,
  onUpdateStatus,
}) {
  const [selectedTechnician, setSelectedTechnician] = useState(null);

  if (!booking) return null;

  const handleAssignTechnician = () => {
    if (!selectedTechnician) return;
    onUpdateStatus("Assigned", selectedTechnician);
  };

  return (
    <Drawer
      title={
        <div className='flex justify-between items-center'>
          <span className='font-semibold text-lg text-[#c41e0e]'>
            Chi tiết booking: {booking.code}
          </span>
          <Tag
            color={statusColors[booking.status]}
            className='text-sm px-3 py-1 rounded-full capitalize'>
            {booking.status}
          </Tag>
        </div>
      }
      width={800}
      open={open}
      onClose={onClose}
      bodyStyle={{
        background: "#fff7f3",
        paddingBottom: 80,
        borderRadius: "12px",
      }}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}>
        {/* 🧾 Thông tin chung */}
        <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border border-[#ffd9c2]'>
          <h3 className='font-semibold text-base mb-3 border-b pb-2 text-[#d4380d]'>
            🧾 Thông tin chung
          </h3>
          <div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700'>
            <p>
              <strong>Người đặt:</strong> {booking.customerName}
            </p>
            <p>
              <strong>SĐT:</strong> {booking.phone}
            </p>
            <p>
              <strong>Loại xe:</strong> {booking.vehicleType}
            </p>
            <p>
              <strong>Dịch vụ:</strong> {booking.serviceType}
            </p>
            <p>
              <strong>Thời gian:</strong> {booking.time}
            </p>
            <p>
              <strong>Ghi chú:</strong> {booking.note || "—"}
            </p>
          </div>
        </section>

        {/* 👨‍🔧 Chọn kỹ thuật viên */}
        {booking.status === "Accepted" && (
          <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border border-[#ffd9c2]'>
            <h3 className='font-semibold text-base mb-3 border-b pb-2 text-[#d4380d]'>
              👨‍🔧 Chọn kỹ thuật viên
            </h3>
            <Select
              style={{ width: "100%" }}
              placeholder='Chọn kỹ thuật viên phụ trách'
              onChange={(value) => {
                const tech = mockTechnicians.find((t) => t.id === value);
                setSelectedTechnician(tech);
              }}>
              {mockTechnicians.map((t) => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name} — {t.specialty}
                </Select.Option>
              ))}
            </Select>

            {selectedTechnician && (
              <div className='mt-4 bg-[#fff8f0] p-4 rounded-lg border border-[#ffd9c2]'>
                <p>
                  <strong>Tên:</strong> {selectedTechnician.name}
                </p>
                <p>
                  <strong>SĐT:</strong> {selectedTechnician.phone}
                </p>
                <p>
                  <strong>Chuyên môn:</strong> {selectedTechnician.specialty}
                </p>
              </div>
            )}

            <Button
              type='primary'
              className='mt-4 bg-[#d4380d] hover:bg-[#b32005]'
              disabled={!selectedTechnician}
              onClick={handleAssignTechnician}>
              Xác nhận chọn kỹ thuật viên
            </Button>
          </section>
        )}

        {/* 👨‍🔧 Thông tin kỹ thuật viên */}
        {booking.technician && (
          <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border border-[#ffd9c2]'>
            <h3 className='font-semibold text-base mb-3 border-b pb-2 text-[#d4380d]'>
              👨‍🔧 Kỹ thuật viên phụ trách
            </h3>
            <div className='grid grid-cols-2 gap-y-2 text-sm text-gray-700'>
              <p>
                <strong>Tên:</strong> {booking.technician.name}
              </p>
              <p>
                <strong>SĐT:</strong> {booking.technician.phone}
              </p>
              <p>
                <strong>Chuyên môn:</strong> {booking.technician.specialty}
              </p>
            </div>
          </section>
        )}

        {/* 🔍 Nội dung công việc (tùy loại dịch vụ) */}
        <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border border-[#ffd9c2]'>
          <h3 className='font-semibold text-base mb-3 border-b pb-2 text-[#d4380d]'>
            📋 Nội dung công việc
          </h3>
          {renderServiceContent(booking.serviceType, booking)}
        </section>

        <Divider />

        {/* ⚙️ Nút hành động */}
        <div className='flex gap-3 justify-end mt-6'>
          {booking.status === "Pending" && (
            <>
              <Button danger onClick={() => onUpdateStatus("Rejected")}>
                Từ chối
              </Button>
              <Button
                type='primary'
                className='bg-[#d4380d] hover:bg-[#b32005]'
                onClick={() => onUpdateStatus("Accepted")}>
                Chấp nhận
              </Button>
            </>
          )}

          {booking.status === "Assigned" && (
            <Button
              type='primary'
              className='bg-[#d4380d] hover:bg-[#b32005]'
              onClick={() => onUpdateStatus("CheckedIn")}>
              🔍 Check-in
            </Button>
          )}

          {booking.status === "CheckedIn" && (
            <Button
              type='primary'
              className='bg-[#d4380d] hover:bg-[#b32005]'
              onClick={() => onUpdateStatus("Diagnosed")}>
              Nhập kết quả kiểm tra
            </Button>
          )}

          {booking.status === "Diagnosed" && (
            <Button
              type='primary'
              className='bg-[#d4380d] hover:bg-[#b32005]'
              onClick={() => onUpdateStatus("Approved")}>
              Xác nhận sửa chữa
            </Button>
          )}

          {booking.status === "Approved" && (
            <Button
              type='primary'
              className='bg-[#d4380d] hover:bg-[#b32005]'
              onClick={() => onUpdateStatus("Completed")}>
              Hoàn tất / Xuất hóa đơn
            </Button>
          )}
        </div>
      </motion.div>
    </Drawer>
  );
}
