import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar, AdminTopHeader } from "@/components/AdminSidebar";

// auth
import Login from "./pages/login/Login";
import ForgotPassword from "./pages/login/ForgotPassword";
import VerifyOTP from "./pages/login/VerifyOTP";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import VerifySuccess from "./pages/VerifySuccess";

// admin
import UserManagement from "./pages/admin/UserManagement";
import Index from "./pages/Index";
import Branches from "./pages/admin/Branches";
import BranchDetail from "./pages/admin/BranchDetail";
import BranchReport from "./pages/admin/BranchReport";
import ServicePackages from "./pages/ServicePackages";
import CreateServicePackage from "./pages/admin/CreateServicePackage";
import PartTypeDetail from "./pages/admin/PartTypeDetail";
import Campaigns from "./pages/admin/Campaigns";
import CampaignDetail from "./pages/admin/campaigns/CampaignDetail";
import CreateCampaign from "./pages/admin/CreateCampaign";
import CreateUserPage from "./pages/admin/CreateUserPage";
import UserDetail from "./pages/admin/UserDetail";
import SyncOEMData from "./pages/admin/SyncOEMData";
import Models from "./pages/admin/Models";
import ModelDetail from "./pages/admin/ModelDetail";
import MaintenancePlans from "./pages/admin/MaintenancePlans";
import MaintenancePlanDetail from "./pages/admin/MaintenancePlanDetail";
import AdminProfile from "./pages/admin/AdminProfile";
import NotFound from "./pages/NotFound";

// service staff
import { StaffSidebar, StaffTopHeader } from "./components/service-staff/StaffSidebar";
import StaffDashboard from "./pages/service-staff/StaffDashboard";
import StaffBooking from "./pages/service-staff/StaffBooking";
import CreateBooking from "./pages/service-staff/CreateBooking";
import StaffWarrantyPage from "./pages/service-staff/StaffWarrantyPage";
import StaffRMADetailPage from "./pages/service-staff/StaffRMADetailPage";
import StaffBookingDetailPage from "./pages/service-staff/StaffBookingDetailPage";
import StaffVehicleHistoryPage from "./pages/service-staff/StaffVehicleHistoryPage";
import StaffVehicleRepairHistoryPage from "./pages/service-staff/StaffVehicleRepairHistoryPage";
import StaffProfile from "./pages/service-staff/StaffProfile";

// technician
import { TechnicianSidebar, TechnicianTopHeader } from "./components/technician/TechnicanSidebar";
import TechnicianDashboard from "./pages/technician/TechnicianDashboard";
import TechnicianPage from "./pages/technician/TechnicianPage";
import TechnicianBookingDetailPage from "./pages/technician/TechnicianBookingDetailPage";
import BatteryDetailPage from "./pages/technician/BatteryDetailPage";
import TechnicianProfile from "./pages/technician/TechnicianProfile";

// manager
import { ManagerSidebar, ManagerTopHeader } from "./components/ManagerSidebar";
import Dashboard from "./pages/manager/Dashboard";
import InformationDetail from "./pages/manager/InformationDetail";
import AppointmentsList from "./pages/manager/AppointmentsList";
import AppointmentDetail from "./pages/manager/AppointmentDetail";
import StaffList from "./pages/manager/StaffList";
import StaffDetail from "./pages/manager/StaffDetail";
import WarrantyList from "./pages/manager/WarrantyList";
import WarrantyDetail from "./pages/manager/WarrantyDetail";
import MissingPartsList from "./pages/manager/MissingPartsList";
import MissingPartDetail from "./pages/manager/MissingPartDetail";
import ManagerProfile from "./pages/manager/ManagerProfile";
import ProtectedRoute from "./routes/ProtectedRoute";
import InventorySummary from "./pages/manager/InventorySummary";
import InventoryDetail from "./pages/manager/InventoryDetail";

