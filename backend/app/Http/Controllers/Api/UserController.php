<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends BaseApiController
{
    /**
     * List all users with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::query();

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Filter by role
            if ($request->has('role') && $request->role) {
                $query->where('role', $request->role);
            }

            // Filter by status
            if ($request->has('status')) {
                $isActive = $request->status === 'active';
                $query->where('is_active', $isActive);
            }

            // Order by creation date (newest first)
            $query->orderBy('created_at', 'desc');

            $users = $query->get();

            $userData = $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->value,
                    'role_label' => $user->role_label,
                    'is_active' => $user->is_active,
                    'last_login_at' => $user->last_login_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                    'permissions' => $user->role->permissions(),
                ];
            });

            return $this->successResponse($userData, 'Users retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Failed to retrieve users', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Create a new user
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8|confirmed',
                'role' => ['required', Rule::in(array_column(UserRole::cases(), 'value'))],
                'is_active' => 'boolean',
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => UserRole::from($validated['role']),
                'is_active' => $validated['is_active'] ?? true,
            ]);

            Log::info('User created successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role->value,
                'created_by' => $request->user()->id
            ]);

            return $this->createdResponse([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'role_label' => $user->role_label,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'permissions' => $user->role->permissions(),
            ], 'User created successfully');

        } catch (ValidationException $e) {
            return $this->validationErrorResponse($e);
        } catch (\Exception $e) {
            Log::error('Failed to create user', [
                'error' => $e->getMessage(),
                'email' => $request->email ?? 'unknown',
                'created_by' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Get a specific user
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            return $this->successResponse([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'role_label' => $user->role_label,
                'is_active' => $user->is_active,
                'last_login_at' => $user->last_login_at,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'permissions' => $user->role->permissions(),
            ], 'User retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Failed to retrieve user', [
                'error' => $e->getMessage(),
                'user_id' => $id,
                'requested_by' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Update a user
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Prevent self-deactivation
            if ($user->id === $request->user()->id && $request->has('is_active') && !$request->is_active) {
                return $this->badRequestResponse('You cannot deactivate your own account');
            }

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
                'password' => 'sometimes|required|string|min:8|confirmed',
                'role' => ['sometimes', 'required', Rule::in(array_column(UserRole::cases(), 'value'))],
                'is_active' => 'sometimes|boolean',
            ]);

            // Hash password if provided
            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            // Convert role to enum if provided
            if (isset($validated['role'])) {
                $validated['role'] = UserRole::from($validated['role']);
            }

            $user->update($validated);

            Log::info('User updated successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'updated_fields' => array_keys($validated),
                'updated_by' => $request->user()->id
            ]);

            return $this->updatedResponse([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'role_label' => $user->role_label,
                'is_active' => $user->is_active,
                'last_login_at' => $user->last_login_at,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'permissions' => $user->role->permissions(),
            ], 'User updated successfully');

        } catch (ValidationException $e) {
            return $this->validationErrorResponse($e);
        } catch (\Exception $e) {
            Log::error('Failed to update user', [
                'error' => $e->getMessage(),
                'user_id' => $id,
                'updated_by' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Delete a user
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Prevent self-deletion
            if ($user->id === $request->user()->id) {
                return $this->badRequestResponse('You cannot delete your own account');
            }

            // Check if user has any associated records (implement based on your business logic)
            // For now, we'll allow deletion but you might want to add checks

            $userName = $user->name;
            $userEmail = $user->email;

            $user->delete();

            Log::info('User deleted successfully', [
                'user_id' => $id,
                'user_name' => $userName,
                'user_email' => $userEmail,
                'deleted_by' => $request->user()->id
            ]);

            return $this->successResponse(null, 'User deleted successfully');

        } catch (\Exception $e) {
            Log::error('Failed to delete user', [
                'error' => $e->getMessage(),
                'user_id' => $id,
                'deleted_by' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Activate a user
     */
    public function activate(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            if ($user->is_active) {
                return $this->badRequestResponse('User is already active');
            }

            $user->activate();

            Log::info('User activated successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'activated_by' => $request->user()->id
            ]);

            return $this->updatedResponse([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'role_label' => $user->role_label,
                'is_active' => $user->is_active,
                'updated_at' => $user->updated_at,
            ], 'User activated successfully');

        } catch (\Exception $e) {
            Log::error('Failed to activate user', [
                'error' => $e->getMessage(),
                'user_id' => $id,
                'activated_by' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Deactivate a user
     */
    public function deactivate(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Prevent self-deactivation
            if ($user->id === $request->user()->id) {
                return $this->badRequestResponse('You cannot deactivate your own account');
            }

            if (!$user->is_active) {
                return $this->badRequestResponse('User is already inactive');
            }

            $user->deactivate();

            // Revoke all tokens for the deactivated user
            $user->tokens()->delete();

            Log::info('User deactivated successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'deactivated_by' => $request->user()->id
            ]);

            return $this->updatedResponse([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'role_label' => $user->role_label,
                'is_active' => $user->is_active,
                'updated_at' => $user->updated_at,
            ], 'User deactivated successfully');

        } catch (\Exception $e) {
            Log::error('Failed to deactivate user', [
                'error' => $e->getMessage(),
                'user_id' => $id,
                'deactivated_by' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Get user statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $stats = [
                'total_users' => User::count(),
                'active_users' => User::where('is_active', true)->count(),
                'inactive_users' => User::where('is_active', false)->count(),
                'by_role' => [
                    'admin' => User::where('role', UserRole::ADMIN)->count(),
                    'teacher' => User::where('role', UserRole::TEACHER)->count(),
                    'student' => User::where('role', UserRole::STUDENT)->count(),
                    'parent' => User::where('role', UserRole::PARENT)->count(),
                ],
                'recent_logins' => User::whereNotNull('last_login_at')
                    ->where('last_login_at', '>=', now()->subDays(7))
                    ->count(),
                'never_logged_in' => User::whereNull('last_login_at')->count(),
            ];

            return $this->successResponse($stats, 'User statistics retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Failed to retrieve user statistics', [
                'error' => $e->getMessage(),
                'requested_by' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Get user roles and permissions
     */
    public function roles(Request $request): JsonResponse
    {
        try {
            $roles = UserRole::options();

            return $this->successResponse($roles, 'User roles retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Failed to retrieve user roles', [
                'error' => $e->getMessage(),
                'requested_by' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Bulk operations on users
     */
    public function bulkAction(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'action' => 'required|in:activate,deactivate,delete',
                'user_ids' => 'required|array|min:1',
                'user_ids.*' => 'required|integer|exists:users,id',
            ]);

            $action = $validated['action'];
            $userIds = $validated['user_ids'];
            $currentUserId = $request->user()->id;

            // Prevent actions on current user
            if (in_array($currentUserId, $userIds)) {
                return $this->badRequestResponse('You cannot perform bulk actions on your own account');
            }

            $users = User::whereIn('id', $userIds)->get();
            $results = [];

            foreach ($users as $user) {
                try {
                    switch ($action) {
                        case 'activate':
                            $user->activate();
                            $results[] = [
                                'user_id' => $user->id,
                                'name' => $user->name,
                                'status' => 'success',
                                'message' => 'User activated successfully'
                            ];
                            break;

                        case 'deactivate':
                            $user->deactivate();
                            $user->tokens()->delete(); // Revoke all tokens
                            $results[] = [
                                'user_id' => $user->id,
                                'name' => $user->name,
                                'status' => 'success',
                                'message' => 'User deactivated successfully'
                            ];
                            break;

                        case 'delete':
                            $user->delete();
                            $results[] = [
                                'user_id' => $user->id,
                                'name' => $user->name,
                                'status' => 'success',
                                'message' => 'User deleted successfully'
                            ];
                            break;
                    }
                } catch (\Exception $e) {
                    $results[] = [
                        'user_id' => $user->id,
                        'name' => $user->name,
                        'status' => 'error',
                        'message' => $e->getMessage()
                    ];
                }
            }

            $successCount = count(array_filter($results, fn($r) => $r['status'] === 'success'));
            $errorCount = count(array_filter($results, fn($r) => $r['status'] === 'error'));

            Log::info('Bulk user action completed', [
                'action' => $action,
                'total_users' => count($userIds),
                'successful' => $successCount,
                'errors' => $errorCount,
                'performed_by' => $currentUserId
            ]);

            return $this->successResponse([
                'action' => $action,
                'total_processed' => count($userIds),
                'successful' => $successCount,
                'errors' => $errorCount,
                'results' => $results
            ], "Bulk {$action} completed");

        } catch (ValidationException $e) {
            return $this->validationErrorResponse($e);
        } catch (\Exception $e) {
            Log::error('Failed to perform bulk user action', [
                'error' => $e->getMessage(),
                'performed_by' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }
}
