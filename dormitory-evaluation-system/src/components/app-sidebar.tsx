"use client"

import { Home, Users, FileText, BarChart, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

import { NavUser } from "@/components/nav-user"
import useUser from "@/hooks/useUser"
import { GalleryVerticalEnd } from "lucide-react"

// Menu items.
const items = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Dormers", url: "/dormers", icon: Users },
  { title: "Evaluation", url: "/#", icon: FileText },
  { title: "Results", url: "/#", icon: BarChart },
  { title: "Settings", url: "/#", icon: Settings },
]

export function AppSidebar() {
  const user = useUser()

  const navUser = {
    name:
      (user as any)?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Guest",
    email: user?.email ?? "",
    avatar: (user as any)?.user_metadata?.avatar_url ?? "",
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarHeader>
          
          <div className="flex items-center">
            <GalleryVerticalEnd className="h-4 w-4 m-2" />
            <h1 className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden text-primary">
              Dormitory Evaluation System
            </h1>
          </div>
        </SidebarHeader>

        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="text-primary" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="flex-1" />

        <SidebarFooter>
          <NavUser user={navUser} />
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  )
}