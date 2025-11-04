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
  updateEVCheckService,
  updateEVCheckDetailService,
} from "../../services/evcheckService.js";
import { STATUS_COLORS, STATUS_MAP } from "../../utils/constants";

const { Option } = Select;

const REPAIR_STATUS = {
  PENDING: { label: "Đang sửa chữa", color: "processing" },
  IN_PROGRESS: { label: "Đang sửa chữa", color: "processing" },
  COMPLETED: { label: "Đã hoàn thành", color: "success" },
};

export default function TechnicianBookingDetailDrawer({
  booking,
  open,
  onClose,
  initialEVCheckId,
  readOnly = false, // 👈 mặc định
}) {
  const [loading, setLoading] = useState(false);
  const [km, setKm] = useState("");
  const [evCheckId, setEvCheckId] = useState(null);
  const [evCheckDetails, setEvCheckDetails] = useState([]);
  const [evCheckStatus, setEvCheckStatus] = useState(null);
  const [statusChanges, setStatusChanges] = useState({});

  const status = booking?.status?.toUpperCase();
  const hasDetails = evCheckDetails.length > 0;

  // -------- Helpers --------
  const loadEVCheckDetails = async (checkId) => {
    try {
      setLoading(true);
      const res = await fetchEVCheckDetailsService(checkId);
      let rawDetails = [];
      let odometerValue = "";
      let statusValue = null;

      if (res && Array.isArray(res.evCheckDetails)) {
        rawDetails = res.evCheckDetails;
        odometerValue = res.odometer || "";
        statusValue = res.status || null;
      } else if (Array.isArray(res)) {
        rawDetails = res;
      } else if (res?.data?.rowDatas) {
        rawDetails = res.data.rowDatas;
        odometerValue = res.data?.odometer || "";
        statusValue = res.data?.status || null;
      }

      const mapped = rawDetails.map((item) => ({
        ...item,
        result: item.result ?? "",
        remedies: item.remedies ?? item.solution ?? "",
        warranty: item.warranty ?? false,
        quantity: item.quantity ?? 1,
        unit: item.unit ?? "cái",
        partName: item.partName || item.partItem?.part?.name || "",
        pricePart: Number(item.pricePart || 0),
        priceService: Number(item.priceService || 0),
        totalAmount:
          Number(item.pricePart || 0) + Number(item.priceService || 0),
        status: item.status || "PENDING",
      }));

      setEvCheckDetails(mapped);
      setKm(odometerValue);
      if (statusValue) setEvCheckStatus(statusValue);
      setStatusChanges({});
    } catch (err) {
      console.error("Lỗi tải chi tiết EV Check:", err);
      message.error("Không thể tải chi tiết EV Check!");
      setEvCheckDetails([]);
    } finally {
      setLoading(false);
    }
  };

  // -------- Effects --------
  useEffect(() => {
    if (!open) {
      setKm("");
      setEvCheckDetails([]);
      setEvCheckId(null);
      setEvCheckStatus(null);
      setStatusChanges({});
      setLoading(false);
      return;
    }

    if (initialEVCheckId) {
      setEvCheckId(initialEVCheckId);
      loadEVCheckDetails(initialEVCheckId);
      return;
    }

    if (booking?.id) {
      setLoading(true);
      fetchEVCheckByAppointmentService(booking.id)
        .then((res) => {
          let checkId = null;
          let checkStatus = null;
          const list =
            res?.data?.rowDatas ||
            res?.rowDatas ||
            (Array.isArray(res) ? res : []);

          if (Array.isArray(list) && list.length > 0) {
            if (initialEVCheckId) {
              const found = list.find((x) => x.id === initialEVCheckId);
              if (found) {
                checkId = found.id;
                checkStatus = found.status || null;
              }
            }
            if (!checkId) {
              const latest = list[list.length - 1];
              checkId = latest?.id;
              checkStatus = latest?.status || null;
            }
          }

          if (!checkId && res?.id) {
            checkId = res.id;
            checkStatus = res.status || null;
          }

          if (checkId) {
            setEvCheckId(checkId);
            if (checkStatus) setEvCheckStatus(checkStatus);
            loadEVCheckDetails(checkId);
          } else {
            setLoading(false);
            message.info("Chưa có EV Check. Vui lòng nhập số KM để tạo.");
          }
        })
        .catch((err) => {
          console.error("Lỗi tải EV Check:", err);
          message.error("Không thể tải EV Check!");
          setLoading(false);
        });
    }
  }, [open, booking?.id, initialEVCheckId]);

  // -------- Actions --------
  const handleSendKm = async () => {
    if (!km) return message.error("Vui lòng nhập số KM!");
    const odometerNumber = Number(km);
    try {
      setLoading(true);
      message.loading("Đang cập nhật số KM...", 0);
      if (!evCheckId) {
        throw new Error(
          "EVCheck chưa được tạo. Vui lòng gán kỹ thuật viên trước!"
        );
      }

      const payload = {
        odometer: odometerNumber,
        vehicleId: booking.vehicle?.id || booking.customerVehicle?.id,
        type: booking.type,
      };

      await updateEVCheckService(evCheckId, payload);
      message.success("Cập nhật số KM thành công!");
      await loadEVCheckDetails(evCheckId);
    } catch (err) {
      console.error("Lỗi cập nhật KM:", err);
      message.error(err.message || "Không thể cập nhật số KM!");
    } finally {
      setLoading(false);
      message.destroy();
    }
  };

  const handleChange = (index, field, value) => {
    if (evCheckStatus === "WAITING_FOR_QUOTE") return;
    if (evCheckStatus === "QUOTE_APPROVED" && field !== "status") return;

    setEvCheckDetails((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const updated = { ...row };

        if (["pricePart", "priceService"].includes(field)) {
          const pricePart =
            field === "pricePart" ? Number(value) || 0 : Number(row.pricePart);
          const priceService =
            field === "priceService"
              ? Number(value) || 0
              : Number(row.priceService);
          updated.pricePart = field === "pricePart" ? pricePart : row.pricePart;
          updated.priceService =
            field === "priceService" ? priceService : row.priceService;
          updated.totalAmount = pricePart + priceService;
        } else {
          updated[field] = value;
        }
        return updated;
      })
    );

    if (field === "status") {
      const detailId = evCheckDetails[index]?.id;
      if (detailId) {
        setStatusChanges((prev) => ({ ...prev, [detailId]: value }));
      }
    }
  };

  const handleConfirmQuote = async () => {
    if (evCheckDetails.some((d) => !d.result || !d.remedies)) {
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
          remedies: item.remedies,
          warranty: item.warranty,
          partName: item.partName,
          quantity: Number(item.quantity),
          unit: item.unit,
          pricePart: Number(item.pricePart) || null,
          priceService: Number(item.priceService) || null,
          totalAmount: Number(item.totalAmount) || 0,
          status: item.status,
        };
        await updateEVCheckDetailService(item.id, payload);
      }
      await updateEVCheckService(evCheckId, { status: "WAITING_FOR_QUOTE" });
      setEvCheckStatus("WAITING_FOR_QUOTE");
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

  const handleConfirmRepair = async () => {
    if (!Object.keys(statusChanges).length) {
      return message.info("Chưa có thay đổi trạng thái nào để lưu.");
    }
    try {
      setLoading(true);
      message.loading("Đang cập nhật trạng thái hạng mục...", 0);

      for (const [detailId, newStatus] of Object.entries(statusChanges)) {
        await updateEVCheckDetailService(detailId, { status: newStatus });
      }

      message.success("Cập nhật trạng thái thành công!");
      setStatusChanges({});
      await loadEVCheckDetails(evCheckId);
      await updateEVCheckService(evCheckId, { status: "REPAIR_COMPLETED" });
    } catch (err) {
      console.error("Cập nhật trạng thái thất bại:", err);
      message.error("Không thể cập nhật trạng thái hạng mục!");
    } finally {
      setLoading(false);
      message.destroy();
    }
  };

  // -------- UI rules --------
  const canEditFields = !(
    evCheckStatus === "WAITING_FOR_QUOTE" || evCheckStatus === "QUOTE_APPROVED"
  );
  const canUpdateItemStatus = !readOnly && evCheckStatus === "QUOTE_APPROVED";

  // -------- Columns --------
  const baseColumns = [
    {
      title: "STT",
      render: (_, __, idx) => idx + 1,
      width: 50,
    },
    {
      title: "Hạng mục",
      width: 180,
      render: (_, r) => r.partItem?.part?.name || r.partName || "—",
    },
    {
      title: "Nội dung",
      width: 220,
      render: (_, r) => r.maintenanceStageDetail?.description || "—",
    },
    {
      title: "Kết quả",
      width: 150,
      render: (_, r, i) => (
        <Input
          placeholder='Nhập kết quả'
          value={r.result || ""}
          onChange={(e) => handleChange(i, "result", e.target.value)}
          disabled={!canEditFields}
        />
      ),
    },
    {
      title: "Biện pháp",
      width: 150,
      render: (_, r, i) => (
        <Select
          placeholder='Chọn biện pháp'
          value={r.remedies}
          style={{ width: 140 }}
          onChange={(v) => handleChange(i, "remedies", v)}
          disabled={!canEditFields}>
          <Option value='NONE'>Bôi trơn</Option>
          <Option value='REPLACE'>Thay thế</Option>
          <Option value='REPAIR'>Sửa chữa</Option>
          <Option value='CHECK'>Kiểm tra</Option>
        </Select>
      ),
    },
    {
      title: "Phụ tùng đề xuất",
      width: 180,
      render: (_, r, i) => (
        <Input
          placeholder='Nhập tên phụ tùng'
          value={r.partName}
          onChange={(e) => handleChange(i, "partName", e.target.value)}
          disabled={!canEditFields}
        />
      ),
    },
    {
      title: "Số lượng",
      width: 100,
      render: (_, r, i) => (
        <Input
          type='number'
          value={r.quantity}
          onChange={(e) => handleChange(i, "quantity", e.target.value)}
          disabled={!canEditFields}
        />
      ),
    },
    {
      title: "Đơn vị",
      width: 100,
      render: (_, r) => r.unit || "-",
    },
    {
      title: "Giá phụ tùng",
      width: 120,
      render: (_, r, i) => (
        <Input
          placeholder='Nhập giá tiền'
          value={r.pricePart}
          onChange={(e) => handleChange(i, "pricePart", e.target.value)}
          disabled={!canEditFields}
        />
      ),
    },
    {
      title: "Giá dịch vụ",
      width: 120,
      render: (_, r, i) => (
        <Input
          placeholder='Nhập giá tiền'
          value={r.priceService}
          onChange={(e) => handleChange(i, "priceService", e.target.value)}
          disabled={!canEditFields}
        />
      ),
    },
    {
      title: "Tổng tiền",
      width: 120,
      render: (_, r) =>
        r.totalAmount ? `${Number(r.totalAmount).toLocaleString()} đ` : "-",
    },
  ];

  const statusColumnForRepair = {
    title: "Trạng thái",
    width: 150,
    render: (_, r, i) => {
      const stat = REPAIR_STATUS[r.status] || REPAIR_STATUS.PENDING;
      return (
        <Tag
          color={stat.color}
          style={{
            fontWeight: 500,
            borderRadius: 8,
            padding: "2px 8px",
            cursor: "pointer",
          }}
          onClick={() => {
            const next = r.status === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
            handleChange(i, "status", next);
          }}>
          {stat.label}
        </Tag>
      );
    },
  };

  const columns = canUpdateItemStatus
    ? [...baseColumns, statusColumnForRepair]
    : baseColumns;

  // -------- Render --------
  if (!booking) return null;

  return (
    <Drawer
      title={
        <div className='flex justify-between items-center'>
          <span className='font-semibold text-lg text-[#c41e0e]'>
            Chi tiết lịch hẹn: {booking.code}
          </span>
        </div>
      }
      width='90%'
      open={open}
      onClose={onClose}
      bodyStyle={{ paddingBottom: 80 }}>
      {/* --- Thông tin chung --- */}
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
              className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                booking.type === "MAINTENANCE_TYPE"
                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                  : "bg-purple-100 text-purple-800 border border-purple-300"
              }`}>
              {booking.type === "MAINTENANCE_TYPE" ? "Bảo dưỡng" : booking.type}
            </span>
          </p>
        </div>
      </section>

      {/* --- Nhập KM --- */}
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
              Cập nhật KM
            </Button>
          </div>
          {!evCheckId && !loading && (
            <p className='mt-2 text-xs text-red-500'>
              Booking này chưa có EV Check ID. Vui lòng nhập KM để tạo EV Check.
            </p>
          )}
        </section>
      )}

      {/* --- Bảng EVCheck --- */}
      {(evCheckId || loading) && (
        <section className='bg-white rounded-xl shadow p-5 border border-orange-200'>
          <h3 className='font-semibold text-base mb-3 border-b pb-2 text-orange-600'>
            {evCheckStatus === "QUOTE_APPROVED"
              ? "Tiến hành sửa chữa"
              : "Kết quả kiểm tra EVCheck"}
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

              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                }}>
                {evCheckStatus !== "WAITING_FOR_QUOTE" &&
                  evCheckStatus !== "QUOTE_APPROVED" && (
                    <Button
                      type='primary'
                      onClick={handleConfirmQuote}
                      loading={loading}>
                      Xác nhận báo giá
                    </Button>
                  )}

                {/* Nút xác nhận sửa chữa: chỉ gọi updateEVCheckDetailService cho các dòng đã đổi status */}
                {evCheckStatus === "QUOTE_APPROVED" && (
                  <Button
                    type='primary'
                    onClick={handleConfirmRepair}
                    loading={loading}
                    disabled={Object.keys(statusChanges).length === 0}
                    style={{
                      backgroundColor:
                        Object.keys(statusChanges).length > 0
                          ? "#52c41a"
                          : undefined,
                      borderColor:
                        Object.keys(statusChanges).length > 0
                          ? "#52c41a"
                          : undefined,
                    }}>
                    Xác nhận sửa chữa
                  </Button>
                )}
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
