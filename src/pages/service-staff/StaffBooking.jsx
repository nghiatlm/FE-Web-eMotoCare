import { useState } from "react";
import { Modal, Button, Tabs } from "antd";
import { QRCodeSVG } from "qrcode.react";
import BookingDetailDrawer from "../../components/service-staff/BookingDetailDrawer";
import BookingTable from "../../components/service-staff/BookingTable";
import { useBookings } from "../../hooks/useBookings";

const StaffBooking = () => {
  const { data, loading, updateStatus } = useBookings();

  const [selected, setSelected] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [qrRecord, setQrRecord] = useState(null);
  const [openQRModal, setOpenQRModal] = useState(false);

  // 👉 Lọc dữ liệu theo loại dịch vụ
  const maintenanceData = data.filter((d) => d.serviceType === "Bảo dưỡng");
  const repairData = data.filter((d) => d.serviceType === "Sửa chữa");
  const warrantyData = data.filter((d) => d.serviceType === "Bảo hành");
  const recallData = data.filter((d) => d.serviceType === "Recall");

  const handleViewDetail = (record) => {
    setSelected(record);
    setOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    setSelected(null);
    setOpenDrawer(false);
  };

  const handleShowQR = (record) => {
    setQrRecord(record);
    setOpenQRModal(true);
  };

  const handleCloseQR = () => {
    setQrRecord(null);
    setOpenQRModal(false);
  };

  const handleUpdateStatus = (newStatus, selectedTechnician = null) => {
    if (!selected) return;
    updateStatus(selected.id, newStatus, selectedTechnician);
    setSelected({
      ...selected,
      status: newStatus,
      technician: selectedTechnician || selected.technician || null,
    });
  };

  // 👉 Tabs items
  const tabItems = [
    {
      key: "maintenance",
      label: "Bảo dưỡng",
      children: (
        <BookingTable
          data={maintenanceData}
          loading={loading}
          onViewDetail={handleViewDetail}
          onShowQR={handleShowQR}
        />
      ),
    },
    {
      key: "repair",
      label: "Sửa chữa",
      children: (
        <BookingTable
          data={repairData}
          loading={loading}
          onViewDetail={handleViewDetail}
          onShowQR={handleShowQR}
        />
      ),
    },
    {
      key: "warranty",
      label: "Bảo hành",
      children: (
        <BookingTable
          data={warrantyData}
          loading={loading}
          onViewDetail={handleViewDetail}
          onShowQR={handleShowQR}
        />
      ),
    },
    {
      key: "recall",
      label: "Recall",
      children: (
        <BookingTable
          data={recallData}
          loading={loading}
          onViewDetail={handleViewDetail}
          onShowQR={handleShowQR}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Danh sách Booking</h2>

      {/* Tabs cho từng loại dịch vụ */}
      <Tabs defaultActiveKey='maintenance' items={tabItems} />

      {/* Drawer hiển thị chi tiết */}
      <BookingDetailDrawer
        booking={selected}
        open={openDrawer}
        onClose={handleCloseDrawer}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* QR Modal */}
      <Modal
        title={qrRecord ? `QR Check-in — ${qrRecord.code}` : "QR Check-in"}
        open={openQRModal}
        onCancel={handleCloseQR}
        footer={[
          <Button key='close' onClick={handleCloseQR}>
            Đóng
          </Button>,
        ]}
        centered>
        {qrRecord ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}>
            <QRCodeSVG value={qrRecord.qrCode || qrRecord.code} size={180} />
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 24 }}>Không có QR</div>
        )}
      </Modal>
    </div>
  );
};

export default StaffBooking;
