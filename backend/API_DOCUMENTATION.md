# Montessori School Management System API Documentation

## Overview
This API provides comprehensive endpoints for managing a Montessori school system including academic years, students, classes, tariffs, and billing.

## Base URL
```
http://localhost:8000/api
```

## Response Format
All API responses follow a consistent format:

### Success Response
```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        // Response data
    }
}
```

### Error Response
```json
{
    "success": false,
    "message": "Error message",
    "errors": {
        // Validation errors (if applicable)
    }
}
```

## Authentication
The API uses Laravel Sanctum for authentication. Most endpoints require authentication, except for registration, login, and health check.

### Authentication Flow
1. **Register** a new user account or **Login** with existing credentials
2. Receive a Bearer token in the response
3. Include the token in the Authorization header for all protected endpoints:
```
Authorization: Bearer <your-token>
```

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
```
Body:
```json
{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "role": "admin"
}
```

**Available Roles:**
- `admin` - Full system access (Administrator)
- `teacher` - Limited access to classes and students (Teacher)
- `student` - View own profile and bills (Student)
- `parent` - View child's profile and bills (Parent)

**Response:**
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john.doe@example.com",
            "role": "admin",
            "role_label": "Administrator",
            "is_active": true,
            "permissions": [
                "manage_academic_years",
                "manage_terms",
                "manage_grades",
                "manage_classes",
                "manage_students",
                "manage_tariffs",
                "manage_bills",
                "view_reports",
                "promote_students"
            ]
        },
        "token": "1|abc123def456...",
        "token_type": "Bearer"
    }
}
```

#### Login User
```
POST /api/auth/login
```
Body:
```json
{
    "email": "john.doe@example.com",
    "password": "password123",
    "remember": false
}
```

**Parameters:**
- `email` (required): User's email address
- `password` (required): User's password
- `remember` (optional): Boolean - if true, creates a longer-lasting token

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john.doe@example.com",
            "role": "admin",
            "role_label": "Administrator",
            "is_active": true,
            "last_login_at": "2024-01-15T10:30:00.000000Z",
            "permissions": [
                "manage_academic_years",
                "manage_terms",
                "manage_grades",
                "manage_classes",
                "manage_students",
                "manage_tariffs",
                "manage_bills",
                "view_reports",
                "promote_students"
            ]
        },
        "token": "2|xyz789abc123...",
        "token_type": "Bearer"
    }
}
```

#### Logout User
```
POST /api/auth/logout
```
Headers:
```
Authorization: Bearer <your-token>
```

**Response:**
```json
{
    "success": true,
    "message": "Logout successful",
    "data": null
}
```

#### Logout from All Devices
```
POST /api/auth/logout-all
```
Headers:
```
Authorization: Bearer <your-token>
```

**Response:**
```json
{
    "success": true,
    "message": "Logged out from all devices successfully",
    "data": null
}
```

#### Get User Profile
```
GET /api/auth/profile
```
Headers:
```
Authorization: Bearer <your-token>
```

**Response:**
```json
{
    "success": true,
    "message": "User profile retrieved successfully",
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john.doe@example.com",
            "role": "admin",
            "role_label": "Administrator",
            "is_active": true,
            "last_login_at": "2024-01-15T10:30:00.000000Z",
            "created_at": "2024-01-01T00:00:00.000000Z",
            "permissions": [
                "manage_academic_years",
                "manage_terms",
                "manage_grades",
                "manage_classes",
                "manage_students",
                "manage_tariffs",
                "manage_bills",
                "view_reports",
                "promote_students"
            ]
        }
    }
}
```

#### Update User Profile
```
PUT /api/auth/profile
```
Headers:
```
Authorization: Bearer <your-token>
```
Body:
```json
{
    "name": "John Smith",
    "email": "john.smith@example.com",
    "current_password": "currentpass123",
    "password": "newpassword123",
    "password_confirmation": "newpassword123"
}
```

**Note:** All fields are optional. `current_password` is required only when changing password.

#### Change Password
```
POST /api/auth/change-password
```
Headers:
```
Authorization: Bearer <your-token>
```
Body:
```json
{
    "current_password": "currentpass123",
    "password": "newpassword123",
    "password_confirmation": "newpassword123"
}
```

#### Get User Permissions
```
GET /api/auth/permissions
```
Headers:
```
Authorization: Bearer <your-token>
```

**Response:**
```json
{
    "success": true,
    "message": "User permissions retrieved successfully",
    "data": {
        "permissions": [
            "manage_academic_years",
            "manage_terms",
            "manage_grades",
            "manage_classes",
            "manage_students",
            "manage_tariffs",
            "manage_bills",
            "view_reports",
            "promote_students"
        ]
    }
}
```

#### Refresh Token
```
POST /api/auth/refresh
```
Headers:
```
Authorization: Bearer <your-token>
```

**Response:**
```json
{
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
        "token": "3|new123token456...",
        "token_type": "Bearer"
    }
}
```

### Role-Based Permissions

Each user role has specific permissions:

**Admin:**
- Full system access
- Manage academic years, terms, grades, classes, students, tariffs, bills
- View all reports
- Promote students

**Teacher:**
- View classes and students
- View reports (limited)

**Student:**
- View own profile
- View own bills
- View own class information

**Parent:**
- View child's profile
- View child's bills
- View child's class information

## API Endpoints

### 1. Academic Years

Academic Years represent the main academic periods in the school system. Each academic year has a specific lifecycle and can contain multiple terms.

#### Academic Year Lifecycle

1. **Draft** → **Active** → **Closed**
   - **Draft**: Newly created academic year, not yet in use
   - **Active**: Currently active academic year (only one can be active at a time)
   - **Closed**: Academic year has been completed and archived

#### Typical Academic Year Workflow

1. **Create** a new academic year in "draft" status
2. **Activate** the academic year when ready to use
3. **Manage** terms, students, and billing during the active period
4. **Close** the academic year when all terms are completed
5. **Archive** (academic year remains in database for historical records)

#### Business Rules

- Only one academic year can be active at a time
- Active academic years automatically deactivate others when activated
- Closed academic years cannot be modified
- Academic years with associated terms/bills cannot be deleted
- Academic years must be at least 6 months long
- Start date must be in the future (for new academic years)
- End date must be after start date

#### List Academic Years
```
GET /api/academic-years
```
Headers:
```
Authorization: Bearer <your-token>
```

**Query Parameters:**
- `search` (optional): Search by name (searches within academic year names)

**Examples:**
```bash
# Get all academic years
curl -X GET http://localhost:8000/api/academic-years \
  -H "Authorization: Bearer your-token-here" \
  -H "Accept: application/json"

# Search for specific academic years
curl -X GET "http://localhost:8000/api/academic-years?search=2025" \
  -H "Authorization: Bearer your-token-here" \
  -H "Accept: application/json"
```

**Response:**
```json
{
    "success": true,
    "message": "Academic years retrieved successfully",
    "data": [
        {
            "id": 1,
            "name": "2024-2025",
            "start_date": "2024-09-01T00:00:00.000000Z",
            "end_date": "2025-06-30T00:00:00.000000Z",
            "status": "closed",
            "description": "Previous academic year",
            "is_active": false,
            "is_closed": true,
            "can_be_modified": false,
            "created_at": "2024-07-01T00:00:00.000000Z",
            "updated_at": "2025-07-01T00:00:00.000000Z"
        },
        {
            "id": 2,
            "name": "2025-2026",
            "start_date": "2025-09-01T00:00:00.000000Z",
            "end_date": "2026-06-30T00:00:00.000000Z",
            "status": "active",
            "description": "Current academic year",
            "is_active": true,
            "is_closed": false,
            "can_be_modified": true,
            "created_at": "2025-07-12T20:36:16.000000Z",
            "updated_at": "2025-07-13T08:30:00.000000Z"
        }
    ]
}
```

**Academic Year Status Meanings:**
- `draft` - Newly created, not yet activated
- `active` - Currently active academic year (only one can be active)
- `closed` - Academic year has been completed and closed

#### Create Academic Year
```
POST /api/academic-years
```
Headers:
```
Authorization: Bearer <your-token>
```
Body:
```json
{
    "name": "2024-2025",
    "start_date": "2024-09-01",
    "end_date": "2025-06-30",
    "description": "Academic year description"
}
```

**Required Fields:**
- `name` (string, max 255 chars): Name of the academic year (e.g., "2024-2025")
- `start_date` (date): Start date of the academic year (must be after today)
- `end_date` (date): End date of the academic year (must be after start_date)

**Optional Fields:**
- `description` (string, max 1000 chars): Additional description for the academic year

**Validation Rules:**
- Start date must be in the future (after today)
- End date must be after the start date
- Name must be unique
- All dates should be in YYYY-MM-DD format

**Response:**
```json
{
    "success": true,
    "message": "Academic year created successfully",
    "data": {
        "id": 1,
        "name": "2024-2025",
        "start_date": "2024-09-01",
        "end_date": "2025-06-30",
        "status": "draft",
        "description": "Academic year description",
        "is_active": false,
        "is_closed": false,
        "can_be_modified": true,
        "created_at": "2024-01-15T10:30:00.000000Z",
        "updated_at": "2024-01-15T10:30:00.000000Z"
    }
}
```

**Academic Year Statuses:**
- `draft` - Newly created, not yet activated
- `active` - Currently active academic year (only one can be active at a time)
- `closed` - Academic year has been completed and closed

**Error Responses:**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "start_date": ["The start date must be after today."],
        "end_date": ["The end date must be after start date."],
        "name": ["The name field is required."]
    }
}
```

**Usage Example:**
```bash
curl -X POST http://localhost:8000/api/academic-years \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2024-2025",
    "start_date": "2024-09-01",
    "end_date": "2025-06-30",
    "description": "Main academic year for 2024-2025 session"
  }'
```

#### Get Academic Year
```
GET /api/academic-years/{id}
```
Headers:
```
Authorization: Bearer <your-token>
```

**Response:**
```json
{
    "success": true,
    "message": "Academic year retrieved successfully",
    "data": {
        "id": 3,
        "name": "2025-2026",
        "start_date": "2025-09-01T00:00:00.000000Z",
        "end_date": "2026-06-30T00:00:00.000000Z",
        "status": "active",
        "description": "Updated academic year description",
        "is_active": true,
        "is_closed": false,
        "can_be_modified": true,
        "terms": [
            {
                "id": 1,
                "name": "Term 1",
                "start_date": "2025-09-01",
                "end_date": "2025-12-15",
                "status": "draft"
            }
        ],
        "created_at": "2025-07-12T20:36:16.000000Z",
        "updated_at": "2025-07-13T08:30:00.000000Z"
    }
}
```

#### Update Academic Year
```
PUT /api/academic-years/{id}
```
Headers:
```
Authorization: Bearer <your-token>
```
Body:
```json
{
    "name": "2025-2026 Updated",
    "description": "Updated academic year description",
    "start_date": "2025-09-01",
    "end_date": "2026-06-30"
}
```

