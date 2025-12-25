import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserTable } from "@/components/UserTable";
import { EditUserForm } from "@/components/EditUserForm";

export default function UserManagement() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        window.openEditUserDialog = (user) => {
            setSelectedUser(user);
            setIsEditUserOpen(true);
        };
    }, []);

    return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50">
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">Quản lý tài khoản</h1>
          <p className="mt-2 text-sm sm:text-base md:text-lg font-medium text-slate-700">Theo dõi và quản lý tài khoản người dùng trong hệ thống</p>
          <div className="mt-3 h-1.5 w-28 rounded-full bg-red-500 shadow-[0_4px_16px_-6px_rgba(239,68,68,0.65)]"/>
        </div>

        <div className="mb-6 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="relative flex-1 w-full sm:min-w-[200px] sm:max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
              <Input 
                placeholder="Tìm kiếm người dùng" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70 text-sm sm:text-base"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[140px] md:w-[160px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Lọc theo vai trò"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="manager">Quản lý</SelectItem>
                <SelectItem value="staff">Nhân viên dịch vụ</SelectItem>
                <SelectItem value="technician">Nhân viên kỹ thuật</SelectItem>
                <SelectItem value="storekeeper">Thủ kho</SelectItem>
                <SelectItem value="customer">Khách hàng</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[130px] md:w-[150px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Lọc theo trạng thái"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                <SelectItem value="IN_ACTIVE">Đã khóa</SelectItem>
              </SelectContent>
            </Select>

            {(roleFilter !== "all" || statusFilter !== "all" || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRoleFilter("all");
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
                className="border-transparent text-slate-600 hover:text-red-600 hover:bg-red-50 w-full sm:w-auto"
              >
                Xóa bộ lọc
              </Button>
            )}

            <Button 
              className="gap-2 bg-red-600 hover:bg-red-700 shadow-sm w-full sm:w-auto"
              onClick={() => navigate("/admin/users/create")}
            >
              <Plus className="h-4 w-4"/>
              <span className="hidden sm:inline">Thêm người dùng mới</span>
              <span className="sm:hidden">Thêm mới</span>
            </Button>
          </div>
        </div>

        <UserTable 
          searchQuery={searchQuery}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
        />

        <EditUserForm 
          open={isEditUserOpen}
          onOpenChange={setIsEditUserOpen}
          user={selectedUser}
          onUserUpdated={() => {
          }}
        />
      </div>
    </div>);
}
