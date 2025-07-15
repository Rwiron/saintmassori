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
        Schema::table('students', function (Blueprint $table) {
            // Add parent information fields
            $table->string('father_name')->nullable()->after('parent_phone');
            $table->string('mother_name')->nullable()->after('father_name');
            
            // Add location fields (Rwanda administrative structure)
            $table->string('province')->nullable()->after('address');
            $table->string('district')->nullable()->after('province');
            $table->string('sector')->nullable()->after('district');
            $table->string('cell')->nullable()->after('sector');
            $table->string('village')->nullable()->after('cell');
            
            // Add disability information
            $table->boolean('disability')->default(false)->after('allergies');
            $table->text('disability_description')->nullable()->after('disability');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'father_name',
                'mother_name',
                'province',
                'district',
                'sector',
                'cell',
                'village',
                'disability',
                'disability_description'
            ]);
        });
    }
}; 