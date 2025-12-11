import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";
import { authApi } from "@/api/authApi";
import { Eye, EyeOff } from "lucide-react";
import { toast as toastify } from "react-toastify";

const InfoRow = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-3 py-2 border-b last:border-b-0 border-slate-100">
    <span className="text-sm font-semibold text-slate-600">{label}</span>
    <span className="col-span-2 text-sm text-slate-900 break-words">{value || "—"}</span>
  </div>
);

export default function ManagerProfile() {
  const { user } = useAuth();
  const account = user?.accountResponse || user?.user || user || {};

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(false);

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
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id, account?.accountId]);

  const displayName = useMemo(() => {
    const name = `${staff?.firstName || ""} ${staff?.lastName || ""}`.trim();
    if (name) return name;
    return "Quản lý";
  }, [staff]);

  const initials = useMemo(() => {
    const parts = displayName.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return displayName.slice(0, 2).toUpperCase() || "QL";
  }, [displayName]);

  const toVietnameseStatus = (status) => {
    const st = (status || "").toUpperCase();
    if (st === "ACTIVE") return "Hoạt động";
    if (st === "INACTIVE" || st === "IN_ACTIVE") return "Ngưng hoạt động";
    return status || "Không rõ";
  };

  const toVietnamesePosition = (position) => {
    const pos = (position || "").toUpperCase();
    if (pos === "MANAGER") return "Quản lý";
    if (pos === "MANAGER_BRANCH") return "Quản lý chi nhánh";
    if (pos === "STORE_KEEPER") return "Thủ kho";
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
      toastify.error(error?.data?.message || error?.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-rose-50 via-red-50 to-rose-100 overflow-x-hidden">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16 py-6 space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Hồ sơ quản lý</h1>
            <span className="h-[2px] flex-1 bg-gradient-to-r from-red-400/60 via-rose-300/40 to-transparent rounded-full" />
          </div>
          <p className="text-slate-600 text-sm">Thông tin tài khoản và đổi mật khẩu</p>
          <div className="flex items-center gap-3 p-4 bg-white/90 backdrop-blur border border-rose-100 rounded-2xl shadow-md">
            <div className="h-14 w-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-lg font-bold uppercase">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold text-slate-900 truncate">{displayName}</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                  Quản lý
                </span>
                {statusBadge(account.status || staff?.account?.status)}
              </div>
              <div className="text-sm text-slate-600 flex flex-wrap gap-4 mt-1">
                {(staff?.account?.email || account.email) && <span>Email: {staff?.account?.email || account.email}</span>}
                {(staff?.account?.phone || account.phone) && <span>SĐT: {staff?.account?.phone || account.phone}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="border border-rose-100 shadow-md bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Thông tin tài khoản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow label="Họ tên" value={displayName} />
              <InfoRow label="Email" value={staff?.account?.email || account.email} />
              <InfoRow label="Số điện thoại" value={staff?.account?.phone || account.phone} />
              <InfoRow label="Vai trò" value="Quản lý" />
              <InfoRow label="Chức vụ" value={toVietnamesePosition(staff?.position)} />
              <InfoRow label="Địa chỉ" value={staff?.address} />
              <InfoRow label="Trạng thái" value={toVietnameseStatus(account.status || staff?.account?.status)} />
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
                <Button onClick={handleChangePassword} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
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

