<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\StudentStatus;
use App\Models\Student;
use App\Models\ClassModel;
use App\Models\Grade;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class StudentRepository extends BaseRepository
{
    public function __construct(Student $model)
    {
        parent::__construct($model);
    }

    public function getActive(): Collection
    {
        return $this->model->active()->get();
    }

    public function getInactive(): Collection
    {
        return $this->model->inactive()->get();
    }

    public function getGraduated(): Collection
    {
        return $this->model->graduated()->get();
    }

    public function getTransferred(): Collection
    {
        return $this->model->transferred()->get();
    }

    public function getByClass(int $classId): Collection
    {
        return $this->model->byClass($classId)->get();
    }

    public function getByGrade(int $gradeId): Collection
    {
        return $this->model->byGrade($gradeId)->get();
    }

    public function getWithoutClass(): Collection
    {
        return $this->model->withoutClass()->get();
    }

    public function findByStudentId(string $studentId): ?Student
    {
        return $this->model->where('student_id', $studentId)->first();
    }

    public function findByEmail(string $email): ?Student
    {
        return $this->model->where('email', $email)->first();
    }

    public function getWithClass(): Collection
    {
        return $this->model->with('class.grade')->get();
    }

    public function findWithRelations(int $id): ?Student
    {
        return $this->model
            ->with(['class.grade', 'bills'])
            ->find($id);
    }

    public function getAllWithRelations(): Collection
    {
        return $this->model
            ->with(['class.grade', 'bills'])
            ->get();
    }

    public function searchByName(string $search): Collection
    {
        return $this->model
            ->where(function ($query) use ($search) {
                $query->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
            })
            ->with('class.grade')
            ->get();
    }

    public function getByStatus(StudentStatus $status): Collection
    {
        return $this->model->where('status', $status)->get();
    }

    public function getStudentsWithOutstandingBills(): Collection
    {
        return $this->model
            ->whereHas('bills', function ($query) {
                $query->where('balance', '>', 0);
            })
            ->with(['bills' => function ($query) {
                $query->where('balance', '>', 0);
            }])
            ->get();
    }

    public function getEnrollmentsByDateRange(\DateTime $startDate, \DateTime $endDate): Collection
    {
        return $this->model
            ->whereBetween('enrollment_date', [$startDate, $endDate])
            ->with('class.grade')
            ->get();
    }

    public function getStudentsByAge(int $minAge, int $maxAge): Collection
    {
        $minBirthDate = now()->subYears($maxAge + 1)->addDay();
        $maxBirthDate = now()->subYears($minAge);

        return $this->model
            ->whereBetween('date_of_birth', [$minBirthDate, $maxBirthDate])
            ->get();
    }

    public function paginateWithClass(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with('class.grade')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate($perPage);
    }

    public function paginateByClass(int $classId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->byClass($classId)
            ->with('class.grade')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate($perPage);
    }

    public function getClassmates(int $studentId): Collection
    {
        $student = $this->findOrFail($studentId);

        if (!$student->class_id) {
            return new Collection();
        }

        return $this->model
            ->byClass($student->class_id)
            ->where('id', '!=', $studentId)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    public function canBeDeleted(int $id): bool
    {
        $student = $this->findOrFail($id);
        return $student->bills()->count() === 0;
    }

    public function getPromotionCandidates(int $gradeId): Collection
    {
        return $this->model
            ->active()
            ->byGrade($gradeId)
            ->with('class.grade')
            ->get();
    }

    public function bulkUpdateClass(array $studentIds, int $classId): int
    {
        return $this->model
            ->whereIn('id', $studentIds)
            ->update(['class_id' => $classId]);
    }

    public function bulkUpdateStatus(array $studentIds, StudentStatus $status): int
    {
        return $this->model
            ->whereIn('id', $studentIds)
            ->update(['status' => $status]);
    }

    public function countByGrade(int $gradeId): int
    {
        return $this->model->byGrade($gradeId)->count();
    }
}
