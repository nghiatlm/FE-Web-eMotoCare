import { useEffect, useState, useMemo } from "react";
import { Search, Package, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-semibold text-slate-900">Quản lý gói dịch vụ</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Quản lý loại phụ tùng và gói dịch vụ</p>
          <div className="mt-3 h-[2px] w-24 rounded-full bg-red-500/70"/>
        </div>

        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-[350px]">
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

        {/* Part Types Table */}
        <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Danh sách loại phụ tùng</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                        <TableHead className="w-20 text-center text-xs font-semibold tracking-wide text-red-700 uppercase">
                          STT
                        </TableHead>
                        {/* <TableHead>Mã</TableHead> */}
                        <TableHead className="text-left text-xs font-semibold tracking-wide text-red-700 uppercase">
                          Tên loại phụ tùng
                        </TableHead>
                        <TableHead className="text-left text-xs font-semibold tracking-wide text-red-700 uppercase">
                          Mô tả
                        </TableHead>
                        <TableHead className="text-center text-xs font-semibold tracking-wide text-red-700 uppercase">
                          Trạng thái
                        </TableHead>
                        <TableHead className="text-center text-xs font-semibold tracking-wide text-red-700 uppercase w-32">
                          Thao tác
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartTypes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Không có dữ liệu
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPartTypes.map((partType, index) => (
                          <TableRow 
                            key={partType.id}
                            className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                          >
                            <TableCell className="text-center text-sm text-slate-600">
                              {getStt(index)}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-foreground">
                              {partType.name}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {partType.description || "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 px-4 py-1 rounded-full text-xs font-medium">
                                Hoạt động
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetail(partType)}
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Chi tiết
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {total > 0 && (
                  <div className="mt-6 flex items-center justify-center text-sm text-slate-500">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className={`cursor-pointer rounded-full px-3 ${page === 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-100"}`}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPage(pageNum)}
                              isActive={page === pageNum}
                              className={`cursor-pointer rounded-full px-3 py-1 text-sm ${
                                page === pageNum 
                                  ? "bg-red-100 text-red-700 font-medium" 
                                  : "hover:bg-slate-100"
                              }`}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className={`cursor-pointer rounded-full px-3 ${page === totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-100"}`}
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
