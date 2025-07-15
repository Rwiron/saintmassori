import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  Edit,
  GraduationCap,
  Receipt
} from 'lucide-react';

const ClassTariffCard = ({ 
  classData, 
  onAddTariff, 
  onEditTariff, 
  onRemoveTariff, 
  onAssignExistingTariff 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getTariffTypeIcon = (type) => {
    switch (type) {
      case 'tuition':
        return <GraduationCap className="w-4 h-4" />;
      case 'activity_fee':
        return <BookOpen className="w-4 h-4" />;
      case 'transport':
        return <Users className="w-4 h-4" />;
      case 'meal':
        return <Receipt className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTariffTypeColor = (type) => {
    switch (type) {
      case 'tuition':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'activity_fee':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'transport':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'meal':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getFrequencyDisplay = (frequency) => {
    const frequencyMap = {
      'per_term': 'Per Term',
      'per_month': 'Per Month',
      'per_year': 'Per Year',
      'one_time': 'One Time'
    };
    return frequencyMap[frequency] || frequency;
  };

  const getTotalAmount = () => {
    if (!classData.tariffs || classData.tariffs.length === 0) return 0;
    return classData.tariffs.reduce((total, tariff) => total + parseFloat(tariff.amount), 0);
  };

  return (
    <Card className="mb-6 shadow-sm border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {classData.full_name}
              </CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{classData.grade?.display_name || classData.grade?.name}</span>
                <span>•</span>
                <span>{classData.current_enrollment || 0}/{classData.capacity} students</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-sm">
              {classData.tariffs?.length || 0} tariffs
            </Badge>
            <Badge variant="outline" className="text-sm font-medium">
              Total: {formatAmount(getTotalAmount())}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuItem 
                  onClick={() => onAddTariff(classData)}
                  className="text-gray-700 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Tariff
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onAssignExistingTariff(classData)}
                  className="text-gray-700 hover:bg-gray-100"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Assign Existing Tariff
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {!classData.tariffs || classData.tariffs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No tariffs assigned to this class</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => onAddTariff(classData)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Tariff
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {classData.tariffs.map((tariff) => (
              <div 
                key={tariff.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getTariffTypeColor(tariff.type)}`}>
                    {getTariffTypeIcon(tariff.type)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{tariff.name}</div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Badge variant="outline" className="text-xs">
                        {tariff.type_label || tariff.type}
                      </Badge>
                      <span>•</span>
                      <span>{getFrequencyDisplay(tariff.billing_frequency)}</span>
                      {tariff.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-xs">{tariff.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatAmount(tariff.amount)}
                    </div>
                    <Badge 
                      variant={tariff.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
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
                        onClick={() => onEditTariff(tariff)}
                        className="text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Tariff
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onRemoveTariff(classData.id, tariff.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove from Class
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            
            {/* Total Summary */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Total per term</span>
              </div>
              <div className="text-xl font-bold text-blue-900">
                {formatAmount(getTotalAmount())}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClassTariffCard; 