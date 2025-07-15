<?php

declare(strict_types=1);

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAdmins($query)
    {
        return $query->where('role', UserRole::ADMIN);
    }

    public function scopeTeachers($query)
    {
        return $query->where('role', UserRole::TEACHER);
    }

    public function scopeStudents($query)
    {
        return $query->where('role', UserRole::STUDENT);
    }

    public function scopeParents($query)
    {
        return $query->where('role', UserRole::PARENT);
    }

    // Accessors & Mutators
    public function getIsAdminAttribute(): bool
    {
        return $this->role === UserRole::ADMIN;
    }

    public function getIsTeacherAttribute(): bool
    {
        return $this->role === UserRole::TEACHER;
    }

    public function getIsStudentAttribute(): bool
    {
        return $this->role === UserRole::STUDENT;
    }

    public function getIsParentAttribute(): bool
    {
        return $this->role === UserRole::PARENT;
    }

    public function getRoleLabelAttribute(): string
    {
        return $this->role->label();
    }

    // Authorization methods
    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->role->permissions());
    }

    public function hasRole(UserRole $role): bool
    {
        return $this->role === $role;
    }

    public function hasAnyRole(array $roles): bool
    {
        return in_array($this->role, $roles);
    }

    public function canManageAcademicYears(): bool
    {
        return $this->hasPermission('manage_academic_years');
    }

    public function canManageStudents(): bool
    {
        return $this->hasPermission('manage_students');
    }

    public function canManageBills(): bool
    {
        return $this->hasPermission('manage_bills');
    }

    public function canViewReports(): bool
    {
        return $this->hasPermission('view_reports');
    }

    public function canPromoteStudents(): bool
    {
        return $this->hasPermission('promote_students');
    }

    // Business Logic Methods
    public function activate(): bool
    {
        $this->is_active = true;
        return $this->save();
    }

    public function deactivate(): bool
    {
        $this->is_active = false;
        return $this->save();
    }

    public function updateLastLogin(): bool
    {
        $this->last_login_at = now();
        return $this->save();
    }

    public function changeRole(UserRole $newRole): bool
    {
        $this->role = $newRole;
        return $this->save();
    }
}
