<?php

require_once 'vendor/autoload.php';

use App\Http\Controllers\Api\UserController;
use App\Models\User;
use Illuminate\Http\Request;

// Load Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== API Test ===" . PHP_EOL;

// Create a mock request
$request = new Request();

// Create an admin user to authenticate with
$adminUser = User::where('role', 'admin')->first();
if (!$adminUser) {
    echo "No admin user found!" . PHP_EOL;
    exit(1);
}

echo "Using admin user: {$adminUser->name} ({$adminUser->email})" . PHP_EOL;

// Set the authenticated user
$request->setUserResolver(function () use ($adminUser) {
    return $adminUser;
});

// Create controller instance
$controller = new UserController();

try {
    // Call the index method
    $response = $controller->index($request);
    
    echo "API Response Status: " . $response->getStatusCode() . PHP_EOL;
    
    $data = json_decode($response->getContent(), true);
    
    echo "Response Structure:" . PHP_EOL;
    echo "- success: " . ($data['success'] ? 'true' : 'false') . PHP_EOL;
    echo "- message: " . $data['message'] . PHP_EOL;
    echo "- data count: " . count($data['data']) . PHP_EOL;
    
    echo PHP_EOL . "Users in API response:" . PHP_EOL;
    foreach ($data['data'] as $user) {
        echo "- {$user['name']} ({$user['email']}) - Role: {$user['role']} - Active: " . ($user['is_active'] ? 'Yes' : 'No') . PHP_EOL;
    }
    
} catch (Exception $e) {
    echo "API Error: " . $e->getMessage() . PHP_EOL;
    echo "Stack trace: " . $e->getTraceAsString() . PHP_EOL;
} 