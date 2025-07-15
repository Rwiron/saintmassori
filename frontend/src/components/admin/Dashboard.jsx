import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  BookOpen,
  TrendingUp,
  Calendar,
  Bell,
  Plus
} from 'lucide-react'

export function Dashboard() {
  const stats = [
    {
      title: 'Total Students',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      description: 'Active students this semester'
    },
    {
      title: 'Total Classes',
      value: '45',
      change: '+3',
      changeType: 'positive',
      icon: GraduationCap,
      description: 'Classes across all grades'
    },
    {
      title: 'Revenue',
      value: '$45,231',
      change: '+8%',
      changeType: 'positive',
      icon: DollarSign,
      description: 'Monthly revenue'
    },
    {
      title: 'Courses',
      value: '156',
      change: '+5',
      changeType: 'positive',
      icon: BookOpen,
      description: 'Available courses'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'student',
      message: 'New student John Doe enrolled in Grade 10',
      time: '2 hours ago',
      icon: Users
    },
    {
      id: 2,
      type: 'payment',
      message: 'Payment received from Mary Johnson',
      time: '4 hours ago',
      icon: DollarSign
    },
    {
      id: 3,
      type: 'class',
      message: 'New class "Advanced Mathematics" created',
      time: '6 hours ago',
      icon: GraduationCap
    },
    {
      id: 4,
      type: 'system',
      message: 'System backup completed successfully',
      time: '8 hours ago',
      icon: Bell
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening at Saint Maria School.
          </p>
        </div>
        <Button className="bg-[#03a002] hover:bg-[#028a01]">
          <Plus className="mr-2 h-4 w-4" />
          Quick Action
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={`inline-flex items-center ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {stat.change}
                </span>
                {' '}from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and activities in your school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Frequently used actions and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Add New Student
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <GraduationCap className="mr-2 h-4 w-4" />
              Create Class
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <DollarSign className="mr-2 h-4 w-4" />
              Generate Bill
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Academic Calendar
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Courses
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Academic Year Progress</CardTitle>
            <CardDescription>2024-2025 Academic Year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>65%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-[#03a002] h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-xs text-muted-foreground">
                8 months remaining in current academic year
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>All systems operational</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Payment Gateway</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Backup System</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Online</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 