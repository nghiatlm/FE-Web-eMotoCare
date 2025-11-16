// src/components/technician/detail-content/MaintenanceModeEVCheck.jsx
import { useState, useEffect } from "react";
import {
  Table,
  Input,
  Select,
  Tag,
  Image,
  Button,
  message,
  Spin,
  Checkbox,
} from "antd";

import {
  fetchEVCheckDetailsServiceMain,
  updateEVCheckService,
  updateEVCheckDetailService,
} from "../../../services/evcheckService.js";

import {
  getPartItemByIdService,
  getSuggestedPartItemsByEvCheckDetailId,
} from "../../../services/partitemsService.js";

import { getLaborCostByRemediesService } from "../../../services/priceserviceService";
import RMAConfirmationModal from "../../../components/service-staff/RMAConfirmationModal";

const { Option } = Select;

const REPAIR_STATUS = {
  PENDING: { label: "Đang sửa chữa", color: "processing" },
  IN_PROGRESS: { label: "Đang sửa chữa", color: "processing" },
  COMPLETED: { label: "Đã hoàn thành", color: "success" },
};

export default function MaintenanceModeEVCheck({
  booking,
  evCheckId,
  evCheckStatus: initialEvCheckStatus,
  setEvCheckStatus: setParentEvCheckStatus,
  readOnly = false,
  onRefresh,
}) {
  const [loading, setLoading] = useState(false);
  const [evCheckDetails, setEvCheckDetails] = useState([]);
  const [evCheckStatus, setLocalEvCheckStatus] = useState(initialEvCheckStatus);
  const [statusChanges, setStatusChanges] = useState({});
  const [partOptionsMap, setPartOptionsMap] = useState({});
  const [partLoading, setPartLoading] = useState(false);

  // RMA modal
  const [isRMAConfirmationOpen, setIsRMAConfirmationOpen] = useState(false);
  const [currentRMAParts, setCurrentRMAParts] = useState([]); // luôn truyền mảng, nhưng mỗi lần chỉ 1 phần tử

  // -------- Helpers --------
  const loadEVCheckDetails = async () => {
    try {
      setLoading(true);
      const res = await fetchEVCheckDetailsServiceMain(evCheckId);

      let rawDetails = [];
      let statusValue = null;

      if (Array.isArray(res?.evCheckDetails)) {
        rawDetails = res.evCheckDetails;
        statusValue = res.status || null;
      } else if (Array.isArray(res)) {
        rawDetails = res;
      } else if (res?.data?.rowDatas) {
        rawDetails = res.data.rowDatas;
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

      if (statusValue) setLocalEvCheckStatus(statusValue);
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

  // --------- PHÁT HIỆN RMA (theo dòng) ---------
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

  useEffect(() => {
    if (evCheckId) {
      loadEVCheckDetails();
    }
  }, [evCheckId]);

  useEffect(() => {
    setLocalEvCheckStatus(initialEvCheckStatus);
  }, [initialEvCheckStatus]);

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
      await loadEVCheckDetails();
      setLocalEvCheckStatus("INSPECTION_COMPLETED");
      setParentEvCheckStatus("INSPECTION_COMPLETED");
      message.success("Xác nhận báo giá thành công!");
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
      await loadEVCheckDetails();
      await updateEVCheckService(evCheckId, { status: "REPAIR_COMPLETED" });
      onRefresh?.();
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
    {
      title: "Trạng thái xuất kho",
      render: (_, r) => r.exportedParts || "-",
    },
  ];

  // Cột trạng thái sửa chữa
  const statusColumnForRepair = {
    title: (
      <div className='flex items-center gap-2'>
        {evCheckDetails.filter((d) => d.id).length > 0 && (
          <Checkbox
            checked={evCheckDetails.every((d) => d.status === "COMPLETED")}
            indeterminate={
              evCheckDetails.some((d) => d.status === "COMPLETED") &&
              evCheckDetails.some((d) => d.status !== "COMPLETED")
            }
            onChange={(e) => {
              const checked = e.target.checked;
              const updated = evCheckDetails.map((item) => ({
                ...item,
                status: checked ? "COMPLETED" : "PENDING",
              }));
              setEvCheckDetails(updated);

              const changes = {};
              updated.forEach((item) => {
                if (item.id && checked) {
                  changes[item.id] = "COMPLETED";
                }
              });
              setStatusChanges((prev) => ({ ...prev, ...changes }));
            }}
            disabled={readOnly}></Checkbox>
        )}
        <span>Trạng thái</span>
      </div>
    ),
    width: 220,
    render: (_, r, i) => {
      const stat = REPAIR_STATUS[r.status] || REPAIR_STATUS.PENDING;

      return (
        <div className='flex items-center gap-2'>
          <Checkbox
            checked={r.status === "COMPLETED"}
            onChange={(e) => {
              handleChange(
                i,
                "status",
                e.target.checked ? "COMPLETED" : "PENDING"
              );
            }}
            disabled={readOnly}
          />
          <Tag
            color={stat.color}
            style={{
              cursor: r.status !== "COMPLETED" ? "pointer" : "default",
              fontWeight: 500,
              borderRadius: 8,
              padding: "2px 8px",
            }}
            onClick={() => {
              if (r.status !== "COMPLETED" && !readOnly) {
                handleChange(i, "status", "COMPLETED");
              }
            }}>
            {stat.label}
          </Tag>
        </div>
      );
    },
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
    columns = [...columns, statusColumnForRepair];
  }
  if (readOnly) {
    columns = [...columns, rmaColumn];
  }

  return (
    <>
      {loading ? (
        <div className='flex justify-center p-10'>
          <Spin />
        </div>
      ) : (
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

          message.info("Đang đồng bộ lại chi tiết EV Check...");
          loadEVCheckDetails();
          setIsRMAConfirmationOpen(false);
        }}
      />
    </>
  );
}
