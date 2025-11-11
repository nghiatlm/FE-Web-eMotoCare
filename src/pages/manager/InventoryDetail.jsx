import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Hash, Package, MapPin, User2, Phone } from "lucide-react";

// Temporary mock fetch by id
const mockInventoryById = (id) => {
  return {
    id,
    partCode: id,
    partName: "Pin axit-chì",
    totalQty: 2,
    description: "Dòng xe Impes, Ludo, Klara S, Klara S1",
    warehouse: "CN B (8)\nQL kho: Nguyễn Văn\n090x xxx xxx",
    serials: [
      { id: "PIN-2025-L01-000123", qty: 1, warehouse: "CN B (8)\nQL kho: Nguyễn Văn\n090x xxx xxx" },
      { id: "PIN-2025-L01-000124", qty: 1, warehouse: "CN C (9)\nQL kho: Nguyễn Văn\n090x xxx xxx" },
    ],
  };
};

export default function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = useMemo(() => mockInventoryById(decodeURIComponent(id)), [id]);

  const [w1, w2, w3] = String(data.warehouse || "").split("\n");

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Chi tiết phụ tùng</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    <span>Mã phụ tùng</span>
                  </div>
                  <p className="font-medium text-foreground">{data.partCode}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>Tên phụ tùng</span>
                  </div>
                  <p className="font-medium text-foreground">{data.partName}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Mô tả</span>
                </div>
                <p className="text-sm bg-muted/50 p-3 rounded-md">{data.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tồn kho</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-sm text-muted-foreground">Số lượng tồn kho</span>
                <div className="mt-1">
                  <Badge variant="secondary" className="text-base px-2 py-1">{data.totalQty}</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{w1}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User2 className="h-4 w-4 text-muted-foreground" />
                  <span>{w2}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{w3}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Danh sách serial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-5 py-3 w-16">STT</th>
                    <th className="text-left px-5 py-3">Mã serial</th>
                    <th className="text-left px-5 py-3">Số lượng</th>
                    <th className="text-left px-5 py-3 min-w-[260px]">Kho</th>
                  </tr>
                </thead>
                <tbody>
                  {data.serials.map((s, i) => {
                    const [l1, l2, l3] = String(s.warehouse || "").split("\n");
                    return (
                      <tr key={s.id} className="border-t border-border/60">
                        <td className="px-5 py-3">{i + 1}</td>
                        <td className="px-5 py-3 text-primary font-medium">{s.id}</td>
                        <td className="px-5 py-3">{s.qty}</td>
                        <td className="px-5 py-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground"/><span>{l1}</span></div>
                            <div className="flex items-center gap-2"><User2 className="h-4 w-4 text-muted-foreground"/><span>{l2}</span></div>
                            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/><span>{l3}</span></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


