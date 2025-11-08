import { useState, useEffect } from "react";
import { Search, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { UserTable } from "@/components/UserTable";
import { AddUserForm } from "@/components/AddUserForm";
import { EditUserForm } from "@/components/EditUserForm";
export default function UserManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [nameFilter, setNameFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Setup global functions for UserTable communication
    useEffect(() => {
        window.openEditUserDialog = (user) => {
            setSelectedUser(user);
            setIsEditUserOpen(true);
        };
    }, []);

    return (<div className="min-h-screen bg-background">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
          <p className="text-muted-foreground">User Management</p>
        </div>

        <div className="mb-6 p-4 bg-card rounded-lg border border-border">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input placeholder="Search user" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9"/>
            </div>
            
            <Select value={nameFilter} onValueChange={setNameFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Name"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Names</SelectItem>
                <SelectItem value="a-m">A - M</SelectItem>
                <SelectItem value="n-z">N - Z</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Role"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff-technical</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>

            {(nameFilter || roleFilter || searchQuery) && (<Button variant="ghost" size="sm" onClick={() => {
                  setNameFilter("");
                  setRoleFilter("");
                  setSearchQuery("");
              }} className="text-primary hover:text-primary/90">
                Clear Filters
              </Button>)}

            <div className="flex items-center gap-3 ml-auto">
              <Button 
                className="gap-2 bg-primary hover:bg-primary/90"
                onClick={() => setIsAddUserOpen(true)}
              >
                <Plus className="h-4 w-4"/>
                Add new user
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

        {/* Add User Dialog */}
        <AddUserForm 
          open={isAddUserOpen}
          onOpenChange={setIsAddUserOpen}
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
