// src/components/technician/TechnicianBookingDetailDrawer.jsx
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
import {
  searchPartItemsService,
  getPartItemByIdService,
} from "../../services/partitemsService.js";

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
  readOnly = false,
}) {
  const [loading, setLoading] = useState(false);
  const [km, setKm] = useState("");
  const [evCheckId, setEvCheckId] = useState(null);
  const [evCheckDetails, setEvCheckDetails] = useState([]);
  const [evCheckStatus, setEvCheckStatus] = useState(null);
  const [statusChanges, setStatusChanges] = useState({});
  const [partOptions, setPartOptions] = useState([]);
  const [partLoading, setPartLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const status = booking?.status?.toUpperCase();
  const hasDetails = evCheckDetails.length > 0;

  // ---------- Helpers ----------
  const loadEVCheckDetails = async (checkId) => {
    try {
      setLoading(true);
      const res = await fetchEVCheckDetailsService(checkId);

      let rawDetails = [];
      let odometerValue = "";
      let statusValue = null;

      if (Array.isArray(res?.evCheckDetails)) {
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

      // B1: Lấy tất cả partItemId từ evCheckDetails (nếu có)
      // Bao gồm cả replacePartId (nếu BE trả về) và partItem.id
      const uniquePartItemIds = Array.from(
        new Set(
          rawDetails
            .map(
              (item) =>
                item?.replacePartId || // Nếu có replacePartId trực tiếp
                item?.replacePart?.id || // Hoặc từ replacePart object
                item?.partItem?.id // Hoặc từ partItem relation
            )
            .filter(Boolean)
        )
      );

      // B2: Fetch chi tiết PartItem từ API để load vào dropdown
      const partItemDetails = {};
      if (uniquePartItemIds.length > 0) {
        const results = await Promise.all(
          uniquePartItemIds.map((id) =>
            getPartItemByIdService(id)
              .then((res) => {
                const data = res?.data?.data || res?.data || res;
                return { id, data };
              })
              .catch(() => null)
          )
        );
        results.filter(Boolean).forEach(({ id, data }) => {
          partItemDetails[id] = data;
        });
      }

      // B3: Map chi tiết với thông tin từ PartItem API
      const mapped = rawDetails.map((item) => {
        // Lấy partItemId từ nhiều nguồn (ưu tiên theo thứ tự):
        // 1. replacePartId (nếu BE trả về trực tiếp)
        // 2. replacePart.id (nếu có replacePart object với id)
        // 3. partItem.id (từ relation partItem)
        const partItemId =
          item?.replacePartId || // Nếu BE trả về replacePartId trực tiếp (string/UUID)
          item?.replacePart?.id || // Nếu có replacePart object với id
          item?.partItem?.id || // Hoặc từ partItem relation
          null;
        const partItemData = partItemId ? partItemDetails[partItemId] : null;

        // Lấy thông tin từ PartItem API response
        const partItemName =
          partItemData?.part?.name ||
          partItemData?.name ||
          item?.partItem?.part?.name ||
          item?.partName ||
          "";
        const serialNumber =
          partItemData?.serialNumber || item?.partItem?.serialNumber || "";
        const displayLabel = partItemName || serialNumber || partItemId || "";

        // Giá từ PartItem API hoặc fallback
        const pricePart = Number(
          partItemData?.price ?? item?.partItem?.price ?? item?.pricePart ?? 0
        );

        // Status hợp lệ: PENDING, IN_PROGRESS, COMPLETED
        const validStatus = item.status || "PENDING";
        const normalizedStatus =
          validStatus === "INPROGRESS" ? "IN_PROGRESS" : validStatus;

        return {
          ...item,
          // ReplacePart cho Select component (value là partItemId)
          replacePart: partItemId
            ? {
                value: partItemId,
                label: displayLabel,
              }
            : null,
          replacePartId: partItemId, // ✅ ID PartItem để submit - Đảm bảo luôn có giá trị nếu có partItem
          partItemId, // Giữ lại để dùng
          partName: displayLabel, // Chỉ để hiển thị
          result: item.result ?? "",
          remedies: item.remedies ?? item.solution ?? "",
          warranty: item.warranty ?? false,
          quantity: item.quantity ?? 1,
          unit: item.unit ?? "cái",
          pricePart,
          priceService: Number(item.priceService || 0),
          totalAmount:
            (item.remedies === "REPLACE" ? pricePart : 0) +
            Number(item.priceService || 0),
          status: normalizedStatus, // ✅ Đảm bảo status hợp lệ
        };
      });

      setEvCheckDetails(mapped);

      // Seed options để dropdown hiển thị mượt từ PartItem đã fetch
      const seededOptions = Object.values(partItemDetails).map((p) => ({
        id: p.id,
        name: p.part?.name || p.name || p.serialNumber || p.id,
        price: Number(p.price || 0),
        serialNumber: p.serialNumber || "",
      }));

      // Thêm các partItem từ mapped data (nếu chưa có trong seededOptions)
      mapped
        .filter((x) => x.replacePart?.value && x.replacePart?.label)
        .forEach((x) => {
          const existing = seededOptions.find(
            (opt) => opt.id === x.replacePart.value
          );
          if (!existing) {
            seededOptions.push({
              id: x.replacePart.value,
              name: x.replacePart.label,
              price: x.pricePart ?? 0,
              serialNumber: x.partName || "",
            });
          }
        });

      setPartOptions(seededOptions);

      setKm(odometerValue ?? "");
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

  // ---------- Effects ----------
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
          let odometer = undefined;

          const list =
            res?.data?.rowDatas ||
            res?.rowDatas ||
            (Array.isArray(res) ? res : []);

          if (Array.isArray(list) && list.length > 0) {
            const latest = list[list.length - 1];
            checkId = latest?.id;
            checkStatus = latest?.status || null;
            odometer = latest?.odometer;
          } else if (res?.id) {
            checkId = res.id;
            checkStatus = res.status || null;
            odometer = res.odometer;
          }

          if (checkId) {
            setEvCheckId(checkId);
            if (checkStatus) setEvCheckStatus(checkStatus);

            if (typeof odometer === "number" ? odometer > 0 : !!odometer) {
              loadEVCheckDetails(checkId);
            } else {
              setEvCheckDetails([]);
              setLoading(false);
              message.info(
                "Chưa có chi tiết kiểm tra. Vui lòng nhập số KM để tạo/khởi động EV Check."
              );
            }
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

  // ---------- Actions ----------
  const handleSendKm = async () => {
    if (!km && km !== 0) return message.error("Vui lòng nhập số KM!");
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
      message.error(err?.message || "Không thể cập nhật số KM!");
    } finally {
      setLoading(false);
      message.destroy();
    }
  };

  const handleChange = (index, field, value) => {
    if (evCheckStatus === "INSPECTION_COMPLETED") return;
    if (evCheckStatus === "QUOTE_APPROVED" && field !== "status") return;

    setEvCheckDetails((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const updated = { ...row };

        if (["pricePart", "priceService"].includes(field)) {
          const pricePart =
            field === "pricePart"
              ? Number(value) || 0
              : Number(row.pricePart || 0);
          const priceService =
            field === "priceService"
              ? Number(value) || 0
              : Number(row.priceService || 0);
          const validPricePart = row.remedies === "REPLACE" ? pricePart : 0;

          updated.pricePart = field === "pricePart" ? pricePart : row.pricePart;
          updated.priceService = priceService;
          updated.totalAmount = validPricePart + priceService;
          return updated;
        }

        if (field === "remedies") {
          updated.remedies = value;
          if (value !== "REPLACE") updated.pricePart = 0;
          const validPricePart =
            value === "REPLACE" ? Number(updated.pricePart || 0) : 0;
          updated.totalAmount =
            validPricePart + Number(updated.priceService || 0);
          return updated;
        }

        if (field === "replacePart") {
          updated.replacePart = value; // {value,label}
          return updated;
        }

        updated[field] = value;
        return updated;
      })
    );

    if (field === "status") {
      const detailId = evCheckDetails[index]?.id;
      if (detailId) {
        setStatusChanges((prev) => ({ ...prev, [detailId]: value }));
      }
    }

    // Không cập nhật replacePart lên BE ngay khi chọn dropdown
    // Sẽ cập nhật khi submit (handleConfirmQuote)
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
        // Đảm bảo status hợp lệ (PENDING, IN_PROGRESS, COMPLETED)
        const currentStatus = item.status || "PENDING";
        const normalizedStatus =
          currentStatus === "INPROGRESS" ? "IN_PROGRESS" : currentStatus;

        // Lấy replacePartId từ item (ưu tiên replacePartId, sau đó replacePart.value)
        // replacePart.value là id PartItem được chọn từ dropdown
        const replacePartIdValue =
          item.replacePartId || // Từ state khi chọn dropdown
          item.replacePart?.value || // Từ replacePart object (value là partItemId)
          item.replacePart?.id || // Nếu replacePart có id trực tiếp
          null;

        const payload = {
          result: item.result,
          remedies: item.remedies,
          warranty: item.warranty,
          quantity: Number(item.quantity),
          unit: item.unit,
          pricePart: Number(item.pricePart) || null,
          priceService: Number(item.priceService) || null,
          totalAmount: Number(item.totalAmount) || 0,
          status: normalizedStatus, // ✅ Đảm bảo status hợp lệ
        };

        // Chỉ gửi replacePartId nếu remedies là REPLACE và có giá trị
        if (item.remedies === "REPLACE" && replacePartIdValue) {
          payload.replacePartId = replacePartIdValue;
        }

        console.log("Submitting payload:", payload); // Debug log
        console.log("Item data:", {
          replacePartId: item.replacePartId,
          replacePart: item.replacePart,
          replacePartValue: item.replacePart?.value,
          remedies: item.remedies,
          finalReplacePartId: replacePartIdValue,
        }); // Debug item data
        await updateEVCheckDetailService(item.id, payload);
      }
      await updateEVCheckService(evCheckId, { status: "INSPECTION_COMPLETED" });
      setEvCheckStatus("INSPECTION_COMPLETED");
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

  const handleSearchParts = async (keyword) => {
    const k = (keyword || "").trim();
    if (k.length < 2) return; // tránh spam BE & lỗi search rỗng
    try {
      setPartLoading(true);
      const items = await searchPartItemsService(k);
      setPartOptions(items);
    } catch (e) {
      console.error("search part-items failed", e);
      message.warning(
        "Không tìm được phụ tùng. Thử gõ cụ thể hơn hoặc nhập serial."
      );
      // giữ lại options cũ để user vẫn chọn được
    } finally {
      setPartLoading(false);
    }
  };

  // ---------- UI rules ----------
  const canEditFields =
    !readOnly &&
    !(
      evCheckStatus === "QUOTE_APPROVED" ||
      evCheckStatus === "REPAIR_IN_PROGRESS"
    );
  const canUpdateItemStatus =
    !readOnly && evCheckStatus === "REPAIR_IN_PROGRESS";

  // ---------- Columns ----------
  const baseColumns = [
    { title: "STT", render: (_, __, idx) => idx + 1, width: 50 },
    {
      title: "Hạng mục",
      width: 180,
      render: (_, r) =>
        r.maintenanceStageDetail?.part?.name || r.partName || "—",
    },
    {
      title: "Nội dung",
      width: 150,
      render: (_, r) => r.maintenanceStageDetail?.actionType || "—",
    },
    {
      title: "Kết quả",
      width: 600,
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
          style={{ width: 100 }}
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
      width: 150,
      render: (_, r, i) => (
        <Select
          showSearch
          labelInValue
          optionLabelProp='label'
          placeholder='Tìm phụ tùng...'
          value={r.replacePart || undefined} // { value: id, label: name hoặc serial }
          disabled={!canEditFields || r.remedies !== "REPLACE"}
          filterOption={false}
          onSearch={handleSearchParts}
          loading={partLoading}
          style={{ width: "80%" }}
          onChange={async (opt) => {
            const partItemId = opt?.value;
            const selectedLabel = opt?.label || "";

            // Tìm partItem trong partOptions để lấy giá
            const selectedPartItem = partOptions.find(
              (p) => p.id === partItemId
            );
            const price = selectedPartItem?.price || 0;

            // Cập nhật ngay để UI phản hồi nhanh
            setEvCheckDetails((prev) =>
              prev.map((row, idx) => {
                if (idx !== i) return row;
                const updated = { ...row };
                updated.replacePartId = partItemId;
                updated.replacePart = {
                  value: partItemId,
                  label: selectedLabel,
                };
                updated.partName = selectedLabel;
                updated.pricePart = price;

                // Tính lại totalAmount
                const validPart = updated.remedies === "REPLACE" ? price : 0;
                updated.totalAmount =
                  validPart + Number(updated.priceService || 0);

                return updated;
              })
            );

            // Nếu chưa có trong partOptions, gọi API để lấy chi tiết
            if (!selectedPartItem && partItemId) {
              try {
                const res = await getPartItemByIdService(partItemId);
                const data = res?.data?.data || res?.data || res;
                const apiPrice = Number(data.price || 0);
                const apiLabel =
                  data.part?.name ||
                  data.name ||
                  data.serialNumber ||
                  partItemId;

                // Cập nhật lại với giá từ API (giữ lại replacePartId và replacePart)
                setEvCheckDetails((prev) =>
                  prev.map((row, idx) => {
                    if (idx !== i) return row;
                    const updated = { ...row };
                    updated.pricePart = apiPrice;
                    // ✅ Giữ lại replacePartId và replacePart đã set trước đó
                    updated.replacePartId = partItemId;
                    updated.replacePart = {
                      value: partItemId,
                      label: apiLabel,
                    };
                    updated.partName = apiLabel;
                    const validPart =
                      updated.remedies === "REPLACE" ? apiPrice : 0;
                    updated.totalAmount =
                      validPart + Number(updated.priceService || 0);
                    return updated;
                  })
                );

                // Thêm vào partOptions để lần sau không cần gọi API
                setPartOptions((prev) => {
                  const exists = prev.find((p) => p.id === partItemId);
                  if (!exists) {
                    return [
                      ...prev,
                      {
                        id: partItemId,
                        name: apiLabel,
                        price: apiPrice,
                        serialNumber: data.serialNumber || "",
                      },
                    ];
                  }
                  return prev;
                });
              } catch (e) {
                console.error("Lỗi lấy PartItem:", e);
                message.error("Không lấy được chi tiết phụ tùng!");
              }
            }

            // Không cập nhật lên BE ngay khi chọn dropdown
            // Sẽ cập nhật khi submit (handleConfirmQuote) để tránh lỗi 400 do thiếu field bắt buộc
          }}
          options={partOptions.map((p) => ({
            value: p.id,
            label: p.name || p.serialNumber || p.id,
          }))}
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
    { title: "Đơn vị", width: 50, render: (_, r) => r.unit || "-" },
    {
      title: "Giá phụ tùng",
      width: 120,
      render: (_, r, i) => {
        if (r.remedies !== "REPLACE")
          return <span className='text-gray-400'>—</span>;
        return (
          <Input
            placeholder='Nhập giá tiền'
            value={r.pricePart}
            onChange={(e) => handleChange(i, "pricePart", e.target.value)}
            disabled={!canEditFields}
          />
        );
      },
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
      {/* Thông tin chung */}
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

      {/* Nhập KM */}
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

      {/* Bảng EVCheck */}
      {loading && !hasDetails ? (
        <div className='flex justify-center p-10'>
          <Spin />
        </div>
      ) : hasDetails ? (
        <section className='bg-white rounded-xl shadow p-5 border border-orange-200'>
          <h3 className='font-semibold text-base mb-3 border-b pb-2 text-orange-600'>
            {evCheckStatus === "REPAIR_IN_PROGRESS"
              ? "Tiến hành sửa chữa"
              : "Kết quả kiểm tra EVCheck"}
          </h3>

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
            {!readOnly &&
              evCheckStatus !== "INSPECTION_COMPLETED" &&
              evCheckStatus !== "REPAIR_IN_PROGRESS" && (
                <Button
                  type='primary'
                  onClick={handleConfirmQuote}
                  loading={loading}>
                  Xác nhận báo giá
                </Button>
              )}

            {!readOnly && evCheckStatus === "REPAIR_IN_PROGRESS" && (
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
        </section>
      ) : (
        <section className='bg-white rounded-xl shadow p-5 border border-orange-200'>
          <p className='text-gray-500 italic'>
            Vui lòng nhập số KM để tạo EV Check trước khi xem chi tiết kiểm tra.
          </p>
        </section>
      )}

      <Divider />
    </Drawer>
  );
}
