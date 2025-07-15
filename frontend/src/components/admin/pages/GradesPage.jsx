import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { 
  Plus, 
  Search, 
  BookOpen, 
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  School,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Settings,
  Eye,
  UserPlus,
  Layers
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import gradeService from '@/services/gradeService';
import GradeModal from '@/components/admin/modals/GradeModal';
import toast from '@/utils/toast';

const GradesPage = () => {
  const [grades, setGrades] = useState([]);
  const [statistics, setStatistics] = useState({
    totalGrades: 0,
    activeGrades: 0,
    totalClasses: 0,
    totalStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeModal, setGradeModal] = useState({ isOpen: false, mode: 'create', data: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, gradeData: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gradesResponse, statsResponse] = await Promise.all([
        gradeService.getGrades(),
        gradeService.getStatistics()
      ]);
      
      setGrades(gradesResponse.data);
      calculateStatistics(gradesResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load grades data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (gradesData) => {
    const stats = {
      totalGrades: gradesData.length,
      activeGrades: gradesData.filter(g => g.is_active).length,
      totalClasses: gradesData.reduce((sum, g) => sum + (g.classes?.length || 0), 0),
      totalStudents: gradesData.reduce((sum, g) => sum + (g.student_count || 0), 0)
    };
    setStatistics(stats);
  };

  const filteredGrades = grades.filter(grade => {
    const matchesSearch = grade.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleCreateGrade = () => {
    setGradeModal({ isOpen: true, mode: 'create', data: null });
  };

  const handleEditGrade = (gradeData) => {
    setGradeModal({ isOpen: true, mode: 'edit', data: gradeData });
  };

  const handleDeleteGrade = (gradeData) => {
    setDeleteConfirm({ isOpen: true, gradeData });
  };

  const confirmDelete = async () => {
    try {
      await gradeService.deleteGrade(deleteConfirm.gradeData.id);
      toast.success('Grade deleted successfully');
      setDeleteConfirm({ isOpen: false, gradeData: null });
      loadData();
    } catch (error) {
      console.error('Error deleting grade:', error);
      toast.error(error.response?.data?.message || 'Failed to delete grade');
    }
  };

  const handleGradeModalSuccess = () => {
    loadData();
  };

  const handleToggleActive = async (gradeId, isActive) => {
    try {
      if (isActive) {
        await gradeService.deactivateGrade(gradeId);
        toast.success('Grade deactivated successfully');
      } else {
        await gradeService.activateGrade(gradeId);
        toast.success('Grade activated successfully');
      }
      loadData();
    } catch (error) {
      console.error('Error toggling grade status:', error);
      toast.error(error.response?.data?.message || 'Failed to update grade status');
    }
  };

  const getGradeBadge = (grade) => {
    const colors = {
      'N1': 'bg-purple-100 text-purple-800 border-purple-200',
      'P1': 'bg-blue-100 text-blue-800 border-blue-200',
      'P2': 'bg-green-100 text-green-800 border-green-200',
      'P3': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'P4': 'bg-orange-100 text-orange-800 border-orange-200',
      'P5': 'bg-red-100 text-red-800 border-red-200',
      'P6': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };

    return (
      <Badge className={`${colors[grade.name] || 'bg-gray-100 text-gray-800 border-gray-200'} border`}>
        {grade.name}
      </Badge>
    );
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 border-green-200 border">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-600 border-gray-200 border">
        <AlertCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Loading grades...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader 
        title="Grades Management" 
        description="Manage academic grades and their class structures"
        variant="default"
      >
        <Button onClick={handleCreateGrade} className="bg-white text-green-600 hover:bg-green-50 border border-green-200">
          <Plus className="h-4 w-4 mr-2" />
          Create Grade
        </Button>
      </PageHeader>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Grades</p>
                <p className="text-2xl font-bold text-green-600">{statistics.totalGrades}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Grades</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.activeGrades}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.totalClasses}</p>
              </div>
              <Layers className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search grades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Grades Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGrades.map((grade) => (
          <Card key={grade.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getGradeBadge(grade)}
                  <span className="font-medium text-gray-900">{grade.display_name}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white">
                    <DropdownMenuItem onClick={() => handleEditGrade(grade)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleToggleActive(grade.id, grade.is_active)}
                    >
                      {grade.is_active ? (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteGrade(grade)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Status and Level */}
                <div className="flex items-center justify-between">
                  {getStatusBadge(grade.is_active)}
                  <span className="text-sm text-gray-500">Level {grade.level}</span>
                </div>

                {/* Description */}
                {grade.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {grade.description}
                  </p>
                )}

                {/* Classes Info */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    <span>{grade.classes?.length || 0} Classes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{grade.student_count || 0} Students</span>
                  </div>
                </div>

                {/* Classes List */}
                {grade.classes && grade.classes.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-2">Classes:</p>
                    <div className="flex flex-wrap gap-1">
                      {grade.classes.slice(0, 6).map((cls) => (
                        <Badge key={cls.id} variant="secondary" className="text-xs">
                          {cls.name}
                        </Badge>
                      ))}
                      {grade.classes.length > 6 && (
                        <Badge variant="secondary" className="text-xs">
                          +{grade.classes.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredGrades.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No grades found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? "No grades match your search criteria." 
              : "Get started by creating your first grade."
            }
          </p>
          {!searchTerm && (
            <Button onClick={handleCreateGrade} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Create First Grade
            </Button>
          )}
        </div>
      )}

      {/* Grade Modal */}
      <GradeModal
        isOpen={gradeModal.isOpen}
        onClose={() => setGradeModal({ isOpen: false, mode: 'create', data: null })}
        onSuccess={handleGradeModalSuccess}
        gradeData={gradeModal.data}
        mode={gradeModal.mode}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirm.isOpen} onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, gradeData: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Delete Grade
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete grade <strong>{deleteConfirm.gradeData?.name}</strong>?
            </p>
            <p className="text-sm text-red-600 mt-2">
              This action cannot be undone. All associated classes and students will be affected.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({ isOpen: false, gradeData: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GradesPage; 