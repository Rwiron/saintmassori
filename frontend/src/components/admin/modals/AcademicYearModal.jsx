import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Save, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import academicYearService from '@/services/academicYearService';
import toast from '@/utils/toast';

const AcademicYearModal = ({ isOpen, onClose, academicYear = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (academicYear) {
      setIsEditing(true);
      setFormData({
        name: academicYear.name || '',
        start_date: academicYear.start_date ? academicYear.start_date.split('T')[0] : '',
        end_date: academicYear.end_date ? academicYear.end_date.split('T')[0] : '',
        description: academicYear.description || ''
      });
    } else {
      setIsEditing(false);
      setFormData({
        name: '',
        start_date: '',
        end_date: '',
        description: ''
      });
    }
    setErrors({});
  }, [academicYear, isOpen]);

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
    const validation = academicYearService.validateAcademicYear({
      ...formData,
      id: academicYear?.id
    });
    
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
        response = await academicYearService.updateAcademicYear(academicYear.id, formData);
        toast.success('Academic year updated successfully!');
      } else {
        response = await academicYearService.createAcademicYear(formData);
        toast.success('Academic year created successfully!');
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving academic year:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error(error.response?.data?.message || 'An error occurred while saving the academic year');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
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
      const duration = academicYearService.calculateDurationMonths(formData.start_date, formData.end_date);
      return duration;
    }
    return 0;
  };

  const duration = calculateDuration();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <Calendar className="h-5 w-5" />
            {isEditing ? 'Edit Academic Year' : 'Add New Academic Year'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Academic Year Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Academic Year Name *
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., 2024-2025"
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
              />
              {errors.end_date && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.end_date}
                </p>
              )}
            </div>
          </div>

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
                    {duration} months
                  </Badge>
                </div>
                {duration < 6 && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Academic year should be at least 6 months long
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
              placeholder="Optional description for the academic year..."
              rows={3}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none ${
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
          {isEditing && academicYear && (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Current Status</p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(academicYear.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={academicYearService.getStatusColor(academicYear.status)}>
                    {academicYearService.getStatusLabel(academicYear.status)}
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
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
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

export default AcademicYearModal; 