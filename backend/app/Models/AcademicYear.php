<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AcademicYearStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AcademicYear extends Model
{
    /** @use HasFactory<\Database\Factories\AcademicYearFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'status',
        'description',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'status' => AcademicYearStatus::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships
    public function terms(): HasMany
    {
        return $this->hasMany(Term::class);
    }

    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', AcademicYearStatus::ACTIVE);
    }

    public function scopeClosed($query)
    {
        return $query->where('status', AcademicYearStatus::CLOSED);
    }

    public function scopeCurrent($query)
    {
        return $query->where('status', AcademicYearStatus::ACTIVE)
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now());
    }

    // Accessors & Mutators
    public function getIsActiveAttribute(): bool
    {
        return $this->status === AcademicYearStatus::ACTIVE;
    }

    public function getIsClosedAttribute(): bool
    {
        return $this->status === AcademicYearStatus::CLOSED;
    }

    public function getCanBeModifiedAttribute(): bool
    {
        return $this->status !== AcademicYearStatus::CLOSED;
    }

    // Business Logic Methods
    public function canBeClosed(): bool
    {
        return $this->status === AcademicYearStatus::ACTIVE &&
               $this->terms()->where('status', '!=', 'completed')->count() === 0;
    }

    public function close(): bool
    {
        if (!$this->canBeClosed()) {
            return false;
        }

        $this->status = AcademicYearStatus::CLOSED;
        return $this->save();
    }

    public function activate(): bool
    {
        if ($this->status === AcademicYearStatus::CLOSED) {
            return false;
        }

        // Deactivate other active academic years
        static::where('status', AcademicYearStatus::ACTIVE)
              ->where('id', '!=', $this->id)
              ->update(['status' => AcademicYearStatus::DRAFT]);

        $this->status = AcademicYearStatus::ACTIVE;
        return $this->save();
    }
}
