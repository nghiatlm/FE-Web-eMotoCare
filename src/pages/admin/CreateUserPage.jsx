import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  UserCircle,
  MapPin,
  Calendar,
  IdCard,
  Image as ImageIcon,
  Briefcase,
  Building2,
  Upload,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { createUser } from "@/api/usersApi";
import { getServiceCenters } from "@/api/serviceCentersApi";
import { uploadFile } from "@/utils/firebaseUpload";

export default function CreateUserPage() {
  const navigate = useNavigate();

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
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

    fetchServiceCenters();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    const phone = formData.phone.trim();
    const vnPhoneRegex = /^(0\d{9}|\+84\d{9,10})$/;
    if (!phone) {
      newErrors.phone = "Số điện thoại là bắt buộc";
    } else if (!vnPhoneRegex.test(phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!formData.roleName) {
      newErrors.roleName = "Vai trò là bắt buộc";
    }

    // Staff validation
    if (!formData.staffCode.trim()) {
      newErrors.staffCode = "Mã nhân viên là bắt buộc";
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Tên là bắt buộc";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Họ là bắt buộc";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Địa chỉ là bắt buộc";
    }

    if (!formData.citizenId.trim()) {
      newErrors.citizenId = "CMND/CCCD là bắt buộc";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Ngày sinh là bắt buộc";
    }

    if (!formData.gender) {
      newErrors.gender = "Giới tính là bắt buộc";
    }

    if (!formData.position) {
      newErrors.position = "Chức vụ là bắt buộc";
    }

    if (formData.roleName !== "ROLE_ADMIN" && !formData.serviceCenterId) {
      newErrors.serviceCenterId = "Chi nhánh là bắt buộc";
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
      // Upload avatar to Firebase if selected
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
          toast.error(`Lỗi tải ảnh đại diện: ${error.message || "Không thể tải ảnh đại diện lên. Vui lòng thử lại."}`, {
            position: "top-right",
            autoClose: 4000,
          });
          setIsLoading(false);
          setUploadingAvatar(false);
          return;
        } finally {
          setUploadingAvatar(false);
        }
      }

      // Format payload with nested staff object
      const payload = {
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        password: formData.password,
        roleName: formData.roleName,
        status: formData.status,
        staff: {
          staffCode: formData.staffCode.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          address: formData.address.trim(),
          citizenId: formData.citizenId.trim(),
          dateOfBirth: formData.dateOfBirth
            ? (() => {
                const date = new Date(formData.dateOfBirth);
                date.setHours(0, 0, 0, 0);
                return date.toISOString();
              })()
            : null,
          gender: formData.gender,
          position: formData.position,
          serviceCenterId: formData.serviceCenterId || undefined,
        },
      };

      // Only include avatarUrl if provided
      if (avatarUrl) {
        payload.staff.avatarUrl = avatarUrl;
      }

      // Call API to create user
      const response = await createUser(payload);

      if (response?.success !== false) {
        if (window.refreshUserList) {
          window.refreshUserList();
        }

        toast.success(response?.message || "Đã tạo người dùng mới thành công!", {
          position: "top-right",
          autoClose: 4000,
        });

        navigate("/admin/users");
      } else {
        throw new Error(response.message || "Tạo người dùng thất bại");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(`Tạo người dùng thất bại: ${error.message || "Không thể tạo người dùng. Vui lòng thử lại."}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Lỗi: Vui lòng chọn file ảnh hợp lệ.", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Lỗi: Kích thước ảnh không được vượt quá 5MB.", {
        position: "top-right",
        autoClose: 4000,
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
    { value: "ROLE_ADMIN", label: "Admin" },
    { value: "ROLE_MANAGER", label: "Manager" },
    { value: "ROLE_STAFF", label: "Staff" },
    { value: "ROLE_TECHNICIAN", label: "Technician" },
    { value: "ROLE_CUSTOMER", label: "Customer" },
    { value: "ROLE_STOREKEEPER", label: "Storekeeper" },
  ];

  const positionOptions = [
    { value: "SERVICE_STAFF", label: "Nhân viên dịch vụ" },
    { value: "TECHNICIAN_STAFF", label: "Nhân viên kỹ thuật" },
    { value: "STORE_KEEPER", label: "Thủ kho" },
    { value: "MANAGER_BRANCH", label: "Quản lý chi nhánh" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tạo người dùng mới</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Nhập đầy đủ thông tin để tạo tài khoản cho người dùng.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/users")}
            disabled={isLoading || uploadingAvatar}
          >
            Hủy
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-md p-6">
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
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={13}
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
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Mật khẩu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={errors.password ? "border-destructive" : ""}
                    autoComplete="new-password"
                    minLength={6}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
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

            {/* Thông tin nhân viên */}
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
                    onChange={(e) => handleInputChange("staffCode", e.target.value)}
                    className={errors.staffCode ? "border-destructive" : ""}
                  />
                  {errors.staffCode && (
                    <p className="text-sm text-destructive">{errors.staffCode}</p>
                  )}
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
                    onChange={(e) => handleInputChange("citizenId", e.target.value)}
                    className={errors.citizenId ? "border-destructive" : ""}
                  />
                  {errors.citizenId && (
                    <p className="text-sm text-destructive">{errors.citizenId}</p>
                  )}
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
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName}</p>
                  )}
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
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName}</p>
                  )}
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
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dateOfBirth && "text-muted-foreground",
                          errors.dateOfBirth && "border-destructive"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.dateOfBirth ? (
                          format(formData.dateOfBirth, "dd/MM/yyyy", { locale: vi })
                        ) : (
                          <span>Chọn ngày sinh</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.dateOfBirth}
                        onSelect={(date) => handleInputChange("dateOfBirth", date)}
                        initialFocus
                        locale={vi}
                        maxDate={new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dateOfBirth && (
                    <p className="text-sm text-destructive">{errors.dateOfBirth}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    Giới tính <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange("gender", value)}
                  >
                    <SelectTrigger className={errors.gender ? "border-destructive" : ""}>
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Nam</SelectItem>
                      <SelectItem value="FEMALE">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-destructive">{errors.gender}</p>
                  )}
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

                {formData.roleName !== "ROLE_ADMIN" && (
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
                )}

                <div className="space-y-3 md:col-span-2">
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
                            Đã chọn ảnh đại diện
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById("avatarFile");
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
                          id="avatarFile"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="avatarFile"
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <Upload className="h-4 w-4 text-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              Chọn ảnh đại diện
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
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/users")}
                disabled={isLoading || uploadingAvatar}
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
                    : "Đang tạo..."
                  : "Tạo người dùng"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


