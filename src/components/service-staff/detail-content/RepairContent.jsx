import { useState, useEffect } from "react";
import { Table, Tag, Input, InputNumber, Button, Checkbox } from "antd";

export default function RepairContent({ booking, onUpdateItem }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const details = (booking?.details || []).map((d) => ({
      issue: d.issue ?? d.item ?? "Không xác định",
      part: d.part ?? "—",
      price: d.price ?? 0,
      note: d.note ?? "",
      done: !!d.done,
    }));
    setRows(details);
  }, [booking]);

  const handlePriceChange = (index, value) => {
    const next = [...rows];
    next[index].price = value;
    setRows(next);
    if (onUpdateItem) onUpdateItem(booking.id, index, next[index]);
  };

  const handleNoteChange = (index, value) => {
    const next = [...rows];
    next[index].note = value;
    setRows(next);
  };

  const columns = [
    { title: "STT", render: (_, __, idx) => idx + 1, width: 60 },
    {
      title: "Lỗi / Hạng mục sửa chữa",
      dataIndex: "issue",
      render: (i) => <Tag color='red'>{i}</Tag>,
    },
    { title: "Phụ tùng thay thế", dataIndex: "part" },
    {
      title: "Giá (₫)",
      dataIndex: "price",
      width: 120,
      render: (p, _, idx) => (
        <InputNumber
          min={0}
          value={p}
          onChange={(val) => handlePriceChange(idx, val)}
          className='w-full'
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        />
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      render: (n, _, idx) => (
        <Input
          value={n}
          onChange={(e) => handleNoteChange(idx, e.target.value)}
          placeholder='Nhập ghi chú...'
        />
      ),
    },
  ];

  return (
    <div>
      <p className='text-sm text-gray-600 mb-3'>
        Danh sách hạng mục sửa chữa cho booking <strong>{booking?.code}</strong>
      </p>

      <Table
        dataSource={rows}
        columns={columns}
        pagination={false}
        rowKey={(_, i) => `${booking?.id || "b"}-r-${i}`}
        size='small'
        bordered
      />
    </div>
  );
}
