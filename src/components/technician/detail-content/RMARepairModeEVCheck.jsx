// src/components/technician/detail-content/RMARepairModeEVCheck.jsx
// Component dành cho sửa chữa được tạo từ RMA detail (sau khi bảo hành)
// Khác với RepairModeEVCheck: đã có sẵn replacePart từ RMA, không cần chọn lại
import { useState, useEffect, useCallback } from "react";
import { Table, Input, Select, Button, Spin, Tag, Tooltip } from "antd";
import { toast } from "@/components/ui/sonner";
import {
  fetchEVCheckDetailsServiceRe as getRepairDetailsList,
  updateEVCheckDetailService,
  updateEVCheckService,
} from "../../../services/evcheckService.js";
import { getLaborCostByRemediesService } from "../../../services/priceserviceService.js";
import { fetchVehiclePartItems } from "../../../services/vehiclePartItemService.js";
import { getPartItemByIdService } from "../../../services/partitemsService.js";
import { getExportStatusByAppointmentCodeAndPartId } from "../../../services/exportNotesService.js";
import useEVCheckHub from "../../../hooks/useEVCheckHub.jsx";

const { Option } = Select;

const REPAIR_STATUS = {
  PENDING: { label: "Đang sửa chữa", color: "processing" },
  IN_PROGRESS: { label: "Đang sửa chữa", color: "processing" },
  COMPLETED: { label: "Đã hoàn thành", color: "success" },
};

