<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\BaseApiController;
use App\Services\StudentImportService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class StudentImportController extends BaseApiController
{
    public function __construct(
        private readonly StudentImportService $studentImportService
    ) {}

    /**
     * Download Excel template for student import
     */
    public function downloadTemplate(): JsonResponse
    {
        try {
            $templateData = $this->studentImportService->generateTemplate();

            return $this->successResponse([
                'template_url' => $templateData['url'],
                'filename' => $templateData['filename'],
                'columns' => $templateData['columns']
            ], 'Template generated successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to generate template: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Validate uploaded Excel file
     */
    public function validateFile(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240' // 10MB max
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Invalid file', 422, $validator->errors()->toArray());
        }

        try {
            $file = $request->file('file');
            $validation = $this->studentImportService->validateFile($file);

            return $this->successResponse([
                'is_valid' => $validation['is_valid'],
                'total_rows' => $validation['total_rows'],
                'valid_rows' => $validation['valid_rows'],
                'errors' => $validation['errors'],
                'warnings' => $validation['warnings'],
                'preview' => $validation['preview']
            ], 'File validation completed');
        } catch (\Exception $e) {
            return $this->errorResponse('File validation failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Process and import students from Excel file
     */
    public function importStudents(Request $request): JsonResponse
    {
        // Debug logging
        Log::info('Import request received', [
            'files' => $request->hasFile('file') ? 'File present' : 'No file',
            'skip_errors' => $request->get('skip_errors'),
            'update_existing' => $request->get('update_existing'),
            'all_data' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
            'skip_errors' => 'boolean',
            'update_existing' => 'boolean'
        ]);

        if ($validator->fails()) {
            Log::error('Import validation failed', [
                'errors' => $validator->errors()->toArray(),
                'request_data' => $request->all()
            ]);
            return $this->errorResponse('Invalid request', 422, $validator->errors()->toArray());
        }

        try {
            $file = $request->file('file');
            $options = [
                'skip_errors' => $request->boolean('skip_errors', false),
                'update_existing' => $request->boolean('update_existing', false)
            ];

            $result = $this->studentImportService->importStudents($file, $options);

            return $this->successResponse([
                'imported_count' => $result['imported_count'],
                'updated_count' => $result['updated_count'],
                'skipped_count' => $result['skipped_count'],
                'total_processed' => $result['total_processed'],
                'errors' => $result['errors'],
                'warnings' => $result['warnings']
            ], 'Students imported successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Import failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get import history
     */
    public function getImportHistory(): JsonResponse
    {
        try {
            $history = $this->studentImportService->getImportHistory();

            return $this->successResponse($history, 'Import history retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve import history: ' . $e->getMessage(), 500);
        }
    }
}
