import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Download,
  Shield,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import UserModal from '../modals/UserModal';
import userService from '@/services/userService';
import toast from '@/utils/toast';

const UserManagementPage = () => {
  const { user: currentUser } = useSelector(state => state.auth);
  
  // State management
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadUsers();
    loadStatistics();
    loadUserRoles();
  }, []);

  // Filter users when search term or filters change
  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading users...');
      const response = await userService.getUsers();
      console.log('API Response:', response);
      console.log('Users data:', response);
      setUsers(response || []);
    } catch (err) {
      console.error('Error loading users:', err);
      console.error('Error response:', err.response);
      setError('Failed to load users. Please try again.');
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await userService.getUserStatistics();
      setStatistics(response);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const loadUserRoles = async () => {
    try {
      const response = await userService.getUserRoles();
      setUserRoles(response || []);
    } catch (err) {
      console.error('Failed to load user roles:', err);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = userService.filterUsers(filtered, { search: searchTerm });
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = userService.filterUsers(filtered, { role: roleFilter });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = userService.filterUsers(filtered, { status: statusFilter });
    }

    // Apply sorting
    filtered = userService.sortUsers(filtered, sortBy, sortOrder);

    setFilteredUsers(filtered);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      toast.success('User deleted successfully');
      loadUsers();
      loadStatistics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await userService.activateUser(userId);
      toast.success('User activated successfully');
      loadUsers();
      loadStatistics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate user');
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      await userService.deactivateUser(userId);
      toast.success('User deactivated successfully');
      loadUsers();
      loadStatistics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const handleUserSaved = () => {
    setShowUserModal(false);
    setEditingUser(null);
    loadUsers();
    loadStatistics();
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to perform bulk action');
      return;
    }

    const actionLabels = {
      activate: 'activate',
      deactivate: 'deactivate',
      delete: 'delete'
    };

    if (!confirm(`Are you sure you want to ${actionLabels[action]} ${selectedUsers.length} selected user(s)?`)) {
      return;
    }

    try {
      setBulkActionLoading(true);
      const response = await userService.bulkAction(action, selectedUsers);
      
      const { successful, errors } = response;
      
      if (successful > 0) {
        toast.success(`Successfully ${actionLabels[action]}d ${successful} user(s)`);
      }
      
      if (errors > 0) {
        toast.error(`Failed to ${actionLabels[action]} ${errors} user(s)`);
      }

      setSelectedUsers([]);
      loadUsers();
      loadStatistics();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionLabels[action]} users`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getRoleColor = (role) => {
    return userService.getRoleColor(role);
  };

  const getStatusColor = (isActive) => {
    return userService.getStatusColor(isActive);
  };

  const canPerformAction = (targetUser, action) => {
    return userService.canPerformAction(currentUser, targetUser, action);
  };

  const exportUsers = () => {
    const exportData = userService.exportUsers(filteredUsers);
    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="User Management" 
          description="Manage system users and their roles"
          icon={Users}
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="User Management" 
          description="Manage system users and their roles"
          icon={Users}
        />
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="text-center">
          <Button onClick={loadUsers}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        description="Manage system users and their roles"
        icon={Users}
      />

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_users}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.active_users}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Inactive Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.inactive_users}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Recent Logins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.recent_logins}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Roles</SelectItem>
                  {userRoles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportUsers}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                onClick={handleCreateUser}
                className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {selectedUsers.length}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('activate')}
                    disabled={bulkActionLoading}
                    className="bg-white hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800"
                  >
                    <UserCheck className="h-4 w-4 mr-1.5" />
                    Activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('deactivate')}
                    disabled={bulkActionLoading}
                    className="bg-white hover:bg-orange-50 border-orange-200 text-orange-700 hover:text-orange-800"
                  >
                    <UserX className="h-4 w-4 mr-1.5" />
                    Deactivate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('delete')}
                    disabled={bulkActionLoading}
                    className="bg-white hover:bg-red-50 border-red-200 text-red-700 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 border-b border-gray-200">
                  <TableHead className="w-12 py-4 pl-6">
                    <Checkbox
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="rounded-md"
                    />
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-gray-900">User</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-900">Role</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-900">Last Login</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-900">Created</TableHead>
                  <TableHead className="w-12 py-4 pr-6 font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                            ? 'No users found' 
                            : 'No users yet'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                            ? 'Try adjusting your search or filters' 
                            : 'Get started by adding your first user'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, index) => (
                    <TableRow 
                      key={user.id} 
                      className={`hover:bg-gray-50/50 transition-colors ${
                        index !== filteredUsers.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <TableCell className="py-4 pl-6">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                          className="rounded-md"
                        />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                              <span className="text-sm font-semibold text-white">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {user.is_active && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 truncate">{user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {user.role ? (
                          <Badge 
                            variant={getRoleColor(user.role)} 
                            className="font-medium shadow-sm"
                          >
                            <Shield className="h-3 w-3 mr-1.5" />
                            {user.role_label || user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">No role</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge 
                          variant={getStatusColor(user.is_active)}
                          className="font-medium shadow-sm"
                        >
                          {user.is_active ? (
                            <CheckCircle className="h-3 w-3 mr-1.5" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1.5" />
                          )}
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm text-gray-600 flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="font-medium">
                            {user.last_login_at 
                              ? new Date(user.last_login_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'Never'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm text-gray-600 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="font-medium">
                            {new Date(user.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white shadow-lg border border-gray-200">
                            <DropdownMenuItem 
                              onClick={() => handleEditUser(user)}
                              className="hover:bg-gray-50"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {user.is_active ? (
                              <DropdownMenuItem 
                                onClick={() => handleDeactivateUser(user.id)}
                                disabled={!canPerformAction(user, 'deactivate')}
                                className="hover:bg-gray-50"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleActivateUser(user.id)}
                                className="hover:bg-gray-50"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={!canPerformAction(user, 'delete')}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Modal */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={editingUser}
        onSave={handleUserSaved}
        userRoles={userRoles}
      />
    </div>
  );
};

export default UserManagementPage; 