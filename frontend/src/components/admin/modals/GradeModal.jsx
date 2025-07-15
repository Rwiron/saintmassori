import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X, BookOpen, AlertCircle, Plus, Trash2 } from 'lucide-react';
import gradeService from '@/services/gradeService';
import toast from '@/utils/toast';

const GradeModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  gradeData = null,
  mode = 'create' // 'create' or 'edit'
}) => {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    is_active: true,
    create_default_classes: false,
    default_class_names: ['A', 'B']
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data
  useEffect(() => {
    if (mode === 'edit' && gradeData) {
      setFormData({
        name: gradeData.name || '',
        display_name: gradeData.display_name || '',
        description: gradeData.description || '',
        is_active: gradeData.is_active ?? true,
        create_default_classes: false,
        default_class_names: ['A', 'B']
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        display_name: '',
        description: '',
        is_active: true,
        create_default_classes: false,
        default_class_names: ['A', 'B']
      });
    }
    setErrors({});
  }, [mode, gradeData, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleClassNameChange = (index, value) => {
    const newClassNames = [...formData.default_class_names];
    newClassNames[index] = value;
    setFormData(prev => ({
      ...prev,
      default_class_names: newClassNames
    }));
  };

  const addClassName = () => {
    setFormData(prev => ({
      ...prev,
      default_class_names: [...prev.default_class_names, '']
    }));
  };

  const removeClassName = (index) => {
    const newClassNames = formData.default_class_names.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      default_class_names: newClassNames
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Grade name is required';
    } else if (!/^[NP]\d+$/.test(formData.name)) {
      newErrors.name = 'Grade name must follow format: N1, P1, P2, etc.';
    }
    
    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    }
    
    // Level is now auto-assigned by the backend, so no validation needed

    if (formData.create_default_classes && formData.default_class_names.length === 0) {
      newErrors.default_class_names = 'At least one class name is required when creating default classes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let response;
      const submitData = {
        name: formData.name.trim(),
        display_name: formData.display_name.trim(),
        description: formData.description?.trim() || null,
        is_active: Boolean(formData.is_active)
      };

      // Only add create_default_classes and default_class_names if creating default classes
      if (formData.create_default_classes) {
        submitData.create_default_classes = true;
        submitData.default_class_names = formData.default_class_names.filter(name => name.trim());
      }

      // Remove null/undefined values to avoid sending them to the API
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === null || submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      console.log('Submitting grade data:', submitData);

      if (mode === 'create') {
        response = await gradeService.createGrade(submitData);
        toast.success('Grade created successfully');
      } else {
        response = await gradeService.updateGrade(gradeData.id, submitData);
        toast.success('Grade updated successfully');
      }

      onSuccess(response);
      onClose();
    } catch (error) {
      console.error('Error saving grade:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        // Show first validation error as toast
        const firstError = Object.values(error.response.data.errors)[0];
        if (Array.isArray(firstError)) {
          toast.error(firstError[0]);
        } else {
          toast.error(firstError);
        }
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save grade';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getGradePreview = () => {
    if (!formData.name || !formData.display_name) return null;
    
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Grade Preview</h4>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-sm">
            {formData.name}
          </Badge>
          <span className="text-gray-600">{formData.display_name}</span>
                      <span className="text-sm text-gray-500">• Level auto-assigned</span>
        </div>
        {formData.description && (
          <p className="text-sm text-gray-600 mb-2">{formData.description}</p>
        )}
        {formData.create_default_classes && formData.default_class_names.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Default Classes:</p>
            <div className="flex flex-wrap gap-1">
              {formData.default_class_names.filter(name => name.trim()).map((className, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {formData.name}{className}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            {mode === 'create' ? 'Create New Grade' : 'Edit Grade'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grade Preview */}
          {getGradePreview()}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Grade Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Grade Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value.toUpperCase())}
                placeholder="e.g., N1, P1, P2"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="e.g., Nursery 1, Primary 1"
                className={errors.display_name ? 'border-red-500' : ''}
              />
              {errors.display_name && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.display_name}
                </p>
              )}
            </div>
          </div>

          {/* Level is now auto-assigned by the backend */}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description for this grade"
              className="min-h-[80px]"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label htmlFor="is_active" className="text-sm font-medium">Active Grade</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
          </div>

          {/* Create Default Classes (only for create mode) */}
          {mode === 'create' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Label htmlFor="create_default_classes" className="text-sm font-medium">Create Default Classes</Label>
                <Switch
                  id="create_default_classes"
                  checked={formData.create_default_classes}
                  onCheckedChange={(checked) => handleInputChange('create_default_classes', checked)}
                />
              </div>

              {formData.create_default_classes && (
                <div className="space-y-2">
                  <Label>Default Class Names</Label>
                  <div className="space-y-2">
                    {formData.default_class_names.map((className, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={className}
                          onChange={(e) => handleClassNameChange(index, e.target.value)}
                          placeholder="e.g., A, B, C"
                          className="flex-1"
                        />
                        {formData.default_class_names.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeClassName(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addClassName}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Class
                  </Button>
                  {errors.default_class_names && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.default_class_names}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
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
                mode === 'create' ? 'Create Grade' : 'Update Grade'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GradeModal; 