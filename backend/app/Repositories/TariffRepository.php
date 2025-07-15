<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\TariffType;
use App\Enums\BillingFrequency;
use App\Models\Tariff;
use Illuminate\Database\Eloquent\Collection;

class TariffRepository extends BaseRepository
{
    public function __construct(Tariff $model)
    {
        parent::__construct($model);
    }

    public function getByType(TariffType $type): Collection
    {
        return $this->model->where('type', $type)->get();
    }

    public function getByFrequency(BillingFrequency $frequency): Collection
    {
        return $this->model->where('billing_frequency', $frequency)->get();
    }

    public function getActive(): Collection
    {
        return $this->model->where('is_active', true)->get();
    }

    public function getInactive(): Collection
    {
        return $this->model->where('is_active', false)->get();
    }

    public function findByName(string $name): ?Tariff
    {
        return $this->model->where('name', $name)->first();
    }

    public function searchByName(string $search): Collection
    {
        return $this->model
            ->where('name', 'like', "%{$search}%")
            ->get();
    }

    public function getWithClasses(): Collection
    {
        return $this->model->with('classes.grade')->get();
    }

    public function findWithClasses(int $id): ?Tariff
    {
        return $this->model->with('classes.grade')->find($id);
    }

    public function getClassTariffs(int $classId): Collection
    {
        return $this->model
            ->whereHas('classes', function ($query) use ($classId) {
                $query->where('classes.id', $classId);
            })
            ->get();
    }

    public function getByAmountRange(float $minAmount, float $maxAmount): Collection
    {
        return $this->model
            ->whereBetween('amount', [$minAmount, $maxAmount])
            ->get();
    }

    public function getOrderedByAmount(): Collection
    {
        return $this->model->orderBy('amount')->get();
    }

    public function getOrderedByType(): Collection
    {
        return $this->model->orderBy('type')->orderBy('name')->get();
    }

    public function getTuitionTariffs(): Collection
    {
        return $this->model->where('type', TariffType::TUITION->value)->get();
    }

    public function getActivityFeeTariffs(): Collection
    {
        return $this->model->where('type', TariffType::ACTIVITY_FEE->value)->get();
    }

    public function getTransportTariffs(): Collection
    {
        return $this->model->where('type', TariffType::TRANSPORT->value)->get();
    }

    public function getMealTariffs(): Collection
    {
        return $this->model->where('type', TariffType::MEAL->value)->get();
    }

    public function getOtherTariffs(): Collection
    {
        return $this->model->where('type', TariffType::OTHER->value)->get();
    }

    public function getPerTermTariffs(): Collection
    {
        return $this->model->where('billing_frequency', BillingFrequency::PER_TERM->value)->get();
    }

    public function getPerMonthTariffs(): Collection
    {
        return $this->model->where('billing_frequency', BillingFrequency::PER_MONTH->value)->get();
    }

    public function getPerYearTariffs(): Collection
    {
        return $this->model->where('billing_frequency', BillingFrequency::PER_YEAR->value)->get();
    }

    public function getOneTimeTariffs(): Collection
    {
        return $this->model->where('billing_frequency', BillingFrequency::ONE_TIME->value)->get();
    }

    public function getStatistics(): array
    {
        return [
            'total_tariffs' => $this->model->count(),
            'active_tariffs' => $this->model->where('is_active', true)->count(),
            'inactive_tariffs' => $this->model->where('is_active', false)->count(),
            'tuition_tariffs' => $this->model->where('type', TariffType::TUITION->value)->count(),
            'activity_fee_tariffs' => $this->model->where('type', TariffType::ACTIVITY_FEE->value)->count(),
            'transport_tariffs' => $this->model->where('type', TariffType::TRANSPORT->value)->count(),
            'meal_tariffs' => $this->model->where('type', TariffType::MEAL->value)->count(),
            'other_tariffs' => $this->model->where('type', TariffType::OTHER->value)->count(),
            'average_amount' => $this->model->avg('amount'),
            'total_amount' => $this->model->sum('amount'),
            'min_amount' => $this->model->min('amount'),
            'max_amount' => $this->model->max('amount'),
        ];
    }

    public function bulkActivate(array $tariffIds): int
    {
        return $this->model
            ->whereIn('id', $tariffIds)
            ->update(['is_active' => true]);
    }

    public function bulkDeactivate(array $tariffIds): int
    {
        return $this->model
            ->whereIn('id', $tariffIds)
            ->update(['is_active' => false]);
    }

    public function canBeDeleted(int $id): bool
    {
        $tariff = $this->findOrFail($id);
        return $tariff->classes()->count() === 0;
    }

    public function getUnassignedTariffs(): Collection
    {
        return $this->model
            ->whereDoesntHave('classes')
            ->get();
    }

    public function getAssignedTariffs(): Collection
    {
        return $this->model
            ->whereHas('classes')
            ->with('classes.grade')
            ->get();
    }

    public function attachToClass(int $tariffId, int $classId): void
    {
        $tariff = $this->findOrFail($tariffId);
        $tariff->classes()->attach($classId);
    }

    public function detachFromClass(int $tariffId, int $classId): void
    {
        $tariff = $this->findOrFail($tariffId);
        $tariff->classes()->detach($classId);
    }

    public function syncWithClasses(int $tariffId, array $classIds): void
    {
        $tariff = $this->findOrFail($tariffId);
        $tariff->classes()->sync($classIds);
    }
}
