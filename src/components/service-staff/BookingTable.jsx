import { Table, Tag, Button, Space } from "antd";
import { QrcodeOutlined } from "@ant-design/icons";
import {
  STATUS_COLORS,
  STATUS_MAP,
  SERVICE_TYPE_COLORS,
  SERVICE_TYPE_MAP,
} from "../../utils/constants";

export default function BookingTable({
  data = [],
  loading = false,
  onViewDetail = () => {},
  onShowQR = () => {},
}) {
  const columns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, idx) => (
        <span style={{ fontWeight: 500, color: "#595959" }}>{idx + 1}</span>
      ),
    },
    {
      title: "Mã đặt lịch",
      dataIndex: "code",
      key: "code",
      width: 140,
      render: (code) => (
        <span style={{ fontWeight: 600, color: "#262626" }}>{code || "—"}</span>
      ),
    },
    {
      title: "Người đặt",
      dataIndex: "customer",
      key: "customer",
      width: 180,
      render: (customer) => {
        if (!customer) return <span style={{ color: "#bfbfbf" }}>—</span>;
        const name = [customer.firstName, customer.lastName]
          .filter(Boolean)
          .join(" ");
        return <div style={{ fontWeight: 500, color: "#262626" }}>{name || "—"}</div>;
      },
    },
    {
      title: "Trung tâm dịch vụ",
      dataIndex: "serviceCenter",
      key: "serviceCenter",
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (center) => (
        <span style={{ color: "#595959" }} title={center?.name || "—"}>
          {center?.name || "—"}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      align: "center",
      render: (status) => {
        if (!status) return <Tag>—</Tag>;
        const key = String(status).toUpperCase();
        return (
          <Tag color={STATUS_COLORS[key] || "default"}>
            {STATUS_MAP[key] || status}
          </Tag>
        );
      },
    },
    {
      title: "Giai đoạn xe",
      dataIndex: "maintenanceStage",
      key: "maintenanceStage",
      width: 150,
      ellipsis: {
        showTitle: false,
      },
      render: (stage) => (
        <span style={{ color: "#595959" }} title={stage?.name || "-"}>
          {stage?.name || "-"}
        </span>
      ),
    },
    {
      title: "Loại dịch vụ",
      dataIndex: "type",
      key: "type",
      width: 140,
      align: "center",
      render: (service) => {
        if (!service) return <Tag>—</Tag>;
        let key = String(service).replace(/[\s-]/g, "_").toUpperCase();
        if (key === "MAINTENACE_TYPE") key = "MAINTENANCE_TYPE";
        return (
          <Tag color={SERVICE_TYPE_COLORS[key] || "default"}>
            {SERVICE_TYPE_MAP[key] || service}
          </Tag>
        );
      },
    },
    {
      title: "Ngày hẹn",
      dataIndex: "appointmentDate",
      key: "appointmentDate",
      width: 120,
      render: (date) => {
        if (!date) return <span style={{ color: "#bfbfbf" }}>—</span>;
        const d = new Date(date);
        return (
          <span style={{ color: "#595959" }}>
            {d.toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        );
      },
    },
    {
      title: "Thời gian",
      dataIndex: "slotTime",
      key: "slotTime",
      width: 120,
      align: "center",
      render: (slot) => {
        if (!slot) return <span style={{ color: "#bfbfbf" }}>-</span>;
        // Loại bỏ 'H' và tách theo dấu '_'
        const [start, end] = slot.replace("H", "").split("_");
        return (
          <span style={{ color: "#595959", fontWeight: 500 }}>
            {`${start}:00-${end}:00`}
          </span>
        );
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      width: 150,
      ellipsis: {
        showTitle: false,
      },
      render: (note) => (
        <span style={{ color: "#595959" }} title={note || "—"}>
          {note || "—"}
        </span>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Button 
          type='link' 
          onClick={() => onViewDetail(record)}
          style={{
            color: "#ff4d4f",
            fontWeight: 500,
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ff7875";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#ff4d4f";
          }}>
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ 
      backgroundColor: "#fff",
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      overflow: "hidden"
    }}>
      <Table
        columns={columns}
        dataSource={data}
        rowKey='id'
        loading={loading}
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bản ghi`,
          style: { padding: "16px" },
          showQuickJumper: true,
        }}
        bordered
        size="middle"
        scroll={{ x: 'max-content' }}
        rowClassName={(record, index) => 
          index % 2 === 0 ? "table-row-light" : "table-row-dark"
        }
      />
    </div>
  );
}
