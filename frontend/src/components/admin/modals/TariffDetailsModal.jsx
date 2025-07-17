import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign,
  GraduationCap,
  Users,
  BookOpen,
  Car,
  Utensils,
  Settings,
  Target,
  Search
} from 'lucide-react';
import tariffService from '@/services/tariffService';
import toast from '@/utils/toast';

const TariffDetailsModal = ({ 
  isOpen, 
  onClose, 
  classId, 
  className, 
  onEditTariff,
  onCreateTariff,
  onAssignTariffs,
  refreshData 
}) => {
  const [classData, setClassData] = useState(null);
  const [tariffs, setTariffs] = useState([]);
  const [filteredTariffs, setFilteredTariffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && classId) {
      loadClassTariffs();
    }
  }, [isOpen, classId]);

  useEffect(() => {
    // Filter tariffs based on search term
    if (searchTerm.trim() === '') {
      setFilteredTariffs(tariffs);
    } else {
      const filtered = tariffs.filter(tariff =>
        tariff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tariff.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatTariffType(tariff.type).toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTariffs(filtered);
    }
  }, [searchTerm, tariffs]);

  const loadClassTariffs = async () => {
    setLoading(true);
    try {
      const response = await tariffService.getClassTariffs(classId);
      setClassData(response.class);
      setTariffs(response.tariffs || []);
      setFilteredTariffs(response.tariffs || []);
      setTotalAmount(response.total_amount || 0);
    } catch (error) {
      console.error('Error loading class tariffs:', error);
      toast.error('Failed to load class tariffs');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTariff = async (tariffId) => {
    try {
      await tariffService.removeTariffFromClass(classId, tariffId);
      toast.success('Tariff removed from class successfully');
      loadClassTariffs();
      refreshData?.();
    } catch (error) {
      console.error('Error removing tariff:', error);
      toast.error('Failed to remove tariff from class');
    }
  };

  const getTariffTypeIcon = (type) => {
    const iconMap = {
      'tuition': <GraduationCap className="w-4 h-4" />,
      'activity_fee': <Target className="w-4 h-4" />,
      'transport': <Car className="w-4 h-4" />,
      'meal': <Utensils className="w-4 h-4" />,
      'other': <Settings className="w-4 h-4" />
    };
    return iconMap[type] || <BookOpen className="w-4 h-4" />;
  };

  const getTariffTypeColor = (type) => {
    const colorMap = {
      'tuition': 'bg-blue-50 text-blue-700 border-blue-200',
      'activity_fee': 'bg-green-50 text-green-700 border-green-200',
      'transport': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'meal': 'bg-purple-50 text-purple-700 border-purple-200',
      'other': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colorMap[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatFrequency = (frequency) => {
    const frequencyMap = {
      'per_term': 'Per Term',
      'per_month': 'Per Month',
      'per_year': 'Per Year',
      'one_time': 'One Time'
    };
    return frequencyMap[frequency] || frequency;
  };

  const formatTariffType = (type) => {
    const typeMap = {
      'tuition': 'Tuition Fee',
      'activity_fee': 'Activity Fee',
      'transport': 'Transport Fee',
      'meal': 'Meal Fee',
      'other': 'Other Fee'
    };
    return typeMap[type] || type;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <BookOpen className="w-5 h-5" />
            {className} - Tariff Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Class Information */}
            {classData && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{classData.name}</h3>
                    <p className="text-sm text-gray-600">{classData.grade?.name}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{classData.students_count || 0} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{tariffs.length} tariffs</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => onCreateTariff?.(classId)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Tariff
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onAssignTariffs?.(classId)}
                className="flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Assign Existing Tariffs
              </Button>
            </div>

            <Separator />

            {/* Search Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">
                  Tariffs ({filteredTariffs.length}{searchTerm && ` of ${tariffs.length}`})
                </h4>
                {searchTerm && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSearchTerm('')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Clear search
                  </Button>
                )}
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search tariffs by name, type, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>

            {/* Tariffs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTariffs.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  {searchTerm ? (
                    <>
                      <p className="text-gray-500 mb-2">No tariffs found matching "{searchTerm}"</p>
                      <p className="text-sm text-gray-400">Try a different search term or clear the search</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 mb-2">No tariffs assigned to this class</p>
                      <p className="text-sm text-gray-400">Click "Add New Tariff" or "Assign Existing Tariffs" to get started</p>
                    </>
                  )}
                </div>
              ) : (
                filteredTariffs.map((tariff) => (
                  <Card key={tariff.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      {/* Tariff Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${getTariffTypeColor(tariff.type)}`}>
                            {getTariffTypeIcon(tariff.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 truncate">{tariff.name}</h5>
                            <p className="text-xs text-gray-500 truncate">{tariff.description}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem onClick={() => onEditTariff?.(tariff)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRemoveTariff(tariff.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Tariff Details */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {formatTariffType(tariff.type)}
                          </Badge>
                          <Badge variant={tariff.is_active ? "default" : "secondary"} className="text-xs">
                            {tariff.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{formatFrequency(tariff.billing_frequency)}</span>
                          <span className="text-lg font-semibold text-gray-900">{formatAmount(tariff.amount)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Total Summary */}
            {filteredTariffs.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Total per term</span>
                  </div>
                  <span className="text-xl font-bold text-blue-900">
                    {formatAmount(filteredTariffs.reduce((sum, tariff) => sum + parseFloat(tariff.amount), 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TariffDetailsModal; 