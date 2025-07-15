<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\TermStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Term extends Model
{
    /** @use HasFactory<\Database\Factories\TermFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'academic_year_id',
        'name',
        'start_date',
        'end_date',
        'status',
        'description',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'status' => TermStatus::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships
    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', TermStatus::ACTIVE);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('status', TermStatus::UPCOMING);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', TermStatus::COMPLETED);
    }

    public function scopeCurrent($query)
    {
        return $query->where('status', TermStatus::ACTIVE)
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now());
    }

    public function scopeByAcademicYear($query, int $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }

    // Accessors & Mutators
    public function getIsActiveAttribute(): bool
    {
        return $this->status === TermStatus::ACTIVE;
    }

    public function getIsCompletedAttribute(): bool
    {
        return $this->status === TermStatus::COMPLETED;
    }

    public function getFullNameAttribute(): string
    {
        return $this->academicYear->name . ' - ' . $this->name;
    }

    // Business Logic Methods
    public function canBeActivated(): bool
    {
        return $this->status === TermStatus::UPCOMING &&
               $this->academicYear->is_active;
    }

    public function canBeCompleted(): bool
    {
        return $this->status === TermStatus::ACTIVE &&
               now()->isAfter($this->end_date);
    }

    public function activate(): bool
    {
        if (!$this->canBeActivated()) {
            return false;
        }

        // Deactivate other active terms in the same academic year
        static::where('academic_year_id', $this->academic_year_id)
              ->where('status', TermStatus::ACTIVE)
              ->where('id', '!=', $this->id)
              ->update(['status' => TermStatus::COMPLETED]);

        $this->status = TermStatus::ACTIVE;
        return $this->save();
    }

    public function complete(): bool
    {
        if (!$this->canBeCompleted()) {
            return false;
        }

        $this->status = TermStatus::COMPLETED;
        return $this->save();
    }
}