**Notes:**
- All fields are optional (use "sometimes" validation)
- Cannot modify closed academic years
- Date validation applies when dates are updated
- Name uniqueness is enforced

**Response:**
```json
{
    "success": true,
    "message": "Academic year updated successfully",
    "data": {
        "id": 3,
        "name": "2025-2026 Updated",
        "start_date": "2025-09-01T00:00:00.000000Z",
        "end_date": "2026-06-30T00:00:00.000000Z",
        "status": "active",
        "description": "Updated academic year description",
        "is_active": true,
        "is_closed": false,
        "can_be_modified": true,
        "created_at": "2025-07-12T20:36:16.000000Z",
        "updated_at": "2025-07-13T08:30:00.000000Z"
    }
}
```

#### Delete Academic Year
```
DELETE /api/academic-years/{id}
```
Headers:
```
Authorization: Bearer <your-token>
```

**Prerequisites:**
- Academic year must not have associated terms
- Academic year must not have associated bills
- Academic year must not be currently active

**Response:**
```json
{
    "success": true,
    "message": "Academic year deleted successfully",
    "data": null
}
```

**Error Response:**
```json
{
    "success": false,
    "message": "Academic year cannot be deleted. It has associated terms or bills.",
    "errors": []
}
```

#### Activate Academic Year
```
POST /api/academic-years/{id}/activate
```
Headers:
```
Authorization: Bearer <your-token>
```

**Business Logic:**
- Only one academic year can be active at a time
- Activating a year will automatically deactivate other active years
- Cannot activate a closed academic year
- Changes status from "draft" to "active"

**Response:**
```json
{
    "success": true,
    "message": "Academic year activated successfully",
    "data": {
        "id": 3,
        "name": "2025-2026",
        "start_date": "2025-09-01T00:00:00.000000Z",
        "end_date": "2026-06-30T00:00:00.000000Z",
        "status": "active",
        "description": "Academic year description",
        "is_active": true,
        "is_closed": false,
        "can_be_modified": true,
        "created_at": "2025-07-12T20:36:16.000000Z",
        "updated_at": "2025-07-13T08:30:00.000000Z"
    }
}
```

#### Close Academic Year
```
POST /api/academic-years/{id}/close
```
Headers:
```
Authorization: Bearer <your-token>
```

**Prerequisites:**
- Academic year must be currently active
- All terms within the academic year must be completed
- Changes status from "active" to "closed"

**Response:**
```json
{
    "success": true,
    "message": "Academic year closed successfully",
    "data": {
        "id": 3,
        "name": "2025-2026",
        "start_date": "2025-09-01T00:00:00.000000Z",
        "end_date": "2026-06-30T00:00:00.000000Z",
        "status": "closed",
        "description": "Academic year description",
        "is_active": false,
        "is_closed": true,
        "can_be_modified": false,
        "created_at": "2025-07-12T20:36:16.000000Z",
        "updated_at": "2025-07-13T08:30:00.000000Z"
    }
}
```

#### Get Current Academic Year
```
GET /api/academic-years/current
```
Headers:
```
Authorization: Bearer <your-token>
```

**Description:** Returns the currently active academic year (status = "active")

**Response:**
```json
{
    "success": true,
    "message": "Current academic year retrieved successfully",
    "data": {
        "id": 3,
        "name": "2025-2026",
        "start_date": "2025-09-01T00:00:00.000000Z",
        "end_date": "2026-06-30T00:00:00.000000Z",
        "status": "active",
        "description": "Academic year description",
        "is_active": true,
        "is_closed": false,
        "can_be_modified": true,
        "created_at": "2025-07-12T20:36:16.000000Z",
        "updated_at": "2025-07-13T08:30:00.000000Z"
    }
}
```

**No Active Year Response:**
```json
{
    "success": false,
    "message": "No active academic year found",
    "data": null
}
```

#### Get Active Academic Years
```
GET /api/academic-years/active
```
Headers:
```
Authorization: Bearer <your-token>
```

**Description:** Returns all academic years with status = "active" (should typically be only one)

**Response:**
```json
{
    "success": true,
    "message": "Active academic years retrieved successfully",
    "data": [
        {
            "id": 3,
            "name": "2025-2026",
            "start_date": "2025-09-01T00:00:00.000000Z",
            "end_date": "2026-06-30T00:00:00.000000Z",
            "status": "active",
            "description": "Academic year description",
            "is_active": true,
            "is_closed": false,
            "can_be_modified": true,
            "created_at": "2025-07-12T20:36:16.000000Z",
            "updated_at": "2025-07-13T08:30:00.000000Z"
        }
    ]
}
```

#### Get Academic Year Statistics
```
GET /api/academic-years/{id}/statistics
```
Headers:
```
Authorization: Bearer <your-token>
```

**Description:** Returns comprehensive statistics for a specific academic year

**Response:**
```json
{
    "success": true,
    "message": "Academic year statistics retrieved successfully",
    "data": {
        "academic_year": {
            "id": 3,
            "name": "2025-2026",
            "status": "active",
            "start_date": "2025-09-01T00:00:00.000000Z",
            "end_date": "2026-06-30T00:00:00.000000Z"
        },
        "total_terms": 3,
        "completed_terms": 1,
        "active_terms": 1,
        "total_bills": 150,
        "total_revenue": 75000.00,
        "outstanding_amount": 25000.00,
        "students_enrolled": 120,
        "classes_count": 8
    }
}
```

#### Check if Academic Year Can Be Closed
```
GET /api/academic-years/{id}/can-close
```
Headers:
```
Authorization: Bearer <your-token>
```

**Response:**
```json
{
    "success": true,
    "message": "Academic year can be closed",
    "data": {
        "can_close": true,
        "message": "Academic year can be closed"
    }
}
```

#### Check if Academic Year Can Be Deleted
```
GET /api/academic-years/{id}/can-delete
```
Headers:
```
Authorization: Bearer <your-token>
```

**Response:**
```json
{
    "success": true,
    "message": "Academic year can be deleted",
    "data": {
        "can_delete": false,
        "message": "Academic year cannot be deleted"
    }
}
```

### 2. Grades

Grades represent the academic levels in the school system (N1, P1, P2, P3, P4, P5, P6). Each grade has a specific level and can contain multiple classes.

#### Grade Structure

- **N1**: Nursery 1 (Level 1) - Ages 3-4
- **P1**: Primary 1 (Level 2) - Ages 5-6  
- **P2**: Primary 2 (Level 3) - Ages 6-7
- **P3**: Primary 3 (Level 4) - Ages 7-8
- **P4**: Primary 4 (Level 5) - Ages 8-9
- **P5**: Primary 5 (Level 6) - Ages 9-10
- **P6**: Primary 6 (Level 7) - Ages 10-11

#### Grade Lifecycle

1. **Create** grades with proper naming convention (N1, P1-P6)
2. **Activate** grades to make them available for student enrollment
3. **Manage** classes within each grade
4. **Deactivate** grades when no longer needed (only if no active students)

#### Business Rules

- Grade names must follow format: N1, P1, P2, P3, P4, P5, P6
- Each grade has a unique level for ordering and progression
- Grades can have multiple classes (A, B, C sections)
- Cannot delete grades with associated classes or students
- Cannot deactivate grades with active students
- Grade progression follows level order (N1 → P1 → P2 → ... → P6)

#### List Grades

**Endpoint:** `GET /api/grades`

**Description:** Retrieve all grades ordered by level, with optional filtering

**Query Parameters:**
- `search` (optional): Search grades by name or display name
- `active_only` (optional): Boolean, return only active grades

**Example Requests:**
```bash
# Get all grades
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/grades

# Get active grades only
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/grades?active_only=true

# Search for specific grades
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/grades?search=Primary
```

**Example Response:**
```json
{
    "success": true,
    "message": "Grades retrieved successfully",
    "data": [
        {
            "id": 1,
            "name": "N1",
            "display_name": "Nursery 1",
            "level": 1,
            "description": "Nursery level 1 for children aged 3-4 years",
            "is_active": true,
            "created_at": "2025-01-15T10:00:00.000000Z",
            "updated_at": "2025-01-15T10:00:00.000000Z",
            "classes": [
                {
                    "id": 1,
                    "name": "A",
                    "full_name": "N1A",
                    "capacity": 30,
                    "current_enrollment": 0,
                    "is_active": true
                },
                {
                    "id": 2,
                    "name": "B",
                    "full_name": "N1B",
                    "capacity": 30,
                    "current_enrollment": 0,
                    "is_active": true
                }
            ]
        },
        {
            "id": 2,
            "name": "P1",
            "display_name": "Primary 1",
            "level": 2,
            "description": "Primary level 1 for children aged 5-6 years",
            "is_active": true,
            "created_at": "2025-01-15T10:00:00.000000Z",
            "updated_at": "2025-01-15T10:00:00.000000Z",
            "classes": [
                {
                    "id": 3,
                    "name": "A",
                    "full_name": "P1A",
                    "capacity": 30,
                    "current_enrollment": 0,
                    "is_active": true
                }
            ]
        }
    ]
}
```

#### Create Grade

**Endpoint:** `POST /api/grades`

**Description:** Create a new grade with optional default classes

**Required Fields:**
- `name`: Grade name (must follow N1, P1-P6 format)
- `display_name`: Human-readable name
- `level`: Numeric level for ordering (1-20)

**Optional Fields:**
- `description`: Grade description
- `is_active`: Boolean (default: true)
- `create_default_classes`: Boolean, create default classes
- `default_class_names`: Array of class names to create

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "name": "P7",
         "display_name": "Primary 7",
         "level": 8,
         "description": "Primary level 7 for children aged 11-12 years",
         "is_active": true,
         "create_default_classes": true,
         "default_class_names": ["A", "B"]
     }' \
     http://localhost:8000/api/grades
```

**Example Response:**
```json
{
    "success": true,
    "message": "Grade created successfully",
    "data": {
        "id": 8,
        "name": "P7",
        "display_name": "Primary 7",
        "level": 8,
        "description": "Primary level 7 for children aged 11-12 years",
        "is_active": true,
        "created_at": "2025-01-15T10:00:00.000000Z",
        "updated_at": "2025-01-15T10:00:00.000000Z"
    }
}
```

#### Get Grade Details

**Endpoint:** `GET /api/grades/{id}`

**Description:** Retrieve detailed information about a specific grade including classes, students, and tariffs

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/grades/1
```

**Example Response:**
```json
{
    "success": true,
    "message": "Grade retrieved successfully",
    "data": {
        "id": 1,
        "name": "N1",
        "display_name": "Nursery 1",
        "level": 1,
        "description": "Nursery level 1 for children aged 3-4 years",
        "is_active": true,
        "created_at": "2025-01-15T10:00:00.000000Z",
        "updated_at": "2025-01-15T10:00:00.000000Z",
        "classes": [
            {
                "id": 1,
                "name": "A",
                "full_name": "N1A",
                "capacity": 30,
                "current_enrollment": 5,
                "is_active": true,
                "students": [
                    {
                        "id": 1,
                        "student_id": "STU000001",
                        "first_name": "John",
                        "last_name": "Doe",
                        "status": "active"
                    }
                ],
                "tariffs": [
                    {
                        "id": 1,
                        "name": "Tuition Fee",
                        "amount": "50000.00",
                        "type": "tuition"
                    }
                ]
            }
        ]
    }
}
```

