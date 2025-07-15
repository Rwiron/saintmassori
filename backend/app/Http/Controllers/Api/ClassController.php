<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Services\ClassService;
use App\Services\TariffService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassController extends BaseApiController
{
    public function __construct(
        private readonly ClassService $classService,
        private readonly TariffService $tariffService
    ) {}

    /**
     * Display a listing of classes
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search');
            $gradeId = $request->get('grade_id');

            if ($search) {
                $classes = $this->classService->searchClasses($search);
            } elseif ($gradeId) {
                // Validate that grade_id is a valid integer
                if (!is_numeric($gradeId) || (int) $gradeId <= 0) {
                    return $this->errorResponse('Invalid grade ID provided', 400);
                }
                $classes = $this->classService->getClassesByGrade((int) $gradeId);
            } else {
                $classes = $this->classService->getActiveClasses();
            }

            return $this->successResponse($classes, 'Classes retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Store a newly created class
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'grade_id' => 'required|exists:grades,id',
                'capacity' => 'required|integer|min:1|max:100',
                'description' => 'nullable|string|max:1000',
                'is_active' => 'boolean',
                'tariff_ids' => 'nullable|array',
                'tariff_ids.*' => 'exists:tariffs,id',
            ]);

            $class = $this->classService->createClass($validated);

            return $this->createdResponse($class, 'Class created successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Display the specified class
     */
    public function show(int $id): JsonResponse
    {
        try {
            $class = $this->classService->getClassWithDetails($id);

            if (!$class) {
                return $this->notFoundResponse('Class not found');
            }

            return $this->successResponse($class, 'Class retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Update the specified class
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'grade_id' => 'sometimes|required|exists:grades,id',
                'capacity' => 'sometimes|required|integer|min:1|max:100',
                'description' => 'nullable|string|max:1000',
                'is_active' => 'boolean',
            ]);

            $class = $this->classService->updateClass($id, $validated);

            return $this->updatedResponse($class, 'Class updated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Remove the specified class
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->classService->deleteClass($id);

            return $this->deletedResponse('Class deleted successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get class statistics
     */
    public function statistics(int $id): JsonResponse
    {
        try {
            $statistics = $this->classService->getClassStatistics($id);

            return $this->successResponse($statistics, 'Class statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get classes with available spots
     */
    public function withAvailableSpots(): JsonResponse
    {
        try {
            $classes = $this->classService->getClassesWithAvailableSpots();

            return $this->successResponse($classes, 'Classes with available spots retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get classes with tariff counts
     */
    public function withTariffCounts(): JsonResponse
    {
        try {
            $classes = $this->classService->getActiveClassesWithTariffCounts();

            return $this->successResponse($classes, 'Classes with tariff counts retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Assign tariffs to class
     */
    public function assignTariffs(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'tariff_ids' => 'required|array',
                'tariff_ids.*' => 'exists:tariffs,id',
            ]);

            $class = $this->classService->assignTariffsToClass($id, $validated['tariff_ids']);

            return $this->updatedResponse($class, 'Tariffs assigned to class successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get class tariffs
     */
    public function getTariffs(int $id): JsonResponse
    {
        try {
            $tariffs = $this->tariffService->getTariffsByClass($id);

            return $this->successResponse($tariffs, 'Class tariffs retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Remove tariff from class
     */
    public function removeTariff(int $id, int $tariffId): JsonResponse
    {
        try {
            $class = $this->classService->removeTariffFromClass($id, $tariffId);

            return $this->updatedResponse($class, 'Tariff removed from class successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }
}
