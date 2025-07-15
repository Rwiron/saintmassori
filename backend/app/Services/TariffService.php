<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\TariffType;
use App\Enums\BillingFrequency;
use App\Models\Tariff;
use App\Repositories\TariffRepository;
use App\Repositories\ClassRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TariffService
{
    public function __construct(
        private readonly TariffRepository $tariffRepository,
        private readonly ClassRepository $classRepository
    ) {}

    public function createTariff(array $data): Tariff
    {
        DB::beginTransaction();

        try {
            // Validate tariff data
            $this->validateTariffData($data);

            // Create tariff
            $tariff = $this->tariffRepository->create([
                'name' => $data['name'],
                'type' => TariffType::from($data['type']),
                'amount' => $data['amount'],
                'billing_frequency' => BillingFrequency::from($data['billing_frequency']),
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Assign to classes if provided
            if (isset($data['class_ids']) && is_array($data['class_ids'])) {
                $this->assignTariffToClasses($tariff->id, $data['class_ids']);
            }

            Log::info('Tariff created', [
                'tariff_id' => $tariff->id,
                'name' => $tariff->name,
                'amount' => $tariff->amount
            ]);

            DB::commit();
            return $tariff->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create tariff', ['error' => $e->getMessage(), 'data' => $data]);
            throw $e;
        }
    }

    public function updateTariff(int $id, array $data): Tariff
    {
        DB::beginTransaction();

        try {
            $tariff = $this->tariffRepository->findOrFail($id);

            // Validate updated data
            $this->validateTariffData($data, $id);

            // Convert enums if provided
            if (isset($data['type'])) {
                $data['type'] = TariffType::from($data['type']);
            }

            if (isset($data['billing_frequency'])) {
                $data['billing_frequency'] = BillingFrequency::from($data['billing_frequency']);
            }

            $tariff = $this->tariffRepository->update($id, $data);

            Log::info('Tariff updated', ['tariff_id' => $id, 'changes' => $data]);

            DB::commit();
            return $tariff;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update tariff', ['error' => $e->getMessage(), 'id' => $id, 'data' => $data]);
            throw $e;
        }
    }

    public function deleteTariff(int $id): bool
    {
        DB::beginTransaction();

        try {
            $tariff = $this->tariffRepository->findOrFail($id);

            // Check if tariff can be deleted
            if (!$this->canBeDeleted($id)) {
                throw new \InvalidArgumentException('Tariff cannot be deleted. It is assigned to classes.');
            }

            $result = $this->tariffRepository->delete($id);

            Log::info('Tariff deleted', ['tariff_id' => $id, 'name' => $tariff->name]);

            DB::commit();
            return $result;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete tariff', ['error' => $e->getMessage(), 'id' => $id]);
            throw $e;
        }
    }

    public function assignTariffToClasses(int $tariffId, array $classIds): Tariff
    {
        DB::beginTransaction();

        try {
            $tariff = $this->tariffRepository->findOrFail($tariffId);

            // Validate all classes exist
            foreach ($classIds as $classId) {
                $this->classRepository->findOrFail($classId);
            }

            // Assign tariff to classes
            foreach ($classIds as $classId) {
                $this->classRepository->attachTariff($classId, $tariffId);
            }

            Log::info('Tariff assigned to classes', [
                'tariff_id' => $tariffId,
                'class_ids' => $classIds
            ]);

            DB::commit();
            return $tariff->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to assign tariff to classes', [
                'error' => $e->getMessage(),
                'tariff_id' => $tariffId,
                'class_ids' => $classIds
            ]);
            throw $e;
        }
    }

    public function removeTariffFromClass(int $tariffId, int $classId): Tariff
    {
        DB::beginTransaction();

        try {
            $tariff = $this->tariffRepository->findOrFail($tariffId);

            $this->classRepository->detachTariff($classId, $tariffId);

            Log::info('Tariff removed from class', [
                'tariff_id' => $tariffId,
                'class_id' => $classId
            ]);

            DB::commit();
            return $tariff->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to remove tariff from class', [
                'error' => $e->getMessage(),
                'tariff_id' => $tariffId,
                'class_id' => $classId
            ]);
            throw $e;
        }
    }

    public function activateTariff(int $id): Tariff
    {
        return $this->updateTariff($id, ['is_active' => true]);
    }

    public function deactivateTariff(int $id): Tariff
    {
        return $this->updateTariff($id, ['is_active' => false]);
    }

    public function getTariffsByType(TariffType $type): Collection
    {
        return $this->tariffRepository->getByType($type);
    }

    public function getTariffsByFrequency(BillingFrequency $frequency): Collection
    {
        return $this->tariffRepository->getByFrequency($frequency);
    }

    public function getActiveTariffs(): Collection
    {
        return $this->tariffRepository->getActive();
    }

    public function getTariffWithClasses(int $id): ?Tariff
    {
        return $this->tariffRepository->findWithClasses($id);
    }

    public function getTariffsByClass(int $classId): array
    {
        $class = $this->classRepository->findOrFail($classId);
        $tariffs = $this->classRepository->getClassTariffs($classId);

        return [
            'class' => $class->load('grade'),
            'tariffs' => $tariffs,
            'total_amount' => $tariffs->sum('amount'),
            'active_tariffs_count' => $tariffs->where('is_active', true)->count(),
            'total_tariffs_count' => $tariffs->count()
        ];
    }

    public function searchTariffs(string $search): Collection
    {
        return $this->tariffRepository->searchByName($search);
    }

    public function getTariffStatistics(): array
    {
        $tariffs = $this->tariffRepository->all();

        $typeStats = [];
        foreach (TariffType::cases() as $type) {
            $typeTariffs = $tariffs->where('type', $type);
            $typeStats[$type->value] = [
                'count' => $typeTariffs->count(),
                'total_amount' => $typeTariffs->sum('amount'),
                'average_amount' => $typeTariffs->avg('amount') ?? 0,
            ];
        }

        $frequencyStats = [];
        foreach (BillingFrequency::cases() as $frequency) {
            $frequencyTariffs = $tariffs->where('billing_frequency', $frequency);
            $frequencyStats[$frequency->value] = [
                'count' => $frequencyTariffs->count(),
                'total_amount' => $frequencyTariffs->sum('amount'),
                'average_amount' => $frequencyTariffs->avg('amount') ?? 0,
            ];
        }

        return [
            'total_tariffs' => $tariffs->count(),
            'active_tariffs' => $tariffs->where('is_active', true)->count(),
            'inactive_tariffs' => $tariffs->where('is_active', false)->count(),
            'total_amount' => $tariffs->sum('amount'),
            'average_amount' => $tariffs->avg('amount') ?? 0,
            'by_type' => $typeStats,
            'by_frequency' => $frequencyStats,
        ];
    }

    public function bulkUpdateTariffAmounts(array $tariffAmounts): array
    {
        $results = [];
        $errors = [];

        foreach ($tariffAmounts as $tariffId => $amount) {
            try {
                $results[] = $this->updateTariff($tariffId, ['amount' => $amount]);
            } catch (\Exception $e) {
                $errors[] = [
                    'tariff_id' => $tariffId,
                    'error' => $e->getMessage()
                ];
            }
        }

        return [
            'updated' => $results,
            'errors' => $errors,
            'total_processed' => count($tariffAmounts),
            'successful' => count($results),
            'failed' => count($errors)
        ];
    }

    public function duplicateTariff(int $id, array $overrides = []): Tariff
    {
        DB::beginTransaction();

        try {
            $originalTariff = $this->tariffRepository->findOrFail($id);

            $newTariffData = [
                'name' => $overrides['name'] ?? $originalTariff->name . ' (Copy)',
                'type' => $overrides['type'] ?? $originalTariff->type->value,
                'amount' => $overrides['amount'] ?? $originalTariff->amount,
                'billing_frequency' => $overrides['billing_frequency'] ?? $originalTariff->billing_frequency->value,
                'description' => $overrides['description'] ?? $originalTariff->description,
                'is_active' => $overrides['is_active'] ?? false, // Default to inactive for duplicates
            ];

            $newTariff = $this->createTariff($newTariffData);

            Log::info('Tariff duplicated', [
                'original_id' => $id,
                'new_id' => $newTariff->id,
                'name' => $newTariff->name
            ]);

            DB::commit();
            return $newTariff;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to duplicate tariff', ['error' => $e->getMessage(), 'id' => $id]);
            throw $e;
        }
    }

    public function canBeDeleted(int $id): bool
    {
        $tariff = $this->tariffRepository->findOrFail($id);
        return $tariff->classes()->count() === 0;
    }

    private function validateTariffData(array $data, ?int $excludeId = null): void
    {
        // Basic validation
        if (empty($data['name'])) {
            throw new \InvalidArgumentException('Tariff name is required');
        }

        if (isset($data['amount']) && $data['amount'] <= 0) {
            throw new \InvalidArgumentException('Tariff amount must be greater than zero');
        }

        // Validate type
        if (isset($data['type']) && !in_array($data['type'], array_column(TariffType::cases(), 'value'))) {
            throw new \InvalidArgumentException('Invalid tariff type');
        }

        // Validate billing frequency
        if (isset($data['billing_frequency']) && !in_array($data['billing_frequency'], array_column(BillingFrequency::cases(), 'value'))) {
            throw new \InvalidArgumentException('Invalid billing frequency');
        }

        // Check for duplicate name
        if (isset($data['name'])) {
            $existingTariff = $this->tariffRepository->findByName($data['name']);
            if ($existingTariff && (!$excludeId || $existingTariff->id !== $excludeId)) {
                throw new \InvalidArgumentException('Tariff with this name already exists');
            }
        }
    }
}
