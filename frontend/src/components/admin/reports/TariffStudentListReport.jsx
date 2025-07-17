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
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  reportSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  reportDate: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 20,
  },
  summarySection: {
    flexDirection: 'row',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  summaryValueGreen: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  summaryValueRed: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  summaryValueYellow: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d97706',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    fontSize: 10,
    color: '#374151',
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  studentName: {
    width: '20%',
  },
  studentId: {
    width: '15%',
  },
  status: {
    width: '10%',
  },
  amount: {
    width: '13%',
    textAlign: 'right',
  },
  progress: {
    width: '12%',
    textAlign: 'center',
  },
  paymentStatus: {
    width: '15%',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
  },
  statusBadge: {
    fontSize: 8,
    padding: 2,
    borderRadius: 4,
    textAlign: 'center',
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusPartial: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusPending: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  statusNotBilled: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
});

const TariffStudentListReport = ({ students, classInfo, tariffInfo, schoolInfo }) => {
  // Provide default values to prevent errors
  const safeStudents = students || [];
  const safeClassInfo = classInfo || {};
  const safeTariffInfo = tariffInfo || {};
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

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'paid': return [styles.statusBadge, styles.statusPaid];
      case 'partial': return [styles.statusBadge, styles.statusPartial];
      case 'pending': return [styles.statusBadge, styles.statusPending];
      case 'not_billed': return [styles.statusBadge, styles.statusNotBilled];
      default: return [styles.statusBadge, styles.statusNotBilled];
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'partial': return 'Partial';
      case 'pending': return 'Pending';
      case 'not_billed': return 'Not Billed';
      default: return 'Not Billed';
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate summary statistics
  const totalStudents = safeStudents.length;
  const fullyPaid = safeStudents.filter(s => s.payment_status === 'paid').length;
  const partialPayment = safeStudents.filter(s => s.payment_status === 'partial').length;
  const pending = safeStudents.filter(s => s.payment_status === 'pending' || s.payment_status === 'not_billed').length;

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
            <Text style={styles.schoolName}>{safeSchoolInfo.name || 'Saint Maria Montessori School'}</Text>
            <Text style={styles.schoolAddress}>{safeSchoolInfo.address || 'Rwanda - Gisenyi - Rubavu'}</Text>
            <Text style={styles.schoolAddress}>{safeSchoolInfo.phones || '0788421521 - 0788220001 - 0785612142'}</Text>
          </View>
        </View>

        <Text style={styles.reportTitle}>
          Student Payment Progress Report
        </Text>
        <Text style={styles.reportSubtitle}>
          {safeClassInfo?.grade?.name} {safeClassInfo?.name} - {safeTariffInfo?.name}
        </Text>
        <Text style={styles.reportDate}>Generated: {currentDate}</Text>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Students</Text>
            <Text style={styles.summaryValue}>{totalStudents}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Fully Paid</Text>
            <Text style={styles.summaryValueGreen}>{fullyPaid}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Partial Payment</Text>
            <Text style={styles.summaryValueYellow}>{partialPayment}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValueRed}>{pending}</Text>
          </View>
        </View>

        {/* Tariff Information */}
        <View style={[styles.summarySection, { marginBottom: 10 }]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tariff Amount</Text>
            <Text style={styles.summaryValue}>{formatAmount(safeTariffInfo?.tariff_amount)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Frequency</Text>
            <Text style={styles.summaryValue}>{safeTariffInfo?.tariff_frequency || 'N/A'}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Type</Text>
            <Text style={styles.summaryValue}>{safeTariffInfo?.tariff_type || 'N/A'}</Text>
          </View>
        </View>

        {/* Students Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, styles.studentName]}>Student Name</Text>
            <Text style={[styles.tableCellHeader, styles.studentId]}>Student ID</Text>
            <Text style={[styles.tableCellHeader, styles.status]}>Status</Text>
            <Text style={[styles.tableCellHeader, styles.amount]}>Billed</Text>
            <Text style={[styles.tableCellHeader, styles.amount]}>Paid</Text>
            <Text style={[styles.tableCellHeader, styles.amount]}>Balance</Text>
            <Text style={[styles.tableCellHeader, styles.progress]}>Progress</Text>
            <Text style={[styles.tableCellHeader, styles.paymentStatus]}>Payment Status</Text>
          </View>

          {/* Table Rows */}
          {safeStudents.map((student, index) => (
            <View key={student.id || index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.studentName]}>
                {student.full_name || 'N/A'}
              </Text>
              <Text style={[styles.tableCell, styles.studentId]}>
                {student.student_id || 'N/A'}
              </Text>
              <Text style={[styles.tableCell, styles.status]}>
                {student.status || 'N/A'}
              </Text>
              <Text style={[styles.tableCell, styles.amount]}>
                {formatAmount(student.total_billed)}
              </Text>
              <Text style={[styles.tableCell, styles.amount]}>
                {formatAmount(student.total_paid)}
              </Text>
              <Text style={[styles.tableCell, styles.amount]}>
                {formatAmount(student.balance)}
              </Text>
              <Text style={[styles.tableCell, styles.progress]}>
                {student.payment_percentage || 0}%
              </Text>
              <Text style={[styles.tableCell, styles.paymentStatus, ...getStatusBadgeStyle(student.payment_status)]}>
                {getStatusLabel(student.payment_status)}
              </Text>
            </View>
          ))}
        </View>

        {safeStudents.length === 0 && (
          <Text style={[styles.tableCell, { textAlign: 'center', marginTop: 20 }]}>
            No students found for this tariff
          </Text>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          This report was generated on {currentDate} by Saint Maria Montessori School Management System
        </Text>
      </Page>
    </Document>
  );
};

export default TariffStudentListReport; 