// storekeeper
import { StoreKeeperSidebar, StoreKeeperTopHeader } from "./components/StoreKeeperSidebar";
import StorekeeperInventory from "./pages/storekeeper/StorekeeperInventory";
import StorekeeperAccessoryDetail from "./pages/storekeeper/StorekeeperAccessoryDetail";
import ImportSlipsPage from "./pages/storekeeper/ImportSlipsPage";
import ImportNoteDetail from "./pages/storekeeper/ImportNoteDetail";
import ExportSlipsPage from "./pages/storekeeper/ExportSlipsPage";
import CreateExportSlipPage from "./pages/storekeeper/CreateExportSlipPage";
import ExportNoteDetail from "./pages/storekeeper/ExportNoteDetail";
import CreateImportNotePage from "./pages/storekeeper/CreateImportNotePage";
import StoreKeeperProfile from "./pages/storekeeper/StoreKeeperProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={5}
        style={{ zIndex: 9999 }}
        toastClassName="!rounded-lg !shadow-lg"
        bodyClassName="!text-sm"
        progressClassName="!bg-green-500"
      />
        <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />
        <Route path="/verify-success" element={<VerifySuccess />} />

          <Route
          path="/admin/*"
            element={
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
              <SidebarProvider>
                <div className="flex min-h-screen w-full">
                  <AdminSidebar />
                  <div className="flex-1 flex flex-col">
                  <AdminTopHeader />
                    <main className="flex-1">
                      <Routes>
                        <Route path="" element={<Index />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="users/create" element={<CreateUserPage />} />
                        <Route path="users/:id" element={<UserDetail />} />
                        <Route path="branches" element={<Branches />} />
                        <Route path="branches/:id" element={<BranchDetail />} />
                        <Route
                          path="branches/:id/report"
                          element={<BranchReport />}
                        />
                        <Route path="models" element={<Models />} />
                        <Route path="models/:id" element={<ModelDetail />} />
                        <Route
                          path="service-packages"
                          element={<ServicePackages />}
                        />
                        <Route
                          path="service-packages/create"
                          element={<CreateServicePackage />}
                        />
                        <Route
                          path="service-packages/part-type/:id"
                          element={<PartTypeDetail />}
                        />
                        <Route path="campaigns" element={<Campaigns />} />
                        <Route
                          path="campaigns/new"
                          element={<CreateCampaign />}
                        />
                        <Route
                          path="campaigns/:id"
                          element={<CampaignDetail />}
                        />
                        <Route
                          path="sync-oem"
                          element={<SyncOEMData />}
                        />
                        <Route
                          path="maintenance-plans"
                          element={<MaintenancePlans />}
                        />
                        <Route
                          path="maintenance-plans/:id"
                          element={<MaintenancePlanDetail />}
                        />
                        <Route path="profile" element={<AdminProfile />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={["ROLE_STAFF"]}>
              <SidebarProvider>
                <div className="flex min-h-screen w-full">
                  <StaffSidebar />
                  <div className="flex-1 flex flex-col">
                    <StaffTopHeader />
                    <main className="flex-1">
                      <Routes>
                        <Route
                          path=""
                          element={<Navigate to="dashboard" replace />}
                        />
                        <Route path="dashboard" element={<StaffDashboard />} />
                        <Route
                          path="booking/create"
                          element={<CreateBooking />}
                        />
                        <Route path="booking/list" element={<StaffBooking />} />
                        <Route
                          path="booking"
                          element={<Navigate to="booking/list" replace />}
                        />
                        <Route
                          path="booking/:id"
                          element={<StaffBookingDetailPage />}
                        />
                        <Route path="warranty" element={<StaffWarrantyPage />} />
                        <Route
                          path="warranty/:rmaId"
                          element={<StaffRMADetailPage />}
                        />
                        <Route
                          path="vehicles"
                          element={<StaffVehicleHistoryPage />}
                        />
                        <Route
                          path="vehicles/:vehicleId/history"
                          element={<StaffVehicleRepairHistoryPage />}
                        />
                        <Route
                          path="battery/:evCheckDetailId"
                          element={<BatteryDetailPage />}
                        />
                        <Route path="profile" element={<StaffProfile />} />

                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          }
        />

        <Route
          path="/technician/*"
          element={
            <ProtectedRoute allowedRoles={["ROLE_TECHNICIAN"]}>
              <SidebarProvider>
                <div className="flex min-h-screen w-full">
                  <TechnicianSidebar />
                  <div className="flex-1 flex flex-col">
                    <TechnicianTopHeader />
                    <main className="flex-1">
                      <Routes>
                        <Route
                          path=""
                          element={<Navigate to="dashboard" replace />}
                        />
                        <Route
                          path="dashboard"
                          element={<TechnicianDashboard />}
                        />
                        <Route path="vehicles" element={<TechnicianPage />} />
                        <Route
                          path="vehicles/:id"
                          element={<TechnicianBookingDetailPage />}
                        />
                        <Route
                          path="battery/:evCheckDetailId"
                          element={<BatteryDetailPage />}
                        />
                        <Route path="profile" element={<TechnicianProfile />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          }
        />

        <Route
          path="/storekeeper/*"
          element={
            <ProtectedRoute allowedRoles={["ROLE_STOREKEEPER"]}>
              <SidebarProvider>
                <div className="flex min-h-screen w-full">
                  <StoreKeeperSidebar />
                  <div className="flex-1 flex flex-col">
                    <StoreKeeperTopHeader />
                    <main className="flex-1">
                      <Routes>
                        <Route path="" element={<StorekeeperInventory />} />
                        <Route
                          path="accessories/:inventoryId/:partCode"
                          element={<StorekeeperAccessoryDetail />}
                        />
                        <Route
                          path="import-slips"
                          element={<ImportSlipsPage />}
                        />
                        <Route
                          path="import-slips/create"
                          element={<CreateImportNotePage />}
                        />
                        <Route
                          path="import-slips/:id"
                          element={<ImportNoteDetail />}
                        />
                        <Route
                          path="export-slips"
                          element={<ExportSlipsPage />}
                        />
                        <Route
                          path="export-slips/:id"
                          element={<ExportNoteDetail />}
                        />
                        <Route
                          path="export-slips/create"
                          element={<CreateExportSlipPage />}
                        />
                    <Route path="profile" element={<StoreKeeperProfile />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/*"
          element={
            <ProtectedRoute allowedRoles={["ROLE_MANAGER"]}>
              <SidebarProvider>
                <div className="flex min-h-screen w-full">
                  <ManagerSidebar />
                  <div className="flex-1 flex flex-col">
                    <ManagerTopHeader />
                    <main className="flex-1">
                      <Routes>
                        <Route path="" element={<Dashboard />} />
                        <Route
                          path="information"
                          element={<InformationDetail />}
                        />
                        <Route
                          path="appointments"
                          element={<AppointmentsList />}
                        />
                        <Route
                          path="appointments/:id"
                          element={<AppointmentDetail />}
                        />
                        <Route path="staff" element={<StaffList />} />
                        <Route path="staff/:id" element={<StaffDetail />} />
                        <Route path="warranty" element={<WarrantyList />} />
                        <Route
                          path="warranty/:id"
                          element={<WarrantyDetail />}
                        />
                        <Route
                          path="inventory"
                          element={<InventorySummary />}
                        />
                        <Route
                          path="inventory/:inventoryId/:partCode"
                          element={<InventoryDetail />}
                        />
                        <Route
                          path="missing-parts"
                          element={<MissingPartsList />}
                        />
                        <Route
                          path="missing-parts/:id"
                          element={<MissingPartDetail />}
                        />
                        <Route path="profile" element={<ManagerProfile />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
            }
          />

        <Route path="*" element={<NotFound />} />
        </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
