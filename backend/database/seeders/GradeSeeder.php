<?php

namespace Database\Seeders;

use App\Models\Grade;
use App\Models\ClassModel;
use Illuminate\Database\Seeder;

class GradeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $grades = [
            [
                'name' => 'N1',
                'display_name' => 'Nursery 1',
                'level' => 1,
                'description' => 'Nursery level 1 for children aged 3-4 years',
                'is_active' => true,
                'classes' => ['A', 'B']
            ],
            [
                'name' => 'P1',
                'display_name' => 'Primary 1',
                'level' => 2,
                'description' => 'Primary level 1 for children aged 5-6 years',
                'is_active' => true,
                'classes' => ['A', 'B', 'C']
            ],
            [
                'name' => 'P2',
                'display_name' => 'Primary 2',
                'level' => 3,
                'description' => 'Primary level 2 for children aged 6-7 years',
                'is_active' => true,
                'classes' => ['A', 'B', 'C']
            ],
            [
                'name' => 'P3',
                'display_name' => 'Primary 3',
                'level' => 4,
                'description' => 'Primary level 3 for children aged 7-8 years',
                'is_active' => true,
                'classes' => ['A', 'B', 'C']
            ],
            [
                'name' => 'P4',
                'display_name' => 'Primary 4',
                'level' => 5,
                'description' => 'Primary level 4 for children aged 8-9 years',
                'is_active' => true,
                'classes' => ['A', 'B']
            ],
            [
                'name' => 'P5',
                'display_name' => 'Primary 5',
                'level' => 6,
                'description' => 'Primary level 5 for children aged 9-10 years',
                'is_active' => true,
                'classes' => ['A', 'B']
            ],
            [
                'name' => 'P6',
                'display_name' => 'Primary 6',
                'level' => 7,
                'description' => 'Primary level 6 for children aged 10-11 years',
                'is_active' => true,
                'classes' => ['A', 'B']
            ],
        ];

        foreach ($grades as $gradeData) {
            $classNames = $gradeData['classes'];
            unset($gradeData['classes']);

            // Create the grade
            $grade = Grade::create($gradeData);

            // Create classes for this grade
            foreach ($classNames as $className) {
                ClassModel::create([
                    'grade_id' => $grade->id,
                    'name' => $className,
                    'full_name' => $grade->name . $className, // e.g., "N1A", "P1B"
                    'capacity' => 30,
                    'current_enrollment' => 0,
                    'description' => "Class {$className} for {$grade->display_name}",
                    'is_active' => true,
                ]);
            }

            $this->command->info("Created grade {$grade->name} with " . count($classNames) . " classes");
        }

        $this->command->info('Grade seeding completed successfully!');
    }
}
