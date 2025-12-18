import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import AuthLayout from "../../components/authlayout/AuthLayout";
import { Mail } from "lucide-react";

export default function VerifyOTP() {
  const location = useLocation();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const emailFromState = location.state?.email;
    const emailFromQuery = new URLSearchParams(location.search).get("email");
    const emailFromStorage = localStorage.getItem("pendingEmail");
    
    if (emailFromState) {
      setEmail(emailFromState);
      localStorage.setItem("pendingEmail", emailFromState);
    } else if (emailFromQuery) {
      setEmail(emailFromQuery);
      localStorage.setItem("pendingEmail", emailFromQuery);
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
    }
  }, [location]);


  return (
    <AuthLayout title='Xác nhận email'>
      <div className='space-y-6'>
        <div className='text-center space-y-4'>
          <div className='flex justify-center'>
            <div className='w-16 h-16 rounded-full bg-red-100 flex items-center justify-center'>
              <Mail size={32} className='text-red-600' />
            </div>
          </div>
          
          <div>
            <h3 className='text-lg font-semibold text-gray-800 mb-2'>
              Đã gửi email xác nhận
            </h3>
            <p className='text-gray-600 text-sm mb-4'>
              Chúng tôi đã gửi email xác nhận đến:
            </p>
            {email && (
              <p className='text-red-600 font-semibold text-base mb-4'>
                {email}
              </p>
            )}
          </div>
        </div>

        <div className='text-center pt-2'>
          <Link
            to='/login'
            className='text-sm text-red-600 hover:text-red-500'>
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

