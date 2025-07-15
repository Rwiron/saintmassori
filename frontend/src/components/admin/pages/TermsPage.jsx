import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import TermModal from '@/components/admin/modals/TermModal';
import { 
  Plus, 
  Search, 
  Calendar, 
  Play, 
  Square, 
  Edit, 
  Trash2, 
  MoreVertical,
  Clock,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  TrendingUp,
  BarChart3,
  Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import termService from '@/services/termService';
import academicYearService from '@/services/academicYearService';
import toast from '@/utils/toast';

const TermsPage = () => {
  const [terms, setTerms] = useState([]);
  const [filteredTerms, setFilteredTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    active: 0,
    completed: 0
  });

  // Fetch current academic year
  const fetchCurrentAcademicYear = async () => {
    try {
      const response = await academicYearService.getCurrentAcademicYear();
      if (response.success) {
        setCurrentAcademicYear(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching current academic year:', error);
      return null;
    }
  };

  // Fetch terms
  const fetchTerms = async () => {
    try {
      setLoading(true);
      const academicYear = await fetchCurrentAcademicYear();
      
      let response;
      if (academicYear) {
        // Fetch terms for current academic year
        response = await termService.getTermsByAcademicYear(academicYear.id);
      } else {
        // Fetch all terms if no active academic year
        response = await termService.getTerms();
      }
      
      if (response.success) {
        const formattedData = response.data.map(item => 
          termService.formatTerm(item)
        );
        setTerms(formattedData);
        setFilteredTerms(formattedData);
        
        // Calculate stats
        const statsData = {
          total: formattedData.length,
          upcoming: formattedData.filter(item => item.status === 'upcoming').length,
          active: formattedData.filter(item => item.status === 'active').length,
          completed: formattedData.filter(item => item.status === 'completed').length
        };
        setStats(statsData);
      } else {
        toast.error('Failed to fetch terms');
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      toast.error('Error loading terms');
    } finally {
      setLoading(false);
    }
  };

  // Filter terms based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTerms(terms);
    } else {
      const filtered = terms.filter(term =>
        term.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTerms(filtered);
    }
  }, [searchTerm, terms]);

  // Load data on component mount
  useEffect(() => {
    fetchTerms();
  }, []);

  // Handle modal success
  const handleModalSuccess = (data) => {
    fetchTerms(); // Refresh the list
  };

  // Handle add new term
  const handleAddNew = () => {
    setSelectedTerm(null);
    setIsModalOpen(true);
  };

  // Handle edit term
  const handleEdit = (term) => {
    setSelectedTerm(term);
    setIsModalOpen(true);
  };

  // Handle activate term
  const handleActivate = async (term) => {
    try {
      const response = await termService.activateTerm(term.id);
      if (response.success) {
        toast.success('Term activated successfully');
        fetchTerms();
      }
    } catch (error) {
      console.error('Error activating term:', error);
      toast.error(error.response?.data?.message || 'Failed to activate term');
    }
  };

  // Handle complete term
  const handleComplete = async (term) => {
    try {
      const response = await termService.completeTerm(term.id);
      if (response.success) {
        toast.success('Term completed successfully');
        fetchTerms();
      }
    } catch (error) {
      console.error('Error completing term:', error);
      toast.error(error.response?.data?.message || 'Failed to complete term');
    }
  };

  // Handle delete term
  const handleDelete = (term) => {
    setTermToDelete(term);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete term
  const confirmDelete = async () => {
    if (!termToDelete) return;
    
    try {
      const response = await termService.deleteTerm(termToDelete.id);
      if (response.success) {
        toast.success('Term deleted successfully');
        fetchTerms();
      }
    } catch (error) {
      console.error('Error deleting term:', error);
      toast.error(error.response?.data?.message || 'Failed to delete term');
    } finally {
      setIsDeleteDialogOpen(false);
      setTermToDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setTermToDelete(null);
  };

  // Get action buttons for each term
  const getActionButtons = (term) => {
    const actions = [];

    // Edit action (always available)
    actions.push(
      <DropdownMenuItem key="edit" onClick={() => handleEdit(term)}>
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </DropdownMenuItem>
    );

    // Status-specific actions
    if (term.status === 'upcoming') {
      actions.push(
        <DropdownMenuItem key="activate" onClick={() => handleActivate(term)}>
          <Play className="h-4 w-4 mr-2" />
          Activate
        </DropdownMenuItem>
      );
    }

    if (term.status === 'active') {
      actions.push(
        <DropdownMenuItem key="complete" onClick={() => handleComplete(term)}>
          <Square className="h-4 w-4 mr-2" />
          Complete
        </DropdownMenuItem>
      );
    }

    // Delete action (only for upcoming status)
    if (term.status === 'upcoming') {
      actions.push(
        <DropdownMenuSeparator key="separator" />,
        <DropdownMenuItem 
          key="delete" 
          onClick={() => handleDelete(term)}
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
      case 'completed':
        return <Square className="h-4 w-4 text-gray-600" />;
      case 'upcoming':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  // Get term progress
  const getTermProgress = (term) => {
    if (term.status === 'upcoming') return 0;
    if (term.status === 'completed') return 100;
    return termService.getTermProgress(term);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Terms Management"
        description={currentAcademicYear ? 
          `Manage terms for ${currentAcademicYear.name} academic year` : 
          "Manage academic terms and periods"
        }
      >
        <Button 
          onClick={handleAddNew} 
          className="bg-blue-600 hover:bg-blue-700"
          disabled={!currentAcademicYear}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Term
        </Button>
      </PageHeader>

      {/* Academic Year Info */}
      {currentAcademicYear && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">Active Academic Year</h3>
                  <p className="text-sm text-blue-700">
                    {currentAcademicYear.name} • {new Date(currentAcademicYear.start_date).toLocaleDateString()} - {new Date(currentAcademicYear.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {currentAcademicYear.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {!currentAcademicYear && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-900">No Active Academic Year</h3>
                <p className="text-sm text-yellow-700">
                  Please activate an academic year before managing terms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Terms</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All terms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled terms
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
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Square className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Finished terms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Terms List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTerms.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No terms found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No terms match your search.' : 'Get started by creating your first term.'}
              </p>
              {!searchTerm && currentAcademicYear && (
                <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Term
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTerms.map((term) => {
                const progress = getTermProgress(term);
                return (
                  <Card key={term.id} className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg">
                    {/* Status gradient background */}
                    <div className={`absolute inset-0 opacity-10 ${
                      term.status === 'active' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                      term.status === 'completed' ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                      'bg-gradient-to-br from-blue-400 to-blue-600'
                    }`}></div>
                    
                    {/* Status indicator stripe */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      term.status === 'active' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      term.status === 'completed' ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
                      'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}></div>

                    <CardContent className="relative p-6">
                      {/* Header with status icon and actions */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            term.status === 'active' ? 'bg-green-100' :
                            term.status === 'completed' ? 'bg-gray-100' :
                            'bg-blue-100'
                          }`}>
                            {getStatusIcon(term.status)}
                          </div>
                          <Badge className={`${term.status_color} border-0 shadow-sm`}>
                            {term.status_label}
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
                            {getActionButtons(term)}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Term Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                        {term.name}
                      </h3>

                      {/* Date Range */}
                      <div className="flex items-center space-x-2 mb-3">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 font-medium">
                          {termService.getDateRangeDisplay(term)}
                        </span>
                      </div>

                      {/* Duration */}
                      <div className="flex items-center space-x-2 mb-4">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {term.duration_days} days duration
                        </span>
                      </div>

                      {/* Progress Bar for Active Terms */}
                      {term.status === 'active' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Progress</span>
                            <span className="text-xs text-gray-600">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {term.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                          {term.description}
                        </p>
                      )}

                      {/* Quick Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(term)}
                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          
                          {term.status === 'upcoming' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActivate(term)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Activate
                            </Button>
                          )}
                          
                          {term.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleComplete(term)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Square className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          {term.days_remaining > 0 ? `${term.days_remaining} days left` : 
                           term.days_remaining === 0 ? 'Ends today' : 
                           `Ended ${Math.abs(term.days_remaining)} days ago`}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Term Modal */}
      <TermModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        term={selectedTerm}
        onSuccess={handleModalSuccess}
        academicYearId={currentAcademicYear?.id}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Term
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete "{termToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-1">This will permanently delete:</p>
                  <ul className="list-disc list-inside space-y-1 text-red-600">
                    <li>The term "{termToDelete?.name}"</li>
                    <li>All associated bills and data</li>
                    <li>Any student enrollments for this term</li>
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
              Delete Term
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TermsPage; 