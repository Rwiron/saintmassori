<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Services\StudentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StudentController extends BaseApiController
{
    public function __construct(
        private readonly StudentService $studentService
    ) {}

    /**
     * Display a listing of students
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search');
            $classId = $request->get('class_id');
            $gradeId = $request->get('grade_id');
            $status = $request->get('status');
            $withoutClass = $request->get('without_class');

            if ($search) {
                $students = $this->studentService->searchStudents($search);
            } elseif ($classId) {
                // Validate that class_id is a valid integer
                if (!is_numeric($classId) || (int) $classId <= 0) {
                    return $this->errorResponse('Invalid class ID provided', 400);
                }
                $students = $this->studentService->getStudentsByClass((int) $classId);
            } elseif ($gradeId) {
                // Validate that grade_id is a valid integer
                if (!is_numeric($gradeId) || (int) $gradeId <= 0) {
                    return $this->errorResponse('Invalid grade ID provided', 400);
                }
                $students = $this->studentService->getStudentsByGrade((int) $gradeId);
            } elseif ($withoutClass) {
                // Get students without class assignment
                $students = $this->studentService->getStudentsWithoutClass();
            } elseif ($status) {
                // Filter by status
                $students = $this->studentService->getStudentsByStatus($status);
            } else {
                // Get all students (this could be paginated in future)
                $students = $this->studentService->getAllStudents();
            }

            return $this->successResponse($students, 'Students retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Store a newly created student
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'nullable|email|unique:students,email',
                'date_of_birth' => 'required|date|before:today',
                'gender' => 'required|in:male,female,other',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'parent_name' => 'required|string|max:255',
                'parent_email' => 'required|email',
                'parent_phone' => 'required|string|max:20',
                'father_name' => 'nullable|string|max:255',
                'mother_name' => 'nullable|string|max:255',
                'emergency_contact' => 'nullable|string|max:255',
                'enrollment_date' => 'nullable|date',
                'medical_conditions' => 'nullable|string|max:1000',
                'allergies' => 'nullable|string|max:1000',
                'disability' => 'nullable|boolean',
                'disability_description' => 'nullable|string|max:1000|required_if:disability,true',
                'province' => 'nullable|string|in:Kigali,Eastern,Northern,Southern,Western',
                'district' => 'nullable|string|max:255',
                'sector' => 'nullable|string|max:255',
                'cell' => 'nullable|string|max:255',
                'village' => 'nullable|string|max:255',
                'class_id' => 'nullable|exists:classes,id',
            ]);

            $student = $this->studentService->registerStudent($validated);

            return $this->createdResponse($student, 'Student registered successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Display the specified student
     */
    public function show(int $id): JsonResponse
    {
        try {
            $student = $this->studentService->getStudentWithDetails($id);

            if (!$student) {
                return $this->notFoundResponse('Student not found');
            }

            return $this->successResponse($student, 'Student retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Update the specified student
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'first_name' => 'sometimes|required|string|max:255',
                'last_name' => 'sometimes|required|string|max:255',
                'email' => 'nullable|email|unique:students,email,' . $id,
                'date_of_birth' => 'sometimes|required|date|before:today',
                'gender' => 'sometimes|required|in:male,female,other',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'parent_name' => 'sometimes|required|string|max:255',
                'parent_email' => 'sometimes|required|email',
                'parent_phone' => 'sometimes|required|string|max:20',
                'father_name' => 'nullable|string|max:255',
                'mother_name' => 'nullable|string|max:255',
                'emergency_contact' => 'nullable|string|max:255',
                'medical_conditions' => 'nullable|string|max:1000',
                'allergies' => 'nullable|string|max:1000',
                'disability' => 'nullable|boolean',
                'disability_description' => 'nullable|string|max:1000|required_if:disability,true',
                'province' => 'nullable|string|in:Kigali,Eastern,Northern,Southern,Western',
                'district' => 'nullable|string|max:255',
                'sector' => 'nullable|string|max:255',
                'cell' => 'nullable|string|max:255',
                'village' => 'nullable|string|max:255',
            ]);

            $student = $this->studentService->updateStudent($id, $validated);

            return $this->updatedResponse($student, 'Student updated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Remove the specified student (soft delete)
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        try {
            $reason = $request->get('reason', 'Student deactivated');

            $student = $this->studentService->deactivateStudent($id, $reason);

            return $this->updatedResponse($student, 'Student deactivated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Assign student to a class
     */
    public function assignToClass(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'class_id' => 'required|exists:classes,id',
            ]);

            $student = $this->studentService->assignStudentToClass($id, $validated['class_id']);

            return $this->updatedResponse($student, 'Student assigned to class successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Remove student from class
     */
    public function removeFromClass(int $id): JsonResponse
    {
        try {
            $student = $this->studentService->removeStudentFromClass($id);

            return $this->updatedResponse($student, 'Student removed from class successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Transfer student to another class
     */
    public function transfer(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'new_class_id' => 'required|exists:classes,id',
            ]);

            $student = $this->studentService->transferStudent($id, $validated['new_class_id']);

            return $this->updatedResponse($student, 'Student transferred successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Promote student to next grade
     */
    public function promote(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'target_grade_id' => 'required|exists:grades,id',
                'target_class_id' => 'nullable|exists:classes,id',
            ]);

            $student = $this->studentService->promoteStudent(
                $id,
                $validated['target_grade_id'],
                $validated['target_class_id'] ?? null
            );

            return $this->updatedResponse($student, 'Student promoted successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Graduate student
     */
    public function graduate(int $id): JsonResponse
    {
        try {
            $student = $this->studentService->graduateStudent($id);

            return $this->updatedResponse($student, 'Student graduated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Bulk promote students
     */
    public function bulkPromote(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'student_ids' => 'required|array',
                'student_ids.*' => 'exists:students,id',
                'target_grade_id' => 'required|exists:grades,id',
                'target_class_id' => 'nullable|exists:classes,id',
            ]);

            $result = $this->studentService->bulkPromoteStudents(
                $validated['student_ids'],
                $validated['target_grade_id'],
                $validated['target_class_id'] ?? null
            );

            return $this->successResponse($result, 'Bulk promotion completed');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get students with outstanding bills
     */
    public function withOutstandingBills(): JsonResponse
    {
        try {
            $students = $this->studentService->getStudentsWithOutstandingBills();

            return $this->successResponse($students, 'Students with outstanding bills retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get students by class
     */
    public function byClass(int $classId): JsonResponse
    {
        try {
            $students = $this->studentService->getStudentsByClass($classId);

            return $this->successResponse($students, 'Students retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get students by grade
     */
    public function byGrade(int $gradeId): JsonResponse
    {
        try {
            $students = $this->studentService->getStudentsByGrade($gradeId);

            return $this->successResponse($students, 'Students retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }
}
