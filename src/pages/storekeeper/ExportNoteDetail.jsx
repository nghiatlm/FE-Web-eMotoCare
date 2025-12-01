import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Check, Building2, User, DollarSign, Calendar, FileText, Package, Tag, Truck, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getExportNoteById, updateExportNote, updateExportNoteDetail } from "@/api/exportNotesApi";
import { getPartItems } from "@/api/partitemsApi";
import { useToast } from "@/hooks/use-toast";

export default function ExportNoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exportNote, setExportNote] = useState(null);
  const [selectedParts, setSelectedParts] = useState(new Set());
  const [exporting, setExporting] = useState(false);
  const [partItemsByPartId, setPartItemsByPartId] = useState({}); // Lưu part items theo partId
  const [loadingPartItems, setLoadingPartItems] = useState({}); // Loading state cho từng part
  const [expandedPartIds, setExpandedPartIds] = useState(new Set()); // Track expanded parts

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
        toast({
          title: "Lỗi",
          description: "Không thể tải chi tiết phiếu xuất",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, toast]);

  // Fetch part items cho mỗi proposedReplacePart
  useEffect(() => {
    const fetchPartItemsForParts = async () => {
      if (!exportNote?.exportNoteDetails?.length) return;

      const serviceCenterId = exportNote.serviceCenterId || exportNote.serviceCenter?.id;
      if (!serviceCenterId) {
        console.warn("⚠️ Không có serviceCenterId trong exportNote");
        return;
      }

      // Lấy danh sách unique partIds từ proposedReplacePart
      const partIds = Array.from(
        new Set(
          exportNote.exportNoteDetails
            .map((detail) => detail.proposedReplacePart?.id || detail.proposedReplacePartId)
            .filter(Boolean)
        )
      );

      if (partIds.length === 0) return;

      try {
        // Set loading cho tất cả parts
        const loadingState = {};
        partIds.forEach(partId => {
          loadingState[partId] = true;
        });
        setLoadingPartItems(loadingState);

        // Fetch part items cho mỗi partId
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
              
              console.log(`✅ Fetched ${rowDatas.length} part items cho partId: ${partId}`);
            } catch (error) {
              console.error(`❌ Error fetching part items for partId ${partId}:`, error);
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

  // Group by proposedReplacePart - hiển thị tất cả parts (kể cả không có part items)
  const displayParts = exportDetails.reduce((acc, detail) => {
    const partId = detail.proposedReplacePart?.id || detail.proposedReplacePartId;
    if (!partId) return acc;

    if (!acc[partId]) {
      const part = detail.proposedReplacePart;
      
      // Lấy part items từ state theo partId
      const partItems = partItemsByPartId[partId] || [];
      
      acc[partId] = {
        partId,
        part: part,
        code: part?.code || "UNKNOWN",
        name: part?.name || "N/A",
        image: part?.image || null,
        status: part?.status || "INACTIVE", // Lưu status gốc để dùng hàm getPartStatusLabel
        partType: part?.partType?.name || part?.partType || "N/A", // Loại phụ tùng
        partItems: partItems, // Part items từ API
        details: []
      };
    }
    acc[partId].details.push(detail);
    return acc;
  }, {});

  // Hàm chuyển status sang tiếng Việt
  const getDetailStatusLabel = (status) => {
    const statusMap = {
      "STOCK_NOT_FOUND": "Chưa tìm thấy",
      "STOCK_FOUND": "Đã tìm thấy",
      "COMPLETED": "Hoàn thành"
    };
    return statusMap[status] || status || "Chưa tìm thấy";
  };

  // Hàm chuyển trạng thái part sang tiếng Việt
  const getPartStatusLabel = (status) => {
    if (status === "ACTIVE") return "Khả dụng";
    if (status === "INACTIVE") return "Không khả dụng";
    return status || "N/A";
  };

  const displayItems = Object.values(displayParts).map((partData) => {
    // Lấy status từ detail (ưu tiên status từ API)
    const detailStatus = partData.details[0]?.status || "STOCK_NOT_FOUND";
    
    return {
      id: `part-${partData.partId}`,
      partId: partData.partId,
      code: partData.code,
      name: partData.name,
      image: partData.image,
      status: partData.status,
      partType: partData.partType, // Loại phụ tùng
      partItems: partData.partItems,
      details: partData.details,
      totalQuantity: partData.details.reduce((sum, d) => sum + (d.quantity || 0), 0),
      detailStatus: detailStatus // Dùng trực tiếp status từ API
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
  
  const togglePartSelection = (itemId) => {
    setSelectedParts(prev => {
      const next = new Set(prev);
      const isSelected = next.has(itemId);
      
      // Tìm item được chọn/bỏ chọn
      const item = displayItems.find(i => i.id === itemId);
      
      if (isSelected) {
        // Bỏ chọn
        next.delete(itemId);
        console.log("❌ Bỏ chọn part item:", {
          detailId: itemId,
          partItemId: item?.partItemId,
          partName: item?.name,
          partCode: item?.code,
          quantity: item?.quantity,
          status: item?.status
        });
      } else {
        next.add(itemId);
        console.log("✅ Chọn part item:", {
          detailId: itemId,
          partItemId: item?.partItemId,
          partName: item?.name,
          partCode: item?.code,
          quantity: item?.quantity,
          status: item?.status,
          proposedReplacePartId: item?.proposedReplacePartId,
          serviceCenterId: item?.serviceCenterId,
          serialNumbers: item?.serialNumbers,
          fullItem: item
        });
      }
      
      return next;
    });
  };

  const handleExportWarehouse = async () => {
    if (!exportNote || !id) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin phiếu xuất",
        variant: "destructive"
      });
      return;
    }

    if (selectedParts.size === 0) {
      toast({
        title: "Cảnh báo",
        description: "Vui lòng chọn ít nhất một phụ tùng để xuất",
        variant: "default"
      });
      return;
    }

    const currentStatus = exportNote.exportNoteStatus || exportNote.status;
    if (currentStatus === "COMPLETED") {
      toast({
        title: "Thông báo",
        description: "Phiếu xuất đã được hoàn thành",
        variant: "default"
      });
      return;
    }

    try {
      setExporting(true);
      
      // Lấy serviceCenterId từ exportNote để đảm bảo chỉ lấy part items trong kho của thủ kho
      const serviceCenterId = exportNote.serviceCenterId || exportNote.serviceCenter?.id;
      if (!serviceCenterId) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy thông tin kho của bạn. Vui lòng thử lại.",
          variant: "destructive",
        });
        setExporting(false);
        return;
      }
      
      console.log("🔍 Xuất kho với serviceCenterId:", serviceCenterId);
      console.log("📦 Selected part item IDs:", Array.from(selectedParts));
      
      if (selectedParts.size === 0) {
        toast({
          title: "Cảnh báo",
          description: "Vui lòng chọn ít nhất một phụ tùng để xuất kho.",
          variant: "default",
        });
        setExporting(false);
        return;
      }

      // Tìm partItem và export note detail tương ứng
      const updatesToProcess = [];
      const usedDetailIds = new Set(); // Track các detail đã được map
      
      for (const partItemId of selectedParts) {
        // Tìm partItem từ partItemsByPartId
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
          console.warn(`⚠️ Không tìm thấy partItem với id: ${partItemId}`);
          continue;
        }
        
        // Tìm export note detail chưa có partItemId (status = "STOCK_NOT_FOUND") và chưa được map
        const availableDetail = exportDetails.find(detail => {
          const detailPartId = detail.proposedReplacePart?.id || detail.proposedReplacePartId;
          return detailPartId === foundPartId && 
                 !detail.partItemId && 
                 detail.status === "STOCK_NOT_FOUND" &&
                 !usedDetailIds.has(detail.id);
        });
        
        if (!availableDetail) {
          console.warn(`⚠️ Không tìm thấy export note detail cần update cho partItem ${partItemId} (part: ${foundPartId})`);
          continue;
        }
        
        // Đánh dấu detail đã được map
        usedDetailIds.add(availableDetail.id);
        
        updatesToProcess.push({
          detailId: availableDetail.id,
          partItemId: partItemId,
          partItem: foundPartItem,
          detail: availableDetail
        });
      }
      
      if (updatesToProcess.length === 0) {
        toast({
          title: "Cảnh báo",
          description: "Không có phụ tùng nào có thể xuất kho. Có thể tất cả đã được xử lý.",
          variant: "default",
        });
        setExporting(false);
        return;
      }
      
      console.log(`📝 Sẽ update ${updatesToProcess.length} export note details:`, updatesToProcess);

      const updatePromises = updatesToProcess.map(async ({ detailId, partItemId }) => {
        const updateData = {
          partItemId: partItemId,
          status: "COMPLETED"
        };

        try {
          const response = await updateExportNoteDetail(detailId, updateData);
          console.log(`✅ Updated detail ${detailId} với partItemId ${partItemId}`, response);
          return { success: true, detailId, partItemId, response };
        } catch (error) {
          console.error(`❌ Error updating detail ${detailId}:`, error);
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
        toast({
          title: "Cảnh báo",
          description: `Đã cập nhật ${successCount} phụ tùng, ${failCount} phụ tùng thất bại`,
          variant: "default"
        });
      } else {
        toast({
          title: "Thành công",
          description: `Đã xuất ${successCount} phụ tùng thành công!`,
        });
      }

      // Refresh data
      const noteRes = await getExportNoteById(id);
      if (noteRes.success && noteRes.data) {
        setExportNote(noteRes.data);
      }

      // Clear selection
      setSelectedParts(new Set());

      if (window.refreshExportNotes) {
        window.refreshExportNotes();
      }
    } catch (error) {
      console.error("Error exporting warehouse:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xuất kho. Vui lòng thử lại.",
        variant: "destructive"
      });
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

  const exportDate = exportNote.exportDate
    ? new Date(exportNote.exportDate).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : "N/A";

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
      value: exportNote.exportTo || "—",
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
      icon: User,
      label: "Người xuất",
      value: exportNote.exportBy
        ? `${exportNote.exportBy.firstName || ""} ${exportNote.exportBy.lastName || ""}`.trim() ||
          exportNote.exportBy.staffCode ||
          "—"
        : "—",
      subText: exportNote.exportBy?.staffCode ? `Mã: ${exportNote.exportBy.staffCode}` : undefined,
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

        {/* Tabs */}
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
              Nhật ký & Số lần xuất
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parts" className="mt-4">
            <div className="bg-card rounded-xl border border-border shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10 border-b-2 border-red-200/50 dark:border-red-800/30">
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider w-12"></th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Mã</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Tên phụ tùng</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Loại phụ tùng</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Trạng thái</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Trạng thái kho</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Số lượng tồn kho</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Số lượng xuất</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Chọn</th>
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
                        
                        return (
                          <>
                            {/* Part Row */}
                            <tr
                              key={item.id}
                              className={`border-b border-border transition-all duration-200 cursor-pointer ${
                                idx % 2 === 0
                                  ? "bg-gradient-to-r from-white to-rose-50/60 dark:from-card dark:to-red-950/10"
                                  : "bg-white dark:bg-card"
                              } hover:bg-rose-50/80`}
                              onClick={() => toggleExpandPart(item.partId)}
                            >
                              <td className="py-4 px-6">
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
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="h-12 w-12 rounded-lg object-cover border border-border/60"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-lg border border-dashed border-border/60 flex items-center justify-center text-xs text-muted-foreground">
                                      N/A
                                    </div>
                                  )}
                                  <span className="text-sm font-bold text-primary">{item.code}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm font-medium text-foreground">{item.name}</td>
                              <td className="py-4 px-6 text-sm text-muted-foreground">
                                {item.partType || "N/A"}
                              </td>
                              <td className="py-4 px-6">
                                <Badge
                                  variant="secondary"
                                  className={
                                    item.status === "ACTIVE"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-300 dark:border-green-700"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-300 dark:border-gray-700"
                                  }
                                >
                                  {getPartStatusLabel(item.status)}
                                </Badge>
                              </td>
                              <td className="py-4 px-6">
                                <Badge
                                  variant="secondary"
                                  className={
                                    item.detailStatus === "STOCK_FOUND" || item.detailStatus === "COMPLETED"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-300 dark:border-blue-700"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border border-red-300 dark:border-red-700"
                                  }
                                >
                                  {getDetailStatusLabel(item.detailStatus)}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-sm font-bold text-foreground">
                                {loadingPartItems[item.partId] ? (
                                  <span className="text-xs text-muted-foreground">Đang tải...</span>
                                ) : (
                                  <Badge variant="secondary">
                                    {partItems.reduce((sum, pi) => sum + (pi.quantity || 0), 0)} bộ
                                  </Badge>
                                )}
                              </td>
                              <td className="py-4 px-6 text-sm font-bold text-foreground">{item.totalQuantity}</td>
                              <td className="py-4 px-6"></td>
                            </tr>
                            {/* Part Items Rows (Expanded) */}
                            {isExpanded && partItems.map((partItem, pIdx) => (
                              <tr
                                key={`${item.partId}-${partItem.id || pIdx}`}
                                className="bg-muted/30 border-b border-border/50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <td className="py-3 px-6"></td>
                                <td className="py-3 px-6 pl-12">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">└─</span>
                                      <span className="text-xs text-muted-foreground">Số serial:</span>
                                    </div>
                                    <div className="pl-6">
                                      <span className="text-xs font-bold text-primary">{partItem.serialNumber || partItem.id || "N/A"}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-6 text-xs">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-muted-foreground">{partItem.part?.name || item.name}</span>
                                    {partItem.serialNumber && (
                                      <span className="text-xs text-primary font-medium">Serial: {partItem.serialNumber}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-6 text-xs text-muted-foreground">
                                  {partItem.part?.partType?.name || partItem.part?.partType || item.partType || "N/A"}
                                </td>
                                <td className="py-3 px-6">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      partItem.part?.status === "ACTIVE"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-300 dark:border-green-700"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-300 dark:border-gray-700"
                                    }`}
                                  >
                                    {getPartStatusLabel(partItem.part?.status)}
                                  </Badge>
                                </td>
                                <td className="py-3 px-6">
                                  {/* Để trống - partItem không có trạng thái kho */}
                                </td>
                                <td className="py-3 px-6 text-xs font-medium">
                                  <Badge variant="secondary" className="text-xs">
                                    {partItem.quantity || 0} bộ
                                  </Badge>
                                </td>
                                <td className="py-3 px-6 text-xs text-muted-foreground">
                                  {/* Để trống - partItem không có số lượng xuất */}
                                </td>
                                <td className="py-3 px-6">
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
                                </td>
                              </tr>
                            ))}
                          </>
                        );
                      })
                    )}
                  </tbody>
                  {/* Summary Footer */}
                  <tfoot className="bg-muted/50 border-t-2 border-border">
                    <tr>
                      <td colSpan={9} className="py-4 px-6 text-sm font-bold text-foreground">
                        Tổng số phụ tùng: <span className="text-foreground">{totals.totalRows}</span>
                        {selectedParts.size > 0 && (
                          <span className="ml-4 text-primary">• Đã chọn: {selectedParts.size} phụ tùng</span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="log" className="mt-4">
            <div className="bg-card rounded-xl border border-border shadow-md p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <p className="text-lg font-semibold text-foreground">Nhật ký & Số lần xuất</p>
                <p className="text-sm text-muted-foreground">Chức năng này sẽ được cập nhật sớm</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

