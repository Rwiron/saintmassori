import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  FileText, 
  Search, 
  Filter, 
  Download,
  Calendar,
  Building,
  User,
  AlertCircle
} from 'lucide-react'

export function ContractManagementPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Contract Management"
        description="View and manage contracts with business partners and institutions."
        variant="blue"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
            <Plus className="w-4 h-4 mr-2" />
            New Contract
          </Button>
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </PageHeader>

      {/* Contract Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by institution name, representative, or registry number"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                All Statuses
              </Button>
              <Button variant="outline" size="sm">
                Categories
              </Button>
              <Button variant="outline" size="sm">
                Calculations
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Institution</th>
                  <th className="text-left p-4 font-medium">Representative</th>
                  <th className="text-left p-4 font-medium">Contract Start</th>
                  <th className="text-left p-4 font-medium">Contract End</th>
                  <th className="text-left p-4 font-medium">Time Remaining</th>
                  <th className="text-left p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-medium">Optical nyenzi</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>Optical</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>05 Jul 2025</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>05 Jul 2025</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 font-medium">Expired</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="destructive">
                      Not Validated
                    </Badge>
                  </td>
                </tr>
                
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-medium">Tech Solutions Ltd</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>John Smith</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>01 Jan 2024</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>31 Dec 2024</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 font-medium">11 months</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 