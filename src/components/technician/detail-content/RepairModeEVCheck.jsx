import { useState, useEffect, useCallback } from "react";
import { Table, Input, Select, Button, message, Spin, Tag } from "antd";
import {
  // Đã đổi tên để tránh nhầm lẫn và buộc gọi hàm đúng
  fetchEVCheckDetailsServiceRe as getRepairDetailsList,
  updateEVCheckDetailService,
  updateEVCheckService,
  createEVCheckDetailService,
} from "../../../services/evcheckService.js";
import { getLaborCostByRemediesService } from "../../../services/priceserviceService.js";
import { getPartItemsByModelService } from "../../../services/partitemsService.js";
import { PlusOutlined } from "@ant-design/icons";
import RMAConfirmationModal from "../../../components/service-staff/RMAConfirmationModal";

const { Option } = Select;

// Định nghĩa trạng thái sửa chữa
const REPAIR_STATUS = {
  PENDING: { label: "Đang sửa chữa", color: "processing" },
  IN_PROGRESS: { label: "Đang sửa chữa", color: "processing" },
  COMPLETED: { label: "Đã hoàn thành", color: "success" },
};

export default function RepairModeEVCheck({
  booking,
  evCheckId,
  evCheckStatus: parentEvCheckStatus,
  onRefresh,
  readOnly = false,
  forceEmpty = false,
}) {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [partOptions, setPartOptions] = useState([]);
  const [partLoading, setPartLoading] = useState(true);
  const [evCheckStatus, setEvCheckStatus] = useState(
    parentEvCheckStatus || null
  );
  const [statusChanges, setStatusChanges] = useState({});
  const [isRMAConfirmationOpen, setIsRMAConfirmationOpen] = useState(false);
  const [currentRMAParts, setCurrentRMAParts] = useState([]);

  const getModelName = () => {
    const vehicle = booking?.vehicle;
    return vehicle?.modelName || vehicle?.model?.name || "VinFast Evo200";
  };

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

  const isRMAEligible = (row) =>
    row.remedies === "REPLACE" &&
    checkWarrantyStatus(row.partItem) &&
    row.partItem;

  const openRMAForRow = (row) => {
    const oneItem = {
      id: row.id,
      PhuTungThayThe:
        row.partName || row.partItem?.part?.name || "Không rõ tên PT",
      NoiDung: row.result ?? row.remedies,
      partItem: row.partItem,
      partName: row.partName,
      quantity: row.quantity,
      unit: row.unit,
    };
    setCurrentRMAParts([oneItem]); // chỉ 1 phần tử
    setIsRMAConfirmationOpen(true);
  };
  // --- Load Part Options ---
  useEffect(() => {
    const loadParts = async () => {
      setPartLoading(true);
      try {
        const modelName = getModelName();
        const options = await getPartItemsByModelService(modelName, {
          params: { page: 1, pageSize: 500 },
        });
        console.log("DEBUG: partOptions loaded:", options);
        setPartOptions(options || []);
      } catch (err) {
        message.error("Không tải được danh sách phụ tùng!");
        setPartOptions([]);
      } finally {
        setPartLoading(false);
      }
    };
    loadParts();
  }, [booking?.vehicle]);

  const createEmptyRow = () => ({
    id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    partItemId: "",
    displayName: "",
    replacePartId: "",
    replacePartName: "",
    result: "",
    remedies: "NONE",
    pricePart: 0,
    priceService: 0,
    totalAmount: 0,
    quantity: 1,
    unit: "cái",
    isNew: true,
  });

  // --- Logic cập nhật/tính toán giá ---
  const updatePriceService = async (index, remedies) => {
    if (!["REPAIR", "REPLACE"].includes(remedies)) {
      updateRow(index, { priceService: 0 });
      return;
    }
    try {
      const cost = await getLaborCostByRemediesService(remedies);
      updateRow(index, { priceService: Number(cost || 0) });
    } catch (e) {
      updateRow(index, { priceService: 0 });
    }
  };

  const updateRow = (index, updates) => {
    setDetails((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const updated = { ...row, ...updates };
        const validPart =
          updated.remedies === "REPLACE" ? Number(updated.pricePart || 0) : 0;
        updated.totalAmount = validPart + Number(updated.priceService || 0);
        return updated;
      })
    );
  };

  // --- Load Repair Details (FIXED LOGIC) ---
  const loadRepairDetails = useCallback(async () => {
    if (!evCheckId || forceEmpty) return;
    setLoading(true);
    try {
      // Gọi service
      const res = await getRepairDetailsList(evCheckId);

      let rawDetails = [];
      let statusValue = null;

      // Trích xuất dữ liệu chi tiết từ mọi vị trí có thể
      if (Array.isArray(res?.evCheckDetails)) {
        rawDetails = res.evCheckDetails;
        statusValue = res.status || null; // Lấy status từ service
      } else if (Array.isArray(res?.rowDatas) && res.rowDatas.length > 0) {
        // Lấy status và details từ EVCheck cha (trường hợp API gọi nhầm)
        rawDetails = res.rowDatas[0].evCheckDetails || [];
        statusValue = res.rowDatas[0].status || null;
      } else if (Array.isArray(res)) {
        rawDetails = res;
      }

      // Lọc bỏ null/undefined
      rawDetails = rawDetails.filter((item) => item != null);

      console.log(
        "DEBUG: Dữ liệu thô EV Check Detail đã fetch (rawDetails):",
        rawDetails
      );

      const mapped = rawDetails.map((item) => {
        // FIXED: Extract ID từ object hoặc string
        const partItemId = item.partItem?.id || item.partItemId || "";
        const replacePartId = item.replacePart?.id || item.replacePartId || "";

        const partOption = partOptions.find((p) => p.partItemId === partItemId);
        const replaceOption = partOptions.find(
          (p) => p.partItemId === replacePartId
        );

        const dbId = item.id || item.evCheckDetailId || item.evCheckItemId;

        // Normalize status
        const currentStatus = item.status || "PENDING";
        const normalizedStatus =
          currentStatus === "INPROGRESS" ? "IN_PROGRESS" : currentStatus;

        return {
          ...item,
          partItemId: partItemId,
          displayName: partOption?.label || partItemId || "",
          replacePartId: replacePartId,
          replacePartName: replaceOption?.label || replacePartId || "",
          result: item.result ?? "",
          remedies: item.remedies || "NONE",
          pricePart: Number(item.pricePart || 0),
          priceService: Number(item.priceService || 0),
          totalAmount: Number(item.totalAmount || 0),
          quantity: Number(item.quantity || 1),
          unit: item.unit || "cái",
          status: normalizedStatus,
          isNew: false,
        };
      });

      console.log("DEBUG: Dữ liệu đã map vào state details (mapped):", mapped);

      if (mapped.length > 0) {
        setDetails(mapped); // Dùng mapped, không cần spread
        message.success(`✅ Đã tải ${mapped.length} hạng mục từ DB.`);
      } else {
        setDetails(readOnly ? [] : [createEmptyRow()]);
      }

      // Update EVCheck status
      if (statusValue) {
        setEvCheckStatus(statusValue);
      } else {
        setEvCheckStatus(parentEvCheckStatus); // Fallback về props
      }

      setStatusChanges({});
    } catch (err) {
      console.error("❌ Lỗi khi tải chi tiết EV Check:", err);
      message.error("Không thể tải dữ liệu chi tiết!");
      setDetails(readOnly ? [] : [createEmptyRow()]);
    } finally {
      setLoading(false);
    }
  }, [evCheckId, forceEmpty, partOptions, readOnly, parentEvCheckStatus]); // Thêm parentEvCheckStatus

  // --- useEffect để tải details lần đầu ---
  useEffect(() => {
    if (evCheckId && !forceEmpty && !partLoading) {
      loadRepairDetails();
    } else if (forceEmpty && details.length === 0) {
      setDetails([createEmptyRow()]);
    }
  }, [evCheckId, forceEmpty, partLoading, loadRepairDetails]); // Thêm loadRepairDetails

  // --- Biến kiểm soát trạng thái (Đã thêm) ---
  const canEditFields =
    !readOnly &&
    evCheckStatus !== "INSPECTION_COMPLETED" &&
    evCheckStatus !== "QUOTE_APPROVED";

  const isRepairMode = !readOnly && evCheckStatus === "QUOTE_APPROVED";

  const handleChange = (index, field, value) => {
    // Chỉ cho phép edit khi chưa INSPECTION_COMPLETED hoặc đang QUOTE_APPROVED nhưng chỉ edit status
    if (evCheckStatus === "INSPECTION_COMPLETED" && field !== "status") return;
    if (evCheckStatus === "QUOTE_APPROVED" && field !== "status") return;
    // Cho phép edit status khi đang ở Repair Mode
    if (!canEditFields && field !== "status") {
      // Chặn edit các field khác nếu không được phép
      return;
    }

    updateRow(index, { [field]: value });

    if (field === "remedies") {
      if (value !== "REPLACE") {
        updateRow(index, {
          pricePart: 0,
          replacePartId: "",
          replacePartName: "",
        });
      }
      updatePriceService(index, value);
    }

    // Track status changes
    if (field === "status") {
      const detailId = details[index]?.id;
      if (detailId) {
        setStatusChanges((prev) => ({ ...prev, [detailId]: value }));
      }
    }
  };

  const addExtraRow = () => setDetails((prev) => [...prev, createEmptyRow()]);

  // --- Hàm lưu (Save All) ---
  const saveAll = async () => {
    // ... (Logic saveAll giữ nguyên) ...
    const itemsToSave = details.filter((item) => item.partItemId);

    if (itemsToSave.length === 0) {
      return message.warning("Vui lòng chọn Bộ phận.");
    }
    for (const item of itemsToSave) {
      if (!item.remedies) return message.warning("Vui lòng chọn Biện pháp!");
      if (
        ["REPAIR", "REPLACE"].includes(item.remedies) &&
        !item.result?.trim()
      ) {
        return message.warning("Vui lòng nhập Kết quả!");
      }
    }
    if (!evCheckId) return message.error("Thiếu EVCheckId!");

    setLoading(true);
    try {
      for (const item of itemsToSave) {
        const payload = {
          evCheckId,
          partItemId: item.partItemId,
          result: item.result || "",
          remedies: item.remedies,
          unit: item.unit || "cái",
          quantity: Number(item.quantity || 1),
          pricePart:
            item.remedies === "REPLACE" ? Number(item.pricePart || 0) : 0,
          priceService: Number(item.priceService || 0),
          totalAmount: Number(item.totalAmount || 0),
        };

        if (item.remedies === "REPLACE" && item.replacePartId) {
          payload.replacePartId = item.replacePartId;
        }

        if (item.isNew) {
          await createEVCheckDetailService(payload);
        } else {
          await updateEVCheckDetailService(item.id, payload);
        }
      }

      await updateEVCheckService(evCheckId, { status: "INSPECTION_COMPLETED" });

      message.success("✅ Gửi báo giá thành công!");

      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log("DEBUG: Reloading EVCheck details after save...");
      await loadRepairDetails(); // Tải lại data (sẽ tự động cập nhật evCheckStatus)

      onRefresh?.();
    } catch (err) {
      console.error("❌ Lỗi lưu:", err.response?.data || err);
      message.error(err.response?.data?.message || "Lỗi khi lưu!");
    } finally {
      setLoading(false);
    }
  };

  // --- Hàm xác nhận sửa chữa (Đã thêm) ---
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

      // Tải lại để kiểm tra xem tất cả đã xong chưa
      await loadRepairDetails();

      // Kiểm tra lại state 'details' *sau khi* đã load (chờ state update)
      const currentDetails = await new Promise((resolve) => {
        setDetails((prevDetails) => {
          resolve(prevDetails);
          return prevDetails;
        });
      });

      const allCompleted = currentDetails.every(
        (d) => d.status === "COMPLETED"
      );

      if (allCompleted) {
        await updateEVCheckService(evCheckId, { status: "REPAIR_COMPLETED" });
        setEvCheckStatus("REPAIR_COMPLETED");
      }

      onRefresh?.();
    } catch (err) {
      console.error("Cập nhật trạng thái thất bại:", err);
      message.error("Không thể cập nhật trạng thái hạng mục!");
    } finally {
      setLoading(false);
      message.destroy();
    }
  };

  // --- Cấu hình cột Table ---
  const baseColumns = [
    { title: "STT", render: (_, __, i) => i + 1, width: 50 },
    {
      title: "Bộ phận",
      width: 180,
      render: (_, r, i) => (
        <Select
          showSearch
          placeholder='Chọn bộ phận'
          value={r.partItemId || undefined}
          onChange={(v) => {
            const sel = partOptions.find((p) => p.partItemId === v);
            handleChange(i, "partItemId", v);
            updateRow(i, { displayName: sel?.label || "" });
          }}
          options={partOptions}
          loading={partLoading}
          disabled={readOnly || !canEditFields}
          style={{ width: "100%" }}
          filterOption={(input, opt) =>
            opt.label.toLowerCase().includes(input.toLowerCase())
          }
        />
      ),
    },
    {
      title: "Hình ảnh",
      width: 90,
      align: "center",
      render: () => (
        <div className='w-12 h-12 bg-gray-100 rounded border border-dashed text-xs text-gray-400 flex items-center justify-center'>
          NA
        </div>
      ),
    },
    {
      title: "Kết quả",
      width: 700,
      render: (_, r, i) => (
        <Input.TextArea
          placeholder='Nhập kết quả kiểm tra...'
          value={r.result}
          onChange={(e) => handleChange(i, "result", e.target.value)}
          disabled={readOnly || !canEditFields}
          autoSize={{ minRows: 2, maxRows: 8 }}
          style={{ resize: "none", fontSize: 14 }}
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
          disabled={readOnly || !canEditFields}>
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
      width: 200,
      render: (_, r, i) => (
        <Select
          showSearch
          placeholder='Chọn phụ tùng'
          value={
            r.replacePartId
              ? { value: r.replacePartId, label: r.replacePartName || "..." }
              : undefined
          }
          labelInValue
          disabled={readOnly || !canEditFields || r.remedies !== "REPLACE"}
          loading={partLoading}
          style={{ width: "100%" }}
          onChange={(opt) => {
            if (!opt) {
              updateRow(i, {
                replacePartId: "",
                replacePartName: "",
                pricePart: 0,
              });
              return;
            }
            const selected = partOptions.find(
              (p) => p.partItemId === opt.value
            );
            updateRow(i, {
              replacePartId: opt.value,
              replacePartName: selected?.label || opt.label,
              pricePart: selected?.price || 0,
            });
          }}
          options={partOptions}
          filterOption={(input, opt) =>
            opt.label.toLowerCase().includes(input.toLowerCase())
          }
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
          disabled={readOnly || !canEditFields}
          style={{ width: 60 }}
        />
      ),
    },
    { title: "ĐV", width: 50, render: (_, r) => r.unit || "-" },
    {
      title: "Giá PT",
      width: 110,
      render: (_, r) =>
        r.remedies !== "REPLACE"
          ? "—"
          : Number(r.pricePart || 0).toLocaleString(),
    },
    {
      title: "Giá DV",
      width: 110,
      render: (_, r) => Number(r.priceService || 0).toLocaleString(),
    },
    {
      title: "Tổng",
      width: 110,
      render: (_, r) =>
        r.totalAmount ? `${Number(r.totalAmount).toLocaleString()}đ` : "-",
    },
  ];

  // Thêm cột trạng thái khi đang ở chế độ sửa chữa
  const statusColumn = {
    title: "Trạng thái",
    width: 150,
    render: (_, r, i) => (
      <Select
        value={r.status}
        onChange={(value) => handleChange(i, "status", value)}
        style={{ width: "100%" }}
        dropdownStyle={{ minWidth: 150 }}
        disabled={readOnly}>
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
    ),
  };

  // Cột RMA từng dòng (chỉ hiện khi readOnly = true)
  const rmaColumn = {
    title: "RMA",
    width: 120,
    render: (_, r) => {
      if (!readOnly) return <span className='text-gray-400'>-</span>;
      const eligible = isRMAEligible(r);
      if (!eligible) return <span className='text-gray-400'>-</span>;
      return (
        <Button
          size='small'
          type='primary'
          danger
          onClick={() => openRMAForRow(r)}>
          Tạo RMA
        </Button>
      );
    },
  };

  let columns = baseColumns;
  if (!readOnly && evCheckStatus === "REPAIR_IN_PROGRESS") {
    columns = [...columns, statusColumn];
  }
  if (readOnly) {
    columns = [...columns, rmaColumn];
  }

  return (
    <div className='space-y-4'>
      <div className='p-3 bg-yellow-50 rounded border border-yellow-300'>
        <p className='text-sm font-medium text-yellow-800'>Mô tả khách hàng:</p>
        <p className='mt-1 text-gray-700'>{booking?.note || "Chưa có mô tả"}</p>
      </div>

      {loading || partLoading ? (
        <div className='flex justify-center p-10'>
          <Spin />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={details}
          rowKey='id'
          pagination={false}
          size='small'
          bordered
        />
      )}

      {!readOnly && (
        <>
          {/* Logic hiển thị nút dựa trên evCheckStatus */}
          {!evCheckStatus || evCheckStatus === "CREATED" ? (
            <>
              <Button
                type='dashed'
                onClick={addExtraRow}
                icon={<PlusOutlined />}
                block>
                + Thêm hạng mục sửa chữa
              </Button>
              <div className='flex justify-end mt-4'>
                <Button type='primary' onClick={saveAll} loading={loading}>
                  Gửi báo giá
                </Button>
              </div>
            </>
          ) : evCheckStatus === "INSPECTION_COMPLETED" ? (
            // Đã gửi báo giá, chờ approve
            <div className='mt-4 p-4 bg-blue-50 border border-blue-300 rounded text-center'>
              <p className='text-blue-700 font-medium'>
                ✅ Đã gửi báo giá thành công. Đang chờ nhân viên dịch vụ xác
                nhận...
              </p>
            </div>
          ) : evCheckStatus === "QUOTE_APPROVED" ? (
            // Đã approve, cho phép cập nhật trạng thái sửa chữa
            <div className='flex justify-end mt-4'>
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
            </div>
          ) : evCheckStatus === "REPAIR_COMPLETED" ? (
            // Đã hoàn thành
            <div className='mt-4 p-4 bg-green-50 border border-green-300 rounded text-center'>
              <p className='text-green-700 font-medium'>
                ✅ Đã hoàn thành sửa chữa
              </p>
            </div>
          ) : null}
        </>
      )}

      {/* Modal xác nhận RMA – mỗi lần chỉ chứa 1 dòng */}
      <RMAConfirmationModal
        open={isRMAConfirmationOpen}
        onClose={() => setIsRMAConfirmationOpen(false)}
        booking={booking}
        partsForRMA={currentRMAParts}
        onRMASuccess={() => {
          const rmaDetailIds = currentRMAParts.map((p) => p.id);
          setDetails((prev) =>
            prev.filter((d) => !rmaDetailIds.includes(d.id))
          );
          message.info("Đang đồng bộ lại chi tiết EV Check...");
          loadRepairDetails();
          setIsRMAConfirmationOpen(false);
        }}
      />
    </div>
  );
}
