<?php

require_once 'vendor/autoload.php';

use App\Models\User;
use App\Enums\UserRole;

// Load Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== User Management Test ===" . PHP_EOL;

// Count users
$userCount = User::count();
echo "Total users in database: " . $userCount . PHP_EOL;

// List all users
echo PHP_EOL . "All users:" . PHP_EOL;
User::all()->each(function($user) {
    echo "- {$user->name} ({$user->email}) - Role: {$user->role->value} - Active: " . ($user->is_active ? 'Yes' : 'No') . PHP_EOL;
});

// Test creating a new user
echo PHP_EOL . "Creating test user..." . PHP_EOL;
try {
    $testUser = User::create([
        'name' => 'API Test User',
        'email' => 'apitest@example.com',
        'password' => bcrypt('password123'),
        'role' => UserRole::ADMIN,
        'is_active' => true,
    ]);

    echo "✓ Successfully created: {$testUser->name} ({$testUser->email})" . PHP_EOL;
} catch (Exception $e) {
    echo "✗ Failed to create user: " . $e->getMessage() . PHP_EOL;
}

echo PHP_EOL . "Final user count: " . User::count() . PHP_EOL;
