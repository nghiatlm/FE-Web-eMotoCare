import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
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
import ServicePackages from "./pages/ServicePackages";
import NotFound from "./pages/NotFound";

// storekeeper
import { StoreKeeperSidebar } from "./components/StoreKeeperSidebar";
import AccessoryInventory from "./pages/storekeeper/AccessoryInventory";
import AccessoryDetail from "./pages/storekeeper/AccessoryDetail";
import ImportSlipsPage from "./pages/storekeeper/ImportSlipsPage";
import ExportSlipsPage from "./pages/storekeeper/ExportSlipsPage";
import ExportNoteDetail from "./pages/storekeeper/ExportNoteDetail";

// service staff
import { StaffSidebar } from "./components/service-staff/StaffSidebar";
import StaffBooking from "./pages/service-staff/StaffBooking";

// technician
import { TechnicianSidebar } from "./components/technician/TechnicanSidebar";
import TechnicianPage from "./pages/technician/TechnicianPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <Routes>
        <Route path='/' element={<Navigate to='/login' replace />} />
        <Route path='/login' element={<Login />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />

        <Route
          path='/admin/*'
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
                      <Route path='' element={<Index />} />
                      <Route path='users' element={<UserManagement />} />
                      <Route path='branches' element={<Branches />} />
                      <Route
                        path='warranty-claims'
                        element={<WarrantyClaims />}
                      />
                      <Route path='vehicles' element={<Vehicles />} />
                      <Route path='service-packages' element={<ServicePackages />} />
                      <Route path='*' element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          }
        />

        <Route
          path='/staff/*'
          element={
            <SidebarProvider>
              <div className='flex min-h-screen w-full'>
                <StaffSidebar />
                <div className='flex-1 flex flex-col'>
                  <header className='h-14 border-b border-border bg-card flex items-center px-4 sticky top-0 z-10'>
                    <SidebarTrigger className='text-foreground' />
                  </header>
                  <main className='flex-1'>
                    <Routes>
                      <Route
                        path=''
                        element={<Navigate to='booking' replace />}
                      />
                      <Route path='booking' element={<StaffBooking />} />
                      <Route path='*' element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          }
        />

        <Route
          path='/technician/*'
          element={
            <SidebarProvider>
              <div className='flex min-h-screen w-full'>
                <TechnicianSidebar />
                <div className='flex-1 flex flex-col'>
                  <header className='h-14 border-b border-border bg-card flex items-center px-4 sticky top-0 z-10'>
                    <SidebarTrigger className='text-foreground' />
                  </header>
                  <main className='flex-1'>
                    <Routes>
                      <Route
                        path=''
                        element={<Navigate to='vehicles' replace />}
                      />
                      <Route path='vehicles' element={<TechnicianPage />} />
                      <Route path='*' element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          }
        />

        <Route
          path='/storekeeper/*'
          element={
            <SidebarProvider>
              <div className='flex min-h-screen w-full'>
                <StoreKeeperSidebar />
                <div className='flex-1 flex flex-col'>
                  <header className='h-14 border-b border-border bg-card flex items-center px-4 sticky top-0 z-10'>
                    <SidebarTrigger className='text-foreground' />
                  </header>
                  <main className='flex-1'>
                    <Routes>
                      <Route path='' element={<AccessoryInventory />} />
                      <Route path='accessories' element={<AccessoryInventory />} />
                      <Route path='accessories/:id' element={<AccessoryDetail />} />
                      <Route path='import-slips' element={<ImportSlipsPage />} />
                      <Route path='export-slips' element={<ExportSlipsPage />} />
                      <Route path='export-slips/:id' element={<ExportNoteDetail />} />
                      <Route path='reports' element={<NotFound />} />
                      <Route path='*' element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          }
        />

        <Route path='*' element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
