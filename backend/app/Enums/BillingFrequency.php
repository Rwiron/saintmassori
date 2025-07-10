<?php

declare(strict_types=1);

namespace App\Enums;

enum BillingFrequency: string
{
    case PER_TERM = 'per_term';
    case PER_MONTH = 'per_month';
    case PER_YEAR = 'per_year';
    case ONE_TIME = 'one_time';

    public function label(): string
    {
        return match($this) {
            self::PER_TERM => 'Per Term',
            self::PER_MONTH => 'Per Month',
            self::PER_YEAR => 'Per Year',
            self::ONE_TIME => 'One Time',
        };
    }

    public function multiplier(): int
    {
        return match($this) {
            self::PER_TERM => 3, // 3 terms per year
            self::PER_MONTH => 12, // 12 months per year
            self::PER_YEAR => 1, // 1 year
            self::ONE_TIME => 1, // One time payment
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function options(): array
    {
        return array_map(
            fn(self $frequency) => [
                'value' => $frequency->value,
                'label' => $frequency->label(),
                'multiplier' => $frequency->multiplier(),
            ],
            self::cases()
        );
    }
}
