import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet,
  Image
} from '@react-pdf/renderer';
import schoolLogo from '../../../assets/logo/school.png';

// Use built-in fonts to avoid DataView errors with external fonts

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 20,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  schoolAddress: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#1f2937',
  },
  reportDate: {
    fontSize: 10,
    textAlign: 'right',
    color: '#6b7280',
    marginBottom: 20,
  },
  studentInfo: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  studentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  studentDetails: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 3,
  },
  summarySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 5,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9fafb',
    marginHorizontal: 5,
    borderRadius: 6,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  summaryValueGreen: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
  },
  summaryValueRed: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  billsSection: {
    marginBottom: 20,
  },
  billCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    marginBottom: 10,
    borderRadius: 6,
    border: '1px solid #e5e7eb',
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  billStatus: {
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  statusPaid: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusPartial: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusPending: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  statusOverdue: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  billAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billAmount: {
    flex: 1,
    alignItems: 'center',
  },
  billAmountLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  billAmountValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  billAmountValueGreen: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
  },
  billAmountValueRed: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  itemsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid #e5e7eb',
  },
  itemsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    marginBottom: 2,
    borderRadius: 4,
  },
  itemName: {
    fontSize: 9,
    color: '#1f2937',
    flex: 1,
  },
  itemType: {
    fontSize: 8,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginHorizontal: 5,
  },
  itemAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemAmount: {
    fontSize: 9,
    color: '#6b7280',
    marginRight: 5,
  },
  itemPaid: {
    fontSize: 9,
    color: '#059669',
    marginRight: 5,
  },
  itemBalance: {
    fontSize: 9,
    color: '#dc2626',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  noData: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    marginTop: 20,
  },
});

const StudentPaymentReport = ({ student, classInfo, schoolInfo }) => {
  // Provide default values to prevent errors
  const safeStudent = student || {};
  const safeClassInfo = classInfo || {};
  const safeSchoolInfo = schoolInfo || {};

  const formatAmount = (amount) => {
    try {
      return new Intl.NumberFormat('rw-RW', {
        style: 'currency',
        currency: 'RWF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount || 0);
    } catch (error) {
      return `RWF ${Number(amount || 0).toLocaleString()}`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getBillStatusStyle = (status) => {
    switch (status) {
      case 'paid': return styles.statusPaid;
      case 'partial': return styles.statusPartial;
      case 'overdue': return styles.statusOverdue;
      default: return styles.statusPending;
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            style={styles.logo} 
            src={schoolLogo}
          />
          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>Saint Maria Montessori School</Text>
            <Text style={styles.schoolAddress}>Rwanda - Gisenyi - Rubavu</Text>
            <Text style={styles.schoolAddress}>0788421521 - 0788220001 - 0785612142</Text>
          </View>
        </View>

        <Text style={styles.reportTitle}>
          Payment Report Summary for {safeClassInfo?.grade?.name} {safeClassInfo?.name} - Class {safeClassInfo?.name}
        </Text>
        <Text style={styles.reportDate}>Date: {currentDate}</Text>

        {/* Student Information */}
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{safeStudent.full_name || 'N/A'}</Text>
          <Text style={styles.studentDetails}>Student ID: {safeStudent.student_id || 'N/A'}</Text>
          <Text style={styles.studentDetails}>Class: {safeClassInfo?.grade?.name || 'N/A'} {safeClassInfo?.name || ''}</Text>
          <Text style={styles.studentDetails}>Payment Status: {safeStudent.payment_status?.toUpperCase() || 'N/A'}</Text>
        </View>

        {/* Payment Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.summaryValue}>{formatAmount(safeStudent.total_amount)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Amount Paid</Text>
              <Text style={styles.summaryValueGreen}>{formatAmount(safeStudent.paid_amount)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Outstanding Balance</Text>
              <Text style={styles.summaryValueRed}>{formatAmount(safeStudent.balance)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Payment Progress</Text>
              <Text style={styles.summaryValue}>{Math.round(safeStudent.payment_percentage || 0)}%</Text>
            </View>
          </View>
        </View>

        {/* Bills Details */}
        <View style={styles.billsSection}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          {safeStudent.bills && safeStudent.bills.length > 0 ? (
            safeStudent.bills.map((bill, index) => (
              <View key={bill.id} style={styles.billCard}>
                <View style={styles.billHeader}>
                  <Text style={styles.billNumber}>{bill.bill_number}</Text>
                  <Text style={[styles.billStatus, getBillStatusStyle(bill.status)]}>
                    {bill.status}
                  </Text>
                </View>
                
                <View style={styles.billAmounts}>
                  <View style={styles.billAmount}>
                    <Text style={styles.billAmountLabel}>Total</Text>
                    <Text style={styles.billAmountValue}>{formatAmount(bill.total_amount)}</Text>
                  </View>
                  <View style={styles.billAmount}>
                    <Text style={styles.billAmountLabel}>Paid</Text>
                    <Text style={styles.billAmountValueGreen}>{formatAmount(bill.paid_amount)}</Text>
                  </View>
                  <View style={styles.billAmount}>
                    <Text style={styles.billAmountLabel}>Balance</Text>
                    <Text style={styles.billAmountValueRed}>{formatAmount(bill.balance)}</Text>
                  </View>
                  <View style={styles.billAmount}>
                    <Text style={styles.billAmountLabel}>Due Date</Text>
                    <Text style={styles.billAmountValue}>{formatDate(bill.due_date)}</Text>
                  </View>
                </View>

                {/* Bill Items */}
                {bill.items && bill.items.length > 0 && (
                  <View style={styles.itemsSection}>
                    <Text style={styles.itemsTitle}>Items:</Text>
                    {bill.items.map((item, itemIndex) => (
                      <View key={item.id} style={styles.item}>
                        <Text style={styles.itemName}>{item.tariff_name}</Text>
                        <Text style={styles.itemType}>{item.tariff_type}</Text>
                        <View style={styles.itemAmounts}>
                          <Text style={styles.itemAmount}>{formatAmount(item.amount)}</Text>
                          {item.paid_amount > 0 && (
                            <Text style={styles.itemPaid}>(-{formatAmount(item.paid_amount)})</Text>
                          )}
                          {item.balance > 0 && (
                            <Text style={styles.itemBalance}>{formatAmount(item.balance)}</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noData}>No bills generated yet</Text>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This report was generated on {currentDate} by Saint Maria Montessori School Management System
        </Text>
      </Page>
    </Document>
  );
};

export default StudentPaymentReport; 