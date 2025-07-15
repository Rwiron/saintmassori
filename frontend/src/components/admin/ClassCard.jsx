import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  Eye,
  GraduationCap
} from 'lucide-react';

const ClassCard = ({ 
  classData, 
  onViewDetails,
  showGradeName = true 
}) => {
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTariffsSummary = () => {
    const tariffCount = classData.tariffs_count || 0;
    const totalAmount = classData.tariffs_sum_amount || 0;
    const activeTariffCount = classData.active_tariffs_count || 0;
    
    return {
      count: tariffCount,
      total: totalAmount,
      hasActive: activeTariffCount > 0
    };
  };

  const tariffsSummary = getTariffsSummary();

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 bg-white border border-gray-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Class Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{classData.name}</h3>
                {showGradeName && classData.grade && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    {classData.grade.name}
                  </p>
                )}
              </div>
            </div>
            
            <Badge 
              variant={tariffsSummary.hasActive ? 'default' : 'secondary'}
              className="text-xs"
            >
              {tariffsSummary.count} tariffs
            </Badge>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{classData.students_count || 0} students</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span>{formatAmount(tariffsSummary.total)}</span>
            </div>
          </div>

          {/* Tariff Status Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {tariffsSummary.count > 0 ? (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{tariffsSummary.count} tariff{tariffsSummary.count !== 1 ? 's' : ''} assigned</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span>No tariffs assigned</span>
                </div>
              )}
            </div>
          </div>

          {/* View Details Button */}
          <div className="pt-2 border-t border-gray-100">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onViewDetails?.(classData)}
              className="w-full justify-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassCard; 