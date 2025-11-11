import { LayoutDashboard, Info, Calendar, Users, FileText, LogOut, Boxes } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, } from "@/components/ui/sidebar";
import { authService } from "@/services/authService";

const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, url: "/manager" },
    { title: "Thông tin chi tiết", icon: Info, url: "/manager/information" },
    { title: "Lịch hẹn", icon: Calendar, url: "/manager/appointments" },
    { title: "Nhân viên", icon: Users, url: "/manager/staff" },
    { title: "Bảo hành", icon: FileText, url: "/manager/warranty" },
    { title: "Kho tổng", icon: Boxes, url: "/manager/inventory" },
];

export function ManagerSidebar() {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    
    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <NavLink 
                                            to={item.url} 
                                            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                                isActive
                                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                                            }`}
                                        >
                                            <item.icon className="h-5 w-5 flex-shrink-0"/>
                                            {!isCollapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => {
                                        authService.logout();
                                        window.location.href = "/login";
                                    }}
                                    tooltip="Logout"
                                >
                                    <LogOut className="h-5 w-5 flex-shrink-0"/>
                                    {!isCollapsed && <span>Logout</span>}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}

