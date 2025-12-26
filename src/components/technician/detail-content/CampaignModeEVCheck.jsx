


import { useState, useEffect, useCallback } from "react";
import { Table, Input, Select, Button, Tag, Checkbox, Tooltip } from "antd";
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
import useExportNoteHub from "../../../hooks/useExportNoteHub.jsx";
import Loading from "../../Loading";
import BatteryDataDisplay from "../BatteryDataDisplay";
import { getCampaignById } from "../../../api/campaignsApi.js";

const { Option } = Select;

const REPAIR_STATUS = {
  PENDING: { label: "Đang sửa chữa", color: "processing" },
  IN_PROGRESS: { label: "Đang sửa chữa", color: "processing" },
  COMPLETED: { label: "Đã hoàn thành", color: "success" },
};


const checkWarrantyStatus = (partItem) => {
  if (!partItem) return false;

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
  

  const [exportNoteStatusMap, setExportNoteStatusMap] = useState({});
  

  const [recallPartNameMap, setRecallPartNameMap] = useState({});

  const [recallPartIds, setRecallPartIds] = useState([]);
  

  const loadProgramDetails = async () => {
    const campaignId = booking?.campaignId || null;
    if (!campaignId) return { recallMap: {}, recallPartIds: [] };

    try {
      const programRes = await getCampaignById(campaignId);
      const programData = programRes?.data?.data || programRes?.data || programRes;
      const programDetails = programData?.programDetails || [];


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
          } catch (err) {
            recallMap[recallPartId] = recallPartId;
          }
        }
      }
      setRecallPartNameMap(recallMap);
      setRecallPartIds(recallIds);
      return { recallMap, recallPartIds: recallIds };
    } catch (err) {
      return { recallMap: {}, recallPartIds: [] };
    }
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
    remedies: "REPLACE",
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
    
    // ✅ Lấy partTypeId từ row data
    const currentRow = details[index];
    if (!currentRow) {
      updateRow(index, { priceService: 0 });
      return;
    }
    
    const partId = currentRow?.partItem?.part?.id || 
                   vehiclePartOptions.find(vp => vp.partItemId === currentRow?.partItemId)?.partId || null;
    
    let partTypeId = null;
    if (partId && partTypeIdCache[partId]) {
      partTypeId = partTypeIdCache[partId];
    } else if (currentRow?.partItem?.part?.partType?.id) {
      partTypeId = currentRow.partItem.part.partType.id;
    }
    
    if (!partTypeId) {
      updateRow(index, { priceService: 0 });
      return;
    }
    
    try {
      // ✅ Lấy từ "price" thay vì "laborCost" (theo yêu cầu)
      const cost = await getLaborCostByRemediesService(partTypeId, remedies, "price");
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

      const { recallMap: recallPartNameMapLocal, recallPartIds: recallPartIdsList } = await loadProgramDetails();
      
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


          let displayName = partOption?.label || partItemId || "";
          const partId = partOption?.partId || item.partItem?.part?.id || null;
          

          let finalReplacePartId = replacePartId;
          let finalReplacePartName = replacePartName;
          

          if (partId && recallPartIdsList.includes(partId)) {

            finalReplacePartId = partId;
            finalReplacePartName = recallPartNameMapLocal[partId] || replacePartName || "";
            displayName = recallPartNameMapLocal[partId] || displayName;
          } else if (partId && recallPartNameMapLocal[partId]) {
            displayName = recallPartNameMapLocal[partId];
          }
          

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
            replacePartName: finalReplacePartName || replacePartName || "",
            result: item.result ?? "",
          remedies: item.remedies || "REPLACE",
          pricePart: Number(item.pricePart || 0),
          priceService: Number(item.priceService || 0),
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



      if (recallPartIdsList && recallPartIdsList.length > 0 && vehiclePartOptions.length > 0) {

        for (const recallPartId of recallPartIdsList) {

          const matchingPart = vehiclePartOptions.find(option => option.partId === recallPartId);
          
          if (matchingPart) {





            const existingDetail = mapped.find(d => {

              if (d.partItemId === matchingPart.partItemId) return true;
              

              if (d.proposedReplacePartId === recallPartId) return true;
              

              const detailPartId = d.partItem?.part?.id || 
                                   vehiclePartOptions.find(vp => vp.partItemId === d.partItemId)?.partId || null;
              if (detailPartId === recallPartId) return true;
              
              return false;
            });
            
            if (!existingDetail) {

              const recallPartName = recallPartNameMapLocal[recallPartId] || "";
              
              const autoRow = {
                ...createEmptyRow(),
                partItemId: matchingPart.partItemId,
                displayName: recallPartName || matchingPart.label || "",
                partItem: matchingPart.partItem || null,
                proposedReplacePartId: recallPartId,
                replacePartName: recallPartName || "",
                remedies: "REPLACE",
                pricePart: Number(matchingPart.price || 0),
              };
              
              mapped.push(autoRow);
            } else {

              existingDetail.proposedReplacePartId = recallPartId;
              existingDetail.replacePartName = recallPartNameMapLocal[recallPartId] || "";
              if (!existingDetail.remedies || existingDetail.remedies === "NONE" || existingDetail.remedies === "CLEAN") {
                existingDetail.remedies = "REPLACE";
              }
            }
          }
        }
      }

      if (mapped.length > 0) {


        const uniqueDetailsMap = new Map();
        mapped.forEach((detail) => {
          const partItemId = detail.partItemId || "";
          const proposedReplacePartId = detail.proposedReplacePartId || "";
          const key = `${partItemId}_${proposedReplacePartId}`;
          

          if (!uniqueDetailsMap.has(key)) {
            uniqueDetailsMap.set(key, detail);
          } else {
            const existing = uniqueDetailsMap.get(key);

            if (detail.id && !existing.id) {
              uniqueDetailsMap.set(key, detail);
            }
          }
        });
        
        const uniqueDetails = Array.from(uniqueDetailsMap.values());
        setDetails(uniqueDetails);
      } else {

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
          } else {
            setDetails([createEmptyRow()]);
          }
        } else {
          setDetails(readOnly ? [] : [createEmptyRow()]);
        }
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

  // Handler để refresh trạng thái phụ tùng khi có update từ export note
  const handleExportNoteUpdate = useCallback(() => {
    if (evCheckId && !forceEmpty && !vehiclePartLoading && !replacePartLoading) {
      // Reload lại details để cập nhật trạng thái phụ tùng
      loadRepairDetails();
    }
  }, [evCheckId, forceEmpty, vehiclePartLoading, replacePartLoading, loadRepairDetails]);

  useExportNoteHub(handleExportNoteUpdate);

  const canEditFields =
    !readOnly &&
    evCheckStatus !== "INSPECTION_COMPLETED" &&
    evCheckStatus !== "QUOTE_APPROVED" &&
    evCheckStatus !== "REPAIR_IN_PROGRESS" &&
    evCheckStatus !== "REPAIR_COMPLETED" &&
    evCheckStatus !== "COMPLETED";
  

  const canEditStatus = !readOnly && evCheckStatus === "REPAIR_IN_PROGRESS";





  const hasStockIssue = (row) => {
    const exportStatus = row?.exportNoteStatus || exportNoteStatusMap[row?.id];
    const exportStatusUpper = (exportStatus || "").toUpperCase();
    return exportStatusUpper === "STOCK_NOT_FOUND" || exportStatusUpper === "NOT_FOUND" || exportStatusUpper === "STOCK_FOUND";
  };

  const handleChange = (index, field, value) => {
    if (evCheckStatus === "INSPECTION_COMPLETED" && field !== "status") return;
    if (evCheckStatus === "QUOTE_APPROVED" && field !== "status") return;

    if (field === "status" && !canEditStatus) return;
    if (!canEditFields && field !== "status") return;


    if (field === "status" && value === "COMPLETED") {
      const currentRow = details[index];
      if (hasStockIssue(currentRow)) {
        toast.error("Không thể đánh dấu hoàn thành khi phụ tùng hết hàng hoặc đang chờ xuất kho.");
        return;
      }
    }

    updateRow(index, { [field]: value });

    if (field === "remedies") {


      const currentRow = details[index];
      const partId = currentRow?.partItem?.part?.id || 
                     vehiclePartOptions.find(vp => vp.partItemId === currentRow?.partItemId)?.partId || null;
      
      if (value !== "REPLACE") {
        updateRow(index, {
          pricePart: 0,
        });
      } else {
        // ✅ Khi chọn "REPLACE", nếu chưa có proposedReplacePartId thì set pricePart = 0
        if (!currentRow?.proposedReplacePartId) {
          updateRow(index, {
            pricePart: 0,
          });
        }
      }
      

      if (partId && recallPartIds.includes(partId)) {
        const recallPartName = recallPartNameMap[partId] || currentRow?.replacePartName || "";
        const partItemPrice = Number(currentRow?.partItem?.price || 0);
        updateRow(index, {
          proposedReplacePartId: partId,
          replacePartName: recallPartName,
          pricePart: partItemPrice, // ✅ Khi có recallPartId, hiển thị giá từ bộ phận
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
        remedies: item.remedies ?? "REPLACE",
        unit: item.unit || "cái",
        priceService: Number(item.priceService || 0),
        totalAmount: Number(item.totalAmount || 0),
        status: item.status || "PENDING",
      };



      if (item.proposedReplacePartId) {
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
          remedies: item.remedies ?? "REPLACE",
          unit: item.unit || "cái",
          priceService: Number(item.priceService || 0),
          totalAmount: Number(item.totalAmount || 0),
          status: item.status || "PENDING",
        };



        if (item.proposedReplacePartId) {
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
      toast.success("Xác nhận báo giá thành công!");


      await loadRepairDetails();
      

      setEvCheckStatus("INSPECTION_COMPLETED");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Lỗi khi gửi dữ liệu!"));
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


      for (const [detailId, newStatus] of Object.entries(statusChanges)) {
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


      const allCompleted = rawDetails.length > 0 && rawDetails.every(
        (d) => d.status === "COMPLETED"
      );


      if (allCompleted) {
        await updateEVCheckService(evCheckId, { status: "REPAIR_COMPLETED" });
        setEvCheckStatus("REPAIR_COMPLETED");
        toast.success("Đã hoàn thành tất cả hạng mục sửa chữa!");

        if (booking?.id) {
          try {

            const { getAppointmentById } = await import("../../../api/appointmentsApi");
            const appointmentRes = await getAppointmentById(booking.id);
            const currentAppointment = appointmentRes?.data?.data || appointmentRes?.data || appointmentRes;
            

            await changeAppointmentStatusService(booking.id, "REPAIR_COMPLETED", {
              note: currentAppointment?.note || booking?.note || "",
              approveById: currentAppointment?.approveById || booking?.approveById || null,
              code: currentAppointment?.code || booking?.code || "",
              checkinQRCode: currentAppointment?.checkinQRCode || booking?.checkinQRCode || "",
            });
          } catch (err) {

            return;
          }
        }
      } else {
        toast.success("Cập nhật trạng thái thành công!");
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
    { title: "STT", render: (_, __, i) => i + 1, width: 37 },
    {
      title: "Bộ phận",
      width: 170,
      ellipsis: {
        showTitle: true,
      },
      render: (_, r, i) => {

        let displayName = r.displayName || "";
        const partItemId = r.partItemId || "";
        const partId = r.partItem?.part?.id || 
                       vehiclePartOptions.find(vp => vp.partItemId === r.partItemId)?.partId || null;
        

        if (!displayName || displayName === partItemId) {
          if (partId && recallPartIds.includes(partId)) {
            displayName = recallPartNameMap[partId] || "";
          }
          if (!displayName || displayName === partItemId) {
            const sel = vehiclePartOptions.find((p) => p.partItemId === partItemId);
            displayName = sel?.label || displayName || partItemId || "";
          }
        }
        

        const selectedOption = vehiclePartOptions.find((p) => p.partItemId === partItemId);
        

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


            let proposedReplacePartId = "";
            let replacePartName = "";
            let finalDisplayName = sel?.label || "";
            const currentRemedies = r.remedies || "NONE";
            
            // ✅ Nếu có recallPartId và remedies = "REPLACE", lấy giá từ partItem
            // ✅ Nếu không có recallPartId hoặc remedies khác "REPLACE", set pricePart = 0
            let pricePart = 0;
            if (partId && recallPartIds.includes(partId)) {
              proposedReplacePartId = partId;
              replacePartName = recallPartNameMap[partId] || "";
              finalDisplayName = recallPartNameMap[partId] || sel?.label || "";
              // ✅ Khi có recallPartId và remedies = "REPLACE", hiển thị giá từ bộ phận
              if (currentRemedies === "REPLACE") {
                pricePart = Number(sel?.price || partItem?.price || 0);
              }
            } else if (currentRemedies === "REPLACE") {
              // ✅ Nếu remedies = "REPLACE" nhưng không có recallPartId, set pricePart = 0
              pricePart = 0;
            }

            updateRow(i, {
              displayName: finalDisplayName,
              pricePart: pricePart,
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
      width: 110,
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
        
        // Khi đã hoàn thành sửa chữa, chỉ hiển thị text
        if (!canEditFields || readOnly) {
          const displayResult = r.result && r.result.trim() ? r.result : "Tốt";
          return (
            <div className="space-y-2">
              <span style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
                {displayResult}
              </span>
              {isBattery && r.partItemId && (
                <div className="mt-2 p-2 border rounded bg-gray-50">
                  {r.id && !r.id.startsWith("temp_") ? (
                    <BatteryDataDisplay 
                      evCheckDetailId={r.id} 
                      canImport={false}
                    />
                  ) : (
                    <span className="text-gray-400"></span>
                  )}
                </div>
              )}
            </div>
          );
        }
        
        return (
          <div className="space-y-2">
        <Input.TextArea
              value={r.result ?? ""}
              placeholder="Tốt"
          onChange={(e) => handleChange(i, "result", e.target.value)}
          autoSize={{ minRows: 2, maxRows: 8 }}
              style={{ resize: "none", fontSize: 14, maxWidth: "100%" }}
            />
            
            {isBattery && r.partItemId && (
              <div className="mt-2 p-2 border rounded bg-gray-50">
                
                {r.id && !r.id.startsWith("temp_") ? (
                  <BatteryDataDisplay 
                    evCheckDetailId={r.id} 
                    canImport={

                      !readOnly && (
                        canEditFields || 
                        evCheckStatus === "INSPECTION_COMPLETED" ||
                        evCheckStatus === "QUOTE_APPROVED" ||
                        evCheckStatus === "REPAIR_IN_PROGRESS"
                      )
                    }
                  />
                ) : (
                  <span className="text-gray-400"></span>
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
        
        // Khi đã hoàn thành sửa chữa, chỉ hiển thị text
        if (!canEditFields || readOnly) {
          return <span style={{ fontSize: 14 }}>{remediesLabel}</span>;
        }
        
        return (
          <Tooltip title={remediesLabel} placement="topLeft">
            <Select
              placeholder='Chọn'
              value={r.remedies}
              style={{ width: "100%", minWidth: 120 }}
              onChange={(v) => handleChange(i, "remedies", v)}>
              <Option value='NONE'>Không</Option>
              <Option value='TUNE'>Điều chỉnh</Option>
              <Option value='CLEAN'>Vệ sinh</Option>
              
              {!isWarranty && <Option value='REPLACE'>Thay thế</Option>}
              {!isWarranty && <Option value='REPAIR'>Sửa chữa</Option>}
              
              {isWarranty && <Option value='WARRANTY'>Bảo hành</Option>}
            </Select>
          </Tooltip>
        );
      },
    },

    {
      title: "Bảo hành",
      width: 70,
      render: (_, r) => {
        const partItem = r.partItem;
        if (!partItem) {
          return (
            <Tag 
              color="default" 
              style={{ 
                fontWeight: 700, 
                fontSize: 13,
                color: "#595959",
                borderColor: "#d9d9d9"
              }}>
              Không
            </Tag>
          );
        }

        return partItem.isManufacturerWarranty === true ? (
          <Tag 
            color="red" 
            style={{ 
              fontWeight: 700, 
              fontSize: 13,
              color: "#cf1322",
              borderColor: "#ff4d4f"
            }}>
            Có
          </Tag>
        ) : (
          <Tag 
            color="default" 
            style={{ 
              fontWeight: 700, 
              fontSize: 13,
              color: "#595959",
              borderColor: "#d9d9d9"
            }}>
            Không
          </Tag>
        );
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
      title: "Số lượng",
      width: 60,
      align: "center",
      render: (_, r, i) => {
        const isReplace = (r.remedies || "").toUpperCase() === "REPLACE";
        

        const quantity = Number(r.quantity || 0);
        
        // ✅ Chỉ hiển thị số lượng khi là REPLACE và quantity > 0
        if (!isReplace || quantity === 0) {
          return "";
        }
        



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
        

        return <span style={{ fontSize: "14px" }}>{quantity}</span>;
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

        const status = r.exportNoteStatus || exportNoteStatusMap[r.id];
        if (!status) return <span style={{ color: "#999" }}></span>;
        

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

                if (hasStockIssue(item)) {
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
      

      const isStockIssue = hasStockIssue(r);

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
          <Loading />
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


    </div>
  );
}
