import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Lottie from "lottie-react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import cancelAnimation from "@/assets/cancel-error.json";

export default function PaymentFailed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const transactionId = searchParams.get("transactionId");
  const amount = searchParams.get("amount");

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-50 via-orange-50 via-rose-50 to-pink-50 dark:from-red-950/30 dark:via-orange-950/30 dark:via-rose-950/30 dark:to-pink-950/30 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-red-200/40 to-orange-300/40 dark:from-red-500/20 dark:to-orange-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-rose-200/40 to-pink-300/40 dark:from-rose-500/20 dark:to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-br from-orange-200/30 to-red-300/30 dark:from-orange-500/15 dark:to-red-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
        <div className="absolute top-1/3 left-1/2 w-2.5 h-2.5 bg-rose-400 rounded-full animate-ping" style={{ animationDelay: '0.7s' }}></div>
        <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-2xl w-full text-center space-y-6 relative z-10">
        <div className="flex justify-center relative">
          <div className="w-64 h-64 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 via-orange-400/20 to-rose-400/20 rounded-full blur-2xl animate-pulse"></div>
            {mounted && (
              <Lottie
                animationData={cancelAnimation}
                loop={true}
                className="w-full h-full relative z-10"
              />
            )}
          </div>
        </div>

        {/* Title with Gradient */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-rose-600 dark:from-red-400 dark:via-orange-400 dark:to-rose-400 bg-clip-text text-transparent leading-tight pb-2">
            Thanh toán thất bại!
          </h1>
          <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 font-medium">
            Rất tiếc, giao dịch của bạn không thể hoàn tất. Vui lòng thử lại sau.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 py-3">
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-red-400 to-red-400"></div>
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <div className="h-px w-20 bg-gradient-to-l from-transparent via-red-400 to-red-400"></div>
        </div>

        {/* <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Button
            onClick={() => navigate("/")}
            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            <Home className="h-4 w-4" />
            Về trang chủ
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
            size="lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Thử lại
          </Button>
        </div> */}

        {/* Additional Info with Decorative Box */}
        <div className="mt-6 relative">
          <div className="inline-block bg-gradient-to-r from-red-50/80 via-orange-50/80 to-rose-50/80 dark:from-red-950/40 dark:via-orange-950/40 dark:to-rose-950/40 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 rounded-2xl px-6 py-4 shadow-lg">
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua{" "}
              <a
                href="mailto:emotocare@gmail.com"
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold underline decoration-2 underline-offset-2 transition-colors"
              >
                emotocare@gmail.com
              </a>
            </p>
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/5 w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-1/3 right-1/5 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.7s' }}></div>
        </div>
      </div>
    </div>
  );
}

