<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Student>
 */
class StudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $hasDisability = $this->faker->boolean(10); // 10% chance of having disability

        return [
            'student_id' => $this->faker->unique()->numerify('STU#####'),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'email' => $this->faker->unique()->safeEmail(),
            'date_of_birth' => $this->faker->dateTimeBetween('-18 years', '-5 years'),
            'gender' => $this->faker->randomElement(['male', 'female']),
            'phone' => $this->faker->phoneNumber(),
            'address' => $this->faker->address(),
            'parent_name' => $this->faker->name(),
            'parent_email' => $this->faker->safeEmail(),
            'parent_phone' => $this->faker->phoneNumber(),
            'father_name' => $this->faker->name('male'),
            'mother_name' => $this->faker->name('female'),
            'emergency_contact' => $this->faker->phoneNumber(),
            'enrollment_date' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'status' => $this->faker->randomElement(['active', 'inactive', 'graduated', 'transferred']),
            'medical_conditions' => $this->faker->optional(0.2)->sentence(),
            'allergies' => $this->faker->optional(0.15)->sentence(),
            'disability' => $hasDisability,
            'disability_description' => $hasDisability ? $this->faker->sentence() : null,
            'province' => $this->faker->randomElement(['Kigali', 'Eastern', 'Northern', 'Southern', 'Western']),
            'district' => $this->faker->randomElement(['Gasabo', 'Kicukiro', 'Nyarugenge', 'Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana']),
            'sector' => $this->faker->randomElement(['Kimironko', 'Remera', 'Kicukiro', 'Niboye', 'Nyarutarama', 'Kibagabaga']),
            'cell' => $this->faker->randomElement(['Nyarutarama', 'Kibagabaga', 'Kimihurura', 'Remera', 'Kacyiru']),
            'village' => $this->faker->randomElement(['Ubumwe', 'Ubwiyunge', 'Umudugudu', 'Amahoro', 'Ubwenge']),
        ];
    }
}
