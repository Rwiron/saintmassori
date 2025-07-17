<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Services\BillingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BillingController extends BaseApiController
{
    public function __construct(
        private readonly BillingService $billingService
    ) {}

    /**
     * Get all bills with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['status', 'class_id', 'search', 'academic_year_id', 'term_id']);
            $bills = $this->billingService->getAllBills($filters);

            return $this->successResponse($bills, 'Bills retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get bill items for a specific bill
     */
    public function getBillItems(int $billId): JsonResponse
    {
        try {
            $billItems = $this->billingService->getBillItems($billId);
            return $this->successResponse($billItems, 'Bill items retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Record payment for a specific bill item
     */
    public function recordBillItemPayment(Request $request, int $billItemId): JsonResponse
    {
        try {
            $request->validate([
                'amount' => 'required|numeric|min:0.01',
                'payment_method' => 'required|string|in:cash,bank_transfer,mobile_money,card,cheque',
                'reference' => 'nullable|string|max:255',
                'notes' => 'nullable|string|max:1000',
            ]);

            $billItem = $this->billingService->recordBillItemPayment(
                $billItemId,
                $request->amount,
                $request->payment_method,
                $request->reference,
                $request->notes
            );

            return $this->successResponse($billItem, 'Payment recorded successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Generate bill for a student
     */
    public function generateForStudent(int $studentId): JsonResponse
    {
        try {
            $bill = $this->billingService->generateBillForStudent($studentId);

            return $this->createdResponse($bill, 'Bill generated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Generate bills for a class
     */
    public function generateForClass(int $classId): JsonResponse
    {
        try {
            $result = $this->billingService->generateBillsForClass($classId);

            return $this->successResponse($result, 'Bills generated for class');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Generate bills for a grade
     */
    public function generateForGrade(int $gradeId): JsonResponse
    {
        try {
            $result = $this->billingService->generateBillsForGrade($gradeId);

            return $this->successResponse($result, 'Bills generated for grade');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Record a payment
     */
    public function recordPayment(Request $request, int $billId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'amount' => 'required|numeric|min:0.01',
                'payment_method' => 'required|string|max:50',
                'reference' => 'nullable|string|max:100',
            ]);

            $bill = $this->billingService->recordPayment(
                $billId,
                $validated['amount'],
                $validated['payment_method'],
                $validated['reference'] ?? null
            );

            return $this->updatedResponse($bill, 'Payment recorded successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Cancel a bill
     */
    public function cancelBill(Request $request, int $billId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:255',
            ]);

            $bill = $this->billingService->cancelBill($billId, $validated['reason']);

            return $this->updatedResponse($bill, 'Bill cancelled successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get student bills
     */
    public function studentBills(int $studentId): JsonResponse
    {
        try {
            $bills = $this->billingService->getStudentBills($studentId);

            return $this->successResponse($bills, 'Student bills retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get student outstanding balance
     */
    public function studentBalance(int $studentId): JsonResponse
    {
        try {
            $balance = $this->billingService->getStudentOutstandingBalance($studentId);

            return $this->successResponse([
                'student_id' => $studentId,
                'outstanding_balance' => $balance
            ], 'Student balance retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get billing summary
     */
    public function summary(int $academicYearId): JsonResponse
    {
        try {
            $summary = $this->billingService->getBillingSummary($academicYearId);

            return $this->successResponse($summary, 'Billing summary retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get revenue report
     */
    public function revenueReport(int $academicYearId): JsonResponse
    {
        try {
            $report = $this->billingService->getRevenueReport($academicYearId);

            return $this->successResponse($report, 'Revenue report retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Mark overdue bills
     */
    public function markOverdue(): JsonResponse
    {
        try {
            $count = $this->billingService->markOverdueBills();

            return $this->successResponse([
                'marked_overdue' => $count
            ], 'Overdue bills marked successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get optimized payment overview data for all classes
     */
    public function getPaymentOverview(): JsonResponse
    {
        try {
            $overview = $this->billingService->getPaymentOverview();
            return $this->successResponse($overview, 'Payment overview retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get optimized payment data for a specific class
     */
    public function getClassPaymentDetails(int $classId): JsonResponse
    {
        try {
            $details = $this->billingService->getClassPaymentDetails($classId);
            return $this->successResponse($details, 'Class payment details retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get all tariffs assigned to a specific class
     */
    public function getClassTariffs(int $classId): JsonResponse
    {
        try {
            $tariffs = $this->billingService->getClassTariffs($classId);
            return $this->successResponse($tariffs, 'Class tariffs retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get student payment progress for a specific tariff in a class
     */
    public function getStudentPaymentProgressByTariff(int $classId, int $tariffId): JsonResponse
    {
        try {
            $progress = $this->billingService->getStudentPaymentProgressByTariff($classId, $tariffId);
            return $this->successResponse($progress, 'Student payment progress retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }
}
