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
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // e.g., "A", "B", "C"
            $table->string('full_name'); // e.g., "P1A", "P2B" (computed field)
            $table->integer('capacity')->default(30);
            $table->integer('current_enrollment')->default(0);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['grade_id', 'is_active']);
            $table->index('is_active');

            // Unique constraint: class name within grade
            $table->unique(['grade_id', 'name']);
            $table->unique('full_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