#### Update Grade

**Endpoint:** `PUT /api/grades/{id}`

**Description:** Update grade information

**Example Request:**
```bash
curl -X PUT \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "display_name": "Nursery Level 1",
         "description": "Updated description for Nursery 1"
     }' \
     http://localhost:8000/api/grades/1
```

#### Delete Grade

**Endpoint:** `DELETE /api/grades/{id}`

**Description:** Delete a grade (only if no associated classes or students)

**Example Request:**
```bash
curl -X DELETE \
     -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/grades/8
```

#### Activate Grade

**Endpoint:** `POST /api/grades/{id}/activate`

**Description:** Activate a grade to make it available for enrollment

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/grades/1/activate
```

#### Deactivate Grade

**Endpoint:** `POST /api/grades/{id}/deactivate`

**Description:** Deactivate a grade (only if no active students)

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/grades/1/deactivate
```

#### Get Grade Statistics

**Endpoint:** `GET /api/grades/{id}/statistics`

**Description:** Get comprehensive statistics for a specific grade

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/grades/1/statistics
```

**Example Response:**
```json
{
    "success": true,
    "message": "Grade statistics retrieved successfully",
    "data": {
        "grade": {
            "id": 1,
            "name": "N1",
            "display_name": "Nursery 1",
            "level": 1
        },
        "total_classes": 2,
        "active_classes": 2,
        "total_students": 15,
        "active_students": 15,
        "total_capacity": 60,
        "total_enrollment": 15,
        "average_class_size": 7.5,
        "capacity_utilization": 25.0,
        "classes_with_available_spots": 2,
        "full_classes": 0
    }
}
```

#### Get All Grades Statistics

**Endpoint:** `GET /api/grades/statistics`

**Description:** Get statistics for all active grades

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/grades/statistics
```

#### Create Class for Grade

**Endpoint:** `POST /api/grades/{id}/create-class`

**Description:** Create a new class within a specific grade

**Required Fields:**
- `name`: Class name (A, B, C, etc.)
- `capacity`: Maximum number of students

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "name": "C",
         "capacity": 25,
         "description": "Additional class C for N1"
     }' \
     http://localhost:8000/api/grades/1/create-class
```

#### Bulk Create Classes

**Endpoint:** `POST /api/grades/{id}/bulk-create-classes`

**Description:** Create multiple classes for a grade at once

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "classes": [
             {
                 "name": "D",
                 "capacity": 30,
                 "description": "Class D for P1"
             },
             {
                 "name": "E",
                 "capacity": 25,
                 "description": "Class E for P1"
             }
         ]
     }' \
     http://localhost:8000/api/grades/2/bulk-create-classes
```

#### Get Next Grade

**Endpoint:** `GET /api/grades/{id}/next-grade`

**Description:** Get the next grade in the progression sequence

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/grades/1/next-grade
```

#### Get Previous Grade

**Endpoint:** `GET /api/grades/{id}/previous-grade`

**Description:** Get the previous grade in the progression sequence

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/grades/2/previous-grade
```

#### Get Active Grades Only

**Endpoint:** `GET /api/grades/active`

**Description:** Get only active grades

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/grades/active
```

#### Search Grades

**Endpoint:** `GET /api/grades/search`

**Description:** Search grades by name or display name

**Query Parameters:**
- `query`: Search term

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/grades/search?query=Primary
```

#### Bulk Operations

**Bulk Activate Grades**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "grade_ids": [1, 2, 3]
     }' \
     http://localhost:8000/api/grades/bulk-activate
```

**Bulk Deactivate Grades**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "grade_ids": [4, 5, 6]
     }' \
     http://localhost:8000/api/grades/bulk-deactivate
```

### 3. Terms

Terms represent academic periods within an academic year. Each term has a specific lifecycle and belongs to an academic year.

#### Term Lifecycle

1. **Upcoming** → **Active** → **Completed**
   - **Upcoming**: Term is scheduled but not yet started
   - **Active**: Term is currently running (only one can be active per academic year)
   - **Completed**: Term has been completed

#### Typical Term Workflow

1. **Create** terms within an active academic year
2. **Activate** a term when it should start
3. **Manage** students and billing during the active period
4. **Complete** the term when it ends
5. **Archive** (term remains in database for historical records)

#### Business Rules

- Terms must be created within an active academic year
- Terms cannot overlap within the same academic year
- Only one term can be active per academic year at a time
- Terms must be at least 1 week long
- Term dates must be within the academic year boundaries
- Completed terms cannot be modified

#### List Terms
```
GET /api/terms
```
Headers:
```
Authorization: Bearer <your-token>
```

**Query Parameters:**
- `search` (optional): Search by term name
- `academic_year_id` (optional): Filter by academic year

**Examples:**
```bash
# Get all terms
curl -X GET http://localhost:8000/api/terms \
  -H "Authorization: Bearer your-token-here" \
  -H "Accept: application/json"

# Get terms for specific academic year
curl -X GET "http://localhost:8000/api/terms?academic_year_id=6" \
  -H "Authorization: Bearer your-token-here" \
  -H "Accept: application/json"

# Search terms
curl -X GET "http://localhost:8000/api/terms?search=Term 1" \
  -H "Authorization: Bearer your-token-here" \
  -H "Accept: application/json"
```

**Response:**
```json
{
    "success": true,
    "message": "Terms retrieved successfully",
    "data": [
        {
            "id": 1,
            "academic_year_id": 6,
            "name": "Term 1",
            "start_date": "2027-09-01T00:00:00.000000Z",
            "end_date": "2027-12-15T00:00:00.000000Z",
            "status": "active",
            "description": "First term",
            "created_at": "2025-07-13T10:00:15.000000Z",
            "updated_at": "2025-07-13T10:04:37.000000Z"
        }
    ]
}
```

#### Create Term
```
POST /api/terms
```
Headers:
```
Authorization: Bearer <your-token>
```
Body:
```json
{
    "academic_year_id": 6,
    "name": "Term 1",
    "start_date": "2027-09-01",
    "end_date": "2027-12-15",
    "description": "First term"
}
```

**Required Fields:**
- `academic_year_id` (integer): ID of the academic year (must exist and be active)
- `name` (string, max 255 chars): Name of the term
- `start_date` (date): Start date of the term
- `end_date` (date): End date of the term (must be after start_date)

**Optional Fields:**
- `description` (string, max 1000 chars): Additional description for the term

**Validation Rules:**
- Academic year must exist and be active
- Term dates must be within the academic year boundaries
- Term must be at least 1 week long
- Cannot overlap with existing terms in the same academic year
- All dates should be in YYYY-MM-DD format

**Response:**
```json
{
    "success": true,
    "message": "Term created successfully",
    "data": {
        "id": 1,
        "academic_year_id": 6,
        "name": "Term 1",
        "start_date": "2027-09-01T00:00:00.000000Z",
        "end_date": "2027-12-15T00:00:00.000000Z",
        "status": "upcoming",
        "description": "First term",
        "created_at": "2025-07-13T10:00:15.000000Z",
        "updated_at": "2025-07-13T10:00:15.000000Z"
    }
}
```

#### Get Term
```
GET /api/terms/{id}
```
Headers:
```
Authorization: Bearer <your-token>
```

**Response:**
```json
{
    "success": true,
    "message": "Term retrieved successfully",
    "data": {
        "id": 1,
        "academic_year_id": 6,
        "name": "Term 1",
        "start_date": "2027-09-01T00:00:00.000000Z",
        "end_date": "2027-12-15T00:00:00.000000Z",
        "status": "active",
        "description": "First term",
        "created_at": "2025-07-13T10:00:15.000000Z",
        "updated_at": "2025-07-13T10:04:37.000000Z",
        "academic_year": {
            "id": 6,
            "name": "2027-2028",
            "start_date": "2027-09-01T00:00:00.000000Z",
            "end_date": "2028-06-30T00:00:00.000000Z",
            "status": "active",
            "description": "Test academic year for terms"
        }
    }
}
```

#### Update Term
```
PUT /api/terms/{id}
```
Headers:
```
Authorization: Bearer <your-token>
```
Body:
```json
{
    "name": "Term 1 Updated",
    "description": "Updated first term",
    "start_date": "2027-09-01",
    "end_date": "2027-12-20"
}
```

**Notes:**
- All fields are optional (use "sometimes" validation)
- Cannot modify completed terms
- Date validation applies when dates are updated
- Name uniqueness within academic year is recommended

**Response:**
```json
{
    "success": true,
    "message": "Term updated successfully",
    "data": {
        "id": 1,
        "academic_year_id": 6,
        "name": "Term 1 Updated",
        "start_date": "2027-09-01T00:00:00.000000Z",
        "end_date": "2027-12-20T00:00:00.000000Z",
        "status": "active",
        "description": "Updated first term",
        "created_at": "2025-07-13T10:00:15.000000Z",
        "updated_at": "2025-07-13T10:15:00.000000Z"
    }
}
```

#### Delete Term
```
DELETE /api/terms/{id}
```
Headers:
```
Authorization: Bearer <your-token>
```

**Prerequisites:**
- Term must not have associated bills
- Term must not be active or completed
- Term status should be "upcoming"

**Response:**
```json
{
    "success": true,
    "message": "Term deleted successfully",
    "data": null
}
```

#### Activate Term
```
POST /api/terms/{id}/activate
```
Headers:
```
Authorization: Bearer <your-token>
```

**Business Logic:**
- Only one term can be active per academic year at a time
- Activating a term will automatically deactivate other active terms in the same academic year
- Term must be in "upcoming" status
- Academic year must be active

**Response:**
```json
{
    "success": true,
    "message": "Term activated successfully",
    "data": {
        "id": 1,
        "academic_year_id": 6,
        "name": "Term 1",
        "start_date": "2027-09-01T00:00:00.000000Z",
        "end_date": "2027-12-15T00:00:00.000000Z",
        "status": "active",
        "description": "First term",
        "created_at": "2025-07-13T10:00:15.000000Z",
        "updated_at": "2025-07-13T10:04:37.000000Z"
    }
}
```

#### Complete Term
```
POST /api/terms/{id}/complete
```
Headers:
```
Authorization: Bearer <your-token>
```

**Prerequisites:**
- Term must be currently active
- Term end date should have passed (business logic check)

**Response:**
```json
{
    "success": true,
    "message": "Term completed successfully",
    "data": {
        "id": 1,
        "academic_year_id": 6,
        "name": "Term 1",
        "start_date": "2027-09-01T00:00:00.000000Z",
        "end_date": "2027-12-15T00:00:00.000000Z",
        "status": "completed",
        "description": "First term",
        "created_at": "2025-07-13T10:00:15.000000Z",
        "updated_at": "2025-07-13T10:20:00.000000Z"
    }
}
```

