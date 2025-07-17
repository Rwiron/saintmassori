<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserService
{
    /**
     * Get all users with optional filtering
     */
    public function getAllUsers(array $filters = []): Collection
    {
        $query = User::query();

        // Apply search filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Apply role filter
        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        // Apply status filter
        if (isset($filters['status'])) {
            $isActive = $filters['status'] === 'active';
            $query->where('is_active', $isActive);
        }

        // Order by creation date (newest first)
        $query->orderBy('created_at', 'desc');

        return $query->get();
    }

    /**
     * Create a new user
     */
    public function createUser(array $userData): User
    {
        $userData['password'] = Hash::make($userData['password']);
        $userData['role'] = UserRole::from($userData['role']);
        $userData['is_active'] = $userData['is_active'] ?? true;

        $user = User::create($userData);

        Log::info('User created via UserService', [
            'user_id' => $user->id,
            'email' => $user->email,
            'role' => $user->role->value
        ]);

        return $user;
    }

    /**
     * Update a user
     */
    public function updateUser(User $user, array $userData): User
    {
        // Hash password if provided
        if (isset($userData['password'])) {
            $userData['password'] = Hash::make($userData['password']);
        }

        // Convert role to enum if provided
        if (isset($userData['role'])) {
            $userData['role'] = UserRole::from($userData['role']);
        }

        $user->update($userData);

        Log::info('User updated via UserService', [
            'user_id' => $user->id,
            'email' => $user->email,
            'updated_fields' => array_keys($userData)
        ]);

        return $user->fresh();
    }

    /**
     * Delete a user
     */
    public function deleteUser(User $user): bool
    {
        $userId = $user->id;
        $userEmail = $user->email;

        // Check if user has any associated records
        $canDelete = $this->canDeleteUser($user);

        if (!$canDelete['can_delete']) {
            throw new \Exception($canDelete['message']);
        }

        // Revoke all tokens before deletion
        $user->tokens()->delete();

        $deleted = $user->delete();

        if ($deleted) {
            Log::info('User deleted via UserService', [
                'user_id' => $userId,
                'user_email' => $userEmail
            ]);
        }

        return $deleted;
    }

    /**
     * Activate a user
     */
    public function activateUser(User $user): User
    {
        if ($user->is_active) {
            throw new \Exception('User is already active');
        }

        $user->activate();

        Log::info('User activated via UserService', [
            'user_id' => $user->id,
            'email' => $user->email
        ]);

        return $user->fresh();
    }

    /**
     * Deactivate a user
     */
    public function deactivateUser(User $user): User
    {
        if (!$user->is_active) {
            throw new \Exception('User is already inactive');
        }

        $user->deactivate();

        // Revoke all tokens for the deactivated user
        $user->tokens()->delete();

        Log::info('User deactivated via UserService', [
            'user_id' => $user->id,
            'email' => $user->email
        ]);

        return $user->fresh();
    }

    /**
     * Get user statistics
     */
    public function getUserStatistics(): array
    {
        return [
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
    }

    /**
     * Get available user roles
     */
    public function getUserRoles(): array
    {
        return UserRole::options();
    }

    /**
     * Perform bulk action on users
     */
    public function bulkAction(string $action, array $userIds, int $currentUserId): array
    {
        // Prevent actions on current user
        if (in_array($currentUserId, $userIds)) {
            throw new \Exception('You cannot perform bulk actions on your own account');
        }

        $users = User::whereIn('id', $userIds)->get();
        $results = [];

        foreach ($users as $user) {
            try {
                switch ($action) {
                    case 'activate':
                        $this->activateUser($user);
                        $results[] = [
                            'user_id' => $user->id,
                            'name' => $user->name,
                            'status' => 'success',
                            'message' => 'User activated successfully'
                        ];
                        break;

                    case 'deactivate':
                        $this->deactivateUser($user);
                        $results[] = [
                            'user_id' => $user->id,
                            'name' => $user->name,
                            'status' => 'success',
                            'message' => 'User deactivated successfully'
                        ];
                        break;

                    case 'delete':
                        $this->deleteUser($user);
                        $results[] = [
                            'user_id' => $user->id,
                            'name' => $user->name,
                            'status' => 'success',
                            'message' => 'User deleted successfully'
                        ];
                        break;

                    default:
                        throw new \Exception('Invalid bulk action');
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

        Log::info('Bulk user action completed via UserService', [
            'action' => $action,
            'total_users' => count($userIds),
            'successful' => $successCount,
            'errors' => $errorCount,
            'performed_by' => $currentUserId
        ]);

        return [
            'action' => $action,
            'total_processed' => count($userIds),
            'successful' => $successCount,
            'errors' => $errorCount,
            'results' => $results
        ];
    }

    /**
     * Check if a user can be deleted
     */
    public function canDeleteUser(User $user): array
    {
        // Add your business logic here to check if user has associated records
        // For example, check if user has created students, bills, etc.

        // For now, we'll allow deletion of all users except admins if they're the only admin
        if ($user->role === UserRole::ADMIN) {
            $adminCount = User::where('role', UserRole::ADMIN)->where('is_active', true)->count();
            if ($adminCount <= 1) {
                return [
                    'can_delete' => false,
                    'message' => 'Cannot delete the last active administrator'
                ];
            }
        }

        return [
            'can_delete' => true,
            'message' => 'User can be deleted'
        ];
    }

    /**
     * Check if a user can be deactivated
     */
    public function canDeactivateUser(User $user, int $currentUserId): array
    {
        // Prevent self-deactivation
        if ($user->id === $currentUserId) {
            return [
                'can_deactivate' => false,
                'message' => 'You cannot deactivate your own account'
            ];
        }

        // Check if user is already inactive
        if (!$user->is_active) {
            return [
                'can_deactivate' => false,
                'message' => 'User is already inactive'
            ];
        }

        // Prevent deactivating the last admin
        if ($user->role === UserRole::ADMIN) {
            $activeAdminCount = User::where('role', UserRole::ADMIN)->where('is_active', true)->count();
            if ($activeAdminCount <= 1) {
                return [
                    'can_deactivate' => false,
                    'message' => 'Cannot deactivate the last active administrator'
                ];
            }
        }

        return [
            'can_deactivate' => true,
            'message' => 'User can be deactivated'
        ];
    }

    /**
     * Get users by role
     */
    public function getUsersByRole(UserRole $role): Collection
    {
        return User::where('role', $role)->orderBy('name')->get();
    }

    /**
     * Get active users only
     */
    public function getActiveUsers(): Collection
    {
        return User::where('is_active', true)->orderBy('name')->get();
    }

    /**
     * Get inactive users only
     */
    public function getInactiveUsers(): Collection
    {
        return User::where('is_active', false)->orderBy('name')->get();
    }

    /**
     * Search users by name or email
     */
    public function searchUsers(string $query): Collection
    {
        return User::where(function ($q) use ($query) {
            $q->where('name', 'like', "%{$query}%")
              ->orWhere('email', 'like', "%{$query}%");
        })->orderBy('name')->get();
    }

    /**
     * Get recently logged in users
     */
    public function getRecentlyLoggedInUsers(int $days = 7): Collection
    {
        return User::whereNotNull('last_login_at')
            ->where('last_login_at', '>=', now()->subDays($days))
            ->orderBy('last_login_at', 'desc')
            ->get();
    }

    /**
     * Get users who never logged in
     */
    public function getUsersNeverLoggedIn(): Collection
    {
        return User::whereNull('last_login_at')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Change user password
     */
    public function changeUserPassword(User $user, string $newPassword): User
    {
        $user->update([
            'password' => Hash::make($newPassword)
        ]);

        // Optionally revoke all tokens to force re-login
        $user->tokens()->delete();

        Log::info('User password changed via UserService', [
            'user_id' => $user->id,
            'email' => $user->email
        ]);

        return $user->fresh();
    }

    /**
     * Change user role
     */
    public function changeUserRole(User $user, UserRole $newRole): User
    {
        $oldRole = $user->role;

        // Prevent removing the last admin
        if ($oldRole === UserRole::ADMIN && $newRole !== UserRole::ADMIN) {
            $adminCount = User::where('role', UserRole::ADMIN)->where('is_active', true)->count();
            if ($adminCount <= 1) {
                throw new \Exception('Cannot change role of the last active administrator');
            }
        }

        $user->changeRole($newRole);

        Log::info('User role changed via UserService', [
            'user_id' => $user->id,
            'email' => $user->email,
            'old_role' => $oldRole->value,
            'new_role' => $newRole->value
        ]);

        return $user->fresh();
    }
}
