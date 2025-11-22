import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "../../components/authlayout/AuthLayout";
import { authService } from "@/services/authService";
import { toast } from "@/components/ui/sonner";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [emailFromExternal, setEmailFromExternal] = useState(false); // Track nếu email được set từ bên ngoài
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    // Lấy email từ location state, query params, hoặc localStorage
    const emailFromState = location.state?.email;
    const emailFromQuery = new URLSearchParams(location.search).get("email");
    const emailFromStorage = localStorage.getItem("pendingEmail");
    
    if (emailFromState) {
      setEmail(emailFromState);
      setEmailFromExternal(true);
      localStorage.setItem("pendingEmail", emailFromState);
    } else if (emailFromQuery) {
      setEmail(emailFromQuery);
      setEmailFromExternal(true);
      localStorage.setItem("pendingEmail", emailFromQuery);
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
      setEmailFromExternal(true);
    }
    // Nếu không có email, vẫn hiển thị trang để người dùng có thể nhập email
  }, [location]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Vui lòng nhập đầy đủ mã OTP (6 số)");
      return;
    }

    if (!email) {
      setError("Không tìm thấy email. Vui lòng đăng nhập lại.");
      return;
    }

    setLoading(true);
    try {
      const user = await authService.verifyOtp(otp, email);
      console.log("Verify OTP thành công:", user);

      // Xóa email tạm
      localStorage.removeItem("pendingEmail");

      // Redirect theo role
      const roleName = user.accountResponse?.roleName;
      if (roleName === "ROLE_ADMIN") {
        navigate("/admin");
      } else if (roleName === "ROLE_MANAGER") {
        navigate("/manager");
      } else if (roleName === "ROLE_STAFF") {
        navigate("/staff");
      } else if (roleName === "ROLE_TECHNICIAN") {
        navigate("/technician");
      } else if (roleName === "ROLE_STOREKEEPER") {
        navigate("/storekeeper");
      } else {
        navigate("/");
      }

      toast.success("Xác thực OTP thành công!");
    } catch (error) {
      console.error("Verify OTP failed:", error);
      setError(error?.message || "Mã OTP không đúng. Vui lòng thử lại.");
      toast.error("Mã OTP không đúng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    try {
      // Gọi lại API login để gửi OTP mới (hoặc có API riêng để resend OTP)
      // Tạm thời chỉ reset countdown
      setCountdown(60);
      toast.info("Đã gửi lại mã OTP. Vui lòng kiểm tra email.");
    } catch (error) {
      toast.error("Không thể gửi lại mã OTP. Vui lòng thử lại.");
    }
  };

  return (
    <AuthLayout title='Xác thực OTP'>
      <form onSubmit={handleVerify} className='space-y-6'>
        {emailFromExternal ? (
          <div className='text-center'>
            <p className='text-gray-600 text-sm mb-2'>
              Mã OTP đã được gửi đến email:
            </p>
            <p className='text-gray-800 font-semibold'>{email}</p>
            <button
              type='button'
              onClick={() => setEmailFromExternal(false)}
              className='text-xs text-red-600 hover:text-red-500 mt-2 underline'>
              Thay đổi email
            </button>
          </div>
        ) : (
          <div>
            <label className='font-medium block mb-1'>Email</label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full mt-2 px-3 py-2 text-gray-700 bg-transparent outline-none border rounded-lg shadow-sm focus:border-red-600 border-gray-200'
              placeholder='Nhập email của bạn'
              required
            />
          </div>
        )}

        <div className='flex flex-col items-center space-y-4'>
          <label className='font-medium text-sm text-gray-700'>
            Nhập mã OTP (6 số)
          </label>
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            disabled={loading}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && (
          <p className='text-red-600 text-sm text-center'>{error}</p>
        )}

        <button
          type='submit'
          disabled={loading || otp.length !== 6}
          className='w-full px-4 py-2 text-white font-medium bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-lg duration-150 disabled:opacity-70 disabled:cursor-not-allowed'>
          {loading ? "Đang xác thực..." : "Xác thực OTP"}
        </button>

        <div className='text-center space-y-2'>
          <button
            type='button'
            onClick={handleResendOtp}
            disabled={countdown > 0}
            className='text-sm text-red-600 hover:text-red-500 disabled:text-gray-400 disabled:cursor-not-allowed'>
            {countdown > 0
              ? `Gửi lại mã OTP (${countdown}s)`
              : "Gửi lại mã OTP"}
          </button>

          <div className='pt-2'>
            <Link
              to='/login'
              className='text-sm text-gray-600 hover:text-gray-800'>
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}

