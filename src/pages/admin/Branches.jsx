import { useEffect, useState, useRef, useMemo } from "react";
import { Search, Plus, Download, Filter, Building2, MapPin, Mail, Phone, Hash, Info, Clock, Calendar, Users, CheckCircle, XCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import BranchesTable from "@/components/BranchesTable";
import { createServiceCenter, updateServiceCenter, getServiceCenterById } from "@/api/serviceCentersApi";
import { toast } from "react-toastify";
import provincesApi from "vn-provinces";

export default function Branches() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [selected, setSelected] = useState(null);
  const [branchDetail, setBranchDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const DEFAULT_COORDS = { lat: 10.762622, lng: 106.660172 };
  const formRef = useRef(null);
  const geoTimeoutRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    email: "",
    location: "",
    phone: "",
    manager: "",
    hours: "",
    status: "active",
    latitude: "",
    longitude: "",
    provinceCode: "",
    provinceName: "",
    districtCode: "",
    districtName: "",
    wardCode: "",
    wardName: "",
    streetAddress: "",
  });

  const [errors, setErrors] = useState({});
  const provinces = useMemo(() => provincesApi.getProvinces() || [], []);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [wardOptions, setWardOptions] = useState([]);

  const resetForm = () => {
    setForm({ 
      name: "", 
      description: "", 
      email: "", 
      location: "", 
      phone: "", 
      manager: "", 
      hours: "", 
      status: "active", 
      latitude: "", 
      longitude: "",
      provinceCode: "",
      provinceName: "",
      districtCode: "",
      districtName: "",
      wardCode: "",
      wardName: "",
      streetAddress: "",
    });
    setErrors({});
    setDistrictOptions([]);
    setWardOptions([]);
    setGeocodeError("");
  };

  const validateField = (fieldName, value) => {
    const newErrors = { ...errors };

    switch (fieldName) {
      case "name":
        if (!value || value.trim() === "") {
          newErrors.name = "Tên chi nhánh không được để trống";
        } else if (value.trim().length < 3) {
          newErrors.name = "Tên chi nhánh phải có ít nhất 3 ký tự";
        } else {
          delete newErrors.name;
        }
        break;

      case "email":
        if (value && value.trim() !== "") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            newErrors.email = "Email không hợp lệ. Format: example@domain.com";
          } else {
            delete newErrors.email;
          }
        } else {
          delete newErrors.email;
        }
        break;

      case "phone":
        if (!value || value.trim() === "") {
          newErrors.phone = "Số điện thoại không được để trống";
        } else {
          const cleanedPhone = value.replace(/\s+/g, "").replace(/[-()]/g, "");
          const phoneRegex = /^0[35789]\d{8}$/;
          if (cleanedPhone.length !== 10) {
            newErrors.phone = "Số điện thoại phải có đúng 10 số và bắt đầu bằng số 0";
          } else if (!phoneRegex.test(cleanedPhone)) {
            newErrors.phone = "Số điện thoại không hợp lệ. Format: 10 số, bắt đầu bằng 0, số thứ 2 là 3, 5, 7, 8 hoặc 9 (VD: 0987654321)";
          } else {
            delete newErrors.phone;
          }
        }
        break;

      case "location":
        if (!value || value.trim() === "") {
          newErrors.location = "Địa chỉ không được để trống";
        } else if (value.trim().length < 5) {
          newErrors.location = "Địa chỉ phải có ít nhất 5 ký tự";
        } else {
          delete newErrors.location;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name || form.name.trim() === "") {
      newErrors.name = "Tên chi nhánh không được để trống";
    } else if (form.name.trim().length < 3) {
      newErrors.name = "Tên chi nhánh phải có ít nhất 3 ký tự";
    }

    if (form.email && form.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        newErrors.email = "Email không hợp lệ. Format: example@domain.com";
      }
    }

    if (!form.phone || form.phone.trim() === "") {
      newErrors.phone = "Số điện thoại không được để trống";
    } else {
      const cleanedPhone = form.phone.replace(/\s+/g, "").replace(/[-()]/g, "");
      const phoneRegex = /^0[35789]\d{8}$/;
      if (cleanedPhone.length !== 10) {
        newErrors.phone = "Số điện thoại phải có đúng 10 số và bắt đầu bằng số 0";
      } else if (!phoneRegex.test(cleanedPhone)) {
        newErrors.phone = "Số điện thoại không hợp lệ. Format: 10 số, bắt đầu bằng 0, số thứ 2 là 3, 5, 7, 8 hoặc 9 (VD: 0987654321)";
      }
    }

    if (isEditOpen) {
      if (!form.location || form.location.trim() === "") {
        newErrors.location = "Vui lòng nhập địa chỉ";
      } else if (form.location.trim().length < 5) {
        newErrors.location = "Địa chỉ phải có ít nhất 5 ký tự";
      }
    } else {
      if (form.provinceName || form.provinceCode) {
        if (!form.districtName && !form.districtCode) {
          newErrors.location = "Vui lòng chọn Quận/Huyện";
        } else if (!form.wardName && !form.wardCode) {
          newErrors.location = "Vui lòng chọn Phường/Xã";
        } else if (!form.streetAddress || form.streetAddress.trim() === "") {
          newErrors.location = "Vui lòng nhập Số nhà, tên đường";
        }
      } else {
        if (!form.location || form.location.trim() === "") {
          newErrors.location = "Vui lòng nhập địa chỉ hoặc chọn địa chỉ từ dropdown";
        } else if (form.location.trim().length < 5) {
          newErrors.location = "Địa chỉ phải có ít nhất 5 ký tự";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const fetchBranchDetail = async () => {
      if (selected?.id && isViewOpen) {
        try {
          setLoadingDetail(true);
          const response = await getServiceCenterById(selected.id);
          if (response.success && response.data) {
            setBranchDetail(response.data);
          } else {
            setBranchDetail(selected);
          }
        } catch (error) {
          console.error("Error fetching branch detail:", error);
          setBranchDetail(selected);
        } finally {
          setLoadingDetail(false);
        }
      } else if (!isViewOpen) {
        setBranchDetail(null);
      }
    };

    fetchBranchDetail();
  }, [selected, isViewOpen]);

  useEffect(() => {
    window.openEditBranch = (row) => {
      setSelected(row);
      setForm({
        code: row.code || "",
        name: row.name || "",
        description: row.description || "",
        email: row.email || "",
        location: row.location || "",
        phone: row.phone || "",
        manager: row.manager || "",
        hours: row.hours || "",
        status: row.status || "active",
        latitude: row.latitude || "",
        longitude: row.longitude || "",
        provinceCode: "",
        provinceName: "",
        districtCode: "",
        districtName: "",
        wardCode: "",
        wardName: "",
        streetAddress: "",
      });
      setErrors({});
      setDistrictOptions([]);
      setWardOptions([]);
      setIsEditOpen(true);
    };
    window.openViewBranch = (row) => {
      setSelected(row);
      setIsViewOpen(true);
    };
    return () => {
      if (window.openEditBranch) delete window.openEditBranch;
      if (window.openViewBranch) delete window.openViewBranch;
    };
  }, []);

  useEffect(() => {
    if (isAddOpen && !selected) {
      resetForm();
    }
  }, [isAddOpen]);

  const geocodeAddress = async (address) => {
    if (!address || address.trim().length < 3) {
      return { lat: null, lng: null };
    }

    const addressVariants = [];
    const trimmedAddress = address.trim();
    
    if (!trimmedAddress.endsWith("Vietnam") && !trimmedAddress.endsWith("Việt Nam")) {
      addressVariants.push(`${trimmedAddress}, Vietnam`);
      addressVariants.push(`${trimmedAddress}, Việt Nam`);
    }
    addressVariants.push(trimmedAddress);
    
    for (const addressToTry of addressVariants) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addressToTry
        )}&countrycodes=vn&limit=3&addressdetails=1&accept-language=vi`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "EMotoCare/1.0",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const bestResult = data[0];
            const result = {
              lat: parseFloat(bestResult.lat),
              lng: parseFloat(bestResult.lon),
            };
            
            if (!isNaN(result.lat) && !isNaN(result.lng) && 
                result.lat >= -90 && result.lat <= 90 && 
                result.lng >= -180 && result.lng <= 180) {
              console.log("Chi nhánh - Geocode thành công:", {
                input: address,
                variant: addressToTry,
                output: result,
                display_name: bestResult.display_name,
                importance: bestResult.importance,
              });
              return result;
            }
          }
        } else {
          console.warn(`Chi nhánh - Geocode API trả về lỗi cho "${addressToTry}":`, response.status, response.statusText);
        }
        
        if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Chi nhánh - Lỗi khi geocode địa chỉ "${addressToTry}":`, error);
      }
    }

    console.warn("Chi nhánh - Không thể geocode địa chỉ sau khi thử tất cả biến thể:", address);
    return { lat: null, lng: null };
  };

  const buildFullAddress = () => {
    const parts = [];
    if (form.streetAddress?.trim()) parts.push(form.streetAddress.trim());
    if (form.wardName?.trim()) parts.push(form.wardName.trim());
    if (form.districtName?.trim()) parts.push(form.districtName.trim());
    if (form.provinceName?.trim()) parts.push(form.provinceName.trim());
    
    if (parts.length > 0) {
      const fullAddress = parts.join(", ");
      if (parts.length >= 2) {
        return fullAddress;
      }
      return fullAddress;
    }
    
    return form.location || "";
  };

  const handleFindCoordinates = async () => {
    const addressToGeocode = isEditOpen ? form.location : buildFullAddress();
    
    if (!addressToGeocode || addressToGeocode.trim().length < 3) {
      toast.error("Vui lòng nhập địa chỉ đầy đủ trước khi tìm tọa độ", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setGeocodeLoading(true);
    setGeocodeError("");
    try {
      const coords = await geocodeAddress(addressToGeocode);
      if (coords.lat != null && coords.lng != null) {
        console.log("Chi nhánh - Tìm tọa độ thủ công:", {
          latitude: coords.lat,
          longitude: coords.lng,
        });
        setForm((f) => ({
          ...f,
          latitude: coords.lat.toString(),
          longitude: coords.lng.toString(),
        }));
        setGeocodeError("");
        toast.success("Đã tìm thấy tọa độ!", {
          position: "top-right",
          autoClose: 2000,
        });
      } else {
        console.warn(
          "Chi nhánh - Geocode không trả lat/long cho địa chỉ:",
          addressToGeocode
        );
        const errorMsg = "Không tìm được tọa độ phù hợp cho địa chỉ này. Vui lòng kiểm tra lại địa chỉ hoặc nhập tọa độ thủ công.";
        setGeocodeError(errorMsg);
        toast.error(errorMsg, {
          position: "top-right",
          autoClose: 2500,
        });
      }
    } catch (error) {
      console.error("Lỗi khi geocode địa chỉ:", error);
      const errorMsg = "Lỗi khi tìm tọa độ. Vui lòng thử lại hoặc nhập tọa độ thủ công.";
      setGeocodeError(errorMsg);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setGeocodeLoading(false);
    }
  };

  const handleProvinceChange = (code) => {
    const province = provinces.find((p) => p.code === code);
    setForm((f) => ({
      ...f,
      provinceCode: code,
      provinceName: province?.name || "",
      districtCode: "",
      districtName: "",
      wardCode: "",
      wardName: "",
    }));
    const districts = code ? provincesApi.getDistrictsByProvinceCode(code) || [] : [];
    setDistrictOptions(districts);
    setWardOptions([]);
  };

  const handleDistrictChange = (code) => {
    const district = districtOptions.find((d) => d.code === code);
    setForm((f) => ({
      ...f,
      districtCode: code,
      districtName: district?.name || "",
      wardCode: "",
      wardName: "",
    }));
    const wards = code ? provincesApi.getWardsByDistrictCode(code) || [] : [];
    setWardOptions(wards);
  };

  const handleWardChange = (code) => {
    const ward = wardOptions.find((w) => w.code === code);
    setForm((f) => ({
      ...f,
      wardCode: code,
      wardName: ward?.name || "",
    }));
  };

  useEffect(() => {
    if (!(isAddOpen || isEditOpen)) {
      setGeocodeError("");
      return;
    }

    if (geoTimeoutRef.current) {
      clearTimeout(geoTimeoutRef.current);
    }

    setGeocodeError("");

    let addressToGeocode = "";
    if (isEditOpen) {
      addressToGeocode = form.location || "";
    } else {
      const fullAddress = buildFullAddress();
      addressToGeocode = fullAddress || form.location || "";
      
      const hasStreetAddress = form.streetAddress?.trim().length >= 3;
      const hasLocationInfo = form.wardName || form.districtName || form.provinceName;
      
      if (!hasStreetAddress || !hasLocationInfo) {
        if (!form.location || form.location.trim().length < 10) {
          return;
        }
        addressToGeocode = form.location;
      }
    }

    const shouldGeocode = addressToGeocode.trim().length >= 10;
    if (!shouldGeocode) {
      if (form.latitude && form.longitude) {
        setGeocodeError("");
      }
      return;
    }

    geoTimeoutRef.current = setTimeout(async () => {
      setGeocodeLoading(true);
      setGeocodeError("");
      const coords = await geocodeAddress(addressToGeocode);
      if (coords.lat != null && coords.lng != null) {
        setForm((f) => ({
          ...f,
          latitude: coords.lat.toString(),
          longitude: coords.lng.toString(),
        }));
        setGeocodeError("");
        console.log("Chi nhánh - Tự động lấy tọa độ:", {
          address: addressToGeocode,
          latitude: coords.lat,
          longitude: coords.lng,
        });
      } else {
        setGeocodeError("Không thể tự động lấy tọa độ. Vui lòng bấm 'Làm mới' để thử lại hoặc nhập tọa độ thủ công.");
      }
      setGeocodeLoading(false);
    }, 800);

    return () => {
      if (geoTimeoutRef.current) clearTimeout(geoTimeoutRef.current);
    };
  }, [form.streetAddress, form.provinceName, form.districtName, form.wardName, form.location, isAddOpen, isEditOpen]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const errorMessages = Object.values(errors).filter(Boolean);
      if (errorMessages.length > 0) {
        toast.error(errorMessages[0], {
          position: "top-right",
          autoClose: 4000,
        });
      } else {
        toast.error("Vui lòng kiểm tra lại thông tin đã nhập", {
          position: "top-right",
          autoClose: 3000,
        });
      }
      return;
    }

    const tmpId = `BR-${Date.now()}`;
    const fullAddress = buildFullAddress();

    let latitude = form.latitude;
    let longitude = form.longitude;
    const addressForGeocode = fullAddress || form.location;

    if ((!latitude || !longitude) && addressForGeocode?.trim()?.length >= 3) {
      try {
        const coords = await geocodeAddress(addressForGeocode);
        if (coords.lat != null && coords.lng != null) {
          latitude = coords.lat.toString();
          longitude = coords.lng.toString();
          console.log("Chi nhánh - Auto geocode trước khi tạo:", {
            latitude,
            longitude,
          });
        }
      } catch (error) {
        console.error("Auto-geocode before create failed:", error);
      }
    }

    const body = {
      name: form.name.trim(),
      description: form.description?.trim() || "",
      email: form.email?.trim() || "",
      phone: form.phone.replace(/\s+/g, "").replace(/[-()]/g, ""),
      address: (fullAddress || form.location).trim(),
      latitude: latitude || "",
      longitude: longitude || "",
      status: "ACTIVE",
      serviceCenterInventory: {
        serviceCenterInventoryName: form.name.trim(),
      },
    };

    try {
      const res = await createServiceCenter(body);
      const created = res?.data?.data || res?.data || res;
      const mapped = {
        id: created?.id || created?.code || tmpId,
        code: created?.code || created?.id || "",
        name: created?.name || form.name,
        location: created?.address || form.location,
        phone: created?.phone || form.phone,
        email: created?.email || form.email,
        description: created?.description || form.description,
        manager: form.manager,
        hours: form.hours,
        status: String((created?.status || "ACTIVE")).toLowerCase(),
        latitude: created?.latitude || form.latitude,
        longitude: created?.longitude || form.longitude,
      };
      window?.applyAddBranch?.(mapped);
      window?.reloadBranches?.();
      toast.success("Thêm chi nhánh thành công!", {
        position: "top-right",
        autoClose: 2000,
      });
      
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể thêm chi nhánh. Vui lòng thử lại.", {
        position: "top-right",
        autoClose: 4000,
      });
      const newBranch = { id: tmpId, code: "", ...form, status: "active" };
      window?.applyAddBranch?.(newBranch);
      setIsAddOpen(false);
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selected?.id) return;

    if (!validateForm()) {
      const errorMessages = Object.values(errors).filter(Boolean);
      if (errorMessages.length > 0) {
        toast.error(errorMessages[0], {
          position: "top-right",
          autoClose: 4000,
        });
      } else {
        toast.error("Vui lòng kiểm tra lại thông tin đã nhập", {
          position: "top-right",
          autoClose: 3000,
        });
      }
      return;
    }

    const statusUpper = String(form.status || "active").toUpperCase();

    let latitude = form.latitude;
    let longitude = form.longitude;
    const addressForGeocode = form.location;

    if ((!latitude || !longitude) && addressForGeocode?.trim()?.length >= 3) {
      try {
        const coords = await geocodeAddress(addressForGeocode);
        if (coords.lat != null && coords.lng != null) {
          latitude = coords.lat.toString();
          longitude = coords.lng.toString();
          console.log("Chi nhánh - Auto geocode trước khi cập nhật:", {
            latitude,
            longitude,
          });
        }
      } catch (error) {
        console.error("Auto-geocode before update failed:", error);
      }
    }

    const body = {
      code: form.code,
      name: form.name.trim(),
      description: form.description?.trim() || "",
      email: form.email?.trim() || "",
      phone: form.phone.replace(/\s+/g, "").replace(/[-()]/g, ""),
      address: form.location.trim(),
      latitude: latitude || "",
      longitude: longitude || "",
      status: statusUpper,
    };

    try {
      const res = await updateServiceCenter(selected.id, body);
      const updated = res?.data || res;
      const mapped = {
        code: updated?.code ?? form.code,
        name: updated?.name ?? form.name,
        description: updated?.description ?? form.description,
        email: updated?.email ?? form.email,
        location: updated?.address ?? form.location,
        phone: updated?.phone ?? form.phone,
        manager: form.manager,
        hours: form.hours,
        status: String((updated?.status || form.status || "active")).toLowerCase(),
        latitude: updated?.latitude ?? form.latitude,
        longitude: updated?.longitude ?? form.longitude,
      };
      window?.applyEditBranch?.(selected.id, mapped);
      toast.success("Cập nhật chi nhánh thành công!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể cập nhật chi nhánh. Vui lòng thử lại.", {
        position: "top-right",
        autoClose: 4000,
      });
      window?.applyEditBranch?.(selected.id, { ...form });
    } finally {
      setIsEditOpen(false);
      setSelected(null);
      setErrors({});
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50">
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Quản lý chi nhánh</h1>
          <p className="mt-2 text-base md:text-lg font-medium text-slate-700">Theo dõi và quản lý hệ thống chi nhánh</p>
          <div className="mt-3 h-1.5 w-28 rounded-full bg-red-500 shadow-[0_4px_16px_-6px_rgba(239,68,68,0.65)]"/>
        </div>

        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px] md:min-w-[320px] md:max-w-[420px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm chi nhánh"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70"
              />
            </div>


            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px] md:w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="in_active">Ngưng hoạt động</SelectItem>
              </SelectContent>
            </Select>

            {(status || search) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus("");
                  setSearch("");
                }}
                className="border-transparent text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                Xóa lọc
              </Button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <Button className="gap-2 bg-red-600 hover:bg-red-700 shadow-sm" onClick={() => {
                resetForm();
                setSelected(null);
                setIsAddOpen(true);
                setTimeout(() => {
                  formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }}>
                <Plus className="h-4 w-4" />
                Thêm chi nhánh
              </Button>
            </div>
          </div>
        </div>

        <BranchesTable search={search} status={status} />

        <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) { resetForm(); setSelected(null); setErrors({}); } }}>
          <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Plus className="h-5 w-5 text-red-600" />
                Thêm chi nhánh mới
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tên chi nhánh</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((f) => ({ ...f, name: value }));
                    validateField("name", value);
                  }} 
                  placeholder="VD: GreenWheel" 
                  className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                  required
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    value={form.email} 
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((f) => ({ ...f, email: value }));
                      validateField("email", value);
                    }} 
                    placeholder="VD: alo@example.com"
                    className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Số điện thoại</Label>
                  <Input 
                    value={form.phone} 
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((f) => ({ ...f, phone: value }));
                      validateField("phone", value);
                    }} 
                    placeholder="VD: 0987654321"
                    className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                    required
                  />
                  {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về chi nhánh" />
              </div>
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Địa chỉ
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tỉnh/Thành phố</Label>
                    <Select value={form.provinceCode} onValueChange={handleProvinceChange}>
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
                    <Label>Quận/Huyện</Label>
                    <Select 
                      value={form.districtCode} 
                      onValueChange={handleDistrictChange}
                      disabled={!form.provinceCode}
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
                    <Label>Phường/Xã</Label>
                    <Select 
                      value={form.wardCode} 
                      onValueChange={handleWardChange}
                      disabled={!form.districtCode}
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
                </div>

                <div className="space-y-2">
                  <Label>Số nhà, tên đường</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={form.streetAddress} 
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((f) => ({ ...f, streetAddress: value }));
                      }} 
                      placeholder="VD: 123 Đường Lê Lợi"
                    />
                    {(form.streetAddress || form.provinceName) && (
                      <Button
                        type="button"
                        onClick={handleFindCoordinates}
                        disabled={geocodeLoading}
                        variant="outline"
                        className="shrink-0"
                        title="Bấm để làm mới tọa độ (hệ thống đã tự động lấy tọa độ)"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        {geocodeLoading ? "Đang tìm..." : "Làm mới"}
                      </Button>
                    )}
                  </div>
                  {geocodeLoading && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Đang tự động lấy tọa độ từ địa chỉ...
                    </p>
                  )}
                  {!geocodeLoading && form.latitude && form.longitude && (
                    <div className="space-y-1">
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Đã tự động lấy tọa độ:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-green-50 border border-green-200 rounded px-2 py-1">
                          <span className="text-green-700 font-semibold">Latitude:</span>
                          <span className="text-green-800 ml-1">{form.latitude}</span>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded px-2 py-1">
                          <span className="text-green-700 font-semibold">Longitude:</span>
                          <span className="text-green-800 ml-1">{form.longitude}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {!geocodeLoading && geocodeError && !form.latitude && !form.longitude && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      <p className="font-semibold mb-1">⚠️ Lưu ý:</p>
                      <p>{geocodeError}</p>
                      <p className="mt-1 text-yellow-700">Bạn có thể nhập tọa độ thủ công vào các trường Latitude và Longitude bên dưới.</p>
                    </div>
                  )}
                </div>

                {(form.streetAddress || form.provinceName || form.location) && (
                  <div className="mt-2 rounded-md border border-slate-200 bg-white overflow-hidden">
                    <div className="p-2 text-xs text-muted-foreground">
                      Bản đồ xem trước
                    </div>
                    <iframe
                      key={`${form.latitude}-${form.longitude}-${buildFullAddress()}`}
                      title="branch-map-add"
                      src={`https://www.google.com/maps?q=${form.latitude && form.longitude ? `${form.latitude},${form.longitude}` : encodeURIComponent(buildFullAddress())}&z=16&output=embed`}
                      style={{ width: "100%", height: 240, border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddOpen(false);
                    resetForm();
                    setSelected(null);
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm chi nhánh
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) { setSelected(null); setErrors({}); } }}>
          <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Pencil className="h-5 w-5 text-red-600" />
                Chỉnh sửa chi nhánh
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tên chi nhánh</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((f) => ({ ...f, name: value }));
                    validateField("name", value);
                  }} 
                  className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                  required
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    value={form.email} 
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((f) => ({ ...f, email: value }));
                      validateField("email", value);
                    }}
                    className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Số điện thoại</Label>
                  <Input 
                    value={form.phone} 
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((f) => ({ ...f, phone: value }));
                      validateField("phone", value);
                    }}
                    className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                    required
                  />
                  {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Địa chỉ
                </Label>
                <div className="flex gap-2">
                  <Input 
                    value={form.location} 
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((f) => ({ ...f, location: value }));
                      validateField("location", value);
                    }}
                    className={errors.location ? "border-red-500 focus-visible:ring-red-500" : ""}
                    placeholder="VD: 146/33 Nguyễn Thị Kiểu, Phường Hiệp Thành, Quận 12, TP.HCM"
                    required
                  />
                  {form.location && (
                    <Button
                      type="button"
                      onClick={handleFindCoordinates}
                      disabled={geocodeLoading}
                      variant="outline"
                      className="shrink-0"
                      title="Bấm để làm mới tọa độ (hệ thống đã tự động lấy tọa độ)"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {geocodeLoading ? "Đang tìm..." : "Làm mới"}
                    </Button>
                  )}
                </div>
                {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location}</p>}
                {geocodeLoading && (
                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    Đang tự động lấy tọa độ từ địa chỉ...
                  </p>
                )}
                {!geocodeLoading && form.latitude && form.longitude && (
                  <div className="space-y-1 mt-1">
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Đã tự động lấy tọa độ:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-green-50 border border-green-200 rounded px-2 py-1">
                        <span className="text-green-700 font-semibold">Latitude:</span>
                        <span className="text-green-800 ml-1">{form.latitude}</span>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded px-2 py-1">
                        <span className="text-green-700 font-semibold">Longitude:</span>
                        <span className="text-green-800 ml-1">{form.longitude}</span>
                      </div>
                    </div>
                  </div>
                )}
                {!geocodeLoading && geocodeError && !form.latitude && !form.longitude && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <p className="font-semibold mb-1">⚠️ Lưu ý:</p>
                    <p>{geocodeError}</p>
                    <p className="mt-1 text-yellow-700">Bạn có thể nhập tọa độ thủ công vào các trường Latitude và Longitude bên dưới.</p>
                  </div>
                )}
                
                {form.location && (
                  <div className="mt-2 rounded-md border border-slate-200 bg-white overflow-hidden">
                    <div className="p-2 text-xs text-muted-foreground">
                      Bản đồ xem trước
                    </div>
                    <iframe
                      key={`${form.latitude}-${form.longitude}-${form.location}`}
                      title="branch-map-edit"
                      src={`https://www.google.com/maps?q=${form.latitude && form.longitude ? `${form.latitude},${form.longitude}` : encodeURIComponent(form.location)}&z=16&output=embed`}
                      style={{ width: "100%", height: 240, border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setSelected(null); }}>Hủy</Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">Lưu</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewOpen} onOpenChange={(o) => { 
          setIsViewOpen(o); 
          if (!o) {
            setSelected(null);
            setBranchDetail(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-primary" />
                  Chi tiết chi nhánh
                </DialogTitle>
                {branchDetail?.status && (
                  <Badge 
                    variant={branchDetail.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={branchDetail.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }
                  >
                    {branchDetail.status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động'}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground text-sm">Đang tải chi tiết chi nhánh...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Hash className="h-4 w-4" />
                          <span>Mã chi nhánh</span>
                        </div>
                        <p className="text-base font-semibold text-foreground">
                          {branchDetail?.code || selected?.code || "—"}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>Tên chi nhánh</span>
                        </div>
                        <p className="text-base font-semibold text-foreground">
                          {branchDetail?.name || selected?.name || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="h-4 w-4" />
                        <span>Mô tả</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-md">
                        {branchDetail?.description || selected?.description || "Không có mô tả"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Phone className="h-5 w-5 text-primary" />
                      Thông tin liên hệ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>Email</span>
                        </div>
                        <p className="text-base font-medium text-foreground">
                          {branchDetail?.email || selected?.email || "—"}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>Số điện thoại</span>
                        </div>
                        <p className="text-base font-medium text-foreground">
                          {branchDetail?.phone || selected?.phone || "—"}
                        </p>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Địa chỉ</span>
                        </div>
                        <p className="text-base font-medium text-foreground">
                          {branchDetail?.address || selected?.location || selected?.address || "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {(branchDetail?.latitude || branchDetail?.longitude || selected?.latitude || selected?.longitude || branchDetail?.address || selected?.location || selected?.address) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Vị trí trên bản đồ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md overflow-hidden border border-border">
                        {(() => {
                          const lat = branchDetail?.latitude || selected?.latitude;
                          const lng = branchDetail?.longitude || selected?.longitude;
                          const address = branchDetail?.address || selected?.location || selected?.address;
                          const hasCoords = lat && lng;
                          const q = hasCoords ? `${lat},${lng}` : encodeURIComponent(address || "");
                          const src = `https://www.google.com/maps?q=${q}&z=16&output=embed`;
                          return (
                            <iframe
                              title="branch-map"
                              src={src}
                              style={{ width: "100%", height: 320, border: 0 }}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              allowFullScreen
                            />
                          );
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Dấu ghim đỏ thể hiện vị trí chi nhánh trên bản đồ.
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Lịch làm việc
                      {branchDetail?.serviceCenterSlots && branchDetail.serviceCenterSlots.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {branchDetail.serviceCenterSlots.length} slot
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {branchDetail?.serviceCenterSlots && branchDetail.serviceCenterSlots.length > 0 ? (
                      <div className="space-y-4">
                        {(() => {
                          const groupedByDate = branchDetail.serviceCenterSlots.reduce((acc, slot) => {
                            const date = slot.date;
                            if (!acc[date]) {
                              acc[date] = [];
                            }
                            acc[date].push(slot);
                            return acc;
                          }, {});

                          const sortedDates = Object.keys(groupedByDate).sort();

                          return sortedDates.map((date) => {
                            const slots = groupedByDate[date];
                            const firstSlot = slots[0];
                            const vietnameseDay = firstSlot.dayOfWeek === 'Saturday' ? 'Thứ Bảy' : 
                                                 firstSlot.dayOfWeek === 'Sunday' ? 'Chủ Nhật' :
                                                 firstSlot.dayOfWeek === 'Monday' ? 'Thứ Hai' :
                                                 firstSlot.dayOfWeek === 'Tuesday' ? 'Thứ Ba' :
                                                 firstSlot.dayOfWeek === 'Wednesday' ? 'Thứ Tư' :
                                                 firstSlot.dayOfWeek === 'Thursday' ? 'Thứ Năm' :
                                                 firstSlot.dayOfWeek === 'Friday' ? 'Thứ Sáu' : firstSlot.dayOfWeek;

                            return (
                              <div key={date} className="border border-border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <h4 className="font-semibold text-foreground">
                                      {vietnameseDay}, {format(new Date(date), "dd/MM/yyyy", { locale: vi })}
                                    </h4>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {slots.length} khung giờ
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                  {slots.map((slot) => (
                                    <div
                                      key={slot.id}
                                      className={`p-3 rounded-md border transition-colors ${
                                        slot.isActive
                                          ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800 hover:bg-green-100'
                                          : 'bg-gray-50 border-gray-200 dark:bg-gray-900/10 dark:border-gray-800 hover:bg-gray-100'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="text-sm font-medium text-foreground">
                                            {slot.startTime?.slice(0, 5)} - {slot.endTime?.slice(0, 5)}
                                          </span>
                                        </div>
                                        {slot.isActive ? (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-gray-400" />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <Users className="h-3.5 w-3.5" />
                                        <span>Sức chứa: {slot.capacity}</span>
                                      </div>
                                      {slot.note && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">
                                          {slot.note}
                                        </p>
                                      )}
                                      <div className="mt-2 pt-2 border-t border-border/50">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                          slot.isActive 
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
                                        }`}>
                                          {slot.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Chưa có lịch làm việc nào được thiết lập</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


