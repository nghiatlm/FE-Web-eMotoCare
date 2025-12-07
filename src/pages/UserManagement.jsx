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

    // Setup global functions for UserTable communication
    useEffect(() => {
        window.openEditUserDialog = (user) => {
            setSelectedUser(user);
            setIsEditUserOpen(true);
        };
    }, []);

    return (<div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-[95%] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Quản lý tài khoản</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi và quản lý tài khoản người dùng trong hệ thống</p>
          <div className="mt-3 h-[2px] w-24 rounded-full bg-red-500/70"/>
        </div>

        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-[340px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
              <Input 
                placeholder="Tìm kiếm người dùng" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70"
              />
            </div>
            
            <Select value={nameFilter} onValueChange={setNameFilter}>
              <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Tên"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="a-m">A - M</SelectItem>
                <SelectItem value="n-z">N - Z</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
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

            {(nameFilter || roleFilter || searchQuery) && (<Button variant="outline" size="sm" onClick={() => {
                  setNameFilter("");
                  setRoleFilter("");
                  setSearchQuery("");
              }} className="border-transparent text-slate-600 hover:text-red-600 hover:bg-red-50">
                Xóa bộ lọc
              </Button>)}

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

        {/* User Table */}
        <UserTable 
          searchQuery={searchQuery}
          nameFilter={nameFilter}
          roleFilter={roleFilter}
        />

        {/* Edit User Dialog */}
        <EditUserForm 
          open={isEditUserOpen}
          onOpenChange={setIsEditUserOpen}
          user={selectedUser}
          onUserUpdated={() => {
            // UserTable will handle the update
          }}
        />
      </div>
    </div>);
}
