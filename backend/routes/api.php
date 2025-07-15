<?php

use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\StudentImportController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\TariffController;
use App\Http\Controllers\Api\TermController;
use App\Http\Controllers\Api\GradeController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authentication Routes (Public)
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Protected auth routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::get('/permissions', [AuthController::class, 'permissions']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });
});

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {

    // User info route
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Academic Year Routes
    Route::prefix('academic-years')->group(function () {
        Route::get('/', [AcademicYearController::class, 'index']);
        Route::post('/', [AcademicYearController::class, 'store']);
        Route::get('/current', [AcademicYearController::class, 'current']);
        Route::get('/active', [AcademicYearController::class, 'active']);
        Route::get('/{id}', [AcademicYearController::class, 'show']);
        Route::put('/{id}', [AcademicYearController::class, 'update']);
        Route::delete('/{id}', [AcademicYearController::class, 'destroy']);
        Route::post('/{id}/activate', [AcademicYearController::class, 'activate']);
        Route::post('/{id}/close', [AcademicYearController::class, 'close']);
        Route::get('/{id}/statistics', [AcademicYearController::class, 'statistics']);
        Route::get('/{id}/can-close', [AcademicYearController::class, 'canClose']);
        Route::get('/{id}/can-delete', [AcademicYearController::class, 'canDelete']);
    });

    // Grade Routes
    Route::prefix('grades')->group(function () {
        Route::get('/', [GradeController::class, 'index']);
        Route::post('/', [GradeController::class, 'store']);
        Route::get('/active', [GradeController::class, 'active']);
        Route::get('/statistics', [GradeController::class, 'allStatistics']);
        Route::post('/bulk-activate', [GradeController::class, 'bulkActivate']);
        Route::post('/bulk-deactivate', [GradeController::class, 'bulkDeactivate']);
        Route::get('/search', [GradeController::class, 'search']);
        Route::get('/{id}', [GradeController::class, 'show']);
        Route::put('/{id}', [GradeController::class, 'update']);
        Route::delete('/{id}', [GradeController::class, 'destroy']);
        Route::post('/{id}/activate', [GradeController::class, 'activate']);
        Route::post('/{id}/deactivate', [GradeController::class, 'deactivate']);
        Route::get('/{id}/statistics', [GradeController::class, 'statistics']);
        Route::get('/{id}/next-grade', [GradeController::class, 'nextGrade']);
        Route::get('/{id}/previous-grade', [GradeController::class, 'previousGrade']);
        Route::post('/{id}/create-class', [GradeController::class, 'createClass']);
        Route::post('/{id}/bulk-create-classes', [GradeController::class, 'bulkCreateClasses']);
    });

    // Term Routes
    Route::prefix('terms')->group(function () {
        Route::get('/', [TermController::class, 'index']);
        Route::post('/', [TermController::class, 'store']);
        Route::get('/current', [TermController::class, 'current']);
        Route::get('/active', [TermController::class, 'active']);
        Route::get('/by-academic-year/{academicYearId}', [TermController::class, 'byAcademicYear']);
        Route::get('/{id}', [TermController::class, 'show']);
        Route::put('/{id}', [TermController::class, 'update']);
        Route::delete('/{id}', [TermController::class, 'destroy']);
        Route::post('/{id}/activate', [TermController::class, 'activate']);
        Route::post('/{id}/complete', [TermController::class, 'complete']);
        Route::get('/{id}/statistics', [TermController::class, 'statistics']);
        Route::get('/{id}/can-delete', [TermController::class, 'canDelete']);
    });

    // Student Routes
    Route::prefix('students')->group(function () {
        Route::get('/', [StudentController::class, 'index']);
        Route::post('/', [StudentController::class, 'store']);
        Route::get('/with-outstanding-bills', [StudentController::class, 'withOutstandingBills']);
        Route::get('/by-class/{classId}', [StudentController::class, 'byClass']);
        Route::get('/by-grade/{gradeId}', [StudentController::class, 'byGrade']);
        Route::get('/{id}', [StudentController::class, 'show']);
        Route::put('/{id}', [StudentController::class, 'update']);
        Route::delete('/{id}', [StudentController::class, 'destroy']);
        Route::post('/{id}/assign-to-class', [StudentController::class, 'assignToClass']);
        Route::post('/{id}/remove-from-class', [StudentController::class, 'removeFromClass']);
        Route::post('/{id}/transfer', [StudentController::class, 'transfer']);
        Route::post('/{id}/promote', [StudentController::class, 'promote']);
        Route::post('/{id}/graduate', [StudentController::class, 'graduate']);
        Route::post('/bulk-promote', [StudentController::class, 'bulkPromote']);
    });

    // Class Routes
    Route::prefix('classes')->group(function () {
        Route::get('/', [ClassController::class, 'index']);
        Route::post('/', [ClassController::class, 'store']);
        Route::get('/with-available-spots', [ClassController::class, 'withAvailableSpots']);
        Route::get('/with-tariff-counts', [ClassController::class, 'withTariffCounts']);
        Route::get('/{id}', [ClassController::class, 'show']);
        Route::put('/{id}', [ClassController::class, 'update']);
        Route::delete('/{id}', [ClassController::class, 'destroy']);
        Route::get('/{id}/statistics', [ClassController::class, 'statistics']);
        Route::get('/{id}/tariffs', [ClassController::class, 'getTariffs']);
        Route::post('/{id}/assign-tariffs', [ClassController::class, 'assignTariffs']);
        Route::delete('/{id}/tariffs/{tariffId}', [ClassController::class, 'removeTariff']);
    });

    // Billing Routes
    Route::prefix('billing')->group(function () {
        Route::post('/generate/student/{studentId}', [BillingController::class, 'generateForStudent']);
        Route::post('/generate/class/{classId}', [BillingController::class, 'generateForClass']);
        Route::post('/generate/grade/{gradeId}', [BillingController::class, 'generateForGrade']);
        Route::post('/bills/{billId}/payment', [BillingController::class, 'recordPayment']);
        Route::post('/bills/{billId}/cancel', [BillingController::class, 'cancelBill']);
        Route::get('/students/{studentId}/bills', [BillingController::class, 'studentBills']);
        Route::get('/students/{studentId}/balance', [BillingController::class, 'studentBalance']);
        Route::get('/summary/{academicYearId}', [BillingController::class, 'summary']);
        Route::get('/revenue-report/{academicYearId}', [BillingController::class, 'revenueReport']);
        Route::post('/mark-overdue', [BillingController::class, 'markOverdue']);
    });

    // Tariff Routes
    Route::prefix('tariffs')->group(function () {
        Route::get('/', [TariffController::class, 'index']);
        Route::post('/', [TariffController::class, 'store']);
        Route::get('/stats', [TariffController::class, 'statistics']);
        Route::get('/statistics', [TariffController::class, 'statistics']);
        Route::get('/by-class/{classId}', [TariffController::class, 'byClass']);
        Route::get('/{id}', [TariffController::class, 'show']);
        Route::put('/{id}', [TariffController::class, 'update']);
        Route::delete('/{id}', [TariffController::class, 'destroy']);
        Route::post('/{id}/activate', [TariffController::class, 'activate']);
        Route::post('/{id}/deactivate', [TariffController::class, 'deactivate']);
        Route::post('/{id}/duplicate', [TariffController::class, 'duplicate']);
        Route::post('/{id}/assign-to-classes', [TariffController::class, 'assignToClasses']);
        Route::delete('/{id}/classes/{classId}', [TariffController::class, 'removeFromClass']);
        Route::post('/bulk-update-amounts', [TariffController::class, 'bulkUpdateAmounts']);
    });

    // Student Import Routes
    Route::prefix('students/import')->group(function () {
        Route::get('/template', [StudentImportController::class, 'downloadTemplate']);
        Route::post('/validate', [StudentImportController::class, 'validateFile']);
        Route::post('/import', [StudentImportController::class, 'importStudents']);
        Route::get('/history', [StudentImportController::class, 'getImportHistory']);
    });

});

// Health Check Route (Public)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0'
    ]);
});
