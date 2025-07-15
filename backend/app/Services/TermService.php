<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\TermStatus;
use App\Models\Term;
use App\Models\AcademicYear;
use App\Repositories\TermRepository;
use App\Repositories\AcademicYearRepository;
use App\Repositories\BillRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TermService
{
    public function __construct(
        private readonly TermRepository $termRepository,
        private readonly AcademicYearRepository $academicYearRepository,
        private readonly BillRepository $billRepository
    ) {}

    public function createTerm(array $data): Term
    {
        DB::beginTransaction();

        try {
            // Validate academic year exists and is active
            $academicYear = $this->academicYearRepository->findOrFail($data['academic_year_id']);

            if (!$academicYear->is_active) {
                throw new \InvalidArgumentException('Cannot create terms for inactive academic year');
            }

            // Validate date range
            $this->validateDateRange($data['start_date'], $data['end_date'], $academicYear);

            // Check for overlapping terms
            $this->checkForOverlappingTerms(
                $data['academic_year_id'],
                $data['start_date'],
                $data['end_date']
            );

            // Create term
            $term = $this->termRepository->create([
                'academic_year_id' => $data['academic_year_id'],
                'name' => $data['name'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'status' => TermStatus::UPCOMING,
                'description' => $data['description'] ?? null,
            ]);

            Log::info('Term created', ['id' => $term->id, 'name' => $term->name]);

            DB::commit();
            return $term;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create term', ['error' => $e->getMessage(), 'data' => $data]);
            throw $e;
        }
    }

    public function updateTerm(int $id, array $data): Term
    {
        DB::beginTransaction();

        try {
            $term = $this->termRepository->findOrFail($id);

            // Check if term can be modified
            if ($term->status === TermStatus::COMPLETED) {
                throw new \InvalidArgumentException('Cannot modify a completed term');
            }

            // Validate date range if dates are being updated
            if (isset($data['start_date']) || isset($data['end_date'])) {
                $startDate = $data['start_date'] ?? $term->start_date->format('Y-m-d');
                $endDate = $data['end_date'] ?? $term->end_date->format('Y-m-d');
                $academicYear = $term->academicYear;

                $this->validateDateRange($startDate, $endDate, $academicYear);
                $this->checkForOverlappingTerms(
                    $term->academic_year_id,
                    $startDate,
                    $endDate,
                    $id
                );
            }

            $term = $this->termRepository->update($id, $data);

            Log::info('Term updated', ['id' => $term->id, 'changes' => $data]);

            DB::commit();
            return $term;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update term', ['error' => $e->getMessage(), 'id' => $id, 'data' => $data]);
            throw $e;
        }
    }

    public function activateTerm(int $id): Term
    {
        DB::beginTransaction();

        try {
            $term = $this->termRepository->findOrFail($id);

            if (!$term->canBeActivated()) {
                throw new \InvalidArgumentException('Term cannot be activated');
            }

            // Deactivate other active terms in the same academic year
            $activeTerms = $this->termRepository->getByStatus(TermStatus::ACTIVE);
            foreach ($activeTerms as $activeTerm) {
                if ($activeTerm->academic_year_id === $term->academic_year_id && $activeTerm->id !== $id) {
                    $this->termRepository->update($activeTerm->id, ['status' => TermStatus::UPCOMING]);
                }
            }

            // Activate the selected term
            $term = $this->termRepository->update($id, ['status' => TermStatus::ACTIVE]);

            Log::info('Term activated', ['id' => $term->id, 'name' => $term->name]);

            DB::commit();
            return $term;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to activate term', ['error' => $e->getMessage(), 'id' => $id]);
            throw $e;
        }
    }

    public function completeTerm(int $id): Term
    {
        DB::beginTransaction();

        try {
            $term = $this->termRepository->findOrFail($id);

            if (!$term->canBeCompleted()) {
                throw new \InvalidArgumentException('Term cannot be completed');
            }

            $term = $this->termRepository->update($id, ['status' => TermStatus::COMPLETED]);

            Log::info('Term completed', ['id' => $term->id, 'name' => $term->name]);

            DB::commit();
            return $term;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to complete term', ['error' => $e->getMessage(), 'id' => $id]);
            throw $e;
        }
    }

    public function deleteTerm(int $id): bool
    {
        DB::beginTransaction();

        try {
            if (!$this->canBeDeleted($id)) {
                throw new \InvalidArgumentException('Term cannot be deleted. It has associated bills or is active/completed.');
            }

            $term = $this->termRepository->findOrFail($id);
            $result = $this->termRepository->delete($id);

            Log::info('Term deleted', ['id' => $id, 'name' => $term->name]);

            DB::commit();
            return $result;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete term', ['error' => $e->getMessage(), 'id' => $id]);
            throw $e;
        }
    }

    public function getCurrentTerm(): ?Term
    {
        return $this->termRepository->getCurrent();
    }

    public function getActiveTerms(): Collection
    {
        return $this->termRepository->getActive();
    }

    public function getTermsByAcademicYear(int $academicYearId): Collection
    {
        return $this->termRepository->getByAcademicYear($academicYearId);
    }

    public function getTermWithAcademicYear(int $id): ?Term
    {
        return $this->termRepository->findWithAcademicYear($id);
    }

    public function getTermStatistics(int $id): array
    {
        $term = $this->termRepository->findOrFail($id);
        $bills = $this->billRepository->getByTerm($id);

        return [
            'term' => $term,
            'total_bills' => $bills->count(),
            'total_revenue' => $bills->where('status', 'paid')->sum('total_amount'),
            'outstanding_amount' => $bills->where('status', '!=', 'paid')->sum('balance'),
            'duration_days' => $term->start_date->diffInDays($term->end_date) + 1,
            'days_elapsed' => $term->start_date->diffInDays(now()),
            'days_remaining' => now()->diffInDays($term->end_date),
        ];
    }

    public function canBeDeleted(int $id): bool
    {
        return $this->termRepository->canBeDeleted($id);
    }

    public function searchTerms(string $search): Collection
    {
        return $this->termRepository->searchByName($search);
    }

    public function getTermsOrderedByDate(): Collection
    {
        return $this->termRepository->getOrderedByStartDate();
    }

    private function validateDateRange(string $startDate, string $endDate, AcademicYear $academicYear): void
    {
        $start = new \DateTime($startDate);
        $end = new \DateTime($endDate);

        if ($start >= $end) {
            throw new \InvalidArgumentException('Start date must be before end date');
        }

        // Term must be within academic year
        if ($start < $academicYear->start_date || $end > $academicYear->end_date) {
            throw new \InvalidArgumentException('Term dates must be within the academic year');
        }

        // Term should be at least 1 week
        $minDuration = $start->diff($end)->days;
        if ($minDuration < 7) {
            throw new \InvalidArgumentException('Term must be at least 1 week long');
        }
    }

    private function checkForOverlappingTerms(int $academicYearId, string $startDate, string $endDate, ?int $excludeTermId = null): void
    {
        $overlappingTerms = $this->termRepository->getOverlappingTerms(
            $academicYearId,
            new \DateTime($startDate),
            new \DateTime($endDate),
            $excludeTermId
        );

        if ($overlappingTerms->isNotEmpty()) {
            throw new \InvalidArgumentException('Term dates overlap with existing terms');
        }
    }
}
