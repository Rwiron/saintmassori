import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/ui/page-header';
import { 
  Search, 
  Users, 
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  ArrowLeft,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Receipt,
  Calendar,
  FileText,
  Download
} from 'lucide-react';

import { pdf } from '@react-pdf/renderer';
import StudentPaymentReport from '../reports/StudentPaymentReport';
import billingService from '@/services/billingService';
import toast from '@/utils/toast';

const PaymentsPage = () => {
  const navigate = useNavigate();
  
  // View states
  const [currentView, setCurrentView] = useState('overview'); // 'overview', 'class-detail'
  const [selectedClass, setSelectedClass] = useState(null);
  
  // Data states
  const [paymentData, setPaymentData] = useState({
    classes: [],
    statistics: {
      total_students: 0,
      paid_students: 0,
      partial_students: 0,
      pending_students: 0,
      overdue_students: 0,
      total_revenue: 0,
      collected_revenue: 0,
      outstanding_revenue: 0
    }
  });
  const [classDetails, setClassDetails] = useState({
    class: null,
    students: []
  });
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudents, setExpandedStudents] = useState(new Set());
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  useEffect(() => {
    loadPaymentOverview();
  }, []);

  // Load payment overview data using optimized endpoint
  const loadPaymentOverview = async () => {
    try {
      setLoading(true);
      const response = await billingService.getPaymentOverview();
      
      if (response.success) {
        setPaymentData(response.data);
      } else {
        toast.error('Failed to load payment data');
      }
    } catch (error) {
      console.error('Error loading payment overview:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  // Load class details using optimized endpoint
  const loadClassDetails = async (classData) => {
    try {
      setLoadingStudents(true);
      const response = await billingService.getClassPaymentDetails(classData.id);
      
      if (response.success) {
        setClassDetails(response.data);
      } else {
        toast.error('Failed to load class details');
      }
    } catch (error) {
      console.error('Error loading class details:', error);
      toast.error('Failed to load class details');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Handle class selection for detailed view
  const handleViewClassPayments = (classData) => {
    setSelectedClass(classData);
    setCurrentView('class-detail');
    loadClassDetails(classData);
  };

  // Handle back to overview
  const handleBackToOverview = () => {
    setCurrentView('overview');
    setSelectedClass(null);
    setClassDetails({ class: null, students: [] });
    setSearchTerm('');
    setExpandedStudents(new Set());
  };

  // Toggle student details expansion
  const toggleStudentExpansion = (studentId) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  // Generate and download PDF report for student
  const downloadStudentReport = async (student) => {
    try {
      // Validate student data
      if (!student || !student.full_name) {
        toast.error('Invalid student data');
        return;
      }

      // Validate class details
      if (!classDetails || !classDetails.class) {
        toast.error('Class information not available');
        return;
      }

      setDownloadingPdf(student.id);

      const reportComponent = (
        <StudentPaymentReport 
          student={student} 
          classInfo={classDetails.class}
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
      link.download = `${student.full_name.replace(/\s+/g, '_')}_Payment_Report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Payment report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report. Please try again.');
    } finally {
      setDownloadingPdf(null);
    }
  };

  // Filter classes based on search (for overview)
  const filteredClasses = paymentData.classes.filter(cls => 
    cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.grade?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter students based on search (for class detail view)
  const filteredStudents = classDetails.students.filter(student => {
    const fullName = student.full_name || `${student.first_name} ${student.last_name}`;
    return fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           student.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Group classes by grade
  const classesGroupedByGrade = filteredClasses.reduce((groups, classData) => {
    const gradeName = classData.grade?.name || 'No Grade';
    if (!groups[gradeName]) {
      groups[gradeName] = [];
    }
    groups[gradeName].push(classData);
    return groups;
  }, {});

  const sortedGrades = Object.keys(classesGroupedByGrade).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  // Utility functions
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentStatusColor = (percentage) => {
    if (percentage === 100) return 'text-green-600';
    if (percentage > 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPaymentStatusIcon = (percentage) => {
    if (percentage === 100) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (percentage > 50) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getBillStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payment data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      {/* Dynamic Page Header */}
      {currentView === 'overview' ? (
        <PageHeader
          title="Payment Overview"
          description="View student payment status and class payment details"
        />
      ) : (
        <PageHeader
          title={`${classDetails.class?.grade?.name} ${classDetails.class?.name} - Payment Details`}
          description={`Payment status for ${filteredStudents.length} students in this class`}
        >
          <Button 
            variant="outline" 
            onClick={handleBackToOverview}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Overview</span>
          </Button>
        </PageHeader>
      )}

      {/* Payment Statistics - Show only in overview */}
      {currentView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{paymentData.statistics.total_students}</div>
              <p className="text-xs text-gray-500 mt-1">Across all classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Paid Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{paymentData.statistics.paid_students}</div>
              <p className="text-xs text-gray-500 mt-1">
                {paymentData.statistics.total_students > 0 ? 
                  Math.round((paymentData.statistics.paid_students / paymentData.statistics.total_students) * 100) : 0
                }% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                Partial/Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {paymentData.statistics.partial_students + paymentData.statistics.pending_students}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {paymentData.statistics.partial_students} partial, {paymentData.statistics.pending_students} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                Revenue Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatAmount(paymentData.statistics.collected_revenue)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatAmount(paymentData.statistics.outstanding_revenue)} outstanding
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={currentView === 'overview' ? "Search classes..." : "Search students..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        {currentView === 'overview' && (
          <Button 
            onClick={() => navigate('/admin/billing')}
            className="bg-green-600 hover:bg-green-700 h-10 w-full sm:w-auto"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Manage Billing
          </Button>
        )}
      </div>

      {/* Classes Payment Overview - Show only in overview */}
      {currentView === 'overview' && (
        <div className="space-y-6">
          {sortedGrades.map(gradeName => (
            <div key={gradeName} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold text-sm">{gradeName}</span>
                </div>
                Grade {gradeName}
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {classesGroupedByGrade[gradeName].map(classData => (
                  <Card 
                    key={classData.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500"
                    onClick={() => handleViewClassPayments(classData)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{classData.grade?.name} {classData.name}</CardTitle>
                            <p className="text-sm text-gray-500">{classData.student_count} students</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPaymentStatusIcon(classData.payment_percentage)}
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Payment Progress */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Payment Progress</span>
                          <span className={`text-sm font-medium ${getPaymentStatusColor(classData.payment_percentage)}`}>
                            {Math.round(classData.payment_percentage)}%
                          </span>
                        </div>
                        <Progress value={classData.payment_percentage} className="h-2" />
                      </div>
                      
                      {/* Payment Summary */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total Amount</p>
                          <p className="font-semibold text-gray-900">{formatAmount(classData.total_amount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Collected</p>
                          <p className="font-semibold text-green-600">{formatAmount(classData.paid_amount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Outstanding</p>
                          <p className="font-semibold text-red-600">{formatAmount(classData.balance)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Paid Students</p>
                          <p className="font-semibold text-green-600">
                            {classData.paid_students}/{classData.student_count}
                          </p>
                        </div>
                      </div>
                      
                      {/* Student Status Summary */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {classData.paid_students > 0 && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {classData.paid_students} Paid
                          </Badge>
                        )}
                        {classData.partial_students > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            {classData.partial_students} Partial
                          </Badge>
                        )}
                        {classData.pending_students > 0 && (
                          <Badge className="bg-gray-100 text-gray-800 text-xs">
                            {classData.pending_students} Pending
                          </Badge>
                        )}
                        {classData.overdue_students > 0 && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            {classData.overdue_students} Overdue
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {/* Empty State for Classes */}
          {filteredClasses.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No classes match your search criteria.' : 'No classes available.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Class Detail View - Show only in class-detail view */}
      {currentView === 'class-detail' && (
        <div className="space-y-4">
          {/* Class Summary Card */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">{classDetails.class?.grade?.name} {classDetails.class?.name}</CardTitle>
                    <p className="text-gray-600">{classDetails.class?.student_count} students</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-600">Payment Progress</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{Math.round(classDetails.class?.payment_percentage || 0)}%</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
                  <p className="text-sm sm:text-lg font-bold text-gray-900">{formatAmount(classDetails.class?.total_amount || 0)}</p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Collected</p>
                  <p className="text-sm sm:text-lg font-bold text-green-600">{formatAmount(classDetails.class?.paid_amount || 0)}</p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-red-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Outstanding</p>
                  <p className="text-sm sm:text-lg font-bold text-red-600">{formatAmount(classDetails.class?.balance || 0)}</p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Paid Students</p>
                  <p className="text-sm sm:text-lg font-bold text-blue-600">{classDetails.class?.paid_students || 0}/{classDetails.class?.student_count || 0}</p>
                </div>
              </div>
              <Progress value={classDetails.class?.payment_percentage || 0} className="h-3" />
            </CardContent>
          </Card>

          {/* Students List */}
          {loadingStudents ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading students...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredStudents.map(student => {
                const isExpanded = expandedStudents.has(student.id);
                return (
                  <Card key={student.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-3 sm:p-4">
                      {/* Student Info and Status - Always visible */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {student.full_name}
                            </h3>
                            <p className="text-sm text-gray-500">ID: {student.student_id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {getPaymentStatusIcon(student.payment_percentage)}
                          <Badge className={`text-xs ${getPaymentStatusColor(student.payment_percentage) === 'text-green-600' ? 'bg-green-100 text-green-800' : 
                                                          getPaymentStatusColor(student.payment_percentage) === 'text-yellow-600' ? 'bg-yellow-100 text-yellow-800' : 
                                                          'bg-red-100 text-red-800'}`}>
                            {student.payment_status.toUpperCase()}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadStudentReport(student)}
                            className="h-8 w-8 p-0 hover:bg-green-100"
                            title="Download Payment Report"
                            disabled={downloadingPdf === student.id}
                          >
                            {downloadingPdf === student.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                            ) : (
                              <Download className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStudentExpansion(student.id)}
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Payment Details - Responsive Grid */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">{formatAmount(student.total_amount)}</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Paid</p>
                          <p className="text-sm sm:text-base font-semibold text-green-600">{formatAmount(student.paid_amount)}</p>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Balance</p>
                          <p className="text-sm sm:text-base font-semibold text-red-600">{formatAmount(student.balance)}</p>
                        </div>
                      </div>
                      
                      {/* Payment Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs sm:text-sm text-gray-600">Payment Progress</span>
                          <span className="text-xs sm:text-sm font-medium text-gray-900">{Math.round(student.payment_percentage)}%</span>
                        </div>
                        <Progress value={student.payment_percentage} className="h-2" />
                      </div>

                      {/* Expandable Bill Details */}
                      {isExpanded && (
                        <div className="border-t pt-3 mt-3">
                          <div className="flex items-center mb-3">
                            <Receipt className="h-4 w-4 text-gray-600 mr-2" />
                            <h4 className="font-medium text-gray-900">Bill Details</h4>
                          </div>
                          
                          {student.bills && student.bills.length > 0 ? (
                            <div className="space-y-3">
                              {student.bills.map(bill => (
                                <div key={bill.id} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <FileText className="h-4 w-4 text-gray-500" />
                                      <span className="font-medium text-sm">{bill.bill_number}</span>
                                      <Badge className={`text-xs ${getBillStatusColor(bill.status)}`}>
                                        {bill.status.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                      <Calendar className="h-3 w-3" />
                                      <span>Due: {formatDate(bill.due_date)}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-2 mb-2">
                                    <div className="text-center p-2 bg-white rounded">
                                      <p className="text-xs text-gray-500">Total</p>
                                      <p className="text-sm font-semibold">{formatAmount(bill.total_amount)}</p>
                                    </div>
                                    <div className="text-center p-2 bg-white rounded">
                                      <p className="text-xs text-gray-500">Paid</p>
                                      <p className="text-sm font-semibold text-green-600">{formatAmount(bill.paid_amount)}</p>
                                    </div>
                                    <div className="text-center p-2 bg-white rounded">
                                      <p className="text-xs text-gray-500">Balance</p>
                                      <p className="text-sm font-semibold text-red-600">{formatAmount(bill.balance)}</p>
                                    </div>
                                  </div>
                                  
                                  {/* Bill Items */}
                                  {bill.items && bill.items.length > 0 && (
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium text-gray-700 mb-1">Items:</p>
                                      {bill.items.map(item => (
                                        <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded text-xs">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-medium">{item.tariff_name}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {item.tariff_type}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-gray-500">{formatAmount(item.amount)}</span>
                                            {item.paid_amount > 0 && (
                                              <span className="text-green-600">(-{formatAmount(item.paid_amount)})</span>
                                            )}
                                            {item.balance > 0 && (
                                              <span className="text-red-600 font-medium">{formatAmount(item.balance)}</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <Receipt className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">No bills generated yet</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Empty State for Students */}
          {!loadingStudents && filteredStudents.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No students match your search criteria.' : 'No students in this class.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentsPage; 