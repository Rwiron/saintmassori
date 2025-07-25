# 🎓 Montessori School Management System - Development Rules

## 📋 Project Overview
- **Project**: Montessori School Management System (Phase 1: Admin & Student Focus)
- **Backend**: Laravel 12.x (API-first approach)
- **Frontend**: React with Vite + Shadcn/UI
- **Database**: MySQL/PostgreSQL
- **Authentication**: Laravel Sanctum
- **UI Components**: Shadcn/UI with Tailwind CSS
- **Documentation Reference**: https://laravel.com/docs/12.x/

---

## 🎨 Frontend UI Rules (Shadcn/UI + Tailwind CSS)

### 1. **Shadcn/UI Component System**
- **MUST use Shadcn/UI components** for all UI elements
- **MUST follow Shadcn/UI documentation**: https://ui.shadcn.com/
- **MUST use Tailwind CSS** for styling and customization
- **MUST maintain consistent design system** across all components

### 2. **Component Structure**
```jsx
// Use Shadcn/UI components as base
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Example component structure
export function StudentForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Student</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <Input placeholder="Student Name" />
          <Button type="submit">Save Student</Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### 3. **Styling Guidelines**
- **MUST use Tailwind utility classes** for styling
- **MUST follow consistent spacing** using Tailwind's spacing scale
- **MUST use CSS variables** for theme customization
- **MUST implement responsive design** using Tailwind's responsive prefixes

### 4. **Theme Configuration**
```css
/* Use CSS variables for theme consistency */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 142 76% 36%;
  --primary-foreground: 355.7 100% 97.3%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  /* ... other theme variables */
}
```

### 5. **Component Customization**
- **MUST extend Shadcn/UI components** rather than creating from scratch
- **MUST use className prop** for additional styling
- **MUST maintain accessibility** features provided by Shadcn/UI
- **MUST follow Shadcn/UI patterns** for component composition

### 6. **Required Shadcn/UI Components**
**MUST use these components for the admin panel:**
- `Button` - for all interactive actions
- `Input` - for form inputs
- `Card` - for content containers
- `Sidebar` - for navigation
- `DropdownMenu` - for user menus and actions
- `Avatar` - for user profile images
- `Badge` - for status indicators
- `Table` - for data display
- `Dialog` - for modals and confirmations
- `Form` - for form handling with validation
- `Separator` - for visual separation
- `Skeleton` - for loading states

### 7. **Installation and Setup**
```bash
# Install Shadcn/UI components as needed
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add sidebar
# ... other components
```

### 8. **Dropdown & Modal Styling Rules**
- **MUST use opaque white backgrounds** for all dropdown components
- **MUST NOT use transparent backgrounds** for dropdown menus
- **MUST use proper contrast colors** for dropdown text and backgrounds

```jsx
// Correct dropdown styling - ALWAYS use opaque white
<SelectContent className="bg-white text-gray-950">
  <SelectItem value="option1">Option 1</SelectItem>
</SelectContent>

<DropdownMenuContent className="bg-white text-gray-900">
  <DropdownMenuItem className="focus:bg-gray-100 focus:text-gray-900">
    Action Item
  </DropdownMenuItem>
</DropdownMenuContent>
```

**Required Dropdown Styling:**
- **Background**: `bg-white` (opaque white)
- **Text**: `text-gray-900` or `text-gray-950` (high contrast)
- **Focus states**: `focus:bg-gray-100 focus:text-gray-900`
- **Borders**: `border-gray-200` for subtle separation
- **Shadows**: `shadow-md` or `shadow-lg` for depth
- **Destructive actions**: `text-red-600` with `focus:bg-red-50`

### 9. **Mobile Responsiveness**
- **MUST implement mobile-first design** using Tailwind breakpoints
- **MUST ensure touch-friendly interactions** (minimum 44px touch targets)
- **MUST adapt layouts** for different screen sizes
- **MUST test on mobile devices** before deployment

---

## 🏗️ Laravel 12.x Architecture Rules

### 1. **Backend Structure (Laravel 12.x)**
```
app/
├── Http/Controllers/     # Thin controllers (validation + response only)
├── Services/            # Business logic layer
├── Repositories/        # Data access layer
├── Models/             # Eloquent models
├── DTOs/               # Data Transfer Objects
├── Traits/             # Reusable functionality
├── Enums/              # Status enums (AcademicYearStatus, StudentStatus)
├── Exceptions/         # Custom exceptions
└── Actions/            # Single-purpose action classes
```

### 2. **Laravel 12.x Specific Features to Use**
- **Enums**: Use PHP 8.1+ enums for status fields
- **Typed Properties**: Leverage PHP 8.0+ typed properties in models
- **Readonly Properties**: Use readonly for immutable data
- **Laravel Pint**: Code formatting following Laravel standards
- **Pest Testing**: Modern testing framework (Laravel 12.x default)
- **Blade Components**: For any server-side rendering needs

### 3. **Service Layer Pattern (Laravel 12.x)**
**MUST implement these services following Laravel 12.x patterns:**
```php
// Use constructor property promotion (PHP 8.0+)
class AcademicYearService
{
    public function __construct(
        private readonly AcademicYearRepository $repository,
        private readonly LoggerInterface $logger
    ) {}
}
```

### 4. **Repository Pattern (Laravel 12.x)**
**MUST create repositories using Laravel 12.x features:**
```php
// Use return types and constructor property promotion
class AcademicYearRepository
{
    public function __construct(
        private readonly AcademicYear $model
    ) {}
    