#### Get Current Term
```
GET /api/terms/current
```
Headers:
```
Authorization: Bearer <your-token>
```

**Description:** Returns the currently active term that is running now (status = "active" and current date is within term dates)

**Response:**
```json
{
    "success": true,
    "message": "Current term retrieved successfully",
    "data": {
        "id": 1,
        "academic_year_id": 6,
        "name": "Term 1",
        "start_date": "2027-09-01T00:00:00.000000Z",
        "end_date": "2027-12-15T00:00:00.000000Z",
        "status": "active",
        "description": "First term",
        "created_at": "2025-07-13T10:00:15.000000Z",
        "updated_at": "2025-07-13T10:04:37.000000Z"
    }
}
```

**No Current Term Response:**
```json
{
    "success": false,
    "message": "No active term found",
    "data": null
}
```

#### Get Active Terms
```
GET /api/terms/active
```
Headers:
```
Authorization: Bearer <your-token>
```

**Description:** Returns all terms with status = "active"

**Response:**
```json
{
    "success": true,
    "message": "Active terms retrieved successfully",
    "data": [
        {
            "id": 1,
            "academic_year_id": 6,
            "name": "Term 1",
            "start_date": "2027-09-01T00:00:00.000000Z",
            "end_date": "2027-12-15T00:00:00.000000Z",
            "status": "active",
            "description": "First term",
            "created_at": "2025-07-13T10:00:15.000000Z",
            "updated_at": "2025-07-13T10:04:37.000000Z"
        }
    ]
}
```

#### Get Terms by Academic Year
```
GET /api/terms/by-academic-year/{academicYearId}
```
Headers:
```
Authorization: Bearer <your-token>
```

**Description:** Returns all terms for a specific academic year

**Response:**
```json
{
    "success": true,
    "message": "Terms retrieved successfully",
    "data": [
        {
            "id": 1,
            "academic_year_id": 6,
            "name": "Term 1",
            "start_date": "2027-09-01T00:00:00.000000Z",
            "end_date": "2027-12-15T00:00:00.000000Z",
            "status": "active",
            "description": "First term",
            "created_at": "2025-07-13T10:00:15.000000Z",
            "updated_at": "2025-07-13T10:04:37.000000Z"
        }
    ]
}
```

#### Get Term Statistics
```
GET /api/terms/{id}/statistics
```
Headers:
```
Authorization: Bearer <your-token>
```

**Description:** Returns comprehensive statistics for a specific term

**Response:**
```json
{
    "success": true,
    "message": "Term statistics retrieved successfully",
    "data": {
        "term": {
            "id": 1,
            "academic_year_id": 6,
            "name": "Term 1",
            "start_date": "2027-09-01T00:00:00.000000Z",
            "end_date": "2027-12-15T00:00:00.000000Z",
            "status": "active",
            "description": "First term"
        },
        "total_bills": 0,
        "total_revenue": 0,
        "outstanding_amount": 0,
        "duration_days": 106,
        "days_elapsed": -779,
        "days_remaining": 884
    }
}
```

#### Check if Term Can Be Deleted
```
GET /api/terms/{id}/can-delete
```
Headers:
```
Authorization: Bearer <your-token>
```

**Response:**
```json
{
    "success": true,
    "message": "Term can be deleted",
    "data": {
        "can_delete": true,
        "message": "Term can be deleted"
    }
}
```

### 4. Students

Students represent the learners enrolled in the school system. Each student has comprehensive information including personal details, parent information, disability status, and location data following Rwanda's administrative structure.

#### Student Lifecycle

1. **Register** a new student with all required information
2. **Assign** to a class within an appropriate grade
3. **Manage** throughout their academic journey (transfers, promotions)
4. **Graduate** or **Transfer** when completing their studies

#### Business Rules

- Student IDs are auto-generated with format "STU" + 5 digits
- Students must be between 3-18 years old
- Students can only be assigned to one class at a time
- Disability description is required when disability is marked as true
- Province must be one of Rwanda's 5 provinces
- Students with outstanding bills cannot be deleted
- Active students cannot be deleted (must be deactivated first)

#### List Students

**Endpoint:** `GET /api/students`

**Description:** Retrieve students with optional filtering and search

**Query Parameters:**
- `search` (optional): Search by student name (first name + last name)
- `class_id` (optional): Filter students by specific class
- `grade_id` (optional): Filter students by specific grade

**Example Requests:**
```bash
# Get all students
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/students

# Search students by name
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/students?search=John

# Get students in specific class
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/students?class_id=1

# Get students in specific grade
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/students?grade_id=2
```

**Example Response:**
```json
{
    "success": true,
    "message": "Students retrieved successfully",
    "data": [
        {
            "id": 1,
            "student_id": "STU00001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "date_of_birth": "2015-05-15",
    "gender": "male",
            "phone": "+250788123456",
            "address": "Kigali, Rwanda",
    "parent_name": "Jane Doe",
    "parent_email": "jane.doe@example.com",
            "parent_phone": "+250788654321",
            "father_name": "Robert Doe",
            "mother_name": "Jane Doe",
            "emergency_contact": "+250788999888",
            "enrollment_date": "2025-01-15",
            "status": "active",
            "medical_conditions": null,
            "allergies": null,
            "disability": false,
            "disability_description": null,
            "province": "Kigali",
            "district": "Gasabo",
            "sector": "Kimironko",
            "cell": "Nyarutarama",
            "village": "Ubumwe",
            "class_id": 1,
            "full_name": "John Doe",
            "age": 9,
            "is_active": true,
            "has_class": true,
            "class": {
                "id": 1,
                "name": "A",
                "full_name": "N1A",
                "grade": {
                    "id": 1,
                    "name": "N1",
                    "display_name": "Nursery 1"
                }
            },
            "created_at": "2025-01-15T10:00:00.000000Z",
            "updated_at": "2025-01-15T10:00:00.000000Z"
        }
    ]
}
```

#### Register Student

**Endpoint:** `POST /api/students`

**Description:** Register a new student with comprehensive information

**Required Fields:**
- `first_name` (string, max 255): Student's first name
- `last_name` (string, max 255): Student's last name
- `date_of_birth` (date): Student's date of birth (must be before today)
- `gender` (string): Student's gender (male, female, other)
- `parent_name` (string, max 255): Primary parent/guardian name
- `parent_email` (email): Primary parent/guardian email
- `parent_phone` (string, max 20): Primary parent/guardian phone

**Optional Fields:**
- `email` (email): Student's email (must be unique)
- `phone` (string, max 20): Student's phone number
- `address` (string, max 500): Student's address
- `father_name` (string, max 255): Father's full name
- `mother_name` (string, max 255): Mother's full name
- `emergency_contact` (string, max 255): Emergency contact information
- `enrollment_date` (date): Date of enrollment (defaults to today)
- `medical_conditions` (string, max 1000): Medical conditions
- `allergies` (string, max 1000): Known allergies
- `disability` (boolean): Whether student has a disability
- `disability_description` (string, max 1000): Description of disability (required if disability is true)
- `province` (string): Rwanda province (Kigali, Eastern, Northern, Southern, Western)
- `district` (string, max 255): District name
- `sector` (string, max 255): Sector name
- `cell` (string, max 255): Cell name
- `village` (string, max 255): Village name
- `class_id` (integer): ID of class to assign student to

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "first_name": "John",
         "last_name": "Doe",
         "email": "john.doe@example.com",
         "date_of_birth": "2015-05-15",
         "gender": "male",
         "phone": "+250788123456",
         "address": "Kigali, Rwanda",
         "parent_name": "Jane Doe",
         "parent_email": "jane.doe@example.com",
         "parent_phone": "+250788654321",
         "father_name": "Robert Doe",
         "mother_name": "Jane Doe",
         "emergency_contact": "+250788999888",
         "enrollment_date": "2025-01-15",
    "medical_conditions": "None",
    "allergies": "None",
         "disability": false,
         "disability_description": null,
         "province": "Kigali",
         "district": "Gasabo",
         "sector": "Kimironko",
         "cell": "Nyarutarama",
         "village": "Ubumwe",
    "class_id": 1
     }' \
     http://localhost:8000/api/students
```

**Example Response:**
```json
{
    "success": true,
    "message": "Student registered successfully",
    "data": {
        "id": 1,
        "student_id": "STU00001",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "date_of_birth": "2015-05-15",
        "gender": "male",
        "phone": "+250788123456",
        "address": "Kigali, Rwanda",
        "parent_name": "Jane Doe",
        "parent_email": "jane.doe@example.com",
        "parent_phone": "+250788654321",
        "father_name": "Robert Doe",
        "mother_name": "Jane Doe",
        "emergency_contact": "+250788999888",
        "enrollment_date": "2025-01-15",
        "status": "active",
        "medical_conditions": "None",
        "allergies": "None",
        "disability": false,
        "disability_description": null,
        "province": "Kigali",
        "district": "Gasabo",
        "sector": "Kimironko",
        "cell": "Nyarutarama",
        "village": "Ubumwe",
        "class_id": 1,
        "full_name": "John Doe",
        "age": 9,
        "is_active": true,
        "has_class": true,
        "class": {
            "id": 1,
            "name": "A",
            "full_name": "N1A",
            "grade": {
                "id": 1,
                "name": "N1",
                "display_name": "Nursery 1"
            }
        },
        "created_at": "2025-01-15T10:00:00.000000Z",
        "updated_at": "2025-01-15T10:00:00.000000Z"
    }
}
```

#### Get Student Details

**Endpoint:** `GET /api/students/{id}`

**Description:** Retrieve detailed information about a specific student

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/students/1
```

**Example Response:**
```json
{
    "success": true,
    "message": "Student retrieved successfully",
    "data": {
        "id": 1,
        "student_id": "STU00001",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "date_of_birth": "2015-05-15",
        "gender": "male",
        "phone": "+250788123456",
        "address": "Kigali, Rwanda",
        "parent_name": "Jane Doe",
        "parent_email": "jane.doe@example.com",
        "parent_phone": "+250788654321",
        "father_name": "Robert Doe",
        "mother_name": "Jane Doe",
        "emergency_contact": "+250788999888",
        "enrollment_date": "2025-01-15",
        "status": "active",
        "medical_conditions": "None",
        "allergies": "None",
        "disability": false,
        "disability_description": null,
        "province": "Kigali",
        "district": "Gasabo",
        "sector": "Kimironko",
        "cell": "Nyarutarama",
        "village": "Ubumwe",
        "class_id": 1,
        "full_name": "John Doe",
        "age": 9,
        "is_active": true,
        "has_class": true,
        "class": {
            "id": 1,
            "name": "A",
            "full_name": "N1A",
            "capacity": 30,
            "current_enrollment": 1,
            "grade": {
                "id": 1,
                "name": "N1",
                "display_name": "Nursery 1",
                "level": 1
            }
        },
        "bills": [
            {
                "id": 1,
                "total_amount": "50000.00",
                "paid_amount": "25000.00",
                "balance": "25000.00",
                "status": "pending",
                "due_date": "2025-02-15"
            }
        ],
        "total_bill_amount": "50000.00",
        "total_paid_amount": "25000.00",
        "total_outstanding_amount": "25000.00",
        "has_outstanding_bills": true,
        "created_at": "2025-01-15T10:00:00.000000Z",
        "updated_at": "2025-01-15T10:00:00.000000Z"
    }
}
```

