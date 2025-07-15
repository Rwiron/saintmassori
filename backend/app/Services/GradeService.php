<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Grade;
use App\Models\ClassModel;
use App\Repositories\GradeRepository;
use App\Repositories\ClassRepository;
use App\Repositories\StudentRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GradeService
{
    public function __construct(
        private readonly GradeRepository $gradeRepository,
        private readonly ClassRepository $classRepository,
        private readonly StudentRepository $studentRepository
    ) {}

    public function createGrade(array $data): Grade
    {
        DB::beginTransaction();

        try {
            // Validate grade data
            $this->validateGradeData($data);

            // Auto-assign level if not provided or if level already exists
            if (!isset($data['level']) || $this->gradeRepository->getByLevel($data['level'])) {
                $data['level'] = $this->getNextAvailableLevel();
            }

            // Check for duplicate name
            $this->checkForDuplicateName($data['name']);

            // Create grade
            $grade = $this->gradeRepository->create([
                'name' => $data['name'],
                'display_name' => $data['display_name'],
                'level' => $data['level'],
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Create default classes if requested
            if (isset($data['create_default_classes']) && $data['create_default_classes']) {
                $this->createDefaultClasses($grade, $data['default_class_names'] ?? ['A', 'B']);
            }

            Log::info('Grade created', [
                'grade_id' => $grade->id,
                'name' => $grade->name,
                'level' => $grade->level
            ]);

            DB::commit();
            return $grade->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create grade', ['error' => $e->getMessage(), 'data' => $data]);
            throw $e;
        }
    }

    public function updateGrade(int $id, array $data): Grade
    {
        DB::beginTransaction();

        try {
            $grade = $this->gradeRepository->findOrFail($id);

            // Validate grade data
            $this->validateGradeData($data, $id);

            // Check for duplicate name or level if being updated
            if (isset($data['name']) && $data['name'] !== $grade->name) {
                $this->checkForDuplicates($data['name'], $data['level'] ?? $grade->level, $id);
            }

            if (isset($data['level']) && $data['level'] !== $grade->level) {
                $this->checkForDuplicates($data['name'] ?? $grade->name, $data['level'], $id);
            }

            $grade = $this->gradeRepository->update($id, $data);

            Log::info('Grade updated', ['grade_id' => $id, 'changes' => $data]);

            DB::commit();
            return $grade;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update grade', ['error' => $e->getMessage(), 'id' => $id, 'data' => $data]);
            throw $e;
        }
    }

    public function deleteGrade(int $id): bool
    {
        DB::beginTransaction();

        try {
            $grade = $this->gradeRepository->findOrFail($id);

            // Check if grade can be deleted
            if (!$this->canBeDeleted($id)) {
                throw new \InvalidArgumentException('Grade cannot be deleted. It has associated classes or students.');
            }

            $result = $this->gradeRepository->delete($id);

            Log::info('Grade deleted', ['grade_id' => $id, 'name' => $grade->name]);

            DB::commit();
            return $result;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete grade', ['error' => $e->getMessage(), 'id' => $id]);
            throw $e;
        }
    }

    public function activateGrade(int $id): Grade
    {
        return $this->updateGrade($id, ['is_active' => true]);
    }

    public function deactivateGrade(int $id): Grade
    {
        DB::beginTransaction();

        try {
            $grade = $this->gradeRepository->findOrFail($id);

            // Check if grade can be deactivated
            if (!$this->canBeDeactivated($id)) {
                throw new \InvalidArgumentException('Grade cannot be deactivated. It has active students.');
            }

            // Deactivate all classes in this grade
            $this->classRepository->deactivateByGrade($id);

            $grade = $this->updateGrade($id, ['is_active' => false]);

            Log::info('Grade deactivated with all classes', ['grade_id' => $id]);

            DB::commit();
            return $grade;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to deactivate grade', ['error' => $e->getMessage(), 'id' => $id]);
            throw $e;
        }
    }

    public function createClassForGrade(int $gradeId, array $classData): ClassModel
    {
        DB::beginTransaction();

        try {
            $grade = $this->gradeRepository->findOrFail($gradeId);

            if (!$grade->is_active) {
                throw new \InvalidArgumentException('Cannot create classes for inactive grade');
            }

            // Generate full name
            $fullName = $grade->name . $classData['name'];

            // Check for duplicate class name in grade
            $existingClass = $this->classRepository->findByGradeAndName($gradeId, $classData['name']);
            if ($existingClass) {
                throw new \InvalidArgumentException('Class with this name already exists in the grade');
            }

            $class = $this->classRepository->create([
                'grade_id' => $gradeId,
                'name' => $classData['name'],
                'full_name' => $fullName,
                'capacity' => $classData['capacity'] ?? 30,
                'description' => $classData['description'] ?? null,
                'is_active' => $classData['is_active'] ?? true,
                'current_enrollment' => 0,
            ]);

            Log::info('Class created for grade', [
                'grade_id' => $gradeId,
                'class_id' => $class->id,
                'full_name' => $fullName
            ]);

            DB::commit();
            return $class;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create class for grade', [
                'error' => $e->getMessage(),
                'grade_id' => $gradeId,
                'class_data' => $classData
            ]);
            throw $e;
        }
    }

    public function bulkCreateClasses(int $gradeId, array $classesData): array
    {
        $results = [];
        $errors = [];

        foreach ($classesData as $classData) {
            try {
                $results[] = $this->createClassForGrade($gradeId, $classData);
            } catch (\Exception $e) {
                $errors[] = [
                    'class_name' => $classData['name'] ?? 'Unknown',
                    'error' => $e->getMessage()
                ];
            }
        }

        return [
            'created' => $results,
            'errors' => $errors,
            'total_processed' => count($classesData),
            'successful' => count($results),
            'failed' => count($errors)
        ];
    }

    public function getGradeWithDetails(int $id): ?Grade
    {
        return $this->gradeRepository->findWithRelations($id);
    }

    public function getActiveGrades(): Collection
    {
        return $this->gradeRepository->getActive();
    }

    public function getAllGradesOrderedByLevel(): Collection
    {
        return $this->gradeRepository->getAllOrderedByLevel();
    }

    public function getGradeStatistics(int $id): array
    {
        $grade = $this->gradeRepository->findOrFail($id);
        $classes = $this->classRepository->getByGrade($id);
        $students = $this->studentRepository->getByGrade($id);

        return [
            'grade' => $grade,
            'total_classes' => $classes->count(),
            'active_classes' => $classes->where('is_active', true)->count(),
            'total_students' => $students->count(),
            'active_students' => $students->where('status', 'active')->count(),
            'total_capacity' => $classes->sum('capacity'),
            'total_enrollment' => $classes->sum('current_enrollment'),
            'average_class_size' => $classes->count() > 0 ? round($classes->avg('current_enrollment'), 2) : 0,
            'capacity_utilization' => $classes->sum('capacity') > 0 ?
                round(($classes->sum('current_enrollment') / $classes->sum('capacity')) * 100, 2) : 0,
            'classes_with_available_spots' => $classes->filter(fn($class) => $class->current_enrollment < $class->capacity)->count(),
            'full_classes' => $classes->filter(fn($class) => $class->current_enrollment >= $class->capacity)->count(),
        ];
    }

    public function getAllGradesStatistics(): array
    {
        $grades = $this->gradeRepository->getActive();
        $statistics = [];

        foreach ($grades as $grade) {
            $statistics[] = $this->getGradeStatistics($grade->id);
        }

        return [
            'grades' => $statistics,
            'summary' => [
                'total_grades' => $grades->count(),
                'total_classes' => $grades->sum(fn($grade) => $grade->classes->count()),
                'total_students' => $grades->sum(fn($grade) => $grade->student_count),
                'total_capacity' => $grades->sum(fn($grade) => $grade->classes->sum('capacity')),
                'overall_utilization' => $grades->sum(fn($grade) => $grade->classes->sum('capacity')) > 0 ?
                    round(($grades->sum(fn($grade) => $grade->classes->sum('current_enrollment')) /
                           $grades->sum(fn($grade) => $grade->classes->sum('capacity'))) * 100, 2) : 0,
            ]
        ];
    }

    public function searchGrades(string $search): Collection
    {
        return $this->gradeRepository->searchByName($search);
    }

    public function getNextGrade(int $currentGradeId): ?Grade
    {
        $currentGrade = $this->gradeRepository->findOrFail($currentGradeId);
        return $this->gradeRepository->getByLevel($currentGrade->level + 1);
    }

    public function getPreviousGrade(int $currentGradeId): ?Grade
    {
        $currentGrade = $this->gradeRepository->findOrFail($currentGradeId);
        return $this->gradeRepository->getByLevel($currentGrade->level - 1);
    }

    public function canBeDeleted(int $id): bool
    {
        $hasClasses = $this->classRepository->countByGrade($id) > 0;
        $hasStudents = $this->studentRepository->countByGrade($id) > 0;

        return !$hasClasses && !$hasStudents;
    }

    public function canBeDeactivated(int $id): bool
    {
        $activeStudents = $this->studentRepository->getByGrade($id)
            ->where('status', 'active')
            ->count();

        return $activeStudents === 0;
    }

    private function validateGradeData(array $data, ?int $excludeId = null): void
    {
        if (empty($data['name'])) {
            throw new \InvalidArgumentException('Grade name is required');
        }

        if (empty($data['display_name'])) {
            throw new \InvalidArgumentException('Grade display name is required');
        }

        if (isset($data['level']) && (!is_numeric($data['level']) || $data['level'] < 1)) {
            throw new \InvalidArgumentException('Grade level must be a positive integer');
        }

        // Validate grade name format (should be like N1, P1, P2, etc.)
        if (!preg_match('/^[NP]\d+$/', $data['name'])) {
            throw new \InvalidArgumentException('Grade name must follow format N1, P1, P2, etc.');
        }
    }

    private function checkForDuplicates(string $name, int $level, ?int $excludeId = null): void
    {
        $existingByName = $this->gradeRepository->findByName($name);
        if ($existingByName && $existingByName->id !== $excludeId) {
            throw new \InvalidArgumentException('Grade with this name already exists');
        }

        $existingByLevel = $this->gradeRepository->getByLevel($level);
        if ($existingByLevel && $existingByLevel->id !== $excludeId) {
            throw new \InvalidArgumentException('Grade with this level already exists');
        }
    }

    private function checkForDuplicateName(string $name, ?int $excludeId = null): void
    {
        $existingByName = $this->gradeRepository->findByName($name);
        if ($existingByName && $existingByName->id !== $excludeId) {
            throw new \InvalidArgumentException('Grade with this name already exists');
        }
    }

    private function getNextAvailableLevel(): int
    {
        $maxLevel = $this->gradeRepository->getMaxLevel();
        return $maxLevel ? $maxLevel + 1 : 1;
    }

    private function createDefaultClasses(Grade $grade, array $classNames): void
    {
        foreach ($classNames as $className) {
            $this->createClassForGrade($grade->id, [
                'name' => $className,
                'capacity' => 30,
                'description' => "Default class {$className} for {$grade->display_name}",
                'is_active' => true,
            ]);
        }
    }

    // Helper methods for bulk operations
    public function bulkActivateGrades(array $gradeIds): array
    {
        $results = [];
        $errors = [];

        foreach ($gradeIds as $gradeId) {
            try {
                $results[] = $this->activateGrade($gradeId);
            } catch (\Exception $e) {
                $errors[] = [
                    'grade_id' => $gradeId,
                    'error' => $e->getMessage()
                ];
            }
        }

        return [
            'activated' => $results,
            'errors' => $errors,
            'total_processed' => count($gradeIds),
            'successful' => count($results),
            'failed' => count($errors)
        ];
    }

    public function bulkDeactivateGrades(array $gradeIds): array
    {
        $results = [];
        $errors = [];

        foreach ($gradeIds as $gradeId) {
            try {
                $results[] = $this->deactivateGrade($gradeId);
            } catch (\Exception $e) {
                $errors[] = [
                    'grade_id' => $gradeId,
                    'error' => $e->getMessage()
                ];
            }
        }

        return [
            'deactivated' => $results,
            'errors' => $errors,
            'total_processed' => count($gradeIds),
            'successful' => count($results),
            'failed' => count($errors)
        ];
    }
}
