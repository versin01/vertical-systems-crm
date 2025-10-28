import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign, FileText, Tag, CheckSquare, Square } from 'lucide-react';
import { Expense, ExpenseFormData, ExpenseType } from '../../types/finances';
import { useAuth } from '../../contexts/AuthContext';

interface ExpenseFormProps {
  expense?: Expense;
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  createExpense: (expenseData: Partial<Expense>) => Promise<{ data: Expense | null; error: any }>;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => Promise<{ data: Expense | null; error: any }>;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ expense, isOpen, onClose, onSave, createExpense, updateExpense }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<ExpenseFormData>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    expense_name: '',
    expense_type: '',
    invoice_filed: false,
    notes: ''
  });

  // Update form data when expense prop changes
  useEffect(() => {
    if (expense) {
      setFormData({
        date: expense.date,
        amount: expense.amount,
        expense_name: expense.expense_name,
        expense_type: expense.expense_type,
        invoice_filed: expense.invoice_filed,
        notes: expense.notes || ''
      });
    } else {
      // Reset form for new entry
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        expense_name: '',
        expense_type: '',
        invoice_filed: false,
        notes: ''
      });
    }
    setError('');
  }, [expense, isOpen]);

  const expenseTypeOptions: ExpenseType[] = [
    'Bank fees', 'Course', 'Done with you program', 'Done for you program',
    'Meta ads', 'Agency fees', 'Loan', 'Misk', 'Monthly software', 'Other',
    'Personal', 'Referral free', 'Refund', 'Taxes', 'Team payroll',
    'Yearly software', 'YouTube ads'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (formData.amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    if (!formData.expense_type) {
      setError('Expense type is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const expenseData = {
        ...formData,
        expense_type: formData.expense_type as ExpenseType,
        updated_at: new Date().toISOString()
      };

      if (expense) {
        // Update existing entry
        const result = await updateExpense(expense.id, expenseData);
        if (result.error) throw result.error;
        if (result.data) onSave(result.data);
      } else {
        // Create new entry
        const result = await createExpense({
          ...expenseData,
          created_by: user.id
        });
        if (result.error) throw result.error;
        if (result.data) onSave(result.data);
      }

      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold gradient-text section-gradient-finances">
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Date and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Expense Name and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Expense Name *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="expense_name"
                  value={formData.expense_name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="e.g., Monthly SaaS subscription"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Expense Type *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="expense_type"
                  value={formData.expense_type}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white"
                  required
                >
                  <option value="">Select expense type...</option>
                  {expenseTypeOptions.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Invoice Filed */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Invoice Filed
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="invoice_filed"
                checked={formData.invoice_filed}
                onChange={handleChange}
                id="invoice_filed"
                className="rounded border-gray-600 bg-gray-700 text-rose-500 focus:ring-rose-500 h-5 w-5"
              />
              <label htmlFor="invoice_filed" className="text-white">
                Yes, invoice has been filed
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
              placeholder="Any additional notes about this expense..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-rose-400 to-amber-500 hover:from-rose-500 hover:to-amber-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>{expense ? 'Update Expense' : 'Create Expense'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;