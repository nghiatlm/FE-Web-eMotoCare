import { useState } from "react";
import { Modal, Button, Tabs, Select, Space, Input, Card } from "antd";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import BookingTable from "../../components/service-staff/BookingTable";
import { useBookings } from "../../hooks/useBookings";
import { Filter, RotateCcw, Wrench, Search, User } from "lucide-react";

const { Option } = Select;

const TechnicianPage = () => {
  const { data, loading, updateStatus } = useBookings();
  const navigate = useNavigate();

  const [qrRecord, setQrRecord] = useState(null);
  const [openQRModal, setOpenQRModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [customerNameFilter, setCustomerNameFilter] = useState("");
  const [codeFilter, setCodeFilter] = useState("");

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
      const matchStatus = statusFilter ? statusKey === statusFilter.toUpperCase() : true;
      const matchService = serviceFilter ? typeKey === serviceFilter : true;
      
      // ✅ Filter theo tên khách hàng
      const customerName = d.customer 
        ? `${d.customer.firstName || ""} ${d.customer.lastName || ""}`.trim().toLowerCase()
        : "";
      const matchCustomerName = customerNameFilter
        ? customerName.includes(customerNameFilter.toLowerCase())
        : true;
      
      const matchCode = codeFilter
        ? d.code?.toLowerCase().includes(codeFilter.toLowerCase())
        : true;
      return matchTab && matchStatus && matchService && matchCustomerName && matchCode;
    });

  const handleViewDetail = (record) => {
    navigate(`/technician/vehicles/${record.id}`);
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
      
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#ff4d4f", display: "flex", alignItems: "center", gap: 12 }}>
          Danh sách được phân công
        </h2>
      </div>

      
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
              <Option value='PENDING'>Chờ xử lý</Option>
              <Option value='APPROVED'>Đã duyệt</Option>
              <Option value='CHECKED_IN'>Đã check-in</Option>
              <Option value='INSPECTION_COMPLETED'>Đã kiểm tra</Option>
              <Option value='QUOTE_APPROVED'>Đã duyệt báo giá</Option>
              <Option value='REPAIR_IN_PROGRESS'>Đang sửa chữa</Option>
              <Option value='REPAIR_COMPLETED'>Hoàn thành sửa chữa</Option>
              <Option value='COMPLETED'>Hoàn tất</Option>
              <Option value='CANCELED'>Đã hủy</Option>
            </Select>
          </div>

          
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
              <Option value='RECALL_TYPE'>Triệu hồi</Option>
            </Select>
          </div>

          
          <div>
            <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#595959" }}>
              Tên khách hàng
            </div>
            <Input
              placeholder='Nhập tên khách hàng'
              prefix={<User size={16} style={{ color: "#bfbfbf" }} />}
              value={customerNameFilter}
              onChange={(e) => setCustomerNameFilter(e.target.value)}
              size="large"
              allowClear
              style={{ width: "100%" }}
            />
          </div>

          
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

          
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-start" }}>
            <div
              onClick={() => {
                setStatusFilter("");
                setServiceFilter("");
                setCustomerNameFilter("");
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
            { key: "RECALL_TYPE", label: "Triệu hồi" },
          ]}
          size="large"
        />
      </Card>

      
      <BookingTable
        data={getFilteredData(data)}
        loading={loading}
        onViewDetail={handleViewDetail}
        onShowQR={handleShowQR}
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
