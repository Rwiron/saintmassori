import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AcademicYearModal from '@/components/admin/modals/AcademicYearModal';
import { 
  Plus, 
  Search, 
  Calendar, 
  Play, 
  Square, 
  Edit, 
  Trash2, 
  MoreVertical,
  Users,
  BookOpen,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import academicYearService from '@/services/academicYearService';
import toast from '@/utils/toast';

const AcademicYearsPage = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [filteredAcademicYears, setFilteredAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [academicYearToDelete, setAcademicYearToDelete] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    closed: 0
  });

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const response = await academicYearService.getAcademicYears();
      
      if (response.success) {
        const formattedData = response.data.map(item => 
          academicYearService.formatAcademicYear(item)
        );
        setAcademicYears(formattedData);
        setFilteredAcademicYears(formattedData);
        
        // Calculate stats
        const statsData = {
          total: formattedData.length,
          active: formattedData.filter(item => item.status === 'active').length,
          draft: formattedData.filter(item => item.status === 'draft').length,
          closed: formattedData.filter(item => item.status === 'closed').length
        };
        setStats(statsData);
      } else {
        toast.error('Failed to fetch academic years');
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
      toast.error('Error loading academic years');
    } finally {
      setLoading(false);
    }
  };

  // Filter academic years based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAcademicYears(academicYears);
    } else {
      const filtered = academicYears.filter(academicYear =>
        academicYear.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        academicYear.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAcademicYears(filtered);
    }
  }, [searchTerm, academicYears]);

  // Load data on component mount
  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Handle modal success
  const handleModalSuccess = (data) => {
    fetchAcademicYears(); // Refresh the list
  };

  // Handle add new academic year
  const handleAddNew = () => {
    setSelectedAcademicYear(null);
    setIsModalOpen(true);
  };

  // Handle edit academic year
  const handleEdit = (academicYear) => {
    setSelectedAcademicYear(academicYear);
    setIsModalOpen(true);
  };

  // Handle activate academic year
  const handleActivate = async (academicYear) => {
    try {
      const response = await academicYearService.activateAcademicYear(academicYear.id);
      if (response.success) {
        toast.success('Academic year activated successfully');
        fetchAcademicYears();
      }
    } catch (error) {
      console.error('Error activating academic year:', error);
      toast.error(error.response?.data?.message || 'Failed to activate academic year');
    }
  };

  // Handle close academic year
  const handleClose = async (academicYear) => {
    try {
      const response = await academicYearService.closeAcademicYear(academicYear.id);
      if (response.success) {
        toast.success('Academic year closed successfully');
        fetchAcademicYears();
      }
    } catch (error) {
      console.error('Error closing academic year:', error);
      toast.error(error.response?.data?.message || 'Failed to close academic year');
    }
  };

  // Handle delete academic year
  const handleDelete = (academicYear) => {
    setAcademicYearToDelete(academicYear);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete academic year
  const confirmDelete = async () => {
    if (!academicYearToDelete) return;
    
    try {
      const response = await academicYearService.deleteAcademicYear(academicYearToDelete.id);
      if (response.success) {
        toast.success('Academic year deleted successfully');
        fetchAcademicYears();
      }
    } catch (error) {
      console.error('Error deleting academic year:', error);
      toast.error(error.response?.data?.message || 'Failed to delete academic year');
    } finally {
      setIsDeleteDialogOpen(false);
      setAcademicYearToDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setAcademicYearToDelete(null);
  };

  // Get action buttons for each academic year
  const getActionButtons = (academicYear) => {
    const actions = [];

    // Edit action (always available)
    actions.push(
      <DropdownMenuItem key="edit" onClick={() => handleEdit(academicYear)}>
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </DropdownMenuItem>
    );

    // Status-specific actions
    if (academicYear.status === 'draft') {
      actions.push(
        <DropdownMenuItem key="activate" onClick={() => handleActivate(academicYear)}>
          <Play className="h-4 w-4 mr-2" />
          Activate
        </DropdownMenuItem>
      );
    }

    if (academicYear.status === 'active') {
      actions.push(
        <DropdownMenuItem key="close" onClick={() => handleClose(academicYear)}>
          <Square className="h-4 w-4 mr-2" />
          Close
        </DropdownMenuItem>
      );
    }

    // Delete action (only for draft status or if can be deleted)
    if (academicYear.status === 'draft' || academicYear.can_be_modified) {
      actions.push(
        <DropdownMenuSeparator key="separator" />,
        <DropdownMenuItem 
          key="delete" 
          onClick={() => handleDelete(academicYear)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      );
    }

    return actions;
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'closed':
        return <Square className="h-4 w-4 text-red-600" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Academic Years"
        description="Manage academic years, terms, and school calendar"
      >
        <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Academic Year
        </Button>
      </PageHeader>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Academic Years</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All academic years
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">
              Planned for future
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <Square className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.closed}</div>
            <p className="text-xs text-muted-foreground">
              Completed years
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Years</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search academic years..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Academic Years List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : filteredAcademicYears.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No academic years found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No academic years match your search.' : 'Get started by creating your first academic year.'}
              </p>
              {!searchTerm && (
                <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Academic Year
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAcademicYears.map((academicYear) => (
                <Card key={academicYear.id} className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg">
                  {/* Status gradient background */}
                  <div className={`absolute inset-0 opacity-10 ${
                    academicYear.status === 'active' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                    academicYear.status === 'closed' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                    'bg-gradient-to-br from-gray-400 to-gray-600'
                  }`}></div>
                  
                  {/* Status indicator stripe */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    academicYear.status === 'active' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    academicYear.status === 'closed' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    'bg-gradient-to-r from-gray-500 to-gray-600'
                  }`}></div>

                  <CardContent className="relative p-6">
                    {/* Header with status icon and actions */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          academicYear.status === 'active' ? 'bg-green-100' :
                          academicYear.status === 'closed' ? 'bg-red-100' :
                          'bg-gray-100'
                        }`}>
                          {getStatusIcon(academicYear.status)}
                        </div>
                        <Badge className={`${academicYear.status_color} border-0 shadow-sm`}>
                          {academicYear.status_label}
                        </Badge>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {getActionButtons(academicYear)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Academic Year Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                      {academicYear.name}
                    </h3>

                    {/* Date Range */}
                    <div className="flex items-center space-x-2 mb-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 font-medium">
                        {academicYear.formatted_start_date} - {academicYear.formatted_end_date}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {academicYear.duration_months} months duration
                      </span>
                    </div>

                    {/* Description */}
                    {academicYear.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {academicYear.description}
                      </p>
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(academicYear)}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        
                        {academicYear.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleActivate(academicYear)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Activate
                          </Button>
                        )}
                        
                        {academicYear.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClose(academicYear)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Square className="h-4 w-4 mr-1" />
                            Close
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Created {new Date(academicYear.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Academic Year Modal */}
      <AcademicYearModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        academicYear={selectedAcademicYear}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Academic Year
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete "{academicYearToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-1">This will permanently delete:</p>
                  <ul className="list-disc list-inside space-y-1 text-red-600">
                    <li>The academic year "{academicYearToDelete?.name}"</li>
                    <li>All associated terms and data</li>
                    <li>Any student enrollments for this year</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={cancelDelete}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Academic Year
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AcademicYearsPage; 