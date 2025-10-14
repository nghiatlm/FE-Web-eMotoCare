import { useState } from "react";
import { Modal, Button } from "antd";
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

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Booking</h2>

      <BookingTable
        data={data}
        loading={loading}
        onViewDetail={handleViewDetail}
        onShowQR={handleShowQR}
      />

      <BookingDetailDrawer
        booking={selected}
        open={openDrawer}
        onClose={handleCloseDrawer}
        onUpdateStatus={handleUpdateStatus}
      />

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
        {qrRecord && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}>
            <QRCodeSVG value={qrRecord.qrCode || qrRecord.code} size={180} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StaffBooking;
