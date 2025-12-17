import { Package, FileDown, FileUp, LogOut } from "lucide-react";
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
    label: "Kho",
    items: [{ title: "Tồn kho phụ tùng", icon: Package, url: "/storekeeper" }],
  },
  {
    label: "Giao dịch",
    items: [
      { title: "Phiếu nhập", icon: FileDown, url: "/storekeeper/import-slips" },
      { title: "Phiếu xuất", icon: FileUp, url: "/storekeeper/export-slips" },
    ],
  },
];

export function StoreKeeperSidebar() {
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
                <p className='text-sm text-red-100'>Thủ kho</p>
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
                    (item.url !== "/storekeeper" &&
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

export function StoreKeeperTopHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("Thủ kho");
  const [initials, setInitials] = useState("TK");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const storedUser = (() => {
        try {
          return JSON.parse(localStorage.getItem("user")) || {};
        } catch {
          return {};
        }
      })();
      const account = user?.accountResponse || user?.user || user || storedUser || {};
      const accountId = account.id || account.accountId;
      try {
        if (accountId) {
          const res = await getStaffByAccountId(accountId, { page: 1, pageSize: 10 });
          const staff = res?.data?.rowDatas?.[0];
          if (staff) {
            const name =
              `${staff.firstName || ""} ${staff.lastName || ""}`.trim() ||
              staff.account?.phone ||
              "Thủ kho";
            const avatar = staff.avatarUrl || staff.account?.avatarUrl || "";
            const init =
              name
                .split(" ")
                .filter(Boolean)
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "TK";
            setDisplayName(name);
            setAvatarUrl(avatar);
            setInitials(init);
            return;
          }
        }
        const fallbackName =
          `${account.firstName || ""} ${account.lastName || ""}`.trim() ||
          account.phone ||
          account.email ||
          "Thủ kho";
        const fallbackInit =
          fallbackName
            .split(" ")
            .filter(Boolean)
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "TK";
        setDisplayName(fallbackName);
        setInitials(fallbackInit);
        setAvatarUrl(account.avatarUrl || "");
      } catch (error) {
        const account = user?.accountResponse || user?.user || user || storedUser || {};
        const fallbackName =
          `${account.firstName || ""} ${account.lastName || ""}`.trim() ||
          account.phone ||
          account.email ||
          "Thủ kho";
        const fallbackInit =
          fallbackName
            .split(" ")
            .filter(Boolean)
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "TK";
        setDisplayName(fallbackName);
        setInitials(fallbackInit);
        setAvatarUrl(account.avatarUrl || "");
      }
    };
    loadProfile();
  }, [user]);

  return (
    <header className="h-14 bg-white border-b border-red-100 flex items-center justify-between px-4 pr-6 sticky top-0 z-10 text-red-600">
      <SidebarTrigger className="text-red-600" />
      <button
        type="button"
        onClick={() => navigate("/storekeeper/profile")}
        className="flex items-center gap-3 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
        aria-label="Xem hồ sơ thủ kho"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-9 w-9 rounded-full object-cover border border-red-100"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold uppercase">
            {initials}
          </div>
        )}
        <span className="text-sm font-semibold text-red-700 max-w-[200px] truncate leading-tight">
          {displayName}
        </span>
      </button>
    </header>
  );
}

