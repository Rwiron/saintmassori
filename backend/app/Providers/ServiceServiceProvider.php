<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\AcademicYearService;
use App\Services\StudentService;
use App\Services\StudentImportService;
use App\Services\BillingService;
use App\Services\ClassService;
use App\Services\TariffService;
use App\Services\TermService;
use App\Services\GradeService;
use App\Services\UserService;
use Illuminate\Support\ServiceProvider;

class ServiceServiceProvider extends ServiceProvider
{
    /**
     * All of the container singletons that should be registered.
     *
     * @var array
     */
    public array $singletons = [
        AcademicYearService::class => AcademicYearService::class,
        StudentService::class => StudentService::class,
        StudentImportService::class => StudentImportService::class,
        BillingService::class => BillingService::class,
        ClassService::class => ClassService::class,
        TariffService::class => TariffService::class,
        TermService::class => TermService::class,
        GradeService::class => GradeService::class,
        UserService::class => UserService::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Services are automatically registered as singletons via the $singletons property
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
