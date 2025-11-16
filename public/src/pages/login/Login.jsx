// src/pages/login/Login.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AuthLayout from "../../components/authlayout/AuthLayout";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      const res = await login(email, password);
      console.log("Đăng nhập thành công:", res);
    } catch {
      setError("Sai email hoặc mật khẩu");
    }
  };

  return (
    <AuthLayout title='Đăng nhập vào hệ thống'>
      <form onSubmit={handleLogin} className='space-y-5'>
        <div>
          <label className='font-medium block mb-1'>Email</label>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full mt-2 px-3 py-2 text-gray-700 bg-transparent outline-none border rounded-lg shadow-sm focus:border-red-600 border-gray-200'
            placeholder='Nhập email của bạn'
          />
        </div>

        <div>
          <label className='font-medium block mb-1'>Mật khẩu</label>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full mt-2 px-3 py-2 text-gray-700 bg-transparent outline-none border rounded-lg shadow-sm focus:border-red-600 border-gray-200'
            placeholder='Nhập mật khẩu'
          />
        </div>

        {error && <p className='text-red-600 text-sm'>{error}</p>}

        <div className='flex items-center justify-between text-sm'>
          <label className='flex items-center gap-x-2 cursor-pointer select-none'>
            <input type='checkbox' className='accent-red-600' />
            <span className='text-gray-700'>Ghi nhớ đăng nhập</span>
          </label>
          <Link
            to='/forgot-password'
            className='text-red-600 hover:text-red-500'>
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type='submit'
          disabled={loading}
          className='w-full px-4 py-2 text-white font-medium bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-lg duration-150 disabled:opacity-70'>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </AuthLayout>
  );
}
