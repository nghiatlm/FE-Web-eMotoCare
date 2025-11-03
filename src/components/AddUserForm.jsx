import { useState } from "react";
import { User, Mail, Phone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createUser } from "@/api/usersApi";

export function AddUserForm({ open, onOpenChange, onUserAdded }) {
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
    
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
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
      // Call API to create user
      const response = await createUser(formData);
      
      if (response.success) {
        // Reset form
        setFormData({
          phone: "",
          email: "",
          password: "",
          roleName: "",
          status: "ACTIVE"
        });
        setErrors({});
        onOpenChange(false);
        
        toast({
          title: "Success",
          description: response.message || "User has been added successfully!",
        });
        
        // Refresh user list after a delay to show toast
        setTimeout(() => {
          if (onUserAdded) {
            onUserAdded();
          } else if (window.refreshUserList) {
            window.refreshUserList();
          } else {
            window.location.reload();
          }
        }, 1500);
      } else {
        throw new Error(response.message || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New User
          </DialogTitle>
          <DialogDescription>
            Create a new user account with the required information.
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
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password (min 6 characters)"
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
              {isLoading ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
