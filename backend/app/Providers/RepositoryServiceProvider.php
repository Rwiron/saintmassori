<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\AcademicYear;
use App\Models\Bill;
use App\Models\ClassModel;
use App\Models\Grade;
use App\Models\Student;
use App\Models\Tariff;
use App\Models\Term;
use App\Repositories\AcademicYearRepository;
use App\Repositories\BillRepository;
use App\Repositories\ClassRepository;
use App\Repositories\GradeRepository;
use App\Repositories\StudentRepository;
use App\Repositories\TariffRepository;
use App\Repositories\TermRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(AcademicYearRepository::class, function ($app) {
            return new AcademicYearRepository($app->make(AcademicYear::class));
        });

        $this->app->bind(BillRepository::class, function ($app) {
            return new BillRepository($app->make(Bill::class));
        });

        $this->app->bind(ClassRepository::class, function ($app) {
            return new ClassRepository($app->make(ClassModel::class));
        });

        $this->app->bind(GradeRepository::class, function ($app) {
            return new GradeRepository($app->make(Grade::class));
        });

        $this->app->bind(StudentRepository::class, function ($app) {
            return new StudentRepository($app->make(Student::class));
        });

        $this->app->bind(TariffRepository::class, function ($app) {
            return new TariffRepository($app->make(Tariff::class));
        });

        $this->app->bind(TermRepository::class, function ($app) {
            return new TermRepository($app->make(Term::class));
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
