import apiClient from './apiClient';

class StudentService {
  // List all students with optional filtering
  async getStudents(params = {}) {
    try {
      const response = await apiClient.get('/students', { params });
      return response;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  // Get a specific student by ID
  async getStudent(id) {
    try {
      const response = await apiClient.get(`/students/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  }

  // Register a new student
  async registerStudent(studentData) {
    try {
      const response = await apiClient.post('/students', studentData);
      return response;
    } catch (error) {
      console.error('Error registering student:', error);
      throw error;
    }
  }

  // Update student information
  async updateStudent(id, studentData) {
    try {
      const response = await apiClient.put(`/students/${id}`, studentData);
      return response;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  // Deactivate student (soft delete)
  async deactivateStudent(id, reason) {
    try {
      const response = await apiClient.delete(`/students/${id}`, {
        data: { reason }
      });
      return response;
    } catch (error) {
      console.error('Error deactivating student:', error);
      throw error;
    }
  }

  // Assign student to class
  async assignToClass(id, classId) {
    try {
      const response = await apiClient.post(`/students/${id}/assign-to-class`, {
        class_id: classId
      });
      return response;
    } catch (error) {
      console.error('Error assigning student to class:', error);
      throw error;
    }
  }

  // Enroll student in class (alias for assignToClass)
  async enrollStudent(studentId, classId) {
    return this.assignToClass(studentId, classId);
  }

  // Remove student from class
  async removeFromClass(id) {
    try {
      const response = await apiClient.post(`/students/${id}/remove-from-class`);
      return response;
    } catch (error) {
      console.error('Error removing student from class:', error);
      throw error;
    }
  }

  // Transfer student to different class
  async transferStudent(id, newClassId) {
    try {
      const response = await apiClient.post(`/students/${id}/transfer`, {
        new_class_id: newClassId
      });
      return response;
    } catch (error) {
      console.error('Error transferring student:', error);
      throw error;
    }
  }

  // Promote student to next grade
  async promoteStudent(id, targetGradeId, targetClassId = null) {
    try {
      const payload = { target_grade_id: targetGradeId };
      if (targetClassId) {
        payload.target_class_id = targetClassId;
      }
      
      const response = await apiClient.post(`/students/${id}/promote`, payload);
      return response;
    } catch (error) {
      console.error('Error promoting student:', error);
      throw error;
    }
  }

  // Graduate student
  async graduateStudent(id) {
    try {
      const response = await apiClient.post(`/students/${id}/graduate`);
      return response;
    } catch (error) {
      console.error('Error graduating student:', error);
      throw error;
    }
  }

  // Bulk promote students
  async bulkPromoteStudents(studentIds, targetGradeId, targetClassId = null) {
    try {
      const payload = {
        student_ids: studentIds,
        target_grade_id: targetGradeId
      };
      
      if (targetClassId) {
        payload.target_class_id = targetClassId;
      }
      
      const response = await apiClient.post('/students/bulk-promote', payload);
      return response;
    } catch (error) {
      console.error('Error bulk promoting students:', error);
      throw error;
    }
  }

  // Get students with outstanding bills
  async getStudentsWithOutstandingBills() {
    try {
      const response = await apiClient.get('/students/with-outstanding-bills');
      return response;
    } catch (error) {
      console.error('Error fetching students with outstanding bills:', error);
      throw error;
    }
  }

  // Get students by class
  async getStudentsByClass(classId) {
    try {
      const response = await apiClient.get(`/students/by-class/${classId}`);
      return response;
    } catch (error) {
      console.error('Error fetching students by class:', error);
      throw error;
    }
  }

  // Get students by grade
  async getStudentsByGrade(gradeId) {
    try {
      const response = await apiClient.get(`/students/by-grade/${gradeId}`);
      return response;
    } catch (error) {
      console.error('Error fetching students by grade:', error);
      throw error;
    }
  }

  // Search students
  async searchStudents(query, filters = {}) {
    try {
      const params = { search: query, ...filters };
      const response = await apiClient.get('/students', { params });
      return response;
    } catch (error) {
      console.error('Error searching students:', error);
      throw error;
    }
  }

  // Get student statistics
  async getStudentStatistics() {
    try {
      // This would need to be implemented in the backend
      // For now, we'll calculate from the students list
      const response = await this.getStudents();
      if (response.success) {
        return this.calculateStatistics(response.data);
      }
      throw new Error('Failed to fetch students for statistics');
    } catch (error) {
      console.error('Error fetching student statistics:', error);
      throw error;
    }
  }

  // Calculate statistics from students data
  calculateStatistics(students) {
    const stats = {
      total: students.length,
      active: students.filter(s => s.status === 'active').length,
      inactive: students.filter(s => s.status === 'inactive').length,
      graduated: students.filter(s => s.status === 'graduated').length,
      transferred: students.filter(s => s.status === 'transferred').length,
      withOutstandingBills: students.filter(s => s.has_outstanding_bills).length,
      byGender: {
        male: students.filter(s => s.gender === 'male').length,
        female: students.filter(s => s.gender === 'female').length,
        other: students.filter(s => s.gender === 'other').length
      },
      byGrade: {},
      byProvince: {},
      withDisabilities: students.filter(s => s.disability).length,
      averageAge: 0
    };

    // Calculate by grade
    students.forEach(student => {
      if (student.class && student.class.grade) {
        const gradeName = student.class.grade.name;
        stats.byGrade[gradeName] = (stats.byGrade[gradeName] || 0) + 1;
      }
    });

    // Calculate by province
    students.forEach(student => {
      if (student.province) {
        stats.byProvince[student.province] = (stats.byProvince[student.province] || 0) + 1;
      }
    });

    // Calculate average age
    const totalAge = students.reduce((sum, student) => sum + (student.age || 0), 0);
    stats.averageAge = students.length > 0 ? (totalAge / students.length).toFixed(1) : 0;

    return {
      success: true,
      data: stats
    };
  }

  // Format student data for display
  formatStudentData(student) {
    return {
      ...student,
      full_name: `${student.first_name} ${student.last_name}`,
      age: student.age || this.calculateAge(student.date_of_birth),
      is_active: student.status === 'active',
      has_class: !!student.class_id,
      class_display: student.class ? student.class.full_name : 'No Class',
      grade_display: student.class?.grade ? student.class.grade.display_name : 'No Grade',
      status_display: this.getStatusDisplay(student.status),
      province_display: student.province || 'Not specified',
      disability_display: student.disability ? 'Yes' : 'No'
    };
  }

  // Calculate age from date of birth
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Get status display text
  getStatusDisplay(status) {
    const statusMap = {
      active: 'Active',
      inactive: 'Inactive',
      graduated: 'Graduated',
      transferred: 'Transferred',
      suspended: 'Suspended'
    };
    return statusMap[status] || status;
  }

  // Get status color
  getStatusColor(status) {
    const colorMap = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      graduated: 'bg-blue-100 text-blue-800',
      transferred: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }

  // Validate student data
  validateStudentData(studentData) {
    const errors = {};

    // Required fields
    if (!studentData.first_name || studentData.first_name.trim() === '') {
      errors.first_name = 'First name is required';
    }

    if (!studentData.last_name || studentData.last_name.trim() === '') {
      errors.last_name = 'Last name is required';
    }

    if (!studentData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
    } else {
      const age = this.calculateAge(studentData.date_of_birth);
      if (age < 3 || age > 18) {
        errors.date_of_birth = 'Student must be between 3 and 18 years old';
      }
    }

    if (!studentData.gender) {
      errors.gender = 'Gender is required';
    }

    if (!studentData.parent_name || studentData.parent_name.trim() === '') {
      errors.parent_name = 'Parent name is required';
    }

    if (!studentData.parent_email || studentData.parent_email.trim() === '') {
      errors.parent_email = 'Parent email is required';
    } else if (!/\S+@\S+\.\S+/.test(studentData.parent_email)) {
      errors.parent_email = 'Please enter a valid email address';
    }

    if (!studentData.parent_phone || studentData.parent_phone.trim() === '') {
      errors.parent_phone = 'Parent phone is required';
    }

    // Optional email validation
    if (studentData.email && !/\S+@\S+\.\S+/.test(studentData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Disability validation
    if (studentData.disability && (!studentData.disability_description || studentData.disability_description.trim() === '')) {
      errors.disability_description = 'Disability description is required when disability is marked as true';
    }

    // Province validation
    const validProvinces = ['Kigali', 'Eastern', 'Northern', 'Southern', 'Western'];
    if (studentData.province && !validProvinces.includes(studentData.province)) {
      errors.province = 'Invalid province. Must be one of: ' + validProvinces.join(', ');
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Get Rwanda provinces
  getRwandaProvinces() {
    return [
      { value: 'Kigali', label: 'Kigali' },
      { value: 'Eastern', label: 'Eastern' },
      { value: 'Northern', label: 'Northern' },
      { value: 'Southern', label: 'Southern' },
      { value: 'Western', label: 'Western' }
    ];
  }

  // Get gender options
  getGenderOptions() {
    return [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' }
    ];
  }

  // Get student status options
  getStatusOptions() {
    return [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'graduated', label: 'Graduated' },
      { value: 'transferred', label: 'Transferred' },
      { value: 'suspended', label: 'Suspended' }
    ];
  }

  // Sort students by various criteria
  sortStudents(students, sortBy = 'name', sortOrder = 'asc') {
    return [...students].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'student_id':
          aValue = a.student_id;
          bValue = b.student_id;
          break;
        case 'grade':
          aValue = a.class?.grade?.level || 0;
          bValue = b.class?.grade?.level || 0;
          break;
        case 'class':
          aValue = a.class?.full_name || '';
          bValue = b.class?.full_name || '';
          break;
        case 'age':
          aValue = a.age || 0;
          bValue = b.age || 0;
          break;
        case 'enrollment_date':
          aValue = new Date(a.enrollment_date || 0);
          bValue = new Date(b.enrollment_date || 0);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a[sortBy] || '';
          bValue = b[sortBy] || '';
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });
  }

  // Filter students by various criteria
  filterStudents(students, filters) {
    return students.filter(student => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableFields = [
          student.first_name,
          student.last_name,
          student.student_id,
          student.email,
          student.parent_name,
          student.parent_email,
          student.class?.full_name,
          student.class?.grade?.display_name
        ];
        
        const matchesSearch = searchableFields.some(field => 
          field && field.toLowerCase().includes(searchTerm)
        );
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all' && student.status !== filters.status) {
        return false;
      }

      // Gender filter
      if (filters.gender && filters.gender !== 'all' && student.gender !== filters.gender) {
        return false;
      }

      // Class filter
      if (filters.class_id && filters.class_id !== 'all' && student.class_id !== parseInt(filters.class_id)) {
        return false;
      }

      // Grade filter
      if (filters.grade_id && filters.grade_id !== 'all' && student.class?.grade_id !== parseInt(filters.grade_id)) {
        return false;
      }

      // Province filter
      if (filters.province && filters.province !== 'all' && student.province !== filters.province) {
        return false;
      }

      // Disability filter
      if (filters.disability !== undefined && filters.disability !== 'all') {
        const hasDisability = filters.disability === 'true';
        if (student.disability !== hasDisability) {
          return false;
        }
      }

      // Outstanding bills filter
      if (filters.has_outstanding_bills !== undefined && filters.has_outstanding_bills !== 'all') {
        const hasOutstandingBills = filters.has_outstanding_bills === 'true';
        if (student.has_outstanding_bills !== hasOutstandingBills) {
          return false;
        }
      }

      // Age range filter
      if (filters.age_min && student.age < parseInt(filters.age_min)) {
        return false;
      }

      if (filters.age_max && student.age > parseInt(filters.age_max)) {
        return false;
      }

      return true;
    });
  }

  // Get student initials for avatar
  getStudentInitials(firstName, lastName) {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  }

  // Get avatar color based on name
  getAvatarColor(firstName, lastName) {
    const colors = [
      'bg-red-100 text-red-600',
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-yellow-100 text-yellow-600',
      'bg-purple-100 text-purple-600',
      'bg-pink-100 text-pink-600',
      'bg-indigo-100 text-indigo-600',
      'bg-orange-100 text-orange-600'
    ];
    
    const nameString = `${firstName}${lastName}`.toLowerCase();
    const hash = nameString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  // Student Import Methods
  
  // Download Excel template for student import
  async downloadImportTemplate() {
    try {
      const response = await apiClient.get('/students/import/template');
      return response;
    } catch (error) {
      console.error('Error downloading import template:', error);
      throw error;
    }
  }

  // Validate uploaded Excel file
  async validateImportFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/students/import/validate', formData, {
        headers: {
          // Content-Type will be automatically set by browser for FormData
          'Accept': 'application/json'
        }
      });
      return response;
    } catch (error) {
      console.error('Error validating import file:', error);
      throw error;
    }
  }

  // Import students from Excel file
  async importStudents(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('skip_errors', options.skipErrors ? '1' : '0');
      formData.append('update_existing', options.updateExisting ? '1' : '0');

      const response = await apiClient.post('/students/import/import', formData, {
        headers: {
          // Content-Type will be automatically set by browser for FormData
          'Accept': 'application/json'
        }
      });
      return response;
    } catch (error) {
      console.error('Error importing students:', error);
      throw error;
    }
  }

  // Get import history
  async getImportHistory() {
    try {
      const response = await apiClient.get('/students/import/history');
      return response;
    } catch (error) {
      console.error('Error fetching import history:', error);
      throw error;
    }
  }
}

// Helper functions for student management
export const studentHelpers = {
  // Format student display name
  formatDisplayName: (firstName, lastName) => {
    return `${firstName} ${lastName}`;
  },

  // Get age from date of birth
  calculateAge: (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  // Check if student can be promoted
  canBePromoted: (student) => {
    return student.status === 'active' && student.class && student.class.grade;
  },

  // Check if student can be transferred
  canBeTransferred: (student) => {
    return student.status === 'active';
  },

  // Check if student can be graduated
  canBeGraduated: (student) => {
    return student.status === 'active' && student.class?.grade?.name === 'P6';
  },

  // Format student ID
  formatStudentId: (id) => {
    return `STU${id.toString().padStart(6, '0')}`;
  },

  // Get next student ID
  getNextStudentId: (existingStudents) => {
    const maxId = existingStudents.reduce((max, student) => {
      const numericId = parseInt(student.student_id.replace('STU', ''));
      return Math.max(max, numericId);
    }, 0);
    return studentHelpers.formatStudentId(maxId + 1);
  }
};

export default new StudentService(); 