    public function findById(int $id): ?AcademicYear
    {
        return $this->model->find($id);
    }
}
```

---

## 🔐 Authentication & Authorization Rules (Laravel 12.x)

### 1. **Laravel Sanctum (Laravel 12.x)**
- **MUST follow Laravel 12.x Sanctum documentation**: https://laravel.com/docs/12.x/sanctum
- **MUST use Sanctum middleware**: `auth:sanctum`
- **MUST implement proper token management**

### 2. **Authorization (Laravel 12.x)**
```php
// Use Laravel 12.x Gates and Policies
Gate::define('manage-students', function (User $user) {
    return $user->role === 'admin';
});

// Policy example
class StudentPolicy
{
    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }
}
```

---

## 🌐 API Design Rules (Laravel 12.x)

### 1. **API Resources (Laravel 12.x)**
```php
// Use Laravel 12.x API Resources
class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'class' => new ClassResource($this->whenLoaded('class')),
        ];
    }
}
```

### 2. **Form Requests (Laravel 12.x)**
```php
// Use Laravel 12.x Form Request validation
class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create-student');
    }
    
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:students'],
        ];
    }
}
```

---

## 📊 Database Design Rules (Laravel 12.x)

### 1. **Migrations (Laravel 12.x)**
```php
// Use Laravel 12.x migration features
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->foreignId('class_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }
};
```

### 2. **Models (Laravel 12.x)**
```php
// Use Laravel 12.x model features
class Student extends Model
{
    use HasFactory, SoftDeletes;
    
    protected $fillable = [
        'name',
        'email',
        'class_id',
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
    
    // Relationships
    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class);
    }
}
```

### 3. **Enums (Laravel 12.x)**
```php
// Use PHP 8.1+ Enums with Laravel 12.x
enum AcademicYearStatus: string
{
    case ACTIVE = 'active';
    case CLOSED = 'closed';
    case DRAFT = 'draft';
}

enum StudentStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case GRADUATED = 'graduated';
}
```

---

## 💼 Business Logic Rules (Laravel 12.x)

### 1. **Event-Driven Architecture (Laravel 12.x)**
```php
// Use Laravel 12.x Events and Listeners
class StudentPromoted
{
    public function __construct(
        public readonly Student $student,
        public readonly ClassModel $newClass
    ) {}
}

class GenerateStudentBill
{
    public function handle(StudentPromoted $event): void
    {
        // Generate bill logic
    }
}
```

### 2. **Jobs and Queues (Laravel 12.x)**
```php
// Use Laravel 12.x Job classes
class ProcessStudentBilling implements ShouldQueue
{
    public function __construct(
        private readonly Student $student
    ) {}
    
    public function handle(): void
    {
        // Process billing logic
    }
}
```

---

## 🧪 Testing Rules (Laravel 12.x)

### 1. **Pest Testing (Laravel 12.x Default)**
```php
// Use Pest (Laravel 12.x default testing framework)
test('admin can create academic year', function () {
    $admin = User::factory()->admin()->create();
    
    $response = $this->actingAs($admin)
        ->postJson('/api/v1/academic-years', [
            'name' => '2025-2026',
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
        ]);
    
    $response->assertStatus(201);
});

