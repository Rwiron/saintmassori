import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Shield
} from 'lucide-react';
import studentService from '@/services/studentService';
import classService from '@/services/classService';
import gradeService from '@/services/gradeService';
import toast from '@/utils/toast';

const StudentModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  studentData = null,
  mode = 'create' // 'create' or 'edit'
}) => {
  const [formData, setFormData] = useState({
    // Basic Information
    first_name: '',
    last_name: '',
    email: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    address: '',
    
    // Parent/Guardian Information
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    father_name: '',
    mother_name: '',
    emergency_contact: '',
    
    // School Information
    enrollment_date: new Date().toISOString().split('T')[0],
    class_id: '',
    
    // Health Information
    medical_conditions: '',
    allergies: '',
    disability: false,
    disability_description: '',
    
    // Location Information (Rwanda)
    province: '',
    district: '',
    sector: '',
    cell: '',
    village: ''
  });
  
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
      if (mode === 'edit' && studentData) {
        populateFormData(studentData);
      } else {
        resetForm();
      }
    }
  }, [isOpen, mode, studentData]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load classes with proper error handling
      try {
        const classesResponse = await classService.getAllClasses();
        if (classesResponse && classesResponse.success && classesResponse.data) {
          setClasses(classesResponse.data);
        } else {
          console.warn('Classes response was not successful:', classesResponse);
          setClasses([]);
          // Only show error if it's not an authentication issue
          if (classesResponse?.status !== 401) {
            toast.error('Failed to load classes - please check your connection');
          }
        }
      } catch (classError) {
        console.error('Error loading classes:', classError);
        setClasses([]);
        // Handle authentication errors gracefully
        if (classError.status === 401) {
          toast.error('Session expired. Please log in again.');
          // Redirect to login or refresh token
          window.location.href = '/login';
        } else if (classError.status === 403) {
          toast.error('You do not have permission to access classes');
        } else {
          toast.error('Failed to load classes - please try again');
        }
      }

      // Load grades with proper error handling
      try {
        const gradesResponse = await gradeService.getActiveGrades();
        if (gradesResponse && gradesResponse.success && gradesResponse.data) {
          setGrades(gradeService.sortGradesByLevel(gradesResponse.data));
        } else {
          console.warn('Grades response was not successful:', gradesResponse);
          setGrades([]);
          // Only show error if it's not an authentication issue
          if (gradesResponse?.status !== 401) {
            toast.error('Failed to load grades - please check your connection');
          }
        }
      } catch (gradeError) {
        console.error('Error loading grades:', gradeError);
        setGrades([]);
        // Handle authentication errors gracefully
        if (gradeError.status === 401) {
          toast.error('Session expired. Please log in again.');
          // Redirect to login or refresh token
          window.location.href = '/login';
        } else if (gradeError.status === 403) {
          toast.error('You do not have permission to access grades');
        } else {
          toast.error('Failed to load grades - please try again');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const populateFormData = (student) => {
    setFormData({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      email: student.email || '',
      date_of_birth: student.date_of_birth || '',
      gender: student.gender || '',
      phone: student.phone || '',
      address: student.address || '',
      parent_name: student.parent_name || '',
      parent_email: student.parent_email || '',
      parent_phone: student.parent_phone || '',
      father_name: student.father_name || '',
      mother_name: student.mother_name || '',
      emergency_contact: student.emergency_contact || '',
      enrollment_date: student.enrollment_date || new Date().toISOString().split('T')[0],
      class_id: student.class_id || '',
      medical_conditions: student.medical_conditions || '',
      allergies: student.allergies || '',
      disability: student.disability || false,
      disability_description: student.disability_description || '',
      province: student.province || '',
      district: student.district || '',
      sector: student.sector || '',
      cell: student.cell || '',
      village: student.village || ''
    });
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      date_of_birth: '',
      gender: '',
      phone: '',
      address: '',
      parent_name: '',
      parent_email: '',
      parent_phone: '',
      father_name: '',
      mother_name: '',
      emergency_contact: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      class_id: '',
      medical_conditions: '',
      allergies: '',
      disability: false,
      disability_description: '',
      province: '',
      district: '',
      sector: '',
      cell: '',
      village: ''
    });
    setErrors({});
    setActiveTab('basic');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const validation = studentService.validateStudentData(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Find the first tab with errors and switch to it
      const tabFields = {
        basic: ['first_name', 'last_name', 'email', 'date_of_birth', 'gender', 'phone', 'address'],
        parent: ['parent_name', 'parent_email', 'parent_phone', 'father_name', 'mother_name', 'emergency_contact'],
        school: ['enrollment_date', 'class_id'],
        health: ['medical_conditions', 'allergies', 'disability', 'disability_description'],
        location: ['province', 'district', 'sector', 'cell', 'village']
      };

      for (const [tab, fields] of Object.entries(tabFields)) {
        if (fields.some(field => errors[field])) {
          setActiveTab(tab);
          break;
        }
      }
      
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    
    try {
      let response;
      
      // Prepare the form data, handling null class_id properly
      const submissionData = {
        ...formData,
        class_id: formData.class_id || null
      };
      
      if (mode === 'create') {
        response = await studentService.registerStudent(submissionData);
        toast.success(`Student ${formData.first_name} ${formData.last_name} registered successfully!`);
        
        // Show additional info if student was assigned to a class
        if (submissionData.class_id) {
          toast.info('Note: Student assigned to class. Bills will be generated automatically once tariffs are configured for the class.');
        }
      } else {
        response = await studentService.updateStudent(studentData.id, submissionData);
        toast.success(`Student ${formData.first_name} ${formData.last_name} updated successfully!`);
      }
      
      if (response.success) {
        onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error saving student:', error);
      
      if (error.errors) {
        setErrors(error.errors);
      }
      
      // Handle different types of errors
      let errorMessage = 'Failed to save student';
      if (error.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to save students';
      } else if (error.status === 422) {
        errorMessage = 'Please check the form for validation errors';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'parent', label: 'Parent/Guardian', icon: Users },
    { id: 'school', label: 'School Info', icon: School },
    { id: 'health', label: 'Health Info', icon: Heart },
    { id: 'location', label: 'Location', icon: MapPin }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Enter first name"
                  className={errors.first_name ? 'border-red-500' : ''}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-500">{errors.first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Enter last name"
                  className={errors.last_name ? 'border-red-500' : ''}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-500">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="e.g., +250788123456"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className={errors.date_of_birth ? 'border-red-500' : ''}
                />
                {errors.date_of_birth && (
                  <p className="text-sm text-red-500">{errors.date_of_birth}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentService.getGenderOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-red-500">{errors.gender}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
                rows={3}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address}</p>
              )}
            </div>
          </div>
        );

      case 'parent':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parent_name">Primary Parent/Guardian Name *</Label>
                <Input
                  id="parent_name"
                  value={formData.parent_name}
                  onChange={(e) => handleInputChange('parent_name', e.target.value)}
                  placeholder="Enter parent/guardian name"
                  className={errors.parent_name ? 'border-red-500' : ''}
                />
                {errors.parent_name && (
                  <p className="text-sm text-red-500">{errors.parent_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_email">Parent Email *</Label>
                <Input
                  id="parent_email"
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) => handleInputChange('parent_email', e.target.value)}
                  placeholder="Enter parent email"
                  className={errors.parent_email ? 'border-red-500' : ''}
                />
                {errors.parent_email && (
                  <p className="text-sm text-red-500">{errors.parent_email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parent_phone">Parent Phone *</Label>
                <Input
                  id="parent_phone"
                  value={formData.parent_phone}
                  onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                  placeholder="e.g., +250788123456"
                  className={errors.parent_phone ? 'border-red-500' : ''}
                />
                {errors.parent_phone && (
                  <p className="text-sm text-red-500">{errors.parent_phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                  placeholder="Emergency contact information"
                  className={errors.emergency_contact ? 'border-red-500' : ''}
                />
                {errors.emergency_contact && (
                  <p className="text-sm text-red-500">{errors.emergency_contact}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="father_name">Father's Name</Label>
                <Input
                  id="father_name"
                  value={formData.father_name}
                  onChange={(e) => handleInputChange('father_name', e.target.value)}
                  placeholder="Enter father's full name"
                  className={errors.father_name ? 'border-red-500' : ''}
                />
                {errors.father_name && (
                  <p className="text-sm text-red-500">{errors.father_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mother_name">Mother's Name</Label>
                <Input
                  id="mother_name"
                  value={formData.mother_name}
                  onChange={(e) => handleInputChange('mother_name', e.target.value)}
                  placeholder="Enter mother's full name"
                  className={errors.mother_name ? 'border-red-500' : ''}
                />
                {errors.mother_name && (
                  <p className="text-sm text-red-500">{errors.mother_name}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'school':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="enrollment_date">Enrollment Date</Label>
                <Input
                  id="enrollment_date"
                  type="date"
                  value={formData.enrollment_date}
                  onChange={(e) => handleInputChange('enrollment_date', e.target.value)}
                  className={errors.enrollment_date ? 'border-red-500' : ''}
                />
                {errors.enrollment_date && (
                  <p className="text-sm text-red-500">{errors.enrollment_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="class_id">Assign to Class</Label>
                <Select 
                  value={formData.class_id ? formData.class_id.toString() : "none"} 
                  onValueChange={(value) => handleInputChange('class_id', value === "none" ? null : parseInt(value))}
                >
                  <SelectTrigger className={errors.class_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Class (Assign Later)</SelectItem>
                    {loading ? (
                      <SelectItem value="loading" disabled>Loading classes...</SelectItem>
                    ) : classes.length === 0 ? (
                      <SelectItem value="empty" disabled>No classes available - you can still create the student</SelectItem>
                    ) : (
                      classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.full_name || cls.name} - {cls.grade?.display_name || cls.grade?.name || 'N/A'} ({cls.current_enrollment || 0}/{cls.capacity || 0})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.class_id && (
                  <p className="text-sm text-red-500">{errors.class_id}</p>
                )}
              </div>
            </div>

            {formData.class_id && classes.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <School className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Class Information</span>
                </div>
                {(() => {
                  const selectedClass = classes.find(c => c.id === parseInt(formData.class_id));
                  if (selectedClass) {
                    return (
                      <div className="text-sm text-blue-800">
                        <p><strong>Class:</strong> {selectedClass.full_name || selectedClass.name}</p>
                        <p><strong>Grade:</strong> {selectedClass.grade?.display_name || selectedClass.grade?.name || 'N/A'}</p>
                        <p><strong>Capacity:</strong> {selectedClass.current_enrollment || 0}/{selectedClass.capacity || 0}</p>
                        <p><strong>Available Spots:</strong> {(selectedClass.capacity || 0) - (selectedClass.current_enrollment || 0)}</p>
                      </div>
                    );
                  }
                  return <p className="text-sm text-blue-800">Loading class information...</p>;
                })()}
              </div>
            )}
          </div>
        );

      case 'health':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medical_conditions">Medical Conditions</Label>
              <Textarea
                id="medical_conditions"
                value={formData.medical_conditions}
                onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                placeholder="List any medical conditions or write 'None'"
                rows={3}
                className={errors.medical_conditions ? 'border-red-500' : ''}
              />
              {errors.medical_conditions && (
                <p className="text-sm text-red-500">{errors.medical_conditions}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                placeholder="List any allergies or write 'None'"
                rows={3}
                className={errors.allergies ? 'border-red-500' : ''}
              />
              {errors.allergies && (
                <p className="text-sm text-red-500">{errors.allergies}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="disability"
                  checked={formData.disability}
                  onCheckedChange={(checked) => handleInputChange('disability', checked)}
                />
                <Label htmlFor="disability">Student has a disability</Label>
              </div>

              {formData.disability && (
                <div className="space-y-2">
                  <Label htmlFor="disability_description">Disability Description *</Label>
                  <Textarea
                    id="disability_description"
                    value={formData.disability_description}
                    onChange={(e) => handleInputChange('disability_description', e.target.value)}
                    placeholder="Please describe the disability and any accommodations needed"
                    rows={4}
                    className={errors.disability_description ? 'border-red-500' : ''}
                  />
                  {errors.disability_description && (
                    <p className="text-sm text-red-500">{errors.disability_description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Select value={formData.province || "none"} onValueChange={(value) => handleInputChange('province', value === "none" ? "" : value)}>
                  <SelectTrigger className={errors.province ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Province</SelectItem>
                    {studentService.getRwandaProvinces().map((province) => (
                      <SelectItem key={province.value} value={province.value}>
                        {province.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.province && (
                  <p className="text-sm text-red-500">{errors.province}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  placeholder="Enter district"
                  className={errors.district ? 'border-red-500' : ''}
                />
                {errors.district && (
                  <p className="text-sm text-red-500">{errors.district}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Input
                  id="sector"
                  value={formData.sector}
                  onChange={(e) => handleInputChange('sector', e.target.value)}
                  placeholder="Enter sector"
                  className={errors.sector ? 'border-red-500' : ''}
                />
                {errors.sector && (
                  <p className="text-sm text-red-500">{errors.sector}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cell">Cell</Label>
                <Input
                  id="cell"
                  value={formData.cell}
                  onChange={(e) => handleInputChange('cell', e.target.value)}
                  placeholder="Enter cell"
                  className={errors.cell ? 'border-red-500' : ''}
                />
                {errors.cell && (
                  <p className="text-sm text-red-500">{errors.cell}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="village">Village</Label>
              <Input
                id="village"
                value={formData.village}
                onChange={(e) => handleInputChange('village', e.target.value)}
                placeholder="Enter village"
                className={errors.village ? 'border-red-500' : ''}
              />
              {errors.village && (
                <p className="text-sm text-red-500">{errors.village}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {mode === 'create' ? 'Register New Student' : 'Edit Student Information'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const hasErrors = Object.keys(errors).some(key => {
                const tabFields = {
                  basic: ['first_name', 'last_name', 'email', 'date_of_birth', 'gender', 'phone', 'address'],
                  parent: ['parent_name', 'parent_email', 'parent_phone', 'father_name', 'mother_name', 'emergency_contact'],
                  school: ['enrollment_date', 'class_id'],
                  health: ['medical_conditions', 'allergies', 'disability', 'disability_description'],
                  location: ['province', 'district', 'sector', 'cell', 'village']
                };
                return tabFields[tab.id]?.includes(key);
              });

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-100 text-green-700 border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {hasErrors && (
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {renderTabContent()}
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'create' ? 'Registering...' : 'Updating...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {mode === 'create' ? 'Register Student' : 'Update Student'}
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentModal; 