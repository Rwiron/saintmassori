<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\AcademicYearStatus;
use App\Models\AcademicYear;
use Illuminate\Database\Eloquent\Collection;

class AcademicYearRepository extends BaseRepository
{
    public function __construct(AcademicYear $model)
    {
        parent::__construct($model);
    }

    public function getActive(): Collection
    {
        return $this->model->active()->get();
    }

    public function getClosed(): Collection
    {
        return $this->model->closed()->get();
    }

    public function getCurrent(): ?AcademicYear
    {
        return $this->model->current()->first();
    }

    public function findByName(string $name): ?AcademicYear
    {
        return $this->model->where('name', $name)->first();
    }

    public function getByStatus(AcademicYearStatus $status): Collection
    {
        return $this->model->where('status', $status)->get();
    }

    public function getWithTerms(): Collection
    {
        return $this->model->with('terms')->get();
    }

    public function findWithTerms(int $id): ?AcademicYear
    {
        return $this->model->with('terms')->find($id);
    }

    public function getYearsByDateRange(\DateTime $startDate, \DateTime $endDate): Collection
    {
        return $this->model
            ->where('start_date', '<=', $endDate)
            ->where('end_date', '>=', $startDate)
            ->get();
    }

    public function getActiveWithTermsCount(): Collection
    {
        return $this->model
            ->active()
            ->withCount('terms')
            ->get();
    }

    public function canBeDeleted(int $id): bool
    {
        $academicYear = $this->findOrFail($id);
        return $academicYear->terms()->count() === 0 &&
               $academicYear->bills()->count() === 0;
    }

    public function getOrderedByStartDate(): Collection
    {
        return $this->model->orderBy('start_date', 'desc')->get();
    }

    public function searchByName(string $search): Collection
    {
        return $this->model
            ->where('name', 'like', "%{$search}%")
            ->orderBy('start_date', 'desc')
            ->get();
    }
}
