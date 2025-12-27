import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Building2, User, DollarSign, Calendar, FileText, Package, Tag, Truck, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getExportNoteById, updateExportNoteDetail } from "@/api/exportNotesApi";
import { getPartItems } from "@/api/partitemsApi";
import { getPartTypeById } from "@/api/partsApi";
import { toast as toastify } from "react-toastify";

export default function ExportNoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exportNote, setExportNote] = useState(null);
  const [selectedParts, setSelectedParts] = useState(new Set());
  const [exporting, setExporting] = useState(false);
  const [partItemsByPartId, setPartItemsByPartId] = useState({}); 
  const [loadingPartItems, setLoadingPartItems] = useState({}); 
  const [expandedPartIds, setExpandedPartIds] = useState(new Set()); 
  const [receiverName, setReceiverName] = useState("");
  const [receiverLoading, setReceiverLoading] = useState(false);
  const [partTypeMap, setPartTypeMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const noteRes = await getExportNoteById(id);

        if (noteRes.success && noteRes.data) {
          setExportNote(noteRes.data);
        }
      } catch (error) {
        console.error("Error fetching export note detail:", error);
        toastify.error("Không thể tải chi tiết phiếu xuất");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (!exportNote) return;

    const value =
      exportNote.exportToName ||
      exportNote.receiverName ||
      exportNote.exportTo ||
      "—";

    setReceiverName(value);
    setReceiverLoading(false);
  }, [exportNote]);

  useEffect(() => {
    const fetchPartItemsForParts = async () => {
      if (!exportNote?.exportNoteDetails?.length) return;

      const serviceCenterId = exportNote.serviceCenterId || exportNote.serviceCenter?.id;
      if (!serviceCenterId) {
        console.warn("Không có serviceCenterId trong exportNote");
        return;
      }

      const partIds = Array.from(
        new Set(
          exportNote.exportNoteDetails
            .map((detail) => detail.proposedReplacePart?.id || detail.proposedReplacePartId)
            .filter(Boolean)
        )
      );

      if (partIds.length === 0) return;

      try {
        const loadingState = {};
        partIds.forEach(partId => {
          loadingState[partId] = true;
        });
        setLoadingPartItems(loadingState);

        const partItemsMap = {};
        await Promise.all(
          partIds.map(async (partId) => {
            try {
              const response = await getPartItems({
                partId: partId,
                serviceCenterId: serviceCenterId,
                page: 1,
                pageSize: 100,
              });

              const rowDatas = response?.data?.rowDatas || [];
              partItemsMap[partId] = rowDatas || [];
              
            } catch (error) {
              partItemsMap[partId] = [];
            } finally {
              setLoadingPartItems(prev => ({ ...prev, [partId]: false }));
            }
          })
        );

        setPartItemsByPartId(partItemsMap);
      } catch (error) {
        console.error("Error fetching part items:", error);
      }
    };

    fetchPartItemsForParts();
  }, [exportNote]);

  const exportDetails = exportNote?.exportNoteDetails || [];

  useEffect(() => {
    if (!exportDetails.length) return;

    const partTypeIds = Array.from(
      new Set(
        exportDetails
          .map((detail) => detail.proposedReplacePart?.partTypeId)
          .filter(Boolean)
      )
    );

    const idsToFetch = partTypeIds.filter((id) => !partTypeMap[id]);
    if (!idsToFetch.length) return;

    const fetchPartTypes = async () => {
      try {
        const results = await Promise.all(
          idsToFetch.map(async (partTypeId) => {
            try {
              const res = await getPartTypeById(partTypeId);
              const data = res?.data?.data || res?.data || res;
              return { id: partTypeId, name: data?.name || null };
            } catch (error) {
              console.error("Error fetching part type", partTypeId, error);
              return { id: partTypeId, name: null };
            }
          })
        );

        setPartTypeMap((prev) => {
          const next = { ...prev };
          results.forEach((r) => {
            if (r.name) next[r.id] = r.name;
          });
          return next;
        });
      } catch (error) {
        console.error("Error fetching part types:", error);
      }
    };

    fetchPartTypes();
  }, [exportDetails, partTypeMap]);

  const displayParts = exportDetails.reduce((acc, detail) => {
    const partId = detail.proposedReplacePart?.id || detail.proposedReplacePartId;
    if (!partId) return acc;

    if (!acc[partId]) {
      const part = detail.proposedReplacePart;

      const partTypeId =
        part?.partType?.id || part?.partTypeId || detail.partTypeId;
      const resolvedPartTypeName =
        part?.partType?.name ||
        (typeof part?.partType === "string" ? part.partType : null) ||
        (partTypeId && partTypeMap[partTypeId]);

      const partItems = partItemsByPartId[partId] || [];

      acc[partId] = {
        partId,
        part: part,
        code: part?.code || "UNKNOWN",
        name: part?.name,
        image: part?.image || null,
        status: part?.status || "ACTIVE",
        partType: resolvedPartTypeName,
        partItems: partItems,
        details: []
      };
    }
    acc[partId].details.push(detail);
    return acc;
  }, {});

  const getDetailStatusLabel = (status) => {
    const statusMap = {
      "STOCK_NOT_FOUND": "Hết hàng",
      "STOCK_FOUND": "Còn hàng",
      "NOT_FOUND": "Không tìm thấy hàng",
      "COMPLETED": "Hoàn thành"
    };
    return statusMap[status] || status || "Chưa tìm thấy";
  };

  const getPartStatusLabel = (status) => {
    if (status === "ACTIVE") return "Khả dụng";
    if (status === "INACTIVE") return "Không khả dụng";
    return status;
  };

  const displayItems = Object.values(displayParts).map((partData) => {
    const detailStatus = partData.details[0]?.status || "STOCK_NOT_FOUND";

    return {
      id: `part-${partData.partId}`,
      partId: partData.partId,
      code: partData.code,
      name: partData.name,
      image: partData.image,
      status: partData.status,
      partType: partData.partType,
      partItems: partData.partItems,
      details: partData.details,
      totalQuantity: partData.details.reduce((sum, d) => sum + (d.quantity || 0), 0),
      detailStatus: detailStatus
    };
  });
  
  const totals = {
    totalRows: displayItems.length
  };

  const toggleExpandPart = (partId) => {
    setExpandedPartIds(prev => {
      const next = new Set(prev);
      if (next.has(partId)) {
        next.delete(partId);
      } else {
        next.add(partId);
      }
      return next;
    });
  };
  
  const handleExportWarehouse = async () => {
    if (!exportNote || !id) {
      toastify.error("Không tìm thấy thông tin phiếu xuất");
      return;
    }

    if (selectedParts.size === 0) {
      toastify.info("Vui lòng chọn ít nhất một phụ tùng để xuất");
      return;
    }

    const currentStatus = exportNote.exportNoteStatus || exportNote.status;
    if (currentStatus === "COMPLETED") {
      toastify.info("Phiếu xuất đã được hoàn thành");
      return;
    }

    try {
      setExporting(true);
      
      const serviceCenterId =
        exportNote.serviceCenterId || exportNote.serviceCenter?.id;
      if (!serviceCenterId) {
        toastify.error(
          "Không tìm thấy thông tin kho của bạn. Vui lòng thử lại."
        );
        setExporting(false);
        return;
      }
      
      if (selectedParts.size === 0) {
        toastify.info("Vui lòng chọn ít nhất một phụ tùng để xuất kho.");
        setExporting(false);
        return;
      }
      const updatesToProcess = [];
      const usedDetailIds = new Set();
      
      for (const partItemId of selectedParts) {
        let foundPartItem = null;
        let foundPartId = null;
        
        for (const [partId, partItems] of Object.entries(partItemsByPartId)) {
          const partItem = partItems.find(pi => pi.id === partItemId);
          if (partItem) {
            foundPartItem = partItem;
            foundPartId = partId;
            break;
          }
        }
        
        if (!foundPartItem) {
          console.warn(`Không tìm thấy partItem với id: ${partItemId}`);
          continue;
        }

        const availableDetails = exportDetails.filter(detail => {
          const detailPartId = detail.proposedReplacePart?.id || detail.proposedReplacePartId;
          return detailPartId === foundPartId && 
                 !detail.partItemId && 
                 (detail.status === "STOCK_NOT_FOUND" || detail.status === "STOCK_FOUND") &&
                 !usedDetailIds.has(detail.id);
        });
        
        const availableDetail = availableDetails.find(d => d.status === "STOCK_NOT_FOUND") 
          || availableDetails.find(d => d.status === "STOCK_FOUND") 
          || availableDetails[0];
        
        if (!availableDetail) {
          console.warn(`Không tìm thấy export note detail cần update cho partItem ${partItemId} (part: ${foundPartId})`, {
            exportDetails: exportDetails.map(d => ({
              id: d.id,
              partId: d.proposedReplacePart?.id || d.proposedReplacePartId,
              partItemId: d.partItemId,
              status: d.status,
              used: usedDetailIds.has(d.id)
            }))
          });
          continue;
        }
        
        usedDetailIds.add(availableDetail.id);
        
        updatesToProcess.push({
          detailId: availableDetail.id,
          partItemId: partItemId,
          partItem: foundPartItem,
          detail: availableDetail
        });
      }
      
      if (updatesToProcess.length === 0) {
        toastify.info(
          "Không có phụ tùng nào có thể xuất kho. Có thể tất cả đã được xử lý."
        );
        setExporting(false);
        return;
      }

      console.log(`Sẽ update ${updatesToProcess.length} export note details:`, updatesToProcess);

      const updatePromises = updatesToProcess.map(async ({ detailId, partItemId }) => {
        const updateData = {
          partItemId: partItemId,
          status: "COMPLETED"
        };

        try {
          const response = await updateExportNoteDetail(detailId, updateData);
          console.log(`Updated detail ${detailId} với partItemId ${partItemId}`, response);
          return { success: true, detailId, partItemId, response };
        } catch (error) {
          console.error(`Error updating detail ${detailId}:`, error);
          return { 
            success: false, 
            detailId, 
            partItemId,
            error: error?.response?.data?.message || error?.message || "Lỗi không xác định" 
          };
        }
      });

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r && r.success).length;
      const failCount = results.length - successCount;

      if (failCount > 0) {
        toastify.info(
          `Đã cập nhật ${successCount} phụ tùng, ${failCount} phụ tùng thất bại`
        );
      } else {
        toastify.success(`Đã xuất ${successCount} phụ tùng thành công!`);
      }

      const noteRes = await getExportNoteById(id);
      if (noteRes.success && noteRes.data) {
        setExportNote(noteRes.data);
      }

      setSelectedParts(new Set());

      if (window.refreshExportNotes) {
        window.refreshExportNotes();
      }
    } catch (error) {
      console.error("Error exporting warehouse:", error);
      toastify.error(
        error.message || "Không thể xuất kho. Vui lòng thử lại."
      );
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!exportNote) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Không tìm thấy phiếu xuất</p>
      </div>
    );
  }

  const exportDate = exportNote.exportDate ?
    new Date(exportNote.exportDate).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : "";

  const getTypeLabel = (type) => {
    const typeMap = {
      REPLACEMENT: "Thay thế",
      TRANSFER_TO: "Chuyển kho"
    };
    return typeMap[type] || type;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      PENDING: "Chờ duyệt",
      PROCESSING: "Đang xử lý",
      APPROVED: "Đã duyệt",
      EXPORTING: "Đang xuất",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy"
    };
    return statusMap[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const classMap = {
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
      PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700",
      APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700",
      EXPORTING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700",
      COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700"
    };
    return classMap[status] || "bg-muted text-muted-foreground border-border";
  };

  const infoItems = [
    {
      icon: Tag,
      label: "Mã phiếu",
      value: exportNote.code,
      valueClass: "text-lg",
    },
    {
      icon: Package,
      label: "Loại",
      value: (
        <Badge className="bg-red-600 text-white border-none shadow-sm px-4 py-1 rounded-full text-xs">
          {getTypeLabel(exportNote.type)}
        </Badge>
      ),
    },
    {
      icon: Check,
      label: "Trạng thái",
      value: (
        <Badge
          variant="secondary"
          className={`border ${getStatusBadgeClass(
            exportNote.exportNoteStatus || exportNote.status || "PENDING"
          )} px-4`}
        >
          {getStatusLabel(exportNote.exportNoteStatus || exportNote.status || "PENDING")}
        </Badge>
      ),
    },
    {
      icon: Calendar,
      label: "Ngày xuất",
      value: exportDate,
    },
    {
      icon: User,
      label: "Người nhận",
      value: receiverLoading ? "Đang tải..." : (receiverName || "—"),
    },
    {
      icon: Package,
      label: "Tổng số lượng",
      value: exportNote.totalQuantity,
    },
    {
      icon: DollarSign,
      label: "Tổng giá trị",
      value: formatCurrency(exportNote.totalValue),
    },
    {
      icon: Building2,
      label: "Trung tâm",
      value: exportNote.serviceCenter?.name || "—",
      subText: exportNote.serviceCenter?.address,
    },
    {
      icon: FileText,
      label: "Ghi chú",
      value: exportNote.note || "—",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Danh sách Phiếu xuất kho / Chi tiết / <span className="text-red-600 dark:text-red-400">{exportNote.code}</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedParts.size > 0 && (
              <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                Đã chọn: {selectedParts.size} phụ tùng
              </div>
            )}
            <Button 
              className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleExportWarehouse}
              disabled={exporting || (exportNote?.exportNoteStatus || exportNote?.status) === "COMPLETED" || selectedParts.size === 0}
            >
              <Truck className="h-4 w-4" />
              {exporting ? "Đang xuất kho..." : "Xuất kho"}
            </Button>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-card shadow-md overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-gradient-to-r from-red-50 to-red-100/60 dark:from-red-950/30 dark:to-transparent">
            <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-bold text-foreground">Thông tin phiếu</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {infoItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl bg-white/80 dark:bg-card/70 px-3 py-2 shadow-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-200">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</p>
                    <div className={`text-base font-semibold text-foreground ${item.valueClass || ""}`}>
                      {item.value}
                    </div>
                    {item.subText && <p className="text-xs text-muted-foreground">{item.subText}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Tabs defaultValue="parts" className="mb-6">
          <TabsList className="bg-muted/50 border border-border">
            <TabsTrigger 
              value="parts" 
              className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm font-semibold dark:data-[state=active]:bg-muted"
            >
              Danh sách phụ tùng cần xuất
            </TabsTrigger>
            <TabsTrigger 
              value="log"
              className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm font-semibold dark:data-[state=active]:bg-muted"
            >
              Lịch sử xuất kho
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parts" className="mt-4">
            <div className="bg-card rounded-xl border border-border shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[1200px]">
                  <table className="w-full table-fixed text-sm">
                    <colgroup>
                      <col style={{ width: '60px' }} />
                      <col style={{ width: '180px' }} />
                      <col style={{ width: '200px' }} />
                      <col style={{ width: '150px' }} />
                      <col style={{ width: '140px' }} />
                      <col style={{ width: '160px' }} />
                      <col style={{ width: '120px' }} />
                      <col style={{ width: '100px' }} />
                      <col style={{ width: '100px' }} />
                    </colgroup>
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                        <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap"></th>
                        <th className="text-left py-4 px-5 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                          Mã
                        </th>
                        <th className="text-left py-4 px-5 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                          Tên phụ tùng
                        </th>
                        <th className="text-left py-4 px-5 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                          Loại phụ tùng
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                          Trạng thái
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                          Trạng thái xuất
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                          SL tồn kho
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                          SL xuất
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap sticky right-0 bg-red-50 z-20 border-l border-red-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                          Chọn
                        </th>
                      </tr>
                    </thead>
                  <tbody>
                    {displayItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 px-6 text-center text-sm text-muted-foreground">
                          {Object.values(loadingPartItems).some(loading => loading) ? "Đang tải dữ liệu..." : "Không có phụ tùng nào cần xuất."}
                        </td>
                      </tr>
                    ) : (
                      displayItems.map((item, idx) => {
                        const isExpanded = expandedPartIds.has(item.partId);
                        const partItems = item.partItems || [];
                        const canExpand = item.detailStatus !== "COMPLETED";
                        
                        return (
                          <>
                        <tr
                          key={item.id}
                          className={`group border-b border-slate-200 transition-colors ${canExpand ? "cursor-pointer" : ""} ${
                            idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/40 hover:bg-slate-100/60"
                          }`}
                          onClick={() => canExpand && toggleExpandPart(item.partId)}
                        >
                          <td className="py-4 px-4 text-center align-middle">
                            {canExpand ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandPart(item.partId);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            ) : null}
                          </td>
                          <td className="py-4 px-5 align-middle">
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-12 w-12 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                                />
                              )}
                              <span className="text-sm font-semibold text-primary whitespace-nowrap">
                                {item.code}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-sm font-medium text-slate-900 whitespace-nowrap truncate align-middle">
                            {item.name}
                          </td>
                          <td className="py-4 px-5 text-sm text-slate-600 whitespace-nowrap truncate align-middle">
                            {item.partType}
                          </td>
                          <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                            <Badge
                              variant="secondary"
                              className={
                                item.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800 border border-green-300"
                                  : "bg-gray-100 text-gray-800 border border-gray-300"
                              }
                            >
                              {getPartStatusLabel(item.status)}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                            <Badge
                              variant="secondary"
                              className={
                                item.detailStatus === "STOCK_FOUND" || item.detailStatus === "COMPLETED"
                                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                                  : "bg-red-100 text-red-800 border border-red-300"
                              }
                            >
                              {getDetailStatusLabel(item.detailStatus)}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-center text-sm font-semibold text-slate-900 whitespace-nowrap align-middle">
                            {loadingPartItems[item.partId] ? (
                              <span className="text-xs text-slate-500">Đang tải...</span>
                            ) : (
                              <Badge variant="secondary" className="whitespace-nowrap">
                                {partItems.reduce((sum, pi) => sum + (pi.quantity || 0), 0)}
                              </Badge>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center text-sm font-semibold text-slate-900 whitespace-nowrap align-middle">
                            {item.totalQuantity}
                          </td>
                          <td className={`py-4 px-4 text-center align-middle sticky right-0 z-10 border-l border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                          </td>
                        </tr>
                            {canExpand && isExpanded && (() => {
                              // Nhóm các partItem không có serial
                              const groupedPartItems = [];
                              const itemMap = new Map();
                              
                              partItems.forEach((partItem) => {
                                const serialKey = partItem.serialNumber || "";
                                const hasSerial = serialKey.trim() !== "" && serialKey !== "-";
                                
                                if (hasSerial) {
                                  // Nếu có serial, hiển thị riêng
                                  groupedPartItems.push({
                                    ...partItem,
                                    isGrouped: false,
                                  });
                                } else {
                                  // Nếu không có serial, cộng dồn lại
                                  const key = `${item.partId}-no-serial`;
                                  if (!itemMap.has(key)) {
                                    itemMap.set(key, {
                                      id: `grouped-${key}`,
                                      serialNumber: "—",
                                      quantity: 0,
                                      part: partItem.part || item.part,
                                      isGrouped: true,
                                      originalItems: [],
                                    });
                                  }
                                  const groupedItem = itemMap.get(key);
                                  groupedItem.quantity += (partItem.quantity || 1);
                                  groupedItem.originalItems.push(partItem);
                                }
                              });
                              
                              // Thêm các item đã nhóm vào danh sách
                              itemMap.forEach((groupedItem) => {
                                groupedPartItems.push(groupedItem);
                              });
                              
                              return groupedPartItems.map((partItem, pIdx) => (
                                <tr
                                  key={`${item.partId}-${partItem.id || pIdx}`}
                                  className={`group border-b border-slate-200 ${idx % 2 === 0 ? "bg-slate-50/50 hover:bg-slate-100/70" : "bg-slate-100/30 hover:bg-slate-150/50"}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <td className="py-3 px-4"></td>
                                  <td className="py-3 px-5 pl-12 align-middle">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">└─</span>
                                        <span className="text-xs text-slate-500">Số serial:</span>
                                      </div>
                                      <div className="pl-6">
                                        <span className="text-xs font-semibold text-primary whitespace-nowrap">{partItem.serialNumber || "—"}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-5 text-xs align-middle">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-slate-600 whitespace-nowrap truncate">{partItem.part?.name || item.name}</span>
                                      {partItem.serialNumber && partItem.serialNumber !== "—" && (
                                        <span className="text-xs text-primary font-medium whitespace-nowrap">Serial: {partItem.serialNumber}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-5 text-xs text-slate-600 whitespace-nowrap truncate align-middle">
                                    {partItem.part?.partType?.name || partItem.part?.partType || item.partType || "N/A"}
                                  </td>
                                  <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        partItem.part?.status === "ACTIVE"
                                          ? "bg-green-100 text-green-800 border-green-300"
                                          : "bg-gray-100 text-gray-800 border-gray-300"
                                      }`}
                                    >
                                      {getPartStatusLabel(partItem.part?.status)}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                                  </td>
                                  <td className="py-3 px-4 text-center text-xs font-medium whitespace-nowrap align-middle">
                                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                      {partItem.quantity || 0}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-center text-xs text-slate-500 whitespace-nowrap align-middle">
                                  </td>
                                  <td className={`py-3 px-4 text-center align-middle sticky right-0 z-10 border-l border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 ${idx % 2 === 0 ? "bg-slate-50/50" : "bg-slate-100/30"}`}>
                                    {partItem.isGrouped ? (
                                      // Nếu là item đã nhóm, check nếu tất cả các item gốc đã được chọn
                                      <Checkbox
                                        checked={partItem.originalItems?.every(origItem => selectedParts.has(origItem.id)) || false}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            // Chọn tất cả các item gốc trong nhóm
                                            setSelectedParts(prev => {
                                              const next = new Set(prev);
                                              partItem.originalItems?.forEach(origItem => {
                                                next.add(origItem.id);
                                              });
                                              return next;
                                            });
                                          } else {
                                            // Bỏ chọn tất cả các item gốc trong nhóm
                                            setSelectedParts(prev => {
                                              const next = new Set(prev);
                                              partItem.originalItems?.forEach(origItem => {
                                                next.delete(origItem.id);
                                              });
                                              return next;
                                            });
                                          }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <Checkbox
                                        checked={selectedParts.has(partItem.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedParts(prev => new Set([...prev, partItem.id]));
                                          } else {
                                            setSelectedParts(prev => {
                                              const next = new Set(prev);
                                              next.delete(partItem.id);
                                              return next;
                                            });
                                          }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    )}
                                  </td>
                                </tr>
                              ));
                            })()}
                          </>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td colSpan={9} className="py-4 px-6 text-sm font-semibold text-slate-900">
                        Tổng số phụ tùng: <span className="text-slate-900">{totals.totalRows}</span>
                        {selectedParts.size > 0 && (
                          <span className="ml-4 text-primary">• Đã chọn: {selectedParts.size} phụ tùng</span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="log" className="mt-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <div className="min-w-[1200px]">
                    <table className="w-full table-fixed text-sm">
                      <colgroup>
                        <col style={{ width: '60px' }} />
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '200px' }} />
                        <col style={{ width: '150px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '180px' }} />
                      </colgroup>
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                          <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">STT</th>
                          <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">Mã phụ tùng</th>
                          <th className="text-center py-4 px-5 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">Tên phụ tùng</th>
                          <th className="text-center py-4 px-5 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">Serial</th>
                          <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">Số lượng</th>
                          <th className="text-center py-4 px-5 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">Đơn giá</th>
                          <th className="text-center py-4 px-5 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">Thành tiền</th>
                          <th className="text-center py-4 px-5 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">Trạng thái</th>
                          <th className="text-center py-4 px-5 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">Thời gian xuất</th>
                        </tr>
                      </thead>
                    <tbody>
                      {exportDetails.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 px-6 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                <FileText className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                              <p className="text-sm text-muted-foreground">Chưa có nhật ký xuất kho</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        exportDetails.map((detail, idx) => {
                          const partItem = detail.partItem;
                          const part = detail.proposedReplacePart;
                          const exportTime = exportNote.exportDate
                            ? new Date(exportNote.exportDate).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : "—";

                          return (
                            <tr
                              key={detail.id || idx}
                              className={`border-b border-slate-200 transition-colors ${
                                idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/40 hover:bg-slate-100/60"
                              }`}
                            >
                              <td className="py-4 px-4 text-center text-sm text-slate-600 whitespace-nowrap align-middle">
                                {idx + 1}
                              </td>
                              <td className="py-4 px-4 text-center text-sm font-semibold text-slate-900 whitespace-nowrap align-middle">
                                {part?.code || "N/A"}
                              </td>
                              <td className="py-4 px-5 text-center text-sm text-slate-900 whitespace-nowrap truncate align-middle">
                                {part?.name || "N/A"}
                              </td>
                              <td className="py-4 px-5 text-center text-sm font-semibold text-primary whitespace-nowrap align-middle">
                                {partItem?.serialNumber || "—"}
                              </td>
                              <td className="py-4 px-4 text-center text-sm text-slate-900 whitespace-nowrap align-middle">
                                {detail.quantity || 0}
                              </td>
                              <td className="py-4 px-5 text-center text-sm text-slate-900 whitespace-nowrap align-middle">
                                {detail.unitPrice ? formatCurrency(detail.unitPrice) : "—"}
                              </td>
                              <td className="py-4 px-5 text-center text-sm font-semibold text-slate-900 whitespace-nowrap align-middle">
                                {detail.totalPrice ? formatCurrency(detail.totalPrice) : "—"}
                              </td>
                              <td className="py-4 px-5 text-center align-middle whitespace-nowrap">
                                <Badge
                                  variant="secondary"
                                  className={`border ${
                                    detail.status === "COMPLETED"
                                      ? "bg-green-100 text-green-800 border-green-300"
                                      : detail.status === "STOCK_FOUND"
                                      ? "bg-blue-100 text-blue-800 border-blue-300"
                                      : "bg-yellow-100 text-yellow-800 border-yellow-300"
                                  }`}
                                >
                                  {getDetailStatusLabel(detail.status)}
                                </Badge>
                              </td>
                              <td className="py-4 px-5 text-center text-sm text-slate-900 whitespace-nowrap align-middle">
                                {exportTime}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

