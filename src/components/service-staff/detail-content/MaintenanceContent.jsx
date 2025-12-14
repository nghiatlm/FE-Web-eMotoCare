import { useState, useEffect } from "react";
import { Table, Tag, Checkbox, Button } from "antd";

export default function MaintenanceContent({ booking, onUpdateItem }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
  });

  const columns = [
    { title: "STT", render: (_, __, i) => i + 1, width: 60 },
    { title: "Hạng mục bảo dưỡng", dataIndex: "item", key: "item" },
    { title: "Chu kỳ", dataIndex: "cycle", key: "cycle", width: 160 },
    {
      title: "Biện pháp",
      dataIndex: "action",
      key: "action",
      width: 120,
      render: () => "Thay thế",
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      key: "result",
      width: 120,
      render: () => "Đạt",
    },
    {
      title: "Loại bảo hành",
      dataIndex: "warrantyType",
      key: "warrantyType",
      width: 140,
      render: () => "12 tháng / 10.000 km",
    },
    { title: "Ghi chú", dataIndex: "note", key: "note" },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      render: () => "1 cái",
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      key: "unit",
      width: 100,
      render: () => "Cái",
    },
    {
      title: "Giá (₫)",
      dataIndex: "price",
      key: "price",
      width: 120,
      render: () => "200,000",
    },
    {
      title: "Phí dịch vụ",
      dataIndex: "serviceFee",
      key: "serviceFee",
      width: 140,
      render: () => "0",
    },
    {
      title: "Thành tiền (₫)",
      dataIndex: "total",
      key: "total",
      width: 140,
      render: () => "200,000",
    },
    {
      title: "Trạng thái",
      dataIndex: "done",
      key: "done",
      render: () => "Hoàn thành",
    },
  ];

  return (
    <div>
      <p className='text-sm text-gray-600 mb-3'>
        Danh sách các hạng mục bảo dưỡng cho booking{" "}
        <strong>{booking?.code}</strong>
      </p>

      <Table
        dataSource={rows}
        columns={columns}
        pagination={false}
        rowKey={(_, i) => `m-${i}`}
        size='small'
        bordered
      />
    </div>
  );
}
