import { useState, useEffect } from "react";
import { Table } from "antd";

export default function WarrantyContent({ booking }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const details =
      booking?.details?.length > 0
        ? booking.details
        : [
            { part: "Pin Lithium", issue: "Sụt áp nhanh", done: false },
            {
              part: "Bộ điều khiển (ECU)",
              issue: "Không khởi động",
              done: false,
            },
            { part: "Động cơ", issue: "Phát tiếng ồn lạ", done: false },
          ];
    setRows(details);
  }, [booking]);

  const columns = [
    { title: "STT", render: (_, __, i) => i + 1, width: 60 },
    { title: "Bộ phận bảo hành", dataIndex: "part" },
    { title: "Lỗi ghi nhận", dataIndex: "issue" },
  ];

  return (
    <div>
      <p className='text-sm text-gray-600 mb-3'>
        Danh sách hạng mục bảo hành cho booking <strong>{booking?.code}</strong>
      </p>
      <Table
        dataSource={rows}
        columns={columns}
        pagination={false}
        size='small'
        bordered
        rowKey={(_, i) => `w-${i}`}
      />
    </div>
  );
}