#### Update Student

**Endpoint:** `PUT /api/students/{id}`

**Description:** Update student information

**Note:** All fields are optional. Only provide fields that need to be updated.

**Example Request:**
```bash
curl -X PUT \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "first_name": "John Updated",
         "phone": "+250788123999",
         "address": "Updated Address, Kigali",
         "father_name": "Robert Updated Doe",
         "mother_name": "Jane Updated Doe",
         "disability": true,
         "disability_description": "Requires glasses for vision correction",
         "province": "Eastern",
         "district": "Gatsibo",
         "sector": "Remera",
         "cell": "Kacyiru",
         "village": "Amahoro"
     }' \
     http://localhost:8000/api/students/1
```

**Example Response:**
```json
{
    "success": true,
    "message": "Student updated successfully",
    "data": {
        "id": 1,
        "student_id": "STU00001",
        "first_name": "John Updated",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "date_of_birth": "2015-05-15",
        "gender": "male",
        "phone": "+250788123999",
        "address": "Updated Address, Kigali",
        "parent_name": "Jane Doe",
        "parent_email": "jane.doe@example.com",
        "parent_phone": "+250788654321",
        "father_name": "Robert Updated Doe",
        "mother_name": "Jane Updated Doe",
        "emergency_contact": "+250788999888",
        "enrollment_date": "2025-01-15",
        "status": "active",
        "medical_conditions": "None",
        "allergies": "None",
        "disability": true,
        "disability_description": "Requires glasses for vision correction",
        "province": "Eastern",
        "district": "Gatsibo",
        "sector": "Remera",
        "cell": "Kacyiru",
        "village": "Amahoro",
        "class_id": 1,
        "full_name": "John Updated Doe",
        "age": 9,
        "is_active": true,
        "has_class": true,
        "created_at": "2025-01-15T10:00:00.000000Z",
        "updated_at": "2025-01-15T11:00:00.000000Z"
    }
}
```

#### Deactivate Student

**Endpoint:** `DELETE /api/students/{id}`

**Description:** Deactivate a student (soft delete) with a reason

**Body:**
```json
{
    "reason": "Student transferred to another school"
}
```

**Example Request:**
```bash
curl -X DELETE \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "reason": "Student transferred to another school"
     }' \
     http://localhost:8000/api/students/1
```

**Example Response:**
```json
{
    "success": true,
    "message": "Student deactivated successfully",
    "data": {
        "id": 1,
        "student_id": "STU00001",
        "first_name": "John",
        "last_name": "Doe",
        "status": "inactive",
        "full_name": "John Doe",
        "is_active": false,
        "deactivation_reason": "Student transferred to another school",
        "deactivated_at": "2025-01-15T12:00:00.000000Z"
    }
}
```

#### Assign Student to Class

**Endpoint:** `POST /api/students/{id}/assign-to-class`

**Description:** Assign a student to a specific class

**Body:**
```json
{
    "class_id": 2
}
```

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "class_id": 2
     }' \
     http://localhost:8000/api/students/1/assign-to-class
```

**Example Response:**
```json
{
    "success": true,
    "message": "Student assigned to class successfully",
    "data": {
        "id": 1,
        "student_id": "STU00001",
        "first_name": "John",
        "last_name": "Doe",
        "class_id": 2,
        "class": {
            "id": 2,
            "name": "B",
            "full_name": "N1B",
            "grade": {
                "id": 1,
                "name": "N1",
                "display_name": "Nursery 1"
            }
        }
    }
}
```

#### Remove Student from Class

**Endpoint:** `POST /api/students/{id}/remove-from-class`

**Description:** Remove a student from their current class

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/students/1/remove-from-class
```

**Example Response:**
```json
{
    "success": true,
    "message": "Student removed from class successfully",
    "data": {
        "id": 1,
        "student_id": "STU00001",
        "first_name": "John",
        "last_name": "Doe",
        "class_id": null,
        "has_class": false
    }
}
```

#### Transfer Student

**Endpoint:** `POST /api/students/{id}/transfer`

**Description:** Transfer a student to a different class

**Body:**
```json
{
    "new_class_id": 3
}
```

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "new_class_id": 3
     }' \
     http://localhost:8000/api/students/1/transfer
```

**Example Response:**
```json
{
    "success": true,
    "message": "Student transferred successfully",
    "data": {
        "id": 1,
        "student_id": "STU00001",
        "first_name": "John",
        "last_name": "Doe",
        "class_id": 3,
        "class": {
            "id": 3,
            "name": "A",
            "full_name": "P1A",
            "grade": {
                "id": 2,
                "name": "P1",
                "display_name": "Primary 1"
            }
        }
    }
}
```

#### Promote Student

**Endpoint:** `POST /api/students/{id}/promote`

**Description:** Promote a student to the next grade level

**Body:**
```json
{
    "target_grade_id": 3,
    "target_class_id": 6
}
```

**Note:** `target_class_id` is optional. If not provided, the system will find an available class in the target grade.

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "target_grade_id": 3,
         "target_class_id": 6
     }' \
     http://localhost:8000/api/students/1/promote
```

**Example Response:**
```json
{
    "success": true,
    "message": "Student promoted successfully",
    "data": {
        "id": 1,
        "student_id": "STU00001",
        "first_name": "John",
        "last_name": "Doe",
        "class_id": 6,
        "class": {
            "id": 6,
            "name": "A",
            "full_name": "P2A",
            "grade": {
                "id": 3,
                "name": "P2",
                "display_name": "Primary 2"
            }
        },
        "previous_grade": "P1",
        "current_grade": "P2",
        "promoted_at": "2025-01-15T12:00:00.000000Z"
    }
}
```

#### Graduate Student

**Endpoint:** `POST /api/students/{id}/graduate`

**Description:** Graduate a student (typically from P6)

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/students/1/graduate
```

**Example Response:**
```json
{
    "success": true,
    "message": "Student graduated successfully",
    "data": {
        "id": 1,
        "student_id": "STU00001",
        "first_name": "John",
        "last_name": "Doe",
        "status": "graduated",
        "graduation_date": "2025-01-15",
        "graduated_from": "P6A",
        "is_active": false
    }
}
```

#### Bulk Promote Students

**Endpoint:** `POST /api/students/bulk-promote`

**Description:** Promote multiple students to the next grade level

**Body:**
```json
{
    "student_ids": [1, 2, 3, 4, 5],
    "target_grade_id": 3
}
```

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "student_ids": [1, 2, 3, 4, 5],
         "target_grade_id": 3
     }' \
     http://localhost:8000/api/students/bulk-promote
```

**Example Response:**
```json
{
    "success": true,
    "message": "Bulk promotion completed",
    "data": {
        "successful_promotions": [
            {
                "student_id": 1,
                "student_name": "John Doe",
                "from_grade": "P1",
                "to_grade": "P2",
                "new_class": "P2A"
            },
            {
                "student_id": 2,
                "student_name": "Jane Smith",
                "from_grade": "P1",
                "to_grade": "P2",
                "new_class": "P2B"
            }
        ],
        "failed_promotions": [
            {
                "student_id": 3,
                "student_name": "Bob Johnson",
                "error": "No available classes in target grade"
            }
        ],
        "total_students": 5,
        "successful_count": 2,
        "failed_count": 3
    }
}
```

#### Get Students with Outstanding Bills

**Endpoint:** `GET /api/students/with-outstanding-bills`

**Description:** Retrieve all students who have unpaid bills

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/students/with-outstanding-bills
```

**Example Response:**
```json
{
    "success": true,
    "message": "Students with outstanding bills retrieved successfully",
    "data": [
        {
            "id": 1,
            "student_id": "STU00001",
            "first_name": "John",
            "last_name": "Doe",
            "full_name": "John Doe",
            "total_outstanding_amount": "25000.00",
            "overdue_amount": "10000.00",
            "class": {
                "id": 1,
                "full_name": "N1A"
            },
            "parent_name": "Jane Doe",
            "parent_email": "jane.doe@example.com",
            "parent_phone": "+250788654321"
        }
    ]
}
```

#### Get Students by Class

**Endpoint:** `GET /api/students/by-class/{classId}`

**Description:** Retrieve all students in a specific class

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/students/by-class/1
```

**Example Response:**
```json
{
    "success": true,
    "message": "Students in class retrieved successfully",
    "data": {
        "class": {
            "id": 1,
            "name": "A",
            "full_name": "N1A",
            "capacity": 30,
            "current_enrollment": 2,
            "grade": {
                "id": 1,
                "name": "N1",
                "display_name": "Nursery 1"
            }
        },
        "students": [
            {
                "id": 1,
                "student_id": "STU00001",
                "first_name": "John",
                "last_name": "Doe",
                "full_name": "John Doe",
                "age": 9,
                "gender": "male",
                "status": "active",
                "enrollment_date": "2025-01-15",
                "parent_name": "Jane Doe",
                "parent_email": "jane.doe@example.com",
                "disability": false
            }
        ]
    }
}
```

#### Get Students by Grade

**Endpoint:** `GET /api/students/by-grade/{gradeId}`

**Description:** Retrieve all students in a specific grade

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/students/by-grade/1
```

**Example Response:**
```json
{
    "success": true,
    "message": "Students in grade retrieved successfully",
    "data": {
        "grade": {
            "id": 1,
            "name": "N1",
            "display_name": "Nursery 1",
            "level": 1
        },
        "total_students": 5,
        "students": [
            {
                "id": 1,
                "student_id": "STU00001",
                "first_name": "John",
                "last_name": "Doe",
                "full_name": "John Doe",
                "age": 9,
                "gender": "male",
                "status": "active",
                "class": {
                    "id": 1,
                    "name": "A",
                    "full_name": "N1A"
                },
                "disability": false,
                "province": "Kigali",
                "district": "Gasabo"
            }
        ]
    }
}
```

#### Student Search and Filtering

**Advanced Search Parameters:**
- `search`: Search by name, student ID, or parent name
- `status`: Filter by status (active, inactive, graduated, transferred)
- `gender`: Filter by gender (male, female, other)
- `disability`: Filter by disability status (true/false)
- `province`: Filter by province
- `district`: Filter by district
- `age_min`: Minimum age filter
- `age_max`: Maximum age filter
- `has_outstanding_bills`: Filter students with outstanding bills

**Example Advanced Search:**
```bash
curl -H "Authorization: Bearer <token>" \
     "http://localhost:8000/api/students?search=John&status=active&gender=male&disability=false&province=Kigali"
