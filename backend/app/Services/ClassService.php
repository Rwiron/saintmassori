<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ClassModel;
use App\Models\Grade;
use App\Models\Tariff;
use App\Repositories\ClassRepository;
use App\Repositories\GradeRepository;
use App\Repositories\TariffRepository;
use App\Repositories\StudentRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ClassService
{
    public function __construct(
        private readonly ClassRepository $classRepository,
        private readonly GradeRepository $gradeRepository,
        private readonly TariffRepository $tariffRepository,
        private readonly StudentRepository $studentRepository
    ) {}

    public function createClass(array $data): ClassModel
    {
        DB::beginTransaction();

        try {
            // Validate grade exists
            $grade = $this->gradeRepository->findOrFail($data['grade_id']);

            // Check for duplicate class name within grade
            $existingClass = $this->classRepository->findByGradeAndName($data['grade_id'], $data['name']);
            if ($existingClass) {
                throw new \InvalidArgumentException('Class with this name already exists in the grade');
            }

            // Create class
            $class = $this->classRepository->create([
                'name' => $data['name'],
                'grade_id' => $data['grade_id'],
                'full_name' => $grade->name . $data['name'], // e.g., "P1A"
                'capacity' => $data['capacity'],
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'current_enrollment' => 0,
            ]);

            // Assign tariffs if provided
            if (isset($data['tariff_ids']) && is_array($data['tariff_ids'])) {
                $this->assignTariffsToClass($class->id, $data['tariff_ids']);
            }

            Log::info('Class created', [
                'class_id' => $class->id,
                'name' => $class->name,
                'grade' => $grade->name
            ]);

            DB::commit();
            return $class->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create class', ['error' => $e->getMessage(), 'data' => $data]);
            throw $e;
        }
    }

    public function updateClass(int $id, array $data): ClassModel
    {
        DB::beginTransaction();

        try {
            $class = $this->classRepository->findOrFail($id);

            // Check for duplicate class name if name is being updated
            if (isset($data['name']) && $data['name'] !== $class->name) {
                $gradeId = $data['grade_id'] ?? $class->grade_id;
                $existingClass = $this->classRepository->findByGradeAndName($gradeId, $data['name']);
                if ($existingClass && $existingClass->id !== $id) {
                    throw new \InvalidArgumentException('Class with this name already exists in the grade');
                }
            }

            // Validate capacity if being updated
            if (isset($data['capacity']) && $data['capacity'] < $class->current_enrollment) {
                throw new \InvalidArgumentException('Capacity cannot be less than current enrollment count');
            }

            $class = $this->classRepository->update($id, $data);

            Log::info('Class updated', ['class_id' => $id, 'changes' => $data]);

            DB::commit();
            return $class;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update class', ['error' => $e->getMessage(), 'id' => $id, 'data' => $data]);
            throw $e;
        }
    }

    public function deleteClass(int $id): bool
    {
        DB::beginTransaction();

        try {
            $class = $this->classRepository->findOrFail($id);

            // Check if class can be deleted
            if (!$this->canBeDeleted($id)) {
                throw new \InvalidArgumentException('Class cannot be deleted. It has enrolled students.');
            }

            // Remove all tariff assignments
            $this->removeAllTariffsFromClass($id);

            $result = $this->classRepository->delete($id);

            Log::info('Class deleted', ['class_id' => $id, 'name' => $class->name]);

            DB::commit();
            return $result;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete class', ['error' => $e->getMessage(), 'id' => $id]);
            throw $e;
        }
    }

    public function assignTariffsToClass(int $classId, array $tariffIds): ClassModel
    {
        DB::beginTransaction();

        try {
            $class = $this->classRepository->findOrFail($classId);

            // Validate all tariffs exist
            foreach ($tariffIds as $tariffId) {
                $this->tariffRepository->findOrFail($tariffId);
            }

            // Assign tariffs
            $this->classRepository->syncTariffs($classId, $tariffIds);

            Log::info('Tariffs assigned to class', [
                'class_id' => $classId,
                'tariff_ids' => $tariffIds
            ]);

            DB::commit();
            return $class->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to assign tariffs to class', [
                'error' => $e->getMessage(),
                'class_id' => $classId,
                'tariff_ids' => $tariffIds
            ]);
            throw $e;
        }
    }

    public function removeTariffFromClass(int $classId, int $tariffId): ClassModel
    {
        DB::beginTransaction();

        try {
            $class = $this->classRepository->findOrFail($classId);

            $this->classRepository->detachTariff($classId, $tariffId);

            Log::info('Tariff removed from class', [
                'class_id' => $classId,
                'tariff_id' => $tariffId
            ]);

            DB::commit();
            return $class->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to remove tariff from class', [
                'error' => $e->getMessage(),
                'class_id' => $classId,
                'tariff_id' => $tariffId
            ]);
            throw $e;
        }
    }

    public function removeAllTariffsFromClass(int $classId): ClassModel
    {
        DB::beginTransaction();

        try {
            $class = $this->classRepository->findOrFail($classId);

            $this->classRepository->syncTariffs($classId, []);

            Log::info('All tariffs removed from class', ['class_id' => $classId]);

            DB::commit();
            return $class->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to remove all tariffs from class', [
                'error' => $e->getMessage(),
                'class_id' => $classId
            ]);
            throw $e;
        }
    }

    public function activateClass(int $id): ClassModel
    {
        return $this->updateClass($id, ['is_active' => true]);
    }

    public function deactivateClass(int $id): ClassModel
    {
        return $this->updateClass($id, ['is_active' => false]);
    }

    public function getClassWithDetails(int $id): ?ClassModel
    {
        return $this->classRepository->findWithRelations($id);
    }

    public function getClassesByGrade(int $gradeId): Collection
    {
        return $this->classRepository->getByGrade($gradeId);
    }

    public function getActiveClasses(): Collection
    {
        return $this->classRepository->getWithGrade()->where('is_active', true);
    }

    public function getActiveClassesWithTariffCounts(): Collection
    {
        return $this->classRepository->getWithGradeAndTariffCounts()->where('is_active', true);
    }

    public function getClassesWithAvailableSpots(): Collection
    {
        return $this->classRepository->getAvailableForEnrollment();
    }

    public function getClassStatistics(int $id): array
    {
        $class = $this->classRepository->findOrFail($id);
        $students = $this->studentRepository->getByClass($id);
        $tariffs = $this->classRepository->getClassTariffs($id);

        return [
            'class' => $class,
            'total_students' => $students->count(),
            'available_spots' => $class->available_spots,
            'capacity_utilization' => $class->capacity > 0 ? ($class->current_enrollment / $class->capacity) * 100 : 0,
            'total_tariffs' => $tariffs->count(),
            'total_tariff_amount' => $tariffs->sum('amount'),
            'active_students' => $students->where('status', 'active')->count(),
            'inactive_students' => $students->where('status', 'inactive')->count(),
        ];
    }

    public function getGradeStatistics(int $gradeId): array
    {
        $grade = $this->gradeRepository->findOrFail($gradeId);
        $classes = $this->classRepository->getByGrade($gradeId);
        $students = $this->studentRepository->getByGrade($gradeId);

        return [
            'grade' => $grade,
            'total_classes' => $classes->count(),
            'active_classes' => $classes->where('is_active', true)->count(),
            'total_students' => $students->count(),
            'total_capacity' => $classes->sum('capacity'),
                        'total_enrollment' => $classes->sum('current_enrollment'),
            'average_class_size' => $classes->count() > 0 ? $classes->avg('current_enrollment') : 0,
            'capacity_utilization' => $classes->sum('capacity') > 0 ?
                ($classes->sum('current_enrollment') / $classes->sum('capacity')) * 100 : 0,
        ];
    }

    public function searchClasses(string $search): Collection
    {
        return $this->classRepository->searchByName($search);
    }

    public function canBeDeleted(int $id): bool
    {
        return $this->classRepository->canBeDeleted($id);
    }

    public function bulkUpdateClassCapacity(array $classCapacities): array
    {
        $results = [];
        $errors = [];

        foreach ($classCapacities as $classId => $capacity) {
            try {
                $results[] = $this->updateClass($classId, ['capacity' => $capacity]);
            } catch (\Exception $e) {
                $errors[] = [
                    'class_id' => $classId,
                    'error' => $e->getMessage()
                ];
            }
        }

        return [
            'updated' => $results,
            'errors' => $errors,
            'total_processed' => count($classCapacities),
            'successful' => count($results),
            'failed' => count($errors)
        ];
    }

    public function getClassesNearingCapacity(int $threshold = 90): Collection
    {
        return $this->classRepository->all()
            ->filter(function ($class) use ($threshold) {
                if ($class->capacity <= 0) return false;
                $utilization = ($class->current_enrollment / $class->capacity) * 100;
                return $utilization >= $threshold;
            });
    }

    public function getUnderUtilizedClasses(int $threshold = 50): Collection
    {
        return $this->classRepository->all()
            ->filter(function ($class) use ($threshold) {
                if ($class->capacity <= 0) return false;
                $utilization = ($class->current_enrollment / $class->capacity) * 100;
                return $utilization < $threshold;
            });
    }
}
