<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\BillStatus;
use App\Models\Bill;
use App\Models\Student;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class BillRepository extends BaseRepository
{
    public function __construct(Bill $model)
    {
        parent::__construct($model);
    }

    /**
     * Get all bills with optional filtering
     */
    public function getAll(array $filters = []): Collection
    {
        $query = $this->model->with(['student.class.grade', 'academicYear', 'term']);

        // Apply filters
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['class_id'])) {
            $query->whereHas('student', function ($q) use ($filters) {
                $q->where('class_id', $filters['class_id']);
            });
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('bill_number', 'like', "%{$search}%")
                  ->orWhereHas('student', function ($studentQuery) use ($search) {
                      $studentQuery->where('first_name', 'like', "%{$search}%")
                                   ->orWhere('last_name', 'like', "%{$search}%")
                                   ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
                  });
            });
        }

        if (!empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        if (!empty($filters['term_id'])) {
            $query->where('term_id', $filters['term_id']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    public function getPending(): Collection
    {
        return $this->model->pending()->get();
    }

    public function getPaid(): Collection
    {
        return $this->model->paid()->get();
    }

    public function getOverdue(): Collection
    {
        return $this->model->overdue()->get();
    }

    public function getByStatus(BillStatus $status): Collection
    {
        return $this->model->where('status', $status)->get();
    }

    public function getByStudent(int $studentId): Collection
    {
        return $this->model->byStudent($studentId)->get();
    }

    public function getByAcademicYear(int $academicYearId): Collection
    {
        return $this->model->byAcademicYear($academicYearId)->get();
    }

    public function getByTerm(int $termId): Collection
    {
        return $this->model->forTerm($termId)->get();
    }

    public function getWithOutstandingBalance(): Collection
    {
        return $this->model->withOutstandingBalance()->get();
    }

    public function findWithRelations(int $id): ?Bill
    {
        return $this->model
            ->with(['student.class.grade', 'academicYear'])
            ->find($id);
    }

    public function getStudentBillsWithBalance(int $studentId): Collection
    {
        return $this->model
            ->byStudent($studentId)
            ->withOutstandingBalance()
            ->with('academicYear')
            ->orderBy('due_date')
            ->get();
    }

    public function getBillsByDateRange(\DateTime $startDate, \DateTime $endDate): Collection
    {
        return $this->model
            ->whereBetween('bill_date', [$startDate, $endDate])
            ->with(['student.class.grade', 'academicYear'])
            ->get();
    }

    public function getOverdueBills(): Collection
    {
        return $this->model
            ->where('due_date', '<', now())
            ->where('status', '!=', BillStatus::PAID->value)
            ->where('status', '!=', BillStatus::CANCELLED->value)
            ->with(['student.class.grade'])
            ->get();
    }

    public function getDueThisWeek(): Collection
    {
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();

        return $this->model
            ->whereBetween('due_date', [$startOfWeek, $endOfWeek])
            ->where('status', BillStatus::PENDING->value)
            ->with(['student.class.grade'])
            ->get();
    }

    public function searchByStudentName(string $search): Collection
    {
        return $this->model
            ->whereHas('student', function ($query) use ($search) {
                $query->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
            })
            ->with(['student.class.grade', 'academicYear'])
            ->get();
    }

    public function paginateWithRelations(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with(['student.class.grade', 'academicYear'])
            ->orderBy('bill_date', 'desc')
            ->paginate($perPage);
    }

    public function paginateByStatus(BillStatus $status, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->where('status', $status)
            ->with(['student.class.grade', 'academicYear'])
            ->orderBy('bill_date', 'desc')
            ->paginate($perPage);
    }

    public function getPaymentHistory(int $studentId): Collection
    {
        return $this->model
            ->byStudent($studentId)
            ->where('status', BillStatus::PAID->value)
            ->orderBy('paid_date', 'desc')
            ->get();
    }

    public function getTotalAmountByStatus(BillStatus $status): float
    {
        return $this->model
            ->where('status', $status)
            ->sum('total_amount');
    }

    public function getTotalOutstandingBalance(): float
    {
        return $this->model
            ->where('status', '!=', BillStatus::PAID->value)
            ->where('status', '!=', BillStatus::CANCELLED->value)
            ->sum('balance');
    }

    public function getRevenueByDateRange(\DateTime $startDate, \DateTime $endDate): float
    {
        return $this->model
            ->where('status', BillStatus::PAID->value)
            ->whereBetween('paid_date', [$startDate, $endDate])
            ->sum('total_amount');
    }

    public function getMonthlyRevenue(int $year, int $month): float
    {
        return $this->model
            ->where('status', BillStatus::PAID->value)
            ->whereYear('paid_date', $year)
            ->whereMonth('paid_date', $month)
            ->sum('total_amount');
    }

    public function markAsOverdue(): int
    {
        return $this->model
            ->where('due_date', '<', now())
            ->where('status', BillStatus::PENDING->value)
            ->update(['status' => BillStatus::OVERDUE->value]);
    }

    public function getStatistics(): array
    {
        return [
            'total_bills' => $this->model->count(),
            'pending_bills' => $this->model->where('status', BillStatus::PENDING->value)->count(),
            'paid_bills' => $this->model->where('status', BillStatus::PAID->value)->count(),
            'overdue_bills' => $this->model->where('status', BillStatus::OVERDUE->value)->count(),
            'cancelled_bills' => $this->model->where('status', BillStatus::CANCELLED->value)->count(),
            'total_revenue' => $this->model->where('status', BillStatus::PAID->value)->sum('total_amount'),
            'outstanding_balance' => $this->getTotalOutstandingBalance(),
            'average_bill_amount' => $this->model->avg('total_amount'),
        ];
    }

    public function bulkUpdateStatus(array $billIds, BillStatus $status): int
    {
        return $this->model
            ->whereIn('id', $billIds)
            ->update(['status' => $status]);
    }

    public function getStudentBillingSummary(int $studentId): array
    {
        $bills = $this->model->byStudent($studentId);

        return [
            'total_bills' => $bills->count(),
            'total_amount' => $bills->sum('total_amount'),
            'total_paid' => $bills->where('status', BillStatus::PAID->value)->sum('total_amount'),
            'outstanding_balance' => $bills->where('status', '!=', BillStatus::PAID->value)
                                          ->where('status', '!=', BillStatus::CANCELLED->value)
                                          ->sum('balance'),
            'overdue_count' => $bills->where('status', BillStatus::OVERDUE->value)->count(),
        ];
    }
}
