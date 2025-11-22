// src/components/technician/detail-content/RepairModeEVCheck.jsx
import { useState, useEffect, useMemo } from "react";
import { Table, Input, Select, Button, message, Spin } from "antd";
import {
  fetchEVCheckDetailsService,
  updateEVCheckDetailService,
  updateEVCheckService,
  createEVCheckDetailService,
} from "../../../services/evcheckService.js";
import { getLaborCostByRemediesService } from "../../../services/priceserviceService.js";
import { PlusOutlined } from "@ant-design/icons";
import RMAConfirmationModal from "../../../components/service-staff/RMAConfirmationModal";

const { Option } = Select;

export default function RepairModeEVCheck({
  booking,
  evCheckId,
  onRefresh,
  readOnly = false,
  forceEmpty = false, // thêm prop
}) {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState({});
  const [isRMAConfirmationOpen, setIsRMAConfirmationOpen] = useState(false);
  const [currentRMAParts, setCurrentRMAParts] = useState([]);

  // Load chi tiết khi có evCheckId
  useEffect(() => {
    if (evCheckId && details.length === 0) {
      loadRepairDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evCheckId, forceEmpty]);

  const loadRepairDetails = async () => {
    if (!evCheckId) return;
    setLoading(true);
    try {
      const res = await fetchEVCheckDetailsService(evCheckId);
      const mapped = (
        res?.evCheckDetails ||
        res?.data?.rowDatas ||
        (Array.isArray(res) ? res : [])
      ).map((item) => ({
        ...item,
        partName:
          item.partName || item.maintenanceStageDetail?.part?.name || "",
        result: item.result ?? "",
        remedies: item.remedies ?? "REPAIR",
        pricePart: Number(item.pricePart || 0),
        priceService: Number(item.priceService || 0),
        totalAmount: Number(item.totalAmount || 0),
        quantity: item.quantity || 1,
        unit: item.unit || "cái",
        isNew: false,
      }));
      setDetails(mapped.length > 0 ? mapped : []); // KHÔNG tự tạo dòng trống
    } catch (err) {
      console.error(err);
      setDetails([]); // KHÔNG tự tạo dòng trống
    } finally {
      setLoading(false);
    }
  };

  const createEmptyRow = () => ({
    id: `temp_${Date.now()}`,
    partName: "",
    result: "",
    remedies: "REPAIR",
    pricePart: 0,
    priceService: 0,
    totalAmount: 0,
    quantity: 1,
    unit: "cái",
    isNew: true,
  });

  const updatePriceService = async (index, remedies) => {
    if (!["REPAIR", "REPLACE"].includes(remedies)) {
      updateRow(index, { priceService: 0 });
      return;
    }

    setPriceLoading((prev) => ({ ...prev, [index]: true }));
    try {
      const cost = await getLaborCostByRemediesService(remedies);
      updateRow(index, { priceService: Number(cost || 0) });
    } finally {
      setPriceLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const updateRow = (index, updates) => {
    setDetails((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const updated = { ...row, ...updates };
        const validPart =
          (updated.remedies || row.remedies) === "REPLACE"
            ? Number(updated.pricePart ?? row.pricePart ?? 0)
            : 0;
        const priceService = Number(
          updated.priceService ?? row.priceService ?? 0
        );
        updated.totalAmount = validPart + priceService;
        return updated;
      })
    );
  };

  const handleChange = (index, field, value) => {
    updateRow(index, { [field]: value });

    if (field === "remedies") {
      updatePriceService(index, value);
      if (value !== "REPLACE") {
        updateRow(index, { pricePart: 0 });
      }
    }
  };

  const addExtraRow = () => {
    setDetails((prev) => [...prev, createEmptyRow()]);
  };

  const saveAll = async () => {
    if (details.some((d) => !d.partName || !d.result || !d.remedies)) {
      return message.warning(
        "Vui lòng nhập đầy đủ Bộ phận, Kết quả, Biện pháp!"
      );
    }

    if (!evCheckId) {
      return message.error("Thiếu EVCheckId. Hãy gán kỹ thuật viên trước.");
    }

    setLoading(true);
    try {
      for (const item of details) {
        const payload = {
          evCheckId,
          partName: item.partName,
          result: item.result,
          remedies: item.remedies,
          unit: item.unit,
          quantity: Number(item.quantity || 1),
          pricePart:
            item.remedies === "REPLACE" ? Number(item.pricePart || 0) : 0,
          priceService: Number(item.priceService || 0),
          totalAmount: Number(item.totalAmount || 0),
        };

        if (item.isNew) {
          // Tạo EVCheckDetail
          await createEVCheckDetailService(payload);
        } else {
          // Cập nhật EVCheckDetail
          await updateEVCheckDetailService(item.id, payload);
        }
      }

      // Chốt báo giá cho phiếu sửa chữa
      await updateEVCheckService(evCheckId, { status: "INSPECTION_COMPLETED" });

      message.success("Gửi báo giá thành công!");
      onRefresh?.();
      await loadRepairDetails();
    } catch (err) {
      console.error(err);
      message.error(err?.message || "Lỗi khi lưu!");
    } finally {
      setLoading(false);
    }
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

  const partsForRMA = useMemo(() => {
    if (!readOnly || !details.length) return [];
    return details
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
  }, [readOnly, details]);

  const handleOpenRMA = () => {
    setCurrentRMAParts(partsForRMA);
    setIsRMAConfirmationOpen(true);
  };

  const columns = [
    { title: "STT", render: (_, __, i) => i + 1, width: 50 },
    {
      title: "Bộ phận",
      width: 80,
      render: (_, r, i) => (
        <Select
          value={r.partName}
          onChange={(v) => handleChange(i, "partName", v)}
          style={{ width: "100%" }}
          disabled={readOnly}>
          <Option value='TAY_PHANH_SAU'>Tay phanh sau</Option>
          <Option value='VANH_TRUOC'>Vành trước</Option>
          <Option value='DONG_CO'>Động cơ</Option>
        </Select>
      ),
    },
    { title: "Hình ảnh " },
    {
      title: "Kết quả",
      width: 200,
      render: (_, r, i) => (
        <Input.TextArea
          placeholder='Mô tả hư hỏng...'
          value={r.result}
          onChange={(e) => handleChange(i, "result", e.target.value)}
          autoSize={{ minRows: 1 }}
          disabled={readOnly}
        />
      ),
    },
    {
      title: "Biện pháp",
      width: 120,
      render: (_, r, i) => (
        <Select
          value={r.remedies}
          onChange={(v) => handleChange(i, "remedies", v)}
          style={{ width: "100%" }}
          disabled={readOnly}>
          <Option value='REPAIR'>Sửa chữa</Option>
          <Option value='REPLACE'>Thay thế</Option>
          <Option value='CHECK'>Kiểm tra</Option>
        </Select>
      ),
    },
    {
      title: "Phụ tùng thay thế",
      width: 120,
      render: (_, r, i) => (
        <Select
          value={r.replacePart || undefined}
          onChange={(v) => handleChange(i, "replacePart", v)}
          style={{ width: "100%" }}
          disabled={readOnly || r.remedies !== "REPLACE"}>
          <Option value='TAY_PHANH_SAU'>Tay phanh sau</Option>
          <Option value='VANH_TRUOC'>Vành trước</Option>
          <Option value='DONG_CO'>Động cơ</Option>
        </Select>
      ),
    },
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
            style={{ fontSize: 12 }}
            disabled={readOnly}
          />
        );
      },
    },
    {
      title: "Giá DV",
      width: 50,
      render: (_, r, i) => (
        <div className='flex items-center gap-1'>
          {priceLoading[i] && <Spin size='small' />}
          <Input value={r.priceService} disabled style={{ fontSize: 12 }} />
        </div>
      ),
    },
    { title: "ĐV", width: 50, render: (_, r) => r.unit || "-" },
    {
      title: "SL",
      width: 70,
      render: (_, r, i) => (
        <Input
          type='number'
          value={r.quantity}
          onChange={(e) => handleChange(i, "quantity", e.target.value)}
          style={{ width: 60 }}
          disabled={readOnly}
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

  return (
    <div className='space-y-4'>
      {/* Mô tả khách */}
      <div className='p-3 bg-yellow-50 rounded border border-yellow-300'>
        <p className='text-sm font-medium text-yellow-800'>Mô tả khách hàng:</p>
        <p className='mt-1 text-gray-700'>{booking?.note || "Chưa có mô tả"}</p>
      </div>

      {/* Bảng */}
      {loading ? (
        <Spin />
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

      {/* Thêm dòng */}
      {!readOnly && (
        <Button
          type='dashed'
          onClick={addExtraRow}
          icon={<PlusOutlined />}
          style={{ width: "100%" }}>
          Thêm hạng mục phát sinh
        </Button>
      )}

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

      {/* Nút gửi */}
      {!readOnly && (
        <div className='flex justify-end'>
          <Button type='primary' onClick={saveAll} loading={loading}>
            Gửi báo giá
          </Button>
        </div>
      )}

      {/* Modal xác nhận RMA */}
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
