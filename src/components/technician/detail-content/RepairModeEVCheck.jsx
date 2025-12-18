
import { useState, useEffect, useCallback, useMemo } from "react";
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
import RMAConfirmationModal from "../../../components/service-staff/RMAConfirmationModal";
import useEVCheckHub from "../../../hooks/useEVCheckHub.jsx";
import useRMAHub from "../../../hooks/useRMAHub.jsx";
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
  onViewBatteryDetail = null,
}) {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoSavingItems, setAutoSavingItems] = useState(new Set());


  const [vehiclePartOptions, setVehiclePartOptions] = useState([]);
  const [vehiclePartLoading, setVehiclePartLoading] = useState(true);


  const [replacePartOptions, setReplacePartOptions] = useState([]);
  const [replacePartLoading, setReplacePartLoading] = useState(true);


  const [partOptionsMap, setPartOptionsMap] = useState({});
  const [partLoading, setPartLoading] = useState(false);
  const [serviceCenterId, setServiceCenterId] = useState(null);

  const [partTypeIdCache, setPartTypeIdCache] = useState({});

  const [evCheckStatus, setEvCheckStatus] = useState(
    parentEvCheckStatus || null
  );
  const [statusChanges, setStatusChanges] = useState({});

  const [isRMAConfirmationOpen, setIsRMAConfirmationOpen] = useState(false);
  const [currentRMAParts, setCurrentRMAParts] = useState([]);
  const [selectedRMAItems, setSelectedRMAItems] = useState(new Set());
  const [isRMASubmitting, setIsRMASubmitting] = useState(false);
  

  const [exportNoteStatusMap, setExportNoteStatusMap] = useState({});


  const checkWarrantyStatus = (partItem) => {
    if (!partItem) return false;

    return partItem.isManufacturerWarranty === true;
  };


  const hasRMA = (row) => {
    return !!(row.rmaDetail || row.rmaDetailId || row.rmaDetail?.id);
  };


  const hasStockIssue = (row) => {
    const exportStatus = row?.exportNoteStatus || exportNoteStatusMap[row?.id];
    const exportStatusUpper = (exportStatus || "").toUpperCase();
    return exportStatusUpper === "STOCK_NOT_FOUND" || exportStatusUpper === "NOT_FOUND" || exportStatusUpper === "STOCK_FOUND";
  };


  const isWarrantyItemSent = (row) => {
    if (!checkWarrantyStatus(row?.partItem)) return false;
    

    if (hasRMA(row)) return true;
    

    const result = (row.result || "").trim().toLowerCase();
    const isNotGood = result !== "tốt" && result !== "tot" && result !== "";
    if (isNotGood) return true;
    

    return false;
  };


  const isRMAEligible = (row) => {
    const remedies = (row.remedies || "").toUpperCase();
    return (
      remedies === "WARRANTY" &&
      !hasRMA(row)
    );
  };


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


  const openRMAModal = () => {
    if (isRMASubmitting) return;
    
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

    setIsRMASubmitting(true);
  };


  useEffect(() => {
    const loadVehicleParts = async () => {
      setVehiclePartLoading(true);
      try {
        const vehicleId = booking?.vehicle?.id || booking?.vehicleId;

        if (!vehicleId) {
          setVehiclePartOptions([]);
          return;
        }

        const items = await fetchVehiclePartItems({
          vehicleId,
          pageCurrent: 1,
          pageSize: 500,
        });



        const optionsMap = new Map();
        

        const fetchPromises = (items || []).map(async (vpi, index) => {

          let partItem = vpi?.partItem || {};
          let part = partItem?.part || {};


          if (!part || Object.keys(part).length === 0) {
            try {
              const partItemDetail = await getPartItemByIdService(vpi.partItemId);
              

              if (partItemDetail) {
                partItem = {
                  ...partItem,
                  ...partItemDetail,
                  part: partItemDetail.part || partItem.part || null,
                };
                part = partItemDetail.part || {};
              }
            } catch (err) {

            }
          }


          

          const partName = part?.name || "";
          const serial = partItem?.serialNumber || "";
          const partCode = part?.code || "";
          const price = Number(partItem?.price || 0);


          let label = "";
          if (partName) {

            label = serial ? `${partName} (${serial})` : partName;
          } else {

            label = serial || partCode || "Không rõ";
          }


          const partItemId = vpi.partItemId;
          const partId = part?.id || null;
          

          if (partId && part.partType?.id) {
            setPartTypeIdCache(prev => ({
              ...prev,
              [partId]: part.partType.id
            }));
          }

          return {
            partItemId,
            value: partItemId,
            label,
            price,
            partItem,
            partId,
          };
        });


        const resolvedOptions = await Promise.all(fetchPromises);


        resolvedOptions.forEach((option) => {
          const partItemId = option.partItemId;
          

          if (optionsMap.has(partItemId)) {
            const existing = optionsMap.get(partItemId);

            if (option.partItem?.part?.name && !existing.partItem?.part?.name) {
              optionsMap.set(partItemId, option);
            }
          } else {

            optionsMap.set(partItemId, option);
          }
        });


        const options = Array.from(optionsMap.values());

        setVehiclePartOptions(options);
      } catch (err) {
        toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không tải được phụ tùng gắn trên xe!"));
        setVehiclePartOptions([]);
      } finally {
        setVehiclePartLoading(false);
      }
    };

    loadVehicleParts();
  }, [booking?.vehicle, booking?.vehicleId]);


  const loadSuggestedParts = async (partTypeId) => {

    const modelId = booking?.vehicle?.modelId || null;

    if (!modelId) {
      return;
    }

    if (!partTypeId) {
      return;
    }


    const cacheKey = `${modelId}_${partTypeId}`;


    if (partOptionsMap[cacheKey]?.length > 0) {
      return Promise.resolve();
    }

    try {
      setPartLoading(true);


      const { getPartsByModelAndTypeService } = await import("../../../services/partitemsService");
      const items = await getPartsByModelAndTypeService(modelId, partTypeId);
      

      setPartOptionsMap((prev) => ({
        ...prev,
        [cacheKey]: items,
      }));
    } catch (e) {



      if (e?.statusCode !== 500 && e?.response?.status !== 500) {
        toast.error((e?.response?.data?.message || e?.data?.message || e?.message || "Không tải được danh sách phụ tùng đề xuất"));
      } else {
      }

      setPartOptionsMap((prev) => ({
        ...prev,
        [cacheKey]: [],
      }));
    } finally {
      setPartLoading(false);
    }
  };


  useEffect(() => {
    const centerId = 
      booking?.serviceCenterId || 
      booking?.serviceCenter?.id || 
      null;
    if (centerId) {
      setServiceCenterId(centerId);
    }
  }, [booking?.serviceCenterId, booking?.serviceCenter?.id]);


  useEffect(() => {
    if (serviceCenterId) {
      loadSuggestedParts();
    }

  }, [serviceCenterId]);



  useEffect(() => {
    const loadReplaceParts = async () => {
      setReplacePartLoading(true);
      try {

        const staffRaw = localStorage.getItem("user");
        const staff = staffRaw ? JSON.parse(staffRaw) : null;
        const serviceCenterInventoryId = staff?.serviceCenterInventoryId;

        const data = await getPartItemsService({
          serviceCenterInventoryId,
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

        setReplacePartOptions(options);
      } catch (err) {
        toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không tải được phụ tùng trong kho!"));
        setReplacePartOptions([]);
      } finally {
        setReplacePartLoading(false);
      }
    };

    loadReplaceParts();
  }, []);


  const createEmptyRow = () => ({
    id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    partItemId: "",
    displayName: "",
    proposedReplacePartId: "",
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


  const updatePriceService = async (index, remedies, rowData = null) => {

    if (remedies === "NONE") {
      updateRow(index, { priceService: 0 });
      return;
    }

    if (!["TUNE", "CLEAN", "REPAIR", "REPLACE", "WARRANTY"].includes(remedies)) {
      updateRow(index, { priceService: 0 });
      return;
    }
    

    const currentRow = rowData || details[index];
    if (!currentRow) {
      updateRow(index, { priceService: 0 });
      return;
    }
    

    if (checkWarrantyStatus(currentRow?.partItem)) {
      updateRow(index, { priceService: 0 });
      return;
    }
    

    const partId = currentRow?.partItem?.part?.id || null;
    let partTypeId = null;
    

    if (currentRow?._partTypeId) {
      partTypeId = currentRow._partTypeId;
    }
    

    if (!partTypeId && partId) {
      partTypeId = partTypeIdCache[partId] || null;
    }
    

    if (!partTypeId) {
      partTypeId = currentRow?.partItem?.part?.partType?.id || null;
    }
    
    if (!partTypeId) {
      updateRow(index, { priceService: 0 });
      return;
    }
    
    
    try {
      const cost = await getLaborCostByRemediesService(partTypeId, remedies);
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


  const loadRepairDetails = useCallback(async () => {
    if (!evCheckId || forceEmpty) return;
    setLoading(true);
    try {
      const res = await getRepairDetailsList(evCheckId);


      let rawDetails = [];
      let statusValue = null;


      if (Array.isArray(res?.evCheckDetails)) {
        rawDetails = res.evCheckDetails;
        statusValue = res.status || null;
      } else if (Array.isArray(res?.rowDatas) && res.rowDatas.length > 0) {
        rawDetails = res.rowDatas[0].evCheckDetails || [];
        statusValue = res.rowDatas[0].status || res.status || null;
      } else if (res?.data) {

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


      rawDetails = rawDetails.filter((item) => item != null);




      const mapped = await Promise.all(
        rawDetails.map(async (item) => {
        const partItemId = item.partItem?.id || item.partItemId || "";
        const replacePartId = item.proposedReplacePart?.id || item.proposedReplacePartId || "";

        const partOption = vehiclePartOptions.find(
          (p) => p.partItemId === partItemId
        );
          

          let replacePartName = "";
          if (replacePartId) {


            if (item.proposedReplacePart) {
              const proposedPart = item.proposedReplacePart;
              const partName = proposedPart.name || "";
              const code = proposedPart.code || "";
              replacePartName = code ? `${partName} (${code})` : (partName || "");
            } else {


              try {
                const { getPartById } = await import("../../../api/partsApi");
                const partDetailRes = await getPartById(replacePartId);
                const partDetail = partDetailRes?.data?.data || partDetailRes?.data || partDetailRes;
                const partName = partDetail?.name || "";
                const code = partDetail?.code || "";
                replacePartName = code ? `${partName} (${code})` : (partName || "");
              } catch (err) {

                replacePartName = "";
              }
            }
          }

        const currentStatus = item.status || "PENDING";
        const normalizedStatus =
          currentStatus === "INPROGRESS" ? "IN_PROGRESS" : currentStatus;


          let exportNoteStatus = null;
          const appointmentCode = booking?.code || null;
          if (replacePartId && appointmentCode) {
            try {
              exportNoteStatus = await getExportStatusByAppointmentCodeAndPartId(appointmentCode, replacePartId);
            } catch (err) {
            }
          }


        let partItemForPrice = item.partItem || partOption?.partItem || null;
        const pricePart = Number(partItemForPrice?.price || item.pricePart || 0);
        

        const partIdFromItem = partItemForPrice?.part?.id || partOption?.partId || null;
        let partTypeIdFromItem = 
          partItemForPrice?.part?.partType?.id || 
          partOption?.partItem?.part?.partType?.id || 
          null;
        

        if (!partTypeIdFromItem && partIdFromItem) {
          partTypeIdFromItem = partTypeIdCache[partIdFromItem] || null;
        }
        

        if (!partTypeIdFromItem && partItemId) {
          const vehiclePartOption = vehiclePartOptions.find(p => p.partItemId === partItemId);
          if (vehiclePartOption) {
            partTypeIdFromItem = vehiclePartOption?.partItem?.part?.partType?.id || null;

            const partIdFromOption = vehiclePartOption?.partId || vehiclePartOption?.partItem?.part?.id || null;
            if (partIdFromOption && partTypeIdFromItem) {
              setPartTypeIdCache(prev => ({
                ...prev,
                [partIdFromOption]: partTypeIdFromItem
              }));
            }
          }
        }
        

        if (partIdFromItem && partTypeIdFromItem) {
          setPartTypeIdCache(prev => {

            if (prev[partIdFromItem]) return prev;
            return {
              ...prev,
              [partIdFromItem]: partTypeIdFromItem
            };
          });
        }


        const isWarranty = checkWarrantyStatus(partItemForPrice);
        const initialPriceService = isWarranty ? 0 : Number(item.priceService || 0);


        let displayName = "";
        if (partOption?.label) {
          displayName = partOption.label;
        } else if (partItemForPrice?.part?.name) {
          const serial = partItemForPrice.serialNumber || "";
          displayName = serial ? `${partItemForPrice.part.name} (${serial})` : partItemForPrice.part.name;
        } else if (partItemId) {

          try {
            const partItemDetail = await getPartItemByIdService(partItemId);
            if (partItemDetail?.part?.name) {
              const serial = partItemDetail.serialNumber || "";
              displayName = serial ? `${partItemDetail.part.name} (${serial})` : partItemDetail.part.name;

              if (!partItemForPrice || !partItemForPrice.part) {
                partItemForPrice = {
                  ...partItemForPrice,
                  ...partItemDetail,
                  part: partItemDetail.part || partItemForPrice?.part || null,
                };
              }
            }
          } catch (err) {

            displayName = partItemId;
          }
        }
        
        return {
          ...item,
          partItemId,
          displayName: displayName || partItemId || "",
          partItem: partItemForPrice,
          proposedReplacePartId: replacePartId,
            replacePartName: replacePartName || "",
            result: item.result ?? "",
          remedies: item.remedies || "NONE",
          // ✅ Chỉ hiển thị giá PT khi đã chọn phụ tùng thay thế
          pricePart: replacePartId ? pricePart : 0,
          priceService: initialPriceService,
          totalAmount: Number(item.totalAmount || 0),
          quantity: Number(item.quantity || 1),
          unit: item.unit || "cái",
          status: normalizedStatus,
            exportNoteStatus,
          isNew: false,
        };
        })
      );
      

      const statusMap = {};
      mapped.forEach((item) => {
        if (item.id && item.exportNoteStatus) {
          statusMap[item.id] = item.exportNoteStatus;
        }
      });
      setExportNoteStatusMap(statusMap);


      if (mapped.length > 0) {
        setDetails(mapped);
        

        mapped.forEach((row, index) => {
          if (
            (!row.priceService || Number(row.priceService) === 0) &&
            ["TUNE", "CLEAN", "REPAIR", "REPLACE", "WARRANTY"].includes(row.remedies) &&
            row.partItem
          ) {

            updatePriceService(index, row.remedies, row);
          }
        });
      } else {
        setDetails(readOnly ? [] : [createEmptyRow()]);
      }


      if (statusValue) {
        setEvCheckStatus(statusValue);
      } else if (parentEvCheckStatus) {
        setEvCheckStatus(parentEvCheckStatus);
      } else {

      }

      setStatusChanges({});
    } catch (err) {
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


  const handleEVCheckUpdate = useCallback(() => {
    if (evCheckId && !forceEmpty && !vehiclePartLoading && !replacePartLoading) {
      loadRepairDetails();
      if (onRefresh) {
        onRefresh();
      }
    }
  }, [evCheckId, forceEmpty, vehiclePartLoading, replacePartLoading, loadRepairDetails, onRefresh]);

  useEVCheckHub(evCheckId, handleEVCheckUpdate);


  const handleRMAUpdate = useCallback(() => {
    if (evCheckId && !forceEmpty && !vehiclePartLoading && !replacePartLoading) {
      loadRepairDetails();
      if (onRefresh) {
        onRefresh();
      }
    }
  }, [evCheckId, forceEmpty, vehiclePartLoading, replacePartLoading, loadRepairDetails, onRefresh]);

  useRMAHub(handleRMAUpdate);




  const canEditFields =
    !readOnly &&
    evCheckStatus !== "INSPECTION_COMPLETED" &&
    evCheckStatus !== "QUOTE_APPROVED" &&
    evCheckStatus !== "REPAIR_IN_PROGRESS" &&
    evCheckStatus !== "REPAIR_COMPLETED" &&
    evCheckStatus !== "COMPLETED";
  





  const canEditStatus =
    !readOnly &&
    evCheckStatus !== "INSPECTION_COMPLETED" &&
    evCheckStatus !== "REPAIR_COMPLETED" &&
    evCheckStatus !== "COMPLETED";


  useEffect(() => {
    if (!canEditFields || loading || !evCheckId) return;

    const autoSaveBatteryItems = async () => {
      for (let i = 0; i < details.length; i++) {
        const item = details[i];
        if (!item || !item.partItemId) continue;
        

        const itemKey = `${item.partItemId}-${item.remedies}`;
        if (autoSavingItems.has(itemKey) || (item.id && !item.id.startsWith("temp_"))) {
          continue;
        }
        

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
        

        if (isBattery && item.remedies) {
          setAutoSavingItems(prev => new Set(prev).add(itemKey));
          try {
            await saveSingleItem(i, true);
          } finally {

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


    if (details.length > 0) {
      const timer = setTimeout(() => {
        autoSaveBatteryItems();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [details, canEditFields, loading, evCheckId]);

  const handleChange = (index, field, value) => {

    if (field === "status") {
      if (!canEditStatus) return;
      
      const currentRow = details[index];
      




      if (isWarrantyItemSent(currentRow)) {
        toast.error("Không thể cập nhật trạng thái cho bộ phận đã gửi đi bảo hành.");
        return;
      }
      

      if (hasStockIssue(currentRow) && value === "COMPLETED") {
        toast.error("Không thể đánh dấu hoàn thành khi phụ tùng hết hàng hoặc đang chờ xuất kho.");
        return;
      }
    } else {

      if (evCheckStatus === "INSPECTION_COMPLETED") return;
      if (evCheckStatus === "QUOTE_APPROVED") return;
      if (!canEditFields) return;
    }


    if (field === "remedies" && (value === "REPLACE" || value === "REPAIR")) {
      const currentRow = details[index];
      if (checkWarrantyStatus(currentRow?.partItem)) {
        toast.error(
          "Bộ phận đang trong thời gian bảo hành. Chỉ cho phép 'Không làm gì', 'Bôi trơn' hoặc 'Kiểm tra'."
        );
        return;
      }
    }


    const currentRow = details[index];
    
    updateRow(index, { [field]: value });


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

      const updatedRow = { ...currentRow, [field]: value };
      updatePriceService(index, value, updatedRow);
      

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

        setTimeout(async () => {
          await saveSingleItem(index, true);
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


    if (item.id && !item.id.startsWith("temp_")) {
      return item.id;
    }

    try {
      const payload = {
        partItemId: item.partItemId,
        result: (item.result || "").trim(),
        remedies: item.remedies ?? "NONE",
        unit: item.unit || "cái",
        priceService: Number(item.priceService || 0),
        totalAmount: Number(item.totalAmount || 0),
        status: item.status || "PENDING",
      };


      if (item.remedies === "REPLACE" && item.proposedReplacePartId) {
        payload.proposedReplacePartId = item.proposedReplacePartId;
        payload.quantity = Number(item.quantity || 1);
        payload.pricePart = Number(item.pricePart || 0);
      } else {

        payload.quantity = null;
        payload.pricePart = null;
      }

      if (item.isNew) {
        payload.evCheckId = evCheckId;
        const result = await createEVCheckDetailService(payload);

        await loadRepairDetails();
        return result?.data?.id || result?.id;
      } else {
        await updateEVCheckDetailService(item.id, payload);
        return item.id;
      }
    } catch (err) {
      if (!silent) toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể lưu hạng mục!"));
      return null;
    }
  };


  const saveAll = async () => {

    if (loading) return;

    const itemsToSave = details.filter((item) => item.partItemId);

    if (itemsToSave.length === 0) {
      return toast.warning("Vui lòng chọn Bộ phận.");
    }

    for (const item of itemsToSave) {
      if (!item.remedies) return toast.warning("Vui lòng chọn Biện pháp!");


      if ((item.remedies === "REPLACE" || item.remedies === "REPAIR") && checkWarrantyStatus(item.partItem)) {
        return toast.error(
          "Bộ phận đang trong thời gian bảo hành. Chỉ cho phép 'Kiểm tra' hoặc 'Bôi trơn'."
        );
      }


      if (item.remedies === "WARRANTY" && !checkWarrantyStatus(item.partItem)) {
        return toast.error(
          "Bộ phận không còn trong thời gian bảo hành. Không thể chọn biện pháp 'Bảo hành'."
        );
      }


      if (item.remedies === "REPLACE" && !item.proposedReplacePartId) {
        toast.error(
          "Vui lòng chọn Phụ tùng thay thế cho hạng mục cần thay thế."
        );
        return;
      }


    }

    if (!evCheckId) return toast.error("Thiếu EVCheckId!");

    try {
      setLoading(true);
      const loadingToast = toast.loading("Đang lưu hạng mục sửa chữa...");

      for (const item of itemsToSave) {
        const payload = {
          partItemId: item.partItemId,
          result: (item.result || "").trim(),
          remedies: item.remedies ?? "NONE",
          unit: item.unit || "cái",
          priceService: Number(item.priceService || 0),
          totalAmount: Number(item.totalAmount || 0),
          status: item.status || "PENDING",
        };


        if (item.remedies === "REPLACE" && item.proposedReplacePartId) {
          payload.proposedReplacePartId = item.proposedReplacePartId;
          payload.quantity = Number(item.quantity || 1);
          payload.pricePart = Number(item.pricePart || 0);
        } else {

          payload.quantity = null;
          payload.pricePart = null;
        }

        if (item.isNew) {

          payload.evCheckId = evCheckId;
          await createEVCheckDetailService(payload);
        } else {

          await updateEVCheckDetailService(item.id, payload);
        }
      }


      await updateEVCheckService(evCheckId, { status: "INSPECTION_COMPLETED" });


      setEvCheckStatus("INSPECTION_COMPLETED");
      
      toast.dismiss(loadingToast);
      toast.success("Gửi báo giá thành công!");


      await loadRepairDetails();
      

      setEvCheckStatus("INSPECTION_COMPLETED");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể lưu hạng mục sửa chữa!"));
    } finally {
      setLoading(false);
    }
  };


  const handleConfirmRepair = async () => {

    if (loading) return;

    if (!Object.keys(statusChanges).length) {
      return toast.info("Chưa có thay đổi trạng thái nào để lưu.");
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading("Đang cập nhật trạng thái hạng mục...");


      const filteredStatusChanges = {};
      for (const [detailId, newStatus] of Object.entries(statusChanges)) {
        const detail = details.find(d => d.id === detailId);

        if (detail && isWarrantyItemSent(detail)) {
          continue;
        }
        filteredStatusChanges[detailId] = newStatus;
      }


      if (!Object.keys(filteredStatusChanges).length) {
        toast.dismiss(loadingToast);
        toast.warning("Không có item nào được cập nhật. Các item đã gửi đi bảo hành không thể cập nhật trạng thái.");
        return;
      }




      const afterQuoteStatuses = [
        "INSPECTION_COMPLETED",
        "QUOTE_APPROVED", 
        "REPAIR_IN_PROGRESS",
        "REPAIR_COMPLETED",
        "COMPLETED"
      ];
      
      const filteredOutDetails = details.filter((detail) => {
        if (!afterQuoteStatuses.includes(evCheckStatus)) {
          return false;
        }
        const remedies = (detail.remedies || "").toUpperCase();


        return remedies !== "REPAIR" && remedies !== "REPLACE" && remedies !== "WARRANTY";
      });


      for (const detail of filteredOutDetails) {
        if (detail.id && !detail.id.startsWith("temp_")) {

          if (!statusChanges[detail.id]) {
            await updateEVCheckDetailService(detail.id, { status: "COMPLETED" });
          }
        }
      }


      for (const [detailId, newStatus] of Object.entries(filteredStatusChanges)) {
        await updateEVCheckDetailService(detailId, { status: newStatus });
      }

      toast.dismiss(loadingToast);
      

      setStatusChanges({});


      await loadRepairDetails();


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



      const relevantDetails = rawDetails.filter((d) => {
        const remedies = (d.remedies || "").toUpperCase();
        

        if (remedies === "REPAIR" || remedies === "REPLACE" || remedies === "WARRANTY") {
          return true;
        }
        

        const detailInState = details.find(detail => detail.id === d.id);
        const detailToCheck = detailInState || d;
        if (isBatteryItem(detailToCheck) && hasBatteryData(detailToCheck)) {
          return true;
        }
        
        return false;
      });



      const detailsToCheck = relevantDetails.filter((d) => {

        const detailInState = details.find(detail => detail.id === d.id);
        const detailToCheck = detailInState || d;
        


        if (isWarrantyItemSent(detailToCheck)) {
          return false;
        }
        return true;
      });

      const warrantyItemsSent = relevantDetails.filter((d) => {
        const detailInState = details.find(detail => detail.id === d.id);
        const detailToCheck = detailInState || d;
        return isWarrantyItemSent(detailToCheck);
      });



      const allCompleted = 
        (detailsToCheck.length === 0 && relevantDetails.length > 0 && warrantyItemsSent.length === relevantDetails.length) ||
        (detailsToCheck.length > 0 && detailsToCheck.every((d) => {
          const statusUpper = (d.status || "").toUpperCase();
          return statusUpper === "COMPLETED";
        }));

      if (allCompleted) {
        await updateEVCheckService(evCheckId, { status: "REPAIR_COMPLETED" });
        setEvCheckStatus("REPAIR_COMPLETED");
        

        if (booking?.id) {
          try {

            const { getAppointmentById } = await import("../../../api/appointmentsApi");
            const appointmentRes = await getAppointmentById(booking.id);
            
            const currentAppointment = appointmentRes?.data?.data || appointmentRes?.data || appointmentRes;
            

            const updatePayload = {
              note: currentAppointment?.note || booking?.note || "",
              approveById: currentAppointment?.approveById || booking?.approveById || null,
              code: currentAppointment?.code || booking?.code || "",
              checkinQRCode: currentAppointment?.checkinQRCode || booking?.checkinQRCode || "",
            };
            
            const updateResult = await changeAppointmentStatusService(booking.id, "REPAIR_COMPLETED", updatePayload);
            

            const verifyRes = await getAppointmentById(booking.id);
            const verifiedAppointment = verifyRes?.data?.data || verifyRes?.data || verifyRes;
            
            if (verifiedAppointment?.status !== "REPAIR_COMPLETED") {
              toast.warning(`Appointment status: ${verifiedAppointment?.status}`);
            }
          } catch (err) {
            toast.error(`Lỗi cập nhật appointment: ${err.response?.data?.message || err.message || "Unknown error"}`);

            return;
          }
        } else {
        }
        

        await loadRepairDetails();
        toast.success("Cập nhật trạng thái thành công!");
      } else {
        if (detailsToCheck.length > 0) {
          const notCompleted = detailsToCheck.filter(d => d.status !== "COMPLETED");
        }
      }

      onRefresh?.();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể cập nhật trạng thái hạng mục!"));
    } finally {
      setLoading(false);
    }
  };


  const baseColumns = [
    { title: "STT", render: (_, __, i) => i + 1, width: 35, align: "center" },
    {
      title: "Bộ phận",
      width: 180,
      ellipsis: {
        showTitle: true,
      },
      render: (_, r, i) => {
        const displayName = r.displayName || "";
        const partItemId = r.partItemId || "";
        

        const selectedOption = vehiclePartOptions.find((p) => p.partItemId === partItemId);
        

        let partName = "";
        if (selectedOption?.label) {
          partName = selectedOption.label;
        } else if (r.partItem?.part?.name) {
          const serial = r.partItem.serialNumber || "";
          partName = serial ? `${r.partItem.part.name} (${serial})` : r.partItem.part.name;
        } else if (displayName && displayName !== partItemId) {

          partName = displayName;
        } else if (partItemId) {



        }
        

        const allOptions = [...vehiclePartOptions];
        if (partItemId && !selectedOption) {

          let labelToUse = partName;
          if (!labelToUse && r.partItem?.part?.name) {
            const serial = r.partItem.serialNumber || "";
            labelToUse = serial ? `${r.partItem.part.name} (${serial})` : r.partItem.part.name;
          }
          

          if (labelToUse || r.partItem) {
            allOptions.push({
              partItemId,
              value: partItemId,
              label: labelToUse || partItemId,
              price: r.pricePart || 0,
              partItem: r.partItem || null,
              partId: r.partItem?.part?.id || null,
            });
          }
        }
        
        return (
          <Tooltip title={partName || displayName || partItemId} placement="topLeft">
        <Select
          showSearch
          placeholder='Chọn bộ phận'
          value={r.partItemId || undefined}
          style={{ width: "100%", minWidth: "160px" }}
          onChange={(v) => {
            const sel = allOptions.find((p) => p.partItemId === v);
            const partItem = sel?.partItem;
            const part = partItem?.part || {};
            const partId = sel?.partId || part?.id || null;

            handleChange(i, "partItemId", v);


            let partTypeId = null;
            if (partId) {

              partTypeId = partTypeIdCache[partId] || null;
              

              if (!partTypeId && part?.partType?.id) {
                partTypeId = part.partType.id;

                setPartTypeIdCache(prev => ({
                  ...prev,
                  [partId]: partTypeId
                }));
              }
            }


            const isWarranty = checkWarrantyStatus(partItem);


            // Không load giá PT khi chọn bộ phận, chỉ load khi chọn phụ tùng thay thế
            const enrichedPartItem = partItem ? {
              ...partItem,
              part: part || partItem.part || null
            } : null;

            const updatedRow = {
              displayName: sel?.label || "",
              pricePart: 0, // Giá PT = 0, chờ chọn phụ tùng thay thế mới load giá
              partItem: enrichedPartItem,
              ...(isWarranty
                ? {
                    replacePartId: "",
                    replacePartName: "",
                    pricePart: 0,
                  }
                : {}),
            };
            
            updateRow(i, updatedRow);
            

            const currentRemedies = details[i]?.remedies || "NONE";
            if (["TUNE", "CLEAN", "REPAIR", "REPLACE"].includes(currentRemedies)) {

              const rowDataWithNewPartItem = { 
                ...details[i], 
                ...updatedRow,

                _partTypeId: partTypeId || part?.partType?.id || null
              };
              updatePriceService(i, currentRemedies, rowDataWithNewPartItem);
            }
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
      width: 150,
      render: (_, r, i) => {

        const partName = r.partItem?.part?.name || r.displayName || "";
        const partCode = r.partItem?.part?.code || "";
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
        

        if (isBattery && r.partItemId) {
          return (
            <div style={{ width: "100%" }}>
              
              {r.id && !r.id.startsWith("temp_") ? (
                <BatteryDataDisplay 
                  evCheckDetailId={r.id}
                  initialBatteryData={r.batteryCheck || r.batteryData || null}
                  canImport={

                    !readOnly && (
                      canEditFields || 
                      evCheckStatus === "INSPECTION_COMPLETED" ||
                      evCheckStatus === "QUOTE_APPROVED" ||
                      evCheckStatus === "REPAIR_IN_PROGRESS"
                    )
                  }
                  canView={true}
                  onViewDetail={onViewBatteryDetail}
                />
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          );
        }
        

        return (
          <Input.TextArea
            value={r.result ?? ""}
            onChange={(e) => handleChange(i, "result", e.target.value)}
            disabled={readOnly || !canEditFields}
            autoSize={{ minRows: 2, maxRows: 8 }}
            style={{ resize: "none", fontSize: 14, width: "100%" }}
          />
        );
      },
    },
    {
      title: "Biện pháp",
      width: 90,
      render: (_, r, i) => {
        const isWarranty = checkWarrantyStatus(r.partItem);

        const afterQuoteStatuses = [
          "INSPECTION_COMPLETED",
          "QUOTE_APPROVED", 
          "REPAIR_IN_PROGRESS",
          "REPAIR_COMPLETED",
          "COMPLETED"
        ];
        const isAfterQuote = afterQuoteStatuses.includes(evCheckStatus);


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
          return map[normalized] || "Không";
        };

        const remediesValue = r.remedies || "NONE";
        const remediesLabel = getRemediesLabel(remediesValue);

        return (
          <Select
            placeholder='Biện pháp'
            value={remediesValue ? { value: remediesValue, label: remediesLabel } : undefined}
            labelInValue={true}
            style={{ width: 100 }}
            onChange={(v) => handleChange(i, "remedies", v.value || v)}
            disabled={readOnly || !canEditFields}>
            <Option value='NONE'>Không</Option>
            <Option value='TUNE'>Điều chỉnh</Option>
            {!isAfterQuote && <Option value='CLEAN'>Vệ sinh</Option>}
            
            {!isWarranty && <Option value='REPLACE'>Thay thế</Option>}
            {!isWarranty && <Option value='REPAIR'>Sửa chữa</Option>}
            
            {isWarranty && <Option value='WARRANTY'>Bảo hành</Option>}
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


        if (isWarranty) {
        return (
            <Tooltip title="Bộ phận còn trong thời gian bảo hành" placement="topLeft">
              <span style={{ color: "#ff4d4f", fontWeight: 500 }}>
                Còn bảo hành
              </span>
            </Tooltip>
          );
        }
        

        const modelId = booking?.vehicle?.modelId || null;
        let partTypeId = null;
        

        let partId = r.partItem?.part?.id || null;
        if (!partId && r.partItemId) {
          const vehiclePart = vehiclePartOptions.find(vp => vp.partItemId === r.partItemId);
          partId = vehiclePart?.partId || null;
        }
        

        if (partId) {
          partTypeId = partTypeIdCache[partId] || r.partItem?.part?.partType?.id || null;
        }
        

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

                if (open) {


                  if (r.proposedReplacePartId && !r.replacePartName) {
                    try {

                      const { getPartById } = await import("../../../api/partsApi");
                      const partDetailRes = await getPartById(r.proposedReplacePartId);
                      const partDetail = partDetailRes?.data?.data || partDetailRes?.data || partDetailRes;
                      const partName = partDetail?.name || "";
                      const code = partDetail?.code || "";
                      const loadedName = code ? `${partName} (${code})` : (partName || "");
                      if (loadedName) {
                        updateRow(i, { replacePartName: loadedName });
                      }
                    } catch (err) {
                    }
                  }
                  

                  let partId = r.partItem?.part?.id || null;
                  
                  if (!partId && r.partItemId) {
                    const vehiclePart = vehiclePartOptions.find(vp => vp.partItemId === r.partItemId);
                    partId = vehiclePart?.partId || null;
                  }
                  

                  let partTypeId = partId ? partTypeIdCache[partId] : null;
                  

                  if (!partTypeId && r.partItemId) {
                    const vehiclePart = vehiclePartOptions.find(vp => vp.partItemId === r.partItemId);
                    if (vehiclePart?.partItem?.part?.partType?.id) {
                      partTypeId = vehiclePart.partItem.part.partType.id;

                      if (partId) {
                        setPartTypeIdCache(prev => ({
                          ...prev,
                          [partId]: partTypeId
                        }));
                      }
                    }
                  }
                  

                  if (!partTypeId) {
                    partTypeId = r.partItem?.part?.partType?.id || null;
                  }
                  
                  if (partTypeId) {

                    try {
                      await loadSuggestedParts(partTypeId);
                    } catch (err) {

                      if (err?.response?.status !== 500 && err?.statusCode !== 500) {
                      }
                    }
                  } else {

                  }
                }
              }}
            onChange={(opt) => {
              if (!opt) {
                // Khi xóa phụ tùng thay thế → giá PT = 0
                updateRow(i, {
                  proposedReplacePartId: "",
                  replacePartName: "",
                  pricePart: 0,
                });
                return;
              }

                const selected = allSuggestedParts.find((p) => p.id === opt.value);
                


                const fullLabel = opt.label || selected?.name || "";


                // Khi chọn phụ tùng thay thế → load giá từ bộ phận gốc
                const currentRow = details[i];
                const partItemPrice = Number(currentRow?.partItem?.price || 0);

              updateRow(i, {
                proposedReplacePartId: opt.value,
                  replacePartName: fullLabel,
                  pricePart: partItemPrice,
              });
            }}
              options={allSuggestedParts.map((p) => {

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
      width: 60,
      align: "center",
      render: (_, r, i) => {
        const isReplace = (r.remedies || "").toUpperCase() === "REPLACE";
        

        if (!isReplace) {
          return "0";
        }
        



        if (canEditFields && !readOnly) {
          return (
            <Input
              type='number'
              value={r.quantity}
              onChange={(e) => handleChange(i, "quantity", e.target.value)}
              style={{ width: "100%", maxWidth: "100%" }}
            />
          );
        }
        

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
      title: "Trạng thái phụ tùng",
      width: 100,
      render: (_, r) => {

        const status = r.exportNoteStatus || exportNoteStatusMap[r.id];
        if (!status) return <span style={{ color: "#999" }}>—</span>;
        

        const getStatusColor = (s) => {
          const statusUpper = (s || "").toUpperCase();
          if (statusUpper === "COMPLETED") return "success";
          if (statusUpper === "PENDING") return "processing";
          if (statusUpper === "REJECTED" || statusUpper === "CANCELLED") return "error";
          if (statusUpper === "STOCK_NOT_FOUND") return "danger";
          if (statusUpper === "NOT_FOUND") return "danger";
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
            NOT_FOUND: "Không tìm thấy hàng",
            STOCK_FOUND: "Đợi xuất kho",
          };
          return statusMap[statusUpper] || s;
        };
        
        const tagColor = getStatusColor(status);

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


  const statusColumn = {
    title: (
      <div className='flex items-center gap-2'>
        {details.filter((d) => d.id && !isWarrantyItemSent(d) && !hasStockIssue(d)).length > 0 && (
          <Checkbox
            checked={details.filter(d => !isWarrantyItemSent(d) && !hasStockIssue(d)).every((d) => d.status === "COMPLETED")}
            indeterminate={
              details.filter(d => !isWarrantyItemSent(d) && !hasStockIssue(d)).some((d) => d.status === "COMPLETED") &&
              details.filter(d => !isWarrantyItemSent(d) && !hasStockIssue(d)).some((d) => d.status !== "COMPLETED")
            }
            onChange={(e) => {
              const checked = e.target.checked;
              const updated = details.map((item) => {

                if (isWarrantyItemSent(item) || hasStockIssue(item)) {
                  return item;
                }
                return {
                  ...item,
                  status: checked ? "COMPLETED" : "PENDING",
                };
              });
              setDetails(updated);

              const changes = {};
              updated.forEach((item) => {

                if (item.id && checked && !isWarrantyItemSent(item) && !hasStockIssue(item)) {
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


      const isWarrantySent = isWarrantyItemSent(r);
      

      const isStockIssue = hasStockIssue(r);
      const isDisabled = readOnly || !canEditStatus || isWarrantySent || isStockIssue;

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


  const eligibleItems = details.filter((r) => isRMAEligible(r));
  const noEligibleItems = eligibleItems.length === 0;
  const allSelectedRMAItemsHaveRMA = Array.from(selectedRMAItems).every((id) => {
    const item = details.find((d) => d.id === id);
    return item && hasRMA(item);
  });


  useEffect(() => {
    if (selectedRMAItems.size === 0) return;
    
    const validSelectedKeys = Array.from(selectedRMAItems).filter((id) => {
      const item = details.find((d) => d.id === id);

      return item && !hasRMA(item) && isRMAEligible(item);
    });


    if (validSelectedKeys.length !== selectedRMAItems.size) {
      setSelectedRMAItems(new Set(validSelectedKeys));
    }
  }, [details]);


  const validSelectedKeys = Array.from(selectedRMAItems).filter((id) => {
    const item = details.find((d) => d.id === id);
    return item && !hasRMA(item) && isRMAEligible(item);
  });

  const rowSelection = readOnly ? {
    selectedRowKeys: validSelectedKeys,
    onChange: (selectedKeys, selectedRows) => {
      if (isRMASubmitting) return;
      

      const validKeys = selectedKeys.filter((id) => {
        const item = details.find((d) => d.id === id);
        return item && !hasRMA(item) && isRMAEligible(item);
      });
      setSelectedRMAItems(new Set(validKeys));
    },
    getCheckboxProps: (record) => ({
      disabled: isRMASubmitting || hasRMA(record) || !isRMAEligible(record),
    }),

    preserveSelectedRowKeys: false,
  } : undefined;


  const isBatteryItem = (detail) => {
    if (!detail) return false;
    const partName = detail.partItem?.part?.name || detail.displayName || "";
    const partCode = detail.partItem?.part?.code || "";
    const partNameLower = partName.toLowerCase();
    const partCodeLower = partCode.toLowerCase();
    return (
      partNameLower.includes("pin") || 
      partNameLower.includes("lfp") ||
      partNameLower.includes("lithium") ||
      partNameLower.includes("battery") ||
      partNameLower.includes("ắc quy") ||
      partCodeLower.includes("pin") ||
      partCodeLower.includes("lfp")
    );
  };


  const hasBatteryData = (detail) => {
    if (!detail?.id || detail.id.startsWith("temp_")) return false;

    const storageKey = `battery_data_${detail.id}`;
    const savedData = localStorage.getItem(storageKey);
    if (savedData) return true;
    


    if (isBatteryItem(detail) && detail.id && !detail.id.startsWith("temp_")) {
      return true;
    }
    
    return false;
  };


  const filteredDetails = useMemo(() => {

    return details;
  }, [details]);

  let columns = baseColumns;


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
                    isRMASubmitting ||
                    validSelectedKeys.length === 0 ||
                    allSelectedRMAItemsHaveRMA ||
                    noEligibleItems ||
                    evCheckStatus === "INSPECTION_COMPLETED"
                  }>
                  {isRMASubmitting ? "Đang tạo RMA..." : `Tạo RMA (${validSelectedKeys.length} phụ tùng)`}
                </Button>
              </div>
            )}
        <div className="repair-mode-table" style={{ width: '100%', overflow: 'hidden', maxWidth: '100%' }}>
          <Table
            key={`rma-table-${selectedRMAItems.size}`}
            columns={columns}
            dataSource={filteredDetails}
            rowKey='id'
            rowSelection={rowSelection}
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


      
      <RMAConfirmationModal
        open={isRMAConfirmationOpen}
        onClose={() => {

          setIsRMAConfirmationOpen(false);
          setIsRMASubmitting(false);
          setSelectedRMAItems(new Set());
        }}
        booking={booking}
        partsForRMA={currentRMAParts}
        onRMASuccess={async () => {

          setSelectedRMAItems(new Set());
          setIsRMAConfirmationOpen(false);
          

          if (booking?.id) {
            try {
              const { getAppointmentById } = await import("../../../api/appointmentsApi");
              const appointmentRes = await getAppointmentById(booking.id);
              const currentAppointment = appointmentRes?.data?.data || appointmentRes?.data || appointmentRes;
              
              const updatePayload = {
                note: currentAppointment?.note || booking?.note || "",
                approveById: currentAppointment?.approveById || booking?.approveById || null,
                code: currentAppointment?.code || booking?.code || "",
                checkinQRCode: currentAppointment?.checkinQRCode || booking?.checkinQRCode || "",
              };
              
              await changeAppointmentStatusService(booking.id, "COMPLETED", updatePayload);
              

              const verifyRes = await getAppointmentById(booking.id);
              const verifiedAppointment = verifyRes?.data?.data || verifyRes?.data || verifyRes;
              
              if (verifiedAppointment?.status !== "COMPLETED") {
                toast.warning(`Appointment status: ${verifiedAppointment?.status}`);
              }
              

              await loadRepairDetails();
              

              toast.success("Tạo RMA thành công!");
              onRefresh?.();
            } catch (err) {
              toast.error(`Lỗi cập nhật appointment: ${err.response?.data?.message || err.message || "Unknown error"}`);
            }
          }
          

          setIsRMASubmitting(false);
        }}
      />
    </div>
  );
}
