<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\TariffType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_id',
        'tariff_id',
        'name',
        'description',
        'type',
        'amount',
        'paid_amount',
        'balance',
        'status',
        'paid_date',
        'payment_history',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance' => 'decimal:2',
        'type' => TariffType::class,
        'paid_date' => 'datetime',
        'payment_history' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function bill(): BelongsTo
    {
        return $this->belongsTo(Bill::class);
    }

    public function tariff(): BelongsTo
    {
        return $this->belongsTo(Tariff::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePartial($query)
    {
        return $query->where('status', 'partial');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    // Accessors
    public function getIsFullyPaidAttribute(): bool
    {
        return $this->status === 'paid';
    }

    public function getIsPartiallyPaidAttribute(): bool
    {
        return $this->status === 'partial';
    }

    public function getPaymentProgressAttribute(): float
    {
        return $this->amount > 0 ? ($this->paid_amount / $this->amount) * 100 : 0;
    }
}
