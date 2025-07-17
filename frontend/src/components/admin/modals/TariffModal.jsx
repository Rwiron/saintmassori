import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, 
  DollarSign, 
  AlertCircle, 
  Building2, 
  Users, 
  X,
  Plus,
  Check
} from 'lucide-react';
import tariffService from '@/services/tariffService';
import classService from '@/services/classService';
import toast from '@/utils/toast';

const TariffModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  tariff = null,
  classData = null // When creating a tariff for a specific class
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    amount: '',
    billing_frequency: '',
    description: '',
    is_active: true,
    class_ids: []
  });
  
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showClassAssignment, setShowClassAssignment] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState([]);

  // Determine mode based on whether we're editing or creating
  const mode = tariff ? 'edit' : 'create';

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClasses();
      if (tariff) {
        populateForm(tariff);
      } else {
        resetForm();
      }
    }
  }, [isOpen, tariff, classData]);

  const loadClasses = async () => {
    try {
      const response = await classService.getAllClasses();
      if (response.success) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const populateForm = (data) => {
    setFormData({
      name: data.name || '',
      type: data.type || '',
      amount: data.amount || '',
      billing_frequency: data.billing_frequency || '',
      description: data.description || '',
      is_active: data.is_active ?? true,
      class_ids: data.classes?.map(cls => cls.id) || []
    });
    setSelectedClasses(data.classes?.map(cls => cls.id) || []);
  };

  const resetForm = () => {
    const initialFormData = {
      name: '',
      type: 'tuition',
      amount: '',
      billing_frequency: 'per_term',
      description: '',
      is_active: true,
      class_ids: classData ? [classData.id] : []
    };
    setFormData(initialFormData);
    setSelectedClasses(classData ? [classData] : []);
    setErrors({});
    setShowClassAssignment(false);
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
        [field]: ''
      }));
    }
  };

  const handleClassToggle = (classId) => {
    setSelectedClasses(prev => {
      const newSelected = prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId];
      
      setFormData(prevForm => ({
        ...prevForm,
        class_ids: newSelected
      }));
      
      return newSelected;
    });
  };

  const validateForm = () => {
    const validation = tariffService.validateTariffData(formData);
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
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        class_ids: selectedClasses
      };

      // Call the parent submit handler
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error saving tariff:', error);
      if (error.errors) {
        setErrors(error.errors);
      }
      toast.error(error.message || 'Failed to save tariff');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedClassesInfo = () => {
    return classes.filter(cls => selectedClasses.includes(cls.id));
  };

  const getTotalStudents = () => {
    return getSelectedClassesInfo().reduce((total, cls) => total + (cls.current_enrollment || 0), 0);
  };

  const getProjectedRevenue = () => {
    if (!formData.amount || !formData.billing_frequency) return null;
    
    const mockTariff = {
      amount: formData.amount,
      billing_frequency: formData.billing_frequency
    };
    
    return tariffService.calculateProjectedRevenue(mockTariff, getTotalStudents());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Receipt className="w-5 h-5 text-green-600" />
            {tariff ? 'Edit Tariff' : classData ? `Add Tariff to ${classData.full_name}` : 'Create New Tariff'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700">
                    Tariff Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Tuition Fee, Activity Fee"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type" className="text-gray-700">
                    Tariff Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select tariff type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {tariffService.getTariffTypes().map(type => (
                        <SelectItem key={type.value} value={type.value} className="text-gray-900 focus:bg-gray-100">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.type}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="amount" className="text-gray-700">
                    Amount (RWF) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="0.00"
                      className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.amount}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="billing_frequency" className="text-gray-700">
                    Billing Frequency <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.billing_frequency} onValueChange={(value) => handleInputChange('billing_frequency', value)}>
                    <SelectTrigger className={errors.billing_frequency ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select billing frequency" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {tariffService.getBillingFrequencies().map(freq => (
                        <SelectItem key={freq.value} value={freq.value} className="text-gray-900 focus:bg-gray-100">
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.billing_frequency && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.billing_frequency}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-700">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Optional description for this tariff"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active" className="text-gray-700">
                    Active Tariff
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Class Assignment & Revenue Projection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 flex items-center justify-between">
                  Class Assignment
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClassAssignment(!showClassAssignment)}
                  >
                    {showClassAssignment ? 'Hide' : 'Show'} Classes
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showClassAssignment && (
                  <div className="space-y-4">
                    <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                      {classes.map(cls => (
                        <div key={cls.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`class-${cls.id}`}
                            checked={selectedClasses.includes(cls.id)}
                            onCheckedChange={() => handleClassToggle(cls.id)}
                          />
                          <Label htmlFor={`class-${cls.id}`} className="flex-1 cursor-pointer text-gray-900">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{cls.full_name}</span>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="w-3 h-3" />
                                {cls.current_enrollment || 0}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">{cls.grade?.display_name}</div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Classes Summary */}
                {selectedClasses.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Selected Classes ({selectedClasses.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {getSelectedClassesInfo().map(cls => (
                        <Badge key={cls.id} variant="secondary" className="text-xs">
                          {cls.full_name}
                          <button
                            type="button"
                            onClick={() => handleClassToggle(cls.id)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-green-700">
                      <strong>Total Students:</strong> {getTotalStudents()}
                    </div>
                  </div>
                )}

                {/* Revenue Projection */}
                {formData.amount && formData.billing_frequency && getTotalStudents() > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Revenue Projection</h4>
                    {(() => {
                      const projection = getProjectedRevenue();
                      return projection ? (
                        <div className="text-sm text-blue-700 space-y-1">
                          <div><strong>Per Term:</strong> {tariffService.formatAmount(projection.per_term)}</div>
                          <div><strong>Per Year:</strong> {tariffService.formatAmount(projection.per_year)}</div>
                          <div><strong>Total Projected:</strong> {tariffService.formatAmount(projection.total_projected)}</div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex justify-end gap-2">
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
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {tariff ? 'Update Tariff' : 'Create Tariff'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TariffModal; 