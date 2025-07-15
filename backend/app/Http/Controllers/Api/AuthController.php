<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends BaseApiController
{
    /**
     * Register a new user
     */
    public function register(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8|confirmed',
                'role' => ['required', Rule::in(array_column(UserRole::cases(), 'value'))],
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => UserRole::from($validated['role']),
                'is_active' => true,
                'last_login_at' => now(),
            ]);

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;

            Log::info('User registered successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role->value
            ]);

            return $this->createdResponse([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->value,
                    'role_label' => $user->role_label,
                    'is_active' => $user->is_active,
                    'permissions' => $user->role->permissions(),
                ],
                'token' => $token,
                'token_type' => 'Bearer',
            ], 'User registered successfully');

        } catch (ValidationException $e) {
            return $this->validationErrorResponse($e);
        } catch (\Exception $e) {
            Log::error('Registration failed', [
                'error' => $e->getMessage(),
                'email' => $request->email ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Login user
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
                'remember' => 'boolean',
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (!$user || !Hash::check($validated['password'], $user->password)) {
                return $this->unauthorizedResponse('Invalid credentials');
            }

            if (!$user->is_active) {
                return $this->forbiddenResponse('Account is inactive. Please contact administrator.');
            }

            // Update last login
            $user->updateLastLogin();

            // Create token
            $tokenName = ($validated['remember'] ?? false) ? 'remember_token' : 'auth_token';
            $token = $user->createToken($tokenName)->plainTextToken;

            Log::info('User logged in successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role->value,
                'remember' => $validated['remember'] ?? false
            ]);

            return $this->successResponse([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->value,
                    'role_label' => $user->role_label,
                    'is_active' => $user->is_active,
                    'last_login_at' => $user->last_login_at,
                    'permissions' => $user->role->permissions(),
                ],
                'token' => $token,
                'token_type' => 'Bearer',
            ], 'Login successful');

        } catch (ValidationException $e) {
            return $this->validationErrorResponse($e);
        } catch (\Exception $e) {
            Log::error('Login failed', [
                'error' => $e->getMessage(),
                'email' => $request->email ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->unauthorizedResponse('User not authenticated');
            }

            // Revoke current token
            $request->user()->currentAccessToken()->delete();

            Log::info('User logged out successfully', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return $this->successResponse(null, 'Logout successful');

        } catch (\Exception $e) {
            Log::error('Logout failed', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Logout from all devices
     */
    public function logoutAll(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->unauthorizedResponse('User not authenticated');
            }

            // Revoke all tokens
            $user->tokens()->delete();

            Log::info('User logged out from all devices', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return $this->successResponse(null, 'Logged out from all devices successfully');

        } catch (\Exception $e) {
            Log::error('Logout all failed', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Get current user profile
     */
    public function profile(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->unauthorizedResponse('User not authenticated');
            }

            return $this->successResponse([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->value,
                    'role_label' => $user->role_label,
                    'is_active' => $user->is_active,
                    'last_login_at' => $user->last_login_at,
                    'created_at' => $user->created_at,
                    'permissions' => $user->role->permissions(),
                ],
            ], 'User profile retrieved successfully');

        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->unauthorizedResponse('User not authenticated');
            }

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
                'current_password' => 'required_with:password|string',
                'password' => 'sometimes|required|string|min:8|confirmed',
            ]);

            // Verify current password if changing password
            if (isset($validated['password'])) {
                if (!Hash::check($validated['current_password'], $user->password)) {
                    return $this->badRequestResponse('Current password is incorrect');
                }
                $validated['password'] = Hash::make($validated['password']);
            }

            // Remove current_password from update data
            unset($validated['current_password']);

            $user->update($validated);

            Log::info('User profile updated', [
                'user_id' => $user->id,
                'email' => $user->email,
                'updated_fields' => array_keys($validated)
            ]);

            return $this->updatedResponse([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->value,
                    'role_label' => $user->role_label,
                    'is_active' => $user->is_active,
                    'last_login_at' => $user->last_login_at,
                    'permissions' => $user->role->permissions(),
                ],
            ], 'Profile updated successfully');

        } catch (ValidationException $e) {
            return $this->validationErrorResponse($e);
        } catch (\Exception $e) {
            Log::error('Profile update failed', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->unauthorizedResponse('User not authenticated');
            }

            $validated = $request->validate([
                'current_password' => 'required|string',
                'password' => 'required|string|min:8|confirmed',
            ]);

            if (!Hash::check($validated['current_password'], $user->password)) {
                return $this->badRequestResponse('Current password is incorrect');
            }

            $user->update([
                'password' => Hash::make($validated['password'])
            ]);

            // Optionally logout from all other devices
            if ($request->boolean('logout_other_devices')) {
                $currentToken = $user->currentAccessToken();
                $user->tokens()->where('id', '!=', $currentToken->id)->delete();
            }

            Log::info('User password changed', [
                'user_id' => $user->id,
                'email' => $user->email,
                'logout_other_devices' => $request->boolean('logout_other_devices')
            ]);

            return $this->successResponse(null, 'Password changed successfully');

        } catch (ValidationException $e) {
            return $this->validationErrorResponse($e);
        } catch (\Exception $e) {
            Log::error('Password change failed', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }

    /**
     * Get user permissions
     */
    public function permissions(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->unauthorizedResponse('User not authenticated');
            }

            return $this->successResponse([
                'role' => $user->role->value,
                'role_label' => $user->role_label,
                'permissions' => $user->role->permissions(),
                'can_manage_academic_years' => $user->canManageAcademicYears(),
                'can_manage_students' => $user->canManageStudents(),
                'can_manage_bills' => $user->canManageBills(),
                'can_view_reports' => $user->canViewReports(),
                'can_promote_students' => $user->canPromoteStudents(),
            ], 'User permissions retrieved successfully');

        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Refresh token
     */
    public function refresh(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->unauthorizedResponse('User not authenticated');
            }

            // Delete current token
            $request->user()->currentAccessToken()->delete();

            // Create new token
            $token = $user->createToken('auth_token')->plainTextToken;

            Log::info('Token refreshed', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return $this->successResponse([
                'token' => $token,
                'token_type' => 'Bearer',
            ], 'Token refreshed successfully');

        } catch (\Exception $e) {
            Log::error('Token refresh failed', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id ?? 'unknown'
            ]);
            return $this->handleException($e);
        }
    }
}
