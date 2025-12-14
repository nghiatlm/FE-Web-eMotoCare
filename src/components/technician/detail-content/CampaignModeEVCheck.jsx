// src/components/technician/detail-content/CampaignModeEVCheck.jsx
// Component riêng cho Campaign Mode, dựa trên RepairModeEVCheck
// Khác biệt: Load program details từ campaignId và so sánh recallPartId với partId để hiển thị tên từ campaign trong cột "Bộ phận"
import { useState, useEffect, useCallback } from "react";
import { Table, Input, Select, Button, Spin, Tag, Checkbox, Tooltip } from "antd";
import { toast } from "react-toastify";
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
import { changeAppointmentStatusService } from "../../../services/appointmentService.js";
import { PlusOutlined } from "@ant-design/icons";
import useEVCheckHub from "../../../hooks/useEVCheckHub.jsx";
import useRMAHub from "../../../hooks/useRMAHub.jsx";
import BatteryDataDisplay from "../BatteryDataDisplay";
import { getCampaignById } from "../../../api/campaignsApi.js";

const { Option } = Select;

const REPAIR_STATUS = {
  PENDING: { label: "Đang sửa chữa", color: "processing" },
  IN_PROGRESS: { label: "Đang sửa chữa", color: "processing" },
  COMPLETED: { label: "Đã hoàn thành", color: "success" },
};

// ✅ Hàm kiểm tra bảo hành
const checkWarrantyStatus = (partItem) => {
  if (!partItem) return false;
  // ✅ Lấy từ isManufacturerWarranty thay vì tính từ ngày
  return partItem.isManufacturerWarranty === true;
};

