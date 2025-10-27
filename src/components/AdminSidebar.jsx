import { LayoutDashboard, Bike, FileText, Users, BarChart3, Settings, Store } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, } from "@/components/ui/sidebar";
const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, url: "/admin" },
    { title: "Vehicles", icon: Bike, url: "/admin/vehicles" },
    { title: "Warranty Claims", icon: FileText, url: "/admin/warranty-claims" },
    { title: "Branches", icon: Store, url: "/admin/branches" },
    { title: "Users", icon: Users, url: "/admin/users" },
    { title: "Reports", icon: BarChart3, url: "/admin/reports" },
    { title: "Settings", icon: Settings, url: "/admin/settings" },
];
export function AdminSidebar() {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    return (<Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (<SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}>
                      <item.icon className="h-5 w-5 flex-shrink-0"/>
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>);
}
