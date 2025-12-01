import { LayoutDashboard, Bike, Users, Store, Package, Megaphone, RefreshCw, LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, } from "@/components/ui/sidebar";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";

const menuItems = [
    { title: "Tổng quan", icon: LayoutDashboard, url: "/admin" },
    { title: "Xe", icon: Bike, url: "/admin/vehicles" },
    { title: "Chi nhánh", icon: Store, url: "/admin/branches" },
    { title: "Gói dịch vụ", icon: Package, url: "/admin/service-packages" },
    { title: "Campaign", icon: Megaphone, url: "/admin/campaigns" },
    { title: "Người dùng", icon: Users, url: "/admin/users" },
    { title: "Đồng bộ OEM", icon: RefreshCw, url: "/admin/sync-oem" },
];

export function AdminSidebar() {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    const location = useLocation();

    return (
        <>
            <style>{`
                [data-sidebar="sidebar"] {
                    background: #c52020 !important;
                    --sidebar-accent-foreground: #c52020 !important;
                    --sidebar-primary: #c52020 !important;
                    --sidebar-ring: #c52020 !important;
                }
                [data-sidebar="sidebar"] [data-active="true"] {
                    color: #c52020 !important;
                }
                [data-sidebar="sidebar"] [data-sidebar="menu-button"][data-active="true"],
                [data-sidebar="sidebar"] [data-sidebar="menu-button"][data-active="true"] span,
                [data-sidebar="sidebar"] [data-sidebar="menu-button"][data-active="true"] svg {
                    color: #c52020 !important;
                }
                :root {
                    --sidebar-width: 20rem !important;
                }
            `}</style>
            <Sidebar 
                collapsible="icon" 
            >
                <SidebarHeader className="p-4 border-b border-red-800/30 dark:border-red-800/50">
                    <div className="flex items-center justify-center">
                        <img 
                            src="/logowhite.png" 
                            alt="Logo" 
                            className={isCollapsed ? "h-16 w-16 object-contain" : "h-20 w-20 object-contain"}
                        />
                    </div>
                </SidebarHeader>

                <SidebarContent className="p-3">
                    <SidebarMenu className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.url || 
                                (item.url !== "/admin" && location.pathname.startsWith(item.url + "/"));
                            
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton 
                                        asChild 
                                        tooltip={item.title}
                                        isActive={isActive}
                                    className={cn(
                                        "gap-3 rounded-lg transition-all text-base",
                                        isActive 
                                            ? "bg-red-100 !text-[#c52020] font-semibold shadow-lg hover:bg-red-200 [&>svg]:!text-[#c52020] [&>span]:!text-[#c52020]" 
                                            : "text-white/90 hover:bg-red-900/50 hover:text-white"
                                    )}
                                    >
                                        <NavLink to={item.url} className={isActive ? "[&_svg]:!text-[#c52020] [&_span]:!text-[#c52020]" : ""}>
                                            <item.icon className="h-5 w-5 flex-shrink-0" />
                                            {!isCollapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarContent>

                <SidebarFooter className="p-3 border-t border-red-800/30 dark:border-red-800/50">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => {
                                    authService.logout();
                                    window.location.href = "/login";
                                }}
                                tooltip="Đăng xuất"
                                className="gap-3 rounded-lg text-white/90 hover:bg-red-900/50 hover:text-white transition-all text-base"
                            >
                                <LogOut className="h-5 w-5 flex-shrink-0" />
                                {!isCollapsed && <span>Đăng xuất</span>}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
        </>
    );
}