export default function CampaignModeEVCheck({
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
  
  // ✅ Map export note status theo detail ID
  const [exportNoteStatusMap, setExportNoteStatusMap] = useState({});
  
  // ✅ Map recallPartId -> recallPart name từ program details (cho campaign)
  const [recallPartNameMap, setRecallPartNameMap] = useState({});
  // ✅ Lưu danh sách recallPartIds từ program details
  const [recallPartIds, setRecallPartIds] = useState([]);
  
  // -------- Load Program Details (Campaign) --------
  const loadProgramDetails = async () => {
    const campaignId = booking?.campaignId || null;
    if (!campaignId) return { recallMap: {}, recallPartIds: [] };

    try {
      console.log(`🔍 Loading program details cho campaignId: ${campaignId}`);
      const programRes = await getCampaignById(campaignId);
      const programData = programRes?.data?.data || programRes?.data || programRes;
      const programDetails = programData?.programDetails || [];

      // ✅ Tạo map recallPartId -> recallPart name
      const recallMap = {};
      const recallIds = [];
      
      for (const detail of programDetails) {
        const recallPartId = detail?.recallPartId;
        if (recallPartId) {
          recallIds.push(recallPartId);
          try {
            const { getPartById } = await import("../../../api/partsApi");
            const partRes = await getPartById(recallPartId);
            const partData = partRes?.data?.data || partRes?.data || partRes;
            const partName = partData?.name || "";
            const partCode = partData?.code || "";
            recallMap[recallPartId] = partCode ? `${partName} (${partCode})` : (partName || recallPartId);
            console.log(`✅ Mapped recallPartId ${recallPartId} -> ${recallMap[recallPartId]}`);
          } catch (err) {
            console.error(`❌ Lỗi lấy thông tin recallPart ${recallPartId}:`, err);
            recallMap[recallPartId] = recallPartId;
          }
        }
      }
      setRecallPartNameMap(recallMap);
      setRecallPartIds(recallIds);
      return { recallMap, recallPartIds: recallIds };
    } catch (err) {
      console.error("❌ Lỗi load program details:", err);
      return { recallMap: {}, recallPartIds: [] };
    }
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
        toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không tải được phụ tùng gắn trên xe!"));
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
        toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không tải được phụ tùng trong kho!"));
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
    result: "", // ✅ Không có giá trị mặc định
    remedies: "REPLACE",
    pricePart: 0,
    priceService: 0,
    totalAmount: 0,
    quantity: 1,
    unit: "cái",
    isNew: true,
  });

  // ========= UPDATE GIÁ CÔNG =========
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

  // ========= LOAD EV CHECK DETAIL =========
  const loadRepairDetails = useCallback(async () => {
    if (!evCheckId || forceEmpty) return;
    setLoading(true);
    try {
      // ✅ Load program details cho campaign trước
      const { recallMap: recallPartNameMapLocal, recallPartIds: recallPartIdsList } = await loadProgramDetails();
      
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

          // ✅ Cho campaign: So sánh partId với recallPartId và lấy tên từ program details
          let displayName = partOption?.label || partItemId || "";
          const partId = partOption?.partId || item.partItem?.part?.id || null;
          
          // ✅ Kiểm tra xem partId có khớp với recallPartId không
          let finalReplacePartId = replacePartId;
          let finalReplacePartName = replacePartName;
          
          // ✅ Campaign: Luôn tự động gán recallPartId nếu partId khớp (gán cứng)
          if (partId && recallPartIdsList.includes(partId)) {
            // ✅ Nếu partId khớp với recallPartId, tự động gán vào phụ tùng đề xuất (bất kể có replacePartId hay chưa)
            finalReplacePartId = partId; // recallPartId = partId
            finalReplacePartName = recallPartNameMapLocal[partId] || replacePartName || "";
            displayName = recallPartNameMapLocal[partId] || displayName;
            console.log(`✅ Campaign: Tự động gán recallPartId ${partId} vào phụ tùng đề xuất cho bộ phận ${partId}`);
          } else if (partId && recallPartNameMapLocal[partId]) {
            displayName = recallPartNameMapLocal[partId];
            console.log(`✅ Campaign: Sử dụng tên từ program details cho partId ${partId}: ${displayName}`);
          }
          
          // ✅ Campaign: Đảm bảo luôn có phụ tùng thay thế nếu partId khớp recallPartId (kể cả khi reload)
          if (partId && recallPartIdsList.includes(partId) && !finalReplacePartId) {
            finalReplacePartId = partId;
            finalReplacePartName = recallPartNameMapLocal[partId] || "";
          }

        return {
          ...item,
          partItemId,
          displayName: displayName,
          partItem: item.partItem || partOption?.partItem || null,
          proposedReplacePartId: finalReplacePartId || replacePartId,
            replacePartName: finalReplacePartName || replacePartName || "", // ✅ Không fallback về ID, chỉ dùng name
            result: item.result ?? "", // ✅ Không có giá trị mặc định
          remedies: item.remedies || "REPLACE",
          pricePart: Number(item.pricePart || 0),
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

      // ✅ Cho campaign: Tự động tìm và gán bộ phận có partId khớp với recallPartId
      if (recallPartIdsList && recallPartIdsList.length > 0 && vehiclePartOptions.length > 0) {
        // ✅ Tìm các bộ phận có partId khớp với recallPartId
        for (const recallPartId of recallPartIdsList) {
          // Tìm trong vehiclePartOptions xem có bộ phận nào có partId = recallPartId
          const matchingPart = vehiclePartOptions.find(option => option.partId === recallPartId);
          
          if (matchingPart) {
            // ✅ Kiểm tra xem đã có detail với bộ phận này chưa
            // Kiểm tra theo nhiều tiêu chí để tránh duplicate:
            // 1. Theo partItemId (nếu khớp)
            // 2. Theo partId (recallPartId) trong proposedReplacePartId
            // 3. Theo partId trong partItem.part.id
            const existingDetail = mapped.find(d => {
              // Kiểm tra theo partItemId
              if (d.partItemId === matchingPart.partItemId) return true;
              
              // Kiểm tra theo proposedReplacePartId (recallPartId)
              if (d.proposedReplacePartId === recallPartId) return true;
              
              // Kiểm tra theo partId trong partItem
              const detailPartId = d.partItem?.part?.id || 
                                   vehiclePartOptions.find(vp => vp.partItemId === d.partItemId)?.partId || null;
              if (detailPartId === recallPartId) return true;
              
              return false;
            });
            
            if (!existingDetail) {
              // ✅ Nếu chưa có, tự động tạo row mới với bộ phận này
              const recallPartName = recallPartNameMapLocal[recallPartId] || "";
              
              const autoRow = {
                ...createEmptyRow(),
                partItemId: matchingPart.partItemId,
                displayName: recallPartName || matchingPart.label || "",
                partItem: matchingPart.partItem || null,
                proposedReplacePartId: recallPartId, // ✅ Gán recallPartId vào phụ tùng đề xuất
                replacePartName: recallPartName || "",
                remedies: "REPLACE", // ✅ Tự động set REPLACE
                pricePart: Number(matchingPart.price || 0),
              };
              
              mapped.push(autoRow);
              console.log(`✅ Campaign: Tự động tạo row cho recallPartId ${recallPartId}:`, autoRow);
            } else {
              // ✅ Nếu đã có detail, tự động gán recallPartId vào phụ tùng đề xuất (gán cứng, luôn gán lại)
              existingDetail.proposedReplacePartId = recallPartId;
              existingDetail.replacePartName = recallPartNameMapLocal[recallPartId] || "";
              if (!existingDetail.remedies || existingDetail.remedies === "NONE" || existingDetail.remedies === "CLEAN") {
                existingDetail.remedies = "REPLACE";
              }
              console.log(`✅ Campaign: Tự động gán lại recallPartId ${recallPartId} vào phụ tùng đề xuất cho detail ${existingDetail.id}`);
            }
          }
        }
      }

      if (mapped.length > 0) {
        // ✅ Filter duplicate để tránh hiển thị trùng lặp
        // Dùng Map để giữ lại detail đầu tiên theo key: `${partItemId}_${proposedReplacePartId}`
        const uniqueDetailsMap = new Map();
        mapped.forEach((detail) => {
          const partItemId = detail.partItemId || "";
          const proposedReplacePartId = detail.proposedReplacePartId || "";
          const key = `${partItemId}_${proposedReplacePartId}`;
          
          // ✅ Ưu tiên detail có id (đã lưu vào DB) hơn detail mới (isNew)
          if (!uniqueDetailsMap.has(key)) {
            uniqueDetailsMap.set(key, detail);
          } else {
            const existing = uniqueDetailsMap.get(key);
            // Nếu detail hiện tại có id (đã lưu) và detail trong map chưa có id, thay thế
            if (detail.id && !existing.id) {
              uniqueDetailsMap.set(key, detail);
            }
          }
        });
        
        const uniqueDetails = Array.from(uniqueDetailsMap.values());
        console.log(`✅ Campaign: Filter duplicate - ${mapped.length} -> ${uniqueDetails.length} details`);
        setDetails(uniqueDetails);
      } else {
        // ✅ Nếu không có detail và có recallPartIds, tự động tạo rows
        if (!readOnly && recallPartIdsList && recallPartIdsList.length > 0 && vehiclePartOptions.length > 0) {
          const autoRows = [];
          for (const recallPartId of recallPartIdsList) {
            const matchingPart = vehiclePartOptions.find(option => option.partId === recallPartId);
            if (matchingPart) {
              const recallPartName = recallPartNameMapLocal[recallPartId] || "";
              autoRows.push({
                ...createEmptyRow(),
                partItemId: matchingPart.partItemId,
                displayName: recallPartName || matchingPart.label || "",
                partItem: matchingPart.partItem || null,
                proposedReplacePartId: recallPartId,
                replacePartName: recallPartName || "",
                remedies: "REPLACE",
                pricePart: Number(matchingPart.price || 0),
              });
            }
          }
          if (autoRows.length > 0) {
            setDetails(autoRows);
            console.log(`✅ Campaign: Tự động tạo ${autoRows.length} rows từ recallPartIds`);
          } else {
            setDetails([createEmptyRow()]);
          }
        } else {
          setDetails(readOnly ? [] : [createEmptyRow()]);
        }
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
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể tải dữ liệu chi tiết!"));
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

  // ✅ Kết nối SignalR để nhận real-time updates cho EVCheck
  const handleEVCheckUpdate = useCallback(() => {
    console.log("🔄 EVCheck SignalR update received, reloading EVCheck details...");
    if (evCheckId && !forceEmpty && !vehiclePartLoading && !replacePartLoading) {
      loadRepairDetails();
      if (onRefresh) {
        onRefresh();
      }
    }
  }, [evCheckId, forceEmpty, vehiclePartLoading, replacePartLoading, loadRepairDetails, onRefresh]);

  useEVCheckHub(evCheckId, handleEVCheckUpdate);

  // ✅ Kết nối SignalR để nhận real-time updates cho RMA
  const handleRMAUpdate = useCallback(() => {
    console.log("🔄 RMA SignalR update received, reloading EVCheck details...");
    if (evCheckId && !forceEmpty && !vehiclePartLoading && !replacePartLoading) {
      loadRepairDetails();
      if (onRefresh) {
        onRefresh();
      }
    }
  }, [evCheckId, forceEmpty, vehiclePartLoading, replacePartLoading, loadRepairDetails, onRefresh]);

  useRMAHub(handleRMAUpdate);

  // ========= CONTROL FLAG =========
  // ✅ Chỉ cho phép sửa khi vừa vào làm EVCheck (chưa gửi báo giá)
  // Sau khi gửi báo giá (INSPECTION_COMPLETED) thì disable hết
  const canEditFields =
    !readOnly &&
    evCheckStatus !== "INSPECTION_COMPLETED" &&
    evCheckStatus !== "QUOTE_APPROVED" &&
    evCheckStatus !== "REPAIR_IN_PROGRESS" &&
    evCheckStatus !== "REPAIR_COMPLETED" &&
    evCheckStatus !== "COMPLETED";
  
  // ✅ Cho phép edit status khi REPAIR_IN_PROGRESS (khác với canEditFields)
  const canEditStatus = !readOnly && evCheckStatus === "REPAIR_IN_PROGRESS";

  // ✅ Campaign: Không tự động lưu khi chọn biện pháp, chỉ lưu khi gửi báo giá
  // Để tránh reload trang và mất dữ liệu phụ tùng thay thế

  // ✅ Kiểm tra item có vấn đề về kho (hết hàng, không tìm thấy hàng hoặc chờ xuất kho)
  const hasStockIssue = (row) => {
    const exportStatus = row?.exportNoteStatus || exportNoteStatusMap[row?.id];
    const exportStatusUpper = (exportStatus || "").toUpperCase();
    return exportStatusUpper === "STOCK_NOT_FOUND" || exportStatusUpper === "NOT_FOUND" || exportStatusUpper === "STOCK_FOUND";
  };

  const handleChange = (index, field, value) => {
    if (evCheckStatus === "INSPECTION_COMPLETED" && field !== "status") return;
    if (evCheckStatus === "QUOTE_APPROVED" && field !== "status") return;
    // ✅ Cho phép edit status khi REPAIR_IN_PROGRESS (khác với canEditFields)
    if (field === "status" && !canEditStatus) return;
    if (!canEditFields && field !== "status") return;

    // ✅ Kiểm tra trạng thái xuất kho: Nếu hết hàng hoặc chờ xuất kho thì không cho tick hoàn thành
    if (field === "status" && value === "COMPLETED") {
      const currentRow = details[index];
      if (hasStockIssue(currentRow)) {
        toast.error("Không thể đánh dấu hoàn thành khi phụ tùng hết hàng hoặc đang chờ xuất kho.");
        return;
      }
    }

    updateRow(index, { [field]: value });

    if (field === "remedies") {
      // ✅ Campaign: Không clear phụ tùng thay thế vì nó tự động từ recallPartId
      // Chỉ clear pricePart khi không phải REPLACE
      const currentRow = details[index];
      const partId = currentRow?.partItem?.part?.id || 
                     vehiclePartOptions.find(vp => vp.partItemId === currentRow?.partItemId)?.partId || null;
      
      if (value !== "REPLACE") {
        updateRow(index, {
          pricePart: 0,
        });
      }
      
      // ✅ Campaign: Đảm bảo phụ tùng thay thế luôn được giữ lại từ recallPartId
      if (partId && recallPartIds.includes(partId)) {
        const recallPartName = recallPartNameMap[partId] || currentRow?.replacePartName || "";
        updateRow(index, {
          proposedReplacePartId: partId,
          replacePartName: recallPartName,
        });
      }
      
      updatePriceService(index, value);
      
      // ✅ Campaign: Không tự động lưu khi chọn biện pháp, chỉ lưu khi gửi báo giá
      // Để tránh reload trang và mất dữ liệu phụ tùng thay thế
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
        result: (item.result || "").trim(),
        remedies: item.remedies ?? "REPLACE",
        unit: item.unit || "cái",
        priceService: Number(item.priceService || 0),
        totalAmount: Number(item.totalAmount || 0),
        status: item.status || "PENDING",
      };

      // ✅ Campaign: Chỉ gửi proposedReplacePartId, pricePart và quantity khi có phụ tùng thay thế
      // Vì phụ tùng thay thế được gán cứng từ recallPartId
      if (item.proposedReplacePartId) {
        payload.proposedReplacePartId = item.proposedReplacePartId;
        payload.quantity = Number(item.quantity || 1);
        payload.pricePart = Number(item.pricePart || 0);
      } else {
        // ✅ Không có phụ tùng thay thế thì không gửi quantity và pricePart
        payload.quantity = null;
        payload.pricePart = null;
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
      if (!silent) toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể lưu hạng mục!"));
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

      // ✅ Chỉ cho phép chọn WARRANTY khi phụ tùng còn trong thời gian bảo hành
      if (item.remedies === "WARRANTY" && !checkWarrantyStatus(item.partItem)) {
        return toast.error(
          "Bộ phận không còn trong thời gian bảo hành. Không thể chọn biện pháp 'Bảo hành'."
        );
      }

      // Nếu REPLACE nhưng không có proposedReplacePartId -> báo lỗi FE, không call BE
      if (item.remedies === "REPLACE" && !item.proposedReplacePartId) {
        toast.error(
          "Vui lòng chọn Phụ tùng thay thế cho hạng mục cần thay thế."
        );
        return;
      }

      // ✅ Bỏ validation required cho field "Kết quả"
    }

    if (!evCheckId) return toast.error("Thiếu EVCheckId!");

    try {
      setLoading(true);
      const loadingToast = toast.loading("Đang lưu hạng mục sửa chữa...");

      for (const item of itemsToSave) {
        const payload = {
          partItemId: item.partItemId,
          result: (item.result || "").trim(),
          remedies: item.remedies ?? "REPLACE",
          unit: item.unit || "cái",
          priceService: Number(item.priceService || 0),
          totalAmount: Number(item.totalAmount || 0),
          status: item.status || "PENDING",
        };

        // ✅ Campaign: Chỉ gửi proposedReplacePartId, pricePart và quantity khi có phụ tùng thay thế
        // Vì phụ tùng thay thế được gán cứng từ recallPartId
        if (item.proposedReplacePartId) {
          payload.proposedReplacePartId = item.proposedReplacePartId;
          payload.quantity = Number(item.quantity || 1);
          payload.pricePart = Number(item.pricePart || 0);
        } else {
          // ✅ Không có phụ tùng thay thế thì không gửi quantity và pricePart
          payload.quantity = null;
          payload.pricePart = null;
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
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể lưu hạng mục sửa chữa!"));
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

      // ✅ Cập nhật từng detail
      for (const [detailId, newStatus] of Object.entries(statusChanges)) {
        console.log(`📤 Cập nhật detail ${detailId} với status: ${newStatus}`);
        await updateEVCheckDetailService(detailId, { status: newStatus });
      }

      toast.dismiss(loadingToast);
      
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
        
        // ✅ Cập nhật appointment status thành REPAIR_COMPLETED
        if (booking?.id) {
          try {
            console.log(`📤 Cập nhật Appointment ${booking.id} thành REPAIR_COMPLETED`);
            // ✅ Lấy thông tin appointment hiện tại để giữ lại các field khác
            const { getAppointmentById } = await import("../../../api/appointmentsApi");
            const appointmentRes = await getAppointmentById(booking.id);
            const currentAppointment = appointmentRes?.data?.data || appointmentRes?.data || appointmentRes;
            
            // ✅ Update với đầy đủ thông tin cần thiết, chỉ thay đổi status
            await changeAppointmentStatusService(booking.id, "REPAIR_COMPLETED", {
              note: currentAppointment?.note || booking?.note || "",
              approveById: currentAppointment?.approveById || booking?.approveById || null,
              code: currentAppointment?.code || booking?.code || "",
              checkinQRCode: currentAppointment?.checkinQRCode || booking?.checkinQRCode || "",
            });
            console.log(`✅ Đã cập nhật Appointment ${booking.id} thành REPAIR_COMPLETED`);
          } catch (err) {
            console.error("❌ Lỗi cập nhật appointment status:", err);
            console.error("❌ Error details:", err.response?.data || err.message);
            // Không throw error để không ảnh hưởng đến flow chính
            return; // ✅ Dừng lại nếu có lỗi
          }
        }
        
        // ✅ Chỉ hiển thị 1 toast thành công
        toast.success("Cập nhật trạng thái thành công!");
      }

      onRefresh?.();
    } catch (err) {
      console.error("❌ Cập nhật trạng thái thất bại:", err);
      console.error("❌ Error details:", err.response?.data || err.message);
      toast.dismiss(loadingToast);
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể cập nhật trạng thái hạng mục!"));
    } finally {
      setLoading(false);
    }
  };

  // ========= CỘT TABLE =========
  const baseColumns = [
    { title: "STT", render: (_, __, i) => i + 1, width: 37 },
    {
      title: "Bộ phận",
      width: 170,
      ellipsis: {
        showTitle: true,
      },
      render: (_, r, i) => {
        // ✅ Campaign: Lấy displayName từ recallPartNameMap nếu có partId khớp với recallPartId
        let displayName = r.displayName || "";
        const partItemId = r.partItemId || "";
        const partId = r.partItem?.part?.id || 
                       vehiclePartOptions.find(vp => vp.partItemId === r.partItemId)?.partId || null;
        
        // ✅ Tìm lại displayName từ recallPartNameMap hoặc vehiclePartOptions
        if (!displayName || displayName === partItemId) {
          if (partId && recallPartIds.includes(partId)) {
            displayName = recallPartNameMap[partId] || "";
          }
          if (!displayName || displayName === partItemId) {
            const sel = vehiclePartOptions.find((p) => p.partItemId === partItemId);
            displayName = sel?.label || displayName || partItemId || "";
          }
        }
        
        // ✅ Tìm option tương ứng với partItemId
        const selectedOption = vehiclePartOptions.find((p) => p.partItemId === partItemId);
        
        // ✅ Nếu không tìm thấy trong options nhưng có displayName, thêm vào options tạm thời
        const allOptions = [...vehiclePartOptions];
        if (partItemId && displayName && !selectedOption) {
          allOptions.push({
            partItemId,
            value: partItemId,
            label: displayName,
            price: r.pricePart || 0,
            partItem: r.partItem || null,
            partId: partId || null,
          });
        }
        
        return (
          <Tooltip title={displayName || partItemId} placement="topLeft">
        <Select
          showSearch
          placeholder='Chọn bộ phận'
          value={partItemId || undefined}
          style={{ width: "100%", minWidth: "160px" }}
          onChange={(v) => {
            const sel = allOptions.find((p) => p.partItemId === v);
            const partItem = sel?.partItem;
            const partId = sel?.partId || partItem?.part?.id || null;

            handleChange(i, "partItemId", v);

            // ✅ Campaign: Tự động gán recallPartId vào proposedReplacePartId nếu partId khớp
            let proposedReplacePartId = "";
            let replacePartName = "";
            let finalDisplayName = sel?.label || "";
            
            if (partId && recallPartIds.includes(partId)) {
              proposedReplacePartId = partId; // recallPartId = partId
              replacePartName = recallPartNameMap[partId] || "";
              finalDisplayName = recallPartNameMap[partId] || sel?.label || "";
              console.log(`✅ Campaign: Tự động gán recallPartId ${partId} vào phụ tùng đề xuất`);
            }

            updateRow(i, {
              displayName: finalDisplayName,
              pricePart: sel?.price || 0,
              partItem,
              proposedReplacePartId: proposedReplacePartId || r.proposedReplacePartId || "",
              replacePartName: replacePartName || r.replacePartName || "",
            });
          }}
          options={allOptions}
          loading={vehiclePartLoading}
          disabled={readOnly || !canEditFields}
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
      width: 110,
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
              value={r.result ?? ""}
          onChange={(e) => handleChange(i, "result", e.target.value)}
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
                  <span className="text-gray-400">—</span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Biện pháp",
      width: 130,
      ellipsis: {
        showTitle: true,
      },
      render: (_, r, i) => {
        const isWarranty = checkWarrantyStatus(r.partItem);
        const getRemediesLabel = (remedies) => {
          const map = {
            REPLACE: "Thay thế",
            REPAIR: "Sửa chữa",
            CLEAN: "Vệ sinh",
            TUNE: "Điều chỉnh",
            WARRANTY: "Bảo hành",
            NONE: "Không",
          };
          const normalized = (remedies || "").toString().toUpperCase().trim();
          return map[normalized] || "Chọn";
        };
        const remediesLabel = getRemediesLabel(r.remedies);
        return (
          <Tooltip title={remediesLabel} placement="topLeft">
            <Select
              placeholder='Chọn'
              value={r.remedies}
              style={{ width: "100%", minWidth: 120 }}
              onChange={(v) => handleChange(i, "remedies", v)}
              disabled={readOnly || !canEditFields}>
              <Option value='NONE'>Không</Option>
              <Option value='TUNE'>Điều chỉnh</Option>
              <Option value='CLEAN'>Vệ sinh</Option>
              {/* ✅ Nếu đang bảo hành thì không hiển thị "Thay thế" và "Sửa chữa" */}
              {!isWarranty && <Option value='REPLACE'>Thay thế</Option>}
              {!isWarranty && <Option value='REPAIR'>Sửa chữa</Option>}
              {/* ✅ Chỉ hiển thị "Bảo hành" khi phụ tùng còn trong thời gian bảo hành */}
              {isWarranty && <Option value='WARRANTY'>Bảo hành</Option>}
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
        const replacePartName = r.replacePartName || "";
        
        // ✅ Campaign: Hiển thị recallPartName (tự động từ recallPartId), không cho chọn
        if (replacePartName) {
          return (
            <Tooltip title={replacePartName} placement="topLeft">
              <span style={{ color: "#1890ff", fontWeight: 500, whiteSpace: "nowrap", overflow: "visible" }}>
                {replacePartName}
              </span>
            </Tooltip>
          );
        }

        return (
          <span style={{ color: "#999" }}>Chưa có phụ tùng thay thế</span>
        );
      },
    },
    {
      title: "SL",
      width: 60,
      align: "center",
      render: (_, r, i) => {
        const isReplace = (r.remedies || "").toUpperCase() === "REPLACE";
        
        // ✅ Nếu không phải "Thay thế" → hiển thị "0"
        if (!isReplace) {
          return "0";
        }
        
        // ✅ Nếu là "Thay thế":
        // - Khi đang làm (canEditFields = true) → hiển thị input field
        // - Sau khi gửi báo giá (canEditFields = false) → hiển thị text
        if (canEditFields && !readOnly) {
          return (
            <Input
              type='number'
              value={r.quantity}
              onChange={(e) => handleChange(i, "quantity", e.target.value)}
              style={{ width: 60 }}
            />
          );
        }
        
        // ✅ Sau khi gửi báo giá → chỉ hiển thị text
        return <span style={{ fontSize: "14px" }}>{r.quantity || 0}</span>;
      },
    },
    {
      title: "Giá PT",
      width: 70,
      align: "right",
      render: (_, r) =>
        r.remedies !== "REPLACE"
          ? ""
          : Number(r.pricePart || 0).toLocaleString(),
    },
    {
      title: "Giá DV",
      width: 70,
      align: "right",
      render: (_, r) => Number(r.priceService || 0).toLocaleString(),
    },
    {
      title: "Tổng",
      width: 100,
      align: "right",
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
          if (statusUpper === "STOCK_NOT_FOUND") return "danger"; // ✅ Hết hàng → màu đỏ
          if (statusUpper === "NOT_FOUND") return "danger"; // ✅ Không tìm thấy hàng → màu đỏ
          if (statusUpper === "STOCK_FOUND") return "warning"; // ✅ Đợi xuất kho → màu vàng
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
            NOT_FOUND: "Không tìm thấy hàng", // ✅ Thêm status mới
            STOCK_FOUND: "Đợi xuất kho",
          };
          return statusMap[statusUpper] || s;
        };
        
        const tagColor = getStatusColor(status);
        // ✅ Dùng custom color cho "Hết hàng" và "Không tìm thấy hàng" để đảm bảo hiển thị màu đỏ
        const statusUpper = (status || "").toUpperCase();
        const finalColor = (statusUpper === "STOCK_NOT_FOUND" || statusUpper === "NOT_FOUND") ? "#ff4d4f" : tagColor;
        
        return (
          <Tag color={finalColor}>
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
        {details.filter((d) => d.id && !hasStockIssue(d)).length > 0 && (
          <Checkbox
            checked={details.filter(d => !hasStockIssue(d)).every((d) => d.status === "COMPLETED")}
            indeterminate={
              details.filter(d => !hasStockIssue(d)).some((d) => d.status === "COMPLETED") &&
              details.filter(d => !hasStockIssue(d)).some((d) => d.status !== "COMPLETED")
            }
            onChange={(e) => {
              const checked = e.target.checked;
              const updated = details.map((item) => {
                // ✅ Chỉ cập nhật status cho item không có vấn đề kho
                if (hasStockIssue(item)) {
                  return item; // Giữ nguyên item có vấn đề kho
                }
                return {
                  ...item,
                  status: checked ? "COMPLETED" : "PENDING",
                };
              });
              setDetails(updated);

              const changes = {};
              updated.forEach((item) => {
                // ✅ Chỉ thêm vào statusChanges nếu không có vấn đề kho
                if (item.id && checked && !hasStockIssue(item)) {
                  changes[item.id] = "COMPLETED";
                }
              });
              setStatusChanges((prev) => ({ ...prev, ...changes }));
            }}
            disabled={!canEditStatus}></Checkbox>
        )}
        <span>Trạng thái</span>
      </div>
    ),
    width: 220,
    render: (_, r, i) => {
      const stat = REPAIR_STATUS[r.status] || REPAIR_STATUS.PENDING;
      
      // ✅ Kiểm tra trạng thái xuất kho: Nếu hết hàng hoặc chờ xuất kho thì không cho tick hoàn thành
      const isStockIssue = hasStockIssue(r);
      // ✅ Cho phép tick status khi REPAIR_IN_PROGRESS (bất kể canEditFields)
      const canEditStatus = !readOnly && evCheckStatus === "REPAIR_IN_PROGRESS";
      const isDisabled = !canEditStatus || isStockIssue;

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


  let columns = baseColumns;
  if (!readOnly && evCheckStatus === "REPAIR_IN_PROGRESS") {
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
        <div className="repair-mode-table" style={{ width: '100%', overflow: 'hidden', maxWidth: '100%' }}>
          <Table
            columns={columns}
            dataSource={details}
            rowKey='id'
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


    </div>
  );
}
