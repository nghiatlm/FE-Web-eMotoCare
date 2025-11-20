// src/components/technician/TechnicianBookingDetailDrawer.jsx
import { useState, useEffect, useMemo } from "react";
import RepairModeEVCheck from "./detail-content/RepairModeEVCheck";

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
  Image,
} from "antd";

import {
  fetchEVCheckByAppointmentService,
  fetchEVCheckDetailsService,
  updateEVCheckService,
  updateEVCheckDetailService,
} from "../../services/evcheckService.js";

import {
  getPartItemByIdService,
  getSuggestedPartItemsByEvCheckDetailId,
} from "../../services/partitemsService.js";

import { getLaborCostByRemediesService } from "../../services/priceserviceService";
import RMAConfirmationModal from "../../components/service-staff/RMAConfirmationModal";

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
  const [chassisNumber, setChassisNumber] = useState(""); // ✅ số khung cho REPAIR
  const [evCheckId, setEvCheckId] = useState(null);
  const [evCheckDetails, setEvCheckDetails] = useState([]);
  const [evCheckStatus, setEvCheckStatus] = useState(null);
  const [statusChanges, setStatusChanges] = useState({});
  const [partOptionsMap, setPartOptionsMap] = useState({});
  const [partLoading, setPartLoading] = useState(false);
  // thêm
  const [tempChassis, setTempChassis] = useState("");
  const [chassisConfirmed, setChassisConfirmed] = useState(false);

  // State cho RMA Modal
  const [isRMAConfirmationOpen, setIsRMAConfirmationOpen] = useState(false);
  const [currentRMAParts, setCurrentRMAParts] = useState([]);

  const isRepair = (booking?.type || "").toUpperCase() === "REPAIR_TYPE";
  const isMaintenance =
    (booking?.type || "").toUpperCase() === "MAINTENANCE_TYPE";

  const hasDetails = evCheckDetails.length > 0;

  // -------- Helpers --------
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

      const mapped = rawDetails.map((item) => {
        const partItemId =
          item?.replacePartId ||
          item?.replacePart?.id ||
          item?.partItem?.id ||
          null;

        const partItemName =
          item?.partItem?.part?.name ||
          item?.partName ||
          item?.maintenanceStageDetail?.part?.name ||
          "";

        const pricePart = Number(item?.partItem?.price ?? item?.pricePart ?? 0);
        const currentStatus = item.status || "PENDING";
        const normalizedStatus =
          currentStatus === "INPROGRESS" ? "IN_PROGRESS" : currentStatus;

        return {
          ...item,
          replacePart: partItemId
            ? { value: partItemId, label: partItemName || partItemId }
            : null,
          replacePartId: partItemId,
          partName: partItemName,
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
          status: normalizedStatus,
        };
      });

      setEvCheckDetails(mapped);

      // Auto set labor cost nếu chưa có
      mapped.forEach((row, idx) => {
        if (
          (!row.priceService || Number(row.priceService) === 0) &&
          row.remedies
        ) {
          updateLaborCostForRow(idx, row.remedies);
        }
      });

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

  const loadSuggestedParts = async (detailId) => {
    if (!detailId || partOptionsMap[detailId]?.length > 0) return;

    try {
      setPartLoading(true);
      const items = await getSuggestedPartItemsByEvCheckDetailId(detailId);
      const normalized = (items || []).map((p) => ({
        id: p.id || p.partItemId,
        name: p.part?.name || p.name || p.serialNumber || p.id,
        price: Number(p.price ?? p.unitPrice ?? 0),
      }));
      setPartOptionsMap((prev) => ({ ...prev, [detailId]: normalized }));
    } catch (e) {
      message.error("Không tải được danh sách phụ tùng đề xuất");
    } finally {
      setPartLoading(false);
    }
  };

  const updateLaborCostForRow = async (rowIndex, remedies) => {
    try {
      const labor = await getLaborCostByRemediesService(remedies);
      setEvCheckDetails((prev) =>
        prev.map((row, i) => {
          if (i !== rowIndex) return row;
          const priceService = Number(labor || 0);
          const pricePart = Number(row.pricePart || 0);
          const validPart = row.remedies === "REPLACE" ? pricePart : 0;
          return {
            ...row,
            priceService,
            totalAmount: validPart + priceService,
          };
        })
      );
    } catch (e) {
      console.error("updateLaborCostForRow error:", e);
    }
  };

  // --------- PHÁT HIỆN RMA (chỉ đọc) ---------
  const checkWarrantyStatus = (partItem) => {
    if (!partItem) return false;
    const start = partItem.warantyStartDate
      ? new Date(partItem.warantyStartDate)
      : null;
    const end = partItem.warantyEndDate
      ? new Date(partItem.warantyEndDate)
      : null;
    const now = new Date();
    return start && end && now >= start && now <= end;
  };

  const partsForRMA = useMemo(() => {
    if (!readOnly || !evCheckDetails.length) return [];
    return evCheckDetails
      .filter(
        (item) =>
          item.remedies === "REPLACE" &&
          checkWarrantyStatus(item.partItem) &&
          item.partItem
      )
      .map((item) => ({
        id: item.id,
        PhuTungThayThe:
          item.partName || item.partItem?.part?.name || "Không rõ tên PT",
        NoiDung: item.result ?? item.remedies,
        partItem: item.partItem,
        partName: item.partName,
        quantity: item.quantity,
        unit: item.unit,
      }));
  }, [readOnly, evCheckDetails]);

  const handleOpenRMA = () => {
    setCurrentRMAParts(partsForRMA);
    setIsRMAConfirmationOpen(true);
  };

  // -------- Effects --------
  useEffect(() => {
    if (!open) {
      setKm("");
      setChassisNumber("");
      setEvCheckDetails([]);
      setEvCheckId(null);
      setEvCheckStatus(null);
      setStatusChanges({});
      setPartOptionsMap({});
      setLoading(false);
      setIsRMAConfirmationOpen(false);
      setCurrentRMAParts([]);
      return;
    }

    // Ưu tiên evCheckId truyền từ ngoài
    if (initialEVCheckId) {
      setEvCheckId(initialEVCheckId);
      if (!isRepair) loadEVCheckDetails(initialEVCheckId); // REPAIR để component con lo
      return;
    }

    // Lấy EVCheck theo booking
    if (booking?.id) {
      setLoading(true);
      fetchEVCheckByAppointmentService(booking.id)
        .then((res) => {
          let checkId = null;
          let checkStatus = null;
          let odometer;
          let chassis;

          const list =
            res?.data?.rowDatas ||
            res?.rowDatas ||
            (Array.isArray(res) ? res : []);

          if (Array.isArray(list) && list.length > 0) {
            const latest = list[list.length - 1];
            checkId = latest?.id;
            checkStatus = latest?.status || null;
            odometer = latest?.odometer;
            chassis = latest?.chassisNumber;
          } else if (res?.id) {
            checkId = res.id;
            checkStatus = res.status || null;
            odometer = res.odometer;
            chassis = res.chassisNumber;
          }

          if (checkId) {
            setEvCheckId(checkId);
            if (checkStatus) setEvCheckStatus(checkStatus);
            if (chassis) setChassisNumber(chassis);

            if (isMaintenance) {
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
              setLoading(false); // REPAIR: bảng con sẽ xử lý
            }
          } else {
            setLoading(false);
            if (isMaintenance) {
              message.info("Chưa có EV Check. Vui lòng nhập số KM để tạo.");
            } else {
              message.info("Chưa có EVCheck. Hãy gán kỹ thuật viên trước.");
            }
          }
        })
        .catch((err) => {
          console.error("Lỗi tải EV Check:", err);
          message.error("Không thể tải EV Check!");
          setLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking?.id, initialEVCheckId, isRepair, isMaintenance]);

  // -------- Actions: cập nhật KM (Maintenance) --------
  const handleSendKm = async () => {
    if (!km && km !== 0) return message.error("Vui lòng nhập số KM!");
    const odometerNumber = Number(km);
    try {
      setLoading(true);
      message.loading("Đang cập nhật số KM...", 0);

      if (!evCheckId)
        throw new Error(
          "EVCheck chưa được tạo. Vui lòng gán kỹ thuật viên trước!"
        );

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

  // -------- Actions: cập nhật số khung (Repair) --------
  const handleSendChassis = async () => {
    if (!chassisNumber?.trim()) return message.error("Vui lòng nhập số khung!");
    if (!evCheckId)
      return message.error(
        "EVCheck chưa được tạo. Vui lòng gán kỹ thuật viên trước!"
      );

    try {
      setLoading(true);
      message.loading("Đang cập nhật số khung...", 0);
      await updateEVCheckService(evCheckId, {
        chassisNumber: chassisNumber.trim(),
        type: booking.type,
        // có thể kèm checkDate/status nếu BE yêu cầu:
        // checkDate: new Date().toISOString(),
        // status: evCheckStatus || "PENDING",
      });
      message.success("Cập nhật số khung thành công!");
    } catch (err) {
      console.error(err);
      message.error(err?.message || "Không thể cập nhật số khung!");
    } finally {
      setLoading(false);
      message.destroy();
    }
  };

  // -------- Bảng (cho Maintenance) --------
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
          updateLaborCostForRow(i, value);
          return updated;
        }

        if (field === "replacePart") {
          updated.replacePart = value;
          return updated;
        }

        updated[field] = value;
        return updated;
      })
    );

    if (field === "status") {
      const detailId = evCheckDetails[index]?.id;
      if (detailId)
        setStatusChanges((prev) => ({ ...prev, [detailId]: value }));
    }
  };

  const handleConfirmQuote = async () => {
    // if (evCheckDetails.some((d) => !d.result || !d.remedies)) {
    //   return message.warning(
    //     "Vui lòng nhập Kết quả và Biện pháp cho tất cả hạng mục!"
    //   );
    // }

    try {
      setLoading(true);
      message.loading("Đang gửi dữ liệu kiểm tra...", 0);

      for (const item of evCheckDetails) {
        const currentStatus = item.status || "PENDING";
        const normalizedStatus =
          currentStatus === "INPROGRESS" ? "IN_PROGRESS" : currentStatus;

        const replacePartIdValue =
          item.replacePartId ||
          item.replacePart?.value ||
          item.replacePart?.id ||
          null;

        const payload = {
          result: item.result ?? "",
          remedies: item.remedies ?? "",
          warranty: item.warranty,
          quantity: Number(item.quantity),
          unit: item.unit,
          pricePart: Number(item.pricePart) || null,
          priceService: Number(item.priceService) || null,
          totalAmount: Number(item.totalAmount) || 0,
          status: normalizedStatus,
        };

        if (item.remedies === "REPLACE" && replacePartIdValue) {
          payload.replacePartId = replacePartIdValue;
        }

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

  const canEditFields =
    !readOnly &&
    !(
      evCheckStatus === "QUOTE_APPROVED" ||
      evCheckStatus === "REPAIR_IN_PROGRESS"
    );

  const baseColumns = [
    { title: "STT", render: (_, __, idx) => idx + 1, width: 50 },
    {
      title: "Hạng mục",
      width: 160,
      render: (_, r) =>
        r.maintenanceStageDetail?.part?.name || r.partName || "—",
    },
    {
      title: "Hình ảnh",
      width: 90,
      align: "center",
      render: (_, r) => {
        const imageUrl = r.partItem?.part?.image || r.partItem?.image;
        if (!imageUrl) {
          return (
            <div className='w-12 h-12 flex items-center justify-center bg-gray-100 rounded border border-dashed text-xs text-gray-400'>
              NA
            </div>
          );
        }
        return (
          <Image
            src={imageUrl}
            alt='PT'
            width={48}
            height={48}
            className='object-cover rounded border border-gray-200 shadow-sm cursor-pointer'
            preview={{ src: imageUrl }}
            fallback='https://via.placeholder.com/48?text=No'
          />
        );
      },
    },
    {
      title: "Nội dung",
      width: 80,
      render: (_, r) => {
        const actionTypes = r.maintenanceStageDetail?.actionType || [];
        const types = Array.isArray(actionTypes) ? actionTypes : [actionTypes];
        const labels = types.map((type) => {
          if (type === "INSPECTION") return "KT";
          if (type === "LUBRICATION") return "BT";
          return type;
        });
        return labels.length > 0 ? labels.join("/") : "—";
      },
    },
    {
      title: "Kết quả",
      width: 700,
      render: (_, r, i) => (
        <Input.TextArea
          placeholder='Nhập kết quả kiểm tra...'
          value={r.result || ""}
          onChange={(e) => handleChange(i, "result", e.target.value)}
          disabled={!canEditFields}
          autoSize={{ minRows: 2, maxRows: 8 }}
          style={{ resize: "none", fontSize: 14, lineHeight: 1.5 }}
        />
      ),
    },
    {
      title: "Biện pháp",
      width: 110,
      render: (_, r, i) => (
        <Select
          placeholder='Chọn'
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
      title: "Bảo hành",
      width: 80,
      render: (_, r) => {
        const partItem = r.partItem;
        if (!partItem) return "Không";
        const start = partItem.warantyStartDate
          ? new Date(partItem.warantyStartDate)
          : null;
        const end = partItem.warantyEndDate
          ? new Date(partItem.warantyEndDate)
          : null;
        const now = new Date();
        if (!start || !end || now < start || now > end) return "Không";
        return "BHH";
      },
    },
    {
      title: "Phụ tùng thay thế",
      width: 180,
      render: (_, r, i) => (
        <Select
          placeholder='Chọn'
          value={r.replacePart || undefined}
          disabled={!canEditFields || r.remedies !== "REPLACE"}
          labelInValue
          loading={partLoading}
          style={{ width: "100%" }}
          onDropdownVisibleChange={(open) => open && loadSuggestedParts(r.id)}
          onChange={async (opt) => {
            const partItemId = opt?.value;
            const list = partOptionsMap[r.id] || [];
            const selected = list.find((p) => p.id === partItemId);
            const price = selected?.price || 0;

            setEvCheckDetails((prev) =>
              prev.map((row, idx) => {
                if (idx !== i) return row;
                return {
                  ...row,
                  replacePartId: partItemId,
                  replacePart: opt,
                  partName: opt?.label || "",
                  pricePart: price,
                  totalAmount:
                    (row.remedies === "REPLACE" ? price : 0) +
                    Number(row.priceService || 0),
                };
              })
            );

            if (!selected && partItemId) {
              try {
                const data = await getPartItemByIdService(partItemId);
                const apiPrice = Number(data.price || 0);
                const apiLabel =
                  data.part?.name || data.serialNumber || partItemId;

                setEvCheckDetails((prev) =>
                  prev.map((row, idx) => {
                    if (idx !== i) return row;
                    return {
                      ...row,
                      pricePart: apiPrice,
                      replacePartId: partItemId,
                      replacePart: { value: partItemId, label: apiLabel },
                      partName: apiLabel,
                      totalAmount:
                        (row.remedies === "REPLACE" ? apiPrice : 0) +
                        Number(row.priceService || 0),
                    };
                  })
                );

                setPartOptionsMap((prev) => ({
                  ...prev,
                  [r.id]: [
                    ...(prev[r.id] || []),
                    { id: partItemId, name: apiLabel, price: apiPrice },
                  ],
                }));
              } catch (e) {
                message.error("Lỗi tải phụ tùng");
              }
            }
          }}
          options={(partOptionsMap[r.id] || []).map((p) => ({
            value: p.id,
            label: p.name || p.serialNumber || p.id,
          }))}
        />
      ),
    },
    {
      title: "SL",
      width: 70,
      render: (_, r, i) => (
        <Input
          type='number'
          value={r.quantity}
          onChange={(e) => handleChange(i, "quantity", e.target.value)}
          disabled={!canEditFields}
          style={{ width: 60 }}
        />
      ),
    },
    { title: "ĐV", width: 50, render: (_, r) => r.unit || "-" },
    {
      title: "Giá PT",
      width: 110,
      render: (_, r, i) => {
        if (r.remedies !== "REPLACE")
          return <span className='text-gray-400'>—</span>;
        return (
          <Input
            value={r.pricePart}
            onChange={(e) => handleChange(i, "pricePart", e.target.value)}
            disabled={!canEditFields}
            style={{ fontSize: 12 }}
          />
        );
      },
    },
    {
      title: "Giá DV",
      width: 110,
      render: (_, r, i) => (
        <Input
          value={r.priceService}
          onChange={(e) => handleChange(i, "priceService", e.target.value)}
          disabled={!canEditFields}
          style={{ fontSize: 12 }}
        />
      ),
    },
    {
      title: "Tổng",
      width: 110,
      render: (_, r) =>
        r.totalAmount ? `${Number(r.totalAmount).toLocaleString()}đ` : "-",
    },
  ];
  const statusColumnForRepair = {
    title: "Trạng thái",
    width: 150,
    render: (_, r, i) => {
      const stat = REPAIR_STATUS[r.status] || REPAIR_STATUS.PENDING;
      return (
        <Select
          value={r.status}
          onChange={(value) => handleChange(i, "status", value)}
          style={{ width: "100%" }}
          dropdownStyle={{ minWidth: 150 }}>
          {Object.entries(REPAIR_STATUS).map(([key, { label, color }]) => (
            <Select.Option key={key} value={key}>
              <Tag
                color={color}
                style={{
                  fontWeight: 500,
                  borderRadius: 8,
                  padding: "2px 8px",
                }}>
                {label}
              </Tag>
            </Select.Option>
          ))}
        </Select>
      );
    },
  };
  // const statusColumnForRepair = {
  //   title: "Trạng thái",
  //   width: 150,
  //   render: (_, r, i) => {
  //     const stat = REPAIR_STATUS[r.status] || REPAIR_STATUS.PENDING;
  //     return (
  //       <Tag
  //         color={stat.color}
  //         style={{
  //           fontWeight: 500,
  //           borderRadius: 8,
  //           padding: "2px 8px",
  //           cursor: "pointer",
  //         }}
  //         onClick={() => {
  //           const next = r.status === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
  //           handleChange(i, "status", next);
  //         }}>
  //         {stat.label}
  //       </Tag>
  //     );
  //   },
  // };

  const columns =
    !readOnly && evCheckStatus === "REPAIR_IN_PROGRESS"
      ? [...baseColumns, statusColumnForRepair]
      : baseColumns;

  if (!booking) return null;

  return (
    <>
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
                className={`
                inline-block px-3 py-1 text-xs font-semibold rounded-full 
                ${
                  isMaintenance
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : "bg-purple-100 text-purple-800 border border-purple-300"
                }
              `}>
                {isMaintenance ? "Bảo dưỡng" : booking.type}
              </span>
            </p>
          </div>
        </section>

        {/* 🚗 Nhập KM (Maintenance) */}
        {isMaintenance && !hasDetails && (
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
                Booking này chưa có EV Check ID. Vui lòng nhập KM để tạo EV
                Check.
              </p>
            )}
          </section>
        )}

        {/* 🔧 Nhập số khung (Repair) */}
        {isRepair && !chassisConfirmed && (
          <section className='bg-white rounded-xl shadow p-5 mb-6 border border-orange-200'>
            <h3 className='font-semibold text-base mb-3 border-b pb-2 text-orange-600'>
              🔧 Nhập số khung (VIN) cho phiếu sửa chữa
            </h3>
            <div className='flex gap-3'>
              <Input
                placeholder='Nhập số khung (VD: RLHKB1650EY000123)'
                value={chassisNumber}
                onChange={(e) => setChassisNumber(e.target.value)}
                disabled={loading}
              />
              <Button
                type='primary'
                loading={loading}
                onClick={async () => {
                  await handleSendChassis();
                  if (chassisNumber && evCheckId) setChassisConfirmed(true);
                }}>
                Cập nhật số khung
              </Button>
            </div>
            {!evCheckId && !loading && (
              <p className='mt-2 text-xs text-red-500'>
                Chưa có EV Check ID. Vui lòng gán kỹ thuật viên trước.
              </p>
            )}
          </section>
        )}

        {/* NỘI DUNG CHÍNH */}
        {loading && !hasDetails && !isRepair ? (
          <div className='flex justify-center p-10'>
            <Spin />
          </div>
        ) : isRepair ? (
          <section className='bg-white rounded-xl shadow p-5 border border-orange-200'>
            <h3 className='font-semibold text-base mb-3 border-b pb-2 text-orange-600'>
              🧰 Phiếu sửa chữa
            </h3>
            {chassisConfirmed ? (
              <RepairModeEVCheck
                booking={booking}
                evCheckId={evCheckId}
                onRefresh={() => evCheckId && loadEVCheckDetails(evCheckId)}
                readOnly={readOnly}
                forceEmpty={true} // truyền prop này!
              />
            ) : (
              <div className='text-gray-500 italic'>
                Vui lòng nhập số khung và xác nhận để bắt đầu tạo hạng mục sửa
                chữa.
              </div>
            )}
          </section>
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

            {/* 🚨 Hành động RMA cho Staff (chế độ readOnly) */}
            {readOnly && partsForRMA.length > 0 && (
              <div className='mt-6 p-4 bg-red-100 border border-red-400 rounded-lg flex justify-between items-center shadow-lg'>
                <div className='flex items-center'>
                  <span className='text-2xl mr-3' role='img' aria-label='alert'>
                    ⚠️
                  </span>
                  <p className='font-semibold text-red-800'>
                    Phát hiện <b>{partsForRMA.length} phụ tùng</b> đủ điều kiện
                    <b> bảo hành hãng (RMA)</b> cần thay thế.
                  </p>
                </div>
                <Button type='primary' danger onClick={handleOpenRMA}>
                  Tạo Yêu cầu RMA
                </Button>
              </div>
            )}

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
          isMaintenance && (
            <section className='bg-white rounded-xl shadow p-5 border border-orange-200'>
              <p className='text-gray-500 italic'>
                Vui lòng nhập số KM để tạo EV Check trước khi xem chi tiết kiểm
                tra.
              </p>
            </section>
          )
        )}

        <Divider />
      </Drawer>

      {/* Modal xác nhận RMA */}
      <RMAConfirmationModal
        open={isRMAConfirmationOpen}
        onClose={() => setIsRMAConfirmationOpen(false)}
        booking={booking}
        partsForRMA={currentRMAParts}
        onRMASuccess={() => {
          const rmaDetailIds = currentRMAParts.map((p) => p.id);
          setEvCheckDetails((prev) =>
            prev.filter((d) => !rmaDetailIds.includes(d.id))
          );
          message.info("Đang đồng bộ lại chi tiết EV Check...");
          evCheckId && loadEVCheckDetails(evCheckId);
          setIsRMAConfirmationOpen(false);
        }}
      />
    </>
  );
}
