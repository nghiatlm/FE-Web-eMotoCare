import { useState, useEffect } from "react";
import { User, Mail, Phone, Shield, Ban, Unlock, UserCircle, MapPin, Calendar, IdCard, Image as ImageIcon, Briefcase, Building2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { updateUser } from "@/api/usersApi";
import { getServiceCenters } from "@/api/serviceCentersApi";
import { uploadFile } from "@/utils/firebaseUpload";

const normalizeGender = (value = "") => {
  const v = (value || "").toString().trim().toUpperCase();
  if (["MALE", "NAM"].includes(v)) return "MALE";
  if (["FEMALE", "NỮ", "NU"].includes(v)) return "FEMALE";
  if (v === "OTHER") return "OTHER";
  return "";
};

export function EditUserForm({ open, onOpenChange, user, onUserUpdated }) {
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    password: "",
    roleName: "",
    status: "ACTIVE",
    // Staff fields
    staffCode: "",
    firstName: "",
    lastName: "",
    address: "",
    citizenId: "",
    dateOfBirth: null,
    gender: "",
    avatarUrl: "",
    position: "",
    serviceCenterId: "",
    // Customer fields
    customerFirstName: "",
    customerLastName: "",
    customerAddress: "",
    customerCitizenId: "",
    customerDateOfBirth: null,
    customerGender: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { toast } = useToast();

  // Fetch service centers
  useEffect(() => {
    const fetchServiceCenters = async () => {
      try {
        setLoadingCenters(true);
        const response = await getServiceCenters({ page: 1, pageSize: 100 });
        if (response.success && response.data) {
          const centers = response.data.rowDatas || response.data || [];
          setServiceCenters(centers);
        }
      } catch (error) {
        console.error("Error fetching service centers:", error);
      } finally {
        setLoadingCenters(false);
      }
    };

    if (open) {
      fetchServiceCenters();
    }
  }, [open]);

  // Helper function to transform role name
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

  const transformRoleToApi = (role) => {
    switch (role) {
      case "Admin":
        return "ROLE_ADMIN";
      case "Manager":
        return "ROLE_MANAGER";
      case "Staff":
        return "ROLE_STAFF";
      case "Technician":
        return "ROLE_TECHNICIAN";
      case "Customer":
        return "ROLE_CUSTOMER";
      case "Storekeeper":
        return "ROLE_STOREKEEPER";
      default:
        return role;
    }
  };

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      // Use rawData if available (API data), otherwise use transformed data
      const rawUser = user.rawData || user;
      const staff = rawUser.staff || user.staff || {};
      const customer = rawUser.customer || user.customer || {};
      
      // Parse dateOfBirth if it exists
      let dateOfBirth = null;
      if (staff.dateOfBirth) {
        try {
          dateOfBirth = new Date(staff.dateOfBirth);
        } catch (e) {
          console.error("Error parsing dateOfBirth:", e);
        }
      }

      // Parse customer dateOfBirth if it exists
      let customerDob = null;
      if (customer.dateOfBirth) {
        try {
          customerDob = new Date(customer.dateOfBirth);
        } catch (e) {
          console.error("Error parsing customer dateOfBirth:", e);
        }
      }

      setFormData({
        phone: rawUser.phone || user.phoneNumber || "",
        email: rawUser.email || user.email || "",
        password: "", // Don't pre-fill password
        roleName: rawUser.roleName || transformRoleToApi(user.role) || "",
        status: rawUser.status || (user.status === "active" ? "ACTIVE" : "INACTIVE") || "ACTIVE",
        // Staff fields
        staffCode: staff.staffCode || rawUser.staffCode || "",
        firstName: staff.firstName || rawUser.firstName || "",
        lastName: staff.lastName || rawUser.lastName || "",
        address: staff.address || rawUser.address || customer.address || "",
        citizenId: staff.citizenId || rawUser.citizenId || "",
        dateOfBirth: dateOfBirth || (rawUser.dateOfBirth ? new Date(rawUser.dateOfBirth) : null),
        gender: normalizeGender(staff.gender || rawUser.gender || ""),
        avatarUrl: staff.avatarUrl || rawUser.avatarUrl || customer.avatarUrl || "",
        position: staff.position || rawUser.position || "",
        serviceCenterId: staff.serviceCenterId || rawUser.serviceCenterId || "",
        // Customer fields
        customerFirstName: customer.firstName || "",
        customerLastName: customer.lastName || "",
        customerAddress: customer.address || "",
        customerCitizenId: customer.citizenId || "",
        customerDateOfBirth: customerDob,
        customerGender: customer.gender || "",
      });
      setAvatarPreview(staff.avatarUrl || customer.avatarUrl || "");
      setErrors({});
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    const isCustomer = formData.roleName === "ROLE_CUSTOMER";

    const phone = formData.phone.trim();
    const vnPhoneRegex = /^(0\d{9}|\+84\d{9,10})$/;
    if (!phone) newErrors.phone = "Số điện thoại là bắt buộc";
    else if (!vnPhoneRegex.test(phone)) newErrors.phone = "Số điện thoại không hợp lệ";

    if (!formData.email.trim()) newErrors.email = "Email là bắt buộc";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email không hợp lệ";

    if (!formData.roleName) newErrors.roleName = "Vai trò là bắt buộc";
    const addressToValidate = isCustomer ? formData.customerAddress : formData.address;
    if (!addressToValidate.trim()) newErrors.address = "Địa chỉ là bắt buộc";

    if (!isCustomer) {
      if (!formData.position) newErrors.position = "Chức vụ là bắt buộc";
      if (!formData.serviceCenterId) newErrors.serviceCenterId = "Chi nhánh là bắt buộc";
    }

    // Password optional; if filled must be >=6
    if (formData.password && formData.password.trim().length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
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
      // Upload avatar if user chọn file mới
      let avatarUrl = formData.avatarUrl.trim();
      if (selectedAvatar) {
        try {
          setUploadingAvatar(true);

          if (!selectedAvatar.type.startsWith("image/")) {
            throw new Error("Vui lòng chọn file ảnh hợp lệ");
          }
          if (selectedAvatar.size > 5 * 1024 * 1024) {
            throw new Error("Kích thước ảnh không được vượt quá 5MB");
          }

          const timestamp = Date.now();
          const ext = selectedAvatar.name.split(".").pop();
          const identifier =
            formData.phone.trim() ||
            formData.staffCode.trim() ||
            `user_${timestamp}`;
          const path = `avatars/${identifier}_${timestamp}.${ext || "jpg"}`;

          avatarUrl = await uploadFile(path, selectedAvatar);
        } catch (error) {
          console.error("Error uploading avatar:", error);
          toast({
            title: "Lỗi tải ảnh đại diện",
            description:
              error.message || "Không thể tải ảnh đại diện lên. Vui lòng thử lại.",
            variant: "destructive",
          });
          setIsLoading(false);
          setUploadingAvatar(false);
          return;
        } finally {
          setUploadingAvatar(false);
        }
      }

      const isCustomer = formData.roleName === "ROLE_CUSTOMER";
      const payload = {
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        roleName: formData.roleName,
        status: formData.status,
      };

      if (isCustomer) {
        payload.customer = {
          firstName: formData.customerFirstName.trim(),
          lastName: formData.customerLastName.trim(),
          address: formData.customerAddress.trim(),
          citizenId: formData.customerCitizenId.trim(),
          dateOfBirth: formData.customerDateOfBirth ? (() => {
            const date = new Date(formData.customerDateOfBirth);
            date.setHours(0, 0, 0, 0);
            return date.toISOString();
          })() : null,
          gender: formData.customerGender,
        };
      } else {
        payload.staff = {
          staffCode: formData.staffCode.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          address: formData.address.trim(),
          citizenId: formData.citizenId.trim(),
          dateOfBirth: formData.dateOfBirth ? (() => {
            const date = new Date(formData.dateOfBirth);
            date.setHours(0, 0, 0, 0);
            return date.toISOString();
          })() : null,
          gender: formData.gender,
          position: formData.position,
          serviceCenterId: formData.serviceCenterId || undefined,
        };
      }

      // Only include password if provided
      if (formData.password && formData.password.trim()) {
        payload.password = formData.password;
      }

      // Only include avatarUrl nếu có (URL cũ hoặc mới upload)
      if (avatarUrl) {
        if (isCustomer) {
          payload.customer.avatarUrl = avatarUrl;
        } else {
          payload.staff.avatarUrl = avatarUrl;
        }
      }

      // Include accountId if available (from existing user)
      const rawUser = user?.rawData || user;
      const staff = rawUser.staff || user.staff || {};
      const customer = rawUser.customer || user.customer || {};
      if (!isCustomer && staff.accountId) {
        payload.staff.accountId = staff.accountId;
      }
      if (isCustomer && customer.accountId) {
        payload.customer.accountId = customer.accountId;
      }

      // Call API to update user
      const userId = user?.id || user?.rawData?.id;
      const response = await updateUser(userId, payload);

      if (response?.success !== false) {
        // Update list immediately
        if (window.refreshUserList) {
          window.refreshUserList();
        } else if (onUserUpdated) {
          onUserUpdated(response?.data || null);
        }

        toast({
          title: "Cập nhật người dùng thành công",
          description: response.message || "Đã cập nhật thông tin người dùng thành công!",
        });

        onOpenChange(false);
      } else {
        throw new Error(response.message || "Cập nhật người dùng thất bại");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Cập nhật người dùng thất bại",
        description: error.message || "Không thể cập nhật người dùng. Vui lòng thử lại.",
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

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file ảnh hợp lệ.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Kích thước ảnh không được vượt quá 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedAvatar(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = () => {
    setSelectedAvatar(null);
    setAvatarPreview("");
    setFormData((prev) => ({ ...prev, avatarUrl: "" }));
  };

  const roleOptions = [
    { value: "ROLE_MANAGER", label: "Quản lý" },
    { value: "ROLE_STAFF", label: "Nhân viên" },
    { value: "ROLE_TECHNICIAN", label: "Kỹ thuật viên" },
    { value: "ROLE_CUSTOMER", label: "Khách hàng" },
    { value: "ROLE_STOREKEEPER", label: "Thủ kho" },
  ];

  const positionOptions = [
    { value: "SERVICE_STAFF", label: "Nhân viên dịch vụ" },
    { value: "TECHNICIAN_STAFF", label: "Nhân viên kỹ thuật" },
    { value: "STORE_KEEPER", label: "Thủ kho" },
    { value: "MANAGER_BRANCH", label: "Quản lý chi nhánh" },
  ];

  const statusOptions = [
    { value: "ACTIVE", label: "Hoạt động", icon: Unlock },
    { value: "IN_ACTIVE", label: "Ngưng hoạt động", icon: Ban }
  ];

  if (!user) return null;

  // Get display name for title
  const displayName = user.fullName || user.rawData?.phone || "User";
  const isCustomer = formData.roleName === "ROLE_CUSTOMER";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Chỉnh sửa người dùng: {displayName}
          </DialogTitle>
          <DialogDescription>
            Cập nhật thông tin người dùng.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Thông tin tài khoản */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Thông tin tài khoản
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Số điện thoại <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="VD: 0987654321"
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
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="VD: user@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>


              <div className="space-y-2">
                <Label htmlFor="roleName" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Vai trò <span className="text-red-500">*</span>
                </Label>
            <Select
              value={formData.roleName}
              onValueChange={(value) => handleInputChange("roleName", value)}
            >
              <SelectTrigger className={errors.roleName ? "border-destructive" : ""}>
                <SelectValue placeholder="Chọn vai trò" />
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
            </div>
          </div>

          {!isCustomer && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Thông tin nhân viên
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staffCode" className="flex items-center gap-2">
                    <IdCard className="h-4 w-4" />
                    Mã nhân viên <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="staffCode"
                    placeholder="VD: ST000123"
                    value={formData.staffCode}
                    disabled
                    className="bg-slate-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="citizenId" className="flex items-center gap-2">
                    <IdCard className="h-4 w-4" />
                    CMND/CCCD <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="citizenId"
                    placeholder="VD: 123456789012"
                    value={formData.citizenId}
                    disabled
                    className="bg-slate-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Tên <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="VD: Nam"
                    value={formData.firstName}
                    disabled
                    className="bg-slate-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Họ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="VD: Nguyễn Văn"
                    value={formData.lastName}
                    disabled
                    className="bg-slate-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Ngày sinh <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled
                          className="w-full justify-start text-left font-normal bg-slate-50 cursor-not-allowed"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.dateOfBirth ? (
                            format(formData.dateOfBirth, "dd/MM/yyyy", { locale: vi })
                          ) : (
                            <span>Chọn ngày sinh</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    Giới tính <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.gender} disabled>
                    <SelectTrigger className="bg-slate-50 cursor-not-allowed">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Nam</SelectItem>
                    <SelectItem value="FEMALE">Nữ</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Chức vụ <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.position} 
                    onValueChange={(value) => handleInputChange("position", value)}
                  >
                    <SelectTrigger className={errors.position ? "border-destructive" : ""}>
                      <SelectValue placeholder="Chọn chức vụ" />
                    </SelectTrigger>
                    <SelectContent>
                      {positionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.position && (
                    <p className="text-sm text-destructive">{errors.position}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceCenterId" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Chi nhánh <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.serviceCenterId} 
                    onValueChange={(value) => handleInputChange("serviceCenterId", value)}
                    disabled={loadingCenters}
                  >
                    <SelectTrigger className={errors.serviceCenterId ? "border-destructive" : ""}>
                      <SelectValue placeholder={loadingCenters ? "Đang tải..." : "Chọn chi nhánh"} />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCenters.map((center) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name} ({center.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.serviceCenterId && (
                    <p className="text-sm text-destructive">{errors.serviceCenterId}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Địa chỉ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="VD: 123 Đường ABC, Quận 1, TPHCM"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className={errors.address ? "border-destructive" : ""}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isCustomer && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Thông tin khách hàng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Tên <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.customerFirstName}
                    disabled
                    className="bg-slate-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Họ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.customerLastName}
                    disabled
                    className="bg-slate-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <IdCard className="h-4 w-4" />
                    CMND/CCCD <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.customerCitizenId}
                    disabled
                    className="bg-slate-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Ngày sinh <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled
                          className="w-full justify-start text-left font-normal bg-slate-50 cursor-not-allowed"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.customerDateOfBirth ? (
                            format(formData.customerDateOfBirth, "dd/MM/yyyy", { locale: vi })
                          ) : (
                            <span>Chọn ngày sinh</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    Giới tính <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.customerGender} disabled>
                    <SelectTrigger className="bg-slate-50 cursor-not-allowed">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Nam</SelectItem>
                    <SelectItem value="FEMALE">Nữ</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Địa chỉ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="VD: 123 Đường ABC, Quận 1, TPHCM"
                    value={formData.customerAddress}
                    onChange={(e) => handleInputChange("customerAddress", e.target.value)}
                    className={errors.address ? "border-destructive" : ""}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Ảnh đại diện (tùy chọn)
            </Label>

            <div className="space-y-2">
              {avatarPreview || formData.avatarUrl ? (
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img
                      src={avatarPreview || formData.avatarUrl}
                      alt="Avatar preview"
                      className="h-20 w-20 rounded-full object-cover border border-border shadow-sm"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-md"
                      onClick={handleAvatarRemove}
                      disabled={uploadingAvatar || isLoading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      Ảnh đại diện hiện tại
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById("editAvatarFile");
                        if (input) input.click();
                      }}
                      disabled={uploadingAvatar || isLoading}
                      className="gap-2"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Đổi ảnh khác
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/40 rounded-lg p-4 flex items-center gap-3">
                  <input
                    type="file"
                    id="editAvatarFile"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="editAvatarFile"
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Upload className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        Thêm ảnh đại diện
                      </span>
                      <span className="text-xs text-muted-foreground">
                        JPG, PNG, GIF • Tối đa 5MB
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {uploadingAvatar && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Đang tải ảnh đại diện...
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || uploadingAvatar}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading || uploadingAvatar
                ? uploadingAvatar
                  ? "Đang tải ảnh..."
                  : "Đang cập nhật..."
                : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
