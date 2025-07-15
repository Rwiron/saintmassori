import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Save, X, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import termService from '@/services/termService';
import academicYearService from '@/services/academicYearService';
import toast from '@/utils/toast';

const TermModal = ({ isOpen, onClose, term = null, onSuccess, academicYearId = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    academic_year_id: academicYearId || '',
    start_date: '',
    end_date: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [loadingAcademicYears, setLoadingAcademicYears] = useState(false);

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      setLoadingAcademicYears(true);
      const response = await academicYearService.getAcademicYears();
      if (response.success) {
        // Filter to show only active academic years
        const activeYears = response.data.filter(year => year.status === 'active');
        setAcademicYears(activeYears);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
      toast.error('Failed to load academic years');
    } finally {
      setLoadingAcademicYears(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAcademicYears();
    }
  }, [isOpen]);

  useEffect(() => {
    if (term) {
      setIsEditing(true);
      setFormData({
        name: term.name || '',
        academic_year_id: term.academic_year_id || academicYearId || '',
        start_date: term.start_date ? term.start_date.split('T')[0] : '',
        end_date: term.end_date ? term.end_date.split('T')[0] : '',
        description: term.description || ''
      });
    } else {
      setIsEditing(false);
      setFormData({
        name: '',
        academic_year_id: academicYearId || '',
        start_date: '',
        end_date: '',
        description: ''
      });
    }
    setErrors({});
  }, [term, isOpen, academicYearId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const validation = termService.validateTerm(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      let response;
      if (isEditing) {
        response = await termService.updateTerm(term.id, formData);
        toast.success('Term updated successfully!');
      } else {
        response = await termService.createTerm(formData);
        toast.success('Term created successfully!');
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving term:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error(error.response?.data?.message || 'An error occurred while saving the term');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      academic_year_id: academicYearId || '',
      start_date: '',
      end_date: '',
      description: ''
    });
    setErrors({});
    onClose();
  };

  // Calculate duration for preview
  const calculateDuration = () => {
    if (formData.start_date && formData.end_date) {
      const duration = termService.calculateDurationDays(formData.start_date, formData.end_date);
      return duration;
    }
    return 0;
  };

  const duration = calculateDuration();
  const selectedAcademicYear = academicYears.find(year => year.id === parseInt(formData.academic_year_id));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <Calendar className="h-5 w-5" />
            {isEditing ? 'Edit Term' : 'Add New Term'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Academic Year Selection */}
          <div className="space-y-2">
            <label htmlFor="academic_year_id" className="text-sm font-medium text-gray-700">
              Academic Year *
            </label>
            <select
              id="academic_year_id"
              name="academic_year_id"
              value={formData.academic_year_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.academic_year_id ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting || loadingAcademicYears || (academicYearId && !isEditing)}
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} ({year.status})
                </option>
              ))}
            </select>
            {errors.academic_year_id && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.academic_year_id}
              </p>
            )}
          </div>

          {/* Term Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Term Name *
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Term 1, First Term, Fall Semester"
              className={errors.name ? 'border-red-500' : 'border-gray-300'}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start_date" className="text-sm font-medium text-gray-700">
                Start Date *
              </label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange}
                className={errors.start_date ? 'border-red-500' : 'border-gray-300'}
                disabled={isSubmitting}
                min={selectedAcademicYear?.start_date?.split('T')[0]}
                max={selectedAcademicYear?.end_date?.split('T')[0]}
              />
              {errors.start_date && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.start_date}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="end_date" className="text-sm font-medium text-gray-700">
                End Date *
              </label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleInputChange}
                className={errors.end_date ? 'border-red-500' : 'border-gray-300'}
                disabled={isSubmitting}
                min={formData.start_date}
                max={selectedAcademicYear?.end_date?.split('T')[0]}
              />
              {errors.end_date && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.end_date}
                </p>
              )}
            </div>
          </div>

          {/* Academic Year Info */}
          {selectedAcademicYear && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Academic Year Period</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {selectedAcademicYear.name}
                  </Badge>
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  {new Date(selectedAcademicYear.start_date).toLocaleDateString()} - {new Date(selectedAcademicYear.end_date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Duration Preview */}
          {duration > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Duration Preview</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {duration} days
                  </Badge>
                </div>
                {duration < 7 && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Term should be at least 7 days long
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional description for the term..."
              rows={3}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Status Information for Editing */}
          {isEditing && term && (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Current Status</p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(term.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={termService.getStatusColor(term.status)}>
                    {termService.getStatusLabel(term.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loadingAcademicYears}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TermModal; 