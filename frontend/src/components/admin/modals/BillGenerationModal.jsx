import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Receipt, 
  Users, 
  Building2, 
  GraduationCap, 
  AlertCircle, 
  CheckCircle, 
  Calendar,
  DollarSign,
  FileText,
  Info
} from 'lucide-react';
import classService from '@/services/classService';
import gradeService from '@/services/gradeService';
import studentService from '@/services/studentService';

const BillGenerationModal = ({ 
  isOpen, 
  onClose, 
  onGenerate, 
  generationType,
  selectedClass,
  academicYear
}) => {
  const [formData, setFormData] = useState({
    type: 'class',
    targetId: null,
    dueDate: '',
    description: '',
    includeInactive: false
  });
  
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetInfo, setTargetInfo] = useState(null);
  const [estimatedBills, setEstimatedBills] = useState(0);
  const [estimatedRevenue, setEstimatedRevenue] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setFormData({
        type: generationType || 'class',
        targetId: selectedClass?.id || null,
        dueDate: getDefaultDueDate(),
        description: generateDefaultDescription(),
        includeInactive: false
      });
    }
  }, [isOpen, generationType, selectedClass]);

  useEffect(() => {
    if (formData.targetId && formData.type) {
      loadTargetInfo();
    }
  }, [formData.targetId, formData.type]);

  const loadData = async () => {
    try {
      const [classesResponse, gradesResponse, studentsResponse] = await Promise.all([
        classService.getClassesWithTariffCounts(),
        gradeService.getActiveGrades(),
        studentService.getStudents()
      ]);

      if (classesResponse.success) {
        setClasses(classesResponse.data);
      }
      if (gradesResponse.success) {
        setGrades(gradesResponse.data);
      }
      if (studentsResponse.success) {
        setStudents(studentsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadTargetInfo = async () => {
    try {
      let info = null;
      let billCount = 0;
      let revenue = 0;

      switch (formData.type) {
        case 'student':
          const student = students.find(s => s.id === formData.targetId);
          if (student) {
            info = {
              name: student.full_name,
              class: student.class?.full_name,
              grade: student.class?.grade?.display_name
            };
            billCount = 1;
            revenue = 80000; // Estimated
          }
          break;

        case 'class':
          const classData = classes.find(c => c.id === formData.targetId);
          if (classData) {
            info = {
              name: classData.full_name,
              grade: classData.grade?.display_name,
              students: classData.student_count || 0,
              tariffs: classData.tariff_count || 0
            };
            billCount = classData.student_count || 0;
            revenue = billCount * 80000; // Estimated
          }
          break;

        case 'grade':
          const grade = grades.find(g => g.id === formData.targetId);
          if (grade) {
            const gradeClasses = classes.filter(c => c.grade_id === formData.targetId);
            const totalStudents = gradeClasses.reduce((sum, c) => sum + (c.student_count || 0), 0);
            
            info = {
              name: grade.display_name,
              classes: gradeClasses.length,
              students: totalStudents
            };
            billCount = totalStudents;
            revenue = billCount * 80000; // Estimated
          }
          break;
      }

      setTargetInfo(info);
      setEstimatedBills(billCount);
      setEstimatedRevenue(revenue);
    } catch (error) {
      console.error('Error loading target info:', error);
    }
  };

  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from now
    return date.toISOString().split('T')[0];
  };

  const generateDefaultDescription = () => {
    if (!academicYear) return 'Term fees';
    return `Term fees for ${academicYear.name}`;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.targetId || !formData.dueDate) {
      return;
    }

    setLoading(true);
    try {
      await onGenerate({
        type: formData.type,
        targetId: formData.targetId,
        dueDate: formData.dueDate,
        description: formData.description,
        includeInactive: formData.includeInactive
      });
    } catch (error) {
      console.error('Bill generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      type: 'class',
      targetId: null,
      dueDate: '',
      description: '',
      includeInactive: false
    });
    setTargetInfo(null);
    setEstimatedBills(0);
    setEstimatedRevenue(0);
    onClose();
  };

  const renderTargetSelector = () => {
    switch (formData.type) {
      case 'student':
        return (
          <Select 
            value={formData.targetId?.toString() || ''} 
            onValueChange={(value) => handleInputChange('targetId', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select student" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {students.map(student => (
                <SelectItem key={student.id} value={student.id.toString()}>
                  {student.full_name} - {student.class?.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'class':
        return (
          <Select 
            value={formData.targetId?.toString() || ''} 
            onValueChange={(value) => handleInputChange('targetId', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {classes.map(classItem => (
                <SelectItem key={classItem.id} value={classItem.id.toString()}>
                  {classItem.full_name} - {classItem.grade?.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'grade':
        return (
          <Select 
            value={formData.targetId?.toString() || ''} 
            onValueChange={(value) => handleInputChange('targetId', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {grades.map(grade => (
                <SelectItem key={grade.id} value={grade.id.toString()}>
                  {grade.display_name} ({grade.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  const renderTargetInfo = () => {
    if (!targetInfo) return null;

    const getIcon = () => {
      switch (formData.type) {
        case 'student':
          return <Users className="w-5 h-5 text-blue-600" />;
        case 'class':
          return <Building2 className="w-5 h-5 text-green-600" />;
        case 'grade':
          return <GraduationCap className="w-5 h-5 text-purple-600" />;
        default:
          return <FileText className="w-5 h-5 text-gray-600" />;
      }
    };

    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            {getIcon()}
            <span>Target Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Name</Label>
                <p className="font-medium">{targetInfo.name}</p>
              </div>
              {targetInfo.class && (
                <div>
                  <Label className="text-sm text-muted-foreground">Class</Label>
                  <p className="font-medium">{targetInfo.class}</p>
                </div>
              )}
              {targetInfo.grade && (
                <div>
                  <Label className="text-sm text-muted-foreground">Grade</Label>
                  <p className="font-medium">{targetInfo.grade}</p>
                </div>
              )}
              {targetInfo.students !== undefined && (
                <div>
                  <Label className="text-sm text-muted-foreground">Students</Label>
                  <p className="font-medium">{targetInfo.students}</p>
                </div>
              )}
              {targetInfo.classes !== undefined && (
                <div>
                  <Label className="text-sm text-muted-foreground">Classes</Label>
                  <p className="font-medium">{targetInfo.classes}</p>
                </div>
              )}
              {targetInfo.tariffs !== undefined && (
                <div>
                  <Label className="text-sm text-muted-foreground">Tariffs</Label>
                  <p className="font-medium">{targetInfo.tariffs}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-green-600" />
            <span>Generate Bills</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Generation Type */}
          <div className="space-y-2">
            <Label>Generation Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select generation type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="student">Individual Student</SelectItem>
                <SelectItem value="class">Entire Class</SelectItem>
                <SelectItem value="grade">Entire Grade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Selection */}
          <div className="space-y-2">
            <Label>
              Select {formData.type === 'student' ? 'Student' : 
                     formData.type === 'class' ? 'Class' : 'Grade'}
            </Label>
            {renderTargetSelector()}
          </div>

          {/* Target Information */}
          {renderTargetInfo()}

          {/* Bill Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Bill description"
              />
            </div>
          </div>

          {/* Academic Year Info */}
          {academicYear && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Bills will be generated for academic year <strong>{academicYear.name}</strong>
                {academicYear.current_term && (
                  <span> and term <strong>{academicYear.current_term.name}</strong></span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Generation Summary */}
          {estimatedBills > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Generation Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <Label className="text-sm text-muted-foreground">Bills to Generate</Label>
                    <p className="text-2xl font-bold text-green-600">{estimatedBills}</p>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm text-muted-foreground">Estimated Revenue</Label>
                    <p className="text-2xl font-bold text-green-600">
                      {formatAmount(estimatedRevenue)}
                    </p>
                  </div>
                </div>
                
                {estimatedBills > 1 && (
                  <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      This will generate {estimatedBills} individual bills
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.targetId || !formData.dueDate || estimatedBills === 0}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating Bills...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 mr-2" />
                  Generate {estimatedBills} Bill{estimatedBills !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BillGenerationModal; 