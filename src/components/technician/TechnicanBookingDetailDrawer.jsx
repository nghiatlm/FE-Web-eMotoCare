import { useState, useEffect } from "react";
import {
  Drawer,
  Divider,
  Button,
  Table,
  Input,
  Select,
  Tag,
  Spin,
  message,
} from "antd";
import {
  fetchEVCheckByAppointmentService,
  fetchEVCheckDetailsService,
  createEVCheckService, // Service tạo mới (POST)
  updateEVCheckService, // Service cập nhật (PUT)
  updateEVCheckDetailService,
} from "../../services/evcheckService.js";
import { changeAppointmentStatusService } from "../../services/appointmentService";
import { STATUS_COLORS, STATUS_MAP } from "../../utils/constants";

const { Option } = Select;

export default function TechnicianBookingDetailDrawer({
  booking,
  open,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [km, setKm] = useState("");
  const [evCheckId, setEvCheckId] = useState(null);
  const [evCheckDetails, setEvCheckDetails] = useState([]);

  const status = booking?.status?.toUpperCase();

  // Biến kiểm tra xem đã có chi tiết để ẩn phần nhập KM chưa
  const hasDetails = evCheckDetails.length > 0;

  // 🟢 Tải chi tiết EVCheck (Hàm Helper) - ĐÃ FIX LOGIC TRÍCH XUẤT
  const loadEVCheckDetails = async (checkId) => {
    try {
      setLoading(true);
      const res = await fetchEVCheckDetailsService(checkId);
      console.log("fetchEVCheckDetailsService RESPONSE:", res);

      let rawDetails = [];
      let odometerValue = "";

      // res giờ là { odometer, evCheckDetails }
      if (res && Array.isArray(res.evCheckDetails)) {
        rawDetails = res.evCheckDetails;
        odometerValue = res.odometer || "";
      }
      // Fallback: nếu API vẫn trả rowDatas
      else if (Array.isArray(res)) {
        rawDetails = res;
      }
      // Fallback: nếu API trả { data: { rowDatas } }
      else if (res?.data?.rowDatas) {
        rawDetails = res.data.rowDatas;
      }

      console.log("Extracted rawDetails:", rawDetails);
      console.log("Odometer:", odometerValue);

      const mappedDetails = rawDetails.map((item) => ({
        ...item,
        result: item.result || undefined,
        solution: item.remedies || undefined,
        warranty: item.warranty || undefined,
        quantity: item.quantity || 1,
        unit: item.unit || "cái",
      }));

      setEvCheckDetails(mappedDetails);
      setKm(odometerValue);
    } catch (err) {
      console.error("Lỗi tải chi tiết EV Check:", err);
      message.error("Không thể tải chi tiết EV Check!");
      setEvCheckDetails([]);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Load EVCheck theo appointment (Lấy ID)
  useEffect(() => {
    if (open && booking?.id) {
      setLoading(true);
      setEvCheckId(null);
      setEvCheckDetails([]);
      setKm("");

      fetchEVCheckByAppointmentService(booking.id)
        .then((res) => {
          // Hỗ trợ trích xuất ID từ response của List API
          const checkId = res?.id || res?.data?.rowDatas?.[0]?.id;
          if (checkId) {
            setEvCheckId(checkId);
            loadEVCheckDetails(checkId);
          } else {
            setLoading(false);
            message.warning("Lịch hẹn chưa có EV Check. Vui lòng nhập số KM.");
          }
        })
        .catch((err) => {
          console.error("❌ Lỗi tải EV Check:", err);
          message.error("Không thể tải EV Check ban đầu!");
          setLoading(false);
        });
    }
    if (!open) {
      setKm("");
      setEvCheckDetails([]);
      setEvCheckId(null);
    }
  }, [open, booking?.id]);

  // 🟢 Cập nhật số KM (Tạo mới nếu chưa có, cập nhật nếu đã có) - ĐÃ FIX LOGIC SERVICE
  const handleSendKm = async () => {
    if (!km) return message.error("Vui lòng nhập số KM!");
    const odometerNumber = Number(km);

    try {
      setLoading(true);
      message.loading("Đang xử lý EVCheck...", 0);
      let currentCheckId = evCheckId;
      let res;

      if (!currentCheckId) {
        // 1. TẠO MỚI EVCHECK
        const createPayload = {
          appointmentId: booking.id,
          odometer: odometerNumber,

          // Gửi các trường cần thiết cho BE sinh Stage
          vehicleId: booking.vehicle?.id || booking.customerVehicle?.id,
          type: booking.type,
          totalAmout: 0,
          status: "PENDING",
        };

        // ✅ FIX: DÙNG createEVCheckService (POST)
        res = await createEVCheckService(createPayload);
        currentCheckId = res?.id || res?.data?.id;

        if (!currentCheckId) {
          throw new Error("Tạo EVCheck thất bại, không nhận được ID mới!");
        }
        setEvCheckId(currentCheckId);
        message.success("Tạo EV Check thành công!");
      } else {
        // 2. CẬP NHẬT
        // ✅ FIX: THÊM type và vehicleId để tránh lỗi 404 Stage not found
        const payload = {
          odometer: odometerNumber,
          vehicleId: booking.vehicle?.id || booking.customerVehicle?.id,
          type: booking.type,
        };
        res = await updateEVCheckService(currentCheckId, payload);
        message.success("Cập nhật số KM thành công!");
      }

      // 3. Tải chi tiết và hiển thị bảng
      await loadEVCheckDetails(currentCheckId);
    } catch (err) {
      console.error("❌ Lỗi xử lý EVCheck:", err);
      message.error(err.message || "Lỗi khi xử lý EVCheck!");
    } finally {
      setLoading(false);
      message.destroy();
    }
  };

  // 🟢 Cập nhật tạm trong state (Giữ nguyên)
  const handleChange = (index, field, value) => {
    setEvCheckDetails((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        const updatedRow = { ...row };

        // ⚙️ Nếu là giá tiền → ép kiểu số
        if (["pricePart", "priceService", "totalAmount"].includes(field)) {
          updatedRow[field] = Number(value) || 0;

          // ✅ Tự tính lại tổng nếu là pricePart hoặc priceService
          const pricePart =
            field === "pricePart"
              ? Number(value) || 0
              : Number(row.pricePart) || 0;
          const priceService =
            field === "priceService"
              ? Number(value) || 0
              : Number(row.priceService) || 0;

          updatedRow.totalAmount = pricePart + priceService;
        } else {
          // 🟢 Các field khác (ví dụ result) giữ nguyên chuỗi
          updatedRow[field] = value;
        }

        return updatedRow;
      })
    );
  };

  // 🟢 Xác nhận báo giá (Giữ nguyên)
  const handleConfirm = async () => {
    if (evCheckDetails.some((d) => !d.result || !d.solution)) {
      return message.warning(
        "Vui lòng nhập Kết quả và Biện pháp cho tất cả hạng mục!"
      );
    }

    try {
      setLoading(true);
      message.loading("Đang gửi dữ liệu kiểm tra...", 0);

      for (const item of evCheckDetails) {
        const payload = {
          result: item.result,
          remedies: item.solution, // BE nhận remedies
          warranty: item.warranty,
          partName: item.partName,
          quantity: Number(item.quantity),
          unit: item.unit,
          pricePart: Number(item.pricePart) || null,
          priceService: Number(item.priceService) || null,
          totalAmount:
            (Number(item.pricePart) || 0) + (Number(item.priceService) || 0),
          status: item.status,
        };

        console.log("PUT /evcheck-details/", item.id, payload);
        await updateEVCheckDetailService(item.id, payload);
      }

      await changeAppointmentStatusService(booking.id, "WAITING_FOR_QUOTE");
      message.success("Xác nhận báo giá thành công!");
      onClose?.();
    } catch (err) {
      console.error("Lỗi xác nhận báo giá:", err);
      message.error("Lỗi khi gửi dữ liệu!");
    } finally {
      setLoading(false);
      message.destroy();
    }
  };
  // 🧱 Cấu hình bảng - ĐÃ FIX ÁNH XẠ DỮ LIỆU LỒNG SÂU
  const columns = [
    { title: "STT", render: (_, __, idx) => idx + 1, width: 50 },

    // ✅ Hạng mục: Lấy từ maintenanceStageDetail.part.name
    {
      title: "Hạng mục",
      width: 180,
      render: (_, record) => {
        const detail = record.partItem || {};
        return detail?.part?.name;
      },
    },

    // ✅ Nội dung: Lấy từ maintenanceStageDetail.description
    {
      title: "Nội dung",
      dataIndex: "maintenanceStageDetail",
      width: 220,
      render: (detail) => detail?.description || "—",
    },

    {
      title: "Kết quả",
      dataIndex: "result",
      width: 150,
      render: (_, record, idx) => (
        <Input
          placeholder='Nhập kết quả'
          value={record.result || ""}
          onChange={(e) => handleChange(idx, "result", e.target.value)}
        />
      ),
    },
    {
      title: "Biện pháp",
      dataIndex: "actionType", // Dùng 'solution' để mapping trong state
      width: 150,
      render: (val, _, idx) => (
        <Select
          placeholder='Chọn biện pháp'
          value={val}
          style={{ width: 130 }}
          onChange={(v) => handleChange(idx, "actionType", v)}>
          <Option value='NONE'>Bôi Trơn</Option>
          <Option value='REPLACE'>Thay Thế </Option>
          <Option value='REPAIR'>Sửa chữa</Option>
          <Option value='CHECK'>Kiểm Tra</Option>
        </Select>
      ),
    },

    // ✅ Phụ tùng: Lấy từ partItem.part.name (dùng để hiển thị mặc định)
    {
      title: "Phụ tùng dề xuất",
      dataIndex: "replacePart",
      width: 150,
      render: (_, record, idx) => (
        <Input
          placeholder='Nhập tên phụ tùng'
          onChange={(e) => handleChange(idx, e.target.value)}
          // Gợi ý: hiển thị tên phụ tùng mặc định nếu có

          style={{ width: "100%" }}
        />
      ),
    },

    {
      title: "Số lượng",
      dataIndex: "quantity",
      width: 100,
      render: (val, _, idx) => (
        <Input
          type='number'
          value={val}
          onChange={(e) => handleChange(idx, "quantity", e.target.value)}
        />
      ),
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      width: 100,
      render: (val) => (
        <span style={{ color: "#555", textAlign: "center", display: "block" }}>
          {val || "-"}
        </span>
      ),
    },
    {
      title: "Giá phụ tùng",
      dataIndex: "pricePart",
      width: 100,
      render: (val, _, idx) => (
        <Input
          placeholder='Nhập giá tiền'
          value={val}
          onChange={(e) => handleChange(idx, "pricePart", e.target.value)}
        />
      ),
    },
    {
      title: "Giá dịch vụ",
      dataIndex: "priceService",
      width: 100,
      render: (val, _, idx) => (
        <Input
          placeholder='Nhập giá tiền'
          value={val}
          onChange={(e) => handleChange(idx, "priceService", e.target.value)}
        />
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      width: 100,
      render: (val) => <span>{val ? val.toLocaleString() + " đ" : "-"}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 150,
      render: (status, record, idx) => {
        const color = STATUS_COLORS[status] || "default";
        return (
          <Tag
            color={color}
            style={{
              fontWeight: 500,
              borderRadius: 8,
              padding: "2px 8px",
              cursor: "pointer",
            }}
            onClick={() => {
              // Ví dụ toggle đơn giản
              const nextStatus =
                status === "IN_PROGRESS" ? "COMPLETED" : "IN_PROGRESS";
              handleChange(idx, "status", nextStatus);
            }}>
            {STATUS_MAP[status] || status || "Không rõ"}
          </Tag>
        );
      },
    },
  ];

  if (!booking) return null;

  return (
    <Drawer
      title={
        <div className='flex justify-between items-center'>
          <span className='font-semibold text-lg text-[#c41e0e]'>
            Chi tiết khách hàng: {booking.code}
          </span>
          <Tag color={STATUS_COLORS[status]}>
            {STATUS_MAP[status] || status}
          </Tag>
        </div>
      }
      width='90%'
      open={open}
      onClose={onClose}
      bodyStyle={{ paddingBottom: 80 }}>
      {/* 🧾 Thông tin chung (GIỮ NGUYÊN) */}
      <section className='bg-white rounded-xl shadow p-5 mb-6 border border-orange-200'>
        <h3 className='font-semibold text-base mb-3 border-b pb-2 text-orange-600'>
          🧾 Thông tin chung
        </h3>
        <div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700'>
          <p>
            <strong>Mã lịch hẹn:</strong> {booking.code || "—"}
          </p>
          <p>
            <strong>Khách hàng:</strong> {booking.customer?.firstName}{" "}
            {booking.customer?.lastName}
          </p>
          <p>
            <strong>Ngày hẹn:</strong>{" "}
            {new Date(booking.appointmentDate).toLocaleDateString("vi-VN")}
          </p>
          <p>
            <strong>Loại dịch vụ:</strong>{" "}
            <span
              className={`
                        inline-block px-3 py-1 text-xs font-semibold rounded-full 
                        ${
                          booking.type === "MAINTENACE_TYPE"
                            ? "bg-blue-100 text-blue-800 border border-blue-300" // Màu xanh cho Bảo dưỡng
                            : "bg-purple-100 text-purple-800 border border-purple-300" // Màu tím cho các loại khác
                        }
                    `}>
              {booking.type === "MAINTENACE_TYPE" ? "Bảo dưỡng" : booking.type}
            </span>
          </p>
        </div>
      </section>

      {/* 🚗 Nhập KM (ẨN KHI ĐÃ CÓ CHI TIẾT) */}
      {!hasDetails && (
        <section className='bg-white rounded-xl shadow p-5 mb-6 border border-orange-200'>
          <h3 className='font-semibold text-base mb-3 border-b pb-2 text-orange-600'>
            🚗 Cập nhật số km xe đã đi
          </h3>
          <div className='flex gap-3'>
            <Input
              type='number'
              placeholder='Nhập số km'
              value={km}
              onChange={(e) => setKm(e.target.value)}
              disabled={loading}
            />
            <Button type='primary' loading={loading} onClick={handleSendKm}>
              {evCheckId ? "Cập nhật KM" : "Tạo EV Check"}
            </Button>
          </div>
          {!evCheckId && !loading && (
            <p className='mt-2 text-xs text-red-500'>
              Booking này chưa có EV Check ID. Vui lòng nhập KM để **Tạo mới**.
            </p>
          )}
        </section>
      )}

      {/* 📋 EVCheck Details (HIỆN KHI CÓ ID HOẶC ĐANG LOAD) */}
      {(evCheckId || loading) && (
        <section className='bg-white rounded-xl shadow p-5 border border-orange-200'>
          <h3 className='font-semibold text-base mb-3 border-b pb-2 text-orange-600'>
            📋 Kết quả kiểm tra EVCheck
          </h3>
          {loading && evCheckDetails.length === 0 ? (
            <div className='flex justify-center p-10'>
              <Spin />
            </div>
          ) : evCheckDetails.length > 0 ? (
            <>
              <Table
                columns={columns}
                dataSource={evCheckDetails}
                rowKey='id'
                pagination={false}
                size='small'
                bordered
              />
              <div style={{ textAlign: "right", marginTop: 16 }}>
                <Button
                  type='primary'
                  onClick={handleConfirm}
                  disabled={loading}>
                  Xác nhận báo giá
                </Button>
              </div>
            </>
          ) : (
            <p className='text-gray-500 italic'>
              {evCheckId
                ? "EV Check chưa có chi tiết hạng mục nào. Vui lòng kiểm tra cấu hình Stage!"
                : "Vui lòng cập nhật KM để tạo EV Check."}
            </p>
          )}
        </section>
      )}

      <Divider />
    </Drawer>
  );
}
