<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\StudentStatus;
use App\Models\Student;
use App\Models\ClassModel;
use App\Models\Grade;
use App\Repositories\StudentRepository;
use App\Repositories\ClassRepository;
use App\Repositories\GradeRepository;
use App\Repositories\BillRepository;
use App\Services\BillingService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StudentService
{
    public function __construct(
        private readonly StudentRepository $studentRepository,
        private readonly ClassRepository $classRepository,
        private readonly GradeRepository $gradeRepository,
        private readonly BillRepository $billRepository,
        private readonly BillingService $billingService
    ) {}

    public function registerStudent(array $data): Student
    {
        DB::beginTransaction();

        try {
            // Validate student data
            $this->validateStudentData($data);

            // Check for duplicate email
            if (isset($data['email']) && $this->studentRepository->findByEmail($data['email'])) {
                throw new \InvalidArgumentException('Student with this email already exists');
            }

            // Create student
            $student = $this->studentRepository->create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'] ?? null,
                'date_of_birth' => $data['date_of_birth'],
                'gender' => $data['gender'],
                'phone' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'parent_name' => $data['parent_name'],
                'parent_email' => $data['parent_email'],
                'parent_phone' => $data['parent_phone'],
                'father_name' => $data['father_name'] ?? null,
                'mother_name' => $data['mother_name'] ?? null,
                'emergency_contact' => $data['emergency_contact'] ?? null,
                'enrollment_date' => $data['enrollment_date'] ?? now()->toDateString(),
                'status' => StudentStatus::ACTIVE,
                'medical_conditions' => $data['medical_conditions'] ?? null,
                'allergies' => $data['allergies'] ?? null,
                'disability' => $data['disability'] ?? false,
                'disability_description' => $data['disability_description'] ?? null,
                'province' => $data['province'] ?? null,
                'district' => $data['district'] ?? null,
                'sector' => $data['sector'] ?? null,
                'cell' => $data['cell'] ?? null,
                'village' => $data['village'] ?? null,
            ]);

            // Assign to class if provided
            if (isset($data['class_id'])) {
                $this->assignStudentToClass($student->id, $data['class_id']);
            }

            Log::info('Student registered', [
                'student_id' => $student->id,
                'name' => $student->full_name,
                'class_id' => $data['class_id'] ?? null
            ]);

            DB::commit();
            return $student->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to register student', ['error' => $e->getMessage(), 'data' => $data]);
            throw $e;
        }
    }

    public function updateStudent(int $id, array $data): Student
    {
        DB::beginTransaction();

        try {
            $student = $this->studentRepository->findOrFail($id);

            // Validate updated data
            $this->validateStudentData($data, $id);

            // Check for duplicate email if email is being updated
            if (isset($data['email']) && $data['email'] !== $student->email) {
                if ($this->studentRepository->findByEmail($data['email'])) {
                    throw new \InvalidArgumentException('Student with this email already exists');
                }
            }

            $student = $this->studentRepository->update($id, $data);

            Log::info('Student updated', ['student_id' => $id, 'changes' => $data]);

            DB::commit();
            return $student;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update student', ['error' => $e->getMessage(), 'id' => $id, 'data' => $data]);
            throw $e;
        }
    }

    public function assignStudentToClass(int $studentId, int $classId): Student
    {
        DB::beginTransaction();

        try {
            $student = $this->studentRepository->findOrFail($studentId);
            $class = $this->classRepository->findOrFail($classId);

            // Check if student can be assigned to class
            if (!$student->canBeAssignedToClass($class)) {
                throw new \InvalidArgumentException('Student cannot be assigned to this class');
            }

            // Remove from previous class if assigned
            if ($student->class_id) {
                $this->removeStudentFromClass($studentId);
            }

            // Assign to new class
            $student = $this->studentRepository->update($studentId, ['class_id' => $classId]);
            $this->classRepository->incrementEnrollment($classId);

            // Generate bill for the new class (if tariffs exist)
            try {
                $this->billingService->generateBillForStudent($studentId);
            } catch (\InvalidArgumentException $e) {
                // Log the warning but don't fail the student assignment
                if (str_contains($e->getMessage(), 'No tariffs found for student class')) {
                    Log::warning('Student assigned to class without tariffs', [
                        'student_id' => $studentId,
                        'class_id' => $classId,
                        'message' => 'No tariffs configured for this class. Bill generation skipped.'
                    ]);
                } else {
                    throw $e; // Re-throw other exceptions
                }
            }

            Log::info('Student assigned to class', [
                'student_id' => $studentId,
                'class_id' => $classId,
                'class_name' => $class->full_name
            ]);

            DB::commit();
            return $student->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to assign student to class', [
                'error' => $e->getMessage(),
                'student_id' => $studentId,
                'class_id' => $classId
            ]);
            throw $e;
        }
    }

    public function removeStudentFromClass(int $studentId): Student
    {
        DB::beginTransaction();

        try {
            $student = $this->studentRepository->findOrFail($studentId);

            if (!$student->has_class) {
                throw new \InvalidArgumentException('Student is not assigned to any class');
            }

            $classId = $student->class_id;

            // Remove from class
            $student = $this->studentRepository->update($studentId, ['class_id' => null]);
            $this->classRepository->decrementEnrollment($classId);

            Log::info('Student removed from class', [
                'student_id' => $studentId,
                'class_id' => $classId
            ]);

            DB::commit();
            return $student;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to remove student from class', [
                'error' => $e->getMessage(),
                'student_id' => $studentId
            ]);
            throw $e;
        }
    }

    public function transferStudent(int $studentId, int $newClassId): Student
    {
        DB::beginTransaction();

        try {
            $student = $this->studentRepository->findOrFail($studentId);
            $newClass = $this->classRepository->findOrFail($newClassId);

            if (!$newClass->canAcceptStudent()) {
                throw new \InvalidArgumentException('Target class is full');
            }

            $oldClassId = $student->class_id;

            // Transfer student
            if ($oldClassId) {
                $this->classRepository->decrementEnrollment($oldClassId);
            }

            $student = $this->studentRepository->update($studentId, ['class_id' => $newClassId]);
            $this->classRepository->incrementEnrollment($newClassId);

            // Generate new bill for the new class (if tariffs exist)
            try {
                $this->billingService->generateBillForStudent($studentId);
            } catch (\InvalidArgumentException $e) {
                // Log the warning but don't fail the student transfer
                if (str_contains($e->getMessage(), 'No tariffs found for student class')) {
                    Log::warning('Student transferred to class without tariffs', [
                        'student_id' => $studentId,
                        'from_class_id' => $oldClassId,
                        'to_class_id' => $newClassId,
                        'message' => 'No tariffs configured for this class. Bill generation skipped.'
                    ]);
                } else {
                    throw $e; // Re-throw other exceptions
                }
            }

            Log::info('Student transferred', [
                'student_id' => $studentId,
                'from_class_id' => $oldClassId,
                'to_class_id' => $newClassId
            ]);

            DB::commit();
            return $student->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to transfer student', [
                'error' => $e->getMessage(),
                'student_id' => $studentId,
                'new_class_id' => $newClassId
            ]);
            throw $e;
        }
    }

    public function promoteStudent(int $studentId, int $targetGradeId, ?int $targetClassId = null): Student
    {
        DB::beginTransaction();

        try {
            $student = $this->studentRepository->findOrFail($studentId);
            $targetGrade = $this->gradeRepository->findOrFail($targetGradeId);

            if (!$student->canBePromoted()) {
                throw new \InvalidArgumentException('Student cannot be promoted');
            }

            // Find target class if not specified
            if (!$targetClassId) {
                $availableClasses = $this->classRepository->getByGrade($targetGradeId)
                    ->where('is_active', true)
                    ->filter(fn($class) => $class->canAcceptStudent());

                if ($availableClasses->isEmpty()) {
                    throw new \InvalidArgumentException('No available classes in target grade');
                }

                $targetClass = $availableClasses->first();
                $targetClassId = $targetClass->id;
            } else {
                $targetClass = $this->classRepository->findOrFail($targetClassId);
                if (!$targetClass->canAcceptStudent()) {
                    throw new \InvalidArgumentException('Target class is full');
                }
            }

            $oldClassId = $student->class_id;

            // Promote student
            if ($oldClassId) {
                $this->classRepository->decrementEnrollment($oldClassId);
            }

            $student = $this->studentRepository->update($studentId, ['class_id' => $targetClassId]);
            $this->classRepository->incrementEnrollment($targetClassId);

            // Generate bill for new grade (if tariffs exist)
            try {
                $this->billingService->generateBillForStudent($studentId);
            } catch (\InvalidArgumentException $e) {
                // Log the warning but don't fail the student promotion
                if (str_contains($e->getMessage(), 'No tariffs found for student class')) {
                    Log::warning('Student promoted to class without tariffs', [
                        'student_id' => $studentId,
                        'from_class_id' => $oldClassId,
                        'to_grade_id' => $targetGradeId,
                        'to_class_id' => $targetClassId,
                        'message' => 'No tariffs configured for this class. Bill generation skipped.'
                    ]);
                } else {
                    throw $e; // Re-throw other exceptions
                }
            }

            Log::info('Student promoted', [
                'student_id' => $studentId,
                'from_class_id' => $oldClassId,
                'to_grade_id' => $targetGradeId,
                'to_class_id' => $targetClassId
            ]);

            DB::commit();
            return $student->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to promote student', [
                'error' => $e->getMessage(),
                'student_id' => $studentId,
                'target_grade_id' => $targetGradeId
            ]);
            throw $e;
        }
    }

    public function graduateStudent(int $studentId): Student
    {
        DB::beginTransaction();

        try {
            $student = $this->studentRepository->findOrFail($studentId);

            if (!$student->is_active) {
                throw new \InvalidArgumentException('Only active students can be graduated');
            }

            $classId = $student->class_id;

            // Graduate student
            $student = $this->studentRepository->update($studentId, [
                'status' => StudentStatus::GRADUATED,
                'class_id' => null
            ]);

            if ($classId) {
                $this->classRepository->decrementEnrollment($classId);
            }

            Log::info('Student graduated', ['student_id' => $studentId]);

            DB::commit();
            return $student;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to graduate student', ['error' => $e->getMessage(), 'student_id' => $studentId]);
            throw $e;
        }
    }

    public function deactivateStudent(int $studentId, string $reason): Student
    {
        DB::beginTransaction();

        try {
            $student = $this->studentRepository->findOrFail($studentId);

            $classId = $student->class_id;

            // Deactivate student
            $student = $this->studentRepository->update($studentId, [
                'status' => StudentStatus::INACTIVE,
                'class_id' => null
            ]);

            if ($classId) {
                $this->classRepository->decrementEnrollment($classId);
            }

            Log::info('Student deactivated', ['student_id' => $studentId, 'reason' => $reason]);

            DB::commit();
            return $student;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to deactivate student', ['error' => $e->getMessage(), 'student_id' => $studentId]);
            throw $e;
        }
    }

    public function bulkPromoteStudents(array $studentIds, int $targetGradeId, ?int $targetClassId = null): array
    {
        $results = [];
        $errors = [];

        foreach ($studentIds as $studentId) {
            try {
                $results[] = $this->promoteStudent($studentId, $targetGradeId, $targetClassId);
            } catch (\Exception $e) {
                $errors[] = [
                    'student_id' => $studentId,
                    'error' => $e->getMessage()
                ];
            }
        }

        return [
            'promoted' => $results,
            'errors' => $errors,
            'total_processed' => count($studentIds),
            'successful' => count($results),
            'failed' => count($errors)
        ];
    }

    public function getStudentWithDetails(int $id): ?Student
    {
        return $this->studentRepository->findWithRelations($id);
    }

    public function getAllStudents(): Collection
    {
        return $this->studentRepository->getAllWithRelations();
    }

    public function searchStudents(string $search): Collection
    {
        return $this->studentRepository->searchByName($search);
    }

    public function getStudentsByClass(int $classId): Collection
    {
        return $this->studentRepository->getByClass($classId);
    }

    public function getStudentsByGrade(int $gradeId): Collection
    {
        return $this->studentRepository->getByGrade($gradeId);
    }

    public function getStudentsWithOutstandingBills(): Collection
    {
        return $this->studentRepository->getStudentsWithOutstandingBills();
    }

    public function getStudentsWithoutClass(): Collection
    {
        return $this->studentRepository->getWithoutClass();
    }

    public function getStudentsByStatus(string $status): Collection
    {
        $statusEnum = StudentStatus::tryFrom($status);
        if (!$statusEnum) {
            throw new \InvalidArgumentException("Invalid status: {$status}");
        }
        return $this->studentRepository->getByStatus($statusEnum);
    }

    private function validateStudentData(array $data, ?int $excludeId = null): void
    {
        // Basic validation
        if (empty($data['first_name'])) {
            throw new \InvalidArgumentException('First name is required');
        }

        if (empty($data['last_name'])) {
            throw new \InvalidArgumentException('Last name is required');
        }

        if (empty($data['parent_name'])) {
            throw new \InvalidArgumentException('Parent name is required');
        }

        if (empty($data['parent_email'])) {
            throw new \InvalidArgumentException('Parent email is required');
        }

        // Validate email format
        if (isset($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    throw new \InvalidArgumentException('Invalid email format');
        }

        if (!filter_var($data['parent_email'], FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Invalid parent email format');
        }

        // Validate date of birth
        if (isset($data['date_of_birth'])) {
            $dob = new \DateTime($data['date_of_birth']);
            $age = $dob->diff(new \DateTime())->y;

            if ($age < 3 || $age > 18) {
                throw new \InvalidArgumentException('Student age must be between 3 and 18 years');
            }
        }

        // Validate disability description is provided when disability is true
        if (isset($data['disability']) && $data['disability'] === true) {
            if (empty($data['disability_description'])) {
                throw new \InvalidArgumentException('Disability description is required when disability is marked as true');
            }
        }

        // Validate Rwanda location hierarchy if provided
        $locationFields = ['province', 'district', 'sector', 'cell', 'village'];
        $validProvinces = ['Kigali', 'Eastern', 'Northern', 'Southern', 'Western'];

        if (isset($data['province']) && !in_array($data['province'], $validProvinces)) {
            throw new \InvalidArgumentException('Invalid province. Must be one of: ' . implode(', ', $validProvinces));
        }
    }
}
