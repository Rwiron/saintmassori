import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Users, BookOpen, DollarSign, AlertCircle } from 'lucide-react';
import classService, { classHelpers } from '@/services/classService';
import gradeService from '@/services/gradeService';
import toast from '@/utils/toast';

const ClassModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  classData = null,
  mode = 'create' // 'create' or 'edit'
}) => {
  const [formData, setFormData] = useState({
    name: '',
    grade_id: '',
    capacity: 30,
    description: '',
    is_active: true,
    tariff_ids: []
  });
  
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [existingClasses, setExistingClasses] = useState([]);

  // Initialize form data
  useEffect(() => {
    if (mode === 'edit' && classData) {
      setFormData({
        name: classData.name || '',
        grade_id: classData.grade_id || null,
        capacity: classData.capacity || 30,
        description: classData.description || '',
        is_active: classData.is_active ?? true,
        tariff_ids: classData.tariffs?.map(t => t.id) || []
      });
      setSelectedGrade(classData.grade || null);
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        grade_id: null,
        capacity: 30,
        description: '',
        is_active: true,
        tariff_ids: []
      });
      setSelectedGrade(null);
    }
    setErrors({});
  }, [mode, classData, isOpen]);

  // Load grades when modal opens
  useEffect(() => {
    if (isOpen) {
      loadGrades();
    }
  }, [isOpen]);

  const loadGrades = async () => {
    try {
      const response = await gradeService.getActiveGrades();
      if (response.success) {
        setGrades(gradeService.sortGradesByLevel(response.data));
      }
    } catch (error) {
      console.error('Error loading grades:', error);
      toast.error('Failed to load grades');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const fetchExistingClasses = async (gradeId) => {
    if (!gradeId) {
      setExistingClasses([]);
      return;
    }
    
    try {
      const response = await classService.getClasses({ grade_id: gradeId });
      setExistingClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching existing classes:', error);
      setExistingClasses([]);
    }
  };

  const handleGradeChange = (gradeId) => {
    const grade = grades.find(g => g.id === parseInt(gradeId));
    setSelectedGrade(grade);
    handleInputChange('grade_id', parseInt(gradeId));
    fetchExistingClasses(parseInt(gradeId));
  };

  const validateForm = () => {
    const validation = classHelpers.validateClassData(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      let response;
      
      if (mode === 'create') {
        response = await classService.createClass(formData);
        toast.success('Class created successfully!');
      } else {
        response = await classService.updateClass(classData.id, formData);
        toast.success('Class updated successfully!');
      }
      
      if (response.success) {
        onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error saving class:', error);
      
      if (error.errors) {
        setErrors(error.errors);
      }
      
      const errorMessage = error.message || 'Failed to save class';
      toast.error(errorMessage);
      
      // Show specific help for duplicate class names
      if (errorMessage.includes('already exists in the grade')) {
        const availableNames = ['A', 'B', 'C', 'D', 'E', 'F']
          .filter(name => !existingClasses.some(cls => cls.name === name))
          .slice(0, 3);
        
        if (availableNames.length > 0) {
          setTimeout(() => {
            toast.info(`Try using: ${availableNames.join(', ')}`);
          }, 1000);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getCapacityColor = () => {
    if (formData.capacity <= 15) return 'text-red-600';
    if (formData.capacity <= 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getPreviewClassName = () => {
    if (!selectedGrade || !formData.name) return 'Preview: ---';
    return `Preview: ${selectedGrade.name}${formData.name}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            {mode === 'create' ? 'Create New Class' : 'Edit Class'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Class Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Class Preview</span>
            </div>
            <div className="text-lg font-semibold text-blue-800">
              {getPreviewClassName()}
            </div>
            {selectedGrade && (
              <div className="text-sm text-blue-600 mt-1">
                {selectedGrade.display_name} • Level {selectedGrade.level}
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Grade Selection */}
            <div className="space-y-2">
              <Label htmlFor="grade_id">Grade *</Label>
              <Select
                value={formData.grade_id ? formData.grade_id.toString() : undefined}
                onValueChange={handleGradeChange}
              >
                <SelectTrigger className={errors.grade_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {grades && grades.length > 0 ? (
                    grades
                      .filter((grade) => grade && grade.id && grade.id.toString().trim() !== '')
                      .map((grade) => (
                        <SelectItem key={grade.id} value={grade.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {grade.name}
                            </Badge>
                            <span>{grade.display_name}</span>
                          </div>
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading grades...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.grade_id && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.grade_id}
                </p>
              )}
            </div>

            {/* Existing Classes Info */}
            {selectedGrade && existingClasses.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Existing Classes in {selectedGrade.name}</Label>
                <div className="flex flex-wrap gap-2">
                  {existingClasses.map((cls) => (
                    <Badge key={cls.id} variant="secondary" className="text-xs">
                      {cls.name} ({cls.full_name})
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Suggested names: {['A', 'B', 'C', 'D', 'E', 'F']
                    .filter(name => !existingClasses.some(cls => cls.name === name))
                    .slice(0, 3)
                    .join(', ')}
                </p>
              </div>
            )}

            {/* Class Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Class Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., A, B, C"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Class Capacity *</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="capacity"
                type="number"
                min="1"
                max="100"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', parseInt(e.target.value))}
                className={`pl-10 ${errors.capacity ? 'border-red-500' : ''}`}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${getCapacityColor()}`}>
                {formData.capacity} students maximum
              </span>
              <span className="text-gray-500">
                Recommended: 20-30 students
              </span>
            </div>
            {errors.capacity && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.capacity}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description for the class"
              rows={3}
              className="resize-none"
            />
            <p className="text-sm text-gray-500">
              Optional description to help identify this class
            </p>
          </div>

          {/* Current Enrollment (Edit Mode Only) */}
          {mode === 'edit' && classData && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Current Enrollment</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {classData.current_enrollment || 0}
                  </div>
                  <div className="text-sm text-gray-600">Enrolled</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {classHelpers.getAvailableSpots(classData.current_enrollment || 0, formData.capacity)}
                  </div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${classHelpers.getOccupancyColor(classData.current_enrollment || 0, formData.capacity)}`}>
                    {classHelpers.calculateOccupancyRate(classData.current_enrollment || 0, formData.capacity)}%
                  </div>
                  <div className="text-sm text-gray-600">Occupancy</div>
                </div>
              </div>
            </div>
          )}

          {/* Tariff Information (Edit Mode Only) */}
          {mode === 'edit' && classData?.tariffs && classData.tariffs.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Assigned Tariffs</span>
              </div>
              <div className="space-y-2">
                {classData.tariffs.map((tariff) => (
                  <div key={tariff.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                    <div>
                      <div className="font-medium">{tariff.name}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {tariff.type?.replace('_', ' ')} • {tariff.frequency_label}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        RWF {parseFloat(tariff.amount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total per Term:</span>
                    <span className="text-green-600">
                      RWF {classData.tariffs.reduce((sum, t) => sum + parseFloat(t.amount), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </div>
              ) : (
                mode === 'create' ? 'Create Class' : 'Update Class'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClassModal; 