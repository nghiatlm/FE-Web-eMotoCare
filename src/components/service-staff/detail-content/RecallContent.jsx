import { useState, useEffect } from "react";
import { Table, Tag, Checkbox, Button } from "antd";

export default function RecallContent({ booking }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const details =
      booking?.details?.length > 0
        ? booking.details
        : [
            { part: "Bộ phanh trước", recallCode: "RC2025-001", done: false },
            { part: "Cáp điện động cơ", recallCode: "RC2025-002", done: false },
          ];
    setRows(details);
  }, [booking]);

  const columns = [
    { title: "STT", render: (_, __, i) => i + 1, width: 60 },
    { title: "Phụ tùng / Bộ phận", dataIndex: "part" },
    { title: "Mã chiến dịch", dataIndex: "recallCode" },
  ];

  return (
    <div>
      <p className='text-sm text-gray-600 mb-3'>
        Danh sách phụ tùng nằm trong chiến dịch triệu hồi cho booking{" "}
        <strong>{booking?.code}</strong>
      </p>
      <Table
        dataSource={rows}
        columns={columns}
        pagination={false}
        size='small'
        bordered
        rowKey={(_, i) => `r-${i}`}
      />
    </div>
  );
}
