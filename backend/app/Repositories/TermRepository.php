<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\TermStatus;
use App\Models\Term;
use App\Models\AcademicYear;
use Illuminate\Database\Eloquent\Collection;

class TermRepository extends BaseRepository
{
    public function __construct(Term $model)
    {
        parent::__construct($model);
    }

    public function getActive(): Collection
    {
        return $this->model->active()->get();
    }

    public function getUpcoming(): Collection
    {
        return $this->model->upcoming()->get();
    }

    public function getCompleted(): Collection
    {
        return $this->model->completed()->get();
    }

    public function getByStatus(TermStatus $status): Collection
    {
        return $this->model->where('status', $status)->get();
    }

    public function getByAcademicYear(int $academicYearId): Collection
    {
        return $this->model->byAcademicYear($academicYearId)->get();
    }

    public function getCurrent(): ?Term
    {
        return $this->model->current()->first();
    }

    public function findByName(string $name): ?Term
    {
        return $this->model->where('name', $name)->first();
    }

    public function getWithAcademicYear(): Collection
    {
        return $this->model->with('academicYear')->get();
    }

    public function findWithAcademicYear(int $id): ?Term
    {
        return $this->model->with('academicYear')->find($id);
    }

    public function getOrderedByStartDate(): Collection
    {
        return $this->model->orderBy('start_date')->get();
    }

    public function getByDateRange(\DateTime $startDate, \DateTime $endDate): Collection
    {
        return $this->model
            ->where('start_date', '<=', $endDate)
            ->where('end_date', '>=', $startDate)
            ->with('academicYear')
            ->get();
    }

    public function getTermsInYear(int $academicYearId): Collection
    {
        return $this->model
            ->byAcademicYear($academicYearId)
            ->orderBy('start_date')
            ->get();
    }

    public function getNextTerm(int $currentTermId): ?Term
    {
        $currentTerm = $this->findOrFail($currentTermId);

        return $this->model
            ->where('academic_year_id', $currentTerm->academic_year_id)
            ->where('start_date', '>', $currentTerm->start_date)
            ->orderBy('start_date')
            ->first();
    }

    public function getPreviousTerm(int $currentTermId): ?Term
    {
        $currentTerm = $this->findOrFail($currentTermId);

        return $this->model
            ->where('academic_year_id', $currentTerm->academic_year_id)
            ->where('start_date', '<', $currentTerm->start_date)
            ->orderBy('start_date', 'desc')
            ->first();
    }

    public function getTermsByAcademicYearName(string $academicYearName): Collection
    {
        return $this->model
            ->whereHas('academicYear', function ($query) use ($academicYearName) {
                $query->where('name', $academicYearName);
            })
            ->with('academicYear')
            ->orderBy('start_date')
            ->get();
    }

    public function searchByName(string $search): Collection
    {
        return $this->model
            ->where('name', 'like', "%{$search}%")
            ->with('academicYear')
            ->orderBy('start_date')
            ->get();
    }

    public function getOverlappingTerms(int $academicYearId, \DateTime $startDate, \DateTime $endDate, ?int $excludeTermId = null): Collection
    {
        $query = $this->model
            ->where('academic_year_id', $academicYearId)
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('start_date', [$startDate, $endDate])
                      ->orWhereBetween('end_date', [$startDate, $endDate])
                      ->orWhere(function ($query) use ($startDate, $endDate) {
                          $query->where('start_date', '<=', $startDate)
                                ->where('end_date', '>=', $endDate);
                      });
            });

        if ($excludeTermId) {
            $query->where('id', '!=', $excludeTermId);
        }

        return $query->get();
    }

    public function getStatistics(): array
    {
        return [
            'total_terms' => $this->model->count(),
            'active_terms' => $this->model->where('status', TermStatus::ACTIVE->value)->count(),
            'upcoming_terms' => $this->model->where('status', TermStatus::UPCOMING->value)->count(),
            'completed_terms' => $this->model->where('status', TermStatus::COMPLETED->value)->count(),
            'current_academic_year_terms' => $this->model->whereHas('academicYear', function ($query) {
                $query->current();
            })->count(),
        ];
    }

    public function canBeDeleted(int $id): bool
    {
        $term = $this->findOrFail($id);
        // Check if term has any associated bills or other dependencies
        return $term->status !== TermStatus::ACTIVE &&
               $term->status !== TermStatus::COMPLETED;
    }

    public function getTermDuration(int $termId): int
    {
        $term = $this->findOrFail($termId);
        return $term->start_date->diffInDays($term->end_date) + 1;
    }

    public function getTermsWithDuration(): Collection
    {
        return $this->model
            ->with('academicYear')
            ->get()
            ->map(function ($term) {
                $term->duration_days = $term->start_date->diffInDays($term->end_date) + 1;
                return $term;
            });
    }

    public function getActiveTermsWithProgress(): Collection
    {
        return $this->model
            ->active()
            ->with('academicYear')
            ->get()
            ->map(function ($term) {
                $totalDays = $term->start_date->diffInDays($term->end_date) + 1;
                $daysPassed = $term->start_date->diffInDays(now()) + 1;
                $daysRemaining = $term->end_date->diffInDays(now());

                $term->progress = [
                    'total_days' => $totalDays,
                    'days_passed' => max(0, min($daysPassed, $totalDays)),
                    'days_remaining' => max(0, $daysRemaining),
                    'percentage_complete' => $totalDays > 0 ? round((min($daysPassed, $totalDays) / $totalDays) * 100, 2) : 0,
                ];

                return $term;
            });
    }

    public function getTermsByStatus(TermStatus $status): Collection
    {
        return $this->model
            ->where('status', $status->value)
            ->with('academicYear')
            ->orderBy('start_date')
            ->get();
    }

    public function bulkUpdateStatus(array $termIds, TermStatus $status): int
    {
        return $this->model
            ->whereIn('id', $termIds)
            ->update(['status' => $status->value]);
    }

    public function getTermCalendar(int $academicYearId): array
    {
        return $this->model
            ->byAcademicYear($academicYearId)
            ->orderBy('start_date')
            ->get()
            ->map(function ($term) {
                return [
                    'id' => $term->id,
                    'name' => $term->name,
                    'start_date' => $term->start_date->format('Y-m-d'),
                    'end_date' => $term->end_date->format('Y-m-d'),
                    'status' => $term->status->value,
                    'status_label' => $term->status->label(),
                    'duration_days' => $term->start_date->diffInDays($term->end_date) + 1,
                ];
            })
            ->toArray();
    }
}
