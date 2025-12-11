import { useState, useEffect, useMemo } from "react";
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
  Eye,
  EyeOff,
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
import provincesApi from "vn-provinces";

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
    // Customer (optional)
    customerFirstName: "",
    customerLastName: "",
    customerAddress: "",
    customerCitizenId: "",
    customerDateOfBirth: null,
    customerGender: "",
    provinceCode: "",
    provinceName: "",
    districtCode: "",
    districtName: "",
    wardCode: "",
    wardName: "",
    customerProvinceCode: "",
    customerProvinceName: "",
    customerDistrictCode: "",
    customerDistrictName: "",
    customerWardCode: "",
    customerWardName: "",
  });
  const hasLetter = (value) => /[A-Za-zÀ-ỹ]/i.test((value || "").trim());
  const isDigitsOnly = (value) => /^\d+$/.test((value || "").trim());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const provinces = useMemo(() => provincesApi.getProvinces() || [], []);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [wardOptions, setWardOptions] = useState([]);
  const [customerDistrictOptions, setCustomerDistrictOptions] = useState([]);
  const [customerWardOptions, setCustomerWardOptions] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

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

  const getFieldError = (field, nextForm) => {
    const role = nextForm.roleName;
    const isCustomer = role === "ROLE_CUSTOMER";

    switch (field) {
      case "phone": {
        const phone = (nextForm.phone || "").trim();
        if (!phone) return "Số điện thoại không được để trống";
        const cleanedPhone = phone.replace(/\s+/g, "").replace(/[-()]/g, "");
        // Số điện thoại VN: bắt đầu bằng 0, số thứ 2 là 3,5,7,8,9, tổng 10 số
        const phoneRegex = /^0[35789]\d{8}$/;
        if (cleanedPhone.length !== 10) {
          return "Số điện thoại phải có đúng 10 số và bắt đầu bằng số 0";
        } else if (!phoneRegex.test(cleanedPhone)) {
          return "Số điện thoại không hợp lệ. Format: 10 số, bắt đầu bằng 0, số thứ 2 là 3, 5, 7, 8 hoặc 9 (VD: 0987654321)";
        }
        return "";
      }
      case "email": {
        const email = (nextForm.email || "").trim();
        if (!email) return "Email không được để trống";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Email không hợp lệ. Format: example@domain.com";
        return "";
      }
      // case "password": {
      //   const pwd = (nextForm.password || "").trim();
      //   if (!pwd) return "Mật khẩu là bắt buộc";
      //   if (pwd.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
      //   return "";
      // }
      case "roleName": {
        return nextForm.roleName ? "" : "Vai trò là bắt buộc";
      }
      // // Staff fields (only when not customer)
      // case "staffCode":
      //   if (!isCustomer && !nextForm.staffCode.trim()) return "Mã nhân viên là bắt buộc";
      //   return "";
      case "firstName":
        if (isCustomer) return "";
        if (!nextForm.firstName.trim()) return "Tên là bắt buộc";
        if (!hasLetter(nextForm.firstName)) return "Tên phải chứa chữ cái";
        return "";
      case "lastName":
        if (isCustomer) return "";
        if (!nextForm.lastName.trim()) return "Họ là bắt buộc";
        if (!hasLetter(nextForm.lastName)) return "Họ phải chứa chữ cái";
        return "";
      case "address":
        if (isCustomer) return "";
        if (!nextForm.address.trim()) return "Địa chỉ là bắt buộc";
        return "";
      case "citizenId":
        if (isCustomer) return "";
        if (!nextForm.citizenId.trim()) return "CMND/CCCD là bắt buộc";
        if (!isDigitsOnly(nextForm.citizenId)) return "CMND/CCCD chỉ được chứa số";
        return "";
      case "dateOfBirth":
        if (isCustomer) return "";
        if (!nextForm.dateOfBirth) return "Ngày sinh là bắt buộc";
        if (new Date(nextForm.dateOfBirth) > today) return "Ngày sinh không được vượt quá hiện tại";
        return "";
      case "gender":
        if (isCustomer) return "";
        if (!nextForm.gender) return "Giới tính là bắt buộc";
        return "";
      case "position":
        if (isCustomer) return "";
        if (!nextForm.position) return "Chức vụ là bắt buộc";
        return "";
      case "serviceCenterId":
        if (isCustomer) return "";
        if (role !== "ROLE_ADMIN" && !nextForm.serviceCenterId) return "Chi nhánh là bắt buộc";
        return "";
      // Customer fields (only when customer)
      case "customerFirstName":
        if (!isCustomer) return "";
        if (!nextForm.customerFirstName.trim()) return "Tên khách hàng là bắt buộc";
        if (!hasLetter(nextForm.customerFirstName)) return "Tên phải chứa chữ cái";
        return "";
      case "customerLastName":
        if (!isCustomer) return "";
        if (!nextForm.customerLastName.trim()) return "Họ khách hàng là bắt buộc";
        if (!hasLetter(nextForm.customerLastName)) return "Họ phải chứa chữ cái";
        return "";
      case "customerAddress":
        if (!isCustomer) return "";
        if (!nextForm.customerAddress.trim()) return "Địa chỉ là bắt buộc";
        return "";
      case "customerCitizenId":
        if (!isCustomer) return "";
        if (!nextForm.customerCitizenId.trim()) return "CMND/CCCD là bắt buộc";
        if (!isDigitsOnly(nextForm.customerCitizenId)) return "CMND/CCCD chỉ được chứa số";
        return "";
      case "customerDateOfBirth":
        if (!isCustomer) return "";
        if (!nextForm.customerDateOfBirth) return "Ngày sinh là bắt buộc";
        return "";
      case "customerGender":
        if (!isCustomer) return "";
        if (!nextForm.customerGender) return "Giới tính là bắt buộc";
        return "";
      default:
        return "";
    }
  };

  const validateForm = () => {
    const newErrors = {};

    Object.entries(formData).forEach(([key, val]) => {
      const err = getFieldError(key, formData);
      if (err) newErrors[key] = err;
    });
    // Also validate serviceCenterId based on role (for admin skip)
    const role = formData.roleName;
    if (role && role !== "ROLE_ADMIN" && role !== "ROLE_CUSTOMER" && !formData.serviceCenterId) {
      newErrors.serviceCenterId = "Chi nhánh là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted", formData);

    if (!validateForm()) {
      console.log("Validation failed", errors);
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const buildFullAddress = (base, wardName, districtName, provinceName) => {
        const parts = [base?.trim(), wardName?.trim(), districtName?.trim(), provinceName?.trim()].filter(Boolean);
        return parts.join(", ");
      };

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

      // Format payload with nested staff & optional customer object
      const isCustomer = formData.roleName === "ROLE_CUSTOMER";

      const payload = {
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        password: formData.password,
        roleName: formData.roleName,
        status: formData.status,
      };

      if (!isCustomer) {
        const staffAddress = buildFullAddress(
          formData.address,
          formData.wardName,
          formData.districtName,
          formData.provinceName
        );

        payload.staff = {
          staffCode: formData.staffCode.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          address: staffAddress,
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
        };

        if (avatarUrl) {
          payload.staff.avatarUrl = avatarUrl;
        }
      }

      // Optional customer block
      const customer = {
        firstName: formData.customerFirstName.trim(),
        lastName: formData.customerLastName.trim(),
        address: buildFullAddress(
          formData.customerAddress,
          formData.customerWardName,
          formData.customerDistrictName,
          formData.customerProvinceName
        ),
        citizenId: formData.customerCitizenId.trim(),
        dateOfBirth: formData.customerDateOfBirth
          ? (() => {
              const date = new Date(formData.customerDateOfBirth);
              date.setHours(0, 0, 0, 0);
              return date.toISOString();
            })()
          : undefined,
        gender: formData.customerGender || undefined,
      };

      const hasCustomer = Object.values(customer).some((v) => v && String(v).trim() !== "");
      if (isCustomer && hasCustomer) {
        payload.customer = customer;
      }

      // Call API to create user
      console.log("Calling API with payload:", payload);
      const response = await createUser(payload);
      console.log("API response:", response);

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

  const rolePositionMap = {
    ROLE_MANAGER: "MANAGER_BRANCH",
    ROLE_STAFF: "SERVICE_STAFF",
    ROLE_TECHNICIAN: "TECHNICIAN_STAFF",
    ROLE_STOREKEEPER: "STORE_KEEPER",
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const mappedPosition = field === "roleName" ? rolePositionMap[value] || "" : undefined;
      const next = {
        ...prev,
        [field]: value,
        ...(mappedPosition !== undefined ? { position: mappedPosition } : {}),
      };
      const err = getFieldError(field, next);

      setErrors((prevErr) => {
        // If value changes role, clear dependent sections errors
        if (field === "roleName") {
          const positionErrorReset = mappedPosition ? "" : prevErr.position;
          if (value === "ROLE_CUSTOMER") {
            return {
              ...prevErr,
              staffCode: "",
              firstName: "",
              lastName: "",
              address: "",
              citizenId: "",
              dateOfBirth: "",
              gender: "",
              position: positionErrorReset,
              serviceCenterId: "",
              provinceCode: "",
              provinceName: "",
              districtCode: "",
              districtName: "",
              wardCode: "",
              wardName: "",
              [field]: err,
            };
          }
          if (value !== "ROLE_CUSTOMER") {
            return {
              ...prevErr,
              customerFirstName: "",
              customerLastName: "",
              customerAddress: "",
              customerCitizenId: "",
              customerDateOfBirth: "",
              customerGender: "",
              customerProvinceCode: "",
              customerProvinceName: "",
              customerDistrictCode: "",
              customerDistrictName: "",
              customerWardCode: "",
              customerWardName: "",
              position: positionErrorReset,
              [field]: err,
            };
          }
        }

        return {
          ...prevErr,
          [field]: err,
        };
      });

      return next;
    });
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

  const handleProvinceChange = (code, isCustomer = false) => {
    const province = (provinces || []).find((p) => p.code === code);
    handleInputChange(isCustomer ? "customerProvinceCode" : "provinceCode", code);
    handleInputChange(isCustomer ? "customerProvinceName" : "provinceName", province?.name || "");
    handleInputChange(isCustomer ? "customerDistrictCode" : "districtCode", "");
    handleInputChange(isCustomer ? "customerDistrictName" : "districtName", "");
    handleInputChange(isCustomer ? "customerWardCode" : "wardCode", "");
    handleInputChange(isCustomer ? "customerWardName" : "wardName", "");

    const districts = code ? provincesApi.getDistrictsByProvinceCode(code) || [] : [];
    if (isCustomer) {
      setCustomerDistrictOptions(districts);
      setCustomerWardOptions([]);
    } else {
      setDistrictOptions(districts);
      setWardOptions([]);
    }
  };

  const handleDistrictChange = (code, isCustomer = false) => {
    const districtList = isCustomer ? customerDistrictOptions : districtOptions;
    const district = districtList.find((d) => d.code === code);
    handleInputChange(isCustomer ? "customerDistrictCode" : "districtCode", code);
    handleInputChange(isCustomer ? "customerDistrictName" : "districtName", district?.name || "");
    handleInputChange(isCustomer ? "customerWardCode" : "wardCode", "");
    handleInputChange(isCustomer ? "customerWardName" : "wardName", "");

    const wards = code ? provincesApi.getWardsByDistrictCode(code) || [] : [];
    if (isCustomer) {
      setCustomerWardOptions(wards);
    } else {
      setWardOptions(wards);
    }
  };

  const handleWardChange = (code, isCustomer = false) => {
    const wardList = isCustomer ? customerWardOptions : wardOptions;
    const ward = wardList.find((w) => w.code === code);
    handleInputChange(isCustomer ? "customerWardCode" : "wardCode", code);
    handleInputChange(isCustomer ? "customerWardName" : "wardName", ward?.name || "");
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 max-w-[1500px] w-full mx-auto">
        <div className="mb-4 flex items-center justify-between">
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

        <div className="bg-card rounded-xl border border-border shadow-md p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Thông tin tài khoản */}
            <div className="space-y-2.5 pb-3 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Thông tin tài khoản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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

                {/* <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Mật khẩu <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tối thiểu 6 ký tự"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={errors.password ? "border-destructive pr-10" : "pr-10"}
                      autoComplete="new-password"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div> */}

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

            {/* Thông tin khách hàng (tùy chọn) */}
            {formData.roleName === "ROLE_CUSTOMER" && (
            <div className="space-y-2.5">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Thông tin khách hàng (tùy chọn)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Tên khách hàng
                  </Label>
                  <Input
                    placeholder="VD: Nguyễn"
                    value={formData.customerFirstName}
                    onChange={(e) => handleInputChange("customerFirstName", e.target.value)}
                    className={errors.customerFirstName ? "border-destructive" : ""}
                  />
                  {errors.customerFirstName && (
                    <p className="text-sm text-destructive">{errors.customerFirstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Họ khách hàng
                  </Label>
                  <Input
                    placeholder="VD: Văn A"
                    value={formData.customerLastName}
                    onChange={(e) => handleInputChange("customerLastName", e.target.value)}
                    className={errors.customerLastName ? "border-destructive" : ""}
                  />
                  {errors.customerLastName && (
                    <p className="text-sm text-destructive">{errors.customerLastName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Tỉnh/Thành phố
                  </Label>
                  <Select
                    value={formData.customerProvinceCode}
                    onValueChange={(value) => handleProvinceChange(value, true)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tỉnh/thành phố" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Quận/Huyện
                  </Label>
                  <Select
                    value={formData.customerDistrictCode}
                    onValueChange={(value) => handleDistrictChange(value, true)}
                    disabled={!formData.customerProvinceCode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn quận/huyện" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerDistrictOptions.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Phường/Xã
                  </Label>
                  <Select
                    value={formData.customerWardCode}
                    onValueChange={(value) => handleWardChange(value, true)}
                    disabled={!formData.customerDistrictCode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phường/xã" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerWardOptions.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Số nhà, tên đường
                  </Label>
                  <Input
                    placeholder="VD: 123 Đường ABC"
                    value={formData.customerAddress}
                    onChange={(e) => handleInputChange("customerAddress", e.target.value)}
                    className={errors.customerAddress ? "border-destructive" : ""}
                  />
                  {errors.customerAddress && (
                    <p className="text-sm text-destructive">{errors.customerAddress}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <IdCard className="h-4 w-4" />
                    CCCD/CMND
                  </Label>
                  <Input
                    placeholder="VD: 012345678901"
                    value={formData.customerCitizenId}
                    onChange={(e) => handleInputChange("customerCitizenId", e.target.value)}
                    className={errors.customerCitizenId ? "border-destructive" : ""}
                  />
                  {errors.customerCitizenId && (
                    <p className="text-sm text-destructive">{errors.customerCitizenId}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Ngày sinh
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.customerDateOfBirth && "text-muted-foreground"
                          ,
                          errors.customerDateOfBirth && "border-destructive"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.customerDateOfBirth ? (
                          format(formData.customerDateOfBirth, "dd/MM/yyyy", { locale: vi })
                        ) : (
                          <span>Chọn ngày sinh</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.customerDateOfBirth}
                        onSelect={(date) => handleInputChange("customerDateOfBirth", date)}
                        initialFocus
                        locale={vi}
                        disabled={(date) => date > today}
                      />
                    </PopoverContent>
                  </Popover>
                    {errors.customerDateOfBirth && (
                      <p className="text-sm text-destructive">{errors.customerDateOfBirth}</p>
                    )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    Giới tính
                  </Label>
                  <Select
                    value={formData.customerGender}
                    onValueChange={(value) => handleInputChange("customerGender", value)}
                  >
                    <SelectTrigger className={errors.customerGender ? "border-destructive" : ""}>
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Nam</SelectItem>
                      <SelectItem value="FEMALE">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.customerGender && (
                    <p className="text-sm text-destructive">{errors.customerGender}</p>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Thông tin nhân viên */}
            {formData.roleName && formData.roleName !== "ROLE_CUSTOMER" && (
            <div className="space-y-2.5">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Thông tin nhân viên
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {/* <div className="space-y-2">
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
                </div> */}

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
                    maxLength={15}
                    inputMode="numeric"
                    pattern="\d*"
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

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Tỉnh/Thành phố
                  </Label>
                  <Select
                    value={formData.provinceCode}
                    onValueChange={(value) => handleProvinceChange(value, false)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tỉnh/thành phố" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Quận/Huyện
                  </Label>
                  <Select
                    value={formData.districtCode}
                    onValueChange={(value) => handleDistrictChange(value, false)}
                    disabled={!formData.provinceCode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn quận/huyện" />
                    </SelectTrigger>
                    <SelectContent>
                      {districtOptions.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Phường/Xã
                  </Label>
                  <Select
                    value={formData.wardCode}
                    onValueChange={(value) => handleWardChange(value, false)}
                    disabled={!formData.districtCode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phường/xã" />
                    </SelectTrigger>
                    <SelectContent>
                      {wardOptions.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2 xl:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Số nhà, tên đường <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="VD: 123 Đường ABC"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className={errors.address ? "border-destructive" : ""}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address}</p>
                  )}
                </div>

                {formData.roleName !== "ROLE_ADMIN" && (
                <div className="space-y-2">
                    <Label htmlFor="serviceCenterId" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Chi nhánh làm việc <span className="text-red-500">*</span>
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

                {/* <div className="space-y-3 md:col-span-2 xl:col-span-3">
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
                            className="h-16 w-16 rounded-full object-cover border border-border shadow-sm"
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
                      <div className="border-2 border-dashed border-muted-foreground/40 rounded-lg p-3 flex items-center gap-3">
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
                </div> */}
              </div>
            </div>
            )}

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


