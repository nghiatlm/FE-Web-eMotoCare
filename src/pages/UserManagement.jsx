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
    const [nameFilter, setNameFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Quản lý tài khoản</h1>
          <p className="mt-2 text-base md:text-lg font-medium text-slate-700">Theo dõi và quản lý tài khoản người dùng trong hệ thống</p>
          <div className="mt-3 h-1.5 w-28 rounded-full bg-red-500 shadow-[0_4px_16px_-6px_rgba(239,68,68,0.65)]"/>
        </div>

        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px] md:min-w-[320px] md:max-w-[420px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
              <Input 
                placeholder="Tìm kiếm người dùng" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70"
              />
            </div>
            
            <Select value={nameFilter} onValueChange={setNameFilter}>
              <SelectTrigger className="w-[150px] md:w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Tên"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="a-m">A - M</SelectItem>
                <SelectItem value="n-z">N - Z</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px] md:w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Vai trò"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="manager">Quản lý</SelectItem>
                <SelectItem value="staff">Nhân viên dịch vụ</SelectItem>
                <SelectItem value="technician">Nhân viên kỹ thuật</SelectItem>
                <SelectItem value="storekeeper">Thủ kho</SelectItem>
                <SelectItem value="customer">Khách hàng</SelectItem>
              </SelectContent>
            </Select>

            {(nameFilter || roleFilter || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNameFilter("");
                  setRoleFilter("");
                  setSearchQuery("");
                }}
                className="border-transparent text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                Xóa bộ lọc
              </Button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <Button 
                className="gap-2 bg-red-600 hover:bg-red-700 shadow-sm"
                onClick={() => navigate("/admin/users/create")}
              >
                <Plus className="h-4 w-4"/>
                Thêm người dùng mới
              </Button>
            </div>
          </div>
        </div>

        <UserTable 
          searchQuery={searchQuery}
          nameFilter={nameFilter}
          roleFilter={roleFilter}
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
