<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Services\GradeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeController extends BaseApiController
{
    public function __construct(
        private readonly GradeService $gradeService
    ) {}

    /**
     * Display a listing of grades
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search');
            $activeOnly = $request->boolean('active_only', false);

            if ($search) {
                $grades = $this->gradeService->searchGrades($search);
            } elseif ($activeOnly) {
                $grades = $this->gradeService->getActiveGrades();
            } else {
                $grades = $this->gradeService->getAllGradesOrderedByLevel();
            }

            return $this->successResponse($grades, 'Grades retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Store a newly created grade
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:10|regex:/^[NP]\d+$/',
                'display_name' => 'required|string|max:255',
                'level' => 'nullable|integer|min:1|max:20',
                'description' => 'nullable|string|max:1000',
                'is_active' => 'boolean',
                'create_default_classes' => 'boolean',
                'default_class_names' => 'nullable|array',
                'default_class_names.*' => 'string|max:10',
            ]);

            $grade = $this->gradeService->createGrade($validated);

            return $this->createdResponse($grade, 'Grade created successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Display the specified grade
     */
    public function show(int $id): JsonResponse
    {
        try {
            $grade = $this->gradeService->getGradeWithDetails($id);

            if (!$grade) {
                return $this->notFoundResponse('Grade not found');
            }

            return $this->successResponse($grade, 'Grade retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Update the specified grade
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:10|regex:/^[NP]\d+$/',
                'display_name' => 'sometimes|required|string|max:255',
                'level' => 'sometimes|required|integer|min:1|max:20',
                'description' => 'nullable|string|max:1000',
                'is_active' => 'boolean',
            ]);

            $grade = $this->gradeService->updateGrade($id, $validated);

            return $this->updatedResponse($grade, 'Grade updated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Remove the specified grade
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->gradeService->deleteGrade($id);

            return $this->deletedResponse('Grade deleted successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Activate a grade
     */
    public function activate(int $id): JsonResponse
    {
        try {
            $grade = $this->gradeService->activateGrade($id);

            return $this->updatedResponse($grade, 'Grade activated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Deactivate a grade
     */
    public function deactivate(int $id): JsonResponse
    {
        try {
            $grade = $this->gradeService->deactivateGrade($id);

            return $this->updatedResponse($grade, 'Grade deactivated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get grade statistics
     */
    public function statistics(int $id): JsonResponse
    {
        try {
            $statistics = $this->gradeService->getGradeStatistics($id);

            return $this->successResponse($statistics, 'Grade statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get all grades statistics
     */
    public function allStatistics(): JsonResponse
    {
        try {
            $statistics = $this->gradeService->getAllGradesStatistics();

            return $this->successResponse($statistics, 'All grades statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Create a class for a grade
     */
    public function createClass(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:10',
                'capacity' => 'required|integer|min:1|max:100',
                'description' => 'nullable|string|max:1000',
                'is_active' => 'boolean',
            ]);

            $class = $this->gradeService->createClassForGrade($id, $validated);

            return $this->createdResponse($class, 'Class created for grade successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Bulk create classes for a grade
     */
    public function bulkCreateClasses(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'classes' => 'required|array|min:1',
                'classes.*.name' => 'required|string|max:10',
                'classes.*.capacity' => 'required|integer|min:1|max:100',
                'classes.*.description' => 'nullable|string|max:1000',
                'classes.*.is_active' => 'boolean',
            ]);

            $result = $this->gradeService->bulkCreateClasses($id, $validated['classes']);

            return $this->successResponse($result, 'Bulk class creation completed');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get next grade
     */
    public function nextGrade(int $id): JsonResponse
    {
        try {
            $nextGrade = $this->gradeService->getNextGrade($id);

            if (!$nextGrade) {
                return $this->notFoundResponse('No next grade found');
            }

            return $this->successResponse($nextGrade, 'Next grade retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get previous grade
     */
    public function previousGrade(int $id): JsonResponse
    {
        try {
            $previousGrade = $this->gradeService->getPreviousGrade($id);

            if (!$previousGrade) {
                return $this->notFoundResponse('No previous grade found');
            }

            return $this->successResponse($previousGrade, 'Previous grade retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Bulk activate grades
     */
    public function bulkActivate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'grade_ids' => 'required|array|min:1',
                'grade_ids.*' => 'integer|exists:grades,id',
            ]);

            $result = $this->gradeService->bulkActivateGrades($validated['grade_ids']);

            return $this->successResponse($result, 'Bulk grade activation completed');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Bulk deactivate grades
     */
    public function bulkDeactivate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'grade_ids' => 'required|array|min:1',
                'grade_ids.*' => 'integer|exists:grades,id',
            ]);

            $result = $this->gradeService->bulkDeactivateGrades($validated['grade_ids']);

            return $this->successResponse($result, 'Bulk grade deactivation completed');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get active grades only
     */
    public function active(): JsonResponse
    {
        try {
            $grades = $this->gradeService->getActiveGrades();

            return $this->successResponse($grades, 'Active grades retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Search grades
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'query' => 'required|string|min:1|max:255',
            ]);

            $grades = $this->gradeService->searchGrades($validated['query']);

            return $this->successResponse($grades, 'Grade search completed successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }
}
