import { CalendarCheck, LogOut, Plus, List } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { authService } from "@/services/authService";

const menuItems = [
  {
    title: "Booking",
    icon: CalendarCheck,
    url: "/staff/booking",
    subItems: [
      { title: "Tạo lịch", icon: Plus, url: "/staff/booking/create" },
      { title: "Danh sách", icon: List, url: "/staff/booking/list" },
    ],
  },
  { title: "Bảo hành", icon: CalendarCheck, url: "/staff/warranty" },
];

export function StaffSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();

  // ✅ Kiểm tra xem có phải route booking không (bao gồm cả submenu)
  const isBookingActive = (item) => {
    if (item.subItems) {
      return item.subItems.some((sub) => location.pathname === sub.url);
    }
    return location.pathname === item.url || location.pathname.startsWith(item.url + "/");
  };

  return (
    <Sidebar collapsible='icon' className='border-r border-sidebar-border'>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = isBookingActive(item);
                
                // ✅ Nếu có subItems, render submenu
                if (item.subItems) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        className={isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""}>
                        <item.icon className='h-5 w-5 flex-shrink-0' />
                        {!isCollapsed && <span>{item.title}</span>}
                      </SidebarMenuButton>
                      {!isCollapsed && (
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => {
                            const isSubActive = location.pathname === subItem.url;
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isSubActive}>
                                  <NavLink
                                    to={subItem.url}
                                    className={({ isActive }) =>
                                      `flex items-center gap-2 ${
                                        isActive
                                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                          : ""
                                      }`
                                    }>
                                    <subItem.icon className='h-4 w-4 flex-shrink-0' />
                                    <span>{subItem.title}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                }

                // ✅ Nếu không có subItems, render như bình thường
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          }`
                        }>
                        <item.icon className='h-5 w-5 flex-shrink-0' />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    authService.logout();
                    window.location.href = "/login";
                  }}
                  tooltip="Logout">
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
