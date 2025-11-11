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
      width: 70,
      render: (_, __, idx) => idx + 1,
    },
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      width: 140,
    },
    {
      title: "Người đặt",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "SĐT",
      dataIndex: "phone",
      key: "phone",
      width: 130,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => {
        if (!status) return <Tag>—</Tag>;
        const key = String(status).toLowerCase();
        return (
          <Tag color={STATUS_COLORS[key] || "default"}>
            {STATUS_MAP[key] || status}
          </Tag>
        );
      },
    },
    {
      title: "Loại xe",
      dataIndex: "vehicleType",
      key: "vehicleType",
    },
    {
      title: "Loại dịch vụ",
      dataIndex: "serviceType",
      key: "serviceType",
      width: 140,
      render: (service) => {
        if (!service) return <Tag>—</Tag>;
        const key = String(service).toLowerCase();
        return (
          <Tag color={SERVICE_TYPE_COLORS[key] || "default"}>
            {SERVICE_TYPE_MAP[key] || service}
          </Tag>
        );
      },
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      width: 170,
    },
    {
      title: "QR",
      dataIndex: "qrCode",
      key: "qrCode",
      width: 90,
      render: (q, record) =>
        q ? (
          <Button
            type='text'
            icon={<QrcodeOutlined />}
            onClick={() => onShowQR(record)}
            title='Mở QR check-in'
          />
        ) : (
          <span style={{ color: "#999" }}>—</span>
        ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 140,
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
