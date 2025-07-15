<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BillStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bill extends Model
{
    /** @use HasFactory<\Database\Factories\BillFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'bill_number',
        'student_id',
        'academic_year_id',
        'term_id',
        'subtotal',
        'discount',
        'tax',
        'total_amount',
        'paid_amount',
        'balance',
        'status',
        'due_date',
        'paid_date',
        'issue_date',
        'description',
        'line_items',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance' => 'decimal:2',
        'status' => BillStatus::class,
        'due_date' => 'date',
        'paid_date' => 'date',
        'issue_date' => 'date',
        'line_items' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', BillStatus::PENDING);
    }

    public function scopePaid($query)
    {
        return $query->where('status', BillStatus::PAID);
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', BillStatus::OVERDUE);
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', BillStatus::CANCELLED);
    }

    public function scopeForStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeForAcademicYear($query, int $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }

    public function scopeByAcademicYear($query, int $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }

    public function scopeByStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeForTerm($query, int $termId)
    {
        return $query->where('term_id', $termId);
    }

    public function scopeDueToday($query)
    {
        return $query->where('due_date', today());
    }

    public function scopeOverdueToday($query)
    {
        return $query->where('due_date', '<', today())
                    ->where('status', '!=', BillStatus::PAID);
    }

    public function scopeWithOutstandingBalance($query)
    {
        return $query->where('balance', '>', 0);
    }

    // Accessors & Mutators
    public function getIsPaidAttribute(): bool
    {
        return $this->status === BillStatus::PAID;
    }

    public function getIsPendingAttribute(): bool
    {
        return $this->status === BillStatus::PENDING;
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->status === BillStatus::OVERDUE;
    }

    public function getIsCancelledAttribute(): bool
    {
        return $this->status === BillStatus::CANCELLED;
    }

    public function getIsFullyPaidAttribute(): bool
    {
        return $this->balance <= 0;
    }

    public function getHasOutstandingBalanceAttribute(): bool
    {
        return $this->balance > 0;
    }

    public function getPaymentProgressAttribute(): float
    {
        if ($this->total_amount <= 0) {
            return 0;
        }
        return round(($this->paid_amount / $this->total_amount) * 100, 2);
    }

    public function getDaysUntilDueAttribute(): int
    {
        return (int) today()->diffInDays($this->due_date, false);
    }

    public function getDaysOverdueAttribute(): int
    {
        if ($this->due_date->isFuture()) {
            return 0;
        }
        return (int) today()->diffInDays($this->due_date);
    }

    public function getFormattedTotalAmountAttribute(): string
    {
        return number_format($this->total_amount, 2);
    }

    public function getFormattedBalanceAttribute(): string
    {
        return number_format($this->balance, 2);
    }

    public function getFormattedPaidAmountAttribute(): string
    {
        return number_format($this->paid_amount, 2);
    }

    // Business Logic Methods
    public function calculateTotals(): void
    {
        $this->total_amount = $this->subtotal - $this->discount + $this->tax;
        $this->balance = $this->total_amount - $this->paid_amount;
    }

    public function addLineItem(array $item): void
    {
        $lineItems = $this->line_items ?? [];
        $lineItems[] = array_merge($item, [
            'id' => count($lineItems) + 1,
            'created_at' => now()->toISOString(),
        ]);
        $this->line_items = $lineItems;
    }

    public function removeLineItem(int $itemId): bool
    {
        $lineItems = $this->line_items ?? [];
        $originalCount = count($lineItems);

        $this->line_items = array_values(
            array_filter($lineItems, fn($item) => $item['id'] !== $itemId)
        );

        return count($this->line_items) < $originalCount;
    }

    public function updateLineItem(int $itemId, array $updates): bool
    {
        $lineItems = $this->line_items ?? [];

        foreach ($lineItems as $index => $item) {
            if ($item['id'] === $itemId) {
                $lineItems[$index] = array_merge($item, $updates, [
                    'updated_at' => now()->toISOString(),
                ]);
                $this->line_items = $lineItems;
                return true;
            }
        }

        return false;
    }

    public function canBeModified(): bool
    {
        return $this->status === BillStatus::PENDING;
    }

    public function canBePaid(): bool
    {
        return in_array($this->status, [BillStatus::PENDING, BillStatus::OVERDUE]) &&
               $this->balance > 0;
    }

    public function canBeCancelled(): bool
    {
        return $this->status !== BillStatus::PAID &&
               $this->status !== BillStatus::CANCELLED;
    }

    public function makePayment(float $amount, ?string $notes = null): bool
    {
        if (!$this->canBePaid() || $amount <= 0) {
            return false;
        }

        $this->paid_amount += $amount;
        $this->balance = $this->total_amount - $this->paid_amount;

        // Update status if fully paid
        if ($this->balance <= 0) {
            $this->status = BillStatus::PAID;
            $this->paid_date = now();
            $this->balance = 0; // Ensure no negative balance
        }

        if ($notes) {
            $this->notes = ($this->notes ?? '') . "\n" . now()->format('Y-m-d H:i:s') . ": Payment of {$amount} - {$notes}";
        }

        return $this->save();
    }

    public function reversePayment(float $amount, string $reason): bool
    {
        if ($amount <= 0 || $amount > $this->paid_amount) {
            return false;
        }

        $this->paid_amount -= $amount;
        $this->balance = $this->total_amount - $this->paid_amount;

        // Update status if no longer fully paid
        if ($this->status === BillStatus::PAID && $this->balance > 0) {
            $this->status = BillStatus::PENDING;
            $this->paid_date = null;
        }

        $this->notes = ($this->notes ?? '') . "\n" . now()->format('Y-m-d H:i:s') . ": Payment reversal of {$amount} - {$reason}";

        return $this->save();
    }

    public function applyDiscount(float $discount, string $reason): bool
    {
        if (!$this->canBeModified() || $discount < 0) {
            return false;
        }

        $this->discount = $discount;
        $this->calculateTotals();

        $this->notes = ($this->notes ?? '') . "\n" . now()->format('Y-m-d H:i:s') . ": Discount applied: {$discount} - {$reason}";

        return $this->save();
    }

    public function cancel(string $reason): bool
    {
        if (!$this->canBeCancelled()) {
            return false;
        }

        $this->status = BillStatus::CANCELLED;
        $this->notes = ($this->notes ?? '') . "\n" . now()->format('Y-m-d H:i:s') . ": Bill cancelled - {$reason}";

        return $this->save();
    }

    public function markAsOverdue(): bool
    {
        if ($this->status !== BillStatus::PENDING || $this->due_date->isFuture()) {
            return false;
        }

        $this->status = BillStatus::OVERDUE;
        return $this->save();
    }

    public function duplicate(array $overrides = []): self
    {
        $duplicate = $this->replicate();
        $duplicate->bill_number = null; // Will be auto-generated
        $duplicate->status = BillStatus::PENDING;
        $duplicate->paid_amount = 0;
        $duplicate->balance = $duplicate->total_amount;
        $duplicate->paid_date = null;
        $duplicate->issue_date = now();

        foreach ($overrides as $key => $value) {
            $duplicate->{$key} = $value;
        }

        $duplicate->save();
        return $duplicate;
    }

    // Static helper methods
    public static function generateBillNumber(): string
    {
        $year = now()->year;
        $month = now()->format('m');
        $sequence = str_pad((string)((static::whereYear('created_at', $year)->count() + 1)), 4, '0', STR_PAD_LEFT);

        return "BILL{$year}{$month}{$sequence}";
    }

    public static function createFromTariffs(Student $student, array $tariffs, array $options = []): self
    {
        $bill = new static();
        $bill->student_id = $student->id;
        $bill->academic_year_id = $options['academic_year_id'] ?? null;
        $bill->term_id = $options['term_id'] ?? null;
        $bill->bill_number = static::generateBillNumber();
        $bill->issue_date = now();
        $bill->due_date = $options['due_date'] ?? now()->addDays(30);
        $bill->status = BillStatus::PENDING;

        $subtotal = 0;
        $lineItems = [];

        foreach ($tariffs as $tariff) {
            $amount = $tariff->calculateTermAmount();
            $subtotal += $amount;

            $lineItems[] = [
                'id' => count($lineItems) + 1,
                'tariff_id' => $tariff->id,
                'name' => $tariff->name,
                'type' => $tariff->type->value,
                'amount' => $amount,
                'quantity' => 1,
                'created_at' => now()->toISOString(),
            ];
        }

        $bill->subtotal = $subtotal;
        $bill->discount = $options['discount'] ?? 0;
        $bill->tax = $options['tax'] ?? 0;
        $bill->line_items = $lineItems;
        $bill->description = $options['description'] ?? 'Term fees';

        $bill->calculateTotals();
        $bill->save();

        return $bill;
    }

    // Boot method for model events
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($bill) {
            // Auto-generate bill number if not provided
            if (empty($bill->bill_number)) {
                $bill->bill_number = static::generateBillNumber();
            }
        });

        static::saving(function ($bill) {
            // Auto-calculate totals before saving
            $bill->calculateTotals();
        });
    }
}
