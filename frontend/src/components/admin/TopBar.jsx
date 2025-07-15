import { useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { selectUser, logoutUser } from '@/store/slices/authSlice'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronRight,
  Home,
  Sparkles,
  Command,
  Moon,
  Sun,
  Zap,
  Menu,
} from 'lucide-react'
import schoolLogo from '@/assets/logo/school.png'

// Breadcrumb configuration
const breadcrumbConfig = {
  '/admin/dashboard': [{ title: 'Dashboard', href: '/admin/dashboard' }],
  
  // Academic Management
  '/admin/students': [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Academic Management', href: '#' },
    { title: 'Students', href: '/admin/students' }
  ],
  '/admin/classes': [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Academic Management', href: '#' },
    { title: 'Classes', href: '/admin/classes' }
  ],
  '/admin/grades': [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Academic Management', href: '#' },
    { title: 'Grades', href: '/admin/grades' }
  ],
  '/admin/academic-years': [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Academic Management', href: '#' },
    { title: 'Academic Years', href: '/admin/academic-years' }
  ],
  
  // Financial Management
  '/admin/tariffs': [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Financial Management', href: '#' },
    { title: 'Tariffs', href: '/admin/tariffs' }
  ],
  '/admin/billing': [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Financial Management', href: '#' },
    { title: 'Billing', href: '/admin/billing' }
  ],
  '/admin/payments': [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Financial Management', href: '#' },
    { title: 'Payments', href: '/admin/payments' }
  ],
  '/admin/financial-reports': [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Financial Management', href: '#' },
    { title: 'Reports', href: '/admin/financial-reports' }
  ],
  
  // Administration
  '/admin/users': [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Administration', href: '#' },
    { title: 'User Management', href: '/admin/users' }
  ],
  '/admin/settings': [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Administration', href: '#' },
    { title: 'Settings', href: '/admin/settings' }
  ],
  '/admin/notifications': [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Administration', href: '#' },
    { title: 'Notifications', href: '/admin/notifications' }
  ],
  
  // Help & Support
  '/admin/support': [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Support', href: '/admin/support' }
  ],
  '/admin/privacy': [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Privacy & Security', href: '/admin/privacy' }
  ],
  
  // Profile
  '/admin/profile': [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Profile', href: '/admin/profile' }
  ],
}