test('student cannot create academic year', function () {
    $student = User::factory()->student()->create();
    
    $response = $this->actingAs($student)
        ->postJson('/api/v1/academic-years', [
            'name' => '2025-2026',
        ]);
    
    $response->assertStatus(403);
});
```

### 2. **Feature Tests Structure**
```php
// Feature tests for API endpoints
describe('Academic Year API', function () {
    beforeEach(function () {
        $this->admin = User::factory()->admin()->create();
    });
    
    test('can list academic years', function () {
        // Test implementation
    });
    
    test('can create academic year', function () {
        // Test implementation
    });
});
```

---

## 📝 Laravel 12.x Code Style Rules

### 1. **PHP 8.1+ Features**
```php
// Use constructor property promotion
class StudentService
{
    public function __construct(
        private readonly StudentRepository $repository,
        private readonly BillingService $billingService
    ) {}
}

// Use readonly properties for immutable data
class StudentDTO
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly int $classId
    ) {}
}
```

### 2. **Laravel Pint (Code Formatting)**
```php
// MUST use Laravel Pint for code formatting
// Run: ./vendor/bin/pint
// Configuration in pint.json
{
    "preset": "laravel"
}
```

### 3. **Type Declarations**
```php
// MUST use strict types
declare(strict_types=1);

// MUST use return type declarations
public function createStudent(array $data): Student
{
    return $this->repository->create($data);
}
```

---

## 🚀 Laravel 12.x Specific Features

### 1. **Artisan Commands (Laravel 12.x)**
```php
// Use Laravel 12.x command features
class PromoteStudentsCommand extends Command
{
    protected $signature = 'students:promote {academicYear}';
    
    public function handle(): int
    {
        $this->info('Promoting students...');
        return Command::SUCCESS;
    }
}
```

### 2. **Service Providers (Laravel 12.x)**
```php
// Register services following Laravel 12.x patterns
class SchoolServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(StudentRepository::class);
        $this->app->bind(BillingService::class);
    }
    
    public function boot(): void
    {
        // Boot logic
    }
}
```

---

## 🔧 Development Workflow (Laravel 12.x)

### 1. **Laravel Sail (Development Environment)**
```bash
# Use Laravel Sail for development
./vendor/bin/sail up
./vendor/bin/sail artisan migrate
./vendor/bin/sail artisan test
```

### 2. **Artisan Commands**
```bash
# Model creation with Laravel 12.x
php artisan make:model Student -mfsc
# -m: migration, -f: factory, -s: seeder, -c: controller

# API Resource creation
php artisan make:resource StudentResource
php artisan make:resource StudentCollection

# Form Request creation
php artisan make:request StoreStudentRequest
```

---

## 📚 Laravel 12.x Documentation Compliance

### 1. **MUST Reference Official Documentation**
- **Installation**: https://laravel.com/docs/12.x/installation
- **Configuration**: https://laravel.com/docs/12.x/configuration
- **Routing**: https://laravel.com/docs/12.x/routing
- **Controllers**: https://laravel.com/docs/12.x/controllers
- **Models**: https://laravel.com/docs/12.x/eloquent
- **Migrations**: https://laravel.com/docs/12.x/migrations
- **Validation**: https://laravel.com/docs/12.x/validation
- **Authentication**: https://laravel.com/docs/12.x/authentication
- **Authorization**: https://laravel.com/docs/12.x/authorization
- **Testing**: https://laravel.com/docs/12.x/testing

### 2. **Laravel 12.x Best Practices**
- **MUST follow Laravel conventions** as documented
- **MUST use Laravel's built-in features** before custom solutions
- **MUST stay updated** with Laravel 12.x documentation
- **MUST use Laravel's recommended patterns**

---

## ✅ Development Compliance Checklist

### For Each Backend Feature (Laravel 12.x):
- [ ] Follows Laravel 12.x documentation patterns
- [ ] Uses appropriate Laravel 12.x features
- [ ] Implements proper error handling
- [ ] Includes comprehensive tests (Pest)
- [ ] Uses Laravel Pint for formatting
- [ ] Implements proper authorization
- [ ] Uses type declarations
- [ ] Follows Laravel naming conventions
- [ ] Uses Laravel's built-in validation
- [ ] Implements proper API resources

### For Each Frontend Feature (React + Shadcn/UI):
- [ ] Uses Shadcn/UI components as base
- [ ] Follows Shadcn/UI documentation patterns
- [ ] Implements responsive design (mobile-first)
- [ ] Uses Tailwind CSS for styling
- [ ] Maintains consistent theme variables
- [ ] Ensures accessibility compliance
- [ ] Implements proper loading states
- [ ] Uses proper component composition
- [ ] Follows React best practices
- [ ] Tests on multiple screen sizes

---

**📌 Laravel 12.x Reference: Always consult https://laravel.com/docs/12.x/ for the most up-to-date patterns and best practices!** 