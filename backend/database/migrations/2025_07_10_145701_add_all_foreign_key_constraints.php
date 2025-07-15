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
        // Add foreign key constraint to students table
        Schema::table('students', function (Blueprint $table) {
            $table->foreign('class_id')->references('id')->on('classes')->nullOnDelete();
        });

        // Add foreign key constraints to class_tariff table
        Schema::table('class_tariff', function (Blueprint $table) {
            $table->foreign('class_id')->references('id')->on('classes')->cascadeOnDelete();
            $table->foreign('tariff_id')->references('id')->on('tariffs')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['class_id']);
        });

        Schema::table('class_tariff', function (Blueprint $table) {
            $table->dropForeign(['class_id']);
            $table->dropForeign(['tariff_id']);
        });
    }
};
