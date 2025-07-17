import apiClient from './apiClient';

class BillingService {
  // Get optimized payment overview data for all classes
  async getPaymentOverview() {
    try {
      const response = await apiClient.get('/billing/payment-overview');
      return response;
    } catch (error) {
      console.error('Error fetching payment overview:', error);
      throw error;
    }
  }

  // Get optimized payment data for a specific class
  async getClassPaymentDetails(classId) {
    try {
      const response = await apiClient.get(`/billing/class/${classId}/payment-details`);
      return response;
    } catch (error) {
      console.error('Error fetching class payment details:', error);
      throw error;
    }
  }

  // Generate bill for a specific student
  async generateBillForStudent(studentId) {
    try {
      const response = await apiClient.post(`/billing/generate/student/${studentId}`);
      return response;
    } catch (error) {
      console.error('Error generating bill for student:', error);
      throw error;
    }
  }

  // Generate bills for all students in a class
  async generateBillsForClass(classId) {
    try {
      const response = await apiClient.post(`/billing/generate/class/${classId}`);
      return response;
    } catch (error) {
      console.error('Error generating bills for class:', error);
      throw error;
    }
  }

  // Generate bills for all students in a grade
  async generateBillsForGrade(gradeId) {
    try {
      const response = await apiClient.post(`/billing/generate/grade/${gradeId}`);
      return response;
    } catch (error) {
      console.error('Error generating bills for grade:', error);
      throw error;
    }
  }

