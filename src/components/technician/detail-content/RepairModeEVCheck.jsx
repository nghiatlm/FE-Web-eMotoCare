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
import { findExportNoteStatusByPartItemId } from "../../../services/exportNotesService.js";
import { PlusOutlined } from "@ant-design/icons";
import RMAConfirmationModal from "../../../components/service-staff/RMAConfirmationModal";
import useEVCheckHub from "../../../hooks/useEVCheckHub.jsx";

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

  // options Bộ phận (phụ tùng đang gắn trên xe)
  const [vehiclePartOptions, setVehiclePartOptions] = useState([]);
  const [vehiclePartLoading, setVehiclePartLoading] = useState(true);

  // options Phụ tùng thay thế (phụ tùng trong kho) - DEPRECATED, dùng partOptionsMap thay thế
  const [replacePartOptions, setReplacePartOptions] = useState([]);
  const [replacePartLoading, setReplacePartLoading] = useState(true);

  // ✅ Map phụ tùng đề xuất theo serviceCenterId (load một lần cho tất cả detailId)
  const [partOptionsMap, setPartOptionsMap] = useState({});
  const [partLoading, setPartLoading] = useState(false);
  const [serviceCenterId, setServiceCenterId] = useState(null);

  const [evCheckStatus, setEvCheckStatus] = useState(
    parentEvCheckStatus || null
  );
  const [statusChanges, setStatusChanges] = useState({});

  const [isRMAConfirmationOpen, setIsRMAConfirmationOpen] = useState(false);
  const [currentRMAParts, setCurrentRMAParts] = useState([]);
  const [selectedRMAItems, setSelectedRMAItems] = useState(new Set()); // ✅ Set các item ID đã chọn để tạo RMA
  
  // ✅ Map export note status theo detail ID
  const [exportNoteStatusMap, setExportNoteStatusMap] = useState({});

  // ========= WARRANTY / RMA =========
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
          
          return {
            partItemId,
            value: partItemId,
            label,
            price,
            partItem, // để check bảo hành (đã có part nếu fetch được)
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

  // ========= LOAD PHỤ TÙNG ĐỀ XUẤT (theo serviceCenterId) =========
  const loadSuggestedParts = async () => {
    // ✅ Lấy serviceCenterId từ booking hoặc state
    const centerId = serviceCenterId || booking?.serviceCenterId || booking?.serviceCenter?.id || null;

    if (!centerId) {
      console.warn("Không tìm thấy serviceCenterId từ booking");
      return;
    }

    // ✅ Nếu đã load rồi thì không load lại
    if (partOptionsMap[centerId]?.length > 0) {
      return;
    }

    try {
      setPartLoading(true);
      // ✅ Gọi API với serviceCenterId
      const items = await getPartItemsByServiceCenterService(centerId);
      
      // ✅ Set cho serviceCenterId key
      setPartOptionsMap((prev) => ({
        ...prev,
        [centerId]: items,
      }));
    } catch (e) {
      console.error("Lỗi load phụ tùng đề xuất:", e);
      toast.error("Không tải được danh sách phụ tùng đề xuất");
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
    replacePartId: "",
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

      // ✅ Lấy serviceCenterId để tìm trong partOptionsMap
      const centerId = serviceCenterId || booking?.serviceCenterId || booking?.serviceCenter?.id;
      const allSuggestedParts = centerId ? (partOptionsMap[centerId] || []) : [];

      const mapped = await Promise.all(
        rawDetails.map(async (item) => {
          const partItemId = item.partItem?.id || item.partItemId || "";
          const replacePartId = item.replacePart?.id || item.replacePartId || "";

          const partOption = vehiclePartOptions.find(
            (p) => p.partItemId === partItemId
          );
          
          // ✅ Tìm trong partOptionsMap thay vì replacePartOptions (DEPRECATED)
          let replacePartName = "";
          if (replacePartId) {
            // Tìm trong partOptionsMap
            const replaceOption = allSuggestedParts.find((p) => p.id === replacePartId);
            if (replaceOption) {
              // ✅ Format label với serialNumber: "Tên (Serial)" hoặc "Tên"
              const name = replaceOption.name || "";
              const serial = replaceOption.serialNumber || "";
              replacePartName = serial ? `${name} (${serial})` : name;
            } else {
              // ✅ Nếu không tìm thấy trong partOptionsMap, gọi API để lấy thông tin
              try {
                const partData = await getPartItemByIdService(replacePartId);
                const partName = partData.part?.name || "";
                const serial = partData.serialNumber || "";
                replacePartName = serial ? `${partName} (${serial})` : (partName || partData.serialNumber || replacePartId);
              } catch (err) {
                console.error(`❌ Lỗi lấy thông tin phụ tùng ${replacePartId}:`, err);
                replacePartName = replacePartId; // Fallback về ID nếu lỗi
              }
            }
          }

          const currentStatus = item.status || "PENDING";
          const normalizedStatus =
            currentStatus === "INPROGRESS" ? "IN_PROGRESS" : currentStatus;

          // ✅ Nếu status là COMPLETED và có replacePartId, tìm export note status
          let exportNoteStatus = null;
          if (normalizedStatus === "COMPLETED" && replacePartId) {
            try {
              exportNoteStatus = await findExportNoteStatusByPartItemId(replacePartId);
              console.log(`🔍 Detail ${item.id} - replacePartId: ${replacePartId}, exportNoteStatus:`, exportNoteStatus);
            } catch (err) {
              console.error(`❌ Lỗi tìm export note status cho ${replacePartId}:`, err);
            }
          }

          return {
            ...item,
            partItemId,
            displayName: partOption?.label || partItemId || "",
            partItem: item.partItem || partOption?.partItem || null,
            replacePartId,
            replacePartName: replacePartName || replacePartId || "",
            result: item.result ?? "Tốt", // ✅ Mặc định "Tốt"
            remedies: item.remedies || "NONE",
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

      if (mapped.length > 0) {
        setDetails(mapped);
        toast.success(`✅ Đã tải ${mapped.length} hạng mục từ DB.`);
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
  const canEditFields =
    !readOnly &&
    evCheckStatus !== "INSPECTION_COMPLETED" &&
    evCheckStatus !== "QUOTE_APPROVED";

  const handleChange = (index, field, value) => {
    if (evCheckStatus === "INSPECTION_COMPLETED" && field !== "status") return;
    if (evCheckStatus === "QUOTE_APPROVED" && field !== "status") return;
    if (!canEditFields && field !== "status") return;

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

    if (field === "status") {
      const detailId = details[index]?.id;
      if (detailId) {
        setStatusChanges((prev) => ({ ...prev, [detailId]: value }));
      }
    }
  };

  const addExtraRow = () => setDetails((prev) => [...prev, createEmptyRow()]);

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

      // Nếu REPLACE nhưng không có replacePartId -> báo lỗi FE, không call BE
      if (item.remedies === "REPLACE" && !item.replacePartId) {
        return message.warning(
          "Vui lòng chọn Phụ tùng thay thế cho hạng mục cần thay thế."
        );
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

        if (item.remedies === "REPLACE" && item.replacePartId) {
          payload.replacePartId = item.replacePartId;
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

      // ✅ Cập nhật từng detail
      for (const [detailId, newStatus] of Object.entries(statusChanges)) {
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
    { title: "STT", render: (_, __, i) => i + 1, width: 50 },
    {
      title: "Bộ phận",
      width: 250,
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

                handleChange(i, "partItemId", v);

                // nếu bộ phận đang BHH thì clear phụ tùng thay thế
                const isWarranty = checkWarrantyStatus(partItem);

                updateRow(i, {
                  displayName: sel?.label || "",
                  pricePart: sel?.price || 0,
                  partItem,
                  ...(isWarranty
                    ? {
                        replacePartId: "",
                        replacePartName: "",
                        pricePart: 0,
                      }
                    : {}),
                });
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
      width: 90,
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
          disabled={readOnly || !canEditFields}
          autoSize={{ minRows: 2, maxRows: 8 }}
          style={{ resize: "none", fontSize: 14, maxWidth: "100%" }}
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
        
        // ✅ Lấy phụ tùng từ serviceCenterId thay vì detailId
        const centerId = serviceCenterId || booking?.serviceCenterId || booking?.serviceCenter?.id;
        const allSuggestedParts = centerId ? (partOptionsMap[centerId] || []) : [];

        // ✅ Lấy tên bộ phận hiện tại để filter
        const currentPartName = 
          r.partItem?.part?.name || 
          r.partName || 
          r.displayName?.split(" (")[0] || // Lấy phần tên trước dấu "("
          "";

        // ✅ Filter phụ tùng đề xuất: chỉ hiển thị những phụ tùng có tên trùng với tên bộ phận
        const suggestedParts = currentPartName
          ? allSuggestedParts.filter((p) => {
              const partName = (p.name || "").toLowerCase().trim();
              const currentName = currentPartName.toLowerCase().trim();
              // ✅ So sánh tên: trùng hoàn toàn hoặc chứa tên bộ phận
              return partName === currentName || partName.includes(currentName) || currentName.includes(partName);
            })
          : allSuggestedParts; // Nếu chưa chọn bộ phận thì hiển thị tất cả

        return (
          <Tooltip title={replacePartName} placement="topLeft">
            <Select
              showSearch
              placeholder="Chọn phụ tùng"
              value={
                r.replacePartId
                  ? { value: r.replacePartId, label: r.replacePartName || "..." }
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
              onDropdownVisibleChange={(open) => {
                // ✅ Load suggested parts khi mở dropdown (load một lần cho serviceCenterId)
                if (open && centerId) {
                  loadSuggestedParts();
                }
              }}
              onChange={(opt) => {
                if (!opt) {
                  updateRow(i, {
                    replacePartId: "",
                    replacePartName: "",
                    pricePart: 0,
                  });
                  return;
                }
                // ✅ Tìm trong danh sách đã filter
                const selected = suggestedParts.find((p) => p.id === opt.value);
                const price = selected?.price || 0;
                
                // ✅ Lưu label đầy đủ (có serialNumber) từ opt.label
                // opt.label đã được format: "Tên (Serial)" hoặc "Tên"
                const fullLabel = opt.label || selected?.name || "";

                updateRow(i, {
                  replacePartId: opt.value,
                  replacePartName: fullLabel, // ✅ Lưu label đầy đủ với serialNumber
                  pricePart: price,
                });
              }}
              options={suggestedParts.map((p) => {
                // ✅ Hiển thị tên và serialNumber giống cột "Bộ phận"
                const name = p.name || "";
                const serial = p.serialNumber || "";
                const label = serial ? `${name} (${serial})` : name;
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
    {
      title: "Trạng thái phụ tùng",
      width: 150,
        render: (_, r) => {
          // ✅ Chỉ hiển thị khi status là COMPLETED
          if (r.status === "COMPLETED") {
            const status = r.exportNoteStatus || exportNoteStatusMap[r.id] || "-";
            return <span>{status}</span>;
          }
          return "-";
        },
    },
  ];

  // Cột trạng thái cho mode sửa chữa (giống MaintenanceModeEVCheck)
  const statusColumn = {
    title: (
      <div className='flex items-center gap-2'>
        {details.filter((d) => d.id).length > 0 && (
          <Checkbox
            checked={details.every((d) => d.status === "COMPLETED")}
            indeterminate={
              details.some((d) => d.status === "COMPLETED") &&
              details.some((d) => d.status !== "COMPLETED")
            }
            onChange={(e) => {
              const checked = e.target.checked;
              const updated = details.map((item) => ({
                ...item,
                status: checked ? "COMPLETED" : "PENDING",
              }));
              setDetails(updated);

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

  // ✅ Cột RMA: checkbox để chọn nhiều items với checkbox "Chọn tất cả" trong header
  const eligibleItems = details.filter((r) => isRMAEligible(r));
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
    columns = [...columns, statusColumn];
  }
  // ✅ Chỉ hiện cột RMA cho staff (readOnly = true), technician không được tạo RMA
  if (readOnly && details.some((r) => isRMAEligible(r))) {
    columns = [...columns, rmaColumn];
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
        <Table
          columns={columns}
          dataSource={details}
          rowKey='id'
          scroll={{ x: 'max-content' }}
          pagination={false}
          size='small'
          bordered
        />
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

      {/* ✅ Nút tạo RMA chỉ cho staff (readOnly = true) khi có items đã chọn */}
      {readOnly && selectedRMAItems.size > 0 && (
        <div className='flex justify-end mt-4'>
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
          loadRepairDetails();
          setIsRMAConfirmationOpen(false);
        }}
      />
    </div>
  );
}
