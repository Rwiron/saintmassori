import { useNavigate, useLocation } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { selectUser, logoutUser } from '@/store/slices/authSlice'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Home,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  Calendar,
  Settings,
  LogOut,
  User,
  ChevronDown,
  ChevronRight,
  BarChart3,
  CreditCard,
  UserCheck,
  Building2,
  HelpCircle,
  Shield,
  Bell,
  Receipt,
} from 'lucide-react'
import schoolLogo from '@/assets/logo/school.png'

// Navigation data structure - clean and simple
const navMain = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Academic ",
    icon: GraduationCap,
    items: [
      {
        title: "Academic Yrs",
        url: "/admin/academic-years",
        icon: Calendar,
      },
      {
        title: "Terms",
        url: "/admin/terms",
        icon: Calendar,
      },
      {
        title: "Classes",
        url: "/admin/classes",
        icon: Building2,
      },
      {
        title: "Grades",
        url: "/admin/grades",
        icon: BookOpen,
      },
      {
        title: "Students",
        url: "/admin/students",
        icon: Users,
      },
    ],
  },
  {
    title: "Financial ",
    icon: DollarSign,
    items: [
      {
        title: "Tariffs",
        url: "/admin/tariffs",
        icon: Receipt,
      },
      {
        title: "Billing",
        url: "/admin/billing",
        icon: CreditCard,
      },
      {
        title: "Payments",
        url: "/admin/payments",
        icon: DollarSign,
      },
    ],
  },
  {
    title: "Reports",
    icon: BarChart3,
    items: [
      {
        title: "Class Tariff Reports",
        url: "/admin/reports/class-tariff",
        icon: BarChart3,
      },
      // {
      //   title: "Financial Reports",
      //   url: "/admin/reports/financial",
      //   icon: DollarSign,
      // },
    ],
  },
  {
    title: "Administration",
    icon: Settings,
    items: [
      {
        title: "User Management",
        url: "/admin/users",
        icon: UserCheck,
      },
      {
        title: "System Settings",
        url: "/admin/settings",
        icon: Settings,
      },
      {
        title: "Notifications",
        url: "/admin/notifications",
        icon: Bell,
      },
    ],
  },
];

const navSecondary = [
  {
    title: "Support",
    url: "/admin/support",
    icon: HelpCircle,
  },
  {
    title: "Privacy & Security",
    url: "/admin/privacy",
    icon: Shield,
  },
]

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectUser)

  const handleNavigation = (url) => {
    navigate(url)
  }

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      navigate('/login')
    }
  }

  const getUserInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-green-200 bg-green-600 w-64">
      <SidebarHeader className="border-b border-green-500 bg-green-600 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-green-500 hover:bg-green-500 text-white transition-colors duration-200 h-14 px-3"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm">
                <img 
                  src={schoolLogo} 
                  alt="Saint Maria School" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-white text-lg">Saint Maria</span>
                <span className="text-green-100 text-sm font-medium">School Management</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-green-600 px-3 py-4 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="text-green-100 font-semibold text-xs uppercase tracking-wide mb-2 px-2">
            Platform Management
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {navMain.map((item) => (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.items?.some(subItem => location.pathname === subItem.url)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  {item.items ? (
                    <>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          tooltip={item.title}
                          className="hover:bg-green-500 text-white hover:text-white transition-colors duration-200 rounded-lg h-10 w-full justify-start px-3"
                        >
                          {item.icon && <item.icon className="w-5 h-5 mr-3" />}
                          <span className="font-medium">{item.title}</span>
                          <ChevronRight className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="ml-8 mt-1 space-y-1">
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={location.pathname === subItem.url}
                                className="hover:bg-green-500 data-[active=true]:bg-green-700 text-green-100 hover:text-white data-[active=true]:text-white transition-colors duration-200 rounded-lg h-9 w-full justify-start px-3"
                              >
                                <button onClick={() => handleNavigation(subItem.url)}>
                                  <subItem.icon className="w-4 h-4 mr-3" />
                                  <span className="font-medium">{subItem.title}</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </>
                  ) : (
                    <SidebarMenuButton
                      tooltip={item.title}
                      onClick={() => handleNavigation(item.url)}
                      isActive={location.pathname === item.url}
                      className="hover:bg-green-500 data-[active=true]:bg-green-700 text-white hover:text-white data-[active=true]:text-white transition-colors duration-200 rounded-lg h-10 w-full justify-start px-3"
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <Separator className="bg-green-500 my-4" />

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="text-green-100 font-semibold text-xs uppercase tracking-wide mb-2 px-2">
            Help & Support
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {navSecondary.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  isActive={location.pathname === item.url}
                  className="hover:bg-green-500 data-[active=true]:bg-green-700 text-green-100 hover:text-white data-[active=true]:text-white transition-colors duration-200 rounded-lg h-9 w-full justify-start px-3"
                >
                  <button onClick={() => handleNavigation(item.url)}>
                    <item.icon className="w-4 h-4 mr-3" />
                    <span className="font-medium">{item.title}</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-green-500 bg-green-600 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-green-500 hover:bg-green-500 text-white transition-colors duration-200 h-12 px-3"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="rounded-lg bg-green-700 text-white font-bold text-sm">
                      {getUserInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left flex-1">
                    <span className="font-semibold text-white text-sm">{user?.name || 'Admin User'}</span>
                    <span className="text-green-100 text-xs font-medium">
                      {user?.email || 'admin@school.com'}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto w-4 h-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg"
                side="bottom"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 px-3 py-3">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="rounded-lg bg-green-600 text-white font-bold text-sm">
                        {getUserInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 text-sm">{user?.name || 'Admin User'}</span>
                      <span className="text-gray-600 text-xs">
                        {user?.email || 'admin@school.com'}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate('/admin/profile')} 
                  className="text-gray-700 hover:bg-gray-100 transition-colors duration-200 px-3 py-2"
                >
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/admin/settings')} 
                  className="text-gray-700 hover:bg-gray-100 transition-colors duration-200 px-3 py-2"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-red-600 hover:bg-red-50 transition-colors duration-200 px-3 py-2"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
} 