import { useState } from "react";
import { Modal, Button, Tabs, Select, Space, Input, Card } from "antd";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import BookingTable from "../../components/service-staff/BookingTable";
import { useBookings } from "../../hooks/useBookings";
import { RotateCcw, Filter, Calendar, Phone, Search } from "lucide-react";

const { Option } = Select;

const StaffBooking = () => {
  const { data, loading, updateStatus, fetchBookings } = useBookings();
  const navigate = useNavigate();

  const [qrRecord, setQrRecord] = useState(null);
  const [openQRModal, setOpenQRModal] = useState(false);

  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [codeFilter, setCodeFilter] = useState("");

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
      const matchCode = codeFilter
        ? d.code?.toLowerCase().includes(codeFilter.toLowerCase())
        : true;
      return matchTab && matchStatus && matchService && matchPhone && matchCode;
    });

  const handleViewDetail = (record) => {
    navigate(`/staff/booking/${record.id}`);
  };


  const handleShowQR = (record) => {
    setQrRecord(record);
    setOpenQRModal(true);
  };

  const handleCloseQR = () => {
    setQrRecord(null);
    setOpenQRModal(false);
  };

  return (
    <div style={{ padding: 24, width: "100%", maxWidth: "100%", margin: "0 auto", overflowX: "hidden", transform: "scale(1)", zoom: 1 }}>
      {/* ✅ HEADER */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#ff4d4f", display: "flex", alignItems: "center", gap: 12 }}>
          Danh sách lịch hẹn
        </h2>
      </div>

      {/* ✅ FILTER CARD */}
      <Card
        style={{ marginBottom: 24, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
        headStyle={{ 
          borderBottom: "1px solid #f0f0f0", 
          padding: "16px 20px",
          backgroundColor: "#fafafa",
          borderRadius: "8px 8px 0 0"
        }}
        bodyStyle={{ padding: "20px" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr) auto", 
          gap: "20px",
          alignItems: "end"
        }}>
          {/* Trạng thái */}
          <div>
            <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#595959" }}>
              Trạng thái
            </div>
            <Select
              placeholder='Chọn trạng thái'
              allowClear
              size="large"
              style={{ width: "100%" }}
              value={statusFilter || undefined}
              onChange={setStatusFilter}>
              <Option value='IN_SERVICE'>Đang thực hiện</Option>
              <Option value='COMPLETED'>Hoàn tất</Option>
              <Option value='CANCELLED'>Đã hủy</Option>
            </Select>
          </div>

          {/* Loại dịch vụ */}
          <div>
            <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#595959" }}>
              Loại dịch vụ
            </div>
            <Select
              placeholder='Chọn loại dịch vụ'
              allowClear
              size="large"
              style={{ width: "100%" }}
              value={serviceFilter || undefined}
              onChange={setServiceFilter}>
              <Option value='MAINTENANCE_TYPE'>Bảo dưỡng</Option>
              <Option value='REPAIR_TYPE'>Sửa chữa</Option>
              <Option value='WARRANTY_TYPE'>Bảo hành</Option>
              <Option value='CAMPAIGN_TYPE'>Chiến dịch</Option>
              <Option value='RECALL_TYPE'>Recall</Option>
            </Select>
          </div>

          {/* Số điện thoại */}
          <div>
            <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#595959" }}>
              Số điện thoại
            </div>
            <Input
              placeholder='Nhập số điện thoại'
              prefix={<Phone size={16} style={{ color: "#bfbfbf" }} />}
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              size="large"
              allowClear
              style={{ width: "100%" }}
            />
          </div>

          {/* Mã booking */}
          <div>
            <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#595959" }}>
              Mã booking
            </div>
            <Input
              placeholder='Tìm theo mã booking'
              prefix={<Search size={16} style={{ color: "#bfbfbf" }} />}
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value)}
              size="large"
              allowClear
              style={{ width: "100%" }}
            />
          </div>

          {/* Nút Reset */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-start" }}>
            <div
              onClick={() => {
                setStatusFilter("");
                setServiceFilter("");
                setPhoneFilter("");
                setCodeFilter("");
                setActiveTab("all");
              }}
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #ff4d4f",
                borderRadius: 6,
                cursor: "pointer",
                color: "#ff4d4f",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#fff1f0";
                e.currentTarget.style.borderColor = "#ff4d4f";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.borderColor = "#ff4d4f";
              }}>
              <RotateCcw size={20} />
            </div>
          </div>
        </div>
      </Card>

      {/* ✅ Tabs */}
      <Card
        style={{ marginBottom: 24, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
        bodyStyle={{ padding: "8px 16px" }}>
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
            { key: "CAMPAIGN_TYPE", label: "Chiến dịch" },
            { key: "RECALL_TYPE", label: "Recall" },
          ]}
          size="large"
        />
      </Card>

      {/* Table */}
      <BookingTable
        data={getFilteredData(data)}
        loading={loading}
        onViewDetail={handleViewDetail}
        onShowQR={handleShowQR}
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

export default StaffBooking;
