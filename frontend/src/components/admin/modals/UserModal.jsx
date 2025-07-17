import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import userService from '@/services/userService';
import toast from '@/utils/toast';

const UserModal = ({ isOpen, onClose, user, onSave, userRoles = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      setIsEditing(!!user);
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '',
          password_confirmation: '',
          role: user.role || '',
          is_active: user.is_active ?? true
        });
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          password_confirmation: '',
          role: '',
          is_active: true
        });
      }
      setErrors({});
    }
  }, [isOpen, user]);

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
    const validation = userService.validateUserData(formData, isEditing);
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
      const submitData = { ...formData };
      
      // Remove password fields if they're empty during edit
      if (isEditing && !submitData.password) {
        delete submitData.password;
        delete submitData.password_confirmation;
      }

      if (isEditing) {
        response = await userService.updateUser(user.id, submitData);
        toast.success('User updated successfully');
      } else {
        response = await userService.createUser(submitData);
        toast.success('User created successfully');
      }

      onSave(response.data);
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred';
      const validationErrors = err.response?.data?.errors || {};
      
      setErrors(validationErrors);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getSelectedRole = () => {
    return userRoles.find(role => role.value === formData.role);
  };

  const getRoleColor = (role) => {
    return userService.getRoleColor(role);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? 'Edit User' : 'Create New User'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                User Information
              </h3>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                className={errors.name ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className={`pl-9 ${errors.email ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => handleInputChange('role', value)}
                disabled={loading}
              >
                <SelectTrigger className={`${errors.role ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {userRoles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>{role.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.role}
                </p>
              )}
              {formData.role && (
                <div className="mt-2">
                  <Badge variant={getRoleColor(formData.role)}>
                    {getSelectedRole()?.label}
                  </Badge>
                </div>
              )}
            </div>

            {/* Status Field */}
            <div className="space-y-2">
              <Label htmlFor="is_active">Account Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  disabled={loading}
                />
                <Label htmlFor="is_active" className="text-sm">
                  {formData.is_active ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Active
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Inactive
                    </span>
                  )}
                </Label>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {isEditing ? 'Change Password (Optional)' : 'Password *'}
              </h3>
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to keep current password
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {!isEditing && '*'}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={isEditing ? 'Enter new password' : 'Enter password'}
                  className={`pl-9 pr-9 ${errors.password ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Password Confirmation Field */}
            <div className="space-y-2">
              <Label htmlFor="password_confirmation">
                Confirm Password {!isEditing && '*'}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password_confirmation"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  value={formData.password_confirmation}
                  onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                  placeholder="Confirm password"
                  className={`pl-9 pr-9 ${errors.password_confirmation ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password_confirmation}
                </p>
              )}
            </div>
          </div>

          {/* Role Permissions Preview */}
          {formData.role && (
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role Permissions
                </h3>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {getSelectedRole()?.permissions?.map(permission => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {userService.getPermissionLabels()[permission] || permission}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* General Error Alert */}
          {Object.keys(errors).length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please fix the errors above before submitting.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className={`${
                isEditing 
                  ? 'bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700' 
                  : 'bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700'
              } text-white shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditing ? 'Update User' : 'Create User'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserModal; 