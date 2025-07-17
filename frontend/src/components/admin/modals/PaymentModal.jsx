import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  FileText,
  User,
  Building2,
  Calendar,
  Receipt
} from 'lucide-react';
import billingService from '@/services/billingService';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  bill 
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: '',
    reference: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && bill) {
      setFormData({
        amount: bill.balance || '',
        payment_method: '',
        reference: '',
        notes: ''
      });
      setErrors({});
    }
  }, [isOpen, bill]);

  const handleInputChange = (field, value) => {
    // Special handling for amount field to restrict input
    if (field === 'amount') {
      const numValue = parseFloat(value);
      const maxAmount = bill?.balance || 0;
      
      // If the entered amount exceeds the maximum, don't update the state
      if (value !== '' && (!isNaN(numValue) && numValue > maxAmount)) {
        // Show a temporary error message
        setErrors(prev => ({
          ...prev,
          amount: `Amount cannot exceed ${billingService.formatAmount(maxAmount)}`
        }));
        return; // Don't update the form data
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate amount
    const amountError = billingService.validatePaymentAmount(formData.amount, bill?.balance || 0);
    if (amountError) {
      newErrors.amount = amountError;
    }

    // Validate payment method
    const methodError = billingService.validatePaymentMethod(formData.payment_method);
    if (methodError) {
      newErrors.payment_method = methodError;
    }

    // Reference is optional but should be reasonable length
    if (formData.reference && formData.reference.length > 100) {
      newErrors.reference = 'Reference must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        reference: formData.reference || null,
        notes: formData.notes || null
      });
    } catch (error) {
      console.error('Payment submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: '',
      payment_method: '',
      reference: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  const paymentMethods = billingService.getPaymentMethods();

  if (!bill) {
    return null;
  }

  const currentPaymentPercentage = billingService.calculatePaymentPercentage(
    bill.paid_amount, 
    bill.total_amount
  );

  const newPaymentAmount = parseFloat(formData.amount) || 0;
  const newPaidAmount = parseFloat(bill.paid_amount) + newPaymentAmount;
  const newPaymentPercentage = billingService.calculatePaymentPercentage(
    newPaidAmount, 
    bill.total_amount
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4">
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            <span>Record Payment</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Bill Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Bill Details</span>
                </span>
                <Badge className={billingService.getBillStatusColor(bill.status)}>
                  {billingService.formatBillStatus(bill.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Bill Number</Label>
                  <p className="font-medium text-sm sm:text-base">{bill.bill_number}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Due Date</Label>
                  <p className="font-medium text-sm sm:text-base">{billingService.formatDate(bill.due_date)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Student</Label>
                  <p className="font-medium text-sm sm:text-base">{bill.student?.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Class</Label>
                  <p className="font-medium text-sm sm:text-base">{bill.student?.class?.full_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
                <div className="text-center p-3 sm:p-2 bg-gray-50 rounded-lg sm:bg-transparent">
                  <Label className="text-sm text-muted-foreground">Total Amount</Label>
                  <p className="text-base sm:text-lg font-bold">
                    {billingService.formatAmount(bill.total_amount)}
                  </p>
                </div>
                <div className="text-center p-3 sm:p-2 bg-green-50 rounded-lg sm:bg-transparent">
                  <Label className="text-sm text-muted-foreground">Paid Amount</Label>
                  <p className="text-base sm:text-lg font-bold text-green-600">
                    {billingService.formatAmount(bill.paid_amount)}
                  </p>
                </div>
                <div className="text-center p-3 sm:p-2 bg-red-50 rounded-lg sm:bg-transparent">
                  <Label className="text-sm text-muted-foreground">Outstanding</Label>
                  <p className="text-base sm:text-lg font-bold text-red-600">
                    {billingService.formatAmount(bill.balance)}
                  </p>
                </div>
              </div>

              {/* Current Payment Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Payment Progress</span>
                  <span className="font-medium">{currentPaymentPercentage}%</span>
                </div>
                <Progress value={currentPaymentPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={bill.balance}
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    onInput={(e) => {
                      // Additional validation on input
                      const value = parseFloat(e.target.value);
                      if (value > bill.balance) {
                        // Briefly highlight the input to show the limit was reached
                        e.target.style.borderColor = '#ef4444';
                        e.target.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.2)';
                        setTimeout(() => {
                          e.target.style.borderColor = '';
                          e.target.style.boxShadow = '';
                        }, 1000);
                        
                        e.target.value = bill.balance;
                        handleInputChange('amount', bill.balance.toString());
                      }
                    }}
                    placeholder="Enter payment amount (RWF)"
                    className={`pl-10 pr-16 sm:pr-20 ${errors.amount ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-1 sm:px-2 text-xs"
                    onClick={() => handleInputChange('amount', bill.balance.toString())}
                  >
                    Max
                  </Button>
                </div>
                {errors.amount && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.amount}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="text-muted-foreground">
                    Maximum: {billingService.formatAmount(bill.balance)}
                  </span>
                  {formData.amount && (
                    <span className={`font-medium ${
                      parseFloat(formData.amount) === bill.balance 
                        ? 'text-green-600' 
                        : parseFloat(formData.amount) > bill.balance * 0.8 
                        ? 'text-yellow-600' 
                        : 'text-blue-600'
                    }`}>
                      {parseFloat(formData.amount) === bill.balance 
                        ? '✓ Full Payment' 
                        : `${Math.round((parseFloat(formData.amount) / bill.balance) * 100)}% of total`
                      }
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method *</Label>
                <Select 
                  value={formData.payment_method} 
                  onValueChange={(value) => handleInputChange('payment_method', value)}
                >
                  <SelectTrigger className={errors.payment_method ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {paymentMethods.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.payment_method && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.payment_method}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Payment Reference</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                placeholder="Enter payment reference (optional)"
                className={errors.reference ? 'border-red-500' : ''}
              />
              {errors.reference && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.reference}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                e.g., Transaction ID, Check number, Receipt number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any additional notes about this payment (optional)"
                rows={3}
              />
            </div>
          </div>

          {/* Payment Preview */}
          {newPaymentAmount > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Payment Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                  <div className="text-center p-3 sm:p-2 bg-green-50 rounded-lg sm:bg-transparent">
                    <Label className="text-sm text-muted-foreground">Payment Amount</Label>
                    <p className="text-base sm:text-lg font-bold text-green-600">
                      {billingService.formatAmount(newPaymentAmount)}
                    </p>
                  </div>
                  <div className="text-center p-3 sm:p-2 bg-green-50 rounded-lg sm:bg-transparent">
                    <Label className="text-sm text-muted-foreground">New Paid Total</Label>
                    <p className="text-base sm:text-lg font-bold text-green-600">
                      {billingService.formatAmount(newPaidAmount)}
                    </p>
                  </div>
                  <div className="text-center p-3 sm:p-2 bg-red-50 rounded-lg sm:bg-transparent">
                    <Label className="text-sm text-muted-foreground">Remaining Balance</Label>
                    <p className="text-base sm:text-lg font-bold text-red-600">
                      {billingService.formatAmount(bill.balance - newPaymentAmount)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">New Payment Progress</span>
                    <span className="font-medium">{newPaymentPercentage}%</span>
                  </div>
                  <Progress value={newPaymentPercentage} className="h-2" />
                </div>

                {newPaymentPercentage >= 100 && (
                  <div className="mt-3 p-3 bg-green-100 rounded-lg">
                    <p className="text-sm text-green-800 font-medium flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      This payment will fully settle the bill
                    </p>
                  </div>
                )}

                {newPaymentAmount > 0 && newPaymentPercentage < 100 && (
                  <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Partial payment - {billingService.formatAmount(bill.balance - newPaymentAmount)} will remain outstanding
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <DialogFooter className="sticky bottom-0 bg-white border-t pt-4 mt-4 flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.amount || !formData.payment_method}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  <span className="hidden sm:inline">Recording Payment...</span>
                  <span className="sm:hidden">Recording...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Record Payment</span>
                  <span className="sm:hidden">Record</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal; 