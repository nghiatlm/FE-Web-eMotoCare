import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Tag,
  Package,
  Check,
  Calendar,
  Building2,
  User,
  DollarSign,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-toastify";
import { getImportNoteById } from "@/api/importNotesApi";
import { getPartItemById } from "@/api/partitemsApi";

const typeMap = {
  SUPPLIER: "Nhập từ nhà cung cấp",
  TRANSFER_IN: "Nhận điều chuyển",
  WARRANTY_RETURN: "Hoàn kho bảo hành"
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value || 0);

export default function ImportNoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [importNote, setImportNote] = useState(null);
  const [partItemsDetails, setPartItemsDetails] = useState({});
  const [loadingPartItems, setLoadingPartItems] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const response = await getImportNoteById(id);
        if (active) {
          if (response.success && response.data) {
            setImportNote(response.data);
          } else {
            setImportNote(null);
          }
        }
      } catch (error) {
        if (active) {
          setImportNote(null);
          toast.error(`Lỗi: ${error?.message || "Không thể tải chi tiết phiếu nhập"}`, {
            position: "top-right",
            autoClose: 4000,
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDetail();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const fetchPartItemsDetails = async () => {
      if (!importNote?.importNoteDetails?.length) return;

      const partItemIds = importNote.importNoteDetails
        .map(detail => detail.partItemId)
        .filter(Boolean);

      if (partItemIds.length === 0) return;

      try {
        setLoadingPartItems(true);
        const partItemsMap = {};

        await Promise.all(
          partItemIds.map(async (partItemId) => {
            try {
              const response = await getPartItemById(partItemId);
              const partItemData = response?.data || response;
              
              if (partItemData) {
                partItemsMap[partItemId] = partItemData;
              }
            } catch (error) {
              console.error(`Error fetching partItem ${partItemId}:`, error);
            }
          })
        );

        setPartItemsDetails(partItemsMap);
      } catch (error) {
        console.error("Error fetching partItems details:", error);
      } finally {
        setLoadingPartItems(false);
      }
    };

    fetchPartItemsDetails();
  }, [importNote]);

  const details = useMemo(() => importNote?.importNoteDetails || [], [importNote]);
  const totalQuantity = useMemo(() => {
    if (typeof importNote?.totalQuantity === "number") return importNote.totalQuantity;
    return details.reduce((sum, detail) => sum + (detail.quantity || 0), 0);
  }, [details, importNote]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!importNote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground mb-4">Không tìm thấy phiếu nhập</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>
    );
  }

  const status = importNote.importNoteStatus || importNote.status || "PENDING";
  const importDate = importNote.importDate
    ? new Date(importNote.importDate).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "N/A";

  const importerName = importNote.importBy
    ? `${importNote.importBy.firstName || ""} ${importNote.importBy.lastName || ""}`.trim() ||
      importNote.importBy.staffCode ||
      "—"
    : "—";

  const infoItems = [
    {
      icon: Tag,
      label: "Mã phiếu",
      value: importNote.code,
      valueClass: "text-lg"
    },
    {
      icon: Package,
      label: "Loại",
      value: (
        <Badge className="bg-red-600 text-white border-none shadow-sm px-4 py-1 rounded-full text-xs">
          {typeMap[importNote.type] || importNote.type || "N/A"}
        </Badge>
      )
    },
    {
      icon: Calendar,
      label: "Ngày nhập",
      value: importDate
    },
    {
      icon: User,
      label: "Người nhập",
      value: importerName,
      subText: importNote.importBy?.staffCode ? `Mã: ${importNote.importBy.staffCode}` : undefined
    },
    {
      icon: ClipboardList,
      label: "Tổng số lượng",
      value: totalQuantity
    },
    {
      icon: DollarSign,
      label: "Tổng giá trị",
      value: formatCurrency(importNote.totalAmout || importNote.totalAmount)
    },
    {
      icon: Building2,
      label: "Trung tâm dịch vụ",
      value: importNote.serviceCenter?.name || importNote.serviceCenter?.code || "—",
      subText: importNote.serviceCenter?.address
    },
    {
      icon: FileText,
      label: "Ghi chú",
      value: importNote.note || "—"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hover:bg-muted" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Danh sách Phiếu nhập kho / Chi tiết /{" "}
                <span className="text-red-600 dark:text-red-400">{importNote.code}</span>
              </h1>
            </div>
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
              Danh sách phụ tùng đã nhập
            </TabsTrigger>
            <TabsTrigger
              value="log"
              className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm font-semibold dark:data-[state=active]:bg-muted"
            >
              Nhật ký
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parts" className="mt-4">
            <div className="bg-card rounded-xl border border-border shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10 border-b-2 border-red-200/50 dark:border-red-800/30">
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">STT</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Hình ảnh</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Tên phụ tùng</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Serial/Batch</th>
                      <th className="text-right py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Số lượng</th>
                      <th className="text-right py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Đơn giá</th>
                      <th className="text-right py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                          Chưa có phụ tùng nào trong phiếu nhập
                        </td>
                      </tr>
                    ) : (
                      details.map((detail, idx) => {
                        const partItemDetail = detail.partItemId 
                          ? (partItemsDetails[detail.partItemId] || detail.partItem)
                          : detail.partItem;
                        
                        const part = partItemDetail?.part || detail.partItem?.part;
                        const code = part?.code || detail.partItem?.code || "—";
                        const name = part?.name || detail.partItem?.name || "N/A";
                        
                        const image = part?.image || null;
                        
                        const serial = partItemDetail?.serialNumber || detail.partItem?.serialNumber || detail.partItemId || "—";
                        
                        const qty = detail.quantity || 0;
                        const unitPrice = formatCurrency(detail.unitPrice || 0);
                        const total = formatCurrency(detail.totalPrice || (detail.unitPrice || 0) * qty);
                        return (
                          <tr
                            key={detail.id || `${code}-${idx}`}
                            className={`border-b border-border transition-all duration-200 ${
                              idx % 2 === 0
                                ? "bg-gradient-to-r from-white to-rose-50/60 dark:from-card dark:to-red-950/10"
                                : "bg-white dark:bg-card"
                            } hover:bg-rose-50/80`}
                          >
                            <td className="py-4 px-6 text-sm font-medium text-foreground">{idx + 1}</td>
                            <td className="py-4 px-6">
                              {loadingPartItems ? (
                                <div className="h-12 w-12 rounded-lg border border-dashed border-border/60 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                </div>
                              ) : image ? (
                                <img
                                  src={image}
                                  alt={name}
                                  className="h-12 w-12 rounded-lg object-cover border border-border/60"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg border border-dashed border-border/60 flex items-center justify-center text-xs text-muted-foreground">
                                  N/A
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6 text-sm text-foreground">{name}</td>
                            <td className="py-4 px-6 text-sm text-muted-foreground">{serial}</td>
                            <td className="py-4 px-6 text-sm font-semibold text-right text-foreground">{qty}</td>
                            <td className="py-4 px-6 text-sm text-right text-foreground">{unitPrice}</td>
                            <td className="py-4 px-6 text-sm font-semibold text-right text-foreground">{total}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {details.length > 0 && (
                    <tfoot className="bg-muted/50 border-t-2 border-border">
                      <tr>
                        <td colSpan={7} className="py-4 px-6 text-sm font-bold text-foreground">
                          Tổng số dòng: <span className="text-foreground">{details.length}</span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="log" className="mt-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Nhật ký nhập kho</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                        <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase w-12">STT</th>
                        <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">Mã phụ tùng</th>
                        <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Tên phụ tùng</th>
                        <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Serial</th>
                        <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Số lượng</th>
                        <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Đơn giá</th>
                        <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Thành tiền</th>
                        <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Ngày tạo</th>
                        <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Ngày cập nhật</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 px-6 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                <FileText className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                              <p className="text-sm text-muted-foreground">Chưa có nhật ký nhập kho</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        details.map((detail, idx) => {
                          const partItemDetail = detail.partItemId 
                            ? (partItemsDetails[detail.partItemId] || detail.partItem)
                            : detail.partItem;
                          
                          const part = partItemDetail?.part || detail.partItem?.part;
                          const code = part?.code || "N/A";
                          const name = part?.name || "N/A";
                          const serial = partItemDetail?.serialNumber || detail.partItem?.serialNumber || "—";
                          const partItemStatus = partItemDetail?.status || detail.partItem?.status || "N/A";
                          
                          const importDate = detail.createdAt
                            ? new Date(detail.createdAt).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : "N/A";
                          const updateDate = detail.updatedAt && detail.updatedAt !== detail.createdAt
                            ? new Date(detail.updatedAt).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : "—";

                          const getPartItemStatusLabel = (status) => {
                            const statusMap = {
                              "ACTIVE": "Khả dụng",
                              "IN_ACTIVE": "Không khả dụng",
                              "INACTIVE": "Không khả dụng",
                              "IN_STOCK": "Trong kho",
                              "INSTALLED": "Đã lắp đặt",
                              "MANUFACTURER_RECALL": "Thu hồi từ nhà sản xuất"
                            };
                            return statusMap[status] || status || "N/A";
                          };

                          const getPartItemStatusBadgeClass = (status) => {
                            const classMap = {
                              "ACTIVE": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-300 dark:border-green-700",
                              "IN_ACTIVE": "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-300 dark:border-gray-700",
                              "INACTIVE": "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-300 dark:border-gray-700",
                              "IN_STOCK": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-300 dark:border-blue-700",
                              "INSTALLED": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-300 dark:border-purple-700",
                              "MANUFACTURER_RECALL": "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-300 dark:border-red-700"
                            };
                            return classMap[status] || "bg-muted text-muted-foreground border-border";
                          };

                          return (
                            <tr
                              key={detail.id || idx}
                              className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                                idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                              }`}
                            >
                              <td className="py-4 px-4 text-center">
                                <span className="text-sm text-slate-600">{idx + 1}</span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="text-sm font-medium text-foreground">{code}</span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="text-sm text-foreground">{name}</span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="text-sm font-medium text-primary">{serial}</span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="text-sm text-foreground">{detail.quantity || 0}</span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="text-sm text-foreground">{detail.unitPrice ? formatCurrency(detail.unitPrice) : "—"}</span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="text-sm font-medium text-foreground">{detail.totalPrice ? formatCurrency(detail.totalPrice) : "—"}</span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="text-sm text-foreground">{importDate}</span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="text-sm text-foreground">{updateDate}</span>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}



