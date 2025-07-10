<?php

declare(strict_types=1);

namespace App\Enums;

enum TermStatus: string
{
    case UPCOMING = 'upcoming';
    case ACTIVE = 'active';
    case COMPLETED = 'completed';

    public function label(): string
    {
        return match($this) {
            self::UPCOMING => 'Upcoming',
            self::ACTIVE => 'Active',
            self::COMPLETED => 'Completed',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::UPCOMING => 'blue',
            self::ACTIVE => 'green',
            self::COMPLETED => 'gray',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function options(): array
    {
        return array_map(
            fn(self $status) => [
                'value' => $status->value,
                'label' => $status->label(),
                'color' => $status->color(),
            ],
            self::cases()
        );
    }
}
