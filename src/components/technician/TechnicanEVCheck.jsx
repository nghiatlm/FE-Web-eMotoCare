import { useState, useEffect } from "react";
import { Drawer, Table, Input, Select, Tag, Button, message } from "antd";

const { Option } = Select;

export default function TechnicianEVCheckDrawer({
  open,
  onClose,
  plan,
  evCheckId,
}) {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (plan?.evCheckItems) {
      const mapped = plan.evCheckItems.map((item, i) => ({
        id: crypto.randomUUID(),
        ev_check_id: evCheckId || "EV-001",
        item_name: item.name || `Hạng mục ${i + 1}`,
        description: item.description || "—",
        result: item.result || "",
        solution: item.solution || "",
        warranty: item.warranty || "",
        part: item.part || "",
        price: item.price || "",
        status: item.status || "Đang kiểm tra",
      }));
      setData(mapped);
    }
  }, [plan, evCheckId]);

  const handleChange = (index, field, value) => {
    setData((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleConfirm = async () => {
    const hasEmpty = data.some((item) => !item.result);
    if (hasEmpty)
      return message.warning("Vui lòng nhập kết quả cho tất cả hạng mục!");

    const payload = data.map((d) => ({
      ev_check_id: d.ev_check_id,
      item_name: d.item_name,
      description: d.description,
      result: d.result,
      solution: d.solution,
      warranty: d.warranty,
      part: d.part,
      price: Number(d.price || 0),
      status: d.status,
    }));

    console.log("📤 Payload gửi lên BE (evcheck_detail):", payload);

    message.loading("Đang gửi dữ liệu kiểm tra...");
    setTimeout(() => {
      message.success("Đã lưu kết quả kiểm tra xe!");
      onClose?.();
    }, 1000);
  };

  const columns = [
    {
      title: "STT",
      render: (_, __, idx) => idx + 1,
      width: 60,
      align: "center",
    },
    {
      title: "Hạng mục kiểm tra",
      dataIndex: "item_name",
      key: "item_name",
      width: 180,
    },
    {
      title: "Nội dung thực hiện",
      dataIndex: "description",
      key: "description",
      width: 220,
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      key: "result",
      width: 140,
      render: (val, record, idx) => (
        <Select
          placeholder='Chọn kết quả'
          value={val}
          style={{ width: 130 }}
          onChange={(v) => handleChange(idx, "result", v)}>
          <Option value='Bình thường'>Bình thường</Option>
          <Option value='Cần thay thế'>Cần thay thế</Option>
          <Option value='Hư hỏng'>Hư hỏng</Option>
        </Select>
      ),
    },
    {
      title: "Biện pháp xử lý",
      dataIndex: "solution",
      key: "solution",
      width: 140,
      render: (val, record, idx) => (
        <Select
          placeholder='Chọn biện pháp'
          value={val}
          style={{ width: 130 }}
          onChange={(v) => handleChange(idx, "solution", v)}>
          <Option value='Không cần'>Không cần</Option>
          <Option value='Thay thế'>Thay thế</Option>
          <Option value='Sửa chữa'>Sửa chữa</Option>
        </Select>
      ),
    },
    {
      title: "Bảo hành",
      dataIndex: "warranty",
      key: "warranty",
      width: 120,
      render: (val, record, idx) => (
        <Select
          placeholder='Chọn'
          value={val}
          style={{ width: 100 }}
          onChange={(v) => handleChange(idx, "warranty", v)}>
          <Option value='Có'>Có</Option>
          <Option value='Không'>Không</Option>
        </Select>
      ),
    },
    {
      title: "Phụ tùng thay thế",
      dataIndex: "part",
      key: "part",
      width: 180,
      render: (val, record, idx) => (
        <Input
          placeholder='Tên phụ tùng'
          value={val}
          onChange={(e) => handleChange(idx, "part", e.target.value)}
        />
      ),
    },
    {
      title: "Giá (VNĐ)",
      dataIndex: "price",
      key: "price",
      width: 120,
      render: (val, record, idx) => (
        <Input
          type='number'
          placeholder='0'
          value={val}
          onChange={(e) => handleChange(idx, "price", e.target.value)}
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status, record, idx) => (
        <Tag
          color={status === "Đang kiểm tra" ? "orange" : "green"}
          onClick={() =>
            handleChange(
              idx,
              "status",
              status === "Đang kiểm tra" ? "Hoàn thành" : "Đang kiểm tra"
            )
          }
          style={{ cursor: "pointer" }}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <Drawer
      title='🧾 Bảng kiểm tra EV (Technician)'
      open={open}
      onClose={onClose}
      width={1100}>
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        bordered
        size='small'
        rowKey='id'
        scroll={{ x: 1000 }}
      />
      <div style={{ textAlign: "right", marginTop: 16 }}>
        <Button type='primary' onClick={handleConfirm}>
          Xác nhận báo giá
        </Button>
      </div>
    </Drawer>
  );
}
