<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AcademicYearStatus;
use App\Models\AcademicYear;
use App\Repositories\AcademicYearRepository;
use App\Repositories\TermRepository;
use App\Repositories\BillRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AcademicYearService
{
    public function __construct(
        private readonly AcademicYearRepository $academicYearRepository,
        private readonly TermRepository $termRepository,
        private readonly BillRepository $billRepository
    ) {}

    public function createAcademicYear(array $data): AcademicYear
    {
        DB::beginTransaction();

        try {
            // Validate date range
            $this->validateDateRange($data['start_date'], $data['end_date']);

            // Check for overlapping academic years
            $this->checkForOverlappingYears($data['start_date'], $data['end_date']);

            // Create academic year
            $academicYear = $this->academicYearRepository->create([
                'name' => $data['name'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'status' => AcademicYearStatus::DRAFT,
                'description' => $data['description'] ?? null,
            ]);

            Log::info('Academic year created', ['id' => $academicYear->id, 'name' => $academicYear->name]);

            DB::commit();
            return $academicYear;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create academic year', ['error' => $e->getMessage(), 'data' => $data]);
            throw $e;
        }
    }

    public function updateAcademicYear(int $id, array $data): AcademicYear
    {
        DB::beginTransaction();

        try {
            $academicYear = $this->academicYearRepository->findOrFail($id);

            // Check if academic year can be modified
            if (!$academicYear->can_be_modified) {
                throw new \InvalidArgumentException('Cannot modify a closed academic year');
            }

            // Validate date range if dates are being updated
            if (isset($data['start_date']) || isset($data['end_date'])) {
                $startDate = $data['start_date'] ?? $academicYear->start_date;
                $endDate = $data['end_date'] ?? $academicYear->end_date;

                $this->validateDateRange($startDate, $endDate);
                $this->checkForOverlappingYears($startDate, $endDate, $id);
            }

            $academicYear = $this->academicYearRepository->update($id, $data);

            Log::info('Academic year updated', ['id' => $academicYear->id, 'changes' => $data]);

            DB::commit();
            return $academicYear;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update academic year', ['error' => $e->getMessage(), 'id' => $id, 'data' => $data]);
            throw $e;
        }
    }

    public function activateAcademicYear(int $id): AcademicYear
    {
        DB::beginTransaction();

        try {
            $academicYear = $this->academicYearRepository->findOrFail($id);

            if ($academicYear->status === AcademicYearStatus::CLOSED) {
                throw new \InvalidArgumentException('Cannot activate a closed academic year');
            }

            // Deactivate other active academic years
            $activeYears = $this->academicYearRepository->getActive();
            foreach ($activeYears as $activeYear) {
                if ($activeYear->id !== $id) {
                    $this->academicYearRepository->update($activeYear->id, ['status' => AcademicYearStatus::DRAFT]);
                }
            }

            // Activate the selected academic year
            $academicYear = $this->academicYearRepository->update($id, ['status' => AcademicYearStatus::ACTIVE]);

            Log::info('Academic year activated', ['id' => $academicYear->id, 'name' => $academicYear->name]);

            DB::commit();
            return $academicYear;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to activate academic year', ['error' => $e->getMessage(), 'id' => $id]);
            throw $e;
        }
    }

    public function closeAcademicYear(int $id): AcademicYear
    {
        DB::beginTransaction();

        try {
            $academicYear = $this->academicYearRepository->findOrFail($id);

            if (!$this->canBeClosed($id)) {
                throw new \InvalidArgumentException('Academic year cannot be closed. Ensure all terms are completed.');
            }

            $academicYear = $this->academicYearRepository->update($id, ['status' => AcademicYearStatus::CLOSED]);

            Log::info('Academic year closed', ['id' => $academicYear->id, 'name' => $academicYear->name]);

            DB::commit();
            return $academicYear;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to close academic year', ['error' => $e->getMessage(), 'id' => $id]);
            throw $e;
        }
    }

    public function deleteAcademicYear(int $id): bool
    {
        DB::beginTransaction();

        try {
            if (!$this->canBeDeleted($id)) {
                throw new \InvalidArgumentException('Academic year cannot be deleted. It has associated terms or bills.');
            }

            $academicYear = $this->academicYearRepository->findOrFail($id);
            $result = $this->academicYearRepository->delete($id);

            Log::info('Academic year deleted', ['id' => $id, 'name' => $academicYear->name]);

            DB::commit();
            return $result;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete academic year', ['error' => $e->getMessage(), 'id' => $id]);
            throw $e;
        }
    }

    public function getCurrentAcademicYear(): ?AcademicYear
    {
        return $this->academicYearRepository->getCurrent();
    }

    public function getActiveAcademicYears(): Collection
    {
        return $this->academicYearRepository->getActive();
    }

    public function getAcademicYearWithTerms(int $id): ?AcademicYear
    {
        return $this->academicYearRepository->findWithTerms($id);
    }

    public function getAcademicYearStatistics(int $id): array
    {
        $academicYear = $this->academicYearRepository->findOrFail($id);
        $terms = $this->termRepository->getByAcademicYear($id);
        $bills = $this->billRepository->getByAcademicYear($id);

        return [
            'academic_year' => $academicYear,
            'total_terms' => $terms->count(),
            'completed_terms' => $terms->where('status', 'completed')->count(),
            'active_terms' => $terms->where('status', 'active')->count(),
            'total_bills' => $bills->count(),
            'total_revenue' => $bills->where('status', 'paid')->sum('total_amount'),
            'outstanding_amount' => $bills->where('status', '!=', 'paid')->sum('balance'),
        ];
    }

    public function canBeClosed(int $id): bool
    {
        $academicYear = $this->academicYearRepository->findOrFail($id);

        if ($academicYear->status !== AcademicYearStatus::ACTIVE) {
            return false;
        }

        // Check if all terms are completed
        $terms = $this->termRepository->getByAcademicYear($id);
        $incompleteTerms = $terms->whereNotIn('status', ['completed']);

        return $incompleteTerms->isEmpty();
    }

    public function canBeDeleted(int $id): bool
    {
        return $this->academicYearRepository->canBeDeleted($id);
    }

    public function searchAcademicYears(string $search): Collection
    {
        return $this->academicYearRepository->searchByName($search);
    }

    public function getAcademicYearsOrderedByDate(): Collection
    {
        return $this->academicYearRepository->getOrderedByStartDate();
    }

    private function validateDateRange(string $startDate, string $endDate): void
    {
        $start = new \DateTime($startDate);
        $end = new \DateTime($endDate);

        if ($start >= $end) {
            throw new \InvalidArgumentException('Start date must be before end date');
        }

        // Academic year should be at least 6 months
        $minDuration = $start->diff($end)->days;
        if ($minDuration < 180) {
            throw new \InvalidArgumentException('Academic year must be at least 6 months long');
        }

        // Academic year should not be more than 2 years
        if ($minDuration > 730) {
            throw new \InvalidArgumentException('Academic year cannot be more than 2 years long');
        }
    }

    private function checkForOverlappingYears(string $startDate, string $endDate, ?int $excludeId = null): void
    {
        $start = new \DateTime($startDate);
        $end = new \DateTime($endDate);

        $overlappingYears = $this->academicYearRepository->getYearsByDateRange($start, $end);

        if ($excludeId) {
            $overlappingYears = $overlappingYears->where('id', '!=', $excludeId);
        }

        if ($overlappingYears->isNotEmpty()) {
            throw new \InvalidArgumentException('Academic year dates overlap with existing academic year(s)');
        }
    }
}
