import { useState, useMemo, useEffect } from "react";
import { Pencil, Ban, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getUsers } from "@/api/usersApi";
import { updateUserStatus } from "@/api/usersApi";
import { useToast } from "@/hooks/use-toast";

export function UserTable({ searchQuery = "", nameFilter = "", roleFilter = "" }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState(null);
    const { toast } = useToast();

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
    
    // Expose functions to parent component
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
        switch (role.toLowerCase()) {
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground text-sm">Loading users...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 mb-2">Error loading users</p>
                    <p className="text-muted-foreground text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (<div>
      <p className="text-sm text-muted-foreground mb-4">
        {hasActiveFilters 
          ? `Showing ${filteredUsers.length} of ${users.length} filtered users`
          : `Showing ${users.length} of ${total} total users`
        }
      </p>
      
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Avatar</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Phone Number</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Email</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Full Name</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Role</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 px-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground text-sm">No users found</p>
                    <p className="text-xs text-muted-foreground">Try adjusting your search or filter criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (<tr key={user.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${index % 2 === 0 ? "bg-card" : "bg-muted/10"}`}>
                <td className="py-4 px-6">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.fullName}/>
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                </td>
                <td className="py-4 px-6 text-sm text-foreground">{user.phoneNumber}</td>
                <td className="py-4 px-6 text-sm text-muted-foreground">{user.email}</td>
                <td className="py-4 px-6 text-sm font-medium text-foreground">{user.fullName}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        if (window.openEditUserDialog) {
                          window.openEditUserDialog(user);
                        }
                      }}
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
                            await updateUserStatus(user.id, "IN_ACTIVE");
                            if (window.updateUserInTable) {
                              window.updateUserInTable({ ...user, status: "blocked" });
                            }
                            toast({
                              title: "User blocked",
                              description: `${user.fullName} has been blocked`,
                              className: "bg-amber-50 border-amber-400 text-amber-900",
                            });
                          } catch (e) {
                            toast({
                              title: "Block failed",
                              description: e?.message || "Cannot block user",
                              variant: "destructive",
                              className: "bg-red-50 border-red-400 text-red-900",
                            });
                          }
                        }}
                        title="Block User"
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
                            await updateUserStatus(user.id, "ACTIVE");
                            if (window.updateUserInTable) {
                              window.updateUserInTable({ ...user, status: "active" });
                            }
                            toast({
                              title: "User unblocked",
                              description: `${user.fullName} is active again`,
                              className: "bg-green-50 border-green-400 text-green-900",
                            });
                          } catch (e) {
                            toast({
                              title: "Unblock failed",
                              description: e?.message || "Cannot unblock user",
                              variant: "destructive",
                              className: "bg-red-50 border-red-400 text-red-900",
                            });
                          }
                        }}
                        title="Unblock User"
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
      {total > pageSize && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1).map(pageNum => (
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
                  onClick={() => setPage(prev => Math.min(Math.ceil(total / pageSize), prev + 1))}
                  className={page >= Math.ceil(total / pageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>);
}