export function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectUser)

  const breadcrumbs = breadcrumbConfig[location.pathname] || [
    { title: 'Dashboard', href: '/admin/dashboard' }
  ]

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      // Still navigate to login even if logout fails
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
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-green-200/20 bg-gradient-to-r from-white via-green-50/30 to-white backdrop-blur-sm px-4 md:px-6 shadow-sm">
      {/* Mobile Layout */}
      <div className="flex md:hidden items-center justify-between w-full">
        {/* Mobile Menu and Logo */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="hover:bg-green-100/50 text-green-700 hover:text-green-800 transition-all duration-300 rounded-lg p-2" />
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg shadow-sm border border-green-200/50">
              <img 
                src={schoolLogo} 
                alt="Saint Maria School" 
                className="w-6 h-6 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-green-800 text-sm">Saint Maria</span>
              <span className="text-green-600 text-xs font-medium">School</span>
            </div>
          </div>
        </div>

        {/* Mobile User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-green-100/50 transition-all duration-300 group p-0">
              <Avatar className="h-8 w-8 rounded-xl shadow-lg ring-2 ring-green-200/50 group-hover:ring-green-300/60 transition-all duration-300">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white font-bold text-sm rounded-xl">
                  {getUserInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-64 bg-white border border-gray-200 shadow-xl rounded-xl" 
            align="end" 
            forceMount
            sideOffset={8}
          >
            <DropdownMenuLabel className="font-normal p-0">
              <div className="flex flex-col space-y-3 p-4 bg-gradient-to-r from-green-50/80 to-green-100/50 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-xl shadow-lg ring-2 ring-green-200/50">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white font-bold rounded-xl">
                      {getUserInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-800">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-green-600 font-medium">
                      {user?.email || 'admin@school.com'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-100/50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">Online</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-green-200/30" />
            <div className="p-2 space-y-1">
              <DropdownMenuItem 
                onClick={() => navigate('/admin/profile')} 
                className="text-green-700 hover:bg-green-100/50 hover:text-green-800 transition-all duration-300 rounded-lg px-3 py-2 focus:bg-green-100/50 group"
              >
                <User className="mr-3 h-4 w-4 text-green-500 group-hover:text-green-600 transition-colors duration-300" />
                <span className="font-medium">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/admin/settings')} 
                className="text-green-700 hover:bg-green-100/50 hover:text-green-800 transition-all duration-300 rounded-lg px-3 py-2 focus:bg-green-100/50 group"
              >
                <Settings className="mr-3 h-4 w-4 text-green-500 group-hover:text-green-600 transition-colors duration-300" />
                <span className="font-medium">Settings</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="bg-green-200/30" />
            <div className="p-2">
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 rounded-lg px-3 py-2 focus:bg-red-50 group"
              >
                <LogOut className="mr-3 h-4 w-4 text-red-500 group-hover:text-red-600 transition-colors duration-300" />
                <span className="font-medium">Log out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-3 w-full">
        {/* Sidebar Trigger */}
        <SidebarTrigger className="hover:bg-green-100/50 text-green-700 hover:text-green-800 transition-all duration-300 rounded-lg p-2" />
        <Separator orientation="vertical" className="h-6 bg-green-200/40" />
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
            <Home className="h-4 w-4 text-white" />
          </div>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-green-400" />
              <button
                onClick={() => crumb.href !== '#' && navigate(crumb.href)}
                className={`hover:text-green-700 transition-all duration-300 px-2 py-1 rounded-md hover:bg-green-100/50 ${
                  index === breadcrumbs.length - 1
                    ? 'text-green-800 font-semibold bg-green-100/30'
                    : 'text-green-600 font-medium'
                } ${crumb.href === '#' ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {crumb.title}
              </button>
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search - Hidden on tablet, shown on desktop */}
        <div className="relative w-80 hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-50/30 rounded-xl blur-sm"></div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-green-500" />
            <Input
              placeholder="Search anything..."
              className="pl-10 pr-12 h-10 bg-white/80 border-green-200/50 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 rounded-xl shadow-sm transition-all duration-300 placeholder:text-green-400"
            />
            <div className="absolute right-3 top-2.5 flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-green-200 bg-green-50 px-1.5 font-mono text-[10px] font-medium text-green-600 opacity-100">
                <Command className="h-3 w-3" />
                <span className="text-xs">K</span>
              </kbd>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Search Button for tablet */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative h-10 w-10 rounded-xl hover:bg-green-100/50 text-green-600 hover:text-green-700 transition-all duration-300 group lg:hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-green-200/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Search className="h-4 w-4 relative z-10" />
          </Button>

          {/* Theme Toggle - Hidden on mobile */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative h-10 w-10 rounded-xl hover:bg-green-100/50 text-green-600 hover:text-green-700 transition-all duration-300 group hidden sm:flex"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-green-200/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Sun className="h-4 w-4 relative z-10" />
          </Button>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative h-10 w-10 rounded-xl hover:bg-green-100/50 text-green-600 hover:text-green-700 transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-green-200/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Bell className="h-4 w-4 relative z-10" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-lg flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">3</span>
            </span>
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></span>
          </Button>

          {/* Quick Actions - Hidden on mobile */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative h-10 w-10 rounded-xl hover:bg-green-100/50 text-green-600 hover:text-green-700 transition-all duration-300 group hidden sm:flex"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-green-200/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Zap className="h-4 w-4 relative z-10" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-green-100/50 transition-all duration-300 group p-0">
                <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-green-200/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Avatar className="h-9 w-9 rounded-xl shadow-lg ring-2 ring-green-200/50 group-hover:ring-green-300/60 transition-all duration-300">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white font-bold text-sm rounded-xl">
                    {getUserInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-64 bg-white border border-gray-200 shadow-xl rounded-xl" 
              align="end" 
              forceMount
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal p-0">
                <div className="flex flex-col space-y-3 p-4 bg-gradient-to-r from-green-50/80 to-green-100/50 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-xl shadow-lg ring-2 ring-green-200/50">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white font-bold rounded-xl">
                        {getUserInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800">{user?.name || 'Admin User'}</p>
                      <p className="text-xs text-green-600 font-medium">
                        {user?.email || 'admin@school.com'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-100/50 px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">Online</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-green-200/30" />
              <div className="p-2 space-y-1">
                <DropdownMenuItem 
                  onClick={() => navigate('/admin/profile')} 
                  className="text-green-700 hover:bg-green-100/50 hover:text-green-800 transition-all duration-300 rounded-lg px-3 py-2 focus:bg-green-100/50 group"
                >
                  <User className="mr-3 h-4 w-4 text-green-500 group-hover:text-green-600 transition-colors duration-300" />
                  <span className="font-medium">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/admin/settings')} 
                  className="text-green-700 hover:bg-green-100/50 hover:text-green-800 transition-all duration-300 rounded-lg px-3 py-2 focus:bg-green-100/50 group"
                >
                  <Settings className="mr-3 h-4 w-4 text-green-500 group-hover:text-green-600 transition-colors duration-300" />
                  <span className="font-medium">Settings</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="bg-green-200/30" />
              <div className="p-2">
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 rounded-lg px-3 py-2 focus:bg-red-50 group"
                >
                  <LogOut className="mr-3 h-4 w-4 text-red-500 group-hover:text-red-600 transition-colors duration-300" />
                  <span className="font-medium">Log out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
} 