```

#### Student Validation Rules

**Registration/Update Validation:**
- `first_name`: Required, max 255 characters
- `last_name`: Required, max 255 characters
- `email`: Optional, valid email format, unique
- `date_of_birth`: Required, must be before today, age 3-18
- `gender`: Required, one of: male, female, other
- `parent_name`: Required, max 255 characters
- `parent_email`: Required, valid email format
- `parent_phone`: Required, max 20 characters
- `father_name`: Optional, max 255 characters
- `mother_name`: Optional, max 255 characters
- `disability`: Optional, boolean
- `disability_description`: Required if disability is true, max 1000 characters
- `province`: Optional, must be one of: Kigali, Eastern, Northern, Southern, Western
- `district`: Optional, max 255 characters
- `sector`: Optional, max 255 characters
- `cell`: Optional, max 255 characters
- `village`: Optional, max 255 characters
- `class_id`: Optional, must exist in classes table

#### Error Responses

**Validation Error Example:**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "first_name": ["The first name field is required."],
        "date_of_birth": ["The student must be between 3 and 18 years old."],
        "disability_description": ["Disability description is required when disability is marked as true."],
        "province": ["Invalid province. Must be one of: Kigali, Eastern, Northern, Southern, Western."]
    }
}
```

**Business Logic Error Example:**
```json
{
    "success": false,
    "message": "Student cannot be assigned to this class",
    "errors": {
        "class_id": ["Class is full or student is not eligible for this class."]
    }
}
```

### 5. Classes

Classes represent specific sections within grades (e.g., N1A, P1B, P2C). Each class has a capacity, current enrollment, and can have multiple tariffs assigned to it. Students are enrolled in classes, and billing is based on the tariffs assigned to their class.

#### Class Structure

Classes are organized within grades and follow a naming convention:
- **Grade + Section**: N1A, N1B, P1A, P1B, P1C, P2A, P2B, P2C, etc.
- **Capacity**: Maximum number of students the class can accommodate
- **Current Enrollment**: Number of students currently enrolled
- **Tariffs**: Fees assigned to the class that all students must pay

#### Business Rules

- Classes must belong to an active grade
- Class capacity must be at least 1 and at most 100 students
- Classes can have multiple tariffs assigned
- Students can only be enrolled in one class at a time
- Cannot delete classes with enrolled students
- Class enrollment is automatically updated when students are added/removed

#### List Classes

**Endpoint:** `GET /api/classes`

**Description:** Retrieve all classes with optional filtering

**Query Parameters:**
- `search` (optional): Search by class name or full name
- `grade_id` (optional): Filter by specific grade

**Example Requests:**
```bash
# Get all classes
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/classes

# Get classes for specific grade
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/classes?grade_id=1

# Search for classes
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/classes?search=N1
```

**Example Response:**
```json
{
    "success": true,
    "message": "Classes retrieved successfully",
    "data": [
        {
            "id": 1,
            "name": "A",
            "full_name": "N1A",
            "grade_id": 1,
            "capacity": 30,
            "current_enrollment": 1,
            "description": "Nursery 1 Section A",
            "is_active": true,
            "available_space": 29,
            "is_full": false,
            "occupancy_rate": 3.33,
            "display_name": "N1A (Nursery 1)",
            "grade": {
                "id": 1,
                "name": "N1",
                "display_name": "Nursery 1",
                "level": 1
            },
            "created_at": "2025-01-15T10:00:00.000000Z",
            "updated_at": "2025-01-15T10:00:00.000000Z"
        }
    ]
}
```

#### Create Class

**Endpoint:** `POST /api/classes`

**Description:** Create a new class within a grade

**Required Fields:**
- `name` (string, max 255): Class name/section (e.g., "A", "B", "C")
- `grade_id` (integer): ID of the grade this class belongs to
- `capacity` (integer, 1-100): Maximum number of students

**Optional Fields:**
- `description` (string, max 1000): Class description
- `is_active` (boolean): Whether class is active (default: true)
- `tariff_ids` (array): Array of tariff IDs to assign to this class

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "name": "D",
         "grade_id": 2,
         "capacity": 25,
         "description": "Primary 1 Section D",
         "is_active": true,
         "tariff_ids": [1, 2, 3]
     }' \
     http://localhost:8000/api/classes
```

**Example Response:**
```json
{
    "success": true,
    "message": "Class created successfully",
    "data": {
        "id": 18,
        "name": "D",
        "full_name": "P1D",
        "grade_id": 2,
        "capacity": 25,
        "current_enrollment": 0,
        "description": "Primary 1 Section D",
        "is_active": true,
        "available_space": 25,
        "is_full": false,
        "occupancy_rate": 0.0,
        "display_name": "P1D (Primary 1)",
        "grade": {
            "id": 2,
            "name": "P1",
            "display_name": "Primary 1",
            "level": 2
        },
        "tariffs": [
            {
                "id": 1,
                "name": "Tuition Fee",
                "amount": "50000.00",
                "type": "tuition"
            }
        ],
        "created_at": "2025-01-15T10:00:00.000000Z",
        "updated_at": "2025-01-15T10:00:00.000000Z"
    }
}
```

#### Get Class Details

**Endpoint:** `GET /api/classes/{id}`

**Description:** Retrieve detailed information about a specific class

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/classes/1
```

**Example Response:**
```json
{
    "success": true,
    "message": "Class retrieved successfully",
    "data": {
        "id": 1,
        "name": "A",
        "full_name": "N1A",
        "grade_id": 1,
        "capacity": 30,
        "current_enrollment": 1,
        "description": "Nursery 1 Section A",
        "is_active": true,
        "available_space": 29,
        "is_full": false,
        "occupancy_rate": 3.33,
        "display_name": "N1A (Nursery 1)",
        "total_tariff_amount": 80000.00,
        "grade": {
            "id": 1,
            "name": "N1",
            "display_name": "Nursery 1",
            "level": 1
        },
        "students": [
            {
                "id": 1,
                "student_id": "STU000001",
                "first_name": "John",
                "last_name": "Doe",
                "full_name": "John Doe",
                "status": "active",
                "enrollment_date": "2025-01-15"
            }
        ],
        "tariffs": [
            {
                "id": 1,
                "name": "Tuition Fee",
                "type": "tuition",
                "amount": "50000.00",
                "billing_frequency": "per_term",
                "is_active": true,
                "pivot": {
                    "class_id": 1,
                    "tariff_id": 1,
                    "is_active": true
                }
            }
        ],
        "created_at": "2025-01-15T10:00:00.000000Z",
        "updated_at": "2025-01-15T10:00:00.000000Z"
    }
}
```

#### Update Class

**Endpoint:** `PUT /api/classes/{id}`

**Description:** Update class information

**Note:** All fields are optional. Only provide fields that need to be updated.

**Example Request:**
```bash
curl -X PUT \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "name": "A Updated",
         "capacity": 35,
         "description": "Updated Nursery 1 Section A"
     }' \
     http://localhost:8000/api/classes/1
```

**Example Response:**
```json
{
    "success": true,
    "message": "Class updated successfully",
    "data": {
        "id": 1,
        "name": "A Updated",
        "full_name": "N1A Updated",
        "grade_id": 1,
        "capacity": 35,
        "current_enrollment": 1,
        "description": "Updated Nursery 1 Section A",
        "is_active": true,
        "available_space": 34,
        "is_full": false,
        "occupancy_rate": 2.86,
        "updated_at": "2025-01-15T11:00:00.000000Z"
    }
}
```

#### Delete Class

**Endpoint:** `DELETE /api/classes/{id}`

**Description:** Delete a class (only if no students are enrolled)

**Prerequisites:**
- Class must have no enrolled students
- Class must have no associated bills

**Example Request:**
```bash
curl -X DELETE \
     -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/classes/18
```

**Example Response:**
```json
{
    "success": true,
    "message": "Class deleted successfully",
    "data": null
}
```

**Error Response:**
```json
{
    "success": false,
    "message": "Class cannot be deleted. It has enrolled students.",
    "errors": []
}
```

#### Get Classes with Available Spots

**Endpoint:** `GET /api/classes/with-available-spots`

**Description:** Retrieve all classes that have available enrollment spots

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/classes/with-available-spots
```

**Example Response:**
```json
{
    "success": true,
    "message": "Classes with available spots retrieved successfully",
    "data": [
        {
            "id": 1,
            "name": "A",
            "full_name": "N1A",
            "grade_id": 1,
            "capacity": 30,
            "current_enrollment": 1,
            "available_space": 29,
            "occupancy_rate": 3.33,
            "grade": {
                "id": 1,
                "name": "N1",
                "display_name": "Nursery 1"
            }
        }
    ]
}
```

#### Get Class Statistics

**Endpoint:** `GET /api/classes/{id}/statistics`

**Description:** Get comprehensive statistics for a specific class

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/classes/1/statistics
```

**Example Response:**
```json
{
    "success": true,
    "message": "Class statistics retrieved successfully",
    "data": {
        "class": {
            "id": 1,
            "name": "A",
            "full_name": "N1A",
            "capacity": 30,
            "current_enrollment": 1,
            "grade": {
                "id": 1,
                "name": "N1",
                "display_name": "Nursery 1"
            }
        },
        "total_students": 1,
        "available_spots": 29,
        "capacity_utilization": 3.33,
        "total_tariffs": 3,
        "total_tariff_amount": 80000.00,
        "active_students": 1,
        "inactive_students": 0,
        "gender_distribution": {
            "male": 1,
            "female": 0,
            "other": 0
        },
        "age_distribution": {
            "3-4": 0,
            "5-6": 0,
            "7-8": 0,
            "9-10": 1,
            "11+": 0
        }
    }
}
```

#### Assign Tariffs to Class

**Endpoint:** `POST /api/classes/{id}/assign-tariffs`

**Description:** Assign multiple tariffs to a class

**Body:**
```json
{
    "tariff_ids": [1, 2, 3, 4]
}
```

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "tariff_ids": [1, 2, 3, 4]
     }' \
     http://localhost:8000/api/classes/1/assign-tariffs
```

**Example Response:**
```json
{
    "success": true,
    "message": "Tariffs assigned to class successfully",
    "data": {
        "id": 1,
        "name": "A",
        "full_name": "N1A",
        "grade_id": 1,
        "capacity": 30,
        "current_enrollment": 1,
        "assigned_tariffs": [
            {
                "id": 1,
                "name": "Tuition Fee",
                "type": "tuition",
                "amount": "50000.00",
                "billing_frequency": "per_term"
            },
            {
                "id": 2,
                "name": "Activity Fee",
                "type": "activity_fee",
                "amount": "10000.00",
                "billing_frequency": "per_term"
            }
        ],
        "total_tariff_amount": 95000.00,
        "tariff_count": 4
    }
}
```

#### Remove Tariff from Class

**Endpoint:** `DELETE /api/classes/{id}/tariffs/{tariffId}`

**Description:** Remove a specific tariff from a class

**Example Request:**
```bash
curl -X DELETE \
     -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/classes/1/tariffs/3
