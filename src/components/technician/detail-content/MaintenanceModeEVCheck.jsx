// src/components/technician/detail-content/MaintenanceModeEVCheck.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Input,
  Select,
  Tag,
  Image,
  Button,
  Spin,
  Checkbox,
  Tooltip,
} from "antd";
import { toast } from "@/components/ui/sonner";

import {
  fetchEVCheckDetailsServiceMain,
  updateEVCheckService,
  updateEVCheckDetailService,
} from "../../../services/evcheckService.js";

import {
  getPartItemByIdService,
  getPartItemsByServiceCenterService,
  getSuggestedPartItemsByEvCheckDetailId,
} from "../../../services/partitemsService.js";

import { getLaborCostByRemediesService } from "../../../services/priceserviceService";
import RMAConfirmationModal from "../../../components/service-staff/RMAConfirmationModal";
import useEVCheckHub from "../../../hooks/useEVCheckHub.jsx";

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
  const [serviceCenterId, setServiceCenterId] = useState(null);

  // RMA modal
  const [isRMAConfirmationOpen, setIsRMAConfirmationOpen] = useState(false);
  const [currentRMAParts, setCurrentRMAParts] = useState([]);
  const [selectedRMAItems, setSelectedRMAItems] = useState(new Set());
  
  // ✅ Map export note status theo detail ID
  const [exportNoteStatusMap, setExportNoteStatusMap] = useState({}); // ✅ Set các item ID đã chọn để tạo RMA

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

      const mapped = await Promise.all(
        rawDetails.map(async (item) => {
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

          // ✅ Nếu status là COMPLETED và có replacePartId, tìm export note status
          let exportNoteStatus = null;
          if (normalizedStatus === "COMPLETED" && partItemId) {
            try {
              exportNoteStatus = await findExportNoteStatusByPartItemId(partItemId);
              console.log(`🔍 Detail ${item.id} - partItemId: ${partItemId}, exportNoteStatus:`, exportNoteStatus);
            } catch (err) {
              console.error(`❌ Lỗi tìm export note status cho ${partItemId}:`, err);
            }
          }

          return {
            ...item,
            replacePart: partItemId
              ? { value: partItemId, label: partItemName || partItemId }
              : null,
            replacePartId: partItemId,
            partName: partItemName,
            result: item.result ?? "Tốt", // ✅ Mặc định "Tốt"
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
            exportNoteStatus, // ✅ Lưu export note status
          };
        })
      );
      
      // ✅ Lưu export note status vào map
      const statusMap = {};
      mapped.forEach((item) => {
        if (item.id && item.exportNoteStatus) {
          statusMap[item.id] = item.exportNoteStatus;
        }
      });
      setExportNoteStatusMap(statusMap);

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
      toast.error("Không thể tải chi tiết EV Check!");
      setEvCheckDetails([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load phụ tùng đề xuất theo evCheckDetailId
  const loadSuggestedParts = async (evCheckDetailId) => {
    if (!evCheckDetailId) {
      console.warn("Không có evCheckDetailId để load phụ tùng đề xuất");
      return;
    }

    // ✅ Nếu đã load rồi thì không load lại
    if (partOptionsMap[evCheckDetailId]?.length > 0) {
      return;
    }

    try {
      setPartLoading(true);
      // ✅ Gọi API với evCheckDetailId
      const items = await getSuggestedPartItemsByEvCheckDetailId(evCheckDetailId);
      
      // ✅ Normalize data để giống format cũ, bao gồm serialNumber
      const normalized = (items || []).map((item) => ({
        id: item.id || item.partItemId,
        name: item.part?.name || item.name || item.serialNumber || item.id,
        serialNumber: item.serialNumber || item.serial_number || "",
        price: Number(item.price ?? item.unitPrice ?? 0),
        partItemId: item.id || item.partItemId,
        part: item.part, // ✅ Giữ lại part object để check warranty
      }));
      
      // ✅ Set cho evCheckDetailId key
      setPartOptionsMap((prev) => ({
        ...prev,
        [evCheckDetailId]: normalized,
      }));
    } catch (e) {
      console.error("Lỗi load phụ tùng đề xuất:", e);
      toast.error("Không tải được danh sách phụ tùng đề xuất");
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

  // ✅ Kiểm tra item đã có RMA chưa
  const hasRMA = (row) => {
    return !!(row.rmaDetail || row.rmaDetailId || row.rmaDetail?.id);
  };

  // ✅ Cho phép tạo RMA khi: còn bảo hành + có partItem + kết quả khác "Tốt" (hoặc rỗng) + chưa có RMA
  const isRMAEligible = (row) => {
    const result = (row.result || "").trim().toLowerCase();
    // ✅ Kết quả khác "Tốt" hoặc rỗng (technician đã xóa để nhập lại)
    const isNotGood = result !== "tốt" && result !== "tot" && result !== "";
    return (
      checkWarrantyStatus(row.partItem) &&
      row.partItem &&
      isNotGood && // ✅ Kết quả khác "Tốt" hoặc rỗng
      !hasRMA(row) // ✅ Chưa có RMA
    );
  };

  // ✅ Toggle chọn/bỏ chọn item cho RMA
  const toggleRMAItem = (rowId) => {
    setSelectedRMAItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  // ✅ Mở modal RMA với các items đã chọn
  const openRMAModal = () => {
    const selectedItems = evCheckDetails.filter((d) => selectedRMAItems.has(d.id) && isRMAEligible(d));
    
    if (selectedItems.length === 0) {
      return toast.warning("Vui lòng chọn ít nhất 1 phụ tùng để tạo RMA.");
    }

    const rmaItems = selectedItems.map((row) => ({
      id: row.id,
      PhuTungThayThe:
        row.partName || row.partItem?.part?.name || "Không rõ tên PT",
      NoiDung: row.result ?? row.remedies,
      partItem: row.partItem,
      partName: row.partName,
      quantity: row.quantity,
      unit: row.unit,
      remedies: row.remedies,
    }));

    setCurrentRMAParts(rmaItems);
    setIsRMAConfirmationOpen(true);
  };

  useEffect(() => {
    if (evCheckId) {
      loadEVCheckDetails();
    }
  }, [evCheckId]);

  // ✅ Kết nối SignalR để nhận real-time updates
  const handleSignalRUpdate = useCallback(() => {
    console.log("🔄 SignalR update received, reloading EVCheck details...");
    // Reload data khi nhận được update từ SignalR
    if (evCheckId) {
      loadEVCheckDetails();
      // Gọi onRefresh nếu có
      if (onRefresh) {
        onRefresh();
      }
    }
  }, [evCheckId, onRefresh]);

  useEVCheckHub(evCheckId, handleSignalRUpdate);

  // ✅ Kết nối SignalR để nhận real-time updates
  useEVCheckHub(evCheckId, () => {
    console.log("🔄 SignalR update received, reloading EVCheck details...");
    // Reload data khi nhận được update từ SignalR
    if (evCheckId) {
      loadEVCheckDetails();
      // Gọi onRefresh nếu có
      if (onRefresh) {
        onRefresh();
      }
    }
  });

  // ✅ Load serviceCenterId từ booking khi component mount
  useEffect(() => {
    const centerId = 
      booking?.serviceCenterId || 
      booking?.serviceCenter?.id || 
      null;
    if (centerId) {
      setServiceCenterId(centerId);
      // ✅ Load phụ tùng ngay khi có serviceCenterId
      loadSuggestedParts();
    }
  }, [booking?.serviceCenterId, booking?.serviceCenter?.id]);

  useEffect(() => {
    setLocalEvCheckStatus(initialEvCheckStatus);
  }, [initialEvCheckStatus]);

  // -------- Bảng (cho Maintenance) --------
  const handleChange = (index, field, value) => {
    if (evCheckStatus === "INSPECTION_COMPLETED") return;
    if (evCheckStatus === "QUOTE_APPROVED" && field !== "status") return;

    // ✅ Ngăn chọn REPLACE hoặc REPAIR khi còn bảo hành
    if (field === "remedies" && (value === "REPLACE" || value === "REPAIR")) {
      const currentRow = evCheckDetails[index];
      if (checkWarrantyStatus(currentRow?.partItem)) {
        toast.error(
          "Bộ phận đang trong thời gian bảo hành. Chỉ cho phép 'Kiểm tra' hoặc 'Bôi trơn'."
        );
        return; // Không cho thay đổi
      }
    }

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
      const loadingToast = toast.loading("Đang gửi dữ liệu kiểm tra...");

      // ✅ Kiểm tra: nếu còn bảo hành thì không cho chọn REPLACE hoặc REPAIR
      for (const item of evCheckDetails) {
        if ((item.remedies === "REPLACE" || item.remedies === "REPAIR") && checkWarrantyStatus(item.partItem)) {
          toast.dismiss(loadingToast);
          return toast.error(
            "Bộ phận đang trong thời gian bảo hành. Chỉ cho phép 'Kiểm tra' hoặc 'Bôi trơn'."
          );
        }
      }

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
          result: (item.result || "").trim() || "Tốt", // ✅ Nếu rỗng thì mặc định "Tốt"
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
      toast.dismiss(loadingToast);
      toast.success("Xác nhận báo giá thành công!");
    } catch (err) {
      console.error("Lỗi xác nhận báo giá:", err);
      toast.dismiss(loadingToast);
      toast.error("Lỗi khi gửi dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRepair = async () => {
    if (!Object.keys(statusChanges).length) {
      return toast.info("Chưa có thay đổi trạng thái nào để lưu.");
    }
    try {
      setLoading(true);
      const loadingToast = toast.loading("Đang cập nhật trạng thái hạng mục...");

      for (const [detailId, newStatus] of Object.entries(statusChanges)) {
        await updateEVCheckDetailService(detailId, { status: newStatus });
      }

      toast.dismiss(loadingToast);
      toast.success("Cập nhật trạng thái thành công!");
      setStatusChanges({});
      await loadEVCheckDetails();
      await updateEVCheckService(evCheckId, { status: "REPAIR_COMPLETED" });
      onRefresh?.();
    } catch (err) {
      console.error("Cập nhật trạng thái thất bại:", err);
      toast.dismiss(loadingToast);
      toast.error("Không thể cập nhật trạng thái hạng mục!");
    } finally {
      setLoading(false);
    }
  };

  const canEditFields =
    !readOnly &&
    evCheckStatus !== "INSPECTION_COMPLETED" &&
    evCheckStatus !== "QUOTE_APPROVED" &&
    evCheckStatus !== "REPAIR_IN_PROGRESS" &&
    evCheckStatus !== "REPAIR_COMPLETED" &&
    evCheckStatus !== "COMPLETED";

  const baseColumns = [
    { title: "STT", render: (_, __, idx) => idx + 1, width: 50 },
    {
      title: "Hạng mục",
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (_, r) => {
        const partName = r.maintenanceStageDetail?.part?.name || r.partName || "—";
        return (
          <Tooltip title={partName} placement="topLeft">
            <span style={{ 
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {partName}
            </span>
          </Tooltip>
        );
      },
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
      width: 350,
      render: (_, r, i) => (
        <Input.TextArea
          placeholder='Nhập kết quả kiểm tra (mặc định: Tốt, có thể xóa để nhập lại)...'
          value={r.result ?? ""}
          onChange={(e) => handleChange(i, "result", e.target.value)}
          onBlur={(e) => {
            // ✅ Nếu để trống khi blur, tự động set về "Tốt"
            if (!e.target.value.trim()) {
              handleChange(i, "result", "Tốt");
            }
          }}
          disabled={!canEditFields}
          autoSize={{ minRows: 2, maxRows: 8 }}
          style={{ resize: "none", fontSize: 14, lineHeight: 1.5, maxWidth: "100%" }}
        />
      ),
    },
    {
      title: "Biện pháp",
      width: 110,
      render: (_, r, i) => {
        const isWarranty = checkWarrantyStatus(r.partItem);
        return (
          <Select
            placeholder='Chọn'
            value={r.remedies}
            style={{ width: 100 }}
            onChange={(v) => handleChange(i, "remedies", v)}
            disabled={!canEditFields}>
            <Option value='NONE'>Bôi trơn</Option>
            {/* ✅ Nếu đang bảo hành thì không cho chọn "Thay thế" và "Sửa chữa" */}
            <Option value='REPLACE' disabled={isWarranty}>
              Thay thế
            </Option>
            <Option value='REPAIR' disabled={isWarranty}>
              Sửa chữa
            </Option>
            <Option value='CHECK'>Kiểm tra</Option>
          </Select>
        );
      },
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
      width: 220,
      ellipsis: {
        showTitle: false,
      },
      render: (_, r, i) => {
        const isWarranty = checkWarrantyStatus(r.partItem);
        const replacePartName = r.partName || r.replacePart?.label || "";
        
        // ✅ Nếu còn bảo hành, hiển thị "Còn bảo hành" thay vì Select
        if (isWarranty) {
          return (
            <Tooltip title="Bộ phận còn trong thời gian bảo hành" placement="topLeft">
              <span style={{ color: "#ff4d4f", fontWeight: 500 }}>
                Còn bảo hành
              </span>
            </Tooltip>
          );
        }
        
        return (
          <Tooltip title={replacePartName} placement="topLeft">
            <Select
              placeholder='Chọn'
              value={r.replacePart || undefined}
              disabled={
                !canEditFields ||
                r.remedies !== "REPLACE" ||
                checkWarrantyStatus(r.partItem)
              }
              labelInValue
              loading={partLoading}
              style={{ width: "100%", maxWidth: "100%" }}
              onDropdownVisibleChange={(open) => {
                // ✅ Load suggested parts khi mở dropdown (load theo evCheckDetailId)
                if (open && r.id) {
                  loadSuggestedParts(r.id);
                }
              }}
              onChange={async (opt) => {
                const partItemId = opt?.value;
                // ✅ Lấy phụ tùng từ evCheckDetailId
                const list = r.id ? (partOptionsMap[r.id] || []) : [];
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
                    const apiName = data.part?.name || "";
                    const apiSerial = data.serialNumber || "";
                    const apiLabel = apiSerial ? `${apiName} (${apiSerial})` : apiName || data.serialNumber || partItemId;

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
                        { 
                          id: partItemId, 
                          name: apiName, 
                          serialNumber: apiSerial,
                          price: apiPrice 
                        },
                      ],
                    }));
                  } catch (e) {
                    toast.error("Lỗi tải phụ tùng");
                  }
                }
              }}
              options={(() => {
                // ✅ Lấy phụ tùng từ evCheckDetailId
                const parts = r.id ? (partOptionsMap[r.id] || []) : [];
                
                // ✅ Lấy tên bộ phận hiện tại để filter
                const currentPartName = 
                  r.partItem?.part?.name || 
                  r.partName || 
                  r.displayName?.split(" (")[0] || 
                  "";
                
                // ✅ Filter phụ tùng đề xuất: chỉ hiển thị những phụ tùng có tên trùng với tên bộ phận
                const filteredParts = currentPartName
                  ? parts.filter((p) => {
                      const partName = (p.name || "").toLowerCase().trim();
                      const currentName = currentPartName.toLowerCase().trim();
                      return partName === currentName || partName.includes(currentName) || currentName.includes(partName);
                    })
                  : parts;
                
                return filteredParts.map((p) => {
                  const name = p.name || "";
                  const serial = p.serialNumber || "";
                  const label = serial ? `${name} (${serial})` : name;
                  return {
                    value: p.id,
                    label: label || p.id,
                  };
                });
              })()}
              dropdownStyle={{ maxWidth: "400px" }}
            />
          </Tooltip>
        );
      },
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
      title: "Trạng thái phụ tùng",
      width: 150,
      render: (_, r) => {
        // ✅ Chỉ hiển thị khi status là COMPLETED
        if (r.status === "COMPLETED" ) {
          const status = r.exportNoteStatus || exportNoteStatusMap[r.id] || "-";
          return <span>{status}</span>;
        }
        return "-";
      },
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

  // ✅ Cột RMA: checkbox để chọn nhiều items
  const eligibleItems = evCheckDetails.filter((r) => isRMAEligible(r));
  const allSelected = eligibleItems.length > 0 && eligibleItems.every((r) => selectedRMAItems.has(r.id));
  const someSelected = eligibleItems.some((r) => selectedRMAItems.has(r.id));

  const rmaColumn = {
    title: (
      <div className='flex items-center gap-2'>
        <span>RMA</span>
        {readOnly && eligibleItems.length > 0 && (
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={(e) => {
              if (e.target.checked) {
                // Chọn tất cả items đủ điều kiện
                const allIds = new Set(eligibleItems.map((r) => r.id));
                setSelectedRMAItems(allIds);
              } else {
                // Bỏ chọn tất cả
                setSelectedRMAItems(new Set());
              }
            }}
            onClick={(e) => e.stopPropagation()}
            title='Chọn tất cả'
          />
        )}
      </div>
    ),
    width: 120,
    align: "center",
    render: (_, r) => {
      // ✅ Nếu đã có RMA, hiển thị badge thay vì checkbox
      if (hasRMA(r)) {
        return (
          <Tag color='success' style={{ margin: 0 }}>
            Đã tạo RMA
          </Tag>
        );
      }

      const eligible = isRMAEligible(r);
      if (!eligible) return <span className='text-gray-400'>-</span>;
      
      const isSelected = selectedRMAItems.has(r.id);
      
      return (
        <input
          type='checkbox'
          checked={isSelected}
          onChange={() => toggleRMAItem(r.id)}
          className='w-4 h-4 cursor-pointer'
        />
      );
    },
  };

  let columns = baseColumns;
  if (!readOnly && evCheckStatus === "REPAIR_IN_PROGRESS") {
    columns = [...columns, statusColumnForRepair];
  }
  // ✅ Chỉ hiện cột RMA cho staff (readOnly = true), technician không được tạo RMA
  if (readOnly && evCheckDetails.some((r) => isRMAEligible(r))) {
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
          scroll={{ x: 'max-content' }}
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
              evCheckStatus !== "REPAIR_COMPLETED" &&
              evCheckStatus !== "COMPLETED" &&
              evCheckStatus !== "QUOTE_APPROVED" &&
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

      {/* ✅ Nút tạo RMA chỉ cho staff (readOnly = true), technician không được tạo */}
      {readOnly && selectedRMAItems.size > 0 && (
        <div className='flex justify-end mt-4' style={{ marginTop: 16 }}>
          <Button
            type='primary'
            danger
            onClick={openRMAModal}
            disabled={selectedRMAItems.size === 0}>
            Tạo RMA ({selectedRMAItems.size} phụ tùng)
          </Button>
        </div>
      )}

      {/* Modal xác nhận RMA – gom nhiều items thành 1 RMA */}
      <RMAConfirmationModal
        open={isRMAConfirmationOpen}
        onClose={() => {
          setIsRMAConfirmationOpen(false);
          setSelectedRMAItems(new Set()); // ✅ Clear selection sau khi đóng
        }}
        booking={booking}
        partsForRMA={currentRMAParts}
        onRMASuccess={() => {
          const rmaDetailIds = currentRMAParts.map((p) => p.id);
          setSelectedRMAItems(new Set()); // ✅ Clear selection sau khi tạo thành công
          toast.info("Đang đồng bộ lại chi tiết EV Check...");
          loadEVCheckDetails();
          setIsRMAConfirmationOpen(false);
        }}
      />
    </>
  );
}
