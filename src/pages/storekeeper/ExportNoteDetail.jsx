import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Check, Building2, User, DollarSign, Calendar, FileText, Package, Tag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getExportNoteById, updateExportNote } from "@/api/exportNotesApi";
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
  const [serialsByPartId, setSerialsByPartId] = useState({});
  const [loadingSerials, setLoadingSerials] = useState(false);

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

  useEffect(() => {
    const fetchSerialNumbers = async () => {
      if (!exportNote?.exportNoteDetails?.length) return;

      const serviceCenterId = exportNote.serviceCenter?.id;
      const partIds = Array.from(
        new Set(
          exportNote.exportNoteDetails
            .map((detail) => detail.proposedReplacePartId || detail.proposedReplacePart?.id)
            .filter(Boolean)
        )
      );

      if (partIds.length === 0) return;

      try {
        setLoadingSerials(true);
        const serialEntries = await Promise.all(
          partIds.map(async (partId) => {
            try {
              const response = await getPartItems({
                partId,
                serviceCenterId,
                status: "IN_STOCK",
                pageSize: 50
              });

              if (response.success && response.data?.rowDatas) {
                const serials = response.data.rowDatas
                  .map((item) => item.serialNumber)
                  .filter(Boolean);
                return [partId, serials];
              }
            } catch (error) {
              console.error(`Error fetching serials for part ${partId}:`, error);
            }
            return [partId, []];
          })
        );
        setSerialsByPartId(Object.fromEntries(serialEntries));
      } finally {
        setLoadingSerials(false);
      }
    };

    fetchSerialNumbers();
  }, [exportNote]);

  const exportDetails = exportNote?.exportNoteDetails || [];

  const displayItems = exportDetails.map((detail) => {
    const part = detail.proposedReplacePart || detail.partItem?.part;
    const code = part?.code || "UNKNOWN";
    const exportQty = detail.quantity ?? 0;
    const status = part?.status === "ACTIVE" ? "Vẫn còn" : "Hết hàng";
    const partId = detail.proposedReplacePartId || part?.id;
    const fetchedSerials = partId ? serialsByPartId[partId] || [] : [];
    const serialNumbers = detail.partItem?.serialNumber
      ? [detail.partItem.serialNumber]
      : fetchedSerials;
    const selectedSerial = serialNumbers.length > 0 ? serialNumbers[0] : null;
    
    return {
      id: detail.id,
      code,
      name: part?.name || "N/A",
      status,
      quantity: exportQty,
      serialNumber: selectedSerial
    };
  });

  
  const totals = {
    totalRows: displayItems.length
  };
  
  const togglePartSelection = (itemId) => {
    setSelectedParts(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
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
      
      const updateData = {
        code: exportNote.code,
        exportDate: exportNote.exportDate || new Date().toISOString(),
        type: exportNote.type,
        exportTo: exportNote.exportTo || "",
        totalQuantity: exportNote.totalQuantity || 0,
        totalValue: exportNote.totalValue || 0,
        note: exportNote.note || "",
        exportById: exportNote.exportBy?.id || "93eae610-2ea0-4e9e-89b5-cb20e3f22811",
        serviceCenterId: exportNote.serviceCenter?.id || "a805546d-b31d-11f0-9e95-c4efbb30f085",
        exportNoteStatus: "COMPLETED"
      };
        console.log(updateData);
      const response = await updateExportNote(id, updateData);
      console.log(response);
      if (response.success || response.statusCode === 200) {
        toast({
          title: "Thành công",
          description: "Xuất kho thành công!",
        });
        
        const noteRes = await getExportNoteById(id);

        if (noteRes.success && noteRes.data) {
          setExportNote(noteRes.data);
        }

        if (window.refreshExportNotes) {
          window.refreshExportNotes();
        }
      } else {
        throw new Error(response.message || "Cập nhật thất bại");
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
            <Button 
              className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleExportWarehouse}
              disabled={exporting || (exportNote?.exportNoteStatus || exportNote?.status) === "COMPLETED"}
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
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider w-12">
                        <Checkbox
                          checked={selectedParts.size === totals.totalRows && totals.totalRows > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedParts(new Set(displayItems.map(item => item.id)));
                            } else {
                              setSelectedParts(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Mã</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Tên phụ tùng</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Trạng thái</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Số lượng xuất</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Batch/Serial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 px-6 text-center text-sm text-muted-foreground">
                          Không có phụ tùng nào cần xuất.
                        </td>
                      </tr>
                    ) : (
                      displayItems.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`border-b border-border transition-all duration-200 ${
                            idx % 2 === 0
                              ? "bg-gradient-to-r from-white to-rose-50/60 dark:from-card dark:to-red-950/10"
                              : "bg-white dark:bg-card"
                          } hover:bg-rose-50/80`}
                        >
                          <td className="py-4 px-6">
                            <Checkbox
                              checked={selectedParts.has(item.id)}
                              onCheckedChange={() => togglePartSelection(item.id)}
                            />
                          </td>
                          <td className="py-4 px-6 text-sm font-bold text-primary">{item.code}</td>
                          <td className="py-4 px-6 text-sm font-medium text-foreground">{item.name}</td>
                          <td className="py-4 px-6">
                            <Badge
                              variant="secondary"
                              className={
                                item.status === "Vẫn còn"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-300 dark:border-green-700"
                                  : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-300 dark:border-orange-700"
                              }
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-sm font-bold text-foreground">{item.quantity}</td>
                          <td className="py-4 px-6">
                            {loadingSerials ? (
                              <span className="text-xs text-muted-foreground">Đang tải serial...</span>
                            ) : item.serialNumber ? (
                              <Badge variant="secondary" className="bg-muted text-foreground border-border">
                                {item.serialNumber}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">Chưa có serial khả dụng</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* Summary Footer */}
                  <tfoot className="bg-muted/50 border-t-2 border-border">
                    <tr>
                      <td colSpan={6} className="py-4 px-6 text-sm font-bold text-foreground">
                        Tổng số dòng: <span className="text-foreground">{totals.totalRows}</span>
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

