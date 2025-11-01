import { useState } from "react";
import { Modal, Button, Tabs, Select, Space, Input } from "antd";
import { QRCodeSVG } from "qrcode.react";
import TechnicianBookingDetailDrawer from "../../components/technician/TechnicanBookingDetailDrawer";
import BookingTable from "../../components/service-staff/BookingTable";
import { useBookings } from "../../hooks/useBookings";
import { FilterIcon, RotateCcw } from "lucide-react";

const { Option } = Select;

const TechnicianPage = () => {
  const { data, loading, updateStatus } = useBookings();

  const [selected, setSelected] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [qrRecord, setQrRecord] = useState(null);
  const [openQRModal, setOpenQRModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");

  // ✅ Lấy staff_id từ localStorage (khi đăng nhập backend sẽ lưu vào token/localStorage)
  // ✅ Lấy staffId đúng cách
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const staffId = user?.accountResponse?.id;

  const normalizeType = (type) => {
    if (!type) return "";
    let key = String(type).trim().replace(/[\s-]/g, "_").toUpperCase();
    if (key === "MAINTENACE_TYPE") key = "MAINTENANCE_TYPE";
    return key;
  };

  const getFilteredData = (list) =>
    list.filter((d) => {
      const typeKey = normalizeType(d.type);
      const statusKey = String(d.status || "").toUpperCase();
      const matchTab = activeTab === "all" ? true : typeKey === activeTab;
      const matchStatus = statusFilter ? statusKey === statusFilter : true;
      const matchService = serviceFilter ? typeKey === serviceFilter : true;
      const matchPhone = phoneFilter
        ? d.phone?.toLowerCase().includes(phoneFilter.toLowerCase())
        : true;
      return matchTab && matchStatus && matchService && matchPhone;
    });

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

  const handleUpdateStatus = (id, newStatus, selectedTechnician = null) => {
    updateStatus(id, newStatus, selectedTechnician);
    if (selected?.id === id) {
      setSelected({
        ...selected,
        status: newStatus,
        technician: selectedTechnician || selected.technician || null,
      });
    }
  };

  return (
    <div style={{ padding: 16 }}>
      {/* HEADER + FILTER */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <h2 style={{ margin: 0 }}>Danh sách phương tiện được phân công</h2>

        <Space align='center' size='middle' wrap>
          <FilterIcon style={{ fontSize: 18, color: "#555" }} />
          <span style={{ fontWeight: 500 }}>Bộ lọc:</span>

          <Select
            placeholder='Trạng thái'
            allowClear
            style={{ width: 160 }}
            value={statusFilter || undefined}
            onChange={setStatusFilter}>
            <Option value='IN_SERVICE'>Đang thực hiện</Option>
            <Option value='COMPLETED'>Hoàn tất</Option>
            <Option value='CANCELLED'>Đã hủy</Option>
          </Select>

          <Select
            placeholder='Loại dịch vụ'
            allowClear
            style={{ width: 160 }}
            value={serviceFilter || undefined}
            onChange={setServiceFilter}>
            <Option value='MAINTENANCE_TYPE'>Bảo dưỡng</Option>
            <Option value='REPAIR_TYPE'>Sửa chữa</Option>
            <Option value='WARRANTY_TYPE'>Bảo hành</Option>
            <Option value='RECALL_TYPE'>Recall</Option>
          </Select>

          <Input
            placeholder='Nhập số điện thoại'
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
            style={{ width: 180 }}
          />

          <RotateCcw
            size={20}
            style={{
              cursor: "pointer",
              color: "#555",
              transition: "color 0.2s",
            }}
            onClick={() => {
              setStatusFilter("");
              setServiceFilter("");
              setPhoneFilter("");
              setActiveTab("all");
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1677ff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
          />
        </Space>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          setServiceFilter("");
        }}
        items={[
          { key: "all", label: "Tất cả" },
          { key: "MAINTENANCE_TYPE", label: "Bảo dưỡng" },
          { key: "REPAIR_TYPE", label: "Sửa chữa" },
          { key: "WARRANTY_TYPE", label: "Bảo hành" },
          { key: "RECALL_TYPE", label: "Recall" },
        ]}
      />

      {/* Booking Table */}
      <BookingTable
        data={getFilteredData(data)}
        loading={loading}
        onViewDetail={handleViewDetail}
        onShowQR={handleShowQR}
      />

      {/* Drawer Chi tiết Booking */}
      {/* <TechnicianBookingDetailDrawer
        booking={selected}
        open={openDrawer}
        onClose={handleCloseDrawer}
        onUpdateStatus={handleUpdateStatus}
        staffId={staffId} // ✅ Truyền staffId thật xuống drawer
      /> */}
      <TechnicianBookingDetailDrawer
        booking={selected} // 🔹 Dữ liệu booking đang chọn
        open={openDrawer} // 🔹 Mở/đóng Drawer
        onClose={() => setOpenDrawer(false)} // 🔹 Đóng Drawer
        onUpdateStatus={handleUpdateStatus} // ✅ Hàm cập nhật trạng thái booking
        staffId={staffId} // ✅ ID của kỹ thuật viên hiện tại
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
            style={{ display: "flex", justifyContent: "center", padding: 24 }}>
            <QRCodeSVG value={qrRecord.qrCode || qrRecord.code} size={180} />
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 24 }}>Không có QR</div>
        )}
      </Modal>
    </div>
  );
};

export default TechnicianPage;
