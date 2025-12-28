import {
  LayoutDashboard,
  Bike,
  Users,
  Store,
  Package,
  Megaphone,
  RefreshCw,
  LogOut,
  Car,
  Wrench,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";

const sections = [
  {
    label: "Tổng quan",
    items: [{ title: "Dashboard", icon: LayoutDashboard, url: "/admin" }],
  },
  {
    label: "Quản lý",
    items: [
      { title: "Model xe", icon: Car, url: "/admin/models" },
      { title: "Chi nhánh", icon: Store, url: "/admin/branches" },
      { title: "Gói dịch vụ", icon: Package, url: "/admin/service-packages" },
      { title: "Lịch bảo dưỡng", icon: Wrench, url: "/admin/maintenance-plans" },
      { title: "Chiến dịch", icon: Megaphone, url: "/admin/campaigns" },
      { title: "Người dùng", icon: Users, url: "/admin/users" },
    ],
  },
  {
    label: "Hệ thống",
    items: [{ title: "Đồng bộ OEM", icon: RefreshCw, url: "/admin/sync-oem" }],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();

  return (
    <>
      <style>{`
        :root {
          --sidebar-width: 19rem !important;
        }
        [data-sidebar="sidebar"] {
          background: #b71324 !important;
        }
      `}</style>
      <Sidebar
        collapsible='icon'
        className='border-r border-red-900/50 text-white'>
        <SidebarHeader className='px-4 py-5 border-b border-red-800/40'>
          <div
            className={cn(
              "flex items-center gap-3 transition-all duration-200",
              isCollapsed ? "justify-center" : "justify-center"
            )}>
            <div className='h-20 w-20 flex items-center justify-center'>
              <img
                src='/logowhite.png'
                alt='Logo'
                className='h-20 w-20 object-contain'
              />
            </div>
            {!isCollapsed && (
              <div>
                <p className='text-xl font-semibold leading-tight'>eMotoCare</p>
                <p className='text-sm text-red-100'>Quản trị viên</p>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className='px-3 py-4'>
          {sections.map((section) => (
            <div key={section.label} className='mb-5 last:mb-0'>
              {!isCollapsed && (
                <p className='px-2 mb-2 text-[11px] font-semibold tracking-wide text-red-100 uppercase'>
                  {section.label}
                </p>
              )}
              <SidebarMenu
                className={cn(
                  "space-y-1.6",
                  isCollapsed && "items-center space-y-2"
                )}>
                {section.items.map((item) => {
                  const isActive =
                    location.pathname === item.url ||
                    (item.url !== "/admin" &&
                      location.pathname.startsWith(item.url + "/"));

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                        className={cn(
                          "h-10 gap-3 rounded-lg px-4 text-sm font-medium transition-all",
                          !isCollapsed && "w-full",
                          isCollapsed && "justify-center px-0",
                          isActive
                            ? isCollapsed
                              ? "bg-white text-[#b71324] shadow-none"
                              : "bg-white text-[#b71324] border-l-4 border-white shadow-none"
                            : "text-red-100 hover:bg-red-900/40 hover:text-white"
                        )}>
                        <NavLink to={item.url}>
                          <item.icon
                            className={cn(
                              "h-5 w-5 flex-shrink-0",
                              isActive ? "text-[#b71324]" : "text-red-200"
                            )}
                          />
                          {!isCollapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          ))}
        </SidebarContent>

        <SidebarFooter className='px-3 py-4 border-t border-red-800/40 mt-auto'>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  authService.logout();
                  window.location.href = "/login";
                }}
                tooltip='Đăng xuất'
                className='gap-3 rounded-lg px-3 py-2 text-sm text-red-50 hover:bg-red-900/40 hover:text-white transition-all'>
                <LogOut className='h-5 w-5 flex-shrink-0 text-red-100' />
                {!isCollapsed && <span>Đăng xuất</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}

export function AdminTopHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName] = useState("Admin Service");
  const [initials] = useState("AS");
  const [avatarUrl] = useState("");

  return (
    <header className="h-14 bg-white border-b border-red-100 flex items-center justify-between px-4 sticky top-0 z-10 text-red-600 shrink-0">
      <SidebarTrigger className="text-red-600 shrink-0" />
      <button
        type="button"
        onClick={() => navigate("/admin/profile")}
        className="flex items-center gap-3 cursor-pointer hover:bg-red-50/60 rounded-full px-2 py-1 transition-colors shrink-0 ml-auto"
        aria-label="Mở hồ sơ"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-9 w-9 rounded-full object-cover border border-red-100 shrink-0"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold uppercase shrink-0">
            {initials}
          </div>
        )}
        <span className="text-sm font-semibold text-red-700 max-w-[200px] truncate leading-tight hidden sm:inline">
          {displayName}
        </span>
      </button>
    </header>
  );
}
