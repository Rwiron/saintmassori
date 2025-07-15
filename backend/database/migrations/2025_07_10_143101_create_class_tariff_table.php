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
        Schema::create('class_tariff', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('class_id');
            $table->unsignedBigInteger('tariff_id');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Unique constraint: one tariff per class
            $table->unique(['class_id', 'tariff_id']);

            // Indexes
            $table->index(['class_id', 'is_active']);
            $table->index(['tariff_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_tariff');
    }
};
