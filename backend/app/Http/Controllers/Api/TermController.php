<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Services\TermService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TermController extends BaseApiController
{
    public function __construct(
        private readonly TermService $termService
    ) {}

    /**
     * Display a listing of terms
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search');
            $academicYearId = $request->get('academic_year_id');

            if ($search) {
                $terms = $this->termService->searchTerms($search);
            } elseif ($academicYearId) {
                $terms = $this->termService->getTermsByAcademicYear($academicYearId);
            } else {
                $terms = $this->termService->getTermsOrderedByDate();
            }

            return $this->successResponse($terms, 'Terms retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Store a newly created term
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'academic_year_id' => 'required|integer|exists:academic_years,id',
                'name' => 'required|string|max:255',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'description' => 'nullable|string|max:1000',
            ]);

            $term = $this->termService->createTerm($validated);

            return $this->createdResponse($term, 'Term created successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Display the specified term
     */
    public function show(int $id): JsonResponse
    {
        try {
            $term = $this->termService->getTermWithAcademicYear($id);

            if (!$term) {
                return $this->notFoundResponse('Term not found');
            }

            return $this->successResponse($term, 'Term retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Update the specified term
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

            $term = $this->termService->updateTerm($id, $validated);

            return $this->updatedResponse($term, 'Term updated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Remove the specified term
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->termService->deleteTerm($id);

            return $this->deletedResponse('Term deleted successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Activate a term
     */
    public function activate(int $id): JsonResponse
    {
        try {
            $term = $this->termService->activateTerm($id);

            return $this->updatedResponse($term, 'Term activated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Complete a term
     */
    public function complete(int $id): JsonResponse
    {
        try {
            $term = $this->termService->completeTerm($id);

            return $this->updatedResponse($term, 'Term completed successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get the current term
     */
    public function current(): JsonResponse
    {
        try {
            $term = $this->termService->getCurrentTerm();

            if (!$term) {
                return $this->notFoundResponse('No active term found');
            }

            return $this->successResponse($term, 'Current term retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get active terms
     */
    public function active(): JsonResponse
    {
        try {
            $terms = $this->termService->getActiveTerms();

            return $this->successResponse($terms, 'Active terms retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get term statistics
     */
    public function statistics(int $id): JsonResponse
    {
        try {
            $statistics = $this->termService->getTermStatistics($id);

            return $this->successResponse($statistics, 'Term statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get terms by academic year
     */
    public function byAcademicYear(int $academicYearId): JsonResponse
    {
        try {
            $terms = $this->termService->getTermsByAcademicYear($academicYearId);

            return $this->successResponse($terms, 'Terms retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Check if term can be deleted
     */
    public function canDelete(int $id): JsonResponse
    {
        try {
            $canDelete = $this->termService->canBeDeleted($id);

            return $this->successResponse([
                'can_delete' => $canDelete,
                'message' => $canDelete ? 'Term can be deleted' : 'Term cannot be deleted'
            ]);
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }
}