  // Record payment for a bill
  async recordPayment(billId, paymentData) {
    try {
      const response = await apiClient.post(`/billing/bills/${billId}/payment`, paymentData);
      return response;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  // Cancel a bill
  async cancelBill(billId, reason) {
    try {
      const response = await apiClient.post(`/billing/bills/${billId}/cancel`, { reason });
      return response;
    } catch (error) {
      console.error('Error cancelling bill:', error);
      throw error;
    }
  }

  // Get all bills for a student
  async getStudentBills(studentId) {
    try {
      const response = await apiClient.get(`/billing/students/${studentId}/bills`);
      return response;
    } catch (error) {
      console.error('Error fetching student bills:', error);
      throw error;
    }
  }

  // Get student's outstanding balance
  async getStudentBalance(studentId) {
    try {
      const response = await apiClient.get(`/billing/students/${studentId}/balance`);
      return response;
    } catch (error) {
      console.error('Error fetching student balance:', error);
      throw error;
    }
  }

  // Get billing summary for an academic year
  async getBillingSummary(academicYearId) {
    try {
      const response = await apiClient.get(`/billing/summary/${academicYearId}`);
      return response;
    } catch (error) {
      console.error('Error fetching billing summary:', error);
      throw error;
    }
  }

  // Get revenue report for an academic year
  async getRevenueReport(academicYearId) {
    try {
      const response = await apiClient.get(`/billing/revenue-report/${academicYearId}`);
      return response;
    } catch (error) {
      console.error('Error fetching revenue report:', error);
      throw error;
    }
  }

  // Mark overdue bills
  async markOverdueBills() {
    try {
      const response = await apiClient.post('/billing/mark-overdue');
      return response;
    } catch (error) {
      console.error('Error marking overdue bills:', error);
      throw error;
    }
  }

  // Get all bills with filters
  async getAllBills(filters = {}) {
    try {
      const response = await apiClient.get('/billing/bills', { params: filters });
      return response;
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }
  }

  // Get bill items for a specific bill
  async getBillItems(billId) {
    try {
      const response = await apiClient.get(`/billing/bills/${billId}/items`);
      return response;
    } catch (error) {
      console.error('Error fetching bill items:', error);
      throw error;
    }
  }

  // Record payment for a specific bill item
  async recordBillItemPayment(billItemId, paymentData) {
    try {
      const response = await apiClient.post(`/billing/bill-items/${billItemId}/payment`, paymentData);
      return response;
    } catch (error) {
      console.error('Error recording bill item payment:', error);
      throw error;
    }
  }

  // Helper methods for formatting and display
  formatAmount(amount) {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatBillStatus(status) {
    const statusMap = {
      'pending': 'Pending',
      'paid': 'Paid',
      'overdue': 'Overdue',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  getBillStatusColor(status) {
    const colorMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }

  getPaymentMethods() {
    return [
      { value: 'cash', label: 'Cash' },
      { value: 'bank_transfer', label: 'Bank Transfer' },
      { value: 'mobile_money', label: 'Mobile Money' },
      { value: 'card', label: 'Card Payment' },
      { value: 'cheque', label: 'Cheque' }
    ];
  }

  calculatePaymentPercentage(paidAmount, totalAmount) {
    if (totalAmount <= 0) return 0;
    return Math.round((paidAmount / totalAmount) * 100);
  }

  getDaysUntilDue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getDaysOverdue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Validation helpers
  validatePaymentAmount(amount, maxAmount) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return 'Payment amount must be greater than zero';
    }
    if (numAmount > maxAmount) {
      return `Payment amount cannot exceed ${this.formatAmount(maxAmount)}`;
    }
    return null;
  }

  validatePaymentMethod(method) {
    const validMethods = this.getPaymentMethods().map(m => m.value);
    if (!validMethods.includes(method)) {
      return 'Please select a valid payment method';
    }
    return null;
  }

  // Bill generation helpers
  async getBillGenerationOptions() {
    try {
      // Get current academic year and term for bill generation
      const [academicYearResponse, termResponse] = await Promise.all([
        apiClient.get('/academic-years/current'),
        apiClient.get('/terms/current')
      ]);

      return {
        academicYear: academicYearResponse.data,
        term: termResponse.data
      };
    } catch (error) {
      console.error('Error fetching bill generation options:', error);
      throw error;
    }
  }

  // Statistical helpers
  calculateBillingSummary(bills) {
    const summary = {
      totalBills: bills.length,
      totalAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      paidBills: 0,
      pendingBills: 0,
      overdueBills: 0,
      cancelledBills: 0
    };

    bills.forEach(bill => {
      summary.totalAmount += parseFloat(bill.total_amount || 0);
      summary.paidAmount += parseFloat(bill.paid_amount || 0);
      summary.outstandingAmount += parseFloat(bill.balance || 0);

      switch (bill.status) {
        case 'paid':
          summary.paidBills++;
          break;
        case 'pending':
          summary.pendingBills++;
          break;
        case 'overdue':
          summary.overdueBills++;
          break;
        case 'cancelled':
          summary.cancelledBills++;
          break;
      }
    });

    return summary;
  }

  // Export helpers
  exportBillsToCSV(bills) {
    const headers = [
      'Bill Number',
      'Student Name',
      'Class',
      'Total Amount',
      'Paid Amount',
      'Balance',
      'Status',
      'Due Date',
      'Issue Date'
    ];

    const csvContent = [
      headers.join(','),
      ...bills.map(bill => [
        bill.bill_number,
        bill.student?.full_name || 'N/A',
        bill.student?.class?.full_name || 'N/A',
        bill.total_amount,
        bill.paid_amount,
        bill.balance,
        bill.status,
        bill.due_date,
        bill.issue_date
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bills_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Get all tariffs assigned to a specific class
  async getClassTariffs(classId) {
    try {
      const response = await apiClient.get(`/billing/class/${classId}/tariffs`);
      return response;
    } catch (error) {
      console.error('Error fetching class tariffs:', error);
      throw error;
    }
  }

  // Get student payment progress for a specific tariff in a class
  async getStudentPaymentProgressByTariff(classId, tariffId) {
    try {
      const response = await apiClient.get(`/billing/class/${classId}/tariff/${tariffId}/student-progress`);
      return response;
    } catch (error) {
      console.error('Error fetching student payment progress by tariff:', error);
      throw error;
    }
  }
}

const billingService = new BillingService();
export default billingService; 