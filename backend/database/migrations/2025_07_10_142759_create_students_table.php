<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('student_id')->unique(); // Auto-generated student ID
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->nullable()->unique();
            $table->date('date_of_birth');
            $table->enum('gender', ['male', 'female', 'other']);
            $table->string('phone')->nullable();
            $table->text('address')->nullable();

            // Parent/Guardian Information
            $table->string('parent_name');
            $table->string('parent_email');
            $table->string('parent_phone');
            $table->string('emergency_contact')->nullable();

            // Academic Information
            $table->foreignId('class_id')->nullable()->constrained()->nullOnDelete();
            $table->date('enrollment_date');
            $table->enum('status', ['active', 'inactive', 'graduated', 'transferred'])->default('active');

            // Medical Information
            $table->text('medical_conditions')->nullable();
            $table->text('allergies')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['class_id', 'status']);
            $table->index('status');
            $table->index('enrollment_date');
            $table->index(['first_name', 'last_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
