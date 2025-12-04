// src/components/technician/detail-content/RepairModeEVCheck.jsx
import { useState, useEffect, useCallback } from "react";
import { Table, Input, Select, Button, Spin, Tag, Checkbox, Tooltip } from "antd";
import { toast } from "@/components/ui/sonner";
import {
  fetchEVCheckDetailsServiceRe as getRepairDetailsList,
  updateEVCheckDetailService,
  updateEVCheckService,
  createEVCheckDetailService,
} from "../../../services/evcheckService.js";
import { getLaborCostByRemediesService } from "../../../services/priceserviceService.js";
import { fetchVehiclePartItems } from "../../../services/vehiclePartItemService.js";
import { getPartItemsService, getPartItemByIdService, getPartItemsByServiceCenterService } from "../../../services/partitemsService.js";
import { getExportStatusByAppointmentCodeAndPartId } from "../../../services/exportNotesService.js";
import { PlusOutlined } from "@ant-design/icons";
import RMAConfirmationModal from "../../../components/service-staff/RMAConfirmationModal";
import useEVCheckHub from "../../../hooks/useEVCheckHub.jsx";
import BatteryDataDisplay from "../BatteryDataDisplay";

const { Option } = Select;

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
  const [autoSavingItems, setAutoSavingItems] = useState(new Set()); // ✅ Track các items đang được tự động lưu

  // options Bộ phận (phụ tùng đang gắn trên xe)
  const [vehiclePartOptions, setVehiclePartOptions] = useState([]);
  const [vehiclePartLoading, setVehiclePartLoading] = useState(true);

  // options Phụ tùng thay thế (phụ tùng trong kho) - DEPRECATED, dùng partOptionsMap thay thế
  const [replacePartOptions, setReplacePartOptions] = useState([]);
  const [replacePartLoading, setReplacePartLoading] = useState(true);

  // ✅ Map phụ tùng đề xuất theo cacheKey: `${modelId}_${partTypeId}`
  const [partOptionsMap, setPartOptionsMap] = useState({});
  const [partLoading, setPartLoading] = useState(false);
  const [serviceCenterId, setServiceCenterId] = useState(null);
  // ✅ Cache partTypeId theo partId để tránh fetch lại
  const [partTypeIdCache, setPartTypeIdCache] = useState({});

  const [evCheckStatus, setEvCheckStatus] = useState(
    parentEvCheckStatus || null
  );
  const [statusChanges, setStatusChanges] = useState({});

  const [isRMAConfirmationOpen, setIsRMAConfirmationOpen] = useState(false);
  const [currentRMAParts, setCurrentRMAParts] = useState([]);
  const [selectedRMAItems, setSelectedRMAItems] = useState(new Set()); // ✅ Set các item ID đã chọn để tạo RMA
  const [isRMASubmitting, setIsRMASubmitting] = useState(false); // ✅ Track trạng thái đang tạo RMA
  
  // ✅ Map export note status theo detail ID
  const [exportNoteStatusMap, setExportNoteStatusMap] = useState({});

  // ========= WARRANTY / RMA =========
  const checkWarrantyStatus = (partItem) => {
    if (!partItem) return false;
    // ✅ Lấy từ isManufacturerWarranty thay vì tính từ ngày
    return partItem.isManufacturerWarranty === true;
  };

  // ✅ Kiểm tra item đã có RMA chưa
  const hasRMA = (row) => {
    return !!(row.rmaDetail || row.rmaDetailId || row.rmaDetail?.id);
  };

  // ✅ Kiểm tra item có bảo hành và đã gửi đi bảo hành (cần ngăn cập nhật trạng thái)
  const isWarrantyItemSent = (row) => {
    if (!checkWarrantyStatus(row?.partItem)) return false;
    
    // ✅ Nếu đã có RMA → đã gửi đi bảo hành
    if (hasRMA(row)) return true;
    
    // ✅ Nếu kết quả khác "Tốt" → đã gửi đi bảo hành (ví dụ: "Hư cần bảo hành")
    const result = (row.result || "").trim().toLowerCase();
    const isNotGood = result !== "tốt" && result !== "tot" && result !== "";
    if (isNotGood) return true;
    
    // ✅ Nếu kết quả là "Tốt" → chưa gửi đi bảo hành (chỉ bôi trơn/kiểm tra) → cho phép cập nhật
    return false;
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
    if (isRMASubmitting) return; // ✅ Không cho mở nếu đang submit
    
    const selectedItems = details.filter((d) => selectedRMAItems.has(d.id) && isRMAEligible(d));
    
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
    // ✅ Set submitting ngay khi mở modal để disable nút và checkbox
    setIsRMASubmitting(true);
  };

  // ========= LOAD PHỤ TÙNG THEO XE (BỘ PHẬN) =========
  useEffect(() => {
    const loadVehicleParts = async () => {
      setVehiclePartLoading(true);
      try {
        const vehicleId = booking?.vehicle?.id || booking?.vehicleId;

        if (!vehicleId) {
          console.warn("Không tìm thấy vehicleId trong booking");
          setVehiclePartOptions([]);
          return;
        }

        const items = await fetchVehiclePartItems({
          vehicleId,
          pageCurrent: 1,
          pageSize: 500,
        });

        console.log("🔍 RepairModeEVCheck - Raw items from API:", items);
        console.log("🔍 RepairModeEVCheck - First item structure:", items[0]);

        // ✅ Map và filter duplicate partItemId, đồng thời fetch part info nếu null
        const optionsMap = new Map();
        
        // ✅ Tạo array các promises để fetch part info cho các items có part = null
        const fetchPromises = (items || []).map(async (vpi, index) => {
          // ✅ Lấy partItem và part từ vpi
          let partItem = vpi?.partItem || {};
          let part = partItem?.part || {};

          // ✅ Nếu part là null, gọi API để lấy part info
          if (!part || Object.keys(part).length === 0) {
            try {
              console.log(`🔍 Item ${index} - part is null, calling getPartItemById for ${vpi.partItemId}`);
              const partItemDetail = await getPartItemByIdService(vpi.partItemId);
              console.log(`🔍 Item ${index} - partItemDetail from API:`, partItemDetail);
              
              // ✅ Cập nhật partItem và part từ API response
              if (partItemDetail) {
                partItem = {
                  ...partItem,
                  ...partItemDetail,
                  part: partItemDetail.part || partItem.part || null,
                };
                part = partItemDetail.part || {};
              }
            } catch (err) {
              console.error(`❌ Error fetching partItem ${vpi.partItemId}:`, err);
              // Giữ nguyên partItem hiện tại nếu lỗi
            }
          }

          // ✅ Debug từng item
          console.log(`🔍 Item ${index}:`, vpi);
          console.log(`🔍 Item ${index} - partItem:`, partItem);
          console.log(`🔍 Item ${index} - part:`, part);
          console.log(`🔍 Item ${index} - part.name:`, part?.name);
          
          // ✅ Lấy thông tin từ part hoặc partItem
          const partName = part?.name || "";
          const serial = partItem?.serialNumber || "";
          const partCode = part?.code || "";
          const price = Number(partItem?.price || 0);

          // ✅ Tạo label: ưu tiên name, nếu không có thì dùng serial/code
          let label = "";
          if (partName) {
            // Có name: hiển thị "Tên (Serial)" hoặc chỉ "Tên"
            label = serial ? `${partName} (${serial})` : partName;
          } else {
            // Không có name: dùng serial hoặc code
            label = serial || partCode || "Không rõ";
          }

          console.log(`🔍 Item ${index} - Final label:`, label);

          const partItemId = vpi.partItemId;
          const partId = part?.id || null;
          
          // ✅ Cache partTypeId từ API vehicle partitem (vpi.partItem.part.partType.id)
          if (partId && part.partType?.id) {
            setPartTypeIdCache(prev => ({
              ...prev,
              [partId]: part.partType.id
            }));
            console.log(`✅ Cached partTypeId from vehicle partitem for partId ${partId}:`, part.partType.id);
          }

          return {
            partItemId,
            value: partItemId,
            label,
            price,
            partItem, // để check bảo hành (đã có part nếu fetch được)
            partId, // ✅ Lưu partId để dùng sau
          };
        });

        // ✅ Đợi tất cả promises hoàn thành
        const resolvedOptions = await Promise.all(fetchPromises);

        // ✅ Loại bỏ duplicate bằng Map
        resolvedOptions.forEach((option) => {
          const partItemId = option.partItemId;
          
          // ✅ Nếu đã có partItemId này rồi, chỉ update nếu có thông tin tốt hơn (có part.name)
          if (optionsMap.has(partItemId)) {
            const existing = optionsMap.get(partItemId);
            // Chỉ update nếu item mới có part.name mà item cũ không có
            if (option.partItem?.part?.name && !existing.partItem?.part?.name) {
              optionsMap.set(partItemId, option);
            }
          } else {
            // ✅ Thêm mới vào map
            optionsMap.set(partItemId, option);
          }
        });

        // ✅ Convert map thành array (loại bỏ duplicate)
        const options = Array.from(optionsMap.values());

        console.log("✅ Vehicle part options (after dedupe):", options);
        console.log(`✅ Total unique options: ${options.length} (from ${items?.length || 0} items)`);
        setVehiclePartOptions(options);
      } catch (err) {
        console.error("Không load được phụ tùng xe:", err);
        toast.error("Không tải được phụ tùng gắn trên xe!");
        setVehiclePartOptions([]);
      } finally {
        setVehiclePartLoading(false);
      }
    };

    loadVehicleParts();
  }, [booking?.vehicle, booking?.vehicleId]);

  // ========= LOAD PHỤ TÙNG ĐỀ XUẤT (theo modelId và partTypeId) =========
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
      // ✅ Gọi API mới với modelId và partTypeId
      // GET /api/v1/parts/by-model-and-type?model={modelId}&partTypeId={partTypeId}
      const { getPartsByModelAndTypeService } = await import("../../../services/partitemsService");
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
        toast.error("Không tải được danh sách phụ tùng đề xuất");
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

  // ✅ Load serviceCenterId từ booking khi component mount
  useEffect(() => {
    const centerId = 
      booking?.serviceCenterId || 
      booking?.serviceCenter?.id || 
      null;
    if (centerId) {
      setServiceCenterId(centerId);
    }
  }, [booking?.serviceCenterId, booking?.serviceCenter?.id]);

  // ✅ Load phụ tùng khi có serviceCenterId
  useEffect(() => {
    if (serviceCenterId) {
      loadSuggestedParts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceCenterId]);

  // ========= LOAD PHỤ TÙNG KHO (PHỤ TÙNG THAY THẾ) - DEPRECATED =========
  // Giữ lại để tương thích, nhưng sẽ dùng partOptionsMap thay thế
  useEffect(() => {
    const loadReplaceParts = async () => {
      setReplacePartLoading(true);
      try {
        // lấy kho từ user login (technician)
        const staffRaw = localStorage.getItem("user");
        const staff = staffRaw ? JSON.parse(staffRaw) : null;
        const serviceCenterInventoryId = staff?.serviceCenterInventoryId;

        const data = await getPartItemsService({
          serviceCenterInventoryId, // 👈 lọc theo kho
          status: "ACTIVE",
          page: 1,
          pageSize: 500,
        });

        const options = (data || []).map((p) => ({
          value: p.partItemId,
          partItemId: p.partItemId,
          label: p.label,
          price: p.price,
        }));

        console.log("Replace part options:", options);
        setReplacePartOptions(options);
      } catch (err) {
        console.error("Không load được phụ tùng kho:", err);
        toast.error("Không tải được phụ tùng trong kho!");
        setReplacePartOptions([]);
      } finally {
        setReplacePartLoading(false);
      }
    };

    loadReplaceParts();
  }, []);

  // ========= HÀM TẠO DÒNG TRỐNG =========
  const createEmptyRow = () => ({
    id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    partItemId: "",
    displayName: "",
    proposedReplacePartId: "",
    replacePartName: "",
    result: "Tốt", // ✅ Mặc định "Tốt"
    remedies: "NONE",
    pricePart: 0,
    priceService: 0,
    totalAmount: 0,
    quantity: 1,
    unit: "cái",
    isNew: true,
  });

  // ========= UPDATE GIÁ CÔNG =========
  const updatePriceService = async (index, remedies, rowData = null) => {
    // ✅ Cập nhật: Lấy giá dịch vụ cho CHECK, REPAIR, REPLACE
    // NONE (Bôi trơn) không có giá dịch vụ
    if (!["CHECK", "REPAIR", "REPLACE"].includes(remedies)) {
      updateRow(index, { priceService: 0 });
      return;
    }
    
    // ✅ Lấy row data từ tham số hoặc từ state
    const currentRow = rowData || details[index];
    if (!currentRow) {
      console.warn(`❌ Không tìm thấy row tại index ${index}`);
      updateRow(index, { priceService: 0 });
      return;
    }
    
    // ✅ Lấy partTypeId từ cache hoặc từ partItem
    const partId = currentRow?.partItem?.part?.id || null;
    let partTypeId = null;
    
    // ✅ Ưu tiên 1: Lấy từ _partTypeId nếu có (đã được set khi chọn partItem)
    if (currentRow?._partTypeId) {
      partTypeId = currentRow._partTypeId;
      console.log(`🔍 [updatePriceService] partTypeId from rowData._partTypeId: ${partTypeId}`);
    }
    
    // ✅ Ưu tiên 2: Lấy từ cache nếu có partId
    if (!partTypeId && partId) {
      partTypeId = partTypeIdCache[partId] || null;
      console.log(`🔍 [updatePriceService] partId: ${partId}, partTypeId from cache: ${partTypeId}`);
    }
    
    // ✅ Ưu tiên 3: Lấy từ partItem
    if (!partTypeId) {
      partTypeId = currentRow?.partItem?.part?.partType?.id || null;
      console.log(`🔍 [updatePriceService] partTypeId from partItem: ${partTypeId}`);
    }
    
    if (!partTypeId) {
      console.warn(`❌ Không tìm thấy partTypeId cho bộ phận tại index ${index}, partId: ${partId}`);
      updateRow(index, { priceService: 0 });
      return;
    }
    
    console.log(`💰 [updatePriceService] Đang lấy giá dịch vụ cho partTypeId: ${partTypeId}, remedies: ${remedies}`);
    
    try {
      const cost = await getLaborCostByRemediesService(partTypeId, remedies);
      console.log(`✅ [updatePriceService] Đã lấy được giá dịch vụ: ${cost} cho partTypeId: ${partTypeId}, remedies: ${remedies}`);
      updateRow(index, { priceService: Number(cost || 0) });
    } catch (e) {
      console.error("❌ Lỗi khi lấy giá dịch vụ:", e);
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

  // ========= LOAD EV CHECK DETAIL =========
  const loadRepairDetails = useCallback(async () => {
    if (!evCheckId || forceEmpty) return;
    setLoading(true);
    try {
      const res = await getRepairDetailsList(evCheckId);

      console.log("🔍 loadRepairDetails - Full response:", res);

      let rawDetails = [];
      let statusValue = null;

      // ✅ Lấy status từ response (service đã trả về status)
      if (Array.isArray(res?.evCheckDetails)) {
        rawDetails = res.evCheckDetails;
        statusValue = res.status || null; // ✅ Service đã trả về status
      } else if (Array.isArray(res?.rowDatas) && res.rowDatas.length > 0) {
        rawDetails = res.rowDatas[0].evCheckDetails || [];
        statusValue = res.rowDatas[0].status || res.status || null;
      } else if (res?.data) {
        // Nếu có res.data
        if (Array.isArray(res.data?.evCheckDetails)) {
          rawDetails = res.data.evCheckDetails;
          statusValue = res.data.status || res.status || null;
        } else if (Array.isArray(res.data?.rowDatas) && res.data.rowDatas.length > 0) {
          rawDetails = res.data.rowDatas[0].evCheckDetails || [];
          statusValue = res.data.rowDatas[0].status || res.data.status || res.status || null;
        }
      } else if (Array.isArray(res)) {
        rawDetails = res;
      }

      console.log("🔍 loadRepairDetails - statusValue from BE:", statusValue);

      rawDetails = rawDetails.filter((item) => item != null);

      console.log(
        "DEBUG: Dữ liệu thô EV Check Detail (rawDetails):",
        rawDetails
      );

      // ✅ Không cần lấy allSuggestedParts ở đây vì đã đổi sang dùng cacheKey theo modelId_partTypeId
      // Khi reload, sẽ lấy replacePartName từ item.replacePart object hoặc gọi API

      const mapped = await Promise.all(
        rawDetails.map(async (item) => {
        const partItemId = item.partItem?.id || item.partItemId || "";
        const replacePartId = item.proposedReplacePart?.id || item.proposedReplacePartId || "";

        const partOption = vehiclePartOptions.find(
          (p) => p.partItemId === partItemId
        );
          
          // ✅ Tìm replacePartName từ proposedReplacePart object (Part template, không phải PartItem)
          let replacePartName = "";
          if (replacePartId) {
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
                const partDetailRes = await getPartById(replacePartId);
                const partDetail = partDetailRes?.data?.data || partDetailRes?.data || partDetailRes;
                const partName = partDetail?.name || "";
                const code = partDetail?.code || "";
                replacePartName = code ? `${partName} (${code})` : (partName || "");
                console.log(`✅ Load replacePartName từ getPartById: ${replacePartName}`);
              } catch (err) {
                console.error(`❌ Lỗi lấy thông tin phụ tùng ${replacePartId}:`, err);
                // ✅ Không fallback về ID, để trống để sau đó load lại khi mở dropdown
                replacePartName = "";
              }
            }
          }

        const currentStatus = item.status || "PENDING";
        const normalizedStatus =
          currentStatus === "INPROGRESS" ? "IN_PROGRESS" : currentStatus;

          // ✅ Tìm export note status theo appointmentCode và proposedPartId (API mới)
          let exportNoteStatus = null;
          const appointmentCode = booking?.code || null;
          if (replacePartId && appointmentCode) {
            try {
              exportNoteStatus = await getExportStatusByAppointmentCodeAndPartId(appointmentCode, replacePartId);
              console.log(`🔍 Detail ${item.id} - appointmentCode: ${appointmentCode}, proposedPartId: ${replacePartId}, exportNoteStatus:`, exportNoteStatus);
            } catch (err) {
              console.error(`❌ Lỗi tìm export note status cho appointmentCode ${appointmentCode}, proposedPartId ${replacePartId}:`, err);
            }
          }

        // ✅ Giá phụ tùng lấy từ bộ phận có sẵn trên xe (partItem), không lấy từ phụ tùng thay thế
        const partItemForPrice = item.partItem || partOption?.partItem || null;
        const pricePart = Number(partItemForPrice?.price || item.pricePart || 0);
        
        // ✅ Cache partTypeId ngay khi load data - ưu tiên từ vehiclePartOptions (đã được load và cache sẵn)
        const partIdFromItem = partItemForPrice?.part?.id || partOption?.partId || null;
        let partTypeIdFromItem = 
          partItemForPrice?.part?.partType?.id || 
          partOption?.partItem?.part?.partType?.id || 
          null;
        
        // ✅ Nếu không có partTypeId từ item/option, thử lấy từ cache
        if (!partTypeIdFromItem && partIdFromItem) {
          partTypeIdFromItem = partTypeIdCache[partIdFromItem] || null;
        }
        
        // ✅ Nếu vẫn không có, thử lấy từ vehiclePartOptions bằng partItemId
        if (!partTypeIdFromItem && partItemId) {
          const vehiclePartOption = vehiclePartOptions.find(p => p.partItemId === partItemId);
          if (vehiclePartOption) {
            partTypeIdFromItem = vehiclePartOption?.partItem?.part?.partType?.id || null;
            // Lấy partId từ vehiclePartOption nếu chưa có
            const partIdFromOption = vehiclePartOption?.partId || vehiclePartOption?.partItem?.part?.id || null;
            if (partIdFromOption && partTypeIdFromItem) {
              setPartTypeIdCache(prev => ({
                ...prev,
                [partIdFromOption]: partTypeIdFromItem
              }));
            }
          }
        }
        
        // ✅ Cache partTypeId nếu có cả partId và partTypeId
        if (partIdFromItem && partTypeIdFromItem) {
          setPartTypeIdCache(prev => {
            // ✅ Chỉ set nếu chưa có trong cache
            if (prev[partIdFromItem]) return prev;
            return {
              ...prev,
              [partIdFromItem]: partTypeIdFromItem
            };
          });
          console.log(`✅ Cached partTypeId for partId ${partIdFromItem}:`, partTypeIdFromItem);
        }

        return {
          ...item,
          partItemId,
          displayName: partOption?.label || partItemId || "",
          partItem: partItemForPrice,
          proposedReplacePartId: replacePartId,
            replacePartName: replacePartName || "", // ✅ Không fallback về ID, chỉ dùng name
            result: item.result ?? "Tốt", // ✅ Mặc định "Tốt"
          remedies: item.remedies || "NONE",
          pricePart: pricePart,
          priceService: Number(item.priceService || 0),
          totalAmount: Number(item.totalAmount || 0),
          quantity: Number(item.quantity || 1),
          unit: item.unit || "cái",
          status: normalizedStatus,
            exportNoteStatus, // ✅ Lưu export note status
          isNew: false,
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

      console.log("DEBUG: mapped details:", mapped);

      if (mapped.length > 0) {
        setDetails(mapped);
        toast.success(`Đã tải ${mapped.length} hạng mục từ DB.`);
        
        // ✅ Tự động gọi giá dịch vụ cho các items có remedies là CHECK, REPAIR hoặc REPLACE
        mapped.forEach((row, index) => {
          if (
            (!row.priceService || Number(row.priceService) === 0) &&
            ["CHECK", "REPAIR", "REPLACE"].includes(row.remedies) &&
            row.partItem
          ) {
            // ✅ Truyền row data vào để có thể lấy partTypeId
            updatePriceService(index, row.remedies, row);
          }
        });
      } else {
        setDetails(readOnly ? [] : [createEmptyRow()]);
      }

      // ✅ Cập nhật status từ BE, ưu tiên status từ BE hơn status hiện tại
      if (statusValue) {
        console.log("🔍 loadRepairDetails - Setting status from BE:", statusValue);
        setEvCheckStatus(statusValue);
      } else if (parentEvCheckStatus) {
        console.log("🔍 loadRepairDetails - Using parentEvCheckStatus:", parentEvCheckStatus);
        setEvCheckStatus(parentEvCheckStatus);
      } else {
        console.log("🔍 loadRepairDetails - No status found, keeping current:", evCheckStatus);
        // Giữ nguyên status hiện tại nếu không có từ BE và không có từ parent
      }

      setStatusChanges({});
    } catch (err) {
      console.error("❌ Lỗi khi tải chi tiết EV Check:", err);
      toast.error("Không thể tải dữ liệu chi tiết!");
      setDetails(readOnly ? [] : [createEmptyRow()]);
    } finally {
      setLoading(false);
    }
  }, [
    evCheckId,
    forceEmpty,
    vehiclePartOptions,
    replacePartOptions,
    readOnly,
    parentEvCheckStatus,
  ]);

  useEffect(() => {
    // chỉ load khi cả 2 list phụ tùng đã xong
    if (
      evCheckId &&
      !forceEmpty &&
      !vehiclePartLoading &&
      !replacePartLoading
    ) {
      loadRepairDetails();
    } else if (forceEmpty && details.length === 0) {
      setDetails([createEmptyRow()]);
    }
  }, [
    evCheckId,
    forceEmpty,
    vehiclePartLoading,
    replacePartLoading,
    loadRepairDetails,
  ]);

  // ✅ Kết nối SignalR để nhận real-time updates
  const handleSignalRUpdate = useCallback(() => {
    console.log("🔄 SignalR update received, reloading EVCheck details...");
    // Reload data khi nhận được update từ SignalR
    if (evCheckId && !forceEmpty && !vehiclePartLoading && !replacePartLoading) {
      loadRepairDetails();
      // Gọi onRefresh nếu có
      if (onRefresh) {
        onRefresh();
      }
    }
  }, [evCheckId, forceEmpty, vehiclePartLoading, replacePartLoading, loadRepairDetails, onRefresh]);

  useEVCheckHub(evCheckId, handleSignalRUpdate);

  // ========= CONTROL FLAG =========
  // ✅ Chỉ cho phép sửa khi vừa vào làm EVCheck (chưa gửi báo giá)
  // Sau khi gửi báo giá (INSPECTION_COMPLETED) thì disable hết các trường (trừ cột Trạng thái)
  const canEditFields =
    !readOnly &&
    evCheckStatus !== "INSPECTION_COMPLETED" &&
    evCheckStatus !== "QUOTE_APPROVED" &&
    evCheckStatus !== "REPAIR_IN_PROGRESS" &&
    evCheckStatus !== "REPAIR_COMPLETED" &&
    evCheckStatus !== "COMPLETED";
  
  // ✅ Cho phép thay đổi cột Trạng thái:
  // - Cho sửa khi chưa gửi báo giá (để set trạng thái ban đầu)
  // - KHÔNG cho sửa khi mới gửi báo giá (INSPECTION_COMPLETED) - chờ duyệt
  // - Cho sửa khi đã được duyệt (QUOTE_APPROVED) hoặc đang sửa chữa (REPAIR_IN_PROGRESS)
  // - Không cho sửa khi đã hoàn thành
  const canEditStatus =
    !readOnly &&
    evCheckStatus !== "INSPECTION_COMPLETED" && // ✅ Không cho sửa khi mới gửi báo giá (chờ duyệt)
    evCheckStatus !== "REPAIR_COMPLETED" &&
    evCheckStatus !== "COMPLETED";

  // ✅ Tự động lưu các hạng mục pin khi đã có đủ thông tin
  useEffect(() => {
    if (!canEditFields || loading || !evCheckId) return;

    const autoSaveBatteryItems = async () => {
      for (let i = 0; i < details.length; i++) {
        const item = details[i];
        if (!item || !item.partItemId) continue;
        
        // ✅ Kiểm tra nếu đang được lưu hoặc đã có ID thật thì bỏ qua
        const itemKey = `${item.partItemId}-${item.remedies}`;
        if (autoSavingItems.has(itemKey) || (item.id && !item.id.startsWith("temp_"))) {
          continue;
        }
        
        // ✅ Kiểm tra nếu là pin
        const partName = item.partItem?.part?.name || item.displayName || "";
        const partCode = item.partItem?.part?.code || "";
        const partNameLower = partName.toLowerCase();
        const partCodeLower = partCode.toLowerCase();
        const isBattery = 
          partNameLower.includes("pin") || 
          partNameLower.includes("lfp") ||
          partNameLower.includes("lithium") ||
          partNameLower.includes("battery") ||
          partNameLower.includes("ắc quy") ||
          partCodeLower.includes("pin") ||
          partCodeLower.includes("lfp");
        
        // ✅ Tự động lưu nếu: là pin + có partItemId + có remedies + chưa có ID thật
        if (isBattery && item.remedies) {
          console.log("🔋 [RepairMode] Auto-saving battery item:", i);
          setAutoSavingItems(prev => new Set(prev).add(itemKey));
          try {
            await saveSingleItem(i, true); // silent = true
          } finally {
            // ✅ Xóa flag sau 2 giây để có thể lưu lại nếu cần
            setTimeout(() => {
              setAutoSavingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemKey);
                return newSet;
              });
            }, 2000);
          }
        }
      }
    };

    // ✅ Chỉ chạy khi details thay đổi và có ít nhất 1 item
    if (details.length > 0) {
      const timer = setTimeout(() => {
        autoSaveBatteryItems();
      }, 1500); // Delay 1.5 giây để tránh lưu quá nhiều lần

      return () => clearTimeout(timer);
    }
  }, [details, canEditFields, loading, evCheckId]); // Chỉ chạy khi details, canEditFields, loading hoặc evCheckId thay đổi

  const handleChange = (index, field, value) => {
    // ✅ Cho phép thay đổi status nếu canEditStatus = true
    if (field === "status") {
      if (!canEditStatus) return;
      
      // ✅ Ngăn cập nhật trạng thái khi item có bảo hành và đã gửi đi bảo hành
      // - Nếu có RMA → đã gửi đi bảo hành
      // - Nếu kết quả khác "Tốt" → đã gửi đi bảo hành (ví dụ: "Hư cần bảo hành")
      // - Nếu kết quả là "Tốt" → chưa gửi đi bảo hành (chỉ bôi trơn/kiểm tra) → vẫn cho cập nhật
      const currentRow = details[index];
      if (isWarrantyItemSent(currentRow)) {
        toast.error("Không thể cập nhật trạng thái cho bộ phận đã gửi đi bảo hành.");
        return;
      }
    } else {
      // ✅ Các trường khác chỉ cho phép sửa khi canEditFields = true
      if (evCheckStatus === "INSPECTION_COMPLETED") return;
      if (evCheckStatus === "QUOTE_APPROVED") return;
      if (!canEditFields) return;
    }

    // ✅ Ngăn chọn REPLACE hoặc REPAIR khi còn bảo hành
    if (field === "remedies" && (value === "REPLACE" || value === "REPAIR")) {
      const currentRow = details[index];
      if (checkWarrantyStatus(currentRow?.partItem)) {
        toast.error(
          "Bộ phận đang trong thời gian bảo hành. Chỉ cho phép 'Kiểm tra' hoặc 'Bôi trơn'."
        );
        return; // Không cho thay đổi
      }
    }

    // ✅ Lấy row hiện tại trước khi update
    const currentRow = details[index];
    
    updateRow(index, { [field]: value });

    // ✅ Khi chọn lại cột Phụ tùng, reset cột Phụ tùng thay thế
    if (field === "partItemId") {
      updateRow(index, {
        proposedReplacePartId: "",
        replacePartName: "",
      });
    }

    if (field === "remedies") {
      if (value !== "REPLACE") {
        updateRow(index, {
          pricePart: 0,
          proposedReplacePartId: "",
          replacePartName: "",
        });
      }
      // ✅ Truyền row data đã được update vào updatePriceService
      const updatedRow = { ...currentRow, [field]: value };
      updatePriceService(index, value, updatedRow);
      
      // ✅ Tự động lưu nếu là pin và chưa có ID thật
      const partName = currentRow?.partItem?.part?.name || currentRow?.displayName || "";
      const partCode = currentRow?.partItem?.part?.code || "";
      const partNameLower = partName.toLowerCase();
      const partCodeLower = partCode.toLowerCase();
      const isBattery = 
        partNameLower.includes("pin") || 
        partNameLower.includes("lfp") ||
        partNameLower.includes("lithium") ||
        partNameLower.includes("battery") ||
        partNameLower.includes("ắc quy") ||
        partCodeLower.includes("pin") ||
        partCodeLower.includes("lfp");
      
      if (isBattery && currentRow?.partItemId && (!currentRow?.id || currentRow?.id.startsWith("temp_"))) {
        // ✅ Tự động lưu sau một chút delay để đảm bảo state đã cập nhật
        setTimeout(async () => {
          await saveSingleItem(index, true); // silent = true
        }, 500);
      }
    }

    if (field === "status") {
      const detailId = details[index]?.id;
      if (detailId) {
        setStatusChanges((prev) => ({ ...prev, [detailId]: value }));
      }
    }
  };

  const addExtraRow = () => setDetails((prev) => [...prev, createEmptyRow()]);

  // ========= SAVE SINGLE ITEM (Tự động lưu một hạng mục) =========
  const saveSingleItem = async (index, silent = false) => {
    const item = details[index];
    if (!item || !item.partItemId) {
      if (!silent) toast.warning("Vui lòng chọn Bộ phận trước.");
      return null;
    }

    if (!item.remedies) {
      if (!silent) toast.warning("Vui lòng chọn Biện pháp!");
      return null;
    }

    if (!evCheckId) {
      if (!silent) toast.error("Thiếu EVCheckId!");
      return null;
    }

    // ✅ Kiểm tra nếu đã có ID thật thì không cần lưu lại
    if (item.id && !item.id.startsWith("temp_")) {
      return item.id;
    }

    try {
      const payload = {
        partItemId: item.partItemId,
        result: (item.result || "").trim() || "Tốt",
        remedies: item.remedies ?? "NONE",
        quantity: Number(item.quantity || 1),
        unit: item.unit || "cái",
        pricePart: Number(item.pricePart || 0),
        priceService: Number(item.priceService || 0),
        totalAmount: Number(item.totalAmount || 0),
        status: item.status || "PENDING",
      };

      if (item.remedies === "REPLACE" && item.proposedReplacePartId) {
        payload.proposedReplacePartId = item.proposedReplacePartId;
      }

      if (item.isNew) {
        payload.evCheckId = evCheckId;
        const result = await createEVCheckDetailService(payload);
        // Reload để lấy ID thật
        await loadRepairDetails();
        return result?.data?.id || result?.id;
      } else {
        await updateEVCheckDetailService(item.id, payload);
        return item.id;
      }
    } catch (err) {
      console.error("Lỗi khi lưu hạng mục:", err);
      if (!silent) toast.error("Không thể lưu hạng mục!");
      return null;
    }
  };

  // ========= SAVE ALL (GỬI BÁO GIÁ) =========
  const saveAll = async () => {
    // ✅ Ngăn bấm nhiều lần khi đang loading
    if (loading) return;

    const itemsToSave = details.filter((item) => item.partItemId);

    if (itemsToSave.length === 0) {
      return toast.warning("Vui lòng chọn Bộ phận.");
    }

    for (const item of itemsToSave) {
      if (!item.remedies) return toast.warning("Vui lòng chọn Biện pháp!");

      // ✅ Nếu còn bảo hành, không cho chọn REPLACE hoặc REPAIR
      if ((item.remedies === "REPLACE" || item.remedies === "REPAIR") && checkWarrantyStatus(item.partItem)) {
        return toast.error(
          "Bộ phận đang trong thời gian bảo hành. Chỉ cho phép 'Kiểm tra' hoặc 'Bôi trơn'."
        );
      }

      // Nếu REPLACE nhưng không có proposedReplacePartId -> báo lỗi FE, không call BE
      if (item.remedies === "REPLACE" && !item.proposedReplacePartId) {
        toast.error(
          "Vui lòng chọn Phụ tùng thay thế cho hạng mục cần thay thế."
        );
        return;
      }

      if (
        ["REPAIR", "REPLACE"].includes(item.remedies) &&
        !item.result?.trim()
      ) {
        return toast.warning("Vui lòng nhập Kết quả!");
      }
    }

    if (!evCheckId) return toast.error("Thiếu EVCheckId!");

    try {
      setLoading(true);
      const loadingToast = toast.loading("Đang lưu hạng mục sửa chữa...");

      for (const item of itemsToSave) {
        const payload = {
          partItemId: item.partItemId,
          result: (item.result || "").trim() || "Tốt", // ✅ Nếu rỗng thì mặc định "Tốt"
          remedies: item.remedies ?? "NONE",
          quantity: Number(item.quantity || 1),
          unit: item.unit || "cái",
          pricePart: Number(item.pricePart || 0),
          priceService: Number(item.priceService || 0),
          totalAmount: Number(item.totalAmount || 0),
          status: item.status || "PENDING",
        };

        if (item.remedies === "REPLACE" && item.proposedReplacePartId) {
          payload.proposedReplacePartId = item.proposedReplacePartId;
        }

        if (item.isNew) {
          // Tạo mới
          payload.evCheckId = evCheckId;
          await createEVCheckDetailService(payload);
        } else {
          // Update
          await updateEVCheckDetailService(item.id, payload);
        }
      }

      // Cập nhật status EVCheck
      await updateEVCheckService(evCheckId, { status: "INSPECTION_COMPLETED" });

      // ✅ Set status trước khi reload để đảm bảo UI cập nhật ngay
      setEvCheckStatus("INSPECTION_COMPLETED");
      
      toast.dismiss(loadingToast);
      toast.success("Gửi báo giá thành công!");

      // Reload để lấy id thật
      await loadRepairDetails();
      
      // ✅ Đảm bảo status vẫn là INSPECTION_COMPLETED sau khi reload
      setEvCheckStatus("INSPECTION_COMPLETED");
    } catch (err) {
      console.error("Lỗi khi lưu EV Check Detail:", err);
      toast.dismiss(loadingToast);
      toast.error("Không thể lưu hạng mục sửa chữa!");
    } finally {
      setLoading(false);
    }
  };

  // ========= XÁC NHẬN SỬA CHỮA =========
  const handleConfirmRepair = async () => {
    // ✅ Ngăn bấm nhiều lần khi đang loading
    if (loading) return;

    if (!Object.keys(statusChanges).length) {
      return toast.info("Chưa có thay đổi trạng thái nào để lưu.");
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading("Đang cập nhật trạng thái hạng mục...");

      // ✅ Lọc bỏ các item đã gửi đi bảo hành khỏi statusChanges trước khi cập nhật
      const filteredStatusChanges = {};
      for (const [detailId, newStatus] of Object.entries(statusChanges)) {
        const detail = details.find(d => d.id === detailId);
        // ✅ Bỏ qua item đã gửi đi bảo hành (có RMA hoặc kết quả khác "Tốt")
        if (detail && isWarrantyItemSent(detail)) {
          console.log(`⚠️ Bỏ qua cập nhật trạng thái cho detail ${detailId} (đã gửi đi bảo hành)`);
          continue;
        }
        filteredStatusChanges[detailId] = newStatus;
      }

      // ✅ Nếu không còn item nào để cập nhật
      if (!Object.keys(filteredStatusChanges).length) {
        toast.dismiss(loadingToast);
        toast.warning("Không có item nào được cập nhật. Các item đã gửi đi bảo hành không thể cập nhật trạng thái.");
        return;
      }

      // ✅ Cập nhật từng detail (chỉ những item không có bảo hành)
      for (const [detailId, newStatus] of Object.entries(filteredStatusChanges)) {
        console.log(`📤 Cập nhật detail ${detailId} với status: ${newStatus}`);
        await updateEVCheckDetailService(detailId, { status: newStatus });
      }

      toast.dismiss(loadingToast);
      toast.success("Cập nhật trạng thái thành công!");
      
      // ✅ Clear statusChanges trước khi reload
      setStatusChanges({});

      // ✅ Reload lại data từ BE
      await loadRepairDetails();

      // ✅ Kiểm tra lại từ data mới reload được (gọi trực tiếp API)
      const res = await getRepairDetailsList(evCheckId);
      let rawDetails = [];
      
      if (Array.isArray(res?.evCheckDetails)) {
        rawDetails = res.evCheckDetails;
      } else if (Array.isArray(res?.rowDatas) && res.rowDatas.length > 0) {
        rawDetails = res.rowDatas[0].evCheckDetails || [];
      } else if (res?.data) {
        if (Array.isArray(res.data?.evCheckDetails)) {
          rawDetails = res.data.evCheckDetails;
        } else if (Array.isArray(res.data?.rowDatas) && res.data.rowDatas.length > 0) {
          rawDetails = res.data.rowDatas[0].evCheckDetails || [];
        }
      } else if (Array.isArray(res)) {
        rawDetails = res;
      }

      rawDetails = rawDetails.filter((item) => item != null);

      // ✅ Kiểm tra xem tất cả detail đã COMPLETED chưa
      const allCompleted = rawDetails.length > 0 && rawDetails.every(
        (d) => d.status === "COMPLETED"
      );

      console.log(`🔍 Kiểm tra hoàn thành: ${rawDetails.length} details, allCompleted: ${allCompleted}`);
      console.log(`🔍 Status của từng detail:`, rawDetails.map(d => ({ id: d.id, status: d.status })));

      if (allCompleted) {
        console.log(`📤 Cập nhật EVCheck ${evCheckId} thành REPAIR_COMPLETED`);
        await updateEVCheckService(evCheckId, { status: "REPAIR_COMPLETED" });
        setEvCheckStatus("REPAIR_COMPLETED");
        toast.success("Đã hoàn thành tất cả hạng mục sửa chữa!");
      }

      onRefresh?.();
    } catch (err) {
      console.error("❌ Cập nhật trạng thái thất bại:", err);
      console.error("❌ Error details:", err.response?.data || err.message);
      toast.dismiss(loadingToast);
      toast.error("Không thể cập nhật trạng thái hạng mục!");
    } finally {
      setLoading(false);
    }
  };

  // ========= CỘT TABLE =========
  const baseColumns = [
    { title: "STT", render: (_, __, i) => i + 1, width: 35, align: "center" },
    {
      title: "Bộ phận",
      width: 120,
      ellipsis: {
        showTitle: false,
      },
      render: (_, r, i) => {
        const displayName = r.displayName || "";
        return (
          <Tooltip title={displayName} placement="topLeft">
        <Select
          showSearch
          placeholder='Chọn bộ phận'
          value={r.partItemId || undefined}
          onChange={(v) => {
            const sel = vehiclePartOptions.find((p) => p.partItemId === v);
            const partItem = sel?.partItem;
            const part = partItem?.part || {};
            const partId = sel?.partId || part?.id || null;

            handleChange(i, "partItemId", v);

            // ✅ Cache partTypeId nếu có và chưa có trong cache
            let partTypeId = null;
            if (partId) {
              // Ưu tiên lấy từ cache
              partTypeId = partTypeIdCache[partId] || null;
              
              // Nếu không có trong cache, lấy từ part
              if (!partTypeId && part?.partType?.id) {
                partTypeId = part.partType.id;
                // Cache lại để dùng sau
                setPartTypeIdCache(prev => ({
                  ...prev,
                  [partId]: partTypeId
                }));
                console.log(`✅ Cached partTypeId when selecting partItem: partId=${partId}, partTypeId=${partTypeId}`);
              }
            }

            // nếu bộ phận đang BHH thì clear phụ tùng thay thế
            const isWarranty = checkWarrantyStatus(partItem);

            // ✅ Giá phụ tùng lấy từ bộ phận có sẵn trên xe (partItem.price)
            const partPrice = Number(partItem?.price || 0);

            // ✅ Đảm bảo partItem có đầy đủ thông tin part và partType
            const enrichedPartItem = partItem ? {
              ...partItem,
              part: part || partItem.part || null
            } : null;

            const updatedRow = {
              displayName: sel?.label || "",
              pricePart: partPrice,
              partItem: enrichedPartItem,
              ...(isWarranty
                ? {
                    replacePartId: "",
                    replacePartName: "",
                    pricePart: partPrice, // ✅ Vẫn giữ giá từ partItem
                  }
                : {}),
            };
            
            updateRow(i, updatedRow);
            
            // ✅ Tự động gọi giá dịch vụ nếu remedies đã là CHECK, REPAIR hoặc REPLACE
            const currentRemedies = details[i]?.remedies || "NONE";
            if (["CHECK", "REPAIR", "REPLACE"].includes(currentRemedies)) {
              // ✅ Tạo row data mới với partItem vừa chọn, đảm bảo có partTypeId
              const rowDataWithNewPartItem = { 
                ...details[i], 
                ...updatedRow,
                // ✅ Đảm bảo có partTypeId để updatePriceService có thể dùng
                _partTypeId: partTypeId || part?.partType?.id || null
              };
              updatePriceService(i, currentRemedies, rowDataWithNewPartItem);
            }
          }}
          options={vehiclePartOptions}
          loading={vehiclePartLoading}
          disabled={readOnly || !canEditFields}
              style={{ width: "100%", maxWidth: "100%" }}
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
      title: "Hình ảnh",
      width: 50,
      align: "center",
      render: (_, r) => {
        // ✅ Lấy image từ partItem.part.image hoặc từ vehiclePartOptions
        const imageUrl = 
          r.partItem?.part?.image || 
          vehiclePartOptions.find((p) => p.partItemId === r.partItemId)?.partItem?.part?.image ||
          null;

        if (imageUrl) {
          return (
            <div className='relative w-12 h-12'>
              <img
                src={imageUrl}
                alt={r.partItem?.part?.name || "Part image"}
                className='w-12 h-12 object-cover rounded border'
                onError={(e) => {
                  // Nếu lỗi load ảnh, ẩn img và hiển thị placeholder
                  e.target.style.display = "none";
                  const placeholder = e.target.parentElement.querySelector(".image-placeholder");
                  if (placeholder) {
                    placeholder.style.display = "flex";
                  }
                }}
              />
              <div className='image-placeholder w-12 h-12 bg-gray-100 rounded border border-dashed text-xs text-gray-400 flex items-center justify-center' style={{ display: "none" }}>
                NA
              </div>
            </div>
          );
        }

        return (
        <div className='w-12 h-12 bg-gray-100 rounded border border-dashed text-xs text-gray-400 flex items-center justify-center'>
          NA
        </div>
        );
      },
    },
    {
      title: "Kết quả",
      width: 120,
      render: (_, r, i) => {
        // ✅ Kiểm tra nếu bộ phận là PIN (kiểm tra nhiều trường hợp)
        const partName = r.partItem?.part?.name || r.displayName || "";
        const partCode = r.partItem?.part?.code || "";
        const partNameLower = partName.toLowerCase();
        const partCodeLower = partCode.toLowerCase();
        
        // Kiểm tra cả name và code
        const isBattery = 
          partNameLower.includes("pin") || 
          partNameLower.includes("lfp") ||
          partNameLower.includes("lithium") ||
          partNameLower.includes("battery") ||
          partNameLower.includes("ắc quy") ||
          partCodeLower.includes("pin") ||
          partCodeLower.includes("lfp");
        
        // Debug log để kiểm tra (log tất cả để debug)
        console.log("🔋 [RepairMode] Checking battery:", {
          partName,
          partCode,
          partNameLower,
          partCodeLower,
          isBattery,
          id: r.id,
          isTemp: r.id?.startsWith("temp_"),
          canImport: canEditFields,
          hasPartItem: !!r.partItem,
          partItemPart: r.partItem?.part
        });
        
        return (
          <div className="space-y-2">
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
          disabled={readOnly || !canEditFields}
          autoSize={{ minRows: 2, maxRows: 8 }}
              style={{ resize: "none", fontSize: 14, maxWidth: "100%" }}
            />
            {/* ✅ Hiển thị dữ liệu pin nếu bộ phận là PIN */}
            {isBattery && r.partItemId && (
              <div className="mt-2 p-2 border rounded bg-gray-50">
                {/* ✅ Hiển thị component nếu có ID thật */}
                {r.id && !r.id.startsWith("temp_") ? (
                  <BatteryDataDisplay 
                    evCheckDetailId={r.id} 
                    canImport={
                      // ✅ Cho phép import pin cả trước và sau khi gửi báo giá
                      !readOnly && (
                        canEditFields || 
                        evCheckStatus === "INSPECTION_COMPLETED" ||
                        evCheckStatus === "QUOTE_APPROVED" ||
                        evCheckStatus === "REPAIR_IN_PROGRESS"
                      )
                    }
                  />
                ) : (
                  <div className="text-xs text-gray-500 italic p-2 bg-yellow-50 rounded">
                    💡 Vui lòng chọn biện pháp để tự động lưu hạng mục
                  </div>
                )}
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

        return (
          <Select
            placeholder='Chọn'
            value={r.remedies}
            style={{ width: 100 }}
            onChange={(v) => handleChange(i, "remedies", v)}
            disabled={readOnly || !canEditFields}>
            <Option value='NONE'>Bôi trơn</Option>
            {/* Nếu đang bảo hành thì không cho chọn "Thay thế" và "Sửa chữa" */}
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
      width: 130,
      ellipsis: {
        showTitle: false,
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
        
        // ✅ Lấy partTypeId từ bộ phận hiện tại để load phụ tùng đề xuất
        const modelId = booking?.vehicle?.modelId || null;
        let partTypeId = null;
        
        // ✅ Lấy partId từ r.partItem.part.id hoặc từ vehiclePartOptions
        let partId = r.partItem?.part?.id || null;
        if (!partId && r.partItemId) {
          const vehiclePart = vehiclePartOptions.find(vp => vp.partItemId === r.partItemId);
          partId = vehiclePart?.partId || null;
        }
        
        // ✅ Lấy partTypeId từ cache hoặc từ r.partItem.part.partType.id
        if (partId) {
          partTypeId = partTypeIdCache[partId] || r.partItem?.part?.partType?.id || null;
        }
        
        // ✅ Lấy phụ tùng đề xuất từ cache key: `${modelId}_${partTypeId}`
        const cacheKey = modelId && partTypeId ? `${modelId}_${partTypeId}` : null;
        const allSuggestedParts = cacheKey ? (partOptionsMap[cacheKey] || []) : [];

        return (
          <Tooltip title={replacePartName} placement="topLeft">
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
              isWarranty // 👈 nếu đang bảo hành thì không cho chọn
            }
              loading={partLoading}
              style={{ width: "100%", maxWidth: "100%" }}
              onDropdownVisibleChange={async (open) => {
                // ✅ Load suggested parts khi mở dropdown với partTypeId từ bộ phận hiện tại
                if (open) {
                  // ✅ Nếu có proposedReplacePartId nhưng chưa có replacePartName, load lại name
                  // proposedReplacePartId là partId (Part template), không phải partItemId
                  if (r.proposedReplacePartId && !r.replacePartName) {
                    try {
                      // ✅ Gọi getPartById vì proposedReplacePartId là partId (Part template)
                      const { getPartById } = await import("../../../api/partsApi");
                      const partDetailRes = await getPartById(r.proposedReplacePartId);
                      const partDetail = partDetailRes?.data?.data || partDetailRes?.data || partDetailRes;
                      const partName = partDetail?.name || "";
                      const code = partDetail?.code || "";
                      const loadedName = code ? `${partName} (${code})` : (partName || "");
                      if (loadedName) {
                        updateRow(i, { replacePartName: loadedName });
                        console.log(`✅ Đã load replacePartName từ getPartById: ${loadedName}`);
                      }
                    } catch (err) {
                      console.error(`❌ Lỗi load name cho proposedReplacePartId ${r.proposedReplacePartId}:`, err);
                    }
                  }
                  
                  // ✅ Lấy part.id từ r.partItem.part.id hoặc từ vehiclePartOptions
                  let partId = r.partItem?.part?.id || null;
                  
                  if (!partId && r.partItemId) {
                    const vehiclePart = vehiclePartOptions.find(vp => vp.partItemId === r.partItemId);
                    partId = vehiclePart?.partId || null;
                  }
                  
                  // ✅ Lấy partTypeId từ cache trước (đã cache khi load vehiclePartOptions từ API vehicle partitem)
                  let partTypeId = partId ? partTypeIdCache[partId] : null;
                  
                  // ✅ Nếu không có trong cache, thử lấy từ vehiclePartOptions (từ API vehicle partitem)
                  if (!partTypeId && r.partItemId) {
                    const vehiclePart = vehiclePartOptions.find(vp => vp.partItemId === r.partItemId);
                    if (vehiclePart?.partItem?.part?.partType?.id) {
                      partTypeId = vehiclePart.partItem.part.partType.id;
                      // ✅ Cache lại nếu tìm thấy
                      if (partId) {
                        setPartTypeIdCache(prev => ({
                          ...prev,
                          [partId]: partTypeId
                        }));
                      }
                    }
                  }
                  
                  // ✅ Fallback: thử lấy từ r.partItem.part.partType.id
                  if (!partTypeId) {
                    partTypeId = r.partItem?.part?.partType?.id || null;
                  }
                  
                  if (partTypeId) {
                    console.log("✅ Tìm thấy partTypeId:", partTypeId);
                    // ✅ Đợi loadSuggestedParts hoàn thành để data có sẵn khi render options
                    try {
                      await loadSuggestedParts(partTypeId);
                    } catch (err) {
                      // ✅ Xử lý lỗi một cách graceful, không hiển thị toast nếu là lỗi 500
                      if (err?.response?.status !== 500 && err?.statusCode !== 500) {
                        console.error("Lỗi load phụ tùng đề xuất:", err);
                      }
                    }
                  } else {
                    console.warn("❌ Không tìm thấy partTypeId cho bộ phận:", r.partItemId);
                    // ✅ Chỉ hiển thị warning, không phải error
                    console.warn("⚠️ Không thể load phụ tùng đề xuất vì thiếu partTypeId");
                  }
                }
              }}
            onChange={(opt) => {
              if (!opt) {
                // ✅ Khi xóa phụ tùng thay thế, giữ nguyên giá từ bộ phận có sẵn trên xe
                const currentRow = details[i];
                const partItemPrice = Number(currentRow?.partItem?.price || 0);
                updateRow(i, {
                  proposedReplacePartId: "",
                  replacePartName: "",
                  pricePart: partItemPrice, // ✅ Giữ giá từ bộ phận có sẵn trên xe
                });
                return;
              }
                // ✅ Tìm trong danh sách phụ tùng đề xuất
                const selected = allSuggestedParts.find((p) => p.id === opt.value);
                
                // ✅ Lưu label đầy đủ (có serialNumber) từ opt.label
                // opt.label đã được format: "Tên (Serial)" hoặc "Tên"
                const fullLabel = opt.label || selected?.name || "";

                // ✅ Giữ nguyên giá từ bộ phận có sẵn trên xe, không lấy từ phụ tùng thay thế
                const currentRow = details[i];
                const partItemPrice = Number(currentRow?.partItem?.price || 0);

              updateRow(i, {
                proposedReplacePartId: opt.value,
                  replacePartName: fullLabel, // ✅ Lưu label đầy đủ với code (Part template)
                  pricePart: partItemPrice, // ✅ Luôn lấy giá từ bộ phận có sẵn trên xe
              });
            }}
              options={allSuggestedParts.map((p) => {
                // ✅ Hiển thị tên và code (Part template không có serialNumber)
                const name = p.name || "";
                const code = p.code || "";
                const label = code ? `${name} (${code})` : name;
                return {
                  value: p.id,
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
      align: "center",
      render: (_, r, i) => (
        <Input
          type='number'
          value={r.quantity}
          onChange={(e) => handleChange(i, "quantity", e.target.value)}
          disabled={readOnly || !canEditFields}
          style={{ width: "100%", maxWidth: "100%" }}
        />
      ),
    },
    { title: "ĐV", width: 35, align: "center", render: (_, r) => r.unit || "-" },
    {
      title: "Giá PT",
      width: 60,
      render: (_, r) =>
        r.remedies !== "REPLACE"
          ? "—"
          : Number(r.pricePart || 0).toLocaleString(),
    },
    {
      title: "Giá DV",
      width: 60,
      render: (_, r) => Number(r.priceService || 0).toLocaleString(),
    },
    // {
    //   title: "Tổng",
    //   width: 70,
    //   render: (_, r) =>
    //     r.totalAmount ? `${Number(r.totalAmount).toLocaleString()}đ` : "-",
    // },
    {
      title: "Trạng thái phụ tùng",
      width: 100,
      render: (_, r) => {
        // ✅ Hiển thị exportNoteStatus nếu có (không chỉ khi COMPLETED)
        const status = r.exportNoteStatus || exportNoteStatusMap[r.id];
        if (!status) return <span style={{ color: "#999" }}>Chưa có</span>;
        
        // ✅ Format status với Tag và màu sắc
        const getStatusColor = (s) => {
          const statusUpper = (s || "").toUpperCase();
          if (statusUpper === "COMPLETED") return "success";
          if (statusUpper === "PENDING") return "processing";
          if (statusUpper === "REJECTED" || statusUpper === "CANCELLED") return "error";
          if (statusUpper === "STOCK_NOT_FOUND") return "warning";
          if (statusUpper === "STOCK_FOUND") return "success";
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

  // Cột trạng thái cho mode sửa chữa (giống MaintenanceModeEVCheck)
  const statusColumn = {
    title: (
      <div className='flex items-center gap-2'>
        {details.filter((d) => d.id && !isWarrantyItemSent(d)).length > 0 && (
          <Checkbox
            checked={details.filter(d => !isWarrantyItemSent(d)).every((d) => d.status === "COMPLETED")}
            indeterminate={
              details.filter(d => !isWarrantyItemSent(d)).some((d) => d.status === "COMPLETED") &&
              details.filter(d => !isWarrantyItemSent(d)).some((d) => d.status !== "COMPLETED")
            }
            onChange={(e) => {
              const checked = e.target.checked;
              const updated = details.map((item) => {
                // ✅ Chỉ cập nhật status cho item chưa gửi đi bảo hành
                if (isWarrantyItemSent(item)) {
                  return item; // Giữ nguyên item đã gửi đi bảo hành
                }
                return {
                  ...item,
                  status: checked ? "COMPLETED" : "PENDING",
                };
              });
              setDetails(updated);

              const changes = {};
              updated.forEach((item) => {
                // ✅ Chỉ thêm vào statusChanges nếu chưa gửi đi bảo hành
                if (item.id && checked && !isWarrantyItemSent(item)) {
                  changes[item.id] = "COMPLETED";
                }
              });
              setStatusChanges((prev) => ({ ...prev, ...changes }));
            }}
            disabled={readOnly || !canEditStatus}></Checkbox>
        )}
        <span>Trạng thái</span>
      </div>
    ),
    width: 120,
    render: (_, r, i) => {
      const stat = REPAIR_STATUS[r.status] || REPAIR_STATUS.PENDING;
      // ✅ Disable khi item đã gửi đi bảo hành (có RMA hoặc kết quả khác "Tốt")
      // Nếu còn bảo hành nhưng kết quả là "Tốt" (chỉ bôi trơn/kiểm tra) → vẫn cho cập nhật
      const isWarrantySent = isWarrantyItemSent(r);
      const isDisabled = readOnly || !canEditStatus || isWarrantySent;

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
                handleChange(i, "status", "COMPLETED");
              }
              }}>
            {stat.label}
            </Tag>
        </div>
      );
    },
  };

  // ✅ Row selection cho RMA (chỉ cho staff)
  const eligibleItems = details.filter((r) => isRMAEligible(r));
  const noEligibleItems = eligibleItems.length === 0; // ✅ Không còn items nào eligible
  const allSelectedRMAItemsHaveRMA = Array.from(selectedRMAItems).every((id) => {
    const item = details.find((d) => d.id === id);
    return item && hasRMA(item);
  });

  // ✅ Tự động clear selection cho các items đã có RMA sau khi reload data
  useEffect(() => {
    if (selectedRMAItems.size === 0) return; // Không cần check nếu không có selection
    
    const validSelectedKeys = Array.from(selectedRMAItems).filter((id) => {
      const item = details.find((d) => d.id === id);
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
  }, [details]); // ✅ Chỉ check khi details thay đổi (sau khi reload)

  // ✅ Filter selectedRowKeys để chỉ hiển thị những items còn tồn tại và chưa có RMA
  const validSelectedKeys = Array.from(selectedRMAItems).filter((id) => {
    const item = details.find((d) => d.id === id);
    return item && !hasRMA(item) && isRMAEligible(item);
  });

  const rowSelection = readOnly ? {
    selectedRowKeys: validSelectedKeys, // ✅ Chỉ hiển thị những keys hợp lệ (chưa có RMA)
    onChange: (selectedKeys, selectedRows) => {
      if (isRMASubmitting) return; // ✅ Không cho thay đổi selection khi đang submit
      
      // ✅ Chỉ cho phép chọn những items chưa có RMA
      const validKeys = selectedKeys.filter((id) => {
        const item = details.find((d) => d.id === id);
        return item && !hasRMA(item) && isRMAEligible(item);
      });
      setSelectedRMAItems(new Set(validKeys));
    },
    getCheckboxProps: (record) => ({
      disabled: isRMASubmitting || hasRMA(record) || !isRMAEligible(record), // ✅ Disable khi đang submit, đã có RMA hoặc không đủ điều kiện
    }),
    // ✅ Preserve selected row keys khi data thay đổi (nhưng useEffect sẽ tự động clear)
    preserveSelectedRowKeys: false, // ✅ Không preserve, để tự động clear khi items có RMA
  } : undefined;

  let columns = baseColumns;
  // ✅ Hiển thị cột Trạng thái chỉ khi đã được duyệt báo giá hoặc đang sửa chữa
  // Ẩn cột khi mới gửi báo giá (INSPECTION_COMPLETED) - chờ duyệt
  if (!readOnly && (
    evCheckStatus === "QUOTE_APPROVED" ||
    evCheckStatus === "REPAIR_IN_PROGRESS"
  )) {
    columns = [...columns, statusColumn];
  }

  return (
    <div className='space-y-4'>
      <div className='p-3 bg-yellow-50 rounded border border-yellow-300'>
        <p className='text-sm font-medium text-yellow-800'>Mô tả khách hàng:</p>
        <p className='mt-1 text-gray-700'>{booking?.note || "Chưa có mô tả"}</p>
      </div>

      {loading || vehiclePartLoading || replacePartLoading ? (
        <div className='flex justify-center p-10'>
          <Spin />
        </div>
      ) : (
        <>
          {/* ✅ Nút Tạo RMA ở trên bảng (chỉ cho staff) - chỉ hiện khi có items eligible được chọn */}
          {readOnly &&
            validSelectedKeys.length > 0 &&
            (evCheckStatus === "QUOTE_APPROVED" ||
              evCheckStatus === "REPAIR_IN_PROGRESS" ||
              evCheckStatus === "REPAIR_COMPLETED" ||
              evCheckStatus === "COMPLETED") && (
              <div className='flex justify-between items-center mb-4'>
                <h4 className='text-base font-semibold text-gray-700'>Danh sách hạng mục sửa chữa</h4>
                <Button
                  type='primary'
                  danger
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
            dataSource={details}
            rowKey='id'
            rowSelection={rowSelection} // ✅ Dùng rowSelection thay vì cột RMA
            scroll={{ x: false }}
            pagination={false}
            size='small'
            bordered
            style={{ width: '100%', maxWidth: '100%' }}
          />
        </div>
        </>
      )}

      {!readOnly && (
        <>
          {/* ✅ Hiện nút "Gửi báo giá" khi chưa gửi và không ở các trạng thái đã hoàn thành */}
          {evCheckStatus !== "REPAIR_COMPLETED" &&
            evCheckStatus !== "COMPLETED" &&
            evCheckStatus !== "QUOTE_APPROVED" &&
            evCheckStatus !== "INSPECTION_COMPLETED" &&
            evCheckStatus !== "REPAIR_IN_PROGRESS" && (
            <>
              <Button
                type='dashed'
                onClick={addExtraRow}
                icon={<PlusOutlined />}
                  block
                  disabled={loading}>
                Thêm hạng mục sửa chữa
              </Button>
              <div className='flex justify-end mt-4'>
                  <Button
                    type='primary'
                    onClick={saveAll}
                    loading={loading}
                    disabled={loading}>
                  Gửi báo giá
                </Button>
              </div>
            </>
            )}

          {/* ✅ Hiện thông báo khi đã gửi báo giá */}
          {/* {evCheckStatus === "INSPECTION_COMPLETED" && (
            <div className='mt-4 p-4 bg-blue-50 border border-blue-300 rounded text-center'>
              <p className='text-blue-700 font-medium'>
                Đã gửi báo giá thành công
              </p>
            </div>
          )} */}

          {/* ✅ Hiện nút "Xác nhận sửa chữa" khi đang sửa chữa */}
          {evCheckStatus === "REPAIR_IN_PROGRESS" && (
            <div className='flex justify-end mt-4'>
              <Button
                type='primary'
                onClick={handleConfirmRepair}
                loading={loading}
                disabled={
                  loading || Object.keys(statusChanges).length === 0
                }
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
          )}

          {/* ✅ Hiện thông báo khi đã hoàn thành */}
          {(evCheckStatus === "REPAIR_COMPLETED" ||
            evCheckStatus === "COMPLETED") && (
            <div className='mt-4 p-4 bg-green-50 border border-green-300 rounded text-center'>
              <p className='text-green-700 font-medium'>
                Đã hoàn thành sửa chữa
              </p>
            </div>
          )}
        </>
      )}


      {/* Modal xác nhận RMA – gom nhiều items thành 1 RMA */}
      <RMAConfirmationModal
        open={isRMAConfirmationOpen}
        onClose={() => {
          // ✅ Cho phép đóng modal, nhưng reset submitting state
          setIsRMAConfirmationOpen(false);
          setIsRMASubmitting(false); // ✅ Reset khi đóng modal
          setSelectedRMAItems(new Set()); // ✅ Clear selection sau khi đóng
        }}
        booking={booking}
        partsForRMA={currentRMAParts}
        onRMASuccess={() => {
          // ✅ Clear selection ngay lập tức TRƯỚC KHI đóng modal
          setSelectedRMAItems(new Set());
          setIsRMAConfirmationOpen(false);
          
          toast.success("Tạo RMA thành công! Đang đồng bộ lại dữ liệu...");
          
          // ✅ Reload data sau khi clear selection
          setTimeout(() => {
            loadRepairDetails().then(() => {
              // ✅ Đảm bảo selection được clear sau khi reload
              setSelectedRMAItems(new Set());
              // ✅ Reset submitting state sau khi reload xong
              setIsRMASubmitting(false);
            }).catch(() => {
              // ✅ Reset submitting state nếu có lỗi
              setIsRMASubmitting(false);
            });
          }, 100);
        }}
      />
    </div>
  );
}
