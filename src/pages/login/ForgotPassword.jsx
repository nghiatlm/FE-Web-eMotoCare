import React, { useState } from "react";
import { Modal } from "antd";
import AuthLayout from "../../components/authlayout/AuthLayout";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSendOtp = () => {
    if (!email) return alert("Vui lòng nhập email!");
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    if (!otp || !newPassword)
      return alert("Vui lòng nhập đủ mã OTP và mật khẩu mới!");
    alert("✅ Mật khẩu của bạn đã được đặt lại thành công (demo)");
    setIsModalOpen(false);
    setOtp("");
    setNewPassword("");
  };

  return (
    <AuthLayout title='Quên mật khẩu'>
      <div className='space-y-5'>
        <div>
          <label className='font-medium block mb-1'>Email</label>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='Nhập email của bạn'
            className='w-full mt-2 px-3 py-2 text-gray-700 bg-transparent outline-none border rounded-lg shadow-sm focus:border-red-600 border-gray-200'
          />
        </div>

        <button
          onClick={handleSendOtp}
          className='w-full px-4 py-2 text-white font-medium bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-lg duration-150'>
          Gửi mã OTP
        </button>

        <p className='text-center text-sm mt-4'>
          <a href='/login' className='text-red-600 hover:underline'>
            Quay lại đăng nhập
          </a>
        </p>
      </div>

      <Modal
        title='Nhập mã OTP'
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered>
        <div className='space-y-4'>
          <p className='text-sm text-gray-500'>
            Mã OTP đã được gửi đến email của bạn.
          </p>

          <input
            type='text'
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder='Nhập mã OTP (6 số)'
            maxLength={6}
            className='w-full border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-red-500 border-gray-300 text-center tracking-widest text-lg font-semibold'
          />

          <input
            type='password'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder='Nhập mật khẩu mới'
            className='w-full border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-red-500 border-gray-300'
          />

          <button
            onClick={handleConfirm}
            className='w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white py-2 rounded-lg font-semibold transition duration-150'>
            Xác nhận
          </button>
        </div>
      </Modal>
    </AuthLayout>
  );
}

export default ForgotPassword;
