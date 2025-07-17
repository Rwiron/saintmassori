<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\BillItem;
use Illuminate\Database\Eloquent\Collection;

class BillItemRepository extends BaseRepository
{
    public function __construct(BillItem $model)
    {
        parent::__construct($model);
    }

    /**
     * Get all bill items for a specific bill
     */
    public function getByBill(int $billId): Collection
    {
        return $this->model->where('bill_id', $billId)
            ->with(['tariff', 'bill.student'])
            ->orderBy('name')
            ->get();
    }

    /**
     * Get bill items by status
     */
    public function getByStatus(string $status): Collection
    {
        return $this->model->where('status', $status)
            ->with(['tariff', 'bill.student.class'])
            ->get();
    }

    /**
     * Get pending bill items for a student
     */
    public function getPendingByStudent(int $studentId): Collection
    {
        return $this->model->whereHas('bill', function ($query) use ($studentId) {
            $query->where('student_id', $studentId);
        })
        ->whereIn('status', ['pending', 'partial'])
        ->with(['tariff', 'bill'])
        ->get();
    }

    /**
     * Update payment for a bill item
     */
    public function recordPayment(int $billItemId, float $amount, array $paymentData): BillItem
    {
        $billItem = $this->findOrFail($billItemId);
        
        $newPaidAmount = $billItem->paid_amount + $amount;
        $newBalance = $billItem->amount - $newPaidAmount;
        
        $status = $newBalance <= 0 ? 'paid' : 'partial';
        
        // Update payment history
        $paymentHistory = $billItem->payment_history ?? [];
        $paymentHistory[] = [
            'amount' => $amount,
            'date' => now()->toDateTimeString(),
            'method' => $paymentData['method'] ?? 'cash',
            'reference' => $paymentData['reference'] ?? null,
            'notes' => $paymentData['notes'] ?? null,
        ];

        return $this->update($billItemId, [
            'paid_amount' => $newPaidAmount,
            'balance' => $newBalance,
            'status' => $status,
            'paid_date' => $status === 'paid' ? now() : $billItem->paid_date,
            'payment_history' => $paymentHistory,
        ]);
    }
} 