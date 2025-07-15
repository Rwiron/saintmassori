<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Student;
use App\Models\ClassModel;
use App\Models\Grade;
use App\Repositories\StudentRepository;
use App\Repositories\ClassRepository;
use App\Repositories\GradeRepository;
use App\Services\StudentService;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;

class StudentImportService
{
    public function __construct(
        private readonly StudentRepository $studentRepository,
        private readonly ClassRepository $classRepository,
        private readonly GradeRepository $gradeRepository,
        private readonly StudentService $studentService
    ) {}

    /**
     * Generate Excel template for student import
     */
    public function generateTemplate(): array
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Define column headers
        $headers = [
            'A1' => 'Name *',
            'B1' => 'Email *',
            'C1' => 'Student ID',
            'D1' => 'Date of Birth (YYYY-MM-DD) *',
            'E1' => 'Gender (Male/Female) *',
            'F1' => 'Grade Name *',
            'G1' => 'Class Name *',
            'H1' => 'Guardian Name',
            'I1' => 'Guardian Phone',
            'J1' => 'Guardian Email',
            'K1' => 'Address',
            'L1' => 'City',
            'M1' => 'Province',
            'N1' => 'Postal Code',
            'O1' => 'Medical Info',
            'P1' => 'Emergency Contact',
            'Q1' => 'Emergency Phone',
            'R1' => 'Status (active/inactive)'
        ];

