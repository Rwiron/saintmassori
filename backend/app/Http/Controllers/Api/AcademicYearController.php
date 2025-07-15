<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Services\AcademicYearService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AcademicYearController extends BaseApiController
{
    public function __construct(
        private readonly AcademicYearService $academicYearService
    ) {}

    /**
     * Display a listing of academic years
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search');

            if ($search) {
                $academicYears = $this->academicYearService->searchAcademicYears($search);
            } else {
                $academicYears = $this->academicYearService->getAcademicYearsOrderedByDate();
            }

            return $this->successResponse($academicYears, 'Academic years retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Store a newly created academic year
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'description' => 'nullable|string|max:1000',
            ]);

            $academicYear = $this->academicYearService->createAcademicYear($validated);

            return $this->createdResponse($academicYear, 'Academic year created successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Display the specified academic year
     */
    public function show(int $id): JsonResponse
    {
        try {
            $academicYear = $this->academicYearService->getAcademicYearWithTerms($id);

            if (!$academicYear) {
                return $this->notFoundResponse('Academic year not found');
            }

            return $this->successResponse($academicYear, 'Academic year retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Update the specified academic year
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'start_date' => 'sometimes|required|date',
                'end_date' => 'sometimes|required|date|after:start_date',
                'description' => 'nullable|string|max:1000',
            ]);

            $academicYear = $this->academicYearService->updateAcademicYear($id, $validated);

            return $this->updatedResponse($academicYear, 'Academic year updated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Remove the specified academic year
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->academicYearService->deleteAcademicYear($id);

            return $this->deletedResponse('Academic year deleted successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Activate an academic year
     */
    public function activate(int $id): JsonResponse
    {
        try {
            $academicYear = $this->academicYearService->activateAcademicYear($id);

            return $this->updatedResponse($academicYear, 'Academic year activated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Close an academic year
     */
    public function close(int $id): JsonResponse
    {
        try {
            $academicYear = $this->academicYearService->closeAcademicYear($id);

            return $this->updatedResponse($academicYear, 'Academic year closed successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get the current academic year
     */
    public function current(): JsonResponse
    {
        try {
            $academicYear = $this->academicYearService->getCurrentAcademicYear();

            if (!$academicYear) {
                return $this->notFoundResponse('No active academic year found');
            }

            return $this->successResponse($academicYear, 'Current academic year retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get active academic years
     */
    public function active(): JsonResponse
    {
        try {
            $academicYears = $this->academicYearService->getActiveAcademicYears();

            return $this->successResponse($academicYears, 'Active academic years retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get academic year statistics
     */
    public function statistics(int $id): JsonResponse
    {
        try {
            $statistics = $this->academicYearService->getAcademicYearStatistics($id);

            return $this->successResponse($statistics, 'Academic year statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Check if academic year can be closed
     */
    public function canClose(int $id): JsonResponse
    {
        try {
            $canClose = $this->academicYearService->canBeClosed($id);

            return $this->successResponse([
                'can_close' => $canClose,
                'message' => $canClose ? 'Academic year can be closed' : 'Academic year cannot be closed'
            ]);
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Check if academic year can be deleted
     */
    public function canDelete(int $id): JsonResponse
    {
        try {
            $canDelete = $this->academicYearService->canBeDeleted($id);

            return $this->successResponse([
                'can_delete' => $canDelete,
                'message' => $canDelete ? 'Academic year can be deleted' : 'Academic year cannot be deleted'
            ]);
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }
}
