<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case TEACHER = 'teacher';
    case STUDENT = 'student';
    case PARENT = 'parent';

    public function label(): string
    {
        return match($this) {
            self::ADMIN => 'Administrator',
            self::TEACHER => 'Teacher',
            self::STUDENT => 'Student',
            self::PARENT => 'Parent',
        };
    }

    public function permissions(): array
    {
        return match($this) {
            self::ADMIN => [
                'manage_academic_years',
                'manage_terms',
                'manage_grades',
                'manage_classes',
                'manage_students',
                'manage_tariffs',
                'manage_bills',
                'view_reports',
                'promote_students',
            ],
            self::TEACHER => [
                'view_classes',
                'view_students',
                'view_reports',
            ],
            self::STUDENT => [
                'view_own_profile',
                'view_own_bills',
                'view_own_class',
            ],
            self::PARENT => [
                'view_child_profile',
                'view_child_bills',
                'view_child_class',
            ],
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function options(): array
    {
        return array_map(
            fn(self $role) => [
                'value' => $role->value,
                'label' => $role->label(),
                'permissions' => $role->permissions(),
            ],
            self::cases()
        );
    }
}
