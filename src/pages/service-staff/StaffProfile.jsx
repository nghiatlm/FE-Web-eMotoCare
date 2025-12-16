import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId, updateStaff } from "@/api/staffsApi";
import { authApi } from "@/api/authApi";
import { uploadFile } from "@/utils/firebaseUpload";
import { Eye, EyeOff, Camera, X } from "lucide-react";
import { toast as toastify } from "react-toastify";

const InfoRow = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-3 py-2 border-b last:border-b-0 border-slate-100">
    <span className="text-sm font-semibold text-slate-600">{label}</span>
    <span className="col-span-2 text-sm text-slate-900 break-words">{value || "—"}</span>
  </div>
);

export default function StaffProfile() {
  const { user } = useAuth();
  const account = user?.accountResponse || user?.user || user || {};

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileAddress, setProfileAddress] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      const accountId = account.id || account.accountId;
      if (!accountId) return;
      try {
        setLoading(true);
        const res = await getStaffByAccountId(accountId, { page: 1, pageSize: 10 });
        const staffData = res?.data?.rowDatas?.[0];
        setStaff(staffData || null);
        setProfileAddress(staffData?.address || "");
        setAvatarPreview(staffData?.avatarUrl || null);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [account?.id, account?.accountId]);

  const displayName = useMemo(() => {
    const name = `${staff?.firstName || ""} ${staff?.lastName || ""}`.trim();
    if (name) return name;
    return "Nhân viên dịch vụ";
  }, [staff]);

  const initials = useMemo(() => {
    const parts = displayName.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return displayName.slice(0, 2).toUpperCase() || "NV";
  }, [displayName]);

  const toVietnamesePosition = (position) => {
    const pos = (position || "").toUpperCase();
    if (pos === "SERVICE_STAFF") return "Nhân viên dịch vụ";
    return position || "—";
  };

  const statusBadge = (status) => {
    const st = (status || "").toUpperCase();
    if (st === "ACTIVE")
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Hoạt động</span>;
    if (st === "INACTIVE" || st === "IN_ACTIVE")
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">Ngưng hoạt động</span>;
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status || "Không rõ"}</span>;
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toastify.error("Vui lòng chọn file ảnh hợp lệ", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastify.error("Kích thước ảnh không được vượt quá 5MB", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(staff?.avatarUrl || null);
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdatingProfile(true);
      setUploadingAvatar(!!avatarFile);

      let avatarUrl = null;
      if (avatarFile) {
        try {
          const path = `users/${account.id || account.accountId}/avatar/${Date.now()}_${avatarFile.name}`;
          avatarUrl = await uploadFile(path, avatarFile);
        } catch (error) {
          console.error("Error uploading avatar:", error);
          toastify.error(error.message || "Không thể tải ảnh đại diện lên. Vui lòng thử lại.", {
            position: "top-right",
            autoClose: 4000,
          });
          setUpdatingProfile(false);
          setUploadingAvatar(false);
          return;
        } finally {
          setUploadingAvatar(false);
        }
      }

      // Get staff ID
      const staffId = staff?.id;
      if (!staffId) {
        toastify.error("Không tìm thấy thông tin nhân viên", {
          position: "top-right",
          autoClose: 4000,
        });
        setUpdatingProfile(false);
        return;
      }

      // Build payload with all required staff fields (API PUT /api/v1/staffs/{id})
      const payload = {
        accountId: account.id || account.accountId,
        staffCode: staff?.staffCode || "",
        firstName: staff?.firstName || "",
        lastName: staff?.lastName || "",
        address: profileAddress.trim(),
        citizenId: staff?.citizenId || "",
        dateOfBirth: staff?.dateOfBirth
          ? (() => {
              const date = new Date(staff.dateOfBirth);
              date.setHours(0, 0, 0, 0);
              return date.toISOString();
            })()
          : null,
        gender: staff?.gender || "MALE",
        position: staff?.position || "SERVICE_STAFF",
        serviceCenterId: staff?.serviceCenterId || undefined,
      };

      if (avatarUrl) {
        payload.avatarUrl = avatarUrl;
      } else if (avatarFile && !avatarUrl) {
        // If user selected a file but upload failed, don't update
        setUpdatingProfile(false);
        return;
      }

      // Update staff using PUT /api/v1/staffs/{id}
      const response = await updateStaff(staffId, payload);

      if (response?.success !== false) {
        toastify.success(response.message || "Cập nhật thông tin thành công!", {
          position: "top-right",
          autoClose: 3000,
        });

        // Nếu có avatar mới, bắn event để header staff cập nhật ngay
        if (avatarUrl) {
          window.dispatchEvent(
            new CustomEvent("staff-avatar-updated", {
              detail: { avatarUrl },
            })
          );
        }

        // Refresh staff data
        const res = await getStaffByAccountId(account.id || account.accountId, {
          page: 1,
          pageSize: 10,
        });
        const staffData = res?.data?.rowDatas?.[0];
        setStaff(staffData || null);
        setAvatarPreview(staffData?.avatarUrl || null);
        setAvatarFile(null);
        setEditingProfile(false);
      } else {
        throw new Error(response.message || "Cập nhật thông tin thất bại");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toastify.error(
        error?.response?.data?.message || error?.message || "Không thể cập nhật thông tin. Vui lòng thử lại.",
        {
          position: "top-right",
          autoClose: 4000,
        }
      );
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toastify.error("Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toastify.error("Nhập lại mật khẩu mới phải trùng khớp.");
      return;
    }
    if (newPassword.length < 6) {
      toastify.error("Mật khẩu mới tối thiểu 6 ký tự.");
      return;
    }
    try {
      setLoading(true);
      await authApi.changePassword(account.id, oldPassword, newPassword);
      toastify.success("Đổi mật khẩu thành công");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toastify.error(
        error?.data?.message || error?.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-rose-50 via-red-50 to-rose-100 overflow-x-hidden">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16 py-6 space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
            <span className="h-[2px] flex-1 bg-gradient-to-r from-red-400/60 via-rose-300/40 to-transparent rounded-full" />
          </div>
          <p className="text-slate-600 text-sm">Thông tin tài khoản</p>
          <div className="flex items-center gap-3 p-4 bg-white/90 backdrop-blur border border-rose-100 rounded-2xl shadow-md">
            <div className="relative">
              {avatarPreview ? (
                <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-red-200">
                  <img src={avatarPreview} alt={displayName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-14 w-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-lg font-bold uppercase">
                  {initials}
                </div>
              )}
              {editingProfile && (
                <label className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors">
                  <Camera className="h-3.5 w-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold text-slate-900 truncate">{displayName}</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                  Nhân viên dịch vụ
                </span>
                {statusBadge(account.status || staff?.account?.status)}
              </div>
              <div className="text-sm text-slate-600 flex flex-wrap gap-4 mt-1">
                {(staff?.account?.email || account.email) && (
                  <span>Email: {staff?.account?.email || account.email}</span>
                )}
                {(staff?.account?.phone || account.phone) && (
                  <span>SĐT: {staff?.account?.phone || account.phone}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="border border-rose-100 shadow-md bg-white/95 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Thông tin tài khoản</CardTitle>
                {!editingProfile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingProfile(true);
                      setProfileAddress(staff?.address || "");
                      setAvatarPreview(staff?.avatarUrl || null);
                      setAvatarFile(null);
                    }}
                  >
                    Chỉnh sửa
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileAddress(staff?.address || "");
                        setAvatarPreview(staff?.avatarUrl || null);
                        setAvatarFile(null);
                      }}
                      disabled={updatingProfile}
                    >
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleUpdateProfile}
                      disabled={updatingProfile || uploadingAvatar}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {updatingProfile ? "Đang lưu..." : "Lưu"}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Họ tên" value={displayName} />
              {/* Email chỉ hiển thị, không cho chỉnh sửa */}
              <InfoRow label="Email" value={staff?.account?.email || account.email} />
              <InfoRow label="Số điện thoại" value={staff?.account?.phone || account.phone} />
              {/* CCCD & ngày sinh */}
              <InfoRow label="CCCD" value={staff?.citizenId} />
              <InfoRow
                label="Ngày sinh"
                value={
                  staff?.dateOfBirth
                    ? new Date(staff.dateOfBirth).toLocaleDateString("vi-VN")
                    : "—"
                }
              />
              <InfoRow label="Chức vụ" value={toVietnamesePosition(staff?.position)} />
              {editingProfile ? (
                <div className="space-y-2">
                  <Label>Địa chỉ</Label>
                  <Input
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder="Nhập địa chỉ"
                    disabled={updatingProfile}
                  />
                </div>
              ) : (
                <InfoRow label="Địa chỉ" value={staff?.address} />
              )}
              {editingProfile && avatarFile && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Ảnh mới đã chọn</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={updatingProfile || uploadingAvatar}
                    className="h-6 px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-rose-100 shadow-md bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Đổi mật khẩu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Mật khẩu cũ</Label>
                  <div className="relative">
                    <Input
                      type={showOld ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOld((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới (>= 6 ký tự)"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nhập lại mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Mẹo: dùng mật khẩu mạnh & không chia sẻ cho người khác.</span>
                <span>{loading ? "..." : ""}</span>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


