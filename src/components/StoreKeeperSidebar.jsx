import { FileText, Package, FileDown, FileUp } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, } from "@/components/ui/sidebar";

const menuItems = [
    { title: "Tồn kho phụ tùng", icon: Package, url: "/storekeeper" },
    { title: "Phiếu nhập", icon: FileDown, url: "/storekeeper/import-slips" },
    { title: "Phiếu xuất", icon: FileUp, url: "/storekeeper/export-slips" },
    { title: "Báo cáo", icon: FileText, url: "/storekeeper/reports" },
];

export function StoreKeeperSidebar() {
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
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}

