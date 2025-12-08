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
import { toast } from "react-toastify";
import {
  fetchEVCheckDetailsServiceMain,
  updateEVCheckService,
  updateEVCheckDetailService,
} from "../../../services/evcheckService.js";

import {
  getPartItemByIdService,
  getPartItemsByServiceCenterService,
  getPartsByModelAndTypeService,
} from "../../../services/partitemsService.js";

import { getLaborCostByRemediesService } from "../../../services/priceserviceService";
import { getExportStatusByAppointmentCodeAndPartId } from "../../../services/exportNotesService.js";
import RMAConfirmationModal from "../../../components/service-staff/RMAConfirmationModal";
import useEVCheckHub from "../../../hooks/useEVCheckHub.jsx";
import BatteryDataDisplay from "../BatteryDataDisplay";
// Campaign logic đã được tách ra CampaignModeEVCheck component riêng

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
  // ✅ Cache partTypeId theo partId để tránh fetch lại (giống repair mode)
  const [partTypeIdCache, setPartTypeIdCache] = useState({});
  
  // ✅ Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
    pageSizeOptions: ['8', '10', '20', '30', '50'],
  });

  // RMA modal
  const [isRMAConfirmationOpen, setIsRMAConfirmationOpen] = useState(false);
  const [currentRMAParts, setCurrentRMAParts] = useState([]);
  const [selectedRMAItems, setSelectedRMAItems] = useState(new Set());
  const [isRMASubmitting, setIsRMASubmitting] = useState(false); // ✅ Track trạng thái đang tạo RMA
  
  // ✅ Map export note status theo detail ID
  const [exportNoteStatusMap, setExportNoteStatusMap] = useState({});
  
  // ✅ Campaign logic đã được tách ra CampaignModeEVCheck component riêng

  // -------- Helpers --------
  const loadEVCheckDetails = async () => {
    try {
      setLoading(true);
      
      // ✅ Campaign logic đã được tách ra CampaignModeEVCheck component riêng
      
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
          // ✅ Lấy proposedReplacePartId từ proposedReplacePart object hoặc proposedReplacePartId
          const proposedReplacePartId =
            item?.proposedReplacePartId ||
            item?.proposedReplacePart?.id ||
          null;

          // ✅ Lấy replacePartName từ proposedReplacePart object (Part template, không phải PartItem)
          let replacePartName = "";
          if (proposedReplacePartId) {
            // ✅ Ưu tiên lấy từ proposedReplacePart object nếu có (từ API response)
            // proposedReplacePart là Part object, có: id, code, name, quantity, image, status
            if (item.proposedReplacePart) {
              const proposedPart = item.proposedReplacePart;
              const partName = proposedPart.name || "";
              const code = proposedPart.code || "";
              replacePartName = code ? `${partName} (${code})` : (partName || "");
              console.log(`✅ Load replacePartName từ proposedReplacePart: ${replacePartName}`);
            } else {
              // ✅ Nếu không có proposedReplacePart object, gọi API getPartById để lấy thông tin
              // proposedReplacePartId là partId (Part template), không phải partItemId
              try {
                const { getPartById } = await import("../../../api/partsApi");
                const partDetailRes = await getPartById(proposedReplacePartId);
                const partDetail = partDetailRes?.data?.data || partDetailRes?.data || partDetailRes;
                const partName = partDetail?.name || "";
                const code = partDetail?.code || "";
                replacePartName = code ? `${partName} (${code})` : (partName || "");
                console.log(`✅ Load replacePartName từ getPartById: ${replacePartName}`);
              } catch (err) {
                console.error(`❌ Lỗi lấy thông tin phụ tùng ${proposedReplacePartId}:`, err);
                // ✅ Không fallback về ID, để trống để sau đó load lại khi mở dropdown
                replacePartName = "";
              }
            }
          }

        const partItemName =
          item?.partItem?.part?.name ||
          item?.partName ||
          item?.maintenanceStageDetail?.part?.name ||
          "";

        // ✅ Giá phụ tùng lấy từ bộ phận có sẵn trên xe (partItem.price), không lấy từ phụ tùng thay thế
        const pricePart = Number(item?.partItem?.price ?? item?.pricePart ?? 0);
        const currentStatus = item.status || "PENDING";
        const normalizedStatus =
          currentStatus === "INPROGRESS" ? "IN_PROGRESS" : currentStatus;

          // ✅ Tìm export note status theo appointmentCode và proposedPartId (API mới)
          let exportNoteStatus = null;
          const appointmentCode = booking?.code || null;
          if (proposedReplacePartId && appointmentCode) {
            try {
              exportNoteStatus = await getExportStatusByAppointmentCodeAndPartId(appointmentCode, proposedReplacePartId);
              console.log(`🔍 Detail ${item.id} - appointmentCode: ${appointmentCode}, proposedPartId: ${proposedReplacePartId}, exportNoteStatus:`, exportNoteStatus);
            } catch (err) {
              console.error(`❌ Lỗi tìm export note status cho appointmentCode ${appointmentCode}, proposedPartId ${proposedReplacePartId}:`, err);
            }
          }

          // ✅ Cache partTypeId ngay khi load data - giống repair mode (không gọi API)
          const partIdFromItem = item?.partItem?.part?.id || item?.maintenanceStageDetail?.part?.id || null;
          const partTypeIdFromItem = item?.partItem?.part?.partType?.id || item?.maintenanceStageDetail?.part?.partType?.id || null;
          
          // ✅ Chỉ cache nếu có cả partId và partTypeId từ dữ liệu có sẵn (không gọi API)
          if (partIdFromItem && partTypeIdFromItem) {
            setPartTypeIdCache(prev => ({
              ...prev,
              [partIdFromItem]: partTypeIdFromItem
            }));
            console.log(`✅ Cached partTypeId for partId ${partIdFromItem}:`, partTypeIdFromItem);
          }

          // ✅ Kiểm tra bảo hành: Nếu còn bảo hành thì không tính tiền dịch vụ
          const partItemForPrice = item.partItem || item.maintenanceStageDetail?.partItem || null;
          const isWarranty = checkWarrantyStatus(partItemForPrice);
          const initialPriceService = isWarranty ? 0 : Number(item.priceService || 0);

        return {
          ...item,
            proposedReplacePartId: proposedReplacePartId,
            replacePartName: replacePartName,
          partName: partItemName,
          partItem: item.partItem || null,
          maintenanceStageDetail: item.maintenanceStageDetail || null,
            result: item.result ?? "Tốt", // ✅ Mặc định "Tốt"
            remedies: item.remedies ?? item.solution ?? "NONE", // ✅ Mặc định "NONE" (Bôi trơn)
          warranty: item.warranty ?? false,
          quantity: item.quantity ?? 1,
          unit: item.unit ?? "cái",
          pricePart,
          priceService: initialPriceService, // ✅ Set = 0 nếu còn bảo hành
          totalAmount:
            (item.remedies === "REPLACE" ? pricePart : 0) +
            initialPriceService,
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

      // ✅ Tự động gọi giá dịch vụ cho các items có remedies là NONE, CHECK, REPAIR hoặc REPLACE
      mapped.forEach((row) => {
        if (
          (!row.priceService || Number(row.priceService) === 0) &&
          ["NONE", "CHECK", "REPAIR", "REPLACE"].includes(row.remedies) &&
          (row.partItem || row.maintenanceStageDetail?.part)
        ) {
          // ✅ Truyền row data vào để có thể lấy partTypeId
          updateLaborCostForRow(row.id, row.remedies, row);
        }
      });

      if (statusValue) setLocalEvCheckStatus(statusValue);
      setStatusChanges({});
    } catch (err) {
      console.error("Lỗi tải chi tiết EV Check:", err);
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể tải chi tiết EV Check!"));
      setEvCheckDetails([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load phụ tùng đề xuất theo modelId và partTypeId (giống repair mode)
  const loadSuggestedParts = async (partTypeId) => {
    // ✅ Lấy modelId từ booking.vehicle.modelId
    const modelId = booking?.vehicle?.modelId || null;

    if (!modelId) {
      console.warn("Không tìm thấy modelId từ booking.vehicle");
      return;
    }

    if (!partTypeId) {
      console.warn("Không có partTypeId để load phụ tùng đề xuất");
      return;
    }

    // ✅ Tạo key từ modelId và partTypeId để cache
    const cacheKey = `${modelId}_${partTypeId}`;

    // ✅ Nếu đã load rồi thì không load lại (nhưng vẫn return để có thể await)
    if (partOptionsMap[cacheKey]?.length > 0) {
      return Promise.resolve();
    }

    try {
      setPartLoading(true);
      // ✅ Gọi API mới với modelId và partTypeId - giống repair mode
      // GET /api/v1/parts/by-model-and-type?model={modelId}&partTypeId={partTypeId}
      const items = await getPartsByModelAndTypeService(modelId, partTypeId);
      
      // ✅ Set cho cacheKey
      setPartOptionsMap((prev) => ({
        ...prev,
        [cacheKey]: items,
      }));
    } catch (e) {
      console.error("Lỗi load phụ tùng đề xuất:", e);
      console.error("Error details:", {
        statusCode: e?.statusCode,
        message: e?.message,
        response: e?.response,
        data: e?.data
      });
      // ✅ Không hiển thị toast error nếu là lỗi 500 (backend issue)
      // Chỉ log để debug, không làm gián đoạn UX
      // Axios interceptor đã unwrap error.response.data, nên check e?.statusCode
      if (e?.statusCode !== 500 && e?.response?.status !== 500) {
        toast.error((e?.response?.data?.message || e?.data?.message || e?.message || "Không tải được danh sách phụ tùng đề xuất"));
      } else {
        console.warn("⚠️ Backend API lỗi 500, bỏ qua để không làm gián đoạn UX");
      }
      // ✅ Set empty array để tránh lỗi khi render
      setPartOptionsMap((prev) => ({
        ...prev,
        [cacheKey]: [],
      }));
    } finally {
      setPartLoading(false);
    }
  };

  const updateLaborCostForRow = async (recordId, remedies, rowData = null) => {
    // ✅ Cập nhật: Lấy giá dịch vụ cho NONE, CHECK, REPAIR, REPLACE
    if (!["NONE", "CHECK", "REPAIR", "REPLACE"].includes(remedies)) {
      setEvCheckDetails((prev) =>
        prev.map((row) => {
          if (row.id !== recordId) return row;
          return {
            ...row,
            priceService: 0,
            totalAmount: (row.remedies === "REPLACE" ? Number(row.pricePart || 0) : 0) + 0,
          };
        })
      );
      return;
    }
    
    try {
      // ✅ Lấy row data từ tham số hoặc từ state
      let currentRow = rowData;
      if (!currentRow) {
        currentRow = evCheckDetails.find((r) => r.id === recordId);
      }
      
      if (!currentRow) {
        console.warn(`❌ Không tìm thấy row với recordId: ${recordId}`);
        return;
      }
      
      // ✅ Kiểm tra bảo hành: Nếu còn bảo hành thì không tính tiền dịch vụ
      const partItem = currentRow?.partItem || currentRow?.maintenanceStageDetail?.partItem || null;
      if (checkWarrantyStatus(partItem)) {
        console.log(`⚠️ [updateLaborCostForRow] Bộ phận còn bảo hành, không tính giá dịch vụ`);
        setEvCheckDetails((prev) =>
          prev.map((row) => {
            if (row.id !== recordId) return row;
            const pricePart = Number(row.pricePart || 0);
            const validPart = row.remedies === "REPLACE" ? pricePart : 0;
            return {
              ...row,
              priceService: 0,
              totalAmount: validPart + 0,
            };
          })
        );
        return;
      }
      
      // ✅ Lấy partTypeId từ cache hoặc từ partItem/maintenanceStageDetail
      const partId = currentRow?.partItem?.part?.id || currentRow?.maintenanceStageDetail?.part?.id || null;
      let partTypeId = null;
      
      // ✅ Ưu tiên 1: Lấy từ _partTypeId nếu có (đã được set khi chọn partItem)
      if (currentRow?._partTypeId) {
        partTypeId = currentRow._partTypeId;
        console.log(`🔍 [updateLaborCostForRow] partTypeId from rowData._partTypeId: ${partTypeId}`);
      }
      
      // ✅ Ưu tiên 2: Lấy từ cache nếu có partId
      if (!partTypeId && partId) {
        partTypeId = partTypeIdCache[partId] || null;
        console.log(`🔍 [updateLaborCostForRow] partId: ${partId}, partTypeId from cache: ${partTypeId}`);
      }
      
      // ✅ Ưu tiên 3: Lấy từ partItem hoặc maintenanceStageDetail
      if (!partTypeId) {
        partTypeId = currentRow?.partItem?.part?.partType?.id || 
                     currentRow?.maintenanceStageDetail?.part?.partType?.id || null;
        console.log(`🔍 [updateLaborCostForRow] partTypeId from partItem/maintenanceStageDetail: ${partTypeId}`);
      }
      
      if (!partTypeId) {
        console.warn(`❌ Không tìm thấy partTypeId cho bộ phận với recordId: ${recordId}, partId: ${partId}`);
        return;
      }
      
      console.log(`💰 [updateLaborCostForRow] Đang lấy giá dịch vụ cho partTypeId: ${partTypeId}, remedies: ${remedies}`);
      
      const labor = await getLaborCostByRemediesService(partTypeId, remedies);
      console.log(`✅ [updateLaborCostForRow] Đã lấy được giá dịch vụ: ${labor} cho partTypeId: ${partTypeId}, remedies: ${remedies}`);
      
      setEvCheckDetails((prev) =>
        prev.map((row) => {
          if (row.id !== recordId) return row;
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
      console.error("❌ updateLaborCostForRow error:", e);
    }
  };

  // --------- PHÁT HIỆN RMA (theo dòng) ---------
  const checkWarrantyStatus = (partItem) => {
    if (!partItem) return false;
    // ✅ Lấy từ isManufacturerWarranty thay vì tính từ ngày
    return partItem.isManufacturerWarranty === true;
  };

  // ✅ Kiểm tra item đã có RMA chưa
  const hasRMA = (row) => {
    return !!(row.rmaDetail || row.rmaDetailId || row.rmaDetail?.id);
  };

  // ✅ Kiểm tra item có vấn đề về kho (hết hàng hoặc chờ xuất kho)
  const hasStockIssue = (row) => {
    const exportStatus = row?.exportNoteStatus || exportNoteStatusMap[row?.id];
    const exportStatusUpper = (exportStatus || "").toUpperCase();
    return exportStatusUpper === "STOCK_NOT_FOUND" || exportStatusUpper === "STOCK_FOUND";
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


  // ✅ Mở modal RMA với các items đã chọn
  const openRMAModal = () => {
    if (isRMASubmitting) return; // ✅ Không cho mở nếu đang submit
    
    setIsRMASubmitting(true); // ✅ Disable ngay khi bấm nút
    
    const selectedItems = evCheckDetails.filter((d) => selectedRMAItems.has(d.id) && isRMAEligible(d));
    
    if (selectedItems.length === 0) {
      setIsRMASubmitting(false); // ✅ Reset nếu không có items
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
      // ✅ Không cần load suggested parts ở đây nữa, sẽ load khi mở dropdown với partTypeId
    }
  }, [booking?.serviceCenterId, booking?.serviceCenter?.id]);

  useEffect(() => {
    setLocalEvCheckStatus(initialEvCheckStatus);
  }, [initialEvCheckStatus]);

  // -------- Bảng (cho Maintenance) --------
  const handleChange = (recordId, field, value) => {
    if (evCheckStatus === "INSPECTION_COMPLETED") return;
    if (evCheckStatus === "QUOTE_APPROVED" && field !== "status") return;

    // ✅ Ngăn chọn REPLACE hoặc REPAIR khi còn bảo hành
    if (field === "remedies" && (value === "REPLACE" || value === "REPAIR")) {
      const currentRow = evCheckDetails.find((r) => r.id === recordId);
      if (checkWarrantyStatus(currentRow?.partItem)) {
        toast.error(
          "Bộ phận đang trong thời gian bảo hành. Chỉ cho phép 'Kiểm tra' hoặc 'Bôi trơn'."
        );
        return; // Không cho thay đổi
      }
    }

    // ✅ Kiểm tra trạng thái xuất kho: Nếu hết hàng hoặc chờ xuất kho thì không cho tick hoàn thành
    if (field === "status" && value === "COMPLETED") {
      const currentRow = evCheckDetails.find((r) => r.id === recordId);
      if (hasStockIssue(currentRow)) {
        toast.error("Không thể đánh dấu hoàn thành khi phụ tùng hết hàng hoặc đang chờ xuất kho.");
        return;
      }
    }

    setEvCheckDetails((prev) =>
      prev.map((row) => {
        if (row.id !== recordId) return row;
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
          // ✅ Truyền row data đã được update vào updateLaborCostForRow
          updateLaborCostForRow(recordId, value, updated);
          return updated;
        }

        if (field === "proposedReplacePart") {
          if (value) {
            // ✅ value có thể là object {value, label} hoặc trực tiếp là partId
            updated.proposedReplacePartId = value?.value || value;
            updated.replacePartName = value?.label || "";
          } else {
            updated.proposedReplacePartId = null;
            updated.replacePartName = "";
          }
          return updated;
        }
        
        // ✅ Hỗ trợ update trực tiếp proposedReplacePartId
        if (field === "proposedReplacePartId") {
          updated.proposedReplacePartId = value || null;
          return updated;
        }
        
        if (field === "replacePartName") {
          updated.replacePartName = value;
          return updated;
        }

        updated[field] = value;
        return updated;
      })
    );

    if (field === "status") {
      if (recordId)
        setStatusChanges((prev) => ({ ...prev, [recordId]: value }));
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

        const proposedReplacePartIdValue =
          item.proposedReplacePartId ||
          item.proposedReplacePart?.id ||
          null;

        const payload = {
          result: (item.result || "").trim() || "Tốt", // ✅ Nếu rỗng thì mặc định "Tốt"
          remedies: item.remedies ?? "NONE", // ✅ Mặc định "NONE" (Bôi trơn)
          warranty: item.warranty,
          unit: item.unit,
          priceService: Number(item.priceService) || null,
          totalAmount: Number(item.totalAmount) || 0,
          status: normalizedStatus,
        };

        // ✅ Chỉ gửi proposedReplacePartId, pricePart và quantity nếu remedies là REPLACE và có giá trị
        if (item.remedies === "REPLACE" && proposedReplacePartIdValue) {
          payload.proposedReplacePartId = proposedReplacePartIdValue;
          payload.quantity = Number(item.quantity || 1);
          payload.pricePart = Number(item.pricePart || 0);
          console.log(`✅ [MaintenanceMode] Gửi proposedReplacePartId cho item ${item.id}:`, proposedReplacePartIdValue);
        } else {
          // ✅ Không có phụ tùng thay thế thì không gửi quantity và pricePart
          payload.quantity = null;
          payload.pricePart = null;
          if (item.remedies === "REPLACE" && !proposedReplacePartIdValue) {
            console.warn(`⚠️ [MaintenanceMode] Item ${item.id} có remedies=REPLACE nhưng không có proposedReplacePartId`);
          }
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
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Lỗi khi gửi dữ liệu!"));
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
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể cập nhật trạng thái hạng mục!"));
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
    { title: "STT", render: (_, __, idx) => idx + 1, width: 35 },
    {
      title: "Hạng mục",
      width: 180,
      ellipsis: {
        showTitle: true,
      },
      render: (_, r) => {
        const partName = r.maintenanceStageDetail?.part?.name || r.partName || "";
        return (
          <Tooltip title={partName} placement="topLeft">
            <span style={{ 
              display: "block",
              whiteSpace: "nowrap",
              overflow: "visible"
            }}>
              {partName}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Hình ảnh",
      width: 50,
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
        return labels.length > 0 ? labels.join("/") : "";
      },
    },
    {
      title: "Kết quả",
      width: 120,
      render: (_, r, i) => {
        // ✅ Kiểm tra nếu bộ phận là CÒI
        const partName = r.maintenanceStageDetail?.part?.name || r.partName || "";
        const isCoi = partName.toLowerCase().includes("Pin") || 
                     partName.toLowerCase().includes("PIN") ||
                     partName.toLowerCase().includes("horn");
        
        return (
          <div className="space-y-2">
        <Input.TextArea
              placeholder='Nhập kết quả kiểm tra (mặc định: Tốt, có thể xóa để nhập lại)...'
              value={r.result ?? ""}
              onChange={(e) => handleChange(r.id, "result", e.target.value)}
              onBlur={(e) => {
                // ✅ Nếu để trống khi blur, tự động set về "Tốt"
                if (!e.target.value.trim()) {
                  handleChange(r.id, "result", "Tốt");
                }
              }}
          disabled={!canEditFields}
          autoSize={{ minRows: 2, maxRows: 8 }}
              style={{ resize: "none", fontSize: 14, lineHeight: 1.5, maxWidth: "100%" }}
            />
            {/* ✅ Hiển thị dữ liệu pin nếu bộ phận là CÒI và có ID thật (không phải temp) */}
            {isCoi && r.id && !r.id.startsWith("temp_") && (
              <div className="mt-2 p-2 border rounded bg-gray-50">
                <BatteryDataDisplay 
                  evCheckDetailId={r.id} 
                  canImport={canEditFields}
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Biện pháp",
      width: 90,
      render: (_, r, i) => {
        const isWarranty = checkWarrantyStatus(r.partItem);
        
        // ✅ Map remedies sang label tiếng Việt
        const getRemediesLabel = (remedies) => {
          const map = {
            REPLACE: "Thay thế",
            REPAIR: "Sửa chữa",
            CHECK: "Kiểm tra",
            NONE: "Bôi trơn",
            LUBBR: "Bôi trơn",
            LUB: "Bôi trơn",
            LUBRICATE: "Bôi trơn",
          };
          // ✅ Normalize: chuyển về uppercase và remove spaces
          const normalized = (remedies || "").toString().toUpperCase().trim();
          return map[normalized] || "Bôi trơn"; // ✅ Mặc định "Bôi trơn"
        };

        const remediesValue = r.remedies || "NONE";
        const remediesLabel = getRemediesLabel(remediesValue);

        return (
          <Tooltip title={remediesLabel || "Chọn"} placement="topLeft">
            <Select
              placeholder='Chọn'
              value={{ value: remediesValue, label: remediesLabel }}
              labelInValue // ✅ Dùng labelInValue để hiển thị label thay vì value
              style={{ width: 100 }}
              onChange={(v) => handleChange(r.id, "remedies", v.value || v)} // ✅ Lấy value từ object, dùng r.id thay vì i
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
          </Tooltip>
        );
      },
    },
    {
      title: "Bảo hành",
      width: 60,
      render: (_, r) => {
        const partItem = r.partItem;
        if (!partItem) return "Không";
        // ✅ Lấy từ isManufacturerWarranty thay vì tính từ ngày
        return partItem.isManufacturerWarranty === true ? "BHH" : "Không";
      },
    },
    {
      title: "Phụ tùng thay thế",
      width: 200,
      ellipsis: {
        showTitle: true,
      },
      render: (_, r, i) => {
        const isWarranty = checkWarrantyStatus(r.partItem);
        const replacePartName = r.replacePartName || "";
        
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
        
        // ✅ Lấy partTypeId từ bộ phận hiện tại để load phụ tùng đề xuất (giống repair mode)
        const modelId = booking?.vehicle?.modelId || null;
        let partTypeId = null;
        
        // ✅ Lấy partId từ r.partItem.part.id hoặc r.maintenanceStageDetail.part.id
        let partId = r.partItem?.part?.id || r.maintenanceStageDetail?.part?.id || null;
        
        // ✅ Lấy partTypeId từ cache trước (đã cache khi load data)
        if (partId) {
          partTypeId = partTypeIdCache[partId] || null;
        }
        
        // ✅ Nếu không có trong cache, thử lấy từ part object trực tiếp
        if (!partTypeId && partId) {
          partTypeId = r.partItem?.part?.partType?.id || r.maintenanceStageDetail?.part?.partType?.id || null;
          // ✅ Cache lại nếu tìm thấy
          if (partTypeId) {
            setPartTypeIdCache(prev => ({
              ...prev,
              [partId]: partTypeId
            }));
          }
        }
        
        // ✅ Lấy phụ tùng đề xuất từ cache key: `${modelId}_${partTypeId}` (giống repair mode)
        const cacheKey = modelId && partTypeId ? `${modelId}_${partTypeId}` : null;
        const allSuggestedParts = cacheKey ? (partOptionsMap[cacheKey] || []) : [];
        
        return (
          <Tooltip title={replacePartName || "Chọn phụ tùng"} placement="topLeft">
        <Select
              showSearch
              placeholder="Chọn phụ tùng"
              value={
                r.proposedReplacePartId
                  ? { value: r.proposedReplacePartId, label: r.replacePartName || "Đang tải..." }
                  : undefined
              }
              labelInValue
          disabled={
                readOnly ||
            !canEditFields ||
            r.remedies !== "REPLACE" ||
                isWarranty
          }
          loading={partLoading}
              style={{ width: "100%", minWidth: "180px" }}
              onDropdownVisibleChange={async (open) => {
                // ✅ Load suggested parts khi mở dropdown với partTypeId từ bộ phận hiện tại (giống repair mode)
                if (open) {
                  // ✅ Nếu có proposedReplacePartId nhưng chưa có replacePartName, load lại name
                  if (r.proposedReplacePartId && !r.replacePartName) {
                    try {
                      const { getPartById } = await import("../../../api/partsApi");
                      const partDetailRes = await getPartById(r.proposedReplacePartId);
                      const partDetail = partDetailRes?.data?.data || partDetailRes?.data || partDetailRes;
                      const partName = partDetail?.name || "";
                      const code = partDetail?.code || "";
                      const loadedName = code ? `${partName} (${code})` : (partName || "");
                      if (loadedName) {
                        handleChange(r.id, "replacePartName", loadedName);
                      }
                    } catch (err) {
                      console.error(`❌ Lỗi load name cho proposedReplacePartId ${r.proposedReplacePartId}:`, err);
                    }
                  }
                  
                  // ✅ Lấy part.id từ r.partItem.part.id hoặc r.maintenanceStageDetail.part.id - giống repair mode
                  let partId = r.partItem?.part?.id || r.maintenanceStageDetail?.part?.id || null;
                  
                  // ✅ Lấy partTypeId từ cache trước (đã cache khi load data) - giống repair mode
                  let partTypeId = partId ? partTypeIdCache[partId] : null;
                  
                  // ✅ Nếu không có trong cache, thử lấy trực tiếp từ part object - giống repair mode
                  if (!partTypeId) {
                    partTypeId = r.partItem?.part?.partType?.id || r.maintenanceStageDetail?.part?.partType?.id || null;
                    // ✅ Cache lại nếu tìm thấy
                    if (partId && partTypeId) {
                      setPartTypeIdCache(prev => ({
                        ...prev,
                        [partId]: partTypeId
                      }));
                      console.log(`✅ Cached partTypeId from part object for partId ${partId}:`, partTypeId);
                    }
                  }
                  
                  // ✅ Fallback: nếu vẫn không có, thử gọi getPartItemByIdService từ partItem - giống repair mode
                  if (!partTypeId && r.partItem?.id) {
                    try {
                      const partItemDetail = await getPartItemByIdService(r.partItem.id);
                      if (partItemDetail?.part?.partType?.id) {
                        partTypeId = partItemDetail.part.partType.id;
                        // ✅ Cache lại nếu tìm thấy
                        if (partId && partTypeId) {
                          setPartTypeIdCache(prev => ({
                  ...prev,
                            [partId]: partTypeId
                          }));
                          console.log(`✅ Cached partTypeId from getPartItemByIdService for partId ${partId}:`, partTypeId);
                        }
                      }
                    } catch (err) {
                      console.error(`❌ Lỗi lấy partTypeId từ getPartItemByIdService cho partItemId ${r.partItem.id}:`, err);
                    }
                  }
                  
                  // ✅ Fallback cuối cùng: nếu vẫn không có và có partItem object, thử lấy partItemId từ đó và gọi API
                  if (!partTypeId && r.partItem && !r.partItem.part?.partType?.id) {
                    // Nếu partItem có nhưng không có partType, thử gọi API để lấy đầy đủ thông tin
                    // Lưu ý: r.partItem.id là partItemId, không phải partId
                    const partItemId = r.partItem.id;
                    if (partItemId) {
                      try {
                        const partItemDetail = await getPartItemByIdService(partItemId);
                        if (partItemDetail?.part?.partType?.id) {
                          partTypeId = partItemDetail.part.partType.id;
                          // ✅ Cache lại nếu tìm thấy
                          if (partId && partTypeId) {
                            setPartTypeIdCache(prev => ({
                              ...prev,
                              [partId]: partTypeId
                            }));
                            console.log(`✅ Cached partTypeId from getPartItemByIdService (partItemId ${partItemId}) for partId ${partId}:`, partTypeId);
                          }
                        }
                      } catch (err) {
                        console.error(`❌ Lỗi lấy partTypeId từ getPartItemByIdService cho partItemId ${partItemId}:`, err);
                      }
                    }
                  }
                  
                  if (partTypeId) {
                    console.log("✅ Tìm thấy partTypeId:", partTypeId);
                    try {
                      await loadSuggestedParts(partTypeId);
                    } catch (err) {
                      if (err?.response?.status !== 500 && err?.statusCode !== 500) {
                        console.error("Lỗi load phụ tùng đề xuất:", err);
                      }
                    }
                  } else {
                    console.warn("❌ Không tìm thấy partTypeId cho bộ phận:", partId || r.id);
                    console.warn("🔍 Debug info:", {
                      partId,
                      partItem: r.partItem,
                      maintenanceStageDetail: r.maintenanceStageDetail,
                      cachedPartTypeId: partId ? partTypeIdCache[partId] : null
                    });
                  }
                }
              }}
              onChange={(opt) => {
                // ✅ Giá phụ tùng luôn lấy từ bộ phận có sẵn trên xe (partItem.price)
                const partItemPrice = Number(r?.partItem?.price || r?.pricePart || 0);
                
                if (!opt) {
                  handleChange(r.id, "proposedReplacePart", null);
                  handleChange(r.id, "pricePart", partItemPrice); // ✅ Giữ giá từ bộ phận có sẵn trên xe
                  return;
                }
                
                // ✅ opt.value là partId (Part template) từ options - giống repair mode
                const partId = opt?.value;
                
                // ✅ Tìm trong danh sách phụ tùng đề xuất bằng partId
                const selected = allSuggestedParts.find((p) => p.id === partId);
                
                const fullLabel = opt.label || selected?.name || "";

                // ✅ Lưu partId (Part template) vào proposedReplacePartId - giống repair mode
                handleChange(r.id, "proposedReplacePart", { value: partId, label: fullLabel });
                handleChange(r.id, "replacePartName", fullLabel);
                handleChange(r.id, "pricePart", partItemPrice); // ✅ Luôn lấy giá từ bộ phận có sẵn trên xe
              }}
              options={allSuggestedParts.map((p) => {
                // ✅ Hiển thị tên và code (Part template không có serialNumber) - giống repair mode
                const name = p.name || "";
                const code = p.code || "";
                const label = code ? `${name} (${code})` : name;
                return {
                  value: p.id, // ✅ p.id là partId (Part template)
                  label: label || p.id,
                };
              })}
              filterOption={(input, opt) =>
                opt.label.toLowerCase().includes(input.toLowerCase())
              }
              dropdownStyle={{ maxWidth: "400px" }}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "SL",
      width: 50,
      render: (_, r, i) => (
        <Input
          type='number'
          value={r.quantity}
          onChange={(e) => handleChange(r.id, "quantity", e.target.value)}
          disabled={!canEditFields}
          style={{ width: 60 }}
        />
      ),
    },
    { title: "ĐV", width: 35, render: (_, r) => r.unit || "" },
    {
      title: "Giá PT",
      width: 60,
      render: (_, r, i) => {
        if (r.remedies !== "REPLACE")
          return <span className='text-gray-400'></span>;
        return Number(r.pricePart || 0).toLocaleString();
      },
    },
    {
      title: "Giá DV",
      width: 60,
      render: (_, r, i) => Number(r.priceService || 0).toLocaleString(),
    },
    {
      title: "Tổng",
      width: 70,
      render: (_, r) =>
        r.totalAmount ? `${Number(r.totalAmount).toLocaleString()}đ` : "",
    },
    {
      title: "Trạng thái phụ tùng",
      width: 100,
      render: (_, r) => {
        // ✅ Hiển thị exportNoteStatus nếu có (không chỉ khi COMPLETED)
        const status = r.exportNoteStatus || exportNoteStatusMap[r.id];
        if (!status) return <span style={{ color: "#999" }}></span>;
        
        // ✅ Format status với Tag và màu sắc
        const getStatusColor = (s) => {
          const statusUpper = (s || "").toUpperCase();
          if (statusUpper === "COMPLETED") return "success";
          if (statusUpper === "PENDING") return "processing";
          if (statusUpper === "REJECTED" || statusUpper === "CANCELLED") return "error";
          if (statusUpper === "STOCK_NOT_FOUND") return "danger";
          if (statusUpper === "STOCK_FOUND") return "warning";
          return "default";
        };
        
        const getStatusLabel = (s) => {
          const statusUpper = (s || "").toUpperCase();
          const statusMap = {
            COMPLETED: "Đã xuất",
            PENDING: "Đang chờ",
            REJECTED: "Từ chối",
            CANCELLED: "Hủy",
            STOCK_NOT_FOUND: "Hết hàng",
            STOCK_FOUND: "Đợi xuất kho",
          };
          return statusMap[statusUpper] || s;
        };
        
        return (
          <Tag color={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Tag>
        );
      },
    },
  ];

  // Cột trạng thái sửa chữa
  const statusColumnForRepair = {
    title: (
      <div className='flex items-center gap-2'>
        {evCheckDetails.filter((d) => d.id && !hasStockIssue(d)).length > 0 && (
          <Checkbox
            checked={evCheckDetails.filter(d => !hasStockIssue(d)).every((d) => d.status === "COMPLETED")}
            indeterminate={
              evCheckDetails.filter(d => !hasStockIssue(d)).some((d) => d.status === "COMPLETED") &&
              evCheckDetails.filter(d => !hasStockIssue(d)).some((d) => d.status !== "COMPLETED")
            }
            onChange={(e) => {
              const checked = e.target.checked;
              const updated = evCheckDetails.map((item) => {
                // ✅ Chỉ cập nhật status cho item không có vấn đề kho
                if (hasStockIssue(item)) {
                  return item; // Giữ nguyên item có vấn đề kho
                }
                return {
                  ...item,
                  status: checked ? "COMPLETED" : "PENDING",
                };
              });
              setEvCheckDetails(updated);

              const changes = {};
              updated.forEach((item) => {
                // ✅ Chỉ thêm vào statusChanges nếu không có vấn đề kho
                if (item.id && checked && !hasStockIssue(item)) {
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
    width: 120,
    render: (_, r, i) => {
      const stat = REPAIR_STATUS[r.status] || REPAIR_STATUS.PENDING;
      
      // ✅ Kiểm tra trạng thái xuất kho: Nếu hết hàng hoặc chờ xuất kho thì không cho tick hoàn thành
      const isStockIssue = hasStockIssue(r);
      const isDisabled = readOnly || isStockIssue;

      return (
        <div className='flex items-center gap-2'>
          <Checkbox
            checked={r.status === "COMPLETED"}
            onChange={(e) => {
              handleChange(
                r.id,
                "status",
                e.target.checked ? "COMPLETED" : "PENDING"
              );
            }}
            disabled={isDisabled}
          />
          <Tag
            color={stat.color}
            style={{
              cursor: !isDisabled && r.status !== "COMPLETED" ? "pointer" : "default",
              fontWeight: 500,
              borderRadius: 8,
              padding: "2px 8px",
              opacity: isDisabled ? 0.6 : 1,
            }}
            onClick={() => {
              if (r.status !== "COMPLETED" && !isDisabled) {
                handleChange(r.id, "status", "COMPLETED");
              }
            }}>
            {stat.label}
          </Tag>
        </div>
      );
    },
  };

  // ✅ Row selection cho RMA (chỉ cho staff)
  const eligibleItems = evCheckDetails.filter((r) => isRMAEligible(r));
  const noEligibleItems = eligibleItems.length === 0; // ✅ Không còn items nào eligible
  const allSelectedRMAItemsHaveRMA = Array.from(selectedRMAItems).every((id) => {
    const item = evCheckDetails.find((d) => d.id === id);
    return item && hasRMA(item);
  });

  // ✅ Tự động clear selection cho các items đã có RMA sau khi reload data
  useEffect(() => {
    if (selectedRMAItems.size === 0) return; // Không cần check nếu không có selection
    
    const validSelectedKeys = Array.from(selectedRMAItems).filter((id) => {
      const item = evCheckDetails.find((d) => d.id === id);
      // ✅ Loại bỏ items đã có RMA hoặc không còn đủ điều kiện
      return item && !hasRMA(item) && isRMAEligible(item);
    });

    // ✅ Nếu có keys không hợp lệ (đã có RMA), clear chúng ngay lập tức
    if (validSelectedKeys.length !== selectedRMAItems.size) {
      console.log("🧹 Auto-clearing invalid RMA selections:", {
        before: selectedRMAItems.size,
        after: validSelectedKeys.length,
        removed: selectedRMAItems.size - validSelectedKeys.length
      });
      setSelectedRMAItems(new Set(validSelectedKeys));
    }
  }, [evCheckDetails]); // ✅ Chỉ check khi evCheckDetails thay đổi (sau khi reload)

  // ✅ Filter selectedRowKeys để chỉ hiển thị những items còn tồn tại và chưa có RMA
  const validSelectedKeys = Array.from(selectedRMAItems).filter((id) => {
    const item = evCheckDetails.find((d) => d.id === id);
    return item && !hasRMA(item) && isRMAEligible(item);
  });

  const rowSelection = readOnly ? {
    selectedRowKeys: validSelectedKeys, // ✅ Chỉ hiển thị những keys hợp lệ (chưa có RMA)
    onChange: (selectedKeys, selectedRows) => {
      if (isRMASubmitting) return; // ✅ Không cho thay đổi selection khi đang submit
      
      // ✅ Chỉ cho phép chọn những items chưa có RMA
      const validKeys = selectedKeys.filter((id) => {
        const item = evCheckDetails.find((d) => d.id === id);
        return item && !hasRMA(item) && isRMAEligible(item);
      });
      console.log("🔍 RMA Selection Changed:", { selectedKeys, validKeys, size: validKeys.length });
      setSelectedRMAItems(new Set(validKeys));
    },
    getCheckboxProps: (record) => ({
      disabled: isRMASubmitting || hasRMA(record) || !isRMAEligible(record), // ✅ Disable khi đang submit, đã có RMA hoặc không đủ điều kiện
    }),
    // ✅ Preserve selected row keys khi data thay đổi (nhưng useEffect sẽ tự động clear)
    preserveSelectedRowKeys: false, // ✅ Không preserve, để tự động clear khi items có RMA
  } : undefined;

  let columns = baseColumns;
  if (!readOnly && evCheckStatus === "REPAIR_IN_PROGRESS") {
    columns = [...columns, statusColumnForRepair];
  }
  // ✅ Bỏ cột RMA, dùng rowSelection thay thế

  return (
    <>
      {loading ? (
        <div className='flex justify-center p-10'>
          <Spin />
        </div>
      ) : (
        <>
          {/* ✅ Nút Tạo RMA ở trên bảng (chỉ cho staff) - chỉ hiện khi có items eligible được chọn */}
          {readOnly &&
            validSelectedKeys.length > 0 &&
            evCheckDetails.length > 0 && (
              <div className='flex justify-between items-center mb-4'>
                <h4 className='text-base font-semibold text-gray-700'>Danh sách hạng mục bảo dưỡng</h4>
                <Button
                  type='primary'
                  dangerproposedReplacePart
                  onClick={openRMAModal}
                  loading={isRMASubmitting}
                  disabled={
                    isRMASubmitting || // ✅ Disable khi đang submit
                    validSelectedKeys.length === 0 || // ✅ Dùng validSelectedKeys thay vì selectedRMAItems
                    allSelectedRMAItemsHaveRMA ||
                    noEligibleItems || // ✅ Disable khi không còn items nào eligible
                    evCheckStatus === "INSPECTION_COMPLETED" // Disable khi đã gửi báo giá nhưng chưa duyệt
                  }>
                  {isRMASubmitting ? "Đang tạo RMA..." : `Tạo RMA (${validSelectedKeys.length} phụ tùng)`}
                </Button>
              </div>
            )}
        <div className="repair-mode-table" style={{ width: '100%', overflow: 'hidden', maxWidth: '100%' }}>
          <Table
          key={`rma-table-${selectedRMAItems.size}`} // ✅ Force re-render khi selection thay đổi
            columns={columns}
            dataSource={evCheckDetails}
            rowKey='id'
          rowSelection={rowSelection} // ✅ Dùng rowSelection thay vì cột RMA
          scroll={{ x: false }}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize,
              }));
            },
            onShowSizeChange: (current, size) => {
              setPagination(prev => ({
                ...prev,
                current: 1,
                pageSize: size,
              }));
            },
          }}
            size='small'
            bordered
            style={{ width: '100%', maxWidth: '100%' }}
          />
        </div>

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


      {/* Modal xác nhận RMA – gom nhiều items thành 1 RMA */}
      <RMAConfirmationModal
        open={isRMAConfirmationOpen}
        onClose={() => {
          setIsRMAConfirmationOpen(false);
          setSelectedRMAItems(new Set()); // ✅ Clear selection sau khi đóng
        }}
        booking={booking}
        partsForRMA={currentRMAParts}
        onRMASuccess={async () => {
          const rmaDetailIds = currentRMAParts.map((p) => p.id);
          toast.info("Đang đồng bộ lại chi tiết EV Check...");
          await loadEVCheckDetails(); // ✅ Đợi load xong
          setSelectedRMAItems(new Set()); // ✅ Clear selection sau khi load xong
          setIsRMASubmitting(false); // ✅ Reset trạng thái submit
          setIsRMAConfirmationOpen(false);
        }}
      />
    </>
  );
}
