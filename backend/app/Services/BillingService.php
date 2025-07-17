<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BillStatus;
use App\Enums\BillingFrequency;
use App\Models\Bill;
use App\Models\Student;
use App\Models\Tariff;
use App\Repositories\BillRepository;
use App\Repositories\BillItemRepository;
use App\Repositories\StudentRepository;
use App\Repositories\TariffRepository;
use App\Repositories\AcademicYearRepository;
use App\Repositories\TermRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\BillItem;

class BillingService
{
    public function __construct(
        private readonly BillRepository $billRepository,
        private readonly BillItemRepository $billItemRepository,
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

            // Create individual bill items for each tariff
            foreach ($billData['items'] as $item) {
                $this->billItemRepository->create([
                    'bill_id' => $bill->id,
                    'tariff_id' => $item['tariff_id'],
                    'name' => $item['name'],
                    'description' => $item['description'],
                    'type' => $item['type'],
                    'amount' => $item['amount'],
                    'paid_amount' => 0,
                    'balance' => $item['amount'],
                    'status' => 'pending',
                ]);
            }

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

    /**
     * Get all bills with optional filtering
     */
    public function getAllBills(array $filters = []): Collection
    {
        return $this->billRepository->getAll($filters);
    }

    /**
     * Get bill items for a specific bill
     */
    public function getBillItems(int $billId): Collection
    {
        return $this->billItemRepository->getByBill($billId);
    }

    /**
     * Record payment for a specific bill item
     */
    public function recordBillItemPayment(int $billItemId, float $amount, string $paymentMethod, ?string $reference = null, ?string $notes = null): BillItem
    {
        DB::beginTransaction();

        try {
            $billItem = $this->billItemRepository->findOrFail($billItemId);

            if ($billItem->status === 'paid') {
                throw new \InvalidArgumentException('Bill item is already fully paid');
            }

            if ($amount <= 0) {
                throw new \InvalidArgumentException('Payment amount must be greater than zero');
            }

            if ($amount > $billItem->balance) {
                throw new \InvalidArgumentException('Payment amount exceeds outstanding balance');
            }

            // Record payment for the bill item
            $billItem = $this->billItemRepository->recordPayment($billItemId, $amount, [
                'method' => $paymentMethod,
                'reference' => $reference,
                'notes' => $notes,
            ]);

            // Update the main bill totals
            $this->updateBillTotals($billItem->bill_id);

            Log::info('Bill item payment recorded', [
                'bill_item_id' => $billItemId,
                'amount' => $amount,
                'method' => $paymentMethod,
                'new_balance' => $billItem->balance
            ]);

            DB::commit();
            return $billItem;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to record bill item payment', [
                'error' => $e->getMessage(),
                'bill_item_id' => $billItemId,
                'amount' => $amount
            ]);
            throw $e;
        }
    }

    /**
     * Update bill totals based on bill items
     */
    private function updateBillTotals(int $billId): void
    {
        $bill = $this->billRepository->findOrFail($billId);
        $billItems = $this->billItemRepository->getByBill($billId);

        $totalPaid = $billItems->sum('paid_amount');
        $totalBalance = $billItems->sum('balance');

        $status = $totalBalance <= 0 ? BillStatus::PAID : BillStatus::PENDING;

        $this->billRepository->update($billId, [
            'paid_amount' => $totalPaid,
            'balance' => $totalBalance,
            'status' => $status,
            'paid_date' => $status === BillStatus::PAID ? now() : $bill->paid_date,
        ]);
    }

    /**
     * Get pending bill items for a student
     */
    public function getStudentBillItems(int $studentId): Collection
    {
        return $this->billItemRepository->getPendingByStudent($studentId);
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

    /**
     * Get optimized payment overview data for all classes
     */
    public function getPaymentOverview(): array
    {
        try {
            // Get all classes with their payment statistics in a single optimized query
            $classPaymentData = DB::table('classes')
                ->join('grades', 'classes.grade_id', '=', 'grades.id')
                ->leftJoin('students', 'students.class_id', '=', 'classes.id')
                ->leftJoin('bills', 'bills.student_id', '=', 'students.id')
                ->select([
                    'classes.id as class_id',
                    'classes.name as class_name',
                    'grades.id as grade_id',
                    'grades.name as grade_name',
                    DB::raw('COUNT(DISTINCT students.id) as student_count'),
                    DB::raw('COALESCE(SUM(bills.total_amount), 0) as total_amount'),
                    DB::raw('COALESCE(SUM(bills.paid_amount), 0) as paid_amount'),
                    DB::raw('COALESCE(SUM(bills.total_amount - bills.paid_amount), 0) as balance'),
                    DB::raw('COUNT(DISTINCT CASE WHEN bills.paid_amount = bills.total_amount AND bills.total_amount > 0 THEN students.id END) as paid_students'),
                    DB::raw('COUNT(DISTINCT CASE WHEN bills.paid_amount > 0 AND bills.paid_amount < bills.total_amount THEN students.id END) as partial_students'),
                    DB::raw('COUNT(DISTINCT CASE WHEN bills.paid_amount = 0 OR bills.paid_amount IS NULL THEN students.id END) as pending_students'),
                    DB::raw('COUNT(DISTINCT CASE WHEN bills.status = "overdue" THEN students.id END) as overdue_students')
                ])
                ->groupBy('classes.id', 'classes.name', 'grades.id', 'grades.name')
                ->orderBy('grades.name')
                ->orderBy('classes.name')
                ->get();

            // Calculate payment percentage for each class
            $classes = $classPaymentData->map(function ($class) {
                $paymentPercentage = $class->total_amount > 0
                    ? ($class->paid_amount / $class->total_amount) * 100
                    : 0;

                return [
                    'id' => $class->class_id,
                    'name' => $class->class_name,
                    'grade' => [
                        'id' => $class->grade_id,
                        'name' => $class->grade_name
                    ],
                    'student_count' => (int) $class->student_count,
                    'total_amount' => (float) $class->total_amount,
                    'paid_amount' => (float) $class->paid_amount,
                    'balance' => (float) $class->balance,
                    'payment_percentage' => round($paymentPercentage, 2),
                    'paid_students' => (int) $class->paid_students,
                    'partial_students' => (int) $class->partial_students,
                    'pending_students' => (int) $class->pending_students,
                    'overdue_students' => (int) $class->overdue_students
                ];
            });

            // Calculate overall statistics
            $totalStats = [
                'total_students' => $classes->sum('student_count'),
                'paid_students' => $classes->sum('paid_students'),
                'partial_students' => $classes->sum('partial_students'),
                'pending_students' => $classes->sum('pending_students'),
                'overdue_students' => $classes->sum('overdue_students'),
                'total_revenue' => $classes->sum('total_amount'),
                'collected_revenue' => $classes->sum('paid_amount'),
                'outstanding_revenue' => $classes->sum('balance')
            ];

            return [
                'classes' => $classes->toArray(),
                'statistics' => $totalStats
            ];
        } catch (\Exception $e) {
            Log::error('Error getting payment overview: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get optimized payment data for a specific class
     */
    public function getClassPaymentDetails(int $classId): array
    {
        try {
            // Get class information
            $class = DB::table('classes')
                ->join('grades', 'classes.grade_id', '=', 'grades.id')
                ->where('classes.id', $classId)
                ->select([
                    'classes.id as class_id',
                    'classes.name as class_name',
                    'grades.id as grade_id',
                    'grades.name as grade_name'
                ])
                ->first();

            if (!$class) {
                throw new \InvalidArgumentException('Class not found');
            }

            // Get students with their payment data
            $students = DB::table('students')
                ->where('students.class_id', $classId)
                ->leftJoin('bills', 'bills.student_id', '=', 'students.id')
                ->select([
                    'students.id',
                    'students.student_id',
                    'students.first_name',
                    'students.last_name',
                    DB::raw('CONCAT(students.first_name, " ", students.last_name) as full_name'),
                    DB::raw('COALESCE(SUM(bills.total_amount), 0) as total_amount'),
                    DB::raw('COALESCE(SUM(bills.paid_amount), 0) as paid_amount'),
                    DB::raw('COALESCE(SUM(bills.total_amount - bills.paid_amount), 0) as balance'),
                    DB::raw('MAX(CASE WHEN bills.status = "overdue" THEN 1 ELSE 0 END) as has_overdue')
                ])
                ->groupBy('students.id', 'students.student_id', 'students.first_name', 'students.last_name')
                ->orderBy('students.last_name')
                ->orderBy('students.first_name')
                ->get();

            // Calculate payment statistics for each student and get their detailed bills
            $studentsWithPayments = $students->map(function ($student) {
                $paymentPercentage = $student->total_amount > 0
                    ? ($student->paid_amount / $student->total_amount) * 100
                    : 0;

                $paymentStatus = 'pending';
                if ($paymentPercentage === 100) {
                    $paymentStatus = 'paid';
                } elseif ($paymentPercentage > 0) {
                    $paymentStatus = 'partial';
                }

                // Get detailed bills for this student
                $bills = DB::table('bills')
                    ->leftJoin('bill_items', 'bills.id', '=', 'bill_items.bill_id')
                    ->leftJoin('tariffs', 'bill_items.tariff_id', '=', 'tariffs.id')
                    ->where('bills.student_id', $student->id)
                    ->select([
                        'bills.id as bill_id',
                        'bills.bill_number',
                        'bills.total_amount as bill_total',
                        'bills.paid_amount as bill_paid',
                        'bills.status as bill_status',
                        'bills.due_date',
                        'bills.created_at as bill_date',
                        'bill_items.id as item_id',
                        'bill_items.amount as item_amount',
                        'bill_items.paid_amount as item_paid',
                        'bill_items.status as item_status',
                        'tariffs.name as tariff_name',
                        'tariffs.type as tariff_type'
                    ])
                    ->orderBy('bills.created_at', 'desc')
                    ->get();

                // Group bill items by bill
                $groupedBills = $bills->groupBy('bill_id')->map(function ($billItems) {
                    $firstItem = $billItems->first();
                    return [
                        'id' => $firstItem->bill_id,
                        'bill_number' => $firstItem->bill_number,
                        'total_amount' => (float) $firstItem->bill_total,
                        'paid_amount' => (float) $firstItem->bill_paid,
                        'balance' => (float) ($firstItem->bill_total - $firstItem->bill_paid),
                        'status' => $firstItem->bill_status,
                        'due_date' => $firstItem->due_date,
                        'bill_date' => $firstItem->bill_date,
                        'items' => $billItems->map(function ($item) {
                            return [
                                'id' => $item->item_id,
                                'tariff_name' => $item->tariff_name,
                                'tariff_type' => $item->tariff_type,
                                'amount' => (float) $item->item_amount,
                                'paid_amount' => (float) $item->item_paid,
                                'balance' => (float) ($item->item_amount - $item->item_paid),
                                'status' => $item->item_status
                            ];
                        })->toArray()
                    ];
                })->values()->toArray();

                return [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'full_name' => $student->full_name ?: ($student->first_name . ' ' . $student->last_name),
                    'total_amount' => (float) $student->total_amount,
                    'paid_amount' => (float) $student->paid_amount,
                    'balance' => (float) $student->balance,
                    'payment_percentage' => round($paymentPercentage, 2),
                    'has_overdue' => (bool) $student->has_overdue,
                    'payment_status' => $paymentStatus,
                    'bills' => $groupedBills
                ];
            });

            // Calculate class totals
            $classTotals = [
                'student_count' => $studentsWithPayments->count(),
                'total_amount' => $studentsWithPayments->sum('total_amount'),
                'paid_amount' => $studentsWithPayments->sum('paid_amount'),
                'balance' => $studentsWithPayments->sum('balance'),
                'paid_students' => $studentsWithPayments->where('payment_status', 'paid')->count(),
                'partial_students' => $studentsWithPayments->where('payment_status', 'partial')->count(),
                'pending_students' => $studentsWithPayments->where('payment_status', 'pending')->count(),
                'overdue_students' => $studentsWithPayments->where('has_overdue', true)->count()
            ];

            $paymentPercentage = $classTotals['total_amount'] > 0
                ? ($classTotals['paid_amount'] / $classTotals['total_amount']) * 100
                : 0;

            return [
                'class' => [
                    'id' => $class->class_id,
                    'name' => $class->class_name,
                    'grade' => [
                        'id' => $class->grade_id,
                        'name' => $class->grade_name
                    ],
                    'payment_percentage' => round($paymentPercentage, 2),
                    ...$classTotals
                ],
                'students' => $studentsWithPayments->toArray()
            ];
        } catch (\Exception $e) {
            Log::error('Error getting class payment details: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get all tariffs assigned to a specific class
     */
    public function getClassTariffs(int $classId): array
    {
        try {
                        $result = DB::select("
                SELECT
                    MIN(t.id) as id,
                    t.name,
                    t.type,
                    MAX(t.amount) as amount,
                    MAX(t.billing_frequency) as billing_frequency,
                    MAX(t.description) as description,
                    COUNT(DISTINCT s.id) as student_count,
                    SUM(CASE WHEN bi.id IS NOT NULL THEN bi.amount ELSE 0 END) as total_billed,
                    SUM(CASE WHEN bi.id IS NOT NULL THEN bi.paid_amount ELSE 0 END) as total_paid,
                    SUM(CASE WHEN bi.id IS NOT NULL THEN (bi.amount - bi.paid_amount) ELSE 0 END) as total_balance
                FROM tariffs t
                INNER JOIN class_tariff ct ON t.id = ct.tariff_id
                INNER JOIN classes c ON ct.class_id = c.id
                LEFT JOIN students s ON s.class_id = c.id
                LEFT JOIN bills b ON b.student_id = s.id
                LEFT JOIN bill_items bi ON bi.bill_id = b.id AND bi.tariff_id = t.id
                WHERE c.id = ? AND t.is_active = 1
                GROUP BY t.name, t.type
                ORDER BY t.name
            ", [$classId]);

            return array_map(function($tariff) {
                return [
                    'id' => $tariff->id,
                    'name' => $tariff->name,
                    'type' => $tariff->type,
                    'amount' => (float) $tariff->amount,
                    'frequency' => $tariff->billing_frequency,
                    'description' => $tariff->description,
                    'student_count' => (int) $tariff->student_count,
                    'total_billed' => (float) $tariff->total_billed,
                    'total_paid' => (float) $tariff->total_paid,
                    'total_balance' => (float) $tariff->total_balance,
                    'payment_percentage' => $tariff->total_billed > 0 ?
                        round(($tariff->total_paid / $tariff->total_billed) * 100, 2) : 0
                ];
            }, $result);

        } catch (\Exception $e) {
            Log::error('Error getting class tariffs: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get student payment progress for a specific tariff in a class
     */
    public function getStudentPaymentProgressByTariff(int $classId, int $tariffId): array
    {
        try {
                        $result = DB::select("
                SELECT
                    s.id,
                    s.student_id,
                    CONCAT(s.first_name, ' ', s.last_name) as full_name,
                    s.status,
                    t.name as tariff_name,
                    t.type as tariff_type,
                    t.amount as tariff_amount,
                    t.billing_frequency as tariff_frequency,
                    COALESCE(SUM(bi.amount), 0) as total_billed,
                    COALESCE(SUM(bi.paid_amount), 0) as total_paid,
                    CASE
                        WHEN SUM(bi.amount) IS NULL OR SUM(bi.amount) = 0 THEN t.amount
                        ELSE SUM(bi.amount - bi.paid_amount)
                    END as balance,
                    CASE
                        WHEN SUM(bi.amount) IS NULL OR SUM(bi.amount) = 0 THEN 'not_billed'
                        WHEN SUM(bi.paid_amount) = 0 THEN 'pending'
                        WHEN SUM(bi.paid_amount) >= SUM(bi.amount) THEN 'paid'
                        ELSE 'partial'
                    END as payment_status,
                    COUNT(DISTINCT b.id) as bill_count,
                    MAX(b.due_date) as latest_due_date
                FROM students s
                INNER JOIN classes c ON s.class_id = c.id
                CROSS JOIN tariffs t
                LEFT JOIN bills b ON b.student_id = s.id
                LEFT JOIN bill_items bi ON bi.bill_id = b.id AND bi.tariff_id = t.id
                WHERE c.id = ? AND t.id = ? AND s.status = 'active'
                GROUP BY s.id, s.student_id, s.first_name, s.last_name, s.status,
                         t.name, t.type, t.amount, t.billing_frequency
                ORDER BY s.first_name, s.last_name
            ", [$classId, $tariffId]);

            return array_map(function($student) {
                return [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'full_name' => $student->full_name,
                    'status' => $student->status,
                    'tariff_name' => $student->tariff_name,
                    'tariff_type' => $student->tariff_type,
                    'tariff_amount' => (float) $student->tariff_amount,
                    'tariff_frequency' => $student->tariff_frequency,
                    'total_billed' => (float) $student->total_billed,
                    'total_paid' => (float) $student->total_paid,
                    'balance' => (float) $student->balance,
                    'payment_status' => $student->payment_status,
                    'payment_percentage' => $student->total_billed > 0 ?
                        round(($student->total_paid / $student->total_billed) * 100, 2) : 0,
                    'bill_count' => (int) $student->bill_count,
                    'latest_due_date' => $student->latest_due_date
                ];
            }, $result);

        } catch (\Exception $e) {
            Log::error('Error getting student payment progress by tariff: ' . $e->getMessage());
            throw $e;
        }
    }
}
