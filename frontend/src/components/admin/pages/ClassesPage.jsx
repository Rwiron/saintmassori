import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  BookOpen, 
  MoreHorizontal,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Settings,
  Eye,
  UserPlus
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import classService, { classHelpers } from '@/services/classService';
import gradeService from '@/services/gradeService';
import ClassModal from '@/components/admin/modals/ClassModal';
import EnrollmentModal from '@/components/admin/modals/EnrollmentModal';
import toast from '@/utils/toast';

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [classModal, setClassModal] = useState({ isOpen: false, mode: 'create', data: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, classData: null });
  const [enrollmentModal, setEnrollmentModal] = useState({ isOpen: false, classData: null });

  // Statistics
  const [statistics, setStatistics] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalCapacity: 0,
    averageOccupancy: 0,
    fullClasses: 0,
    classesWithAvailableSpots: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStatistics();
  }, [classes]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesResponse, gradesResponse] = await Promise.all([
        classService.getAllClasses(),
        gradeService.getActiveGrades()
      ]);

      if (classesResponse.success) {
        setClasses(classHelpers.sortClasses(classesResponse.data));
      }

      if (gradesResponse.success) {
        setGrades(gradeService.sortGradesByLevel(gradesResponse.data));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = () => {
    const stats = {
      totalClasses: classes.length,
      totalStudents: classes.reduce((sum, cls) => sum + (cls.current_enrollment || 0), 0),
      totalCapacity: classes.reduce((sum, cls) => sum + cls.capacity, 0),
      averageOccupancy: 0,
      fullClasses: classes.filter(cls => classHelpers.isClassFull(cls.current_enrollment || 0, cls.capacity)).length,
      classesWithAvailableSpots: classes.filter(cls => !classHelpers.isClassFull(cls.current_enrollment || 0, cls.capacity)).length
    };

    if (stats.totalCapacity > 0) {
      stats.averageOccupancy = ((stats.totalStudents / stats.totalCapacity) * 100).toFixed(1);
    }

    setStatistics(stats);
  };

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.grade.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = selectedGrade === 'all' || cls.grade_id === parseInt(selectedGrade);
    
    return matchesSearch && matchesGrade;
  });

  const handleCreateClass = () => {
    setClassModal({ isOpen: true, mode: 'create', data: null });
  };

  const handleEditClass = (classData) => {
    setClassModal({ isOpen: true, mode: 'edit', data: classData });
  };

  const handleDeleteClass = (classData) => {
    setDeleteConfirm({ isOpen: true, classData });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.classData) return;

    try {
      const response = await classService.deleteClass(deleteConfirm.classData.id);
      
      if (response.success) {
        toast.success('Class deleted successfully');
        loadData();
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error(error.message || 'Failed to delete class');
    } finally {
      setDeleteConfirm({ isOpen: false, classData: null });
    }
  };

  const handleClassModalSuccess = () => {
    loadData();
  };

  const handleEnrollStudents = (classData) => {
    setEnrollmentModal({ isOpen: true, classData });
  };

  const handleEnrollmentSuccess = () => {
    loadData();
  };

  const getOccupancyBadge = (currentEnrollment, capacity) => {
    const status = classHelpers.getOccupancyStatus(currentEnrollment, capacity);
    const colors = {
      full: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };

    const labels = {
      full: 'Full',
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    };

    return (
      <Badge className={`${colors[status]} border`}>
        {labels[status]} ({classHelpers.calculateOccupancyRate(currentEnrollment, capacity)}%)
      </Badge>
    );
  };

  const getGradeBadge = (grade) => {
    const colors = {
      'N1': 'bg-purple-100 text-purple-800 border-purple-200',
      'P1': 'bg-blue-100 text-blue-800 border-blue-200',
      'P2': 'bg-green-100 text-green-800 border-green-200',
      'P3': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'P4': 'bg-orange-100 text-orange-800 border-orange-200',
      'P5': 'bg-red-100 text-red-800 border-red-200',
      'P6': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };

    return (
      <Badge className={`${colors[grade.name] || 'bg-gray-100 text-gray-800 border-gray-200'} border`}>
        {grade.name}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Loading classes...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader 
        title="Classes Management" 
        description="Manage classes, capacity, and student enrollment"
       
      >
        <Button onClick={handleCreateClass} className="bg-white text-blue-600 hover:bg-blue-50 border border-blue-200">
          <Plus className="h-4 w-4 mr-2" />
          Create Class
        </Button>
      </PageHeader>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.totalClasses}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-green-600">{statistics.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Capacity</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.totalCapacity}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Occupancy</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.averageOccupancy}%</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by grade" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Grades</SelectItem>
            {grades.map((grade) => (
              <SelectItem key={grade.id} value={grade.id.toString()}>
                {grade.name} - {grade.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((classData) => (
          <Card key={classData.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getGradeBadge(classData.grade)}
                  <CardTitle className="text-lg">{classData.full_name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white">
                    <DropdownMenuItem onClick={() => handleEditClass(classData)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Class
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClass(classData)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Class
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm text-gray-600">{classData.grade.display_name}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Enrollment Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Enrollment</span>
                </div>
                <div className="text-sm font-medium">
                  {classHelpers.formatCapacityDisplay(classData.current_enrollment || 0, classData.capacity)}
                </div>
              </div>

              {/* Occupancy Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Occupancy</span>
                {getOccupancyBadge(classData.current_enrollment || 0, classData.capacity)}
              </div>

              {/* Available Spots */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Available Spots</span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    {classHelpers.getAvailableSpots(classData.current_enrollment || 0, classData.capacity)}
                  </span>
                </div>
              </div>

              {/* Tariff Count */}
              {classData.tariffs && classData.tariffs.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tariffs</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">
                      {classData.tariffs.length} assigned
                    </span>
                  </div>
                </div>
              )}

              {/* Description */}
              {classData.description && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {classData.description}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditClass(classData)}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Manage
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  disabled={classHelpers.isClassFull(classData.current_enrollment || 0, classData.capacity)}
                  onClick={() => handleEnrollStudents(classData)}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Enroll
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || (selectedGrade && selectedGrade !== 'all')
              ? "No classes match your current filters." 
              : "Get started by creating your first class."
            }
          </p>
          {!searchTerm && (!selectedGrade || selectedGrade === 'all') && (
            <Button onClick={handleCreateClass} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create First Class
            </Button>
          )}
        </div>
      )}

      {/* Class Modal */}
      <ClassModal
        isOpen={classModal.isOpen}
        onClose={() => setClassModal({ isOpen: false, mode: 'create', data: null })}
        onSuccess={handleClassModalSuccess}
        classData={classModal.data}
        mode={classModal.mode}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.isOpen} onOpenChange={() => setDeleteConfirm({ isOpen: false, classData: null })}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Class
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete the class <strong>{deleteConfirm.classData?.full_name}</strong>?
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">This action cannot be undone and will:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Remove all students from this class</li>
                    <li>Delete all associated tariff assignments</li>
                    <li>Remove all billing records for this class</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirm({ isOpen: false, classData: null })}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrollment Modal */}
      <EnrollmentModal
        isOpen={enrollmentModal.isOpen}
        onClose={() => setEnrollmentModal({ isOpen: false, classData: null })}
        onSuccess={handleEnrollmentSuccess}
        classData={enrollmentModal.classData}
      />
    </div>
  );
};

export default ClassesPage; 