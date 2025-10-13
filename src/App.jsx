import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import WarrantyClaims from "./pages/WarrantyClaims";
import Vehicles from "./pages/Vehicles";
import UserManagement from "./pages/UserManagement";
import Index from "./pages/Index";
import Branches from "./pages/Branches";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();
const App = () => (<QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AdminSidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-14 border-b border-border bg-card flex items-center px-4 sticky top-0 z-10">
                <SidebarTrigger className="text-foreground"/>
              </header>
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />}/>
                  <Route path="/users" element={<UserManagement />}/>
                  <Route path="/branches" element={<Branches />}/>
                  <Route path="/warranty-claims" element={<WarrantyClaims />}/>
                  <Route path="/vehicles" element={<Vehicles />}/>
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />}/>
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>);
export default App;
