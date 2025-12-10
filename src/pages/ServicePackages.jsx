import { useEffect, useState, useMemo } from "react";
import { Search, Package, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPartTypes } from "@/api/partsApi";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ServicePackages() {
  const [search, setSearch] = useState("");
  const [partTypes, setPartTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch Part Types
  useEffect(() => {
    const fetchPartTypes = async () => {
      try {
        setLoading(true);
        const response = await getPartTypes(page, pageSize);
        
        if (response.success && response.data) {
          const types = response.data.rowDatas || response.data || [];
          const totalCount = response.data.total || types.length;
          
          setPartTypes(types);
          setTotal(totalCount);
        }
      } catch (error) {
        console.error("Error fetching part types:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách loại phụ tùng",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPartTypes();
  }, [page, pageSize, toast]);

  // Filter part types by search
  const filteredPartTypes = useMemo(() => {
    if (!search.trim()) return partTypes;
    
    const searchLower = search.toLowerCase();
    return partTypes.filter(type => 
      type.name?.toLowerCase().includes(searchLower) ||
      type.description?.toLowerCase().includes(searchLower) ||
      type.id?.toLowerCase().includes(searchLower)
    );
  }, [partTypes, search]);

  const handleViewDetail = (partType) => {
    navigate(`/admin/service-packages/part-type/${partType.id}`);
  };

  const getStt = (index) => {
    return (page - 1) * pageSize + index + 1;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50">
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-7 w-7 text-red-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Quản lý gói dịch vụ</h1>
          </div>
          <p className="mt-2 text-base md:text-lg font-medium text-slate-700">Quản lý loại phụ tùng và gói dịch vụ</p>
          <div className="mt-3 h-1.5 w-28 rounded-full bg-red-500 shadow-[0_4px_16px_-6px_rgba(239,68,68,0.65)]"/>
        </div>

        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px] md:min-w-[320px] md:max-w-[420px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm loại phụ tùng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70"
              />
            </div>
          </div>
        </div>

        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {filteredPartTypes.length === 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
                      Không có dữ liệu
                    </div>
                  ) : (
                    filteredPartTypes.map((partType, index) => (
                      <div
                        key={partType.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.12)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-slate-500">#{getStt(index)}</div>
                            <div className="text-base font-semibold text-slate-900">{partType.name}</div>
                            <div className="text-sm text-slate-700 line-clamp-2">
                              {partType.description || "—"}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-300 px-3 py-1 rounded-full text-xs font-semibold"
                          >
                            Hoạt động
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(partType)}
                            className="w-full justify-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Chi tiết
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col style={{ width: "70px" }} />
                        <col style={{ width: "260px" }} />
                        <col style={{ width: "360px" }} />
                        <col style={{ width: "140px" }} />
                        <col style={{ width: "140px" }} />
                      </colgroup>
                      <thead>
                        <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                          <th className="text-center py-4 px-4 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">
                            STT
                          </th>
                          <th className="text-left py-4 px-4 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">
                            Tên loại phụ tùng
                          </th>
                          <th className="text-left py-4 px-4 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">
                            Mô tả
                          </th>
                          <th className="text-center py-4 px-4 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">
                            Trạng thái
                          </th>
                          <th className="text-center py-4 px-4 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                    </table>
                  </div>

                  <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col style={{ width: "70px" }} />
                        <col style={{ width: "260px" }} />
                        <col style={{ width: "360px" }} />
                        <col style={{ width: "140px" }} />
                        <col style={{ width: "140px" }} />
                      </colgroup>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPartTypes.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-12 px-6 text-center text-sm text-slate-500">
                              Không có dữ liệu
                            </td>
                          </tr>
                        ) : (
                          filteredPartTypes.map((partType, index) => (
                            <tr
                              key={partType.id}
                              className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                                index % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                              }`}
                            >
                              <td className="py-4 px-4 text-center text-sm font-medium text-slate-600 align-top whitespace-nowrap">
                                {getStt(index)}
                              </td>
                              <td className="py-4 px-4 text-sm font-semibold text-slate-900 align-top whitespace-nowrap overflow-hidden text-ellipsis">
                                {partType.name}
                              </td>
                              <td className="py-4 px-4 text-sm text-slate-700 align-top line-clamp-2 max-w-[340px]">
                                {partType.description || "—"}
                              </td>
                              <td className="py-4 px-4 text-center align-top whitespace-nowrap">
                                <Badge
                                  variant="outline"
                                  className="bg-green-100 text-green-800 border-green-300 px-4 py-1 rounded-full text-xs font-semibold"
                                >
                                  Hoạt động
                                </Badge>
                              </td>
                              <td className="py-4 px-4 text-center align-top whitespace-nowrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetail(partType)}
                                  className="gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  Chi tiết
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {total > 0 && (
                  <div className="p-4 flex justify-center">
                    <Pagination>
                      <PaginationContent className="gap-1">
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className={`h-8 px-2.5 text-xs cursor-pointer rounded-full ${
                              page === 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-100"
                            }`}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPage(pageNum)}
                              isActive={page === pageNum}
                              className={`h-8 min-w-[32px] cursor-pointer rounded-full px-2.5 text-xs ${
                                page === pageNum
                                  ? "bg-red-100 text-red-700 font-semibold border border-red-200"
                                  : "hover:bg-slate-100"
                              }`}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className={`h-8 px-2.5 text-xs cursor-pointer rounded-full ${
                              page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-100"
                            }`}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
