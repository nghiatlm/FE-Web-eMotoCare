import { useState, useEffect, useCallback } from "react";
import { Table, Input, Select, Button, Tag, Tooltip } from "antd";
import { toast } from "react-toastify";
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
import useRMAHub from "../../../hooks/useRMAHub.jsx";
import useExportNoteHub from "../../../hooks/useExportNoteHub.jsx";
import Loading from "../../Loading";

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

  const [vehiclePartOptions, setVehiclePartOptions] = useState([]);
  const [vehiclePartLoading, setVehiclePartLoading] = useState(true);

  const [evCheckStatus, setEvCheckStatus] = useState(
    parentEvCheckStatus || null
  );
  const [statusChanges, setStatusChanges] = useState({});

  const [exportNoteStatusMap, setExportNoteStatusMap] = useState({});

  const checkWarrantyStatus = (partItem) => {
    if (!partItem) return false;
    return partItem.isManufacturerWarranty === true;
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
        toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không tải được phụ tùng gắn trên xe!"));
        setVehiclePartOptions([]);
      } finally {
        setVehiclePartLoading(false);
      }
    };

    loadVehicleParts();
  }, [booking?.vehicle, booking?.vehicleId]);

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
          const replacePartId = item.replacePart?.id || item.replacePartId || "";

          const partOption = vehiclePartOptions.find(
            (p) => p.partItemId === partItemId
          );
          
          let displayName = "";
          if (partOption?.label) {
            displayName = partOption.label;
          } 
          else if (item.partItem) {
            const partName = item.partItem.part?.name || "";
            const serial = item.partItem.serialNumber || "";
            displayName = serial ? `${partName} (${serial})` : (partName || serial || "");
          }
          else if (partItemId) {
            try {
              const partItemData = await getPartItemByIdService(partItemId);
              const partName = partItemData.part?.name || "";
              const serial = partItemData.serialNumber || "";
              displayName = serial ? `${partName} (${serial})` : (partName || serial || "");
            } catch (err) {
              displayName = partItemId;
            }
          }
          
          let replacePartName = "";
          if (replacePartId && item.replacePart) {
            const replacePart = item.replacePart;
            const partName = replacePart.part?.name || "";
            const serial = replacePart.serialNumber || "";
            replacePartName = serial ? `${partName} (${serial})` : (partName || serial || replacePartId);
          } else if (replacePartId) {
            try {
              const partData = await getPartItemByIdService(replacePartId);
              const partName = partData.part?.name || "";
              const serial = partData.serialNumber || "";
              replacePartName = serial ? `${partName} (${serial})` : (partName || partData.serialNumber || replacePartId);
            } catch (err) {
              replacePartName = replacePartId;
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

          return {
            ...item,
            partItemId,
            displayName: displayName || partItemId || "",
            partItem: item.partItem || partOption?.partItem || null,
            replacePartId,
            replacePartName: replacePartName || replacePartId || "",
            replacePart: item.replacePart || null,
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
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể tải dữ liệu chi tiết!"));
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

  const handleEVCheckUpdate = useCallback(() => {
    if (evCheckId && !forceEmpty && !vehiclePartLoading) {
      loadRepairDetails();
      if (onRefresh) {
        onRefresh();
      }
    }
  }, [evCheckId, forceEmpty, vehiclePartLoading, loadRepairDetails, onRefresh]);

  useEVCheckHub(evCheckId, handleEVCheckUpdate);

  const handleRMAUpdate = useCallback(() => {
    if (evCheckId && !forceEmpty && !vehiclePartLoading) {
      loadRepairDetails();
      if (onRefresh) {
        onRefresh();
      }
    }
  }, [evCheckId, forceEmpty, vehiclePartLoading, loadRepairDetails, onRefresh]);

  useRMAHub(handleRMAUpdate);

  // Handler để refresh trạng thái phụ tùng khi có update từ export note
  const handleExportNoteUpdate = useCallback(() => {
    if (evCheckId && !forceEmpty && !vehiclePartLoading) {
      // Reload lại details để cập nhật trạng thái phụ tùng
      loadRepairDetails();
    }
  }, [evCheckId, forceEmpty, vehiclePartLoading, loadRepairDetails]);

  useExportNoteHub(handleExportNoteUpdate);

  useEffect(() => {
    const autoUpdateStatus = async () => {
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
        await updateEVCheckService(evCheckId, { status: "REPAIR_IN_PROGRESS" });
        setEvCheckStatus("REPAIR_IN_PROGRESS");
        
        const pendingDetails = details.filter(
          (d) => d.status === "PENDING" || !d.status
        );
        
        if (pendingDetails.length > 0) {
          for (const detail of pendingDetails) {
            if (detail.id) {
              await updateEVCheckDetailService(detail.id, { status: "IN_PROGRESS" });
            }
          }
          await loadRepairDetails();
        }
        
      } catch (err) {
      }
    };

    autoUpdateStatus();
  }, [evCheckId, readOnly, loading, details.length, evCheckStatus, loadRepairDetails]);

  const canEditFields = false;

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
    if (field !== "status") return;

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

  const updatePriceService = async (index, remedies) => {
    if (!["REPAIR", "REPLACE", "TUNE", "CLEAN"].includes(remedies)) {
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

  const handleConfirmRepair = async () => {
    if (loading) return;

    if (details.length === 0) {
      return toast.info("Không có hạng mục nào để xác nhận.");
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading("Đang cập nhật trạng thái hạng mục...");

      for (const detail of details) {
        if (detail.id) {
          await updateEVCheckDetailService(detail.id, { status: "COMPLETED" });
        }
      }

      await updateEVCheckService(evCheckId, { status: "COMPLETED" });
      setEvCheckStatus("COMPLETED");

      toast.dismiss(loadingToast);
      toast.success("Đã hoàn thành tất cả hạng mục sửa chữa!");
      
      setStatusChanges({});
      await loadRepairDetails();
      onRefresh?.();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể cập nhật trạng thái hạng mục!"));
    } finally {
      setLoading(false);
    }
  };

  const baseColumns = [
    { title: "STT", render: (_, __, i) => i + 1, width: 35 },
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
        
        const allOptions = [...vehiclePartOptions];
        if (partItemId && !selectedOption) {
          const partName = displayName || r.partItem?.part?.name || "";
          if (partName) {
            allOptions.push({
              partItemId,
              value: partItemId,
              label: partName,
              price: r.pricePart || 0,
              partItem: r.partItem || null,
              partId: r.partItem?.part?.id || null,
            });
          }
        }
        
        // Khi đã hoàn thành sửa chữa, chỉ hiển thị text
        if (!canEditFields || readOnly) {
          return (
            <span style={{ fontSize: 14 }}>
              {displayName || ""}
            </span>
          );
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

                handleChange(i, "partItemId", v);

                updateRow(i, {
                  displayName: sel?.label || "",
                  pricePart: sel?.price || 0,
                  partItem,
                });
              }}
              options={allOptions}
              loading={vehiclePartLoading}
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
      width: 120,
      render: (_, r, i) => {
        // Khi đã hoàn thành sửa chữa, chỉ hiển thị text
        if (!canEditFields || readOnly) {
          const displayResult = r.result && r.result.trim() ? r.result : "Tốt";
          return (
            <span style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
              {displayResult}
            </span>
          );
        }
        
        return (
          <Input.TextArea
            value={r.result ?? ""}
            placeholder="Tốt"
            onChange={(e) => handleChange(i, "result", e.target.value)}
            autoSize={{ minRows: 2, maxRows: 8 }}
            style={{ resize: "none", fontSize: 14, maxWidth: "100%" }}
          />
        );
      },
    },
    {
      title: "Biện pháp",
      width: 90,
      render: (_, r, i) => {
        const getRemediesLabel = (remedies) => {
          const map = {
            REPLACE: "Thay thế",
            REPAIR: "Sửa chữa",
            CLEAN: "Vệ sinh",
            TUNE: "Điều chỉnh",
            WARRANTY: "Bảo hành",
            NONE: "Biện pháp",
          };
          const normalized = (remedies || "").toString().toUpperCase().trim();
          return map[normalized] || map[remedies] || "Thay thế";
        };

        const remediesValue = r.remedies || "REPLACE";
        const remediesLabel = getRemediesLabel(remediesValue);

        // Khi đã hoàn thành sửa chữa, chỉ hiển thị text
        if (!canEditFields || readOnly) {
          return <span style={{ fontSize: 14 }}>{remediesLabel}</span>;
        }

        return (
          <Tooltip title={remediesLabel} placement="topLeft">
            <Select
              placeholder='Chọn'
              value={{ value: remediesValue, label: remediesLabel }}
              labelInValue
              style={{ width: 100 }}
              onChange={(v) => handleChange(i, "remedies", v.value || v)}>
              <Option value='REPLACE'>Thay thế</Option>
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
        if (!partItem) return <Tag color="default">Không</Tag>;
        return partItem.isManufacturerWarranty === true ? (
          <Tag color="red">Có</Tag>
        ) : <Tag color="default">Không</Tag>;
      },
    },











        






        




        




        


        













    {
      title: "Số lượng",
      width: 50,
      align: "center",
      render: (_, r, i) => {
        const isReplace = (r.remedies || "").toUpperCase() === "REPLACE";
        const quantity = Number(r.quantity || 0);
        
        // ✅ Chỉ hiển thị số lượng khi là REPLACE và quantity > 0
        if (!isReplace || quantity === 0) {
          return "";
        }
        
        return <span style={{ fontSize: "14px" }}>{quantity}</span>;
      },
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
    title: <span>Trạng thái</span>,
    width: 120,
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
          <Loading />
        </div>
      ) : (
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
      )}

      {!readOnly && (
        <>
          
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