```

**Example Response:**
```json
{
    "success": true,
    "message": "Tariff removed from class successfully",
    "data": {
        "class_id": 1,
        "class_name": "N1A",
        "tariff_id": 3,
        "tariff_name": "Transport Fee",
        "removed_at": "2025-01-15T11:00:00.000000Z",
        "remaining_tariffs": 3,
        "new_total_amount": 80000.00
    }
}
```

#### Class Validation Rules

**Creation/Update Validation:**
- `name`: Required, max 255 characters
- `grade_id`: Required, must exist in grades table
- `capacity`: Required, integer between 1 and 100
- `description`: Optional, max 1000 characters
- `is_active`: Optional, boolean (default: true)
- `tariff_ids`: Optional, array of existing tariff IDs

#### Error Responses

**Validation Error Example:**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "name": ["The name field is required."],
        "grade_id": ["The selected grade id is invalid."],
        "capacity": ["The capacity must be between 1 and 100."],
        "tariff_ids.0": ["The selected tariff id is invalid."]
    }
}
```

**Business Logic Error Example:**
```json
{
    "success": false,
    "message": "Class cannot be deleted",
    "errors": {
        "students": ["Class has enrolled students and cannot be deleted."]
    }
}
```

#### Class Management Scenarios

**Typical Class Setup:**
1. Create a class within a grade
2. Assign appropriate tariffs (tuition, activity fees, etc.)
3. Enroll students in the class
4. Monitor capacity and create additional classes if needed

**Class Capacity Management:**
- Monitor occupancy rates to optimize class sizes
- Create additional classes when existing ones approach capacity
- Transfer students between classes as needed

**Tariff Assignment Strategy:**
- Assign core tariffs (tuition, activity) to all classes
- Assign optional tariffs (transport, meals) based on services offered
- Update tariff assignments when fee structures change

### 6. Tariffs

Tariffs represent the various fees charged to students in the school system. Each tariff has a specific type, amount, and billing frequency. Tariffs are assigned to classes and automatically included in student bills.

#### Tariff Types

The system supports the following tariff types:
- **tuition**: Primary educational fees
- **activity_fee**: Extracurricular activities and materials
- **transport**: School transportation services
- **meal**: School meal programs
- **other**: Miscellaneous fees (uniforms, exams, etc.)

#### Billing Frequencies

Tariffs can be charged at different frequencies:
- **per_term**: Charged once per term (3 terms per year)
- **per_month**: Charged monthly (12 times per year)
- **per_year**: Charged once per year
- **one_time**: One-time payment (e.g., uniforms, registration)

#### Tariff Lifecycle

1. **Create** tariffs with appropriate type and frequency
2. **Assign** to classes that should pay the tariff
3. **Activate/Deactivate** as needed
4. **Update** amounts when necessary
5. **Remove** from classes or delete when no longer needed

#### Business Rules

- Tariffs must have a positive amount
- Tariffs can be assigned to multiple classes
- Only active tariffs are included in bill generation
- Tariffs with class assignments cannot be deleted directly
- Tariff amounts are in RWF (Rwandan Francs)
- Billing frequency determines how often the tariff is charged

#### List Tariffs

**Endpoint:** `GET /api/tariffs`

**Description:** Retrieve all tariffs with optional filtering

**Query Parameters:**
- `search` (optional): Search by tariff name
- `type` (optional): Filter by type (tuition, activity_fee, transport, meal, other)
- `frequency` (optional): Filter by frequency (per_term, per_month, per_year, one_time)

**Example Requests:**
```bash
# Get all tariffs
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/tariffs

# Get tuition tariffs only
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/tariffs?type=tuition

# Get per-term tariffs
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/tariffs?frequency=per_term

# Search for transport fees
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/tariffs?search=transport
```

**Example Response:**
```json
{
    "success": true,
    "message": "Tariffs retrieved successfully",
    "data": [
        {
            "id": 1,
            "name": "Tuition Fee",
            "type": "tuition",
            "type_label": "Tuition Fee",
            "amount": "50000.00",
            "billing_frequency": "per_term",
            "frequency_label": "Per Term",
            "description": "Basic tuition fee for all students",
            "is_active": true,
            "created_at": "2025-01-15T10:00:00.000000Z",
            "updated_at": "2025-01-15T10:00:00.000000Z",
            "class_count": 17,
            "active_class_count": 17,
            "formatted_amount": "50,000.00",
            "display_name": "Tuition Fee (Tuition Fee)"
        },
        {
            "id": 2,
            "name": "Activity Fee",
            "type": "activity_fee",
            "type_label": "Activity Fee",
            "amount": "10000.00",
            "billing_frequency": "per_term",
            "frequency_label": "Per Term",
            "description": "Extracurricular activities and materials",
            "is_active": true,
            "created_at": "2025-01-15T10:00:00.000000Z",
            "updated_at": "2025-01-15T10:00:00.000000Z",
            "class_count": 17,
            "active_class_count": 17,
            "formatted_amount": "10,000.00",
            "display_name": "Activity Fee (Activity Fee)"
        }
    ]
}
```

#### Create Tariff

**Endpoint:** `POST /api/tariffs`

**Description:** Create a new tariff with optional class assignments

**Required Fields:**
- `name` (string, max 255): Tariff name
- `type` (string): Tariff type (tuition, activity_fee, transport, meal, other)
- `amount` (numeric, min 0.01): Tariff amount in RWF
- `billing_frequency` (string): Billing frequency (per_term, per_month, per_year, one_time)

**Optional Fields:**
- `description` (string, max 1000): Tariff description
- `is_active` (boolean): Whether tariff is active (default: true)
- `class_ids` (array): Array of class IDs to assign this tariff to

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "name": "Library Fee",
         "type": "other",
         "amount": 8000,
         "billing_frequency": "per_term",
         "description": "Access to library resources",
         "is_active": true,
         "class_ids": [1, 2, 3, 4, 5]
     }' \
     http://localhost:8000/api/tariffs
```

**Example Response:**
```json
{
    "success": true,
    "message": "Tariff created successfully",
    "data": {
        "id": 9,
        "name": "Library Fee",
        "type": "other",
        "type_label": "Other Fee",
        "amount": "8000.00",
        "billing_frequency": "per_term",
        "frequency_label": "Per Term",
        "description": "Access to library resources",
        "is_active": true,
        "created_at": "2025-01-15T10:00:00.000000Z",
        "updated_at": "2025-01-15T10:00:00.000000Z",
        "class_count": 5,
        "active_class_count": 5,
        "formatted_amount": "8,000.00",
        "display_name": "Library Fee (Other Fee)"
    }
}
```

#### Get Tariff Details

**Endpoint:** `GET /api/tariffs/{id}`

**Description:** Retrieve detailed information about a specific tariff including assigned classes

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/tariffs/1
```

**Example Response:**
```json
{
    "success": true,
    "message": "Tariff retrieved successfully",
    "data": {
        "id": 1,
        "name": "Tuition Fee",
        "type": "tuition",
        "type_label": "Tuition Fee",
        "amount": "50000.00",
        "billing_frequency": "per_term",
        "frequency_label": "Per Term",
        "description": "Basic tuition fee for all students",
        "is_active": true,
        "created_at": "2025-01-15T10:00:00.000000Z",
        "updated_at": "2025-01-15T10:00:00.000000Z",
        "class_count": 17,
        "active_class_count": 17,
        "formatted_amount": "50,000.00",
        "display_name": "Tuition Fee (Tuition Fee)",
        "classes": [
            {
                "id": 1,
                "name": "A",
                "full_name": "N1A",
                "capacity": 30,
                "current_enrollment": 1,
                "grade": {
                    "id": 1,
                    "name": "N1",
                    "display_name": "Nursery 1"
                },
                "pivot": {
                    "tariff_id": 1,
                    "class_id": 1,
                    "is_active": true,
                    "created_at": "2025-01-15T10:00:00.000000Z",
                    "updated_at": "2025-01-15T10:00:00.000000Z"
                }
            }
        ]
    }
}
```

#### Update Tariff

**Endpoint:** `PUT /api/tariffs/{id}`

**Description:** Update tariff information

**Note:** All fields are optional. Only provide fields that need to be updated.

**Example Request:**
```bash
curl -X PUT \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "name": "Updated Tuition Fee",
         "amount": 55000,
         "description": "Updated tuition fee for 2025 academic year"
     }' \
     http://localhost:8000/api/tariffs/1
```

**Example Response:**
```json
{
    "success": true,
    "message": "Tariff updated successfully",
    "data": {
        "id": 1,
        "name": "Updated Tuition Fee",
        "type": "tuition",
        "type_label": "Tuition Fee",
        "amount": "55000.00",
        "billing_frequency": "per_term",
        "frequency_label": "Per Term",
        "description": "Updated tuition fee for 2025 academic year",
        "is_active": true,
        "created_at": "2025-01-15T10:00:00.000000Z",
        "updated_at": "2025-01-15T11:00:00.000000Z",
        "formatted_amount": "55,000.00"
    }
}
```

#### Delete Tariff

**Endpoint:** `DELETE /api/tariffs/{id}`

**Description:** Delete a tariff (only if not assigned to any classes)

**Prerequisites:**
- Tariff must not be assigned to any classes
- Tariff must not have associated bills

**Example Request:**
```bash
curl -X DELETE \
     -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/tariffs/9
```

**Example Response:**
```json
{
    "success": true,
    "message": "Tariff deleted successfully",
    "data": null
}
```

**Error Response:**
```json
{
    "success": false,
    "message": "Tariff cannot be deleted. It is assigned to classes.",
    "errors": []
}
```

#### Activate Tariff

**Endpoint:** `POST /api/tariffs/{id}/activate`

**Description:** Activate a tariff to make it available for billing

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/tariffs/1/activate
```

**Example Response:**
```json
{
    "success": true,
    "message": "Tariff activated successfully",
    "data": {
        "id": 1,
        "name": "Tuition Fee",
        "type": "tuition",
        "amount": "50000.00",
        "is_active": true,
        "updated_at": "2025-01-15T11:00:00.000000Z"
    }
}
```

#### Deactivate Tariff

**Endpoint:** `POST /api/tariffs/{id}/deactivate`

**Description:** Deactivate a tariff to exclude it from new bills

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/tariffs/1/deactivate
```

**Example Response:**
```json
{
    "success": true,
    "message": "Tariff deactivated successfully",
    "data": {
        "id": 1,
        "name": "Tuition Fee",
        "type": "tuition",
        "amount": "50000.00",
        "is_active": false,
        "updated_at": "2025-01-15T11:00:00.000000Z"
    }
}
```

#### Get Tariff Statistics

**Endpoint:** `GET /api/tariffs/statistics`

