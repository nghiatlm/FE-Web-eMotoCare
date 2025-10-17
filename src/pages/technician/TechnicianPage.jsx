import { useState, useMemo } from "react";
import { Modal, Button, Tabs, Select, Space, Input } from "antd";
import { QRCodeSVG } from "qrcode.react";
import BookingDetailDrawer from "../../components/service-staff/BookingDetailDrawer";
import BookingTable from "../../components/service-staff/BookingTable";
import { useBookings } from "../../hooks/useBookings";
import { FilterIcon, RotateCcw } from "lucide-react";

const { Option } = Select;

const TechnicianPage = () => {
  const { data, loading, updateStatus } = useBookings();

  // 👇 giả sử kỹ thuật viên đang đăng nhập có id = 2
  const currentTechnicianId = 2;

  // 🔧 Lọc các booking được gán cho technician hiện tại
  const myBookings = useMemo(() => {
    return data.filter(
      (item) =>
        item.technician?.id === currentTechnicianId ||
        item.assignedTo === currentTechnicianId
    );
  }, [data]);

  const [selected, setSelected] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [qrRecord, setQrRecord] = useState(null);
  const [openQRModal, setOpenQRModal] = useState(false);

  // 🔍 Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");

  // 👉 Hàm lọc tổng hợp (trên dữ liệu của technician)
  const getFilteredData = (list) => {
    return list.filter((d) => {
      const matchStatus = statusFilter ? d.status === statusFilter : true;
      const matchService = serviceFilter
        ? d.serviceType === serviceFilter
        : true;
      const matchPhone = phoneFilter
        ? d.phone?.toLowerCase().includes(phoneFilter.toLowerCase())
        : true;
      return matchStatus && matchService && matchPhone;
    });
  };

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

  const handleUpdateStatus = (newStatus) => {
    if (!selected) return;
    updateStatus(selected.id, newStatus);
    setSelected({ ...selected, status: newStatus });
  };

  // 👉 Tabs theo loại dịch vụ
  const tabItems = [
    {
      key: "all",
      label: "Tất cả",
      children: (
        <BookingTable
          data={getFilteredData(myBookings)}
          loading={loading}
          onViewDetail={handleViewDetail}
          onShowQR={handleShowQR}
        />
      ),
    },
    {
      key: "maintenance",
      label: "Bảo dưỡng",
      children: (
        <BookingTable
          data={getFilteredData(
            myBookings.filter((d) => d.serviceType === "Maintenance")
          )}
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
          data={getFilteredData(
            myBookings.filter((d) => d.serviceType === "Repair")
          )}
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
          data={getFilteredData(
            myBookings.filter((d) => d.serviceType === "Warranty")
          )}
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
          data={getFilteredData(
            myBookings.filter((d) => d.serviceType === "Recall")
          )}
          loading={loading}
          onViewDetail={handleViewDetail}
          onShowQR={handleShowQR}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* Header + Bộ lọc */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <h2 style={{ margin: 0 }}>Công việc của tôi</h2>

        <Space align='center' size='middle' wrap>
          <FilterIcon style={{ fontSize: 18, color: "#555" }} />
          <span style={{ fontWeight: 500 }}>Bộ lọc:</span>

          <Select
            placeholder='Trạng thái'
            allowClear
            style={{ width: 160 }}
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value)}>
            <Option value='Pending'>Chờ xử lý</Option>
            <Option value='InProgress'>Đang thực hiện</Option>
            <Option value='Completed'>Hoàn tất</Option>
            <Option value='Cancelled'>Đã hủy</Option>
          </Select>

          <Select
            placeholder='Loại dịch vụ'
            allowClear
            style={{ width: 160 }}
            value={serviceFilter || undefined}
            onChange={(value) => setServiceFilter(value)}>
            <Option value='Maintenance'>Bảo dưỡng</Option>
            <Option value='Repair'>Sửa chữa</Option>
            <Option value='Warranty'>Bảo hành</Option>
            <Option value='Recall'>Recall</Option>
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
              transition: "color 0.2s ease",
            }}
            onClick={() => {
              setStatusFilter("");
              setServiceFilter("");
              setPhoneFilter("");
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1677ff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
          />
        </Space>
      </div>

      <Tabs defaultActiveKey='all' items={tabItems} />

      {/* Drawer chi tiết */}
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
