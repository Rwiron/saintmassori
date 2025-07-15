<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BillStatus;
use App\Enums\BillingFrequency;
use App\Models\Bill;
use App\Models\Student;
use App\Models\Tariff;
use App\Repositories\BillRepository;
use App\Repositories\StudentRepository;
use App\Repositories\TariffRepository;
use App\Repositories\AcademicYearRepository;
use App\Repositories\TermRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BillingService
{
    public function __construct(
        private readonly BillRepository $billRepository,
        private readonly StudentRepository $studentRepository,
        private readonly TariffRepository $tariffRepository,
        private readonly AcademicYearRepository $academicYearRepository,
        private readonly TermRepository $termRepository
    ) {}

    public function generateBillForStudent(int $studentId): Bill
    {
        DB::beginTransaction();

        try {
            $student = $this->studentRepository->findOrFail($studentId);

            if (!$student->has_class) {
                throw new \InvalidArgumentException('Student must be assigned to a class to generate bills');
            }

            $currentAcademicYear = $this->academicYearRepository->getCurrent();
            if (!$currentAcademicYear) {
                throw new \InvalidArgumentException('No active academic year found');
            }

            $currentTerm = $this->termRepository->getCurrent();
            if (!$currentTerm) {
                throw new \InvalidArgumentException('No active term found');
            }

                        // Get tariffs for the student's class
            $tariffs = $this->tariffRepository->getClassTariffs($student->class_id);

            if ($tariffs->isEmpty()) {
                throw new \InvalidArgumentException('No tariffs found for student class');
            }

            // Calculate bill amount
            $billData = $this->calculateBillAmount($tariffs, $currentTerm);

            // Create bill
            $bill = $this->billRepository->create([
                'student_id' => $studentId,
                'academic_year_id' => $currentAcademicYear->id,
                'term_id' => $currentTerm->id,
                'subtotal' => $billData['total_amount'],
                'discount' => 0,
                'tax' => 0,
                'total_amount' => $billData['total_amount'],
                'paid_amount' => 0,
                'balance' => $billData['total_amount'],
                'status' => BillStatus::PENDING,
                'due_date' => $this->calculateDueDate($currentTerm),
                'issue_date' => now(),
                'line_items' => $billData['items'],
                'description' => 'Term fees for ' . $currentTerm->name,
                'notes' => 'Auto-generated bill for ' . $currentTerm->name,
            ]);

            Log::info('Bill generated for student', [
                'student_id' => $studentId,
                'bill_id' => $bill->id,
                'amount' => $billData['total_amount']
            ]);

            DB::commit();
            return $bill;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to generate bill for student', [
                'error' => $e->getMessage(),
                'student_id' => $studentId
            ]);
            throw $e;
        }
    }

    public function recordPayment(int $billId, float $amount, string $paymentMethod, ?string $reference = null): Bill
    {
        DB::beginTransaction();

        try {
            $bill = $this->billRepository->findOrFail($billId);

            if ($bill->status === BillStatus::PAID) {
                throw new \InvalidArgumentException('Bill is already fully paid');
            }

            if ($bill->status === BillStatus::CANCELLED) {
                throw new \InvalidArgumentException('Cannot record payment for cancelled bill');
            }

            if ($amount <= 0) {
                throw new \InvalidArgumentException('Payment amount must be greater than zero');
            }

            if ($amount > $bill->balance) {
                throw new \InvalidArgumentException('Payment amount exceeds outstanding balance');
            }

            // Update bill
            $newPaidAmount = $bill->paid_amount + $amount;
            $newBalance = $bill->total_amount - $newPaidAmount;
            $newStatus = $newBalance <= 0 ? BillStatus::PAID : BillStatus::PENDING;

            $bill = $this->billRepository->update($billId, [
                'paid_amount' => $newPaidAmount,
                'balance' => $newBalance,
                'status' => $newStatus,
                'payment_date' => $newStatus === BillStatus::PAID ? now() : $bill->payment_date,
            ]);

            // Record payment history
            $this->recordPaymentHistory($billId, $amount, $paymentMethod, $reference);

            Log::info('Payment recorded', [
                'bill_id' => $billId,
                'amount' => $amount,
                'method' => $paymentMethod,
                'new_balance' => $newBalance
            ]);

            DB::commit();
            return $bill;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to record payment', [
                'error' => $e->getMessage(),
                'bill_id' => $billId,
                'amount' => $amount
            ]);
            throw $e;
        }
    }

    public function cancelBill(int $billId, string $reason): Bill
    {
        DB::beginTransaction();

        try {
            $bill = $this->billRepository->findOrFail($billId);

            if ($bill->status === BillStatus::PAID) {
                throw new \InvalidArgumentException('Cannot cancel a paid bill');
            }

            if ($bill->paid_amount > 0) {
                throw new \InvalidArgumentException('Cannot cancel a bill with partial payments');
            }

            $bill = $this->billRepository->update($billId, [
                'status' => BillStatus::CANCELLED,
                'notes' => ($bill->notes ?? '') . "\nCancelled: " . $reason,
            ]);

            Log::info('Bill cancelled', ['bill_id' => $billId, 'reason' => $reason]);

            DB::commit();
            return $bill;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to cancel bill', ['error' => $e->getMessage(), 'bill_id' => $billId]);
            throw $e;
        }
    }

    public function generateBillsForClass(int $classId): array
    {
        $students = $this->studentRepository->getByClass($classId);
        $results = [];
        $errors = [];

        foreach ($students as $student) {
            try {
                $results[] = $this->generateBillForStudent($student->id);
            } catch (\Exception $e) {
                $errors[] = [
                    'student_id' => $student->id,
                    'student_name' => $student->full_name,
                    'error' => $e->getMessage()
                ];
            }
        }

        return [
            'generated' => $results,
            'errors' => $errors,
            'total_students' => $students->count(),
            'successful' => count($results),
            'failed' => count($errors)
        ];
    }

    public function generateBillsForGrade(int $gradeId): array
    {
        $students = $this->studentRepository->getByGrade($gradeId);
        $results = [];
        $errors = [];

        foreach ($students as $student) {
            try {
                $results[] = $this->generateBillForStudent($student->id);
            } catch (\Exception $e) {
                $errors[] = [
                    'student_id' => $student->id,
                    'student_name' => $student->full_name,
                    'error' => $e->getMessage()
                ];
            }
        }

        return [
            'generated' => $results,
            'errors' => $errors,
            'total_students' => $students->count(),
            'successful' => count($results),
            'failed' => count($errors)
        ];
    }

    public function markOverdueBills(): int
    {
        $overdueBills = $this->billRepository->getOverdueBills();
        $count = 0;

        foreach ($overdueBills as $bill) {
            if ($bill->status === BillStatus::PENDING) {
                $this->billRepository->update($bill->id, ['status' => BillStatus::OVERDUE]);
                $count++;
            }
        }

        Log::info('Marked overdue bills', ['count' => $count]);
        return $count;
    }

    public function getStudentBills(int $studentId): Collection
    {
        return $this->billRepository->getByStudent($studentId);
    }

    public function getStudentOutstandingBalance(int $studentId): float
    {
        $bills = $this->billRepository->getByStudent($studentId);
        return $bills->sum('balance');
    }

    public function getBillsByStatus(BillStatus $status): Collection
    {
        return $this->billRepository->getByStatus($status);
    }

    public function getBillingSummary(int $academicYearId): array
    {
        $bills = $this->billRepository->getByAcademicYear($academicYearId);

        return [
            'total_bills' => $bills->count(),
            'total_amount' => $bills->sum('total_amount'),
            'paid_amount' => $bills->sum('paid_amount'),
            'outstanding_amount' => $bills->sum('balance'),
            'paid_bills' => $bills->where('status', BillStatus::PAID->value)->count(),
            'pending_bills' => $bills->where('status', BillStatus::PENDING->value)->count(),
            'overdue_bills' => $bills->where('status', BillStatus::OVERDUE->value)->count(),
            'cancelled_bills' => $bills->where('status', BillStatus::CANCELLED->value)->count(),
        ];
    }

    public function getRevenueReport(int $academicYearId): array
    {
        $bills = $this->billRepository->getByAcademicYear($academicYearId);
        $paidBills = $bills->where('status', BillStatus::PAID->value);

        $monthlyRevenue = [];
        foreach ($paidBills as $bill) {
            $month = $bill->payment_date?->format('Y-m') ?? 'Unknown';
            $monthlyRevenue[$month] = ($monthlyRevenue[$month] ?? 0) + $bill->paid_amount;
        }

        return [
            'total_revenue' => $paidBills->sum('paid_amount'),
            'monthly_revenue' => $monthlyRevenue,
            'average_bill_amount' => $bills->avg('total_amount'),
            'payment_rate' => $bills->count() > 0 ? ($paidBills->count() / $bills->count()) * 100 : 0,
        ];
    }

    private function calculateBillAmount(Collection $tariffs, $term): array
    {
        $items = [];
        $totalAmount = 0;

        foreach ($tariffs as $tariff) {
            $amount = $this->calculateTariffAmount($tariff, $term);

            $items[] = [
                'tariff_id' => $tariff->id,
                'name' => $tariff->name,
                'type' => $tariff->type->value,
                'amount' => $amount,
                'description' => $tariff->description,
            ];

            $totalAmount += $amount;
        }

        return [
            'items' => $items,
            'total_amount' => $totalAmount,
        ];
    }

    private function calculateTariffAmount(Tariff $tariff, $term): float
    {
        return match ($tariff->billing_frequency) {
            BillingFrequency::PER_TERM => (float) $tariff->amount,
            BillingFrequency::PER_MONTH => (float) $tariff->amount * $this->getTermMonths($term),
            BillingFrequency::PER_YEAR => (float) $tariff->amount / 3, // Assuming 3 terms per year
            BillingFrequency::ONE_TIME => (float) $tariff->amount,
        };
    }

    private function getTermMonths($term): int
    {
        // Calculate number of months in the term
        $start = new \DateTime($term->start_date->format('Y-m-d'));
        $end = new \DateTime($term->end_date->format('Y-m-d'));

        return max(1, $start->diff($end)->m + 1);
    }

    private function calculateDueDate($term): string
    {
        // Due date is typically 30 days from term start
        $termStart = new \DateTime($term->start_date->format('Y-m-d'));
        $dueDate = $termStart->add(new \DateInterval('P30D'));

        return $dueDate->format('Y-m-d');
    }

    private function recordPaymentHistory(int $billId, float $amount, string $method, ?string $reference): void
    {
        // This would typically be stored in a separate payments table
        // For now, we'll just log it
        Log::info('Payment history recorded', [
            'bill_id' => $billId,
            'amount' => $amount,
            'method' => $method,
            'reference' => $reference,
            'timestamp' => now()
        ]);
    }
}
