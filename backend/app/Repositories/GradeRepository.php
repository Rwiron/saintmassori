<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Grade;
use Illuminate\Database\Eloquent\Collection;

class GradeRepository extends BaseRepository
{
    public function __construct(Grade $model)
    {
        parent::__construct($model);
    }

    public function getOrderedByLevel(): Collection
    {
        return $this->model->orderBy('level')->get();
    }

    public function findByLevel(int $level): ?Grade
    {
        return $this->model->where('level', $level)->first();
    }

    public function findByName(string $name): ?Grade
    {
        return $this->model->where('name', $name)->first();
    }

    public function getWithClasses(): Collection
    {
        return $this->model->with('classes')->orderBy('level')->get();
    }

    public function findWithClasses(int $id): ?Grade
    {
        return $this->model->with('classes')->find($id);
    }

    public function getWithClassesAndStudents(): Collection
    {
        return $this->model
            ->with(['classes.students' => function ($query) {
                $query->active();
            }])
            ->orderBy('level')
            ->get();
    }

    public function getWithStudentCount(): Collection
    {
        return $this->model
            ->withCount(['students' => function ($query) {
                $query->active();
            }])
            ->orderBy('level')
            ->get();
    }

    public function getByLevelRange(int $minLevel, int $maxLevel): Collection
    {
        return $this->model
            ->whereBetween('level', [$minLevel, $maxLevel])
            ->orderBy('level')
            ->get();
    }

    public function getNextGrade(int $currentLevel): ?Grade
    {
        return $this->model
            ->where('level', '>', $currentLevel)
            ->orderBy('level')
            ->first();
    }

    public function getPreviousGrade(int $currentLevel): ?Grade
    {
        return $this->model
            ->where('level', '<', $currentLevel)
            ->orderBy('level', 'desc')
            ->first();
    }

    public function getPromotionPath(int $fromLevel, int $toLevel): Collection
    {
        return $this->model
            ->whereBetween('level', [$fromLevel, $toLevel])
            ->orderBy('level')
            ->get();
    }

    public function getStatistics(): array
    {
        return [
            'total_grades' => $this->model->count(),
            'total_classes' => $this->model->withCount('classes')->get()->sum('classes_count'),
            'total_students' => $this->model->withCount(['students' => function ($query) {
                $query->active();
            }])->get()->sum('students_count'),
            'min_level' => $this->model->min('level'),
            'max_level' => $this->model->max('level'),
        ];
    }

    public function canBeDeleted(int $id): bool
    {
        $grade = $this->findOrFail($id);
        return $grade->classes()->count() === 0 && $grade->students()->count() === 0;
    }

    public function getGradeDistribution(): array
    {
        return $this->model
            ->withCount(['students' => function ($query) {
                $query->active();
            }])
            ->orderBy('level')
            ->get()
            ->map(function ($grade) {
                return [
                    'id' => $grade->id,
                    'name' => $grade->name,
                    'level' => $grade->level,
                    'student_count' => $grade->students_count,
                ];
            })
            ->toArray();
    }

    public function getClassDistribution(): array
    {
        return $this->model
            ->withCount('classes')
            ->orderBy('level')
            ->get()
            ->map(function ($grade) {
                return [
                    'id' => $grade->id,
                    'name' => $grade->name,
                    'level' => $grade->level,
                    'class_count' => $grade->classes_count,
                ];
            })
            ->toArray();
    }

    public function searchByName(string $search): Collection
    {
        return $this->model
            ->where('name', 'like', "%{$search}%")
            ->orderBy('level')
            ->get();
    }

    public function getEnrollmentCapacity(): array
    {
        return $this->model
            ->with('classes')
            ->orderBy('level')
            ->get()
            ->map(function ($grade) {
                $totalCapacity = $grade->classes->sum('capacity');
                $currentEnrollment = $grade->classes->sum('current_enrollment');

                return [
                    'id' => $grade->id,
                    'name' => $grade->name,
                    'level' => $grade->level,
                    'total_capacity' => $totalCapacity,
                    'current_enrollment' => $currentEnrollment,
                    'available_spots' => $totalCapacity - $currentEnrollment,
                    'utilization_rate' => $totalCapacity > 0 ? round(($currentEnrollment / $totalCapacity) * 100, 2) : 0,
                ];
            })
            ->toArray();
    }

    public function getPromotionCandidates(int $gradeId): Collection
    {
        $grade = $this->findOrFail($gradeId);
        return $grade->students()->active()->get();
    }

    public function getGradeProgression(): array
    {
        return $this->model
            ->orderBy('level')
            ->get()
            ->map(function ($grade, $index, $collection) {
                $nextGrade = $collection->where('level', '>', $grade->level)->first();

                return [
                    'current_grade' => [
                        'id' => $grade->id,
                        'name' => $grade->name,
                        'level' => $grade->level,
                    ],
                    'next_grade' => $nextGrade ? [
                        'id' => $nextGrade->id,
                        'name' => $nextGrade->name,
                        'level' => $nextGrade->level,
                    ] : null,
                    'is_final_grade' => $nextGrade === null,
                ];
            })
            ->toArray();
    }

    public function getActive(): Collection
    {
        return $this->model->active()->orderBy('level')->get();
    }

    public function getAllOrderedByLevel(): Collection
    {
        return $this->model->orderBy('level')->get();
    }

    public function getByLevel(int $level): ?Grade
    {
        return $this->model->where('level', $level)->first();
    }

    public function findWithRelations(int $id): ?Grade
    {
        return $this->model
            ->with(['classes.students', 'classes.tariffs'])
            ->find($id);
    }

    public function countByGrade(int $gradeId): int
    {
        return $this->model->where('id', $gradeId)->count();
    }

    public function getMaxLevel(): ?int
    {
        return $this->model->max('level');
    }
}
