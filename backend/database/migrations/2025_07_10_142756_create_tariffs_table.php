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
        Schema::create('tariffs', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Grade 1 Package", "Activity Fee"
            $table->text('description')->nullable();
            $table->decimal('amount', 10, 2); // Amount in currency
            $table->enum('billing_frequency', ['per_term', 'per_month', 'per_year', 'one_time'])->default('per_term');
            $table->enum('type', ['tuition', 'activity_fee', 'transport', 'meal', 'other'])->default('tuition');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('type');
            $table->index('is_active');
            $table->index('billing_frequency');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tariffs');
    }
};
