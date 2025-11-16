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
      render: (_, __, idx) => idx + 1,
    },
    {
      title: "Mã đặt lịch",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Người đặt",
      dataIndex: "customer",
      key: "customer",
      render: (customer) => {
        if (!customer) return <Tag>—</Tag>;
        const name = [customer.firstName, customer.lastName]
          .filter(Boolean)
          .join(" ");
        return <div style={{ fontWeight: 500 }}>{name || "—"}</div>;
      },
    },

    {
      title: "Trung tâm dịch vụ",
      dataIndex: "serviceCenter",
      key: "serviceCenter",
      render: (center) => center?.name,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        console.log("STATUS VALUE:", status);
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
      render: (stage) => stage?.name || "-",
    },

    {
      title: "Loại dịch vụ",
      dataIndex: "type",
      key: "type",
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
      render: (date) => {
        if (!date) return "—";
        const d = new Date(date);
        return d.toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
    },
    {
      title: "Thời gian",
      dataIndex: "slotTime",
      key: "slotTime",
      render: (slot) => {
        if (!slot) return "-";
        // Loại bỏ 'H' và tách theo dấu '_'
        const [start, end] = slot.replace("H", "").split("_");
        return `${start}:00-${end}:00`;
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      // render: (q, record) =>
      //   q ? (
      //     <Button
      //       type='text'
      //       icon={<QrcodeOutlined />}
      //       onClick={() => onShowQR(record)}
      //       title='Mở QR check-in'
      //     />
      //   ) : (
      //     <span style={{ color: "#999" }}>—</span>
      //   ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type='link' onClick={() => onViewDetail(record)}>
            Xem chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey='id'
      loading={loading}
      pagination={{ pageSize: 10 }}
      bordered
    />
  );
}
