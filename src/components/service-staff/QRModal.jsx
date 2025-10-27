import { Modal, Button } from "antd";
import { QRCodeSVG } from "qrcode.react";

const QRModal = ({ record, open, onClose }) => (
  <Modal
    title={record ? `QR Check-in — ${record.code}` : "QR Check-in"}
    open={open}
    onCancel={onClose}
    footer={[
      <Button key='close' onClick={onClose}>
        Đóng
      </Button>,
    ]}
    centered>
    {record ? (
      <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
        <QRCodeSVG value={record.qrCode || record.code} size={180} />
      </div>
    ) : (
      <div>Không có QR</div>
    )}
  </Modal>
);

export default QRModal;
