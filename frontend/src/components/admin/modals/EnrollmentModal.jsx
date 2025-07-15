import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  AlertCircle, 
  Save, 
  X,
  School,
  FileText,
  Shield,
  Search,
  Plus,
  UserPlus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import studentService from '@/services/studentService';
import classService from '@/services/classService';
import gradeService from '@/services/gradeService';
import toast from '@/utils/toast';

const EnrollmentModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  classData = null
}) => {
  const [activeTab, setActiveTab] = useState('view'); // 'view' or 'create'
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // For viewing current class students
  const [classStudents, setClassStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedStudents, setPaginatedStudents] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  
  // For creating new student
  const [newStudentData, setNewStudentData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    address: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    emergency_contact: '',
    medical_conditions: '',
    allergies: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  useEffect(() => {
    if (isOpen && classData) {
      loadClassStudents();
      resetForm();
    }
  }, [isOpen, classData]);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, classStudents]);

  useEffect(() => {
    paginateStudents();
  }, [filteredStudents, currentPage, itemsPerPage]);

  const resetForm = () => {
    setActiveTab('view');
    setSearchTerm('');
    setCurrentPage(1);
    setNewStudentData({
      first_name: '',
      last_name: '',
      email: '',
      date_of_birth: '',
      gender: '',
      phone: '',
      address: '',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      emergency_contact: '',
      medical_conditions: '',
      allergies: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      status: 'active'
    });
  };

  const loadClassStudents = async () => {
    try {
      setLoading(true);
      const response = await studentService.getStudents({
        class_id: classData.id
      });
      
      if (response.success) {
        setClassStudents(response.data);
      }
    } catch (error) {
      console.error('Error loading class students:', error);
      toast.error('Failed to load class students');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchTerm) {
      setFilteredStudents(classStudents);
      return;
    }
    
    const filtered = classStudents.filter(student => 
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.parent_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredStudents(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const paginateStudents = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredStudents.slice(startIndex, endIndex);
    
    setPaginatedStudents(paginated);
    setTotalPages(Math.ceil(filteredStudents.length / itemsPerPage));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };



  const handleNewStudentChange = (field, value) => {
    setNewStudentData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleCreateAndEnrollStudent = async () => {
    // Validate required fields
    if (!newStudentData.first_name || !newStudentData.last_name || !newStudentData.date_of_birth || 
        !newStudentData.gender || !newStudentData.parent_name || !newStudentData.parent_email || 
        !newStudentData.parent_phone) {
      toast.error('Please fill in all required fields (marked with *)');
      return;
    }

    try {
      setLoading(true);
      
      // Add class_id to the student data
      const studentDataWithClass = {
        ...newStudentData,
        class_id: classData.id
      };
      
      const response = await studentService.registerStudent(studentDataWithClass);
      
      if (response.success) {
        toast.success('Student created and enrolled successfully');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error creating and enrolling student:', error);
      toast.error(error.message || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  const renderViewTab = () => (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students by name, email, student ID, or parent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {paginatedStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of{' '}
          {filteredStudents.length} students
          {searchTerm && ` (filtered from ${classStudents.length} total)`}
        </span>
        {classStudents.length > 0 && (
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Total: {classStudents.length}
          </span>
        )}
      </div>

      {/* Students Table */}
      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Loading students...</span>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No students found' : 'No students enrolled'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'No students match your search criteria.' : 'This class has no students enrolled yet.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Parent/Guardian</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrollment Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student, index) => (
                <TableRow key={student.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{student.full_name}</div>
                        <div className="text-sm text-gray-500">ID: {student.student_id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {student.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span>{student.email}</span>
                        </div>
                      )}
                      {student.phone && (
                        <div className="flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {student.parent_name && (
                        <div className="font-medium">{student.parent_name}</div>
                      )}
                      {student.parent_phone && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{student.parent_phone}</span>
                        </div>
                      )}
                      {student.parent_email && (
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{student.parent_email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {student.gender}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {student.date_of_birth ? (
                      <span className="text-sm">
                        {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={student.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {student.enrollment_date ? (
                      <span className="text-sm">
                        {new Date(student.enrollment_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
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
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );

  const renderCreateTab = () => (
    <div className="space-y-6 max-h-96 overflow-y-auto">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={newStudentData.first_name}
                onChange={(e) => handleNewStudentChange('first_name', e.target.value)}
                placeholder="Enter first name"
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={newStudentData.last_name}
                onChange={(e) => handleNewStudentChange('last_name', e.target.value)}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={newStudentData.email}
              onChange={(e) => handleNewStudentChange('email', e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={newStudentData.date_of_birth}
                onChange={(e) => handleNewStudentChange('date_of_birth', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select value={newStudentData.gender} onValueChange={(value) => handleNewStudentChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={newStudentData.phone}
              onChange={(e) => handleNewStudentChange('phone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={newStudentData.address}
              onChange={(e) => handleNewStudentChange('address', e.target.value)}
              placeholder="Enter address"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Parent/Guardian Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Parent/Guardian Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="parent_name">Parent/Guardian Name *</Label>
            <Input
              id="parent_name"
              value={newStudentData.parent_name}
              onChange={(e) => handleNewStudentChange('parent_name', e.target.value)}
              placeholder="Enter parent/guardian name"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parent_phone">Parent Phone *</Label>
              <Input
                id="parent_phone"
                value={newStudentData.parent_phone}
                onChange={(e) => handleNewStudentChange('parent_phone', e.target.value)}
                placeholder="Enter parent phone"
                required
              />
            </div>
            <div>
              <Label htmlFor="parent_email">Parent Email *</Label>
              <Input
                id="parent_email"
                type="email"
                value={newStudentData.parent_email}
                onChange={(e) => handleNewStudentChange('parent_email', e.target.value)}
                placeholder="Enter parent email"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="emergency_contact">Emergency Contact</Label>
            <Input
              id="emergency_contact"
              value={newStudentData.emergency_contact}
              onChange={(e) => handleNewStudentChange('emergency_contact', e.target.value)}
              placeholder="Enter emergency contact name and phone"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!classData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Enroll Students in {classData.full_name}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <School className="h-4 w-4" />
            {classData.grade?.display_name} • 
            Capacity: {classData.current_enrollment || 0}/{classData.capacity} • 
            Available: {classData.capacity - (classData.current_enrollment || 0)} spots
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'view' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('view')}
          >
            View Class Students
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'create' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('create')}
          >
            Create New Student
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'view' ? renderViewTab() : renderCreateTab()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          {activeTab === 'create' && (
            <Button 
              onClick={handleCreateAndEnrollStudent}
              disabled={loading || !newStudentData.first_name || !newStudentData.last_name || 
                       !newStudentData.date_of_birth || !newStudentData.gender || 
                       !newStudentData.parent_name || !newStudentData.parent_email || 
                       !newStudentData.parent_phone}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create & Enroll Student
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollmentModal; 