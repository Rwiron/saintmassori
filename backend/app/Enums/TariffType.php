<?php

declare(strict_types=1);

namespace App\Enums;

enum TariffType: string
{
    case TUITION = 'tuition';
    case ACTIVITY_FEE = 'activity_fee';
    case TRANSPORT = 'transport';
    case MEAL = 'meal';
    case OTHER = 'other';

    public function label(): string
    {
        return match($this) {
            self::TUITION => 'Tuition Fee',
            self::ACTIVITY_FEE => 'Activity Fee',
            self::TRANSPORT => 'Transport Fee',
            self::MEAL => 'Meal Fee',
            self::OTHER => 'Other Fee',
        };
    }

    public function description(): string
    {
        return match($this) {
            self::TUITION => 'Primary educational fees',
            self::ACTIVITY_FEE => 'Extracurricular activities and materials',
            self::TRANSPORT => 'School transportation services',
            self::MEAL => 'School meal programs',
            self::OTHER => 'Miscellaneous fees',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function options(): array
    {
        return array_map(
            fn(self $type) => [
                'value' => $type->value,
                'label' => $type->label(),
                'description' => $type->description(),
            ],
            self::cases()
        );
    }
}
