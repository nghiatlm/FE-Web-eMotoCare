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

  // Navigate to detail page
  const handleViewDetail = (partType) => {
    navigate(`/admin/service-packages/part-type/${partType.id}`);
  };

  // Calculate STT
  const getStt = (index) => {
    return (page - 1) * pageSize + index + 1;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Quản lý gói dịch vụ</h1>
          </div>
          <p className="text-muted-foreground">Quản lý loại phụ tùng và gói dịch vụ</p>
        </div>

        <div className="mb-6 p-4 bg-card rounded-lg border border-border">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm loại phụ tùng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Part Types Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách loại phụ tùng</CardTitle>
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
                      <TableRow>
                        <TableHead className="w-20">STT</TableHead>
                        <TableHead>Mã</TableHead>
                        <TableHead>Tên loại phụ tùng</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartTypes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Không có dữ liệu
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPartTypes.map((partType, index) => (
                          <TableRow key={partType.id}>
                            <TableCell>{getStt(index)}</TableCell>
                            <TableCell className="font-mono text-sm">{partType.id}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{partType.name}</p>
                                {partType.description && (
                                  <p className="text-sm text-muted-foreground">{partType.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                Hoạt động
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
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

                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPage(pageNum)}
                              isActive={page === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
