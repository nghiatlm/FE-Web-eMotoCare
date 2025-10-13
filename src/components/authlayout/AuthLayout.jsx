export default function AuthLayout({ title, children }) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 via-orange-200 to-gray-200 px-4'>
      <div className='max-w-md w-full bg-white rounded-2xl shadow-xl p-8'>
        {/* Logo & tiêu đề */}
        <div className='text-center mb-6'>
          <img
            src='https://s1storage.2banh.vn/image/2013/09/20130906_93bfd4426aa876dcf8b9908391ee54cf_1378448593.png'
            alt='Logo'
            className='mx-auto w-16 h-16 object-contain mb-3'
          />
          <h2 className='text-2xl font-bold text-gray-800'>{title}</h2>
          <p className='text-gray-500 text-sm mt-1'>
            eMotoCare - Quản lý dịch vụ bảo hành, sửa chữa thông minh
          </p>
        </div>

        {/* Nội dung (form login/register/etc) */}
        <div>{children}</div>
      </div>
    </div>
  );
}
