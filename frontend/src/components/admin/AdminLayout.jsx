import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { TopBar } from './TopBar'

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar */}
        <AppSidebar />
        
        {/* Main Content */}
        <SidebarInset className="flex flex-col flex-1">
          {/* Top Bar */}
          <TopBar />
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 