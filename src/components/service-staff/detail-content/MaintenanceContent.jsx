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
          ];
    setRows(details);
  }, [booking]);

  const handleToggleDone = (index) => {
    const next = [...rows];
    next[index].done = !next[index].done;
    setRows(next);
    if (onUpdateItem) onUpdateItem(booking.id, index, next[index]);
  };

  const columns = [
    { title: "STT", render: (_, __, i) => i + 1, width: 60 },
    { title: "Hạng mục bảo dưỡng", dataIndex: "item", key: "item" },
    { title: "Chu kỳ", dataIndex: "cycle", key: "cycle", width: 160 },
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
