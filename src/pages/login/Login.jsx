import AuthLayout from "../../components/authlayout/AuthLayout";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <AuthLayout title='Đăng nhập vào hệ thống'>
      <div className='space-y-5'>
        <div>
          <label className='font-medium block mb-1'>Số điện thoại</label>
          <input
            type='tel'
            className='w-full mt-2 px-3 py-2 text-gray-700 bg-transparent outline-none border rounded-lg shadow-sm focus:border-red-600 border-gray-200'
            placeholder='Nhập số điện thoại của bạn'
          />
        </div>

        {/* Password */}
        <div>
          <label className='font-medium block mb-1'>Mật khẩu</label>
          <input
            type='password'
            className='w-full mt-2 px-3 py-2 text-gray-700 bg-transparent outline-none border rounded-lg shadow-sm focus:border-red-600 border-gray-200'
            placeholder='Nhập mật khẩu'
          />
        </div>

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

        {/* Nút Đăng nhập (fake) */}
        <button
          type='button'
          className='w-full px-4 py-2 text-white font-medium bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-lg duration-150'>
          Đăng nhập
        </button>
      </div>
    </AuthLayout>
  );
}
