import { useState, useEffect } from "react";
import { User, Mail, Phone, Shield, Ban, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { updateUser } from "@/api/usersApi";

export function EditUserForm({ open, onOpenChange, user, onUserUpdated }) {
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    password: "",
    roleName: "",
    status: "ACTIVE"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  // Helper function to transform role name
  const transformRoleName = (roleName) => {
    switch (roleName) {
      case "ROLE_CUSTOMER":
        return "Customer";
      case "ROLE_STAFF":
        return "Staff-technical";
      case "ROLE_TECHNICIAN":
        return "Staff-technical";
      case "ROLE_ADMIN":
        return "Admin";
      default:
        return roleName;
    }
  };

  const transformRoleToApi = (role) => {
    switch (role) {
      case "Customer":
        return "ROLE_CUSTOMER";
      case "Staff-technical":
        return "ROLE_STAFF";
      case "Technician":
        return "ROLE_TECHNICIAN";
      case "Admin":
        return "ROLE_ADMIN";
      default:
        return role;
    }
  };

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      // Use rawData if available (API data), otherwise use transformed data
      const rawUser = user.rawData || user;
      setFormData({
        phone: rawUser.phone || user.phoneNumber || "",
        email: rawUser.email || user.email || "",
        password: "", // Don't pre-fill password
        roleName: rawUser.roleName || transformRoleToApi(user.role) || "",
        status: rawUser.stattus || (user.status === "active" ? "ACTIVE" : "IN_ACTIVE") || "ACTIVE"
      });
      setErrors({});
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9\s+\-()]+$/.test(formData.phone)) {
      newErrors.phone = "Phone number is invalid";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    // Password is optional for updates
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.roleName) {
      newErrors.roleName = "Role is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call API to update user
      const userId = user?.id || user?.rawData?.id;
      const response = await updateUser(userId, formData);
      
      if (response.success) {
        onOpenChange(false);
        
        toast({
          title: "Success",
          description: response.message || "User has been updated successfully!",
        });
        
        // Refresh user list after a delay to show toast
        setTimeout(() => {
          if (window.refreshUserList) {
            window.refreshUserList();
          } else if (onUserUpdated) {
            onUserUpdated();
          }
        }, 1500);
      } else {
        throw new Error(response.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const roleOptions = [
    { value: "ROLE_CUSTOMER", label: "Customer" },
    { value: "ROLE_STAFF", label: "Staff-technical" },
    { value: "ROLE_TECHNICIAN", label: "Technician" },
    { value: "ROLE_ADMIN", label: "Admin" }
  ];

  const statusOptions = [
    { value: "ACTIVE", label: "Active", icon: Unlock },
    { value: "IN_ACTIVE", label: "Inactive", icon: Ban }
  ];

  if (!user) return null;

  // Get display name for title
  const displayName = user.fullName || user.rawData?.phone || "User";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit User: {displayName}
          </DialogTitle>
          <DialogDescription>
            Update user information and status.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Password (Optional)
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Leave blank to keep current password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleName" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role
            </Label>
            <Select 
              value={formData.roleName} 
              onValueChange={(value) => handleInputChange("roleName", value)}
            >
              <SelectTrigger className={errors.roleName ? "border-destructive" : ""}>
                <SelectValue placeholder="Select user role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roleName && (
              <p className="text-sm text-destructive">{errors.roleName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Status
            </Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleInputChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
