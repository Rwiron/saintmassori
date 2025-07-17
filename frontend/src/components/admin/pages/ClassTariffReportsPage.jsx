import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  FileText,
  Calendar,
  Receipt,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Download,
  Printer
} from 'lucide-react';

import classService from '@/services/classService';
import billingService from '@/services/billingService';
import toast from '@/utils/toast';
import { pdf } from '@react-pdf/renderer';
import TariffStudentListReport from '../reports/TariffStudentListReport';

const ClassTariffReportsPage = () => {
  const [currentView, setCurrentView] = useState('class-selection'); // 'class-selection', 'tariff-selection', 'student-progress'
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classTariffs, setClassTariffs] = useState([]);
  const [selectedTariff, setSelectedTariff] = useState(null);
  const [studentProgress, setStudentProgress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportingList, setExportingList] = useState(false);

  // Load all classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await classService.getAllClasses();
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = async (classItem) => {
    try {
      setLoading(true);
      setSelectedClass(classItem);
      
      // Load tariffs for the selected class
      const response = await billingService.getClassTariffs(classItem.id);
      setClassTariffs(response.data || []);
      setCurrentView('tariff-selection');
    } catch (error) {
      console.error('Error loading class tariffs:', error);
      toast.error('Failed to load class tariffs');
    } finally {
      setLoading(false);
    }
  };

  const handleTariffSelect = async (tariff) => {
    try {
      setLoading(true);
      setSelectedTariff(tariff);
      
      // Load student payment progress for the selected tariff
      const response = await billingService.getStudentPaymentProgressByTariff(
        selectedClass.id, 
        tariff.id
      );
      setStudentProgress(response.data || []);
      setCurrentView('student-progress');
    } catch (error) {
      console.error('Error loading student progress:', error);
      toast.error('Failed to load student progress');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToClasses = () => {
    setCurrentView('class-selection');
    setSelectedClass(null);
    setClassTariffs([]);
    setSelectedTariff(null);
    setStudentProgress([]);
  };

  const handleBackToTariffs = () => {
    setCurrentView('tariff-selection');
    setSelectedTariff(null);
    setStudentProgress([]);
  };

  // Export student list as PDF
  const exportStudentList = async () => {
    try {
      setExportingList(true);

      const reportComponent = (
        <TariffStudentListReport 
          students={studentProgress}
          classInfo={selectedClass}
          tariffInfo={selectedTariff}
          schoolInfo={{
            name: 'Saint Maria Montessori School',
            address: 'Rwanda - Gisenyi - Rubavu',
            phones: '0788421521 - 0788220001 - 0785612142'
          }}
        />
      );

      const blob = await pdf(reportComponent).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedClass?.grade?.name}_${selectedClass?.name}_${selectedTariff?.name}_Student_List.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Student list exported successfully!');
    } catch (error) {
      console.error('Error exporting student list:', error);
      toast.error('Failed to export student list');
    } finally {
      setExportingList(false);
    }
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      paid: { variant: 'success', icon: CheckCircle, label: 'Paid' },
      partial: { variant: 'warning', icon: Clock, label: 'Partial' },
      pending: { variant: 'secondary', icon: AlertCircle, label: 'Pending' },
      not_billed: { variant: 'outline', icon: XCircle, label: 'Not Billed' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderClassSelection = () => (
    <div className="space-y-6">
      <PageHeader
        title="Class Tariff Reports"
        description="Select a class to view tariff assignments and student payment progress"
        icon={BarChart3}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => (
          <Card 
            key={classItem.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleClassSelect(classItem)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {classItem.grade?.name} {classItem.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Students</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{classItem.students_count || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Capacity</span>
                  <span className="font-medium">{classItem.capacity || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <Badge variant={classItem.is_active ? 'success' : 'secondary'}>
                    {classItem.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No classes found</p>
        </div>
      )}
    </div>
  );

  const renderTariffSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={handleBackToClasses}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Classes
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedClass?.grade?.name} {selectedClass?.name} - Tariffs
          </h1>
          <p className="text-gray-600">
            Select a tariff to view student payment progress
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classTariffs.map((tariff) => (
          <Card 
            key={tariff.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleTariffSelect(tariff)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {tariff.name}
              </CardTitle>
              <Badge variant="outline" className="w-fit">
                {tariff.type}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-medium">{formatAmount(tariff.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Frequency</span>
                  <Badge variant="secondary">{tariff.frequency}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Students</span>
                  <span className="font-medium">{tariff.student_count}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Payment Progress</span>
                    <span className="font-medium">{tariff.payment_percentage}%</span>
                  </div>
                  <Progress value={tariff.payment_percentage} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-gray-600">Billed</div>
                    <div className="font-medium text-blue-600">
                      {formatAmount(tariff.total_billed)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Paid</div>
                    <div className="font-medium text-green-600">
                      {formatAmount(tariff.total_paid)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">Balance</div>
                    <div className="font-medium text-red-600">
                      {formatAmount(tariff.total_balance)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classTariffs.length === 0 && !loading && (
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No tariffs assigned to this class</p>
        </div>
      )}
    </div>
  );

  const renderStudentProgress = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={handleBackToTariffs}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tariffs
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedClass?.grade?.name} {selectedClass?.name} - {selectedTariff?.name}
            </h1>
            <p className="text-gray-600">
              Student payment progress for {selectedTariff?.name}
            </p>
          </div>
        </div>
        
        {/* Export Button */}
        <Button 
          onClick={exportStudentList}
          disabled={exportingList || studentProgress.length === 0}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          {exportingList ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {exportingList ? 'Exporting...' : 'Export PDF'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{studentProgress.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fully Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {studentProgress.filter(s => s.payment_status === 'paid').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Partial Payment</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {studentProgress.filter(s => s.payment_status === 'partial').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-red-600">
                  {studentProgress.filter(s => s.payment_status === 'pending' || s.payment_status === 'not_billed').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Payment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Student</th>
                  <th className="text-left p-3">Student ID</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Billed</th>
                  <th className="text-right p-3">Paid</th>
                  <th className="text-right p-3">Balance</th>
                  <th className="text-center p-3">Progress</th>
                  <th className="text-center p-3">Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {studentProgress.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{student.full_name}</div>
                    </td>
                    <td className="p-3 text-gray-600">{student.student_id}</td>
                    <td className="p-3">
                      <Badge variant={student.status === 'active' ? 'success' : 'secondary'}>
                        {student.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatAmount(student.total_billed)}
                    </td>
                    <td className="p-3 text-right font-medium text-green-600">
                      {formatAmount(student.total_paid)}
                    </td>
                    <td className="p-3 text-right font-medium text-red-600">
                      {formatAmount(student.balance)}
                    </td>
                    <td className="p-3">
                      <div className="w-full max-w-20 mx-auto">
                        <Progress value={student.payment_percentage} className="h-2" />
                        <div className="text-xs text-center mt-1">
                          {student.payment_percentage}%
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {getPaymentStatusBadge(student.payment_status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {studentProgress.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No students found for this tariff</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {currentView === 'class-selection' && renderClassSelection()}
      {currentView === 'tariff-selection' && renderTariffSelection()}
      {currentView === 'student-progress' && renderStudentProgress()}
    </div>
  );
};

export default ClassTariffReportsPage; 