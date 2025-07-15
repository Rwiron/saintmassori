<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tariff;
use App\Models\ClassModel;
use App\Models\AcademicYear;
use App\Enums\TariffType;
use App\Enums\BillingFrequency;

class TariffSeeder extends Seeder
{
    public function run(): void
    {
        // Get the current academic year
        $academicYear = AcademicYear::where('status', 'active')->first();

        if (!$academicYear) {
            $this->command->warn('No active academic year found. Please create an academic year first.');
            return;
        }

        // Get all classes
        $classes = ClassModel::all();

        if ($classes->isEmpty()) {
            $this->command->warn('No classes found. Please create classes first.');
            return;
        }

        // Create basic tariffs for each grade level
        $gradeTariffs = [
            'Nursery' => [
                'Tuition Fee' => 50000,
                'Feeding Fee' => 15000,
                'Transport Fee' => 10000,
            ],
            'Primary' => [
                'Tuition Fee' => 75000,
                'Feeding Fee' => 20000,
                'Transport Fee' => 15000,
                'Uniform Fee' => 25000,
            ],
        ];

        foreach ($classes as $class) {
            $gradeName = $class->grade->name;
            $gradeCategory = str_starts_with($gradeName, 'N') ? 'Nursery' : 'Primary';

            $tariffData = $gradeTariffs[$gradeCategory] ?? $gradeTariffs['Primary'];

            foreach ($tariffData as $tariffName => $amount) {
                // Determine tariff type based on name
                $tariffType = match($tariffName) {
                    'Tuition Fee' => TariffType::TUITION,
                    'Transport Fee' => TariffType::TRANSPORT,
                    'Feeding Fee' => TariffType::MEAL,
                    default => TariffType::OTHER,
                };

                $tariff = Tariff::create([
                    'name' => $tariffName,
                    'description' => $tariffName . ' for ' . $class->full_name,
                    'amount' => $amount,
                    'type' => $tariffType,
                    'billing_frequency' => BillingFrequency::PER_TERM,
                    'is_active' => true,
                ]);

                // Assign tariff to the class
                $class->tariffs()->attach($tariff->id);

                $this->command->info("Created tariff: {$tariffName} for {$class->full_name} - {$amount} RWF");
            }
        }

        $this->command->info('Tariff seeding completed successfully!');
    }
}
