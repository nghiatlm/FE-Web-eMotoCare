import {
  LayoutDashboard,
  Info,
  Calendar,
  Users,
  FileText,
  LogOut,
  Boxes,
  AlertTriangle,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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
import { Layout, Avatar, Space } from "antd";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";
const { Header } = Layout;

const sections = [
  {
    label: "Tổng quan",
    items: [{ title: "Dashboard", icon: LayoutDashboard, url: "/manager" }],
  },
  {
    label: "Điều hành",
    items: [
      { title: "Thông tin chi tiết", icon: Info, url: "/manager/information" },
      { title: "Lịch hẹn", icon: Calendar, url: "/manager/appointments" },
      { title: "Nhân viên", icon: Users, url: "/manager/staff" },
      { title: "Bảo hành", icon: FileText, url: "/manager/warranty" },
      { title: "Kho tổng", icon: Boxes, url: "/manager/inventory" },
      { title: "Phụ tùng thiếu", icon: AlertTriangle, url: "/manager/missing-parts" },
    ],
  },
];

export function ManagerSidebar() {
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
      <Sidebar collapsible='icon' className='border-r border-red-900/50 text-white'>
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
                <p className='text-sm text-red-100'>Quản lý chi nhánh</p>
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
                    (item.url !== "/manager" &&
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
                className='gap-3 rounded-lg text-red-50 hover:bg-red-900/40 hover:text-white transition-all text-base'>
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

// Header (Ant Design) for manager layout
export function ManagerTopHeader() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("Quản lý");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [initials, setInitials] = useState("QL");

  useEffect(() => {
    const loadProfile = async () => {
      const accountId = user?.accountResponse?.id;
      const account = user?.accountResponse || user || {};
      try {
        if (accountId) {
          const res = await getStaffByAccountId(accountId);
          const staff = res?.data?.rowDatas?.[0];
          if (staff) {
            const name =
              `${staff.firstName || ""} ${staff.lastName || ""}`.trim() ||
              staff.account?.phone ||
              "Quản lý";
            const avatar = staff.avatarUrl || staff.account?.avatarUrl || "";
            const init =
              name
                .split(" ")
                .filter(Boolean)
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "QL";
            setDisplayName(name);
            setAvatarUrl(avatar);
            setInitials(init);
            return;
          }
        }
        const fallbackName =
          `${account.firstName || ""} ${account.lastName || ""}`.trim() ||
          account.phone ||
          "Quản lý";
        const fallbackInit =
          fallbackName
            .split(" ")
            .filter(Boolean)
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "QL";
        setDisplayName(fallbackName);
        setInitials(fallbackInit);
        setAvatarUrl(account.avatarUrl || "");
      } catch (error) {
        const account = user?.accountResponse || user || {};
        const fallbackName =
          `${account.firstName || ""} ${account.lastName || ""}`.trim() ||
          account.phone ||
          "Quản lý";
        const fallbackInit =
          fallbackName
            .split(" ")
            .filter(Boolean)
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "QL";
        setDisplayName(fallbackName);
        setInitials(fallbackInit);
        setAvatarUrl(account.avatarUrl || "");
      }
    };
    loadProfile();
  }, [user]);

  return (
    <Header
      className="flex items-center justify-between px-4"
      style={{
        background: "linear-gradient(90deg, #b71324 0%, #c81e32 50%, #b71324 100%)",
        height: 56,
        lineHeight: "56px",
        paddingInline: 16,
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      }}
    >
      <div className="flex items-center gap-3 text-white">
        <SidebarTrigger className="text-white" />
      </div>
      <Space size="middle" className="text-white">
        <div className="flex flex-col items-end leading-tight">
          <span className="text-sm font-semibold">{displayName}</span>
          <span className="text-[11px] text-red-50/90">Quản lý</span>
        </div>
        <Avatar src={avatarUrl} style={{ backgroundColor: "#fff", color: "#b71324" }}>
          {initials}
        </Avatar>
      </Space>
    </Header>
  );
}

