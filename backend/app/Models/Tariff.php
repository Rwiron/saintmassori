<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BillingFrequency;
use App\Enums\TariffType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tariff extends Model
{
    /** @use HasFactory<\Database\Factories\TariffFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'amount',
        'billing_frequency',
        'type',
        'is_active',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'billing_frequency' => BillingFrequency::class,
        'type' => TariffType::class,
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships
    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(ClassModel::class, 'class_tariff', 'tariff_id', 'class_id')
                   ->withPivot('is_active')
                   ->withTimestamps();
    }

    public function activeClasses(): BelongsToMany
    {
        return $this->belongsToMany(ClassModel::class, 'class_tariff', 'tariff_id', 'class_id')
                   ->wherePivot('is_active', true)
                   ->withPivot('is_active')
                   ->withTimestamps();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, TariffType $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByFrequency($query, BillingFrequency $frequency)
    {
        return $query->where('billing_frequency', $frequency);
    }

    public function scopeTuition($query)
    {
        return $query->where('type', TariffType::TUITION);
    }

    public function scopeActivityFees($query)
    {
        return $query->where('type', TariffType::ACTIVITY_FEE);
    }

    public function scopeTransport($query)
    {
        return $query->where('type', TariffType::TRANSPORT);
    }

    public function scopeMeal($query)
    {
        return $query->where('type', TariffType::MEAL);
    }

    public function scopeOther($query)
    {
        return $query->where('type', TariffType::OTHER);
    }

    // Accessors & Mutators
    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount, 2);
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->name . ' (' . $this->type->label() . ')';
    }

    public function getFrequencyLabelAttribute(): string
    {
        return $this->billing_frequency->label();
    }

    public function getTypeLabelAttribute(): string
    {
        return $this->type->label();
    }

    public function getClassCountAttribute(): int
    {
        return $this->classes()->count();
    }

    public function getActiveClassCountAttribute(): int
    {
        return $this->activeClasses()->count();
    }

    // Business Logic Methods
    public function calculateAmountForPeriod(int $periods = 1): float
    {
        return $this->amount * $periods;
    }

    public function calculateTermAmount(): float
    {
        return match($this->billing_frequency) {
            BillingFrequency::PER_TERM => $this->amount,
            BillingFrequency::PER_MONTH => $this->amount * 4, // Assuming 4 months per term
            BillingFrequency::PER_YEAR => $this->amount / 3, // 3 terms per year
            BillingFrequency::ONE_TIME => $this->amount,
        };
    }

    public function calculateMonthlyAmount(): float
    {
        return match($this->billing_frequency) {
            BillingFrequency::PER_TERM => $this->amount / 4, // 4 months per term
            BillingFrequency::PER_MONTH => $this->amount,
            BillingFrequency::PER_YEAR => $this->amount / 12, // 12 months per year
            BillingFrequency::ONE_TIME => $this->amount,
        };
    }

    public function calculateYearlyAmount(): float
    {
        return match($this->billing_frequency) {
            BillingFrequency::PER_TERM => $this->amount * 3, // 3 terms per year
            BillingFrequency::PER_MONTH => $this->amount * 12, // 12 months per year
            BillingFrequency::PER_YEAR => $this->amount,
            BillingFrequency::ONE_TIME => $this->amount,
        };
    }

    public function canBeAssignedToClass(ClassModel $class): bool
    {
        return $this->is_active &&
               $class->is_active &&
               !$this->classes()->where('class_id', $class->id)->exists();
    }

    public function assignToClass(ClassModel $class): bool
    {
        if (!$this->canBeAssignedToClass($class)) {
            return false;
        }

        $this->classes()->attach($class->id, [
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return true;
    }

    public function removeFromClass(ClassModel $class): bool
    {
        return $this->classes()->detach($class->id) > 0;
    }

    public function assignToClasses(array $classIds): int
    {
        $attachData = [];
        $now = now();

        foreach ($classIds as $classId) {
            $class = ClassModel::find($classId);
            if ($class && $this->canBeAssignedToClass($class)) {
                $attachData[$classId] = [
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if (empty($attachData)) {
            return 0;
        }

        $this->classes()->attach($attachData);
        return count($attachData);
    }

    public function canBeDeleted(): bool
    {
        return $this->classes()->count() === 0;
    }

    public function deactivate(): bool
    {
        $this->is_active = false;

        // Also deactivate all class assignments
        $this->classes()->updateExistingPivot(
            $this->classes()->pluck('class_id')->toArray(),
            ['is_active' => false]
        );

        return $this->save();
    }

    public function activate(): bool
    {
        $this->is_active = true;
        return $this->save();
    }

    public function duplicate(string $newName): self
    {
        $duplicate = $this->replicate();
        $duplicate->name = $newName;
        $duplicate->is_active = false; // Start as inactive
        $duplicate->save();

        return $duplicate;
    }

    // Static helper methods
    public static function getByType(TariffType $type): \Illuminate\Database\Eloquent\Collection
    {
        return static::active()->byType($type)->get();
    }

    public static function getTuitionTariffs(): \Illuminate\Database\Eloquent\Collection
    {
        return static::active()->tuition()->get();
    }

    public static function getActivityTariffs(): \Illuminate\Database\Eloquent\Collection
    {
        return static::active()->activityFees()->get();
    }
}
