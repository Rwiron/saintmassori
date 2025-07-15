import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  Upload,
  Users,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  ArrowUpDown,
  Eye,
  UserCheck,
  UserX,
  Trophy,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Heart,
  Shield,
  X
} from 'lucide-react';
import studentService, { studentHelpers } from '@/services/studentService';
import classService from '@/services/classService';
import gradeService from '@/services/gradeService';
import StudentModal from '@/components/admin/modals/StudentModal';
import StudentImportModal from '@/components/admin/modals/StudentImportModal';
import toast from '@/utils/toast';
import { API_CONFIG } from '@/config/api';

export function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    graduated: 0,
    withOutstandingBills: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    gender: 'all',
    grade_id: 'all',
    class_id: 'all',
    province: 'all',
    disability: 'all',
    has_outstanding_bills: 'all'
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [studentModal, setStudentModal] = useState({ isOpen: false, mode: 'create', data: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, studentData: null });
  const [importModal, setImportModal] = useState({ isOpen: false });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkPromotionModal, setBulkPromotionModal] = useState({ 
    isOpen: false, 
    targetGrade: null, 
    targetClass: null,
    availableClasses: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedStudents, setPaginatedStudents] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [students, searchTerm, filters, sortBy, sortOrder]);

  useEffect(() => {
    paginateStudents();
  }, [filteredStudents, currentPage, itemsPerPage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsResponse, classesResponse, gradesResponse] = await Promise.all([
        studentService.getStudents(),
        classService.getAllClasses(),
        gradeService.getActiveGrades()
      ]);

      if (studentsResponse.success) {
        const formattedStudents = studentsResponse.data.map(student => 
          studentService.formatStudentData(student)
        );
        setStudents(formattedStudents);
        calculateStatistics(formattedStudents);
              }

        if (classesResponse.success) {
          setClasses(classesResponse.data);
        }

        if (gradesResponse.success) {
          setGrades(gradeService.sortGradesByLevel(gradesResponse.data));
        }
          } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load students');
      } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (studentsData) => {
    const stats = {
      total: studentsData.length,
      active: studentsData.filter(s => s.status === 'active').length,
      inactive: studentsData.filter(s => s.status === 'inactive').length,
      graduated: studentsData.filter(s => s.status === 'graduated').length,
      withOutstandingBills: studentsData.filter(s => s.has_outstanding_bills).length
    };
    setStatistics(stats);
  };

  const applyFiltersAndSort = () => {
    let filtered = studentService.filterStudents(students, { ...filters, search: searchTerm });
    filtered = studentService.sortStudents(filtered, sortBy, sortOrder);
    setFilteredStudents(filtered);
  };

  const paginateStudents = () => {
    const total = Math.ceil(filteredStudents.length / itemsPerPage);
    setTotalPages(total);
    
    // Reset to page 1 if current page exceeds total pages
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
      return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredStudents.slice(startIndex, endIndex);
    setPaginatedStudents(paginated);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedStudents([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (items) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleStudentSelect = (studentId, isSelected) => {
    if (isSelected) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const allStudentIds = paginatedStudents.map(student => student.id);
      setSelectedStudents(allStudentIds);
    } else {
      setSelectedStudents([]);
    }
  };

  const isAllSelected = paginatedStudents.length > 0 && selectedStudents.length === paginatedStudents.length;
  const isIndeterminate = selectedStudents.length > 0 && selectedStudents.length < paginatedStudents.length;

  const handleCreateStudent = () => {
    setStudentModal({ isOpen: true, mode: 'create', data: null });
  };

  const handleEditStudent = (studentData) => {
    setStudentModal({ isOpen: true, mode: 'edit', data: studentData });
  };

  const handleDeleteStudent = (studentData) => {
    setDeleteConfirm({ isOpen: true, studentData });
  };

  const confirmDelete = async () => {
    try {
      const reason = 'Student removed from system';
      await studentService.deactivateStudent(deleteConfirm.studentData.id, reason);
      toast.success(`Student ${deleteConfirm.studentData.full_name} deactivated successfully`);
      loadData();
    } catch (error) {
      console.error('Error deactivating student:', error);
      toast.error('Failed to deactivate student');
    } finally {
      setDeleteConfirm({ isOpen: false, studentData: null });
    }
  };

  const handlePromoteStudent = async (studentData) => {
    try {
      // Find next grade
      const currentGrade = grades.find(g => g.id === studentData.class?.grade_id);
      const nextGrade = grades.find(g => g.level === (currentGrade?.level || 0) + 1);
      
      if (!nextGrade) {
        toast.error('No next grade available for promotion');
        return;
      }

      await studentService.promoteStudent(studentData.id, nextGrade.id);
      toast.success(`${studentData.full_name} promoted to ${nextGrade.display_name} successfully`);
      loadData();
    } catch (error) {
      console.error('Error promoting student:', error);
      toast.error('Failed to promote student');
    }
  };

  const handleTransferStudent = async (studentData, newClassId) => {
    try {
      await studentService.transferStudent(studentData.id, newClassId);
      const newClass = classes.find(c => c.id === newClassId);
      toast.success(`${studentData.full_name} transferred to ${newClass?.full_name} successfully`);
      loadData();
    } catch (error) {
      console.error('Error transferring student:', error);
      toast.error('Failed to transfer student');
    }
  };

  const handleGraduateStudent = async (studentData) => {
    try {
      await studentService.graduateStudent(studentData.id);
      toast.success(`${studentData.full_name} graduated successfully`);
      loadData();
    } catch (error) {
      console.error('Error graduating student:', error);
      toast.error('Failed to graduate student');
    }
  };

  const handleBulkPromotion = () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select students to promote');
      return;
    }
    setBulkPromotionModal({ 
      isOpen: true, 
      targetGrade: null, 
      targetClass: null,
      availableClasses: []
    });
  };

  const handleGradeSelection = async (gradeId) => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        toast.error('Please login to continue');
        return;
      }
      
      // Load classes for the selected grade
      const classesResponse = await classService.getClassesByGrade(gradeId);
      const availableClasses = classesResponse.success ? classesResponse.data : [];
      
      setBulkPromotionModal(prev => ({
        ...prev,
        targetGrade: gradeId,
        targetClass: null,
        availableClasses: availableClasses
      }));
    } catch (error) {
      console.error('Error loading classes for grade:', error);
      
      // Handle specific error types
      if (error.status === 401) {
        toast.error('Session expired. Please login again.');
        // Redirect to login will be handled by the response interceptor
      } else if (error.status === 403) {
        toast.error('You do not have permission to view classes.');
      } else if (error.status === 404) {
        toast.error('Grade not found or has no classes.');
      } else if (error.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(error.message || 'Failed to load classes for selected grade');
      }
    }
  };

  const confirmBulkPromotion = async () => {
    try {
      await studentService.bulkPromoteStudents(
        selectedStudents, 
        bulkPromotionModal.targetGrade, 
        bulkPromotionModal.targetClass
      );
      
      const targetGrade = grades.find(g => g.id === bulkPromotionModal.targetGrade);
      const targetClass = bulkPromotionModal.availableClasses.find(c => c.id === bulkPromotionModal.targetClass);
      
      const message = targetClass 
        ? `${selectedStudents.length} students promoted to ${targetClass.full_name} successfully`
        : `${selectedStudents.length} students promoted to ${targetGrade?.display_name} successfully`;
      
      toast.success(message);
      setSelectedStudents([]);
      setBulkPromotionModal({ 
        isOpen: false, 
        targetGrade: null, 
        targetClass: null,
        availableClasses: []
      });
      loadData();
    } catch (error) {
      console.error('Error promoting students:', error);
      toast.error('Failed to promote students');
    }
  };

  const handleModalSuccess = (data) => {
    loadData();
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      gender: 'all',
      grade_id: 'all',
      class_id: 'all',
      province: 'all',
      disability: 'all',
      has_outstanding_bills: 'all'
    });
    setSearchTerm('');
  };

  const exportStudents = () => {
    // TODO: Implement export functionality
    toast.info('Export functionality coming soon');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <UserX className="h-4 w-4 text-gray-500" />;
      case 'graduated':
        return <Trophy className="h-4 w-4 text-blue-500" />;
      case 'transferred':
        return <RefreshCw className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Loading students...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Students Management"
        description="Manage student enrollment, records, and information."
        variant="default"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleCreateStudent} className="bg-white/20 hover:bg-white/30 text-white border-white/30">
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
          <Button 
            onClick={() => setImportModal({ isOpen: true })}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Students
          </Button>
          <Button 
            variant="outline" 
            className="border-white/30 text-white hover:bg-white/10"
            onClick={exportStudents}
          >
            <Download className="w-4 h-4 mr-2" />
            Export List
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">
              All registered students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Students
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently enrolled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Graduated
            </CardTitle>
            <Trophy className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.graduated}</div>
            <p className="text-xs text-muted-foreground">
              Completed studies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Bills
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statistics.withOutstandingBills}</div>
            <p className="text-xs text-muted-foreground">
              Pending payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inactive
            </CardTitle>
            <UserX className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{statistics.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Not currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student Search & Filters</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, student ID, or parent name"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {studentService.getStatusOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Genders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    {studentService.getGenderOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.grade_id} onValueChange={(value) => handleFilterChange('grade_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id.toString()}>
                        {grade.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.province} onValueChange={(value) => handleFilterChange('province', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Provinces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Provinces</SelectItem>
                    {studentService.getRwandaProvinces().map((province) => (
                      <SelectItem key={province.value} value={province.value}>
                        {province.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Students List ({filteredStudents.length})</CardTitle>
            <div className="flex gap-2">
              {selectedStudents.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-2 py-1">
                    {selectedStudents.length} selected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkPromotion}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Promote Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStudents([])}
                    className="text-gray-600 border-gray-200 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Selection
                  </Button>
                </div>
              )}
              <Select value={itemsPerPage.toString()} onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || Object.values(filters).some(f => f !== 'all') 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first student'
                }
              </p>
              {!searchTerm && Object.values(filters).every(f => f === 'all') && (
                <Button onClick={handleCreateStudent}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Student
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Data Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all students"
                        />
                      </TableHead>
                      <TableHead className="w-[60px]">Avatar</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          Name
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('grade')}
                      >
                        <div className="flex items-center gap-2">
                          Class/Grade
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Province</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={(checked) => handleStudentSelect(student.id, checked)}
                            aria-label={`Select ${student.full_name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Avatar className={`w-10 h-10 ${studentService.getAvatarColor(student.first_name, student.last_name)}`}>
                            <AvatarFallback className="text-xs">
                              {studentService.getStudentInitials(student.first_name, student.last_name)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{student.full_name}</div>
                          <div className="text-sm text-muted-foreground">{student.gender}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {student.student_id}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{student.email || student.parent_email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{student.class_display}</div>
                          <div className="text-sm text-muted-foreground">{student.grade_display}</div>
                        </TableCell>
                        <TableCell>{student.age}</TableCell>
                        <TableCell>{student.province || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(student.status)}
                            <Badge className={studentService.getStatusColor(student.status)}>
                              {student.status_display}
                            </Badge>
                          </div>
                          {student.disability && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs mt-1">
                              <Heart className="w-3 h-3 mr-1" />
                              Special Needs
                            </Badge>
                          )}
                          {student.has_outstanding_bills && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs mt-1">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Outstanding Bills
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Student
                              </DropdownMenuItem>
                              
                              {studentHelpers.canBePromoted(student) && (
                                <DropdownMenuItem onClick={() => handlePromoteStudent(student)}>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Promote Student
                                </DropdownMenuItem>
                              )}
                              
                              {studentHelpers.canBeGraduated(student) && (
                                <DropdownMenuItem onClick={() => handleGraduateStudent(student)}>
                                  <Trophy className="w-4 h-4 mr-2" />
                                  Graduate Student
                                </DropdownMenuItem>
                              )}
                              
                              {student.status === 'active' && (
                                <DropdownMenuItem onClick={() => handleDeleteStudent(student)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Deactivate Student
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Modal */}
      <StudentModal
        isOpen={studentModal.isOpen}
        onClose={() => setStudentModal({ isOpen: false, mode: 'create', data: null })}
        onSuccess={handleModalSuccess}
        studentData={studentModal.data}
        mode={studentModal.mode}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.isOpen} onOpenChange={() => setDeleteConfirm({ isOpen: false, studentData: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Student Deactivation</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {deleteConfirm.studentData?.full_name}? This action will mark the student as inactive but preserve their records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({ isOpen: false, studentData: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Deactivate Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Promotion Modal */}
      <Dialog open={bulkPromotionModal.isOpen} onOpenChange={() => setBulkPromotionModal({ 
        isOpen: false, 
        targetGrade: null, 
        targetClass: null,
        availableClasses: []
      })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Promote Students</DialogTitle>
            <DialogDescription>
              Select the target grade and class to promote {selectedStudents.length} selected students.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target-grade">Target Grade</Label>
              <Select value={bulkPromotionModal.targetGrade?.toString() || ""} onValueChange={(value) => handleGradeSelection(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id.toString()}>
                      {grade.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {bulkPromotionModal.targetGrade && (
              <div className="space-y-2">
                <Label htmlFor="target-class">Target Class</Label>
                <Select 
                  value={bulkPromotionModal.targetClass?.toString() || ""} 
                  onValueChange={(value) => setBulkPromotionModal(prev => ({ ...prev, targetClass: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target class" />
                  </SelectTrigger>
                  <SelectContent>
                    {bulkPromotionModal.availableClasses.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id.toString()}>
                        {classItem.full_name} ({classItem.current_enrollment}/{classItem.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bulkPromotionModal.availableClasses.length === 0 && (
                  <p className="text-sm text-muted-foreground">No classes available for the selected grade.</p>
                )}
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              <p>Selected students will be promoted to the selected class.</p>
              <p>This action cannot be undone.</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkPromotionModal({ 
                isOpen: false, 
                targetGrade: null, 
                targetClass: null,
                availableClasses: []
              })}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBulkPromotion}
              disabled={!bulkPromotionModal.targetGrade || !bulkPromotionModal.targetClass}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Promote {selectedStudents.length} Students
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Import Modal */}
      <StudentImportModal
        isOpen={importModal.isOpen}
        onClose={() => setImportModal({ isOpen: false })}
        onImportComplete={loadData}
      />
    </div>
  );
} 