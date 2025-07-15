import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Users,
  Loader2,
  Eye,
  RefreshCw
} from 'lucide-react';
import toast from '@/utils/toast';
import studentService from '@/services/studentService';

const StudentImportModal = ({ isOpen, onClose, onImportComplete }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Validate, 3: Import, 4: Complete
  const [file, setFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [options, setOptions] = useState({
    skipErrors: false,
    updateExisting: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setCurrentStep(2);
      validateFile(uploadedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const generateExcelTemplate = () => {
    const workbook = XLSX.utils.book_new();
    
    // Sample data with corrected values
    const sampleData = [
      {
        'First Name *': 'John',
        'Last Name *': 'Doe',
        'Email': 'john.doe@example.com',
        'Date of Birth * (YYYY-MM-DD)': '2018-03-15',
        'Gender * (male/female/other)': 'male',
        'Phone': '+250788123456',
        'Address': '123 Main Street, Kigali',
        'Parent Name *': 'Jane Doe',
        'Parent Email *': 'jane.doe@example.com',
        'Parent Phone *': '+250788654321',
        'Father Name': 'John Doe Sr.',
        'Mother Name': 'Jane Doe',
        'Emergency Contact': '+250788999000',
        'Class Name *': 'N1A',
        'Status': 'active',
        'Medical Conditions': 'None',
        'Allergies': 'None',
        'Disability': 'false',
        'Disability Description': '',
        'Province': 'Kigali City',
        'District': 'Gasabo',
        'Sector': 'Kimironko',
        'Cell': 'Kimironko',
        'Village': 'Kimironko'
      },
      {
        'First Name *': 'Alice',
        'Last Name *': 'Smith',
        'Email': 'alice.smith@example.com',
        'Date of Birth * (YYYY-MM-DD)': '2017-08-22',
        'Gender * (male/female/other)': 'female',
        'Phone': '+250788234567',
        'Address': '456 Oak Avenue, Kigali',
        'Parent Name *': 'Bob Smith',
        'Parent Email *': 'bob.smith@example.com',
        'Parent Phone *': '+250788765432',
        'Father Name': 'Bob Smith',
        'Mother Name': 'Carol Smith',
        'Emergency Contact': '+250788888111',
        'Class Name *': 'P3B',
        'Status': 'active',
        'Medical Conditions': 'Asthma',
        'Allergies': 'Peanuts',
        'Disability': 'false',
        'Disability Description': '',
        'Province': 'Kigali City',
        'District': 'Kicukiro',
        'Sector': 'Niboye',
        'Cell': 'Niboye',
        'Village': 'Niboye'
      },
      {
        'First Name *': 'Michael',
        'Last Name *': 'Johnson',
        'Email': 'michael.johnson@example.com',
        'Date of Birth * (YYYY-MM-DD)': '2016-12-10',
        'Gender * (male/female/other)': 'male',
        'Phone': '+250788345678',
        'Address': '789 Pine Road, Kigali',
        'Parent Name *': 'Sarah Johnson',
        'Parent Email *': 'sarah.johnson@example.com',
        'Parent Phone *': '+250788876543',
        'Father Name': 'David Johnson',
        'Mother Name': 'Sarah Johnson',
        'Emergency Contact': '+250788777222',
        'Class Name *': 'P5A',
        'Status': 'active',
        'Medical Conditions': 'None',
        'Allergies': 'None',
        'Disability': 'true',
        'Disability Description': 'Hearing impairment',
        'Province': 'Kigali City',
        'District': 'Nyarugenge',
        'Sector': 'Nyamirambo',
        'Cell': 'Nyamirambo',
        'Village': 'Nyamirambo'
      }
    ];

    // Create Students sheet
    const studentsSheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 25 }, // Email
      { wch: 15 }, // Date of Birth
      { wch: 10 }, // Gender
      { wch: 15 }, // Phone
      { wch: 30 }, // Address
      { wch: 20 }, // Parent Name
      { wch: 25 }, // Parent Email
      { wch: 15 }, // Parent Phone
      { wch: 20 }, // Father Name
      { wch: 20 }, // Mother Name
      { wch: 15 }, // Emergency Contact
      { wch: 12 }, // Class Name
      { wch: 10 }, // Status
      { wch: 20 }, // Medical Conditions
      { wch: 15 }, // Allergies
      { wch: 10 }, // Disability
      { wch: 25 }, // Disability Description
      { wch: 15 }, // Province
      { wch: 15 }, // District
      { wch: 15 }, // Sector
      { wch: 15 }, // Cell
      { wch: 15 }  // Village
    ];
    
    studentsSheet['!cols'] = columnWidths;
    
    // Create Configuration sheet
    const configData = [
      { 'Section': 'CLASS NAME FORMATS', 'Information': 'Use these exact formats for Class Name field:' },
      { 'Section': '', 'Information': '' },
      { 'Section': 'Nursery Classes', 'Information': 'N1A, N1B, N2A, N2B, N2C' },
      { 'Section': 'Primary Classes', 'Information': 'P1A, P1B, P1C, P2A, P2B, P2C, P3A, P3B, P3C,' },
      { 'Section': '', 'Information': 'P4A, P4B, P5A, P5B, P5C, P6A, P6B' },
      { 'Section': '', 'Information': '' },
      { 'Section': 'FIELD REQUIREMENTS', 'Information': 'Required fields are marked with *' },
      { 'Section': '', 'Information': '' },
      { 'Section': 'Gender Options', 'Information': 'male, female, other' },
      { 'Section': 'Status Options', 'Information': 'active, inactive, graduated, transferred' },
      { 'Section': 'Disability Options', 'Information': 'true, false' },
      { 'Section': '', 'Information': '' },
      { 'Section': 'DATE FORMAT', 'Information': 'Use YYYY-MM-DD format (e.g., 2018-03-15)' },
      { 'Section': '', 'Information': '' },
      { 'Section': 'EMAIL VALIDATION', 'Information': 'All emails must be unique and valid format' },
      { 'Section': '', 'Information': '' },
      { 'Section': 'AUTOMATIC FIELDS', 'Information': 'These fields are set automatically:' },
      { 'Section': '', 'Information': '• Student ID (auto-generated)' },
      { 'Section': '', 'Information': '• Enrollment Date (today\'s date)' },
      { 'Section': '', 'Information': '• Created/Updated timestamps' },
      { 'Section': '', 'Information': '' },
      { 'Section': 'TROUBLESHOOTING', 'Information': 'Common issues and solutions:' },
      { 'Section': '', 'Information': '' },
      { 'Section': 'Class Name Errors', 'Information': 'Use exact format: N1A, P2B, etc.' },
      { 'Section': 'Email Errors', 'Information': 'Ensure all emails are unique and valid' },
      { 'Section': 'Date Errors', 'Information': 'Use YYYY-MM-DD format only' },
      { 'Section': 'Gender Errors', 'Information': 'Use: male, female, or other' },
      { 'Section': 'Status Errors', 'Information': 'Use: active, inactive, graduated, or transferred' },
      { 'Section': 'Disability Errors', 'Information': 'Use: true or false (not yes/no)' }
    ];
    
    const configSheet = XLSX.utils.json_to_sheet(configData);
    configSheet['!cols'] = [{ wch: 20 }, { wch: 60 }];
    
    // Add sheets to workbook
    XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students');
    XLSX.utils.book_append_sheet(workbook, configSheet, 'Configuration & Guide');
    
    // Generate and download file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_import_template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Excel template downloaded successfully!');
  };

  const validateFile = async (fileToValidate) => {
    try {
      setIsLoading(true);
      const response = await studentService.validateImportFile(fileToValidate);
      
      if (response.success) {
        setValidation(response.data);
        
        if (response.data.errors.length > 0) {
          toast.error(`Validation failed: ${response.data.errors.length} errors found`);
        } else {
          toast.success('File validation successful');
        }
      } else {
        throw new Error(response.message || 'Failed to validate file');
      }
    } catch (error) {
      toast.error('Failed to validate file: ' + error.message);
      setCurrentStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const importStudents = async () => {
    try {
      setIsLoading(true);
      setCurrentStep(3);
      
      const response = await studentService.importStudents(file, {
        skipErrors: options.skipErrors,
        updateExisting: options.updateExisting
      });

      if (response.success) {
        setImportResult(response.data);
        setCurrentStep(4);
        
        toast.success(`Import completed: ${response.data.imported_count} students imported`);
      } else {
        throw new Error(response.message || 'Failed to import students');
      }
    } catch (error) {
      toast.error('Failed to import students: ' + error.message);
      setCurrentStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setCurrentStep(1);
    setFile(null);
    setValidation(null);
    setImportResult(null);
    setOptions({
      skipErrors: false,
      updateExisting: false
    });
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleComplete = () => {
    if (importResult && importResult.imported_count > 0) {
      onImportComplete();
    }
    handleClose();
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Upload Excel File</h3>
        <p className="text-gray-600 mb-4">
          Upload an Excel file (.xlsx, .xls) or CSV file containing student data
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-blue-600">Drop the file here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop a file here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports .xlsx, .xls, and .csv files (max 10MB)
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={generateExcelTemplate}
          variant="outline"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download Template
        </Button>
      </div>
    </div>
  );

  const renderValidationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">File Validation</h3>
        <p className="text-gray-600">
          Validating your uploaded file...
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : validation ? (
        <div className="space-y-4">
          {/* File Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                {file.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Rows</p>
                  <p className="text-lg font-semibold">{validation.total_rows}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valid Rows</p>
                  <p className="text-lg font-semibold text-green-600">{validation.valid_rows}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Results */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {validation.is_valid ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`font-semibold ${validation.is_valid ? 'text-green-600' : 'text-red-600'}`}>
                    {validation.is_valid ? 'Valid' : 'Has Errors'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">
                    {validation.errors.length} Errors
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Errors */}
          {validation.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Validation Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {validation.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {validation.preview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Data Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto">
                  {validation.preview.map((row, index) => (
                    <div key={index} className="mb-4 p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold">Row {row.row}</span>
                        {row.errors.length > 0 && (
                          <Badge variant="destructive">
                            {row.errors.length} errors
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Name:</span> {row.data.name}
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span> {row.data.email}
                        </div>
                        <div>
                          <span className="text-gray-600">Class:</span> {row.data.class_name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Options */}
          <Card>
            <CardHeader>
              <CardTitle>Import Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="skip-errors">Skip Rows with Errors</Label>
                  <p className="text-sm text-gray-600">
                    Continue importing valid rows even if some rows have errors
                  </p>
                </div>
                <Switch
                  id="skip-errors"
                  checked={options.skipErrors}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, skipErrors: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="update-existing">Update Existing Students</Label>
                  <p className="text-sm text-gray-600">
                    Update existing students if email matches
                  </p>
                </div>
                <Switch
                  id="update-existing"
                  checked={options.updateExisting}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, updateExisting: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );

  const renderImportStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Importing Students</h3>
        <p className="text-gray-600">
          Please wait while we import your students...
        </p>
      </div>

      <div className="flex justify-center py-8">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-lg">Processing...</span>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
        <p className="text-gray-600">
          Your students have been successfully imported
        </p>
      </div>

      {importResult && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-green-600">
                  {importResult.imported_count}
                </p>
                <p className="text-sm text-gray-600">Students Created</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-blue-600">
                  {importResult.updated_count}
                </p>
                <p className="text-sm text-gray-600">Students Updated</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {importResult && importResult.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {importResult.warnings.map((warning, index) => (
                <div key={index} className="text-sm text-yellow-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {warning}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderUploadStep();
      case 2:
        return renderValidationStep();
      case 3:
        return renderImportStep();
      case 4:
        return renderCompleteStep();
      default:
        return renderUploadStep();
    }
  };

  const renderFooter = () => {
    switch (currentStep) {
      case 1:
        return (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogFooter>
        );
      case 2:
        return (
          <DialogFooter>
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button 
              onClick={importStudents}
              disabled={!validation || (!validation.is_valid && !options.skipErrors)}
            >
              Import Students
            </Button>
          </DialogFooter>
        );
      case 3:
        return null;
      case 4:
        return (
          <DialogFooter>
            <Button onClick={handleComplete}>
              Done
            </Button>
          </DialogFooter>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Upload an Excel file to import multiple students at once
          </DialogDescription>
        </DialogHeader>

        {renderStepContent()}
        {renderFooter()}
      </DialogContent>
    </Dialog>
  );
};

export default StudentImportModal; 