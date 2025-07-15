<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Grade extends Model
{
    /** @use HasFactory<\Database\Factories\GradeFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'display_name',
        'level',
        'description',
        'is_active',
    ];

    protected $casts = [
        'level' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships
    public function classes(): HasMany
    {
        return $this->hasMany(ClassModel::class);
    }

    public function activeClasses(): HasMany
    {
        return $this->hasMany(ClassModel::class)->where('is_active', true);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrderByLevel($query)
    {
        return $query->orderBy('level');
    }

    // Accessors & Mutators
    public function getStudentCountAttribute(): int
    {
        return $this->classes()
                   ->withCount('students')
                   ->get()
                   ->sum('students_count');
    }

    public function getClassCountAttribute(): int
    {
        return $this->classes()->count();
    }

    public function getActiveClassCountAttribute(): int
    {
        return $this->activeClasses()->count();
    }

    public function getNextGradeAttribute(): ?Grade
    {
        return static::where('level', $this->level + 1)
                    ->where('is_active', true)
                    ->first();
    }

    public function getPreviousGradeAttribute(): ?Grade
    {
        return static::where('level', $this->level - 1)
                    ->where('is_active', true)
                    ->first();
    }

    // Business Logic Methods
    public function canBeDeleted(): bool
    {
        return $this->classes()->count() === 0;
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

    public function createClass(string $name, array $attributes = []): ClassModel
    {
        $fullName = $this->name . $name; // e.g., "P1A"

        return $this->classes()->create(array_merge([
            'name' => $name,
            'full_name' => $fullName,
        ], $attributes));
    }
}
