<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClassModel extends Model
{
    /** @use HasFactory<\Database\Factories\ClassModelFactory> */
    use HasFactory, SoftDeletes;

    protected $table = 'classes';

    protected $fillable = [
        'grade_id',
        'name',
        'full_name',
        'capacity',
        'current_enrollment',
        'description',
        'is_active',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'current_enrollment' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships
    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'class_id');
    }

    public function activeStudents(): HasMany
    {
        return $this->hasMany(Student::class, 'class_id')
                   ->where('status', 'active');
    }

    public function tariffs(): BelongsToMany
    {
        return $this->belongsToMany(Tariff::class, 'class_tariff', 'class_id', 'tariff_id')
                   ->withPivot('is_active')
                   ->withTimestamps();
    }

    public function activeTariffs(): BelongsToMany
    {
        return $this->belongsToMany(Tariff::class, 'class_tariff', 'class_id', 'tariff_id')
                   ->wherePivot('is_active', true)
                   ->withPivot('is_active')
                   ->withTimestamps();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeWithGrade($query)
    {
        return $query->with('grade');
    }

    public function scopeByGrade($query, int $gradeId)
    {
        return $query->where('grade_id', $gradeId);
    }

    public function scopeWithAvailableSpace($query)
    {
        return $query->whereColumn('current_enrollment', '<', 'capacity');
    }

    // Accessors & Mutators
    public function getAvailableSpaceAttribute(): int
    {
        return $this->capacity - $this->current_enrollment;
    }

    public function getIsFullAttribute(): bool
    {
        return $this->current_enrollment >= $this->capacity;
    }

    public function getOccupancyRateAttribute(): float
    {
        if ($this->capacity === 0) {
            return 0;
        }
        return round(($this->current_enrollment / $this->capacity) * 100, 2);
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->full_name . ' (' . $this->grade->display_name . ')';
    }

    public function getTotalTariffAmountAttribute(): float
    {
        return $this->activeTariffs()->sum('amount');
    }

    // Business Logic Methods
    public function canAcceptStudent(): bool
    {
        return $this->is_active &&
               $this->current_enrollment < $this->capacity;
    }

    public function addStudent(Student $student): bool
    {
        if (!$this->canAcceptStudent()) {
            return false;
        }

        $student->class_id = $this->id;
        $student->save();

        $this->increment('current_enrollment');

        return true;
    }

    public function removeStudent(Student $student): bool
    {
        if ($student->class_id !== $this->id) {
            return false;
        }

        $student->class_id = null;
        $student->save();

        $this->decrement('current_enrollment');

        return true;
    }

    public function assignTariff(Tariff $tariff): bool
    {
        if (!$tariff->is_active) {
            return false;
        }

        $this->tariffs()->attach($tariff->id, [
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return true;
    }

    public function removeTariff(Tariff $tariff): bool
    {
        return $this->tariffs()->detach($tariff->id) > 0;
    }

    public function syncEnrollmentCount(): void
    {
        $actualCount = $this->students()->count();
        $this->update(['current_enrollment' => $actualCount]);
    }

    public function canBeDeleted(): bool
    {
        return $this->students()->count() === 0;
    }

    public function deactivate(): bool
    {
        if (!$this->canBeDeleted()) {
            return false;
        }

        $this->is_active = false;
        return $this->save();
    }

    public function activate(): bool
    {
        $this->is_active = true;
        return $this->save();
    }

    // Boot method for model events
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($class) {
            // Auto-generate full_name if not provided
            if (empty($class->full_name) && $class->grade && $class->name) {
                $class->full_name = $class->grade->name . $class->name;
            }
        });
    }
}