        // Set headers
        foreach ($headers as $cell => $header) {
            $sheet->setCellValue($cell, $header);
            $sheet->getStyle($cell)->getFont()->setBold(true);
            $sheet->getStyle($cell)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID);
            $sheet->getStyle($cell)->getFill()->getStartColor()->setRGB('E3F2FD');
        }

        // Add sample data
        $sampleData = [
            ['John Doe', 'john.doe@example.com', 'STU001', '2010-05-15', 'Male', 'Grade 1', 'Class A', 'Jane Doe', '+1234567890', 'jane.doe@example.com', '123 Main St', 'Anytown', 'Province', '12345', 'No allergies', 'Emergency Contact', '+0987654321', 'active'],
            ['Jane Smith', 'jane.smith@example.com', 'STU002', '2009-08-22', 'Female', 'Grade 2', 'Class B', 'John Smith', '+1234567891', 'john.smith@example.com', '456 Oak Ave', 'Somewhere', 'Province', '67890', 'Asthma', 'Emergency Contact 2', '+0987654322', 'active']
        ];

        $row = 2;
        foreach ($sampleData as $data) {
            $col = 'A';
            foreach ($data as $value) {
                $sheet->setCellValue($col . $row, $value);
                $col++;
            }
            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'R') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Save template
        $filename = 'student_import_template_' . date('Y-m-d_H-i-s') . '.xlsx';
        $filepath = 'templates/' . $filename;

        Storage::disk('public')->makeDirectory('templates');
        $writer = new Xlsx($spreadsheet);
        $writer->save(storage_path('app/public/' . $filepath));

        return [
            'url' => url('storage/' . $filepath),
            'filename' => $filename,
            'columns' => array_values($headers)
        ];
    }

    /**
     * Validate uploaded Excel file
     */
    public function validateFile(UploadedFile $file): array
    {
        $errors = [];
        $warnings = [];
        $preview = [];
        $validRows = 0;
        $totalRows = 0;

        try {
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $highestRow = $worksheet->getHighestRow();
            $highestColumn = $worksheet->getHighestColumn();

            // Skip header row
            for ($row = 2; $row <= $highestRow; $row++) {
                $totalRows++;
                $rowData = [];

                // Read row data
                for ($col = 'A'; $col <= $highestColumn; $col++) {
                    $cellValue = $worksheet->getCell($col . $row)->getCalculatedValue();
                    $rowData[] = $cellValue;
                }

                // Skip empty rows
                if (empty(array_filter($rowData))) {
                    continue;
                }

                $studentData = [
                    'first_name' => $rowData[0] ?? '',
                    'last_name' => $rowData[1] ?? '',
                    'email' => $rowData[2] ?? '',
                    'date_of_birth' => $rowData[3] ?? '',
                    'gender' => $rowData[4] ?? '',
                    'phone' => $rowData[5] ?? '',
                    'address' => $rowData[6] ?? '',
                    'parent_name' => $rowData[7] ?? '',
                    'parent_email' => $rowData[8] ?? '',
                    'parent_phone' => $rowData[9] ?? '',
                    'father_name' => $rowData[10] ?? '',
                    'mother_name' => $rowData[11] ?? '',
                    'emergency_contact' => $rowData[12] ?? '',
                    'class_name' => $rowData[13] ?? '',
                    'status' => $rowData[14] ?? 'active',
                    'medical_conditions' => $rowData[15] ?? '',
                    'allergies' => $rowData[16] ?? '',
                    'disability' => $rowData[17] ?? 'false',
                    'disability_description' => $rowData[18] ?? '',
                    'province' => $rowData[19] ?? '',
                    'district' => $rowData[20] ?? '',
                    'sector' => $rowData[21] ?? '',
                    'cell' => $rowData[22] ?? '',
                    'village' => $rowData[23] ?? ''
                ];

                $rowErrors = $this->validateStudentData($studentData, $row);

                if (empty($rowErrors)) {
                    $validRows++;
                } else {
                    $errors = array_merge($errors, $rowErrors);
                }

                // Add to preview (first 5 rows)
                if (count($preview) < 5) {
                    $preview[] = [
                        'row' => $row,
                        'data' => $studentData,
                        'errors' => $rowErrors
                    ];
                }
            }

        } catch (\Exception $e) {
            $errors[] = 'Failed to read Excel file: ' . $e->getMessage();
        }

        return [
            'is_valid' => empty($errors),
            'total_rows' => $totalRows,
            'valid_rows' => $validRows,
            'errors' => $errors,
            'warnings' => $warnings,
            'preview' => $preview
        ];
    }

    /**
     * Import students from Excel file
     */
    public function importStudents(UploadedFile $file, array $options = []): array
    {
        $skipErrors = $options['skip_errors'] ?? false;
        $updateExisting = $options['update_existing'] ?? false;

        $importedCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;
        $errors = [];
        $warnings = [];

        try {
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $highestRow = $worksheet->getHighestRow();
            $highestColumn = $worksheet->getHighestColumn();

            // Skip header row
            for ($row = 2; $row <= $highestRow; $row++) {
                $rowData = [];

                // Read row data
                for ($col = 'A'; $col <= $highestColumn; $col++) {
                    $cellValue = $worksheet->getCell($col . $row)->getCalculatedValue();
                    $rowData[] = $cellValue;
                }

                // Skip empty rows
                if (empty(array_filter($rowData))) {
                    continue;
                }

                $studentData = [
                    'first_name' => $rowData[0] ?? '',
                    'last_name' => $rowData[1] ?? '',
                    'email' => $rowData[2] ?? '',
                    'date_of_birth' => $rowData[3] ?? '',
                    'gender' => $rowData[4] ?? '',
                    'phone' => $rowData[5] ?? '',
                    'address' => $rowData[6] ?? '',
                    'parent_name' => $rowData[7] ?? '',
                    'parent_email' => $rowData[8] ?? '',
                    'parent_phone' => $rowData[9] ?? '',
                    'father_name' => $rowData[10] ?? '',
                    'mother_name' => $rowData[11] ?? '',
                    'emergency_contact' => $rowData[12] ?? '',
                    'class_name' => $rowData[13] ?? '',
                    'status' => $rowData[14] ?? 'active',
                    'medical_conditions' => $rowData[15] ?? '',
                    'allergies' => $rowData[16] ?? '',
                    'disability' => $rowData[17] ?? 'false',
                    'disability_description' => $rowData[18] ?? '',
                    'province' => $rowData[19] ?? '',
                    'district' => $rowData[20] ?? '',
                    'sector' => $rowData[21] ?? '',
                    'cell' => $rowData[22] ?? '',
                    'village' => $rowData[23] ?? ''
                ];

                $rowErrors = $this->validateStudentData($studentData, $row);

                if (!empty($rowErrors)) {
                    if ($skipErrors) {
                        $skippedCount++;
                        $warnings[] = "Row $row skipped due to validation errors: " . implode(', ', $rowErrors);
                        continue;
                    } else {
                        $errors = array_merge($errors, $rowErrors);
                        continue;
                    }
                }

                try {
                    $result = $this->processStudentRow($studentData, $updateExisting);

                    if ($result['action'] === 'created') {
                        $importedCount++;
                    } elseif ($result['action'] === 'updated') {
                        $updatedCount++;
                    } elseif ($result['action'] === 'skipped') {
                        $skippedCount++;
                        $warnings[] = "Row $row: " . $result['message'];
                    }
                } catch (\Exception $e) {
                    if ($skipErrors) {
                        $skippedCount++;
                        $warnings[] = "Row $row skipped due to processing error: " . $e->getMessage();
                    } else {
                        $errors[] = "Row $row: Failed to process - " . $e->getMessage();
                    }
                }
            }

        } catch (\Exception $e) {
            $errors[] = 'Failed to process Excel file: ' . $e->getMessage();
        }

        return [
            'imported_count' => $importedCount,
            'updated_count' => $updatedCount,
            'skipped_count' => $skippedCount,
            'total_processed' => $importedCount + $updatedCount + $skippedCount,
            'errors' => $errors,
            'warnings' => $warnings
        ];
    }

    /**
     * Get import history
     */
    public function getImportHistory(): array
    {
        // This would typically be stored in a database table
        // For now, returning empty array
        return [];
    }

    /**
     * Validate student data
     */
    private function validateStudentData(array $data, int $row): array
    {
        $errors = [];

        // Required fields
        if (empty($data['first_name'])) {
            $errors[] = "Row $row: First name is required";
        }

        if (empty($data['last_name'])) {
            $errors[] = "Row $row: Last name is required";
        }

        if (empty($data['email'])) {
            $errors[] = "Row $row: Email is required";
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = "Row $row: Invalid email format";
        }

        if (empty($data['date_of_birth'])) {
            $errors[] = "Row $row: Date of birth is required";
        } else {
            try {
                Carbon::parse($data['date_of_birth']);
            } catch (\Exception $e) {
                $errors[] = "Row $row: Invalid date format for date of birth";
            }
        }

        if (empty($data['gender'])) {
            $errors[] = "Row $row: Gender is required";
        } elseif (!in_array(strtolower($data['gender']), ['male', 'female', 'other'])) {
            $errors[] = "Row $row: Gender must be 'male', 'female', or 'other'";
        }

        if (empty($data['parent_name'])) {
            $errors[] = "Row $row: Parent name is required";
        }

        if (empty($data['parent_email'])) {
            $errors[] = "Row $row: Parent email is required";
        } elseif (!filter_var($data['parent_email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = "Row $row: Invalid parent email format";
        }

        if (empty($data['parent_phone'])) {
            $errors[] = "Row $row: Parent phone is required";
        }

        if (empty($data['class_name'])) {
            $errors[] = "Row $row: Class name is required";
        } else {
            try {
                $classInfo = $this->parseClassName($data['class_name']);
                $grade = $this->gradeRepository->findByName($classInfo['grade_name']);
                
                if (!$grade) {
                    $errors[] = "Row $row: Grade '{$classInfo['grade_name']}' not found";
                } else {
                    $class = $this->classRepository->findByNameAndGrade($classInfo['class_name'], $grade->id);
                    if (!$class) {
                        $errors[] = "Row $row: Class '{$classInfo['class_name']}' not found in grade '{$classInfo['grade_name']}'";
                    }
                }
            } catch (\Exception $e) {
                $errors[] = "Row $row: " . $e->getMessage();
            }
        }


        // Check for duplicate email
        if (!empty($data['email'])) {
            $existing = $this->studentRepository->findByEmail($data['email']);
            if ($existing) {
                $errors[] = "Row $row: Email '{$data['email']}' already exists";
            }
        }

        // Validate disability field
        if (!empty($data['disability']) && !in_array(strtolower($data['disability']), ['true', 'false', '1', '0'])) {
            $errors[] = "Row $row: Disability must be 'true' or 'false'";
        }

        // Validate status field
        if (!empty($data['status']) && !in_array(strtolower($data['status']), ['active', 'inactive', 'graduated', 'transferred'])) {
            $errors[] = "Row $row: Status must be 'active', 'inactive', 'graduated', or 'transferred'";
        }

        return $errors;
    }

    /**
     * Process individual student row
     */
    private function processStudentRow(array $data, bool $updateExisting): array
    {
        // Parse class name to extract grade and class info
        try {
            $classInfo = $this->parseClassName($data['class_name']);
        } catch (\Exception $e) {
            return [
                'action' => 'skipped',
                'message' => $e->getMessage()
            ];
        }

        // Find grade and class
        $grade = $this->gradeRepository->findByName($classInfo['grade_name']);
        if (!$grade) {
            return [
                'action' => 'skipped',
                'message' => "Grade '{$classInfo['grade_name']}' not found"
            ];
        }
        
        $class = $this->classRepository->findByNameAndGrade($classInfo['class_name'], $grade->id);
        if (!$class) {
            return [
                'action' => 'skipped',
                'message' => "Class '{$classInfo['class_name']}' not found in grade '{$classInfo['grade_name']}'"
            ];
        }

        // Check if student exists
        $existingStudent = null;
        if (!empty($data['email'])) {
            $existingStudent = $this->studentRepository->findByEmail($data['email']);
        }

        if ($existingStudent) {
            if ($updateExisting) {
                // Update existing student
                $studentData = $this->prepareStudentData($data, $class->id);
                $this->studentRepository->update($existingStudent->id, $studentData);

                return [
                    'action' => 'updated',
                    'student' => $existingStudent,
                    'message' => 'Student updated successfully'
                ];
            } else {
                return [
                    'action' => 'skipped',
                    'student' => $existingStudent,
                    'message' => 'Student already exists (email: ' . $data['email'] . ')'
                ];
            }
        } else {
            // Create new student
            $studentData = $this->prepareStudentData($data, $class->id);
            $student = $this->studentRepository->create($studentData);

            return [
                'action' => 'created',
                'student' => $student,
                'message' => 'Student created successfully'
            ];
        }
    }

    /**
     * Prepare student data for database insertion
     */
    private function prepareStudentData(array $data, int $classId): array
    {
        return [
            'student_id' => $this->generateStudentId(),
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'date_of_birth' => Carbon::parse($data['date_of_birth'])->format('Y-m-d'),
            'gender' => strtolower($data['gender']),
            'phone' => $data['phone'],
            'address' => $data['address'],
            'province' => $data['province'],
            'district' => $data['district'],
            'sector' => $data['sector'],
            'cell' => $data['cell'],
            'village' => $data['village'],
            'parent_name' => $data['parent_name'],
            'parent_email' => $data['parent_email'],
            'parent_phone' => $data['parent_phone'],
            'father_name' => $data['father_name'],
            'mother_name' => $data['mother_name'],
            'emergency_contact' => $data['emergency_contact'],
            'class_id' => $classId,
            'enrollment_date' => Carbon::now()->format('Y-m-d'),
            'medical_conditions' => $data['medical_conditions'],
            'allergies' => $data['allergies'],
            'disability' => in_array(strtolower($data['disability']), ['true', '1']) ? true : false,
            'disability_description' => $data['disability_description'],
            'status' => in_array(strtolower($data['status']), ['active', 'inactive', 'graduated', 'transferred']) ? strtolower($data['status']) : 'active'
        ];
    }

    /**
     * Generate unique student ID
     */
    private function generateStudentId(): string
    {
        do {
            $studentId = 'STU' . str_pad((string) rand(1, 99999), 5, '0', STR_PAD_LEFT);
        } while ($this->studentRepository->findByStudentId($studentId));

        return $studentId;
    }

    /**
     * Parse class name from various formats
     * Supports: N1A, P2B, etc.
     */
    private function parseClassName(string $className): array
    {
        $className = strtoupper(trim($className));

        // Pattern: N1A, P2B, etc.
        if (preg_match('/^([NP])(\d+)([A-Z])$/', $className, $matches)) {
            $levelPrefix = $matches[1];
            $levelNumber = (int)$matches[2];
            $classLetter = $matches[3];

            // Map to grade names (these should match the 'name' field in grades table)
            $gradeMap = [
                'N1' => 'N1',
                'N2' => 'N2',
                'P1' => 'P1',
                'P2' => 'P2',
                'P3' => 'P3',
                'P4' => 'P4',
                'P5' => 'P5',
                'P6' => 'P6',
            ];

            $gradeKey = $levelPrefix . $levelNumber;

            if (!isset($gradeMap[$gradeKey])) {
                throw new \Exception("Invalid grade level: {$gradeKey}. Available grades: " . implode(', ', array_keys($gradeMap)));
            }

            return [
                'grade_name' => $gradeMap[$gradeKey],
                'class_name' => $classLetter,
                'full_name' => $className
            ];
        }

        // Try direct class name matching as fallback
        $class = ClassModel::where('full_name', $className)->first();
        if ($class) {
            return [
                'grade_name' => $class->grade->display_name,
                'class_name' => $class->name,
                'full_name' => $class->full_name
            ];
        }

        throw new \Exception("Invalid class format: {$className}. Expected format: N1A, P2B, etc. Available classes: " .
            ClassModel::with('grade')->get()->pluck('full_name')->implode(', '));
    }
}