**Description:** Get comprehensive statistics about all tariffs

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/tariffs/statistics
```

**Example Response:**
```json
{
    "success": true,
    "message": "Tariff statistics retrieved successfully",
    "data": {
        "total_tariffs": 8,
        "active_tariffs": 6,
        "inactive_tariffs": 2,
        "total_amount": 148000.00,
        "average_amount": 18500.00,
        "by_type": {
            "tuition": {
                "count": 2,
                "total_amount": 100000.00,
                "average_amount": 50000.00
            },
            "activity_fee": {
                "count": 2,
                "total_amount": 20000.00,
                "average_amount": 10000.00
            },
            "transport": {
                "count": 1,
                "total_amount": 15000.00,
                "average_amount": 15000.00
            },
            "meal": {
                "count": 1,
                "total_amount": 20000.00,
                "average_amount": 20000.00
            },
            "other": {
                "count": 2,
                "total_amount": 30000.00,
                "average_amount": 15000.00
            }
        },
        "by_frequency": {
            "per_term": {
                "count": 6,
                "total_amount": 123000.00,
                "average_amount": 20500.00
            },
            "one_time": {
                "count": 1,
                "total_amount": 25000.00,
                "average_amount": 25000.00
            }
        }
    }
}
```

#### Duplicate Tariff

**Endpoint:** `POST /api/tariffs/{id}/duplicate`

**Description:** Create a copy of an existing tariff with optional modifications

**Optional Fields:**
- `name` (string): New name for the duplicated tariff
- `type` (string): New type for the duplicated tariff
- `amount` (numeric): New amount for the duplicated tariff
- `billing_frequency` (string): New billing frequency
- `description` (string): New description
- `is_active` (boolean): Whether the duplicate should be active (default: false)

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "name": "Tuition Fee - Copy",
         "amount": 52000,
         "description": "Duplicated tuition fee with updated amount",
         "is_active": false
     }' \
     http://localhost:8000/api/tariffs/1/duplicate
```

**Example Response:**
```json
{
    "success": true,
    "message": "Tariff duplicated successfully",
    "data": {
        "id": 10,
        "name": "Tuition Fee - Copy",
        "type": "tuition",
        "type_label": "Tuition Fee",
        "amount": "52000.00",
        "billing_frequency": "per_term",
        "frequency_label": "Per Term",
        "description": "Duplicated tuition fee with updated amount",
        "is_active": false,
        "created_at": "2025-01-15T11:00:00.000000Z",
        "updated_at": "2025-01-15T11:00:00.000000Z"
    }
}
```

#### Bulk Update Tariff Amounts

**Endpoint:** `POST /api/tariffs/bulk-update-amounts`

**Description:** Update amounts for multiple tariffs at once

**Body:**
```json
{
    "tariffs": [
        {"id": 1, "amount": 55000},
        {"id": 2, "amount": 12000},
        {"id": 3, "amount": 18000}
    ]
}
```

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "tariffs": [
             {"id": 1, "amount": 55000},
             {"id": 2, "amount": 12000},
             {"id": 3, "amount": 18000}
         ]
     }' \
     http://localhost:8000/api/tariffs/bulk-update-amounts
```

**Example Response:**
```json
{
    "success": true,
    "message": "Tariff amounts updated successfully",
    "data": {
        "updated": [
            {
                "id": 1,
                "name": "Tuition Fee",
                "old_amount": "50000.00",
                "new_amount": "55000.00"
            },
            {
                "id": 2,
                "name": "Activity Fee",
                "old_amount": "10000.00",
                "new_amount": "12000.00"
            }
        ],
        "errors": [
            {
                "tariff_id": 3,
                "error": "Tariff not found"
            }
        ],
        "total_processed": 3,
        "successful": 2,
        "failed": 1
    }
}
```

#### Get Tariffs by Class

**Endpoint:** `GET /api/tariffs/by-class/{classId}`

**Description:** Retrieve all tariffs assigned to a specific class

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/tariffs/by-class/1
```

**Example Response:**
```json
{
    "success": true,
    "message": "Class tariffs retrieved successfully",
    "data": {
        "class": {
            "id": 1,
            "name": "A",
            "full_name": "N1A",
            "capacity": 30,
            "current_enrollment": 1,
            "grade": {
                "id": 1,
                "name": "N1",
                "display_name": "Nursery 1"
            }
        },
        "tariffs": [
            {
                "id": 1,
                "name": "Tuition Fee",
                "type": "tuition",
                "type_label": "Tuition Fee",
                "amount": "50000.00",
                "billing_frequency": "per_term",
                "frequency_label": "Per Term",
                "description": "Basic tuition fee for all students",
                "is_active": true,
                "pivot": {
                    "class_id": 1,
                    "tariff_id": 1,
                    "is_active": true,
                    "created_at": "2025-01-15T10:00:00.000000Z",
                    "updated_at": "2025-01-15T10:00:00.000000Z"
                }
            },
            {
                "id": 2,
                "name": "Activity Fee",
                "type": "activity_fee",
                "type_label": "Activity Fee",
                "amount": "10000.00",
                "billing_frequency": "per_term",
                "frequency_label": "Per Term",
                "description": "Extracurricular activities and materials",
                "is_active": true,
                "pivot": {
                    "class_id": 1,
                    "tariff_id": 2,
                    "is_active": true,
                    "created_at": "2025-01-15T10:00:00.000000Z",
                    "updated_at": "2025-01-15T10:00:00.000000Z"
                }
            }
        ],
        "total_amount": 80000.00,
        "active_tariffs_count": 3,
        "total_tariffs_count": 3
    }
}
```

#### Assign Tariff to Classes

**Endpoint:** `POST /api/tariffs/{id}/assign-to-classes`

**Description:** Assign a tariff to multiple classes

**Body:**
```json
{
    "class_ids": [1, 2, 3, 4, 5]
}
```

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
         "class_ids": [1, 2, 3, 4, 5]
     }' \
     http://localhost:8000/api/tariffs/7/assign-to-classes
```

**Example Response:**
```json
{
    "success": true,
    "message": "Tariff assigned to classes successfully",
    "data": {
        "id": 7,
        "name": "Uniform Fee",
        "type": "other",
        "amount": "25000.00",
        "assigned_classes": [
            {
                "id": 1,
                "full_name": "N1A",
                "grade": "Nursery 1"
            },
            {
                "id": 2,
                "full_name": "N1B",
                "grade": "Nursery 1"
            }
        ],
        "assignment_count": 5,
        "total_class_count": 5
    }
}
```

#### Remove Tariff from Class

**Endpoint:** `DELETE /api/tariffs/{id}/classes/{classId}`

**Description:** Remove a tariff from a specific class

**Example Request:**
```bash
curl -X DELETE \
     -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/tariffs/7/classes/1
```

**Example Response:**
```json
{
    "success": true,
    "message": "Tariff removed from class successfully",
    "data": {
        "tariff_id": 7,
        "tariff_name": "Uniform Fee",
        "class_id": 1,
        "class_name": "N1A",
        "removed_at": "2025-01-15T11:00:00.000000Z"
    }
}
```

#### Tariff Calculation Methods

The system provides several methods for calculating tariff amounts based on different periods:

**Per Term Calculation:**
- `per_term`: Amount charged as-is
- `per_month`: Amount × 4 (assuming 4 months per term)
- `per_year`: Amount ÷ 3 (3 terms per year)
- `one_time`: Amount charged as-is

**Per Month Calculation:**
- `per_term`: Amount ÷ 4 (4 months per term)
- `per_month`: Amount charged as-is
- `per_year`: Amount ÷ 12 (12 months per year)
- `one_time`: Amount charged as-is

**Per Year Calculation:**
- `per_term`: Amount × 3 (3 terms per year)
- `per_month`: Amount × 12 (12 months per year)
- `per_year`: Amount charged as-is
- `one_time`: Amount charged as-is

#### Tariff Validation Rules

**Creation/Update Validation:**
- `name`: Required, max 255 characters, unique
- `type`: Required, must be one of: tuition, activity_fee, transport, meal, other
- `amount`: Required, numeric, minimum 0.01
- `billing_frequency`: Required, must be one of: per_term, per_month, per_year, one_time
- `description`: Optional, max 1000 characters
- `is_active`: Optional, boolean (default: true)
- `class_ids`: Optional, array of existing class IDs

#### Error Responses

**Validation Error Example:**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "name": ["The name field is required."],
        "amount": ["The amount must be greater than 0."],
        "type": ["Invalid tariff type."],
        "billing_frequency": ["Invalid billing frequency."],
        "class_ids.0": ["The selected class id is invalid."]
    }
}
```

**Business Logic Error Example:**
```json
{
    "success": false,
    "message": "Tariff cannot be assigned to class",
    "errors": {
        "class_id": ["Class is not active or tariff is already assigned to this class."]
    }
}
```

#### Common Tariff Scenarios

**School Fee Structure Example:**
```json
{
    "nursery_fees": {
        "tuition": 50000,
        "activity": 10000,
        "meal": 20000,
        "total_per_term": 80000
    },
    "primary_fees": {
        "tuition": 50000,
        "activity": 10000,
        "transport": 15000,
        "meal": 20000,
        "total_per_term": 95000
    },
    "one_time_fees": {
        "uniform": 25000,
        "registration": 30000
    }
}
```

**Billing Integration:**
When a student bill is generated, the system:
1. Retrieves all active tariffs for the student's class
2. Calculates the appropriate amount based on billing frequency
3. Creates line items for each tariff
4. Generates a comprehensive bill with all applicable fees

### 7. Billing

#### Generate Bill for Student
```
POST /api/billing/generate/student/{studentId}
```

#### Generate Bills for Class
```
POST /api/billing/generate/class/{classId}
```

#### Generate Bills for Grade
```
POST /api/billing/generate/grade/{gradeId}
```

#### Record Payment
```
POST /api/billing/bills/{billId}/payment
```
Body:
```json
{
    "amount": 250.00,
    "payment_method": "cash",
    "reference": "REF12345"
}
```

#### Cancel Bill
```
POST /api/billing/bills/{billId}/cancel
```
Body:
```json
{
    "reason": "Student transferred"
}
```

#### Get Student Bills
```
GET /api/billing/students/{studentId}/bills
```

#### Get Student Balance
```
GET /api/billing/students/{studentId}/balance
```

#### Get Billing Summary
```
GET /api/billing/summary/{academicYearId}
```

#### Get Revenue Report
```
GET /api/billing/revenue-report/{academicYearId}
```

#### Mark Overdue Bills
```
POST /api/billing/mark-overdue
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Error Handling

The API uses consistent error handling with descriptive messages and appropriate HTTP status codes. Validation errors include field-specific error messages.

## Health Check

```
GET /api/health
```

Returns system health status and version information.

## Rate Limiting

API endpoints may be rate-limited to prevent abuse. Rate limit headers are included in responses.

## Versioning

The API is currently at version 1.0.0. Future versions will be backward compatible or properly versioned. 
