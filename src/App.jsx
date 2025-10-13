import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
// auth
import Login from "./pages/login/Login";
import ForgotPassword from "./pages/login/ForgotPassword";

// admin
import WarrantyClaims from "./pages/WarrantyClaims";
import Vehicles from "./pages/Vehicles";
import UserManagement from "./pages/UserManagement";
import Index from "./pages/Index";
import Branches from "./pages/Branches";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* ✅ Mở web vào thẳng màn login */}
          <Route path='/' element={<Navigate to='/login' replace />} />
          {/* ✅ Route login nằm riêng ngoài layout */}
          <Route path='/login' element={<Login />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />

          {/* ✅ Các route admin giữ nguyên */}
          <Route
            path='/*'
            element={
              <SidebarProvider>
                <div className='flex min-h-screen w-full'>
                  <AdminSidebar />
                  <div className='flex-1 flex flex-col'>
                    <header className='h-14 border-b border-border bg-card flex items-center px-4 sticky top-0 z-10'>
                      <SidebarTrigger className='text-foreground' />
                    </header>
                    <main className='flex-1'>
                      <Routes>
                        <Route path='/admin' element={<Index />} />
                        <Route path='/users' element={<UserManagement />} />
                        <Route path='/branches' element={<Branches />} />
                        <Route
                          path='/warranty-claims'
                          element={<WarrantyClaims />}
                        />
                        <Route path='/vehicles' element={<Vehicles />} />
                        <Route path='*' element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