export default function RMARepairModeEVCheck({
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

  const [evCheckStatus, setEvCheckStatus] = useState(
    parentEvCheckStatus || null
  );
  const [statusChanges, setStatusChanges] = useState({});

  // ✅ Map export note status theo detail ID
  const [exportNoteStatusMap, setExportNoteStatusMap] = useState({});

  // ========= WARRANTY =========
  const checkWarrantyStatus = (partItem) => {
    if (!partItem) return false;
    // ✅ Lấy từ isManufacturerWarranty thay vì tính từ ngày
    return partItem.isManufacturerWarranty === true;
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

        // ✅ Map và filter duplicate partItemId, đồng thời fetch part info nếu null
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
              console.error(`❌ Error fetching partItem ${vpi.partItemId}:`, err);
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
          
          return {
            partItemId,
            value: partItemId,
            label,
            price,
            partItem,
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
        console.error("Không load được phụ tùng xe:", err);
        toast.error("Không tải được phụ tùng gắn trên xe!");
        setVehiclePartOptions([]);
      } finally {
        setVehiclePartLoading(false);
      }
    };

    loadVehicleParts();
  }, [booking?.vehicle, booking?.vehicleId]);

  // ========= LOAD EV CHECK DETAIL =========
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

      // ✅ Map details với replacePart đã có sẵn từ RMA
      const mapped = await Promise.all(
        rawDetails.map(async (item) => {
          const partItemId = item.partItem?.id || item.partItemId || "";
          // ✅ Lấy replacePart từ RMA detail (đã có sẵn)
          const replacePartId = item.replacePart?.id || item.replacePartId || "";

          const partOption = vehiclePartOptions.find(
            (p) => p.partItemId === partItemId
          );
          
          // ✅ Format displayName cho bộ phận
          let displayName = "";
          // Ưu tiên 1: Lấy từ vehiclePartOptions
          if (partOption?.label) {
            displayName = partOption.label;
          } 
          // Ưu tiên 2: Lấy từ item.partItem trực tiếp
          else if (item.partItem) {
            const partName = item.partItem.part?.name || "";
            const serial = item.partItem.serialNumber || "";
            displayName = serial ? `${partName} (${serial})` : (partName || serial || "");
          }
          // Ưu tiên 3: Gọi API nếu có partItemId
          else if (partItemId) {
            try {
              const partItemData = await getPartItemByIdService(partItemId);
              const partName = partItemData.part?.name || "";
              const serial = partItemData.serialNumber || "";
              displayName = serial ? `${partName} (${serial})` : (partName || serial || "");
            } catch (err) {
              console.error(`❌ Lỗi lấy thông tin bộ phận ${partItemId}:`, err);
              displayName = partItemId; // Fallback cuối cùng
            }
          }
          
          // ✅ Format replacePartName từ replacePart đã có
          let replacePartName = "";
          if (replacePartId && item.replacePart) {
            const replacePart = item.replacePart;
            const partName = replacePart.part?.name || "";
            const serial = replacePart.serialNumber || "";
            replacePartName = serial ? `${partName} (${serial})` : (partName || serial || replacePartId);
          } else if (replacePartId) {
            // Fallback: gọi API nếu không có replacePart object
            try {
              const partData = await getPartItemByIdService(replacePartId);
              const partName = partData.part?.name || "";
              const serial = partData.serialNumber || "";
              replacePartName = serial ? `${partName} (${serial})` : (partName || partData.serialNumber || replacePartId);
            } catch (err) {
              console.error(`❌ Lỗi lấy thông tin phụ tùng ${replacePartId}:`, err);
              replacePartName = replacePartId;
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

          return {
            ...item,
            partItemId,
            displayName: displayName || partItemId || "",
            partItem: item.partItem || partOption?.partItem || null,
            replacePartId,
            replacePartName: replacePartName || replacePartId || "",
            replacePart: item.replacePart || null, // ✅ Giữ nguyên replacePart từ RMA
            result: item.result ?? "Lắp đặt phụ tùng đã được sửa chữa từ hãng", // ✅ Mặc định cho lịch thay thế từ RMA
            remedies: item.remedies || "REPLACE", // ✅ Mặc định REPLACE vì đã có replacePart
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
      
      // ✅ Lưu export note status vào map
      const statusMap = {};
      mapped.forEach((item) => {
        if (item.id && item.exportNoteStatus) {
          statusMap[item.id] = item.exportNoteStatus;
        }
      });
      setExportNoteStatusMap(statusMap);

      if (mapped.length > 0) {
        setDetails(mapped);
      } else {
        setDetails([]);
      }

      if (statusValue) {
        setEvCheckStatus(statusValue);
      } else if (parentEvCheckStatus) {
        setEvCheckStatus(parentEvCheckStatus);
      }

      setStatusChanges({});
    } catch (err) {
      console.error("❌ Lỗi khi tải chi tiết EV Check:", err);
      toast.error("Không thể tải dữ liệu chi tiết!");
      setDetails([]);
    } finally {
      setLoading(false);
    }
  }, [
    evCheckId,
    forceEmpty,
    vehiclePartOptions,
    readOnly,
    parentEvCheckStatus,
  ]);

  useEffect(() => {
    if (
      evCheckId &&
      !forceEmpty &&
      !vehiclePartLoading
    ) {
      loadRepairDetails();
    }
  }, [
    evCheckId,
    forceEmpty,
    vehiclePartLoading,
    loadRepairDetails,
  ]);

  // ✅ Kết nối SignalR để nhận real-time updates
  const handleSignalRUpdate = useCallback(() => {
    console.log("🔄 SignalR update received, reloading EVCheck details...");
    if (evCheckId && !forceEmpty && !vehiclePartLoading) {
      loadRepairDetails();
      if (onRefresh) {
        onRefresh();
      }
    }
  }, [evCheckId, forceEmpty, vehiclePartLoading, loadRepairDetails, onRefresh]);

  useEVCheckHub(evCheckId, handleSignalRUpdate);

  // ✅ Tự động cập nhật trạng thái khi technician vào EVCheck của RMA
  useEffect(() => {
    const autoUpdateStatus = async () => {
      // ✅ Chỉ tự động cập nhật khi:
      // 1. Không phải readOnly (technician)
      // 2. Có evCheckId
      // 3. Đã load xong details
      // 4. EVCheck status chưa phải REPAIR_IN_PROGRESS hoặc REPAIR_COMPLETED hoặc COMPLETED
      if (
        readOnly ||
        !evCheckId ||
        loading ||
        details.length === 0 ||
        !evCheckStatus ||
        evCheckStatus === "REPAIR_IN_PROGRESS" ||
        evCheckStatus === "REPAIR_COMPLETED" ||
        evCheckStatus === "COMPLETED"
      ) {
        return;
      }

      try {
        // ✅ Tự động cập nhật EVCheck status thành REPAIR_IN_PROGRESS
        await updateEVCheckService(evCheckId, { status: "REPAIR_IN_PROGRESS" });
        setEvCheckStatus("REPAIR_IN_PROGRESS");
        
        // ✅ Tự động cập nhật tất cả detail status thành IN_PROGRESS nếu đang PENDING
        const pendingDetails = details.filter(
          (d) => d.status === "PENDING" || !d.status
        );
        
        if (pendingDetails.length > 0) {
          for (const detail of pendingDetails) {
            if (detail.id) {
              await updateEVCheckDetailService(detail.id, { status: "IN_PROGRESS" });
            }
          }
          // ✅ Reload để cập nhật UI
          await loadRepairDetails();
        }
        
        console.log("✅ Đã tự động cập nhật trạng thái EVCheck và details cho RMA");
      } catch (err) {
        console.error("❌ Lỗi tự động cập nhật trạng thái:", err);
        // ✅ Không hiển thị toast để tránh làm phiền user
      }
    };

    autoUpdateStatus();
  }, [evCheckId, readOnly, loading, details.length, evCheckStatus, loadRepairDetails]);

  // ========= CONTROL FLAG =========
  // ✅ RMA Repair Mode: Chỉ cho xem, không cho sửa (trừ trạng thái)
  const canEditFields = false; // ✅ Luôn disable các field, chỉ cho xem

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

  const handleChange = (index, field, value) => {
    // ✅ RMA Repair Mode: Chỉ cho phép cập nhật trạng thái
    if (field !== "status") return; // ✅ Chỉ cho phép cập nhật status

    updateRow(index, { [field]: value });

    if (field === "remedies") {
      if (value !== "REPLACE") {
        updateRow(index, {
          pricePart: 0,
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

  // ========= XÁC NHẬN SỬA CHỮA =========
  const handleConfirmRepair = async () => {
    if (loading) return;

    if (details.length === 0) {
      return toast.info("Không có hạng mục nào để xác nhận.");
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading("Đang cập nhật trạng thái hạng mục...");

      // ✅ Cập nhật TẤT CẢ các detail thành COMPLETED
      for (const detail of details) {
        if (detail.id) {
          await updateEVCheckDetailService(detail.id, { status: "COMPLETED" });
        }
      }

      // ✅ Cập nhật EVCheck status thành COMPLETED
      await updateEVCheckService(evCheckId, { status: "COMPLETED" });
      setEvCheckStatus("COMPLETED");

      toast.dismiss(loadingToast);
      toast.success("Đã hoàn thành tất cả hạng mục sửa chữa!");
      
      setStatusChanges({});
      await loadRepairDetails();
      onRefresh?.();
    } catch (err) {
      console.error("❌ Cập nhật trạng thái thất bại:", err);
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
        const partItemId = r.partItemId || "";
        
        // ✅ Tìm option tương ứng với partItemId
        const selectedOption = vehiclePartOptions.find((p) => p.partItemId === partItemId);
        
        // ✅ Nếu không tìm thấy trong options nhưng có displayName, thêm vào options tạm thời
        const allOptions = [...vehiclePartOptions];
        if (partItemId && displayName && !selectedOption) {
          allOptions.push({
            partItemId,
            value: partItemId,
            label: displayName,
            price: 0,
            partItem: r.partItem || null,
          });
        }
        
        return (
          <Tooltip title={displayName || partItemId} placement="topLeft">
            <Select
              showSearch
              placeholder='Chọn bộ phận'
              value={partItemId || undefined}
              onChange={(v) => {
                const sel = allOptions.find((p) => p.partItemId === v);
                const partItem = sel?.partItem;

                handleChange(i, "partItemId", v);

                updateRow(i, {
                  displayName: sel?.label || "",
                  pricePart: sel?.price || 0,
                  partItem,
                });
              }}
              options={allOptions}
              loading={vehiclePartLoading}
              disabled={readOnly || !canEditFields}
              style={{ width: "100%", maxWidth: "100%" }}
              filterOption={(input, opt) =>
                opt.label.toLowerCase().includes(input.toLowerCase())
              }
              dropdownStyle={{ maxWidth: "400px" }}
              notFoundContent={vehiclePartLoading ? "Đang tải..." : "Không tìm thấy"}
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
      width: 350,
      render: (_, r, i) => (
        <Input.TextArea
          placeholder='Nhập kết quả kiểm tra...'
          value={r.result ?? ""}
          onChange={(e) => handleChange(i, "result", e.target.value)}
          onBlur={(e) => {
            if (!e.target.value.trim()) {
              handleChange(i, "result", "Lắp đặt phụ tùng đã được sửa chữa từ hãng");
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
        // ✅ Map remedies sang tiếng Việt
        const getRemediesLabel = (remedies) => {
          const map = {
            REPLACE: "Thay thế",
            REPAIR: "Sửa chữa",
            CHECK: "Kiểm tra",
            LUBRICATE: "Bôi trơn",
          };
          // ✅ Normalize: chuyển về uppercase và remove spaces
          const normalized = (remedies || "").toString().toUpperCase().trim();
          return map[normalized] || map[remedies] || "Thay thế";
        };

        const remediesValue = r.remedies || "REPLACE";
        const remediesLabel = getRemediesLabel(remediesValue);

        // ✅ Chỉ cho phép "Thay thế" vì đã có replacePart từ RMA
        // ✅ Dùng labelInValue để hiển thị tiếng Việt
        return (
          <Select
            placeholder='Chọn'
            value={{ value: remediesValue, label: remediesLabel }}
            labelInValue
            style={{ width: 100 }}
            onChange={(v) => handleChange(i, "remedies", v.value || v)}
            disabled={readOnly || !canEditFields || true}>
            <Option value='REPLACE'>Thay thế</Option>
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
        // ✅ Lấy từ isManufacturerWarranty thay vì tính từ ngày
        return partItem.isManufacturerWarranty === true ? "BHH" : "Không";
      },
    },
    // {
    //   title: "Phụ tùng thay thế",
    //   width: 220,
    //   ellipsis: {
    //     showTitle: false,
    //   },
    //   render: (_, r) => {
    //     // ✅ Luôn hiển thị replacePart từ RMA (KHÔNG kiểm tra bảo hành)
    //     // Lấy từ replacePart object hoặc replacePartName đã map
    //     const replacePart = r.replacePart;
    //     let replacePartName = "";
        
    //     // ✅ Ưu tiên 1: Lấy từ replacePart object từ RMA
    //     if (replacePart) {
    //       const partName = replacePart.part?.name || "";
    //       const serial = replacePart.serialNumber || "";
    //       replacePartName = serial ? `${partName} (${serial})` : (partName || serial || "");
    //     }
        
    //     // ✅ Ưu tiên 2: Dùng replacePartName đã map từ loadRepairDetails
    //     if (!replacePartName && r.replacePartName) {
    //       replacePartName = r.replacePartName;
    //     }
        
    //     // ✅ Ưu tiên 3: Hiển thị ID nếu không có tên
    //     if (!replacePartName && r.replacePartId) {
    //       replacePartName = r.replacePartId;
    //     }
        
    //     // ✅ KHÔNG BAO GIỜ hiển thị "Còn bảo hành" trong cột này
    //     // Cột này chỉ hiển thị replacePart từ RMA
        
    //     return (
    //       <Tooltip title={replacePartName || "Chưa có phụ tùng thay thế"} placement="topLeft">
    //         <span style={{ 
    //           color: replacePartName ? "#1890ff" : "#999",
    //           fontWeight: replacePartName ? 500 : 400,
    //           fontSize: 14
    //         }}>
    //           {replacePartName || "—"}
    //         </span>
    //       </Tooltip>
    //     );
    //   },
    // },
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
      title: "Trạng thái phụ tùng",
      width: 150,
      render: (_, r) => {
        // ✅ Hiển thị exportNoteStatus nếu có (không chỉ khi COMPLETED)
        const status = r.exportNoteStatus || exportNoteStatusMap[r.id];
        if (!status) return <span style={{ color: "#999" }}>—</span>;
        
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
    // {
    //   title: "Giá PT",
    //   width: 110,
    //   render: (_, r) =>
    //     r.remedies !== "REPLACE"
    //       ? "—"
    //       : Number(r.pricePart || 0).toLocaleString(),
    // },
    // {
    //   title: "Giá DV",
    //   width: 110,
    //   render: (_, r) => Number(r.priceService || 0).toLocaleString(),
    // },
    // {
    //   title: "Tổng",
    //   width: 110,
    //   render: (_, r) =>
    //     r.totalAmount ? `${Number(r.totalAmount).toLocaleString()}đ` : "-",
    // },
   
  ];

  // Cột trạng thái cho mode sửa chữa
  const statusColumn = {
    title: <span>Trạng thái</span>,
    width: 220,
    render: (_, r, i) => {
      const stat = REPAIR_STATUS[r.status] || REPAIR_STATUS.PENDING;

      return (
        <div className='flex items-center gap-2'>
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

  // ✅ RMA Repair Mode: Luôn hiển thị cột trạng thái để có thể cập nhật
  let columns = baseColumns;
  if (!readOnly) {
    columns = [...columns, statusColumn];
  }

  return (
    <div className='space-y-4'>
      <div className='p-3 bg-yellow-50 rounded border border-yellow-300'>
        <p className='text-sm font-medium text-yellow-800'>Mô tả khách hàng:</p>
        <p className='mt-1 text-gray-700'>{booking?.note || "Chưa có mô tả"}</p>
      </div>

      {loading || vehiclePartLoading ? (
        <div className='flex justify-center p-10'>
          <Spin />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={details}
          rowKey='id'
          scroll={{ x: false }}
          pagination={false}
          size='small'
          bordered
          // ✅ RMA Repair Mode: Không có rowSelection (checkbox) và không có nút tạo RMA
          // Vì đây là sửa chữa từ RMA rồi, không cần tạo RMA nữa
        />
      )}

      {!readOnly && (
        <>
          {/* ✅ Hiện nút "Xác nhận sửa chữa" khi đang sửa chữa */}
          {evCheckStatus === "REPAIR_IN_PROGRESS" && (
            <div className='flex justify-end mt-4'>
              <Button
                type='primary'
                onClick={handleConfirmRepair}
                loading={loading}
                disabled={loading || details.length === 0}
                style={{
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
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

