import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Target
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
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (isOpen && classId) {
      loadClassTariffs();
    }
  }, [isOpen, classId]);

  const loadClassTariffs = async () => {
    setLoading(true);
    try {
      const response = await tariffService.getClassTariffs(classId);
      setClassData(response.class);
      setTariffs(response.tariffs || []);
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
            <div className="flex gap-2">
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

            {/* Tariffs List */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Tariffs ({tariffs.length})</h4>
              
              {tariffs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No tariffs assigned to this class</p>
                  <p className="text-sm">Click "Add New Tariff" to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tariffs.map((tariff) => (
                    <div 
                      key={tariff.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getTariffTypeColor(tariff.type)}`}>
                          {getTariffTypeIcon(tariff.type)}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{tariff.name}</h5>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Badge variant="outline" className="text-xs">
                              {formatTariffType(tariff.type)}
                            </Badge>
                            <span>•</span>
                            <span>{formatFrequency(tariff.billing_frequency)}</span>
                            {tariff.description && (
                              <>
                                <span>•</span>
                                <span>{tariff.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatAmount(tariff.amount)}</p>
                          <Badge variant={tariff.is_active ? 'default' : 'secondary'} className="text-xs">
                            {tariff.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem 
                              onClick={() => onEditTariff?.(tariff)}
                              className="flex items-center gap-2 text-gray-700 hover:bg-gray-100"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Tariff
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRemoveTariff(tariff.id)}
                              className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove from Class
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Amount */}
            {tariffs.length > 0 && (
              <>
                <Separator />
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Total per term</span>
                    </div>
                    <span className="text-xl font-bold text-blue-900">
                      {formatAmount(totalAmount)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TariffDetailsModal; 