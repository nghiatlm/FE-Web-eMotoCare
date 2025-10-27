import { useState, useEffect } from "react";
import { Table, Tag, Checkbox, Button } from "antd";

export default function MaintenanceContent({ booking, onUpdateItem }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    // Dữ liệu demo / hoặc từ booking.details
    const details =
      booking?.details?.length > 0
        ? booking.details
        : [
            { item: "Thay dầu động cơ", cycle: "Mỗi 1000km", done: false },
            { item: "Kiểm tra lốp", cycle: "Mỗi 2000km", done: false },
            { item: "Vệ sinh phanh", cycle: "Mỗi 3000km", done: false },
            { item: "Kiểm tra ắc quy", cycle: "Mỗi 5000km", done: false },
            { item: "Thay má phanh", cycle: "Mỗi 7000km", done: false },

            { item: "Kiểm tra hệ thống đèn", cycle: "Mỗi 1000km", done: false },
            {
              item: "Kiểm tra hệ thống điện",
              cycle: "Mỗi 2000km",
              done: false,
            },
            { item: "Vệ sinh lọc gió", cycle: "Mỗi 3000km", done: false },
            { item: "Kiểm tra hệ thống lái", cycle: "Mỗi 5000km", done: false },
            { item: "Bảo dưỡng phanh", cycle: "Mỗi 7000km", done: false },
          ];
    setRows(details);
  }, [booking]);

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
