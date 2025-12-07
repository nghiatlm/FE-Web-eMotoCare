import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Ban, Unlock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPhoneNumber } from "@/utils/formatters";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getUsers, updateUserStatus, deleteUser, updateUser as updateUserApi } from "@/api/usersApi";
import { toast } from "react-toastify";

export function UserTable({ searchQuery = "", nameFilter = "", roleFilter = "" }) {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState(null);

    const transformRoleName = (roleName) => {
        switch (roleName) {
            case "ROLE_ADMIN":
                return "Admin";
            case "ROLE_MANAGER":
                return "Manager";
            case "ROLE_STAFF":
                return "Staff";
            case "ROLE_TECHNICIAN":
                return "Technician";
            case "ROLE_CUSTOMER":
                return "Customer";
            case "ROLE_STOREKEEPER":
                return "Storekeeper";
            default:
                return roleName;
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getUsers(page, pageSize);
            
            if (response.success && response.data) {
                const transformedUsers = response.data.rowDatas.map(user => ({
                    id: user.id,
                    phoneNumber: user.phone || "N/A",
                    email: user.email || "N/A",
                    fullName: user.customer 
                        ? `${user.customer.firstName} ${user.customer.lastName}`
                        : user.staff
                        ? `${user.staff.firstName} ${user.staff.lastName}`
                        : "N/A",
                    role: transformRoleName(user.roleName),
                    status: user.stattus === "ACTIVE" ? "active" : "blocked",
                    avatar: user.customer?.avatarUrl || user.staff?.avatarUrl || "",
                    rawData: user
                }));
                
                setUsers(transformedUsers);
                setTotal(response.data.total || 0);
            }
        } catch (err) {
            console.error("Error fetching users:", err);
            setError(err.message || "Failed to fetch users");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, pageSize]);
    
    const addUser = (newUser) => {
        setUsers(prevUsers => [newUser, ...prevUsers]);
    };
    
    const updateUser = (updatedUser) => {
        setUsers(prevUsers => 
            prevUsers.map(user => 
                user.id === updatedUser.id ? updatedUser : user
            )
        );
    };
    
    useEffect(() => {
        window.addUserToTable = addUser;
        window.updateUserInTable = updateUser;
        window.refreshUserList = fetchUsers;
    }, [fetchUsers]);
    
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = !searchQuery || 
                user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.phoneNumber.includes(searchQuery) ||
                user.id.includes(searchQuery);
            
            const matchesNameFilter = !nameFilter || nameFilter === "all" ||
                (nameFilter === "a-m" && user.fullName.charAt(0).toLowerCase() >= 'a' && user.fullName.charAt(0).toLowerCase() <= 'm') ||
                (nameFilter === "n-z" && user.fullName.charAt(0).toLowerCase() >= 'n' && user.fullName.charAt(0).toLowerCase() <= 'z');
            
            const matchesRoleFilter = !roleFilter || roleFilter === "all" ||
                (roleFilter === "admin" && user.role.toLowerCase() === "admin") ||
                (roleFilter === "manager" && user.role.toLowerCase() === "manager") ||
                (roleFilter === "staff" && user.role.toLowerCase() === "staff") ||
                (roleFilter === "technician" && user.role.toLowerCase() === "technician") ||
                (roleFilter === "customer" && user.role.toLowerCase() === "customer") ||
                (roleFilter === "storekeeper" && user.role.toLowerCase() === "storekeeper");  
            
            return matchesSearch && matchesNameFilter && matchesRoleFilter;
        });
    }, [users, searchQuery, nameFilter, roleFilter]);
    
    const hasActiveFilters = searchQuery || (nameFilter && nameFilter !== "all") || (roleFilter && roleFilter !== "all");
    const getInitials = (name) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };
    const getRoleBadgeColor = (role) => {
        switch ((role || "").toLowerCase()) {
            case "admin":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
            case "manager":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
            case "staff":
                return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
            case "technician":
                return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300";
            case "customer":
                return "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300";
            case "storekeeper":
                return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300";
            default:
                return "bg-secondary text-secondary-foreground";
        }
    };

    const getRoleLabelVi = (role) => {
        switch ((role || "").toLowerCase()) {
            case "admin":
                return "Quản trị viên";
            case "manager":
                return "Quản lý";
            case "staff":
                return "Nhân viên dịch vụ";
            case "technician":
                return "Kỹ thuật viên";
            case "customer":
                return "Khách hàng";
            case "storekeeper":
                return "Thủ kho";
            default:
                return role || "Không xác định";
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
            case "blocked":
                return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
        }
    };
    const getAvatarColorClasses = (index) => {
        const palette = [
            "bg-red-50 text-red-700",
            "bg-amber-50 text-amber-700",
            "bg-emerald-50 text-emerald-700",
            "bg-sky-50 text-sky-700",
            "bg-violet-50 text-violet-700",
        ];
        return palette[index % palette.length];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground text-sm">Đang tải danh sách người dùng...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 mb-2">Lỗi khi tải danh sách người dùng</p>
                    <p className="text-muted-foreground text-sm">{error}</p>
                </div>
            </div>
        );
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (<div>
      <p className="text-sm text-slate-500 mb-4">
        {hasActiveFilters 
          ? `Hiển thị ${filteredUsers.length} người dùng (đã lọc từ ${total} người dùng)`
          : `Hiển thị ${users.length} / ${total} người dùng`
        }
      </p>
      
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header table (không scroll) */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: '60px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '120px' }} />
            </colgroup>
            <thead>
              <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">STT</th>
                <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">Ảnh đại diện</th>
                <th className="text-left py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Số điện thoại</th>
                <th className="text-left py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Email</th>
                <th className="text-left py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Họ tên</th>
                <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Vai trò</th>
                <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Trạng thái</th>
                <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Thao tác</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Body table (scroll riêng, thanh scroll dừng dưới header) */}
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: '60px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '120px' }} />
            </colgroup>
            <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 px-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground text-sm">Không tìm thấy người dùng</p>
                    <p className="text-xs text-muted-foreground">Hãy thay đổi từ khóa hoặc bộ lọc</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (<tr key={user.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                <td className="py-4 px-4 text-sm text-slate-600 text-center">{(page - 1) * pageSize + index + 1}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center">
                  <Avatar className="h-10 w-10 bg-white border border-slate-100 shadow-sm">
                    <AvatarImage src={user.avatar} alt={user.fullName}/>
                    <AvatarFallback className={`font-medium ${getAvatarColorClasses(index)}`}>
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-foreground">{formatPhoneNumber(user.phoneNumber)}</td>
                <td className="py-4 px-6 text-sm text-muted-foreground">{user.email}</td>
                <td className="py-4 px-6 text-sm font-medium text-foreground">{user.fullName}</td>
                <td className="py-4 px-6">
                  <div className="flex justify-center">
                    <span className={`inline-flex px-4 py-1 rounded-full text-xs font-medium justify-center ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabelVi(user.role)}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex justify-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-blue-600 hover:text-blue-700"
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4"/>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        if (window.openEditUserDialog) {
                          window.openEditUserDialog(user);
                        }
                      }}
                      title="Chỉnh sửa"
                    >
                      <Pencil className="h-4 w-4"/>
                    </Button>
                    {user.status === "active" ? (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={async () => {
                          try {
                            // Call DELETE API to block user (set inactive)
                            await deleteUser(user.id);
                            
                            // Update state directly without refreshing
                            setUsers(prevUsers =>
                              prevUsers.map(u =>
                                u.id === user.id
                                  ? { ...u, status: "blocked", rawData: { ...u.rawData, stattus: "IN_ACTIVE" } }
                                  : u
                              )
                            );
                            
                            toast.success(`Đã chặn người dùng: ${user.fullName} đã bị chặn (inactive)`, {
                              position: "top-right",
                              autoClose: 4000,
                            });
                          } catch (e) {
                            toast.error(`Chặn không thành công: ${e?.message || "Không thể chặn người dùng"}`, {
                              position: "top-right",
                              autoClose: 5000,
                            });
                          }
                        }}
                        title="Chặn người dùng"
                      >
                        <Ban className="h-4 w-4"/>
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-green-600 hover:text-green-700"
                        onClick={async () => {
                          try {
                            const roleName = user.rawData?.roleName;
                            
                            if (!roleName) {
                              toast.error("Lỗi: Không tìm thấy vai trò của người dùng", {
                                position: "top-right",
                                autoClose: 4000,
                              });
                              return;
                            }
                            
                            await updateUserApi(user.id, {
                              roleName: roleName,
                              status: "ACTIVE"
                            });
                            
                            setUsers(prevUsers =>
                              prevUsers.map(u =>
                                u.id === user.id
                                  ? { ...u, status: "active", rawData: { ...u.rawData, stattus: "ACTIVE" } }
                                  : u
                              )
                            );
                            
                            toast.success(`Đã mở khóa người dùng: ${user.fullName} đã được kích hoạt lại`, {
                              position: "top-right",
                              autoClose: 4000,
                            });
                          } catch (e) {
                            toast.error(`Mở khóa không thành công: ${e?.response?.data?.message || e?.message || "Không thể mở khóa người dùng"}`, {
                              position: "top-right",
                              autoClose: 5000,
                            });
                          }
                        }}
                        title="Mở khóa người dùng"
                      >
                        <Unlock className="h-4 w-4"/>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Pagination */}
      {total > 0 && (
      <div className="mt-6 flex items-center justify-center text-sm text-slate-500">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className={`cursor-pointer rounded-full px-3 ${page === 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-100"}`}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
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
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  className={`cursor-pointer rounded-full px-3 ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-100"}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>);
}
