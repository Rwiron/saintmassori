import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/ui/page-header';
import { 
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Search, 
  Users,
  CreditCard,
  User,
  GraduationCap,
  Receipt,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign
} from 'lucide-react';

import billingService from '@/services/billingService';
import classService from '@/services/classService';
import studentService from '@/services/studentService';
import PaymentModal from '@/components/admin/modals/PaymentModal';
import toast from '@/utils/toast';

const BillingPage = () => {
  const location = useLocation();
  const [currentView, setCurrentView] = useState('classes'); // 'classes', 'students', 'tariffs'
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Data states
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cache for API responses
  const [classStatsCache, setClassStatsCache] = useState(new Map());
  const [studentBillsCache, setStudentBillsCache] = useState(new Map());
  
  // Pagination state for students
  const [displayedStudentsCount, setDisplayedStudentsCount] = useState(4);
  const [loadingMore, setLoadingMore] = useState(false);
  const STUDENTS_PER_PAGE = 4;

  // Pagination state for classes
  const [displayedClassesCount, setDisplayedClassesCount] = useState(4);
  const [loadingMoreClasses, setLoadingMoreClasses] = useState(false);
  const CLASSES_PER_PAGE = 4;
  
  // Expanded students for tariff items view
  const [expandedStudents, setExpandedStudents] = useState(new Set());
  
  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBillItem, setSelectedBillItem] = useState(null);

  useEffect(() => {
    loadClassesOptimized();
    
    // Handle navigation from PaymentsPage
    if (location.state?.selectedClass && location.state?.autoSelectClass) {
      setSelectedClass(location.state.selectedClass);
      setCurrentView('students');
      loadStudents(location.state.selectedClass.id);
    }
  }, [location.state]);

  // Optimized class loading with progressive enhancement
  const loadClassesOptimized = async () => {
    try {
      setLoading(true);
      const response = await classService.getClassesWithTariffCounts();
      
      if (response.success) {
        // First, set classes with basic data immediately
        const basicClasses = response.data.map(cls => ({
          ...cls,
          studentCount: 0, // Will be loaded progressively
          tariffCount: cls.tariffs_count || cls.tariff_count || cls.tariffs?.length || 0,
          loading: true // Flag to show loading state
        }));
        
        setClasses(basicClasses);
        setLoading(false); // Show UI immediately
        
        // Then load student counts progressively in background
        loadClassStatsProgressively(basicClasses);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
      setLoading(false);
    }
  };

  // Load class stats progressively to avoid blocking UI
  const loadClassStatsProgressively = async (classesData) => {
    const updatedClasses = [...classesData];
    
    for (let i = 0; i < classesData.length; i++) {
      const cls = classesData[i];
      
      // Check cache first
      if (classStatsCache.has(cls.id)) {
        const cachedStats = classStatsCache.get(cls.id);
        updatedClasses[i] = { ...cls, ...cachedStats, loading: false };
        setClasses([...updatedClasses]);
        continue;
      }
      
      try {
        const studentsResponse = await studentService.getStudentsByClass(cls.id);
        const studentCount = studentsResponse.success ? studentsResponse.data.length : 0;
        
        // Cache the result
        const stats = { studentCount };
        setClassStatsCache(prev => new Map(prev).set(cls.id, stats));
        
        // Update this specific class
        updatedClasses[i] = { ...cls, studentCount, loading: false };
        setClasses([...updatedClasses]);
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50));
        
    } catch (error) {
        console.error(`Error loading stats for class ${cls.id}:`, error);
        updatedClasses[i] = { ...cls, studentCount: 0, loading: false };
        setClasses([...updatedClasses]);
      }
    }
  };

  // Optimized student loading with progressive enhancement
  const loadStudents = async (classId) => {
    try {
      setLoadingStudents(true);
      const response = await studentService.getStudentsByClass(classId);
      
      if (response.success) {
        // First, set students with basic data immediately
        const basicStudents = response.data.map(student => ({
          ...student,
          bills: [],
          totalAmount: 0,
          paidAmount: 0,
          balance: 0,
          paymentPercentage: 0,
          hasOverdue: false,
          paymentStatus: 'pending',
          loading: true // Flag to show loading state
        }));
        
        setStudents(basicStudents);
        setLoadingStudents(false); // Show UI immediately
        
        // Then load bill data progressively in background
        loadStudentBillsProgressively(basicStudents);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
      setLoadingStudents(false);
    }
  };

  // Load student bills progressively to avoid blocking UI
  const loadStudentBillsProgressively = async (studentsData) => {
    const updatedStudents = [...studentsData];
    
    for (let i = 0; i < studentsData.length; i++) {
      const student = studentsData[i];

      // Check cache first
      if (studentBillsCache.has(student.id)) {
        const cachedBills = studentBillsCache.get(student.id);
        updatedStudents[i] = { ...student, ...cachedBills, loading: false };
        setStudents([...updatedStudents]);
        continue;
    }

      try {
        const billsResponse = await billingService.getStudentBills(student.id);
        const bills = billsResponse.success ? billsResponse.data : [];
        
        // Calculate overall payment status
        let totalAmount = 0;
        let paidAmount = 0;
        let hasOverdue = false;
        
        bills.forEach(bill => {
          totalAmount += parseFloat(bill.total_amount || 0);
          paidAmount += parseFloat(bill.paid_amount || 0);
          if (bill.status === 'overdue') hasOverdue = true;
        });

        const paymentPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
        
        const billData = {
          bills,
          totalAmount,
          paidAmount,
          balance: totalAmount - paidAmount,
          paymentPercentage,
          hasOverdue,
          paymentStatus: paymentPercentage === 100 ? 'paid' : 
                        paymentPercentage > 0 ? 'partial' : 'pending'
        };
        
        // Cache the result
        setStudentBillsCache(prev => new Map(prev).set(student.id, billData));
        
        // Update this specific student
        updatedStudents[i] = { ...student, ...billData, loading: false };
        setStudents([...updatedStudents]);
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error loading bills for student ${student.id}:`, error);
        updatedStudents[i] = { 
          ...student, 
          bills: [],
          totalAmount: 0,
          paidAmount: 0,
          balance: 0,
          paymentPercentage: 0,
          hasOverdue: false,
          paymentStatus: 'pending',
          loading: false 
        };
        setStudents([...updatedStudents]);
      }
    }
  };

  // Load bill items for a specific student
  const loadBillItems = async (studentId) => {
    try {
      const response = await billingService.getStudentBills(studentId);

      if (response.success) {
        const bills = response.data;
        const allItems = [];
        
        // Get bill items for each bill
        for (const bill of bills) {
          try {
            const itemsResponse = await billingService.getBillItems(bill.id);
            if (itemsResponse.success) {
              const items = itemsResponse.data.map(item => ({
                ...item,
                billId: bill.id,
                billNumber: bill.bill_number,
                dueDate: bill.due_date
              }));
              allItems.push(...items);
            }
          } catch (error) {
            console.error(`Error loading items for bill ${bill.id}:`, error);
          }
        }
        
        return allItems;
      }
    } catch (error) {
      console.error('Error loading bill items:', error);
      return [];
    }
  };

  // Toggle student expansion to show tariff items
  const toggleStudentExpansion = async (student) => {
    const newExpanded = new Set(expandedStudents);
    
    if (expandedStudents.has(student.id)) {
      newExpanded.delete(student.id);
    } else {
      newExpanded.add(student.id);
      
      // Load bill items for this student
      if (!student.billItems) {
        const items = await loadBillItems(student.id);
        // Update the student with bill items
        setStudents(prev => prev.map(s => 
          s.id === student.id ? { ...s, billItems: items } : s
        ));
    }
    }
    
    setExpandedStudents(newExpanded);
  };

  // Handle bill item payment
  const handlePayBillItem = (billItem, student) => {
    // Convert BillItem to Bill-like structure for PaymentModal
    const billForModal = {
      id: billItem.id,
      bill_number: billItem.billNumber || `Item-${billItem.id}`,
      total_amount: billItem.amount,
      paid_amount: billItem.paid_amount,
      balance: billItem.balance,
      status: billItem.status,
      student: {
        full_name: student.full_name || `${student.first_name} ${student.last_name}`,
        first_name: student.first_name,
        last_name: student.last_name,
        student_id: student.student_id,
        class: student.class
      },
      description: billItem.name,
      due_date: billItem.dueDate
    };
    
    setSelectedBillItem(billForModal);
    setPaymentModalOpen(true);
  };

  // Handle payment submission
  const handlePaymentSubmit = async (paymentData) => {
    try {
      await billingService.recordBillItemPayment(selectedBillItem.id, paymentData);
      toast.success(`Payment of ${formatAmount(paymentData.amount)} recorded successfully`);
      
      // Close modal
      setPaymentModalOpen(false);
      setSelectedBillItem(null);
      
      // Refresh the current view
      if (currentView === 'students') {
        loadStudents(selectedClass.id);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  // Navigation handlers
  const handleClassClick = (classData) => {
    setSelectedClass(classData);
    setCurrentView('students');
    setDisplayedStudentsCount(4); // Reset pagination when switching classes
    loadStudents(classData.id);
  };

  const handleBackToClasses = () => {
    setCurrentView('classes');
    setSelectedClass(null);
    setStudents([]);
    setExpandedStudents(new Set());
    setDisplayedStudentsCount(4); // Reset students pagination
    setDisplayedClassesCount(4); // Reset classes pagination
  };

  // Filter classes based on search
  const filteredClasses = classes.filter(cls => 
    cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.grade?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get displayed classes (with pagination)
  const displayedClasses = filteredClasses.slice(0, displayedClassesCount);
  
  // Group classes by grade (using displayed classes for pagination)
  const classesGroupedByGrade = displayedClasses.reduce((groups, classData) => {
    const gradeName = classData.grade?.name || 'No Grade';
    if (!groups[gradeName]) {
      groups[gradeName] = [];
    }
    groups[gradeName].push(classData);
    return groups;
  }, {});

  // Sort grades (P1, P2, etc.)
  const sortedGrades = Object.keys(classesGroupedByGrade).sort((a, b) => {
    // Extract numbers from grade names for proper sorting
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const filteredStudents = students.filter(student => {
    const fullName = student.full_name || `${student.first_name} ${student.last_name}`;
    return fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           student.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get displayed students (with pagination)
  const displayedStudents = filteredStudents.slice(0, displayedStudentsCount);
  const hasMoreStudents = filteredStudents.length > displayedStudentsCount;

  // Load more students function
  const handleLoadMore = () => {
    setLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayedStudentsCount(prev => prev + STUDENTS_PER_PAGE);
      setLoadingMore(false);
    }, 500);
  };

  const hasMoreClasses = filteredClasses.length > displayedClassesCount;

  // Load more classes function
  const handleLoadMoreClasses = () => {
    setLoadingMoreClasses(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayedClassesCount(prev => prev + CLASSES_PER_PAGE);
      setLoadingMoreClasses(false);
    }, 500);
  };

  // Utility functions
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'partial': return 'bg-yellow-500';
      case 'pending': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading billing data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header - Only show on classes view */}
      {currentView === 'classes' && (
      <PageHeader
        title="Billing Management"
          description="Select a class to view students and manage payments"
        />
      )}

      {/* Students View Page Header */}
      {currentView === 'students' && (
        <PageHeader
          title={`${selectedClass?.grade?.name} ${selectedClass?.name} - Students`}
          description={
            <>
              Click on a student to view their tariff items
              {filteredStudents.length > 0 && (
                <span className="block sm:inline sm:ml-2 text-sm opacity-90">
                  (Showing {displayedStudents.length} of {filteredStudents.length} students)
                </span>
              )}
            </>
          }
          //variant="blue"
        >
          <Button 
            variant="outline" 
            onClick={handleBackToClasses}
            className="flex items-center space-x-2 w-fit bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Classes</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </PageHeader>
      )}

      {/* Other Views Navigation Header */}
      {currentView !== 'classes' && currentView !== 'students' && (
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <Button 
              variant="outline" 
              onClick={handleBackToClasses}
              className="flex items-center space-x-2 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Classes</span>
              <span className="sm:hidden">Back</span>
            </Button>
            
              <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Student Tariffs
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Manage individual tariff payments
              </p>
              </div>
              </div>
            </div>
      )}

      {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={
                currentView === 'classes' ? 'Search classes...' :
                currentView === 'students' ? 'Search students...' :
                'Search tariff items...'
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // Reset pagination when searching
                if (currentView === 'students') {
                  setDisplayedStudentsCount(4);
                } else if (currentView === 'classes') {
                  setDisplayedClassesCount(4);
                }
              }}
              className="pl-10"
            />
            </div>
          </CardContent>
        </Card>

      {/* LEVEL 1: Classes View */}
      {currentView === 'classes' && (
        <div className="space-y-8">
          {sortedGrades.map((grade, index) => (
            <div key={grade} className="space-y-4">
              {index > 0 && <div className="border-t border-gray-200 pt-8" />}
              {/* Grade Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-l-4 border-l-green-500">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
              <div>
                    <h2 className="text-xl font-bold text-gray-900">{grade}</h2>
                    <p className="text-sm text-gray-500">{classesGroupedByGrade[grade].length} classes</p>
                  </div>
                </div>
                
                {/* Grade Summary */}
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">
                      {classesGroupedByGrade[grade].reduce((sum, cls) => sum + (cls.studentCount || 0), 0)}
                    </p>
                    <p className="text-gray-500">Students</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">
                      {classesGroupedByGrade[grade].reduce((sum, cls) => sum + (cls.tariffCount || 0), 0)}
                </p>
                    <p className="text-gray-500">Tariffs</p>
                  </div>
                </div>
              </div>
              
              {/* Classes Grid for this Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 ml-2 md:ml-4">
                {classesGroupedByGrade[grade].map(classData => (
                  <Card 
                    key={classData.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500"
                    onClick={() => handleClassClick(classData)}
                  >
                    <CardHeader className="pb-2 md:pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base md:text-lg">{classData.grade?.name} {classData.name}</CardTitle>
                            <p className="text-xs md:text-sm text-gray-500">Class {classData.grade?.name} {classData.name}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs md:text-sm text-gray-600 flex items-center">
                            <Users className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            Students
                          </span>
                          {classData.loading ? (
                            <div className="h-5 w-8 bg-gray-200 rounded animate-pulse"></div>
                          ) : (
                            <Badge variant="outline" className="text-xs">{classData.studentCount}</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs md:text-sm text-gray-600 flex items-center">
                            <Receipt className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            Tariffs
                          </span>
                          <Badge variant="outline" className="text-xs">{classData.tariffCount}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
                ))}
              </div>
            </div>
          ))}

          {/* Load More Classes Button */}
          {hasMoreClasses && (
            <div className="flex justify-center mt-6">
            <Button
                onClick={handleLoadMoreClasses}
                disabled={loadingMoreClasses}
              variant="outline"
                className="flex items-center space-x-2 w-full sm:w-auto"
            >
                {loadingMoreClasses ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    <span className="text-sm md:text-base">Loading...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm md:text-base">Load More Classes ({filteredClasses.length - displayedClassesCount} remaining)</span>
                  </>
                )}
            </Button>
          </div>
          )}
        </div>
      )}

      {/* LEVEL 2: Students View */}
      {currentView === 'students' && (
        <div className="space-y-3 md:space-y-4">
          {loadingStudents && displayedStudents.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading students...</p>
              </div>
            </div>
          )}
          
          {displayedStudents.map(student => (
            <Card key={student.id} className="border-l-4 border-l-green-500">
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div 
                    className="flex items-center space-x-3 md:space-x-4 flex-1 cursor-pointer"
                    onClick={() => toggleStudentExpansion(student)}
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                          <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                            {student.full_name || `${student.first_name} ${student.last_name}`}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1 sm:mt-0">
                            {student.loading ? (
                              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                              <>
                                {getStatusIcon(student.paymentStatus)}
                                <Badge className={`text-xs ${getStatusColor(student.paymentStatus)} text-white`}>
                                  {student.paymentStatus.toUpperCase()}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      <p className="text-xs md:text-sm text-gray-500">ID: {student.student_id}</p>
                      
                      {/* Payment Progress */}
                      <div className="mt-2 max-w-full md:max-w-md">
                        {student.loading ? (
                          <div className="space-y-1">
                            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-2 w-full bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Payment Progress</span>
                              <span>{Math.round(student.paymentPercentage)}%</span>
                            </div>
                            <Progress value={student.paymentPercentage} className="h-2" />
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0 ml-2">
                      {student.loading ? (
                        <div className="space-y-1">
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-14 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold text-gray-900 text-sm md:text-base">{formatAmount(student.totalAmount)}</p>
                          <p className="text-xs md:text-sm text-gray-500">
                            Paid: {formatAmount(student.paidAmount)}
                          </p>
                          <p className="text-xs md:text-sm text-red-600">
                            Balance: {formatAmount(student.balance)}
                          </p>
                        </>
                      )}
          </div>

                    <div className="ml-2 md:ml-4 flex-shrink-0">
                      {expandedStudents.has(student.id) ? 
                        <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-gray-400" /> : 
                        <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      }
                    </div>
                  </div>
                </div>

                {/* LEVEL 3: Tariff Items (Expanded) */}
                {expandedStudents.has(student.id) && (
                  <div className="mt-3 md:mt-4 pl-8 md:pl-14 space-y-2">
                    <h4 className="font-medium text-gray-700 flex items-center text-sm md:text-base">
                      <Receipt className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                      Tariff Items
                    </h4>
                    
                    {student.billItems?.length > 0 ? (
                      <div className="space-y-2">
                        {student.billItems.map(item => (
                          <div key={item.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div className="mb-2 md:mb-0">
                                  <h5 className="font-medium text-gray-900 text-sm md:text-base">{item.name}</h5>
                                  <p className="text-xs md:text-sm text-gray-500">{item.description}</p>
                                </div>
                                <div className="text-left md:text-right md:mr-4">
                                  <p className="font-semibold text-gray-900 text-sm md:text-base">{formatAmount(item.amount)}</p>
                                  <p className="text-xs md:text-sm text-gray-500">Paid: {formatAmount(item.paid_amount)}</p>
                                  <p className="text-xs md:text-sm text-red-600">Balance: {formatAmount(item.balance)}</p>
                                </div>
          </div>
                              
                              {/* Item Payment Progress */}
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-500">Payment Progress</span>
                                  <Badge 
                                    className={`text-xs ${getStatusColor(item.status)} text-white`}
                                  >
                                    {item.status.toUpperCase()}
                                  </Badge>
                                </div>
                                <Progress 
                                  value={item.payment_progress || 0} 
                                  className="h-2"
              />
            </div>
          </div>

                            {item.status !== 'paid' && (
                              <Button
                                size="sm"
                                className="mt-2 md:mt-0 md:ml-4 bg-green-600 hover:bg-green-700 w-full md:w-auto"
                                onClick={() => handlePayBillItem(item, student)}
                              >
                                <CreditCard className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                Pay
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Receipt className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm md:text-base">No tariff items found for this student</p>
                      </div>
                    )}
          </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {/* Load More Button */}
          {hasMoreStudents && (
            <div className="flex justify-center mt-4 md:mt-6">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="flex items-center space-x-2 w-full sm:w-auto"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm md:text-base">Loading...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm md:text-base">Load More ({filteredStudents.length - displayedStudentsCount} remaining)</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty States */}
      {currentView === 'classes' && filteredClasses.length === 0 && (
        <Card>
          <CardContent className="p-6 md:p-8 text-center">
            <GraduationCap className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No classes found</h3>
            <p className="text-sm md:text-base text-gray-600">
              {searchTerm ? 'No classes match your search criteria.' : 'No classes available.'}
            </p>
          </CardContent>
        </Card>
      )}

      {currentView === 'students' && filteredStudents.length === 0 && (
        <Card>
          <CardContent className="p-6 md:p-8 text-center">
            <Users className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-sm md:text-base text-gray-600">
              {searchTerm ? 'No students match your search criteria.' : 'No students in this class.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedBillItem(null);
        }}
        onSubmit={handlePaymentSubmit}
        bill={selectedBillItem}
      />
    </div>
  );
};

export default BillingPage; 