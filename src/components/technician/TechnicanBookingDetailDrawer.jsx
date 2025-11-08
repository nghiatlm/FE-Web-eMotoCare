import {
  Drawer,
  Divider,
  Button,
  message,
  Table,
  Tag,
  Select,
  Input,
} from "antd";
import { useState } from "react";
const { Option } = Select;

export default function TechnicanBookingDetailDrawer({
  booking,
  open,
  onClose,
}) {
  const [km, setKm] = useState("");
  const [evCheckData, setEvCheckData] = useState(null);

  if (!booking) return null;
  const customer = booking.customer || {};

  const handleSendKm = async () => {
    if (!km) {
      message.warning("Vui lòng nhập số km trước khi gửi!");
      return;
    }

    message.loading("Đang xử lý dữ liệu...", 1);

    setTimeout(() => {
      const fakeResponse = {
        id: "EVCHK-20251022-001",
        check_date: new Date().toISOString(),
        status: "IN_PROGRESS",
        details: [
          {
            id: 1,
            item_name: "Ắc quy xe",
            description: "Kiểm tra điện áp và dung lượng pin",
            result: "",
            solution: "",
            warranty: "",
            part_name: "",
            price: "",
            status: "Đang kiểm tra",
          },
          {
            id: 2,
            item_name: "Lốp trước",
            description: "Kiểm tra độ mòn, áp suất và vết nứt",
            result: "",
            solution: "",
            warranty: "",
            part_name: "",
            price: "",
            status: "Đang kiểm tra",
          },
          {
            id: 3,
            item_name: "Phanh sau",
            description: "Kiểm tra má phanh và dầu phanh",
            result: "",
            solution: "",
            warranty: "",
            part_name: "",
            price: "",
            status: "Đang kiểm tra",
          },
        ],
      };
      setEvCheckData(fakeResponse);
      message.success("Tạo EVCheck thành công (fake data)!");
    }, 800);
  };

  const handleChange = (index, field, value) => {
    setEvCheckData((prev) => {
      const newDetails = prev.details.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return { ...prev, details: newDetails };
    });
  };

  const handleConfirm = () => {
    console.log("📤 Dữ liệu EVCheck gửi lên BE:", evCheckData);
    message.success("Đã xác nhận báo giá (mock API)");
  };

  const columns = [
    {
      title: "STT",
      render: (_, __, idx) => idx + 1,
      width: 60,
    },
    {
      title: "Hạng mục",
      dataIndex: "item_name",
      width: 160,
    },
    {
      title: "Nội dung kiểm tra",
      dataIndex: "description",
      width: 220,
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      render: (val, record, idx) => (
        <Input
          placeholder='Nhập kết quả kiểm tra'
          value={val}
          onChange={(e) => handleChange(idx, "result", e.target.value)}
        />
      ),
    },

    {
      title: "Biện pháp",
      dataIndex: "solution",
      render: (val, record, idx) => (
        <Select
          placeholder='Biện pháp'
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
      render: (val, record, idx) => (
        <Select
          placeholder='Bảo hành'
          value={val}
          style={{ width: 110 }}
          onChange={(v) => handleChange(idx, "warranty", v)}>
          <Option value='Có'>Có</Option>
          <Option value='Không'>Không</Option>
        </Select>
      ),
    },
    {
      title: "Phụ tùng",
      dataIndex: "part_name",
      render: (val, record, idx) => (
        <Input
          placeholder='Nhập phụ tùng'
          value={val}
          onChange={(e) => handleChange(idx, "part_name", e.target.value)}
        />
      ),
    },
    {
      title: "Giá phụ tùng ",
      dataIndex: "price",
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
      title: "Giá dịch vụ",
      dataIndex: "price",
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
      render: (status, record, idx) => (
        <Tag
          color={status === "Đang kiểm tra" ? "orange" : "green"}
          onClick={() =>
            handleChange(
              idx,
              "status",
              status === "Đang kiểm tra" ? "Hoàn thành" : "Đang kiểm tra"
            )
          }>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <Drawer
      title={`Chi tiết khách hàng: ${booking.code}`}
      width='100%'
      open={open}
      onClose={onClose}
      bodyStyle={{
        background: "#fff7f3",
        paddingBottom: 80,
        borderRadius: "12px",
      }}>
      {/* Thông tin khách hàng */}
      <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border border-[#ffd9c2]'>
        <h3 className='font-semibold text-base mb-3 border-b pb-2 text-[#d4380d]'>
          🧾 Thông tin chung
        </h3>
        <div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700'>
          <p>
            <strong>Mã lịch hẹn:</strong> {booking.code || "—"}
          </p>
          <p>
            <strong>Người đặt:</strong> {booking.customer?.firstName}{" "}
            {booking.customer?.lastName}
          </p>
          <p>
            <strong>Ngày hẹn:</strong>{" "}
            {new Date(booking.appointmentDate).toLocaleDateString("vi-VN")}
          </p>
          <p>
            <strong>Loại dịch vụ:</strong> {booking.type}
          </p>
        </div>
      </section>

      {/* Nhập số km */}
      <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border border-[#ffd9c2]'>
        <h3 className='font-semibold text-base mb-3 border-b pb-2 text-[#d4380d]'>
          🚗 Nhập số km xe đã đi
        </h3>
        <div className='flex gap-3'>
          <input
            type='number'
            placeholder='Nhập số km'
            value={km}
            onChange={(e) => setKm(e.target.value)}
            className='border border-gray-300 rounded px-3 py-2 flex-1'
          />
          <Button type='primary' onClick={handleSendKm}>
            Gửi
          </Button>
        </div>
      </section>

      {/* Nội dung công việc */}
      <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border border-[#ffd9c2]'>
        <h3 className='font-semibold text-base mb-3 border-b pb-2 text-[#d4380d]'>
          📋 Nội dung công việc
        </h3>

        {evCheckData ? (
          <>
            <div className='mb-3 text-sm text-gray-700'>
              <p>
                <strong>ID EVCheck:</strong> {evCheckData.id}
              </p>
              <p>
                <strong>Ngày kiểm tra:</strong>{" "}
                {new Date(evCheckData.check_date).toLocaleDateString("vi-VN")}
              </p>
            </div>

            <Table
              columns={columns}
              dataSource={evCheckData.details}
              rowKey='id'
              size='small'
              bordered
              pagination={false}
            />

            <div style={{ textAlign: "right", marginTop: 16 }}>
              <Button type='primary' onClick={handleConfirm}>
                Xác nhận báo giá
              </Button>
            </div>
          </>
        ) : (
          <div className='text-gray-500 italic'>
            Nhập số km để bắt đầu kiểm tra EVCheck.
          </div>
        )}
      </section>

      <Divider />
    </Drawer>
  );
}
