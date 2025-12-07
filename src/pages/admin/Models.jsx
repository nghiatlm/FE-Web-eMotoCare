import { useState } from "react";
import { Search, Plus, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ModelsTable from "@/components/ModelsTable";

export default function Models() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-[95%] mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Quản lý model xe</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi và quản lý các model xe trong hệ thống</p>
          <div className="mt-3 h-[2px] w-24 rounded-full bg-red-500/70"/>
        </div>

        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm model"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70"
              />
            </div>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Ngưng hoạt động</SelectItem>
                <SelectItem value="PENDING">Chờ duyệt</SelectItem>
              </SelectContent>
            </Select>

            {(status || search) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus("");
                  setSearch("");
                }}
                className="border-transparent text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                Xóa lọc
              </Button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <Button className="gap-2 bg-red-600 hover:bg-red-700 shadow-sm">
                <Plus className="h-4 w-4" />
                Thêm model
              </Button>
            </div>
          </div>
        </div>

        <ModelsTable search={search} status={status} />
      </div>
    </div>
  );
}
