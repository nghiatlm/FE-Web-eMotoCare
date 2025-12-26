
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Input,
  Select,
  Tag,
  Image,
  Button,
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
import { changeAppointmentStatusService } from "../../../services/appointmentService.js";
import RMAConfirmationModal from "../../../components/service-staff/RMAConfirmationModal";
import useEVCheckHub from "../../../hooks/useEVCheckHub.jsx";
import useRMAHub from "../../../hooks/useRMAHub.jsx";
import useExportNoteHub from "../../../hooks/useExportNoteHub.jsx";
import BatteryDataDisplay from "../BatteryDataDisplay";
import Loading from "../../Loading";


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

  const [partTypeIdCache, setPartTypeIdCache] = useState({});
  

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
    showSizeChanger: true,
    showQuickJumper: false,
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
    pageSizeOptions: ['8', '10', '20', '30', '50'],
  });


  const [isRMAConfirmationOpen, setIsRMAConfirmationOpen] = useState(false);
  const [currentRMAParts, setCurrentRMAParts] = useState([]);
  const [selectedRMAItems, setSelectedRMAItems] = useState(new Set());
  const [isRMASubmitting, setIsRMASubmitting] = useState(false);
  

  const [exportNoteStatusMap, setExportNoteStatusMap] = useState({});
  



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
          

          const proposedReplacePartId =
            item?.proposedReplacePartId ||
            item?.proposedReplacePart?.id ||
          null;


          let replacePartName = "";
          if (proposedReplacePartId) {


            if (item.proposedReplacePart) {
              const proposedPart = item.proposedReplacePart;
              const partName = proposedPart.name || "";
              const code = proposedPart.code || "";
              replacePartName = code ? `${partName} (${code})` : (partName || "");
            } else {


              try {
                const { getPartById } = await import("../../../api/partsApi");
                const partDetailRes = await getPartById(proposedReplacePartId);
                const partDetail = partDetailRes?.data?.data || partDetailRes?.data || partDetailRes;
                const partName = partDetail?.name || "";
                const code = partDetail?.code || "";
                replacePartName = code ? `${partName} (${code})` : (partName || "");
              } catch (err) {

                replacePartName = "";
              }
            }
          }

        const partItemName =
          item?.partItem?.part?.name ||
          item?.partName ||
          item?.maintenanceStageDetail?.part?.name ||
          "";


        const pricePart = Number(item?.partItem?.price ?? item?.pricePart ?? 0);
        const currentStatus = item.status || "PENDING";
        const normalizedStatus =
          currentStatus === "INPROGRESS" ? "IN_PROGRESS" : currentStatus;


          let exportNoteStatus = null;
          const appointmentCode = booking?.code || null;
          if (proposedReplacePartId && appointmentCode) {
            try {
              exportNoteStatus = await getExportStatusByAppointmentCodeAndPartId(appointmentCode, proposedReplacePartId);
            } catch (err) {
            }
          }


          // ✅ Lấy partId và partTypeId từ nhiều nguồn để cache
          const partIdFromItem = item?.partItem?.part?.id || 
                                 item?.maintenanceStageDetail?.part?.id ||
                                 item?.maintenanceStageDetail?.partItem?.part?.id || null;
          const partTypeIdFromItem = item?.partItem?.part?.partType?.id || 
                                     item?.maintenanceStageDetail?.part?.partType?.id ||
                                     item?.maintenanceStageDetail?.partItem?.part?.partType?.id || null;
          

          if (partIdFromItem && partTypeIdFromItem) {
            setPartTypeIdCache(prev => ({
              ...prev,
              [partIdFromItem]: partTypeIdFromItem
            }));
            // ✅ Lưu partTypeId vào row để dùng sau
            item._partTypeId = partTypeIdFromItem;
          }


          const partItemForPrice = item.partItem || item.maintenanceStageDetail?.partItem || null;
          const isWarranty = checkWarrantyStatus(partItemForPrice);
          const initialPriceService = isWarranty ? 0 : Number(item.priceService || 0);


        let finalRemedies = item.remedies || item.solution;
        // ✅ Mặc định là "NONE" nếu không có giá trị
        if (!finalRemedies || finalRemedies.trim() === "") {
          finalRemedies = "NONE";
        }

        return {
          ...item,
            proposedReplacePartId: proposedReplacePartId,
            replacePartName: replacePartName,
          partName: partItemName,
          partItem: item.partItem || null,
          maintenanceStageDetail: item.maintenanceStageDetail || null,
            result: item.result ?? "",
            remedies: finalRemedies,
          warranty: item.warranty ?? false,
          quantity: item.quantity ?? 1,
          unit: item.unit ?? "cái",
          pricePart,
          priceService: initialPriceService,
          totalAmount:
            (finalRemedies === "REPLACE" ? pricePart : 0) +
            initialPriceService,
          status: normalizedStatus,
            exportNoteStatus,
          // ✅ Lưu partTypeId vào row để dùng khi update giá dịch vụ
          _partTypeId: partTypeIdFromItem || item._partTypeId || null,
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

      setEvCheckDetails(mapped);


      // ✅ Tự động load giá dịch vụ cho các items có remedies cần tính giá
      mapped.forEach((row) => {
        const normalizedRemedies = (row.remedies || "").toString().toUpperCase().trim();
        const needsPriceService = ["TUNE", "CLEAN", "REPAIR", "REPLACE", "WARRANTY"].includes(normalizedRemedies);
        
        if (
          (!row.priceService || Number(row.priceService) === 0) &&
          needsPriceService &&
          (row.partItem || row.maintenanceStageDetail?.partItem || row.maintenanceStageDetail?.part)
        ) {
          // ✅ Gọi với delay nhỏ để đảm bảo state đã được set
          setTimeout(() => {
            console.log(`🔄 [loadEVCheckDetails] Tự động load giá dịch vụ cho row.id: ${row.id}, remedies: ${normalizedRemedies}`);
            updateLaborCostForRow(row.id, normalizedRemedies, row);
          }, 100);
        }
      });

      if (statusValue) setLocalEvCheckStatus(statusValue);
      setStatusChanges({});
    } catch (err) {
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể tải chi tiết EV Check!"));
      setEvCheckDetails([]);
    } finally {
      setLoading(false);
    }
  };


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

  const updateLaborCostForRow = async (recordId, remedies, rowData = null) => {
    // ✅ Normalize remedies để đảm bảo format đúng
    const normalizedRemedies = (remedies || "").toString().toUpperCase().trim();
    console.log(`🔄 [updateLaborCostForRow] Bắt đầu update cho recordId: ${recordId}, remedies: ${normalizedRemedies}`);

    if (!["NONE", "TUNE", "CLEAN", "REPAIR", "REPLACE", "WARRANTY"].includes(normalizedRemedies)) {
      // ✅ Nếu remedies là NONE, set priceService = 0
      if (normalizedRemedies === "NONE") {
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
      // ✅ Ưu tiên dùng rowData nếu có (từ handleChange), nếu không thì lấy từ state
      let currentRow = rowData;
      if (!currentRow) {
        currentRow = evCheckDetails.find((r) => r.id === recordId);
      }
      
      if (!currentRow) {
        console.warn(`⚠️ [updateLaborCostForRow] Không tìm thấy row cho recordId: ${recordId}`);
        return;
      }
      
      console.log(`🔍 [updateLaborCostForRow] currentRow data:`, {
        recordId: currentRow.id,
        hasPartItem: !!currentRow?.partItem,
        hasMaintenanceStageDetail: !!currentRow?.maintenanceStageDetail,
        partItemId: currentRow?.partItem?.part?.id,
        maintenanceStageDetailPartId: currentRow?.maintenanceStageDetail?.part?.id,
        _partTypeId: currentRow?._partTypeId,
      });
      

      const partItem = currentRow?.partItem || currentRow?.maintenanceStageDetail?.partItem || null;
      if (checkWarrantyStatus(partItem)) {
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
      

      // ✅ Lấy partId và partTypeId từ nhiều nguồn
      const partId = currentRow?.partItem?.part?.id || 
                     currentRow?.maintenanceStageDetail?.part?.id || 
                     currentRow?.maintenanceStageDetail?.partItem?.part?.id || null;
      let partTypeId = null;
      

      // ✅ Ưu tiên 1: Lấy từ _partTypeId nếu có (đã được set khi load details)
      if (currentRow?._partTypeId) {
        partTypeId = currentRow._partTypeId;
      }
      

      // ✅ Ưu tiên 2: Lấy từ cache nếu có partId
      if (!partTypeId && partId) {
        partTypeId = partTypeIdCache[partId] || null;
      }
      

      // ✅ Ưu tiên 3: Lấy trực tiếp từ partItem hoặc maintenanceStageDetail
      if (!partTypeId) {
        // ✅ Thử nhiều cách lấy partTypeId
        partTypeId = currentRow?.partItem?.part?.partType?.id || 
                     currentRow?.maintenanceStageDetail?.part?.partType?.id ||
                     currentRow?.maintenanceStageDetail?.partItem?.part?.partType?.id ||
                     currentRow?.partItem?.partType?.id ||
                     currentRow?.maintenanceStageDetail?.partType?.id || null;
        
        // ✅ Nếu tìm thấy, cache lại để dùng sau
        if (partTypeId && partId) {
          setPartTypeIdCache(prev => ({
            ...prev,
            [partId]: partTypeId
          }));
        }
      }
      
      // ✅ Ưu tiên 4: Nếu vẫn không có partTypeId nhưng có partId, gọi API để lấy
      if (!partTypeId && partId) {
        try {
          console.log(`🔄 [updateLaborCostForRow] Gọi API để lấy partTypeId cho partId: ${partId}`);
          const { getPartById } = await import("../../../api/partsApi");
          const partRes = await getPartById(partId);
          const partData = partRes?.data?.data || partRes?.data || partRes;
          partTypeId = partData?.partType?.id || partData?.partTypeId || null;
          
          if (partTypeId) {
            console.log(`✅ [updateLaborCostForRow] Đã lấy được partTypeId từ API: ${partTypeId}`);
            // ✅ Cache lại để dùng sau
            setPartTypeIdCache(prev => ({
              ...prev,
              [partId]: partTypeId
            }));
          }
        } catch (err) {
          console.error(`❌ [updateLaborCostForRow] Lỗi khi gọi API getPartById:`, err);
        }
      }
      
      if (!partTypeId) {
        console.warn(`⚠️ [updateLaborCostForRow] Không tìm thấy partTypeId cho recordId: ${recordId}, remedies: ${normalizedRemedies}`, {
          partId,
          hasPartItem: !!currentRow?.partItem,
          hasMaintenanceStageDetail: !!currentRow?.maintenanceStageDetail,
          partItemPart: currentRow?.partItem?.part,
          maintenanceStageDetailPart: currentRow?.maintenanceStageDetail?.part,
          maintenanceStageDetailPartItem: currentRow?.maintenanceStageDetail?.partItem,
          partItemPartTypeId: currentRow?.partItem?.part?.partType?.id,
          maintenanceStageDetailPartTypeId: currentRow?.maintenanceStageDetail?.part?.partType?.id,
          maintenanceStageDetailPartItemPartTypeId: currentRow?.maintenanceStageDetail?.partItem?.part?.partType?.id,
          _partTypeId: currentRow?._partTypeId,
          partTypeIdCache: partTypeIdCache[partId],
        });
        return;
      }
      
      console.log(`✅ [updateLaborCostForRow] Đã tìm thấy partTypeId: ${partTypeId} cho recordId: ${recordId}`);
      
      // ✅ Lấy từ "price" thay vì "laborCost" (theo yêu cầu)
      const labor = await getLaborCostByRemediesService(partTypeId, normalizedRemedies, "price");
      console.log(`💰 [updateLaborCostForRow] Giá dịch vụ nhận được: ${labor} cho recordId: ${recordId}`);
      
      setEvCheckDetails((prev) => {
        const updated = prev.map((row) => {
          if (row.id !== recordId) return row;
          const priceService = Number(labor || 0);
          const pricePart = Number(row.pricePart || 0);
          const validPart = row.remedies === "REPLACE" ? pricePart : 0;
          console.log(`✅ [updateLaborCostForRow] Cập nhật priceService: ${priceService}, totalAmount: ${validPart + priceService} cho recordId: ${recordId}`);
          return {
            ...row,
            priceService,
            totalAmount: validPart + priceService,
          };
        });
        console.log(`✅ [updateLaborCostForRow] State đã được cập nhật, tìm row với recordId: ${recordId}:`, updated.find(r => r.id === recordId));
        return updated;
      });
    } catch (e) {
      console.error(`❌ [updateLaborCostForRow] Lỗi khi update giá dịch vụ cho recordId: ${recordId}:`, e);
      toast.error("Không thể cập nhật giá dịch vụ!");
    }
  };


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


  const isRMAEligible = (row) => {
    const remedies = (row.remedies || "").toUpperCase();
    return (
      remedies === "WARRANTY" &&
      !hasRMA(row)
    );
  };



  const openRMAModal = () => {
    if (isRMASubmitting) return;
    
    setIsRMASubmitting(true);
    
    const selectedItems = evCheckDetails.filter((d) => selectedRMAItems.has(d.id) && isRMAEligible(d));
    
    if (selectedItems.length === 0) {
      setIsRMASubmitting(false);
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

      setEvCheckDetails([]);
      setExportNoteStatusMap({});
      setPartOptionsMap({});
      setPartTypeIdCache({});
      loadEVCheckDetails();
    } else {

      setEvCheckDetails([]);
      setExportNoteStatusMap({});
      setPartOptionsMap({});
      setPartTypeIdCache({});
    }
  }, [evCheckId, booking?.id]);


  const handleEVCheckUpdate = useCallback(() => {
    if (evCheckId) {
      loadEVCheckDetails();
      if (onRefresh) {
        onRefresh();
      }
    }
  }, [evCheckId, onRefresh, loadEVCheckDetails]);

  useEVCheckHub(evCheckId, handleEVCheckUpdate);


  const handleRMAUpdate = useCallback(() => {
    if (evCheckId) {
      loadEVCheckDetails();
      if (onRefresh) {
        onRefresh();
      }
    }
  }, [evCheckId, onRefresh, loadEVCheckDetails]);

  useRMAHub(handleRMAUpdate);

  
  const handleExportNoteUpdate = useCallback(() => {
    if (evCheckId && booking?.code) {
     
      loadEVCheckDetails();
    }
  }, [evCheckId, booking?.code, loadEVCheckDetails]);

  useExportNoteHub(handleExportNoteUpdate);

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
    setLocalEvCheckStatus(initialEvCheckStatus);
  }, [initialEvCheckStatus]);


  const handleChange = (recordId, field, value) => {
    if (evCheckStatus === "INSPECTION_COMPLETED") return;
    if (evCheckStatus === "QUOTE_APPROVED" && field !== "status") return;


    if (field === "remedies" && (value === "REPLACE" || value === "REPAIR")) {
      const currentRow = evCheckDetails.find((r) => r.id === recordId);
      if (checkWarrantyStatus(currentRow?.partItem)) {
        toast.error(
          "Bộ phận đang trong thời gian bảo hành. Chỉ cho phép 'Không làm gì', 'Bôi trơn' hoặc 'Kiểm tra'."
        );
        return;
      }
    }


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
          const normalizedValue = (value || "").toString().toUpperCase().trim();
          console.log(`🔄 [handleChange] Thay đổi remedies cho recordId: ${recordId}, từ "${row.remedies}" sang "${normalizedValue}"`);
          updated.remedies = normalizedValue;
          if (normalizedValue !== "REPLACE") {
            updated.pricePart = 0;
          } else {
            // ✅ Khi chọn "REPLACE", set pricePart = 0 (chưa hiển thị giá)
            // ✅ Chỉ khi chọn "Phụ tùng thay thế" mới hiển thị giá
            updated.pricePart = 0;
          }
          const validPricePart =
            normalizedValue === "REPLACE" ? Number(updated.pricePart || 0) : 0;
          updated.totalAmount =
            validPricePart + Number(updated.priceService || 0);
          
          // ✅ Đảm bảo updated row có đầy đủ thông tin về partTypeId
          // ✅ Giữ nguyên _partTypeId từ row gốc nếu có
          if (row._partTypeId && !updated._partTypeId) {
            updated._partTypeId = row._partTypeId;
          }
          
          // ✅ Gọi updateLaborCostForRow với normalized value và updated row data
          console.log(`🔄 [handleChange] Gọi updateLaborCostForRow cho recordId: ${recordId}, remedies: ${normalizedValue}`, {
            hasPartTypeId: !!updated._partTypeId,
            hasPartItem: !!updated.partItem,
            hasMaintenanceStageDetail: !!updated.maintenanceStageDetail,
          });
          updateLaborCostForRow(recordId, normalizedValue, updated);
          return updated;
        }

        if (field === "proposedReplacePart") {
          if (value) {

            updated.proposedReplacePartId = value?.value || value;
            updated.replacePartName = value?.label || "";
          } else {
            updated.proposedReplacePartId = null;
            updated.replacePartName = "";
          }
          return updated;
        }
        

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


      for (const item of evCheckDetails) {
        if ((item.remedies === "REPLACE" || item.remedies === "REPAIR") && checkWarrantyStatus(item.partItem)) {
          toast.dismiss(loadingToast);
          return toast.error(
            "Bộ phận đang trong thời gian bảo hành. Chỉ cho phép 'Kiểm tra' hoặc 'Bôi trơn'."
          );
        }

        // ✅ Validate: Nếu biện pháp là "Thay thế" thì phải chọn phụ tùng thay thế
        if (item.remedies === "REPLACE") {
          const proposedReplacePartIdValue =
            item.proposedReplacePartId ||
            item.proposedReplacePart?.id ||
            null;
          if (!proposedReplacePartIdValue?.trim()) {
            toast.dismiss(loadingToast);
            return toast.error("Vui lòng chọn Phụ tùng thay thế!");
          }
        }

        if (item.remedies === "WARRANTY" && !checkWarrantyStatus(item.partItem)) {
          toast.dismiss(loadingToast);
          return toast.error(
            "Bộ phận không còn trong thời gian bảo hành. Không thể chọn biện pháp 'Bảo hành'."
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
          result: (item.result || "").trim(),
          remedies: item.remedies || "NONE",
          warranty: item.warranty,
          unit: item.unit,
          priceService: Number(item.priceService) || null,
          totalAmount: Number(item.totalAmount) || 0,
          status: normalizedStatus,
        };


        if (item.remedies === "REPLACE" && proposedReplacePartIdValue) {
          payload.proposedReplacePartId = proposedReplacePartIdValue;
          payload.quantity = Number(item.quantity || 1);
          payload.pricePart = Number(item.pricePart || 0);
        } else {
          payload.quantity = null;
          payload.pricePart = null;
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
      toast.dismiss(loadingToast);
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Lỗi khi gửi dữ liệu!"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRepair = async () => {
    try {
      setLoading(true);
      const loadingToast = toast.loading("Đang cập nhật trạng thái hạng mục...");



      const afterQuoteStatuses = [
        "INSPECTION_COMPLETED",
        "QUOTE_APPROVED", 
        "REPAIR_IN_PROGRESS",
        "REPAIR_COMPLETED",
        "COMPLETED"
      ];
      
      const filteredOutDetails = evCheckDetails.filter((detail) => {
        if (!afterQuoteStatuses.includes(evCheckStatus)) {
          return false;
        }
        const remedies = (detail.remedies || "").toUpperCase();

        return remedies !== "REPAIR" && remedies !== "REPLACE" && remedies !== "WARRANTY";
      });


      for (const detail of filteredOutDetails) {
        if (detail.id) {
          await updateEVCheckDetailService(detail.id, { status: "COMPLETED" });
        }
      }


      for (const [detailId, newStatus] of Object.entries(statusChanges)) {
        await updateEVCheckDetailService(detailId, { status: newStatus });
      }

      toast.dismiss(loadingToast);
      toast.success("Cập nhật trạng thái thành công!");
      setStatusChanges({});
      
      // ✅ Cập nhật EVCheck status thành REPAIR_COMPLETED
      await updateEVCheckService(evCheckId, { status: "REPAIR_COMPLETED" });
      setLocalEvCheckStatus("REPAIR_COMPLETED");
      setParentEvCheckStatus?.("REPAIR_COMPLETED");

      // ✅ Cập nhật Appointment status thành REPAIR_COMPLETED
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
          // ✅ Bỏ qua lỗi cập nhật appointment để không chặn flow
        }
      }
      
      // ✅ Load lại details sau khi đã cập nhật status
      await loadEVCheckDetails();
      
      onRefresh?.();
    } catch (err) {
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
            alt="PT"
            width={48}
            height={48}
            className="object-cover rounded border border-gray-200 shadow-sm cursor-pointer"
            preview={{ src: imageUrl }}
            fallback="https://via.placeholder.com/48"
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

        const partName = r.maintenanceStageDetail?.part?.name || r.partName || "";
        const isCoi = partName.toLowerCase().includes("Pin") || 
                     partName.toLowerCase().includes("PIN") ||
                     partName.toLowerCase().includes("horn");
        
        // Khi đã hoàn thành sửa chữa, chỉ hiển thị text
        if (!canEditFields) {
          return (
            <div className="space-y-2">
              <span style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
                {r.result || ""}
              </span>
              {isCoi && r.id && !r.id.startsWith("temp_") && (
                <div className="mt-2 p-2 border rounded bg-gray-50">
                  <BatteryDataDisplay 
                    evCheckDetailId={r.id} 
                    canImport={false}
                  />
                </div>
              )}
            </div>
          );
        }
        
        return (
          <div className="space-y-2">
        <Input.TextArea
              value={r.result ?? ""}
              onChange={(e) => handleChange(r.id, "result", e.target.value)}
          autoSize={{ minRows: 2, maxRows: 8 }}
              style={{ resize: "none", fontSize: 14, lineHeight: 1.5, maxWidth: "100%" }}
            />
            
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


        const afterQuoteStatuses = [
          "INSPECTION_COMPLETED",
          "QUOTE_APPROVED", 
          "REPAIR_IN_PROGRESS",
          "REPAIR_COMPLETED",
          "COMPLETED"
        ];
        const isAfterQuote = afterQuoteStatuses.includes(evCheckStatus);

        // Khi đã hoàn thành sửa chữa, chỉ hiển thị text
        if (!canEditFields) {
          return <span style={{ fontSize: 14 }}>{remediesLabel}</span>;
        }

        return (
          <Tooltip title={remediesLabel || "Biện pháp"} placement="topLeft">
            <Select
              placeholder="Biện pháp"
              value={remediesValue ? { value: remediesValue, label: remediesLabel } : undefined}
              labelInValue={true}
              style={{ width: 100 }}
              onChange={(v) => handleChange(r.id, "remedies", v.value || v)}>
              <Option value="NONE">Không</Option>
              <Option value="TUNE">Điều chỉnh</Option>
              {!isAfterQuote && <Option value="CLEAN">Vệ sinh</Option>}
              
              {!isWarranty && <Option value="REPLACE">Thay thế</Option>}
              {!isWarranty && <Option value="REPAIR">Sửa chữa</Option>}
              
              {isWarranty && <Option value="WARRANTY">Bảo hành</Option>}
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
        const remedies = (r.remedies || "").toString().toUpperCase().trim();
        
        // Chỉ hiển thị Select khi biện pháp là "REPLACE"
        if (remedies !== "REPLACE") {
          return <span style={{ color: "#999" }}></span>;
        }

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
        

        let partId = r.partItem?.part?.id || r.maintenanceStageDetail?.part?.id || null;
        

        if (partId) {
          partTypeId = partTypeIdCache[partId] || null;
        }
        

        if (!partTypeId && partId) {
          partTypeId = r.partItem?.part?.partType?.id || r.maintenanceStageDetail?.part?.partType?.id || null;

          if (partTypeId) {
            setPartTypeIdCache(prev => ({
              ...prev,
              [partId]: partTypeId
            }));
          }
        }
        

        const cacheKey = modelId && partTypeId ? `${modelId}_${partTypeId}` : null;
        const allSuggestedParts = cacheKey ? (partOptionsMap[cacheKey] || []) : [];
        
        // Khi đã hoàn thành sửa chữa, chỉ hiển thị text
        if (!canEditFields || readOnly) {
          return (
            <span style={{ fontSize: 14 }}>
              {replacePartName || ""}
            </span>
          );
        }
        
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
          disabled={isWarranty}
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
                        handleChange(r.id, "replacePartName", loadedName);
                      }
                    } catch (err) {
                    }
                  }
                  

                  let partId = r.partItem?.part?.id || r.maintenanceStageDetail?.part?.id || null;
                  

                  let partTypeId = partId ? partTypeIdCache[partId] : null;
                  

                  if (!partTypeId) {
                    partTypeId = r.partItem?.part?.partType?.id || r.maintenanceStageDetail?.part?.partType?.id || null;

                    if (partId && partTypeId) {
                      setPartTypeIdCache(prev => ({
                        ...prev,
                        [partId]: partTypeId
                      }));
                    }
                  }
                  

                  if (!partTypeId && r.partItem?.id) {
                    try {
                      const partItemDetail = await getPartItemByIdService(r.partItem.id);
                      if (partItemDetail?.part?.partType?.id) {
                        partTypeId = partItemDetail.part.partType.id;

                        if (partId && partTypeId) {
                          setPartTypeIdCache(prev => ({
                  ...prev,
                            [partId]: partTypeId
                          }));
                        }
                      }
                    } catch (err) {
                    }
                  }
                  

                  if (!partTypeId && r.partItem && !r.partItem.part?.partType?.id) {


                    const partItemId = r.partItem.id;
                    if (partItemId) {
                      try {
                        const partItemDetail = await getPartItemByIdService(partItemId);
                        if (partItemDetail?.part?.partType?.id) {
                          partTypeId = partItemDetail.part.partType.id;

                          if (partId && partTypeId) {
                            setPartTypeIdCache(prev => ({
                              ...prev,
                              [partId]: partTypeId
                            }));
                          }
                        }
                      } catch (err) {
                      }
                    }
                  }
                  
                  if (partTypeId) {
                    try {
                      await loadSuggestedParts(partTypeId);
                    } catch (err) {
                      if (err?.response?.status !== 500 && err?.statusCode !== 500) {
                      }
                    }
                  }
                }
              }}
              onChange={(opt) => {
                const partItemPrice = Number(r?.partItem?.price || 0);
                
                if (!opt) {
                  // ✅ Khi xóa phụ tùng thay thế, set pricePart = 0 (không hiển thị giá)
                  handleChange(r.id, "proposedReplacePart", null);
                  handleChange(r.id, "pricePart", 0);
                  return;
                }
                

                const partId = opt?.value;
                

                const selected = allSuggestedParts.find((p) => p.id === partId);
                
                const fullLabel = opt.label || selected?.name || "";

                // ✅ Khi chọn "Phụ tùng thay thế", lấy giá từ bộ phận có sẵn trên xe (partItem.price)
                handleChange(r.id, "proposedReplacePart", { value: partId, label: fullLabel });
                handleChange(r.id, "replacePartName", fullLabel);
                handleChange(r.id, "pricePart", partItemPrice);
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
        

        const quantity = Number(r.quantity || 0);
        
        // ✅ Chỉ hiển thị số lượng khi là REPLACE và quantity > 0
        if (!isReplace || quantity === 0) {
          return "";
        }
        



        if (canEditFields && !readOnly) {
          return (
            <Input
              type="number"
              value={r.quantity}
              onChange={(e) => handleChange(r.id, "quantity", e.target.value)}
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
      render: (_, r, i) => {
        if (r.remedies !== "REPLACE")
          return <span className='text-gray-400'></span>;
        return Number(r.pricePart || 0).toLocaleString();
      },
    },
    {
      title: "Giá DV",
      width: 70,
      align: "right",
      render: (_, r, i) => Number(r.priceService || 0).toLocaleString(),
    },
    {
      title: "Tổng",
      width: 70,
      align: "right",
      render: (_, r) =>
        r.totalAmount ? `${Number(r.totalAmount).toLocaleString()}` : "",
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

                if (hasStockIssue(item)) {
                  return item;
                }
                return {
                  ...item,
                  status: checked ? "COMPLETED" : "PENDING",
                };
              });
              setEvCheckDetails(updated);

              const changes = {};
              updated.forEach((item) => {

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


  const eligibleItems = evCheckDetails.filter((r) => isRMAEligible(r));
  const noEligibleItems = eligibleItems.length === 0;
  const allSelectedRMAItemsHaveRMA = Array.from(selectedRMAItems).every((id) => {
    const item = evCheckDetails.find((d) => d.id === id);
    return item && hasRMA(item);
  });


  useEffect(() => {
    if (selectedRMAItems.size === 0) return;
    
    const validSelectedKeys = Array.from(selectedRMAItems).filter((id) => {
      const item = evCheckDetails.find((d) => d.id === id);

      return item && !hasRMA(item) && isRMAEligible(item);
    });


    if (validSelectedKeys.length !== selectedRMAItems.size) {
      setSelectedRMAItems(new Set(validSelectedKeys));
    }
  }, [evCheckDetails]);


  const validSelectedKeys = Array.from(selectedRMAItems).filter((id) => {
    const item = evCheckDetails.find((d) => d.id === id);
    return item && !hasRMA(item) && isRMAEligible(item);
  });

  const rowSelection = readOnly ? {
    selectedRowKeys: validSelectedKeys,
    onChange: (selectedKeys, selectedRows) => {
      if (isRMASubmitting) return;
      

      const validKeys = selectedKeys.filter((id) => {
        const item = evCheckDetails.find((d) => d.id === id);
        return item && !hasRMA(item) && isRMAEligible(item);
      });
      setSelectedRMAItems(new Set(validKeys));
    },
    getCheckboxProps: (record) => ({
      disabled: isRMASubmitting || hasRMA(record) || !isRMAEligible(record),
    }),

    preserveSelectedRowKeys: false,
  } : undefined;

  let columns = baseColumns;
  if (!readOnly && evCheckStatus === "REPAIR_IN_PROGRESS") {
    columns = [...columns, statusColumnForRepair];
  }





  const filteredDetails = useMemo(() => {
    const afterQuoteStatuses = [
      "INSPECTION_COMPLETED",
      "QUOTE_APPROVED", 
      "REPAIR_IN_PROGRESS",
      "REPAIR_COMPLETED",
      "COMPLETED"
    ];
    

    const shouldFilter = readOnly || afterQuoteStatuses.includes(evCheckStatus);
    
    if (shouldFilter) {
      // ✅ Khi ở trạng thái readOnly hoặc sau quote, chỉ hiển thị items có biện pháp (không phải NONE)
      return evCheckDetails.filter((detail) => {
        const remedies = (detail.remedies || "").toUpperCase().trim();
        
        // ✅ Loại bỏ những items không có biện pháp (NONE hoặc rỗng)
        if (!remedies || remedies === "NONE" || remedies === "") {
          return false;
        }
        

        if (readOnly && isRMAEligible(detail)) {
          return true;
        }
        

        if (remedies === "REPAIR" || remedies === "REPLACE" || remedies === "WARRANTY") {

          const pricePart = Number(detail.pricePart || 0);
          const priceService = Number(detail.priceService || 0);
          const totalAmount = Number(detail.totalAmount || 0);
          

          if (pricePart > 0 || priceService > 0 || totalAmount > 0) {
            return true;
          }

          return false;
        }
        
        // ✅ Cho phép hiển thị các remedies khác như TUNE, CLEAN nếu có giá
        const pricePart = Number(detail.pricePart || 0);
        const priceService = Number(detail.priceService || 0);
        const totalAmount = Number(detail.totalAmount || 0);
        
        if (pricePart > 0 || priceService > 0 || totalAmount > 0) {
          return true;
        }

        return false;
      });
    }
    
    // ✅ Khi đang chỉnh sửa (chưa ở trạng thái readOnly hoặc sau quote), hiển thị tất cả items (bao gồm cả NONE) để người dùng có thể chọn biện pháp
    return evCheckDetails;
  }, [evCheckDetails, evCheckStatus, readOnly]);

  return (
    <>
      {loading ? (
        <div className='flex justify-center p-10'>
          <Loading />
        </div>
      ) : (
        <>
          
          {readOnly &&
            validSelectedKeys.length > 0 &&
            evCheckDetails.length > 0 && (
              <div className='flex justify-between items-center mb-4'>
                <h4 className='text-base font-semibold text-gray-700'>Danh sách hạng mục bảo dưỡng</h4>
                <Button
                  type="primary"
                  dangerproposedReplacePart
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
                rowKey="id"
                rowSelection={rowSelection}
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
                size="small"
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
                    type="primary"
                    onClick={handleConfirmQuote}
                    loading={loading}>
                    Xác nhận báo giá
                  </Button>
                )}

              {!readOnly && evCheckStatus === "REPAIR_IN_PROGRESS" && (
                <Button
                  type="primary"
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


      
      <RMAConfirmationModal
        open={isRMAConfirmationOpen}
        onClose={() => {
          setIsRMAConfirmationOpen(false);
          setSelectedRMAItems(new Set());
        }}
        booking={booking}
        partsForRMA={currentRMAParts}
        onRMASuccess={async () => {
          const rmaDetailIds = currentRMAParts.map((p) => p.id);
          toast.info("Đang đồng bộ lại chi tiết EV Check...");
          await loadEVCheckDetails();
          setSelectedRMAItems(new Set());
          setIsRMASubmitting(false);
          setIsRMAConfirmationOpen(false);
        }}
      />
    </>
  );
}
