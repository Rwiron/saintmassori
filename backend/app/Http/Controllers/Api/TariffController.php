<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Services\TariffService;
use App\Enums\TariffType;
use App\Enums\BillingFrequency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TariffController extends BaseApiController
{
    public function __construct(
        private readonly TariffService $tariffService
    ) {}

    /**
     * Display a listing of tariffs
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search');
            $type = $request->get('type');
            $frequency = $request->get('frequency');

            if ($search) {
                $tariffs = $this->tariffService->searchTariffs($search);
            } elseif ($type) {
                $tariffs = $this->tariffService->getTariffsByType(TariffType::from($type));
            } elseif ($frequency) {
                $tariffs = $this->tariffService->getTariffsByFrequency(BillingFrequency::from($frequency));
            } else {
                $tariffs = $this->tariffService->getActiveTariffs();
            }

            return $this->successResponse($tariffs, 'Tariffs retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Store a newly created tariff
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'type' => ['required', Rule::in(array_column(TariffType::cases(), 'value'))],
                'amount' => 'required|numeric|min:0.01',
                'billing_frequency' => ['required', Rule::in(array_column(BillingFrequency::cases(), 'value'))],
                'description' => 'nullable|string|max:1000',
                'is_active' => 'boolean',
                'class_ids' => 'nullable|array',
                'class_ids.*' => 'exists:classes,id',
            ]);

            $tariff = $this->tariffService->createTariff($validated);

            return $this->createdResponse($tariff, 'Tariff created successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Display the specified tariff
     */
    public function show(int $id): JsonResponse
    {
        try {
            $tariff = $this->tariffService->getTariffWithClasses($id);

            if (!$tariff) {
                return $this->notFoundResponse('Tariff not found');
            }

            return $this->successResponse($tariff, 'Tariff retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Update the specified tariff
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'type' => ['sometimes', 'required', Rule::in(array_column(TariffType::cases(), 'value'))],
                'amount' => 'sometimes|required|numeric|min:0.01',
                'billing_frequency' => ['sometimes', 'required', Rule::in(array_column(BillingFrequency::cases(), 'value'))],
                'description' => 'nullable|string|max:1000',
                'is_active' => 'boolean',
            ]);

            $tariff = $this->tariffService->updateTariff($id, $validated);

            return $this->updatedResponse($tariff, 'Tariff updated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Remove the specified tariff
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->tariffService->deleteTariff($id);

            return $this->deletedResponse('Tariff deleted successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Activate a tariff
     */
    public function activate(int $id): JsonResponse
    {
        try {
            $tariff = $this->tariffService->activateTariff($id);

            return $this->updatedResponse($tariff, 'Tariff activated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Deactivate a tariff
     */
    public function deactivate(int $id): JsonResponse
    {
        try {
            $tariff = $this->tariffService->deactivateTariff($id);

            return $this->updatedResponse($tariff, 'Tariff deactivated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get tariff statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $statistics = $this->tariffService->getTariffStatistics();

            return $this->successResponse($statistics, 'Tariff statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Duplicate a tariff
     */
    public function duplicate(Request $request, int $id): JsonResponse
    {
        try {
            $overrides = $request->validate([
                'name' => 'nullable|string|max:255',
                'type' => ['nullable', Rule::in(array_column(TariffType::cases(), 'value'))],
                'amount' => 'nullable|numeric|min:0.01',
                'billing_frequency' => ['nullable', Rule::in(array_column(BillingFrequency::cases(), 'value'))],
                'description' => 'nullable|string|max:1000',
                'is_active' => 'boolean',
            ]);

            $tariff = $this->tariffService->duplicateTariff($id, $overrides);

            return $this->createdResponse($tariff, 'Tariff duplicated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Bulk update tariff amounts
     */
    public function bulkUpdateAmounts(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'tariffs' => 'required|array',
                'tariffs.*.id' => 'required|exists:tariffs,id',
                'tariffs.*.amount' => 'required|numeric|min:0.01',
            ]);

            $tariffAmounts = [];
            foreach ($validated['tariffs'] as $tariff) {
                $tariffAmounts[$tariff['id']] = $tariff['amount'];
            }

            $result = $this->tariffService->bulkUpdateTariffAmounts($tariffAmounts);

            return $this->successResponse($result, 'Tariff amounts updated successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Get tariffs by class
     */
    public function byClass(int $classId): JsonResponse
    {
        try {
            $tariffs = $this->tariffService->getTariffsByClass($classId);

            return $this->successResponse($tariffs, 'Class tariffs retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Assign tariff to classes
     */
    public function assignToClasses(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'class_ids' => 'required|array',
                'class_ids.*' => 'exists:classes,id',
            ]);

            $tariff = $this->tariffService->assignTariffToClasses($id, $validated['class_ids']);

            return $this->updatedResponse($tariff, 'Tariff assigned to classes successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Remove tariff from class
     */
    public function removeFromClass(int $id, int $classId): JsonResponse
    {
        try {
            $tariff = $this->tariffService->removeTariffFromClass($id, $classId);

            return $this->updatedResponse($tariff, 'Tariff removed from class successfully');
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }
}
