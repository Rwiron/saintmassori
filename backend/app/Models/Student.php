<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\StudentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    /** @use HasFactory<\Database\Factories\StudentFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_id',
        'first_name',
        'last_name',
        'email',
        'date_of_birth',
        'gender',
        'phone',
        'address',
        'parent_name',
        'parent_email',
        'parent_phone',
        'father_name',
        'mother_name',
        'emergency_contact',
        'class_id',
        'enrollment_date',
        'status',
        'medical_conditions',
        'allergies',
        'disability',
        'disability_description',
        'province',
        'district',
        'sector',
        'cell',
        'village',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'enrollment_date' => 'date',
        'status' => StudentStatus::class,
        'disability' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships
    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class);
    }

    public function pendingBills(): HasMany
    {
        return $this->hasMany(Bill::class)
                   ->where('status', 'pending');
    }

    public function paidBills(): HasMany
    {
        return $this->hasMany(Bill::class)
                   ->where('status', 'paid');
    }

    public function overdueBills(): HasMany
    {
        return $this->hasMany(Bill::class)
                   ->where('status', 'overdue');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', StudentStatus::ACTIVE);
    }

    public function scopeInactive($query)
    {
        return $query->where('status', StudentStatus::INACTIVE);
    }

    public function scopeGraduated($query)
    {
        return $query->where('status', StudentStatus::GRADUATED);
    }

    public function scopeTransferred($query)
    {
        return $query->where('status', StudentStatus::TRANSFERRED);
    }

    public function scopeByClass($query, int $classId)
    {
        return $query->where('class_id', $classId);
    }

    public function scopeWithoutClass($query)
    {
        return $query->whereNull('class_id');
    }

    public function scopeByGrade($query, int $gradeId)
    {
        return $query->whereHas('class', function ($q) use ($gradeId) {
            $q->where('grade_id', $gradeId);
        });
    }

    // Accessors & Mutators
    public function getFullNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    public function getAgeAttribute(): int
    {
        return $this->date_of_birth->age;
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === StudentStatus::ACTIVE;
    }

    public function getHasClassAttribute(): bool
    {
        return !is_null($this->class_id);
    }

    public function getCurrentGradeAttribute(): ?Grade
    {
        return $this->class?->grade;
    }

    public function getTotalBillAmountAttribute(): float
    {
        return $this->bills()->sum('total_amount');
    }

    public function getTotalPaidAmountAttribute(): float
    {
        return $this->bills()->sum('paid_amount');
    }

    public function getTotalOutstandingAmountAttribute(): float
    {
        return $this->bills()->sum('balance');
    }

    public function getHasOutstandingBillsAttribute(): bool
    {
        return $this->bills()->where('balance', '>', 0)->exists();
    }

    // Business Logic Methods
    public function canBeAssignedToClass(ClassModel $class): bool
    {
        return $this->is_active &&
               $class->canAcceptStudent() &&
               is_null($this->class_id);
    }

    public function assignToClass(ClassModel $class): bool
    {
        if (!$this->canBeAssignedToClass($class)) {
            return false;
        }

        $this->class_id = $class->id;
        $this->save();

        $class->increment('current_enrollment');

        return true;
    }

    public function removeFromClass(): bool
    {
        if (!$this->has_class) {
            return false;
        }

        $currentClass = $this->class;
        $this->class_id = null;
        $this->save();

        $currentClass->decrement('current_enrollment');

        return true;
    }

    public function transferToClass(ClassModel $newClass): bool
    {
        if (!$newClass->canAcceptStudent()) {
            return false;
        }

        $oldClass = $this->class;

        // Remove from old class
        if ($oldClass) {
            $oldClass->decrement('current_enrollment');
        }

        // Add to new class
        $this->class_id = $newClass->id;
        $this->save();

        $newClass->increment('current_enrollment');

        return true;
    }

    public function canBePromoted(): bool
    {
        return $this->is_active &&
               $this->has_class &&
               $this->current_grade?->next_grade !== null;
    }

    public function promoteToGrade(Grade $grade, ?ClassModel $class = null): bool
    {
        if (!$this->canBePromoted()) {
            return false;
        }

        $oldClass = $this->class;

        // If specific class provided, use it; otherwise find available class in the grade
        if ($class) {
            if (!$class->canAcceptStudent() || $class->grade_id !== $grade->id) {
                return false;
            }
        } else {
            $class = $grade->activeClasses()
                          ->withAvailableSpace()
                          ->first();

            if (!$class) {
                return false;
            }
        }

        // Remove from old class
        if ($oldClass) {
            $oldClass->decrement('current_enrollment');
        }

        // Add to new class
        $this->class_id = $class->id;
        $this->save();

        $class->increment('current_enrollment');

        return true;
    }

    public function graduate(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        // Remove from class
        if ($this->has_class) {
            $this->class->decrement('current_enrollment');
        }

        $this->status = StudentStatus::GRADUATED;
        $this->class_id = null;

        return $this->save();
    }

    public function transfer(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        // Remove from class
        if ($this->has_class) {
            $this->class->decrement('current_enrollment');
        }

        $this->status = StudentStatus::TRANSFERRED;
        $this->class_id = null;

        return $this->save();
    }

    public function deactivate(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        // Remove from class
        if ($this->has_class) {
            $this->class->decrement('current_enrollment');
        }

        $this->status = StudentStatus::INACTIVE;
        $this->class_id = null;

        return $this->save();
    }

    public function reactivate(): bool
    {
        if ($this->is_active) {
            return false;
        }

        $this->status = StudentStatus::ACTIVE;
        return $this->save();
    }

    // Boot method for model events
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($student) {
            // Auto-generate student ID if not provided
            if (empty($student->student_id)) {
                $student->student_id = 'STU' . str_pad(
                    (string)((static::max('id') ?? 0) + 1),
                    6,
                    '0',
                    STR_PAD_LEFT
                );
            }
        });
    }
}
