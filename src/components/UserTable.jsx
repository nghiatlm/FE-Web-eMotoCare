import { useState, useMemo, useEffect } from "react";
import { Pencil, Ban, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mockUsers = [
    { id: "1", avatar: "", phoneNumber: "0376212391", email: "nguyen@gmail.com", fullName: "Alex Nguyen", role: "Customer", status: "active" },
    { id: "2", avatar: "", phoneNumber: "0376 212 3911", email: "johnson@gmail.com", fullName: "Sarah Johnson", role: "Customer", status: "blocked" },
    { id: "3", avatar: "", phoneNumber: "0376 212 3912", email: "smith@gmail.com", fullName: "John Smith", role: "Customer", status: "active" },
    { id: "4", avatar: "", phoneNumber: "0376 212 3912", email: "chen@gmail.com", fullName: "Mike Chen", role: "Customer", status: "active" },
    { id: "5", avatar: "", phoneNumber: "0376 212 3912", email: "davis@gmail.com", fullName: "John Smith", role: "Customer", status: "active" },
    { id: "6", avatar: "", phoneNumber: "0376 212 3912", email: "wilson@gmail.com", fullName: "Emily Davis", role: "Customer", status: "active" },
    { id: "7", avatar: "", phoneNumber: "0376 212 3912", email: "tran@gmail.com", fullName: "John Smith", role: "Staff-technical", status: "active" },
    { id: "8", avatar: "", phoneNumber: "0376 212 3912", email: "pham@gmail.com", fullName: "David Wilson", role: "Admin", status: "active" },
    { id: "9", avatar: "", phoneNumber: "0376 212 3912", email: "le@gmail.com", fullName: "Daniel Dang", role: "Manager", status: "active" },
];

export function UserTable({ searchQuery = "", nameFilter = "", roleFilter = "" }) {
    const [users, setUsers] = useState(mockUsers);
    
    // Function to add new user (can be called from parent)
    const addUser = (newUser) => {
        setUsers(prevUsers => [newUser, ...prevUsers]);
    };
    
    // Function to update user (can be called from parent)
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
    }, []);
    
    // Filter users based on search and filter criteria
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // Search filter - search in name, email, phone, and id
            const matchesSearch = !searchQuery || 
                user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.phoneNumber.includes(searchQuery) ||
                user.id.includes(searchQuery);
            
            // Name filter (A-M, N-Z)
            const matchesNameFilter = !nameFilter || nameFilter === "all" ||
                (nameFilter === "a-m" && user.fullName.charAt(0).toLowerCase() >= 'a' && user.fullName.charAt(0).toLowerCase() <= 'm') ||
                (nameFilter === "n-z" && user.fullName.charAt(0).toLowerCase() >= 'n' && user.fullName.charAt(0).toLowerCase() <= 'z');
            
            // Role filter
            const matchesRoleFilter = !roleFilter || roleFilter === "all" ||
                (roleFilter === "admin" && user.role.toLowerCase() === "admin") ||
                (roleFilter === "manager" && user.role.toLowerCase() === "manager") ||
                (roleFilter === "staff" && user.role.toLowerCase() === "staff-technical") ||
                (roleFilter === "customer" && user.role.toLowerCase() === "customer");
            
            return matchesSearch && matchesNameFilter && matchesRoleFilter;
        });
    }, [users, searchQuery, nameFilter, roleFilter]);
    
    // Check if any filters are active
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
                return "bg-primary/10 text-primary";
            case "manager":
                return "bg-accent text-accent-foreground";
            case "staff-technical":
                return "bg-muted text-muted-foreground";
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
    return (<div>
      {/* Results Count */}
      <p className="text-sm text-muted-foreground mb-4">
        {hasActiveFilters 
          ? `Showing ${filteredUsers.length} of ${users.length} users`
          : `Showing ${users.length} users`
        }
      </p>
      
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">ID</th>
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
                <td className="py-4 px-6 text-sm font-medium text-muted-foreground">{user.id}</td>
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
                        onClick={() => {
                          if (window.updateUserInTable) {
                            window.updateUserInTable({...user, status: "blocked"});
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
                        onClick={() => {
                          if (window.updateUserInTable) {
                            window.updateUserInTable({...user, status: "active"});
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
    </div>);
}
