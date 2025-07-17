<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\ClassModel;
use App\Models\Grade;
use Illuminate\Database\Eloquent\Collection;

class ClassRepository extends BaseRepository
{
    public function __construct(ClassModel $model)
    {
        parent::__construct($model);
    }

    public function getByGrade(int $gradeId): Collection
    {
        return $this->model->byGrade($gradeId)->get();
    }

    public function getWithGrade(): Collection
    {
        return $this->model
            ->with(['grade'])
            ->withCount(['students', 'students as active_students_count' => function ($query) {
                $query->where('status', 'active');
            }])
            ->get();
    }

    public function getWithGradeAndTariffCounts(): Collection
    {
        return $this->model
            ->with('grade')
            ->withCount([
                'students',
                'students as active_students_count' => function ($query) {
                    $query->where('status', 'active');
                },
                'tariffs',
                'tariffs as active_tariffs_count' => function ($query) {
                    $query->where('tariffs.is_active', true);
                }
            ])
            ->withSum('tariffs', 'amount')
            ->get();
    }

    public function findWithRelations(int $id): ?ClassModel
    {
        return $this->model
            ->with(['grade', 'students', 'tariffs'])
            ->find($id);
    }

    public function getWithStudentCount(): Collection
    {
        return $this->model
            ->withCount('students')
            ->with('grade')
            ->get();
    }

    public function getAvailableForEnrollment(): Collection
    {
        return $this->model
            ->whereColumn('current_enrollment', '<', 'capacity')
            ->with('grade')
            ->get();
    }

    public function getFullClasses(): Collection
    {
        return $this->model
            ->whereColumn('current_enrollment', '>=', 'capacity')
            ->with('grade')
            ->get();
    }

    public function findByName(string $name): ?ClassModel
    {
        return $this->model->where('name', $name)->first();
    }

    public function searchByName(string $search): Collection
    {
        return $this->model
            ->where('name', 'like', "%{$search}%")
            ->with('grade')
            ->get();
    }

    public function getByGradeWithStudents(int $gradeId): Collection
    {
        return $this->model
            ->byGrade($gradeId)
            ->with(['students' => function ($query) {
                $query->active()->orderBy('first_name')->orderBy('last_name');
            }])
            ->get();
    }

    public function getClassesWithTariffs(): Collection
    {
        return $this->model
            ->with(['tariffs', 'grade'])
            ->get();
    }

    public function getClassTariffs(int $classId): Collection
    {
        $class = $this->findOrFail($classId);
        return $class->tariffs;
    }

    public function attachTariff(int $classId, int $tariffId): void
    {
        $class = $this->findOrFail($classId);
        $class->tariffs()->attach($tariffId);
    }

    public function detachTariff(int $classId, int $tariffId): void
    {
        $class = $this->findOrFail($classId);
        $class->tariffs()->detach($tariffId);
    }

    public function syncTariffs(int $classId, array $tariffIds): void
    {
        $class = $this->findOrFail($classId);
        $class->tariffs()->sync($tariffIds);
    }

    public function getEnrollmentCapacity(int $classId): array
    {
        $class = $this->findOrFail($classId);
        return [
            'capacity' => $class->capacity,
            'current_enrollment' => $class->current_enrollment,
            'available_spots' => $class->capacity - $class->current_enrollment
        ];
    }

    public function canEnrollStudent(int $classId): bool
    {
        $class = $this->findOrFail($classId);
        return $class->current_enrollment < $class->capacity;
    }

    public function incrementEnrollment(int $classId): void
    {
        $this->model
            ->where('id', $classId)
            ->increment('current_enrollment');
    }

    public function decrementEnrollment(int $classId): void
    {
        $this->model
            ->where('id', $classId)
            ->where('current_enrollment', '>', 0)
            ->decrement('current_enrollment');
    }

    public function updateEnrollmentCount(int $classId): void
    {
        $class = $this->findOrFail($classId);
        $actualCount = $class->students()->active()->count();
        $class->update(['current_enrollment' => $actualCount]);
    }

    public function getOrderedByGradeAndName(): Collection
    {
        return $this->model
            ->with('grade')
            ->join('grades', 'classes.grade_id', '=', 'grades.id')
            ->orderBy('grades.level')
            ->orderBy('classes.name')
            ->select('classes.*')
            ->get();
    }

    public function canBeDeleted(int $id): bool
    {
        $class = $this->findOrFail($id);
        return $class->students()->count() === 0;
    }

    public function getStatistics(): array
    {
        return [
            'total_classes' => $this->model->count(),
            'total_capacity' => $this->model->sum('capacity'),
            'total_enrollment' => $this->model->sum('current_enrollment'),
            'available_spots' => $this->model->selectRaw('SUM(capacity - current_enrollment) as available')->first()->available,
            'full_classes' => $this->model->whereColumn('current_enrollment', '>=', 'capacity')->count(),
            'empty_classes' => $this->model->where('current_enrollment', 0)->count(),
        ];
    }

    public function deactivateByGrade(int $gradeId): void
    {
        $this->model->where('grade_id', $gradeId)->update(['is_active' => false]);
    }

    public function findByGradeAndName(int $gradeId, string $name): ?ClassModel
    {
        return $this->model
            ->where('grade_id', $gradeId)
            ->where('name', $name)
            ->first();
    }

    public function findByNameAndGrade(string $name, int $gradeId): ?ClassModel
    {
        return $this->model
            ->where('name', $name)
            ->where('grade_id', $gradeId)
            ->first();
    }

    public function countByGrade(int $gradeId): int
    {
        return $this->model->where('grade_id', $gradeId)->count();
    }
}
