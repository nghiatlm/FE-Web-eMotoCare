import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Lottie from "lottie-react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import successAnimation from "@/assets/success-confetti.json";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const transactionId = searchParams.get("transactionId");
  const amount = searchParams.get("amount");

  useEffect(() => {
    setMounted(true);
    
    // Notify parent window if this page is loaded in an iframe
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'PAYMENT_SUCCESS' }, '*');
    }
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 via-blue-50 to-purple-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:via-blue-950/30 dark:to-purple-950/30 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-200/40 to-green-300/40 dark:from-emerald-500/20 dark:to-green-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-purple-300/40 dark:from-blue-500/20 dark:to-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-br from-pink-200/30 to-rose-300/30 dark:from-pink-500/15 dark:to-rose-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
        <div className="absolute top-1/3 left-1/2 w-2.5 h-2.5 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.7s' }}></div>
        <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
        <div className="flex justify-center relative">
          <div className="w-80 h-80 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-green-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse"></div>
            {mounted && (
              <Lottie
                animationData={successAnimation}
                loop={true}
                className="w-full h-full relative z-10"
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-blue-600 dark:from-emerald-400 dark:via-green-400 dark:to-blue-400 bg-clip-text text-transparent leading-tight pb-2">
           Tạo thanh toán thành công!
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 font-medium">
            Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 py-4">
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-emerald-400 to-emerald-400"></div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
          <div className="h-px w-20 bg-gradient-to-l from-transparent via-emerald-400 to-emerald-400"></div>
        </div>

        {/* Action Buttons
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            onClick={() => navigate("/")}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <Home className="h-4 w-4" />
            Về trang chủ
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
            size="lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div> */}

        {/* Additional Info with Decorative Box */}
        <div className="mt-8 relative">
          <div className="inline-block bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-pink-50/80 dark:from-blue-950/40 dark:via-purple-950/40 dark:to-pink-950/40 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 rounded-2xl px-6 py-4 shadow-lg">
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua{" "}
              <a
                href="mailto:emotocare@gmail.com"
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold underline decoration-2 underline-offset-2 transition-colors"
              >
                emotocare@gmail.com
              </a>
            </p>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/5 w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-1/3 right-1/5 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.7s' }}></div>
        </div>
      </div>
    </div>
  );
}

