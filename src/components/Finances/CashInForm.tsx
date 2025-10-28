import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign, User, Mail, Building, Plus, Percent } from 'lucide-react';
import { CashEntry, CashEntryFormData, PaymentType, PaymentStatus, Offer, OfferFormData } from '../../types/finances';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useOffers } from '../../hooks/useCashEntries';
import { useUsers } from '../../hooks/useUsers';

interface CashInFormProps {
  entry?: CashEntry;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: CashEntry) => void;
}

const CashInForm: React.FC<CashInFormProps> = ({ entry, isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const { offers, fetchOffers, createOffer } = useOffers();
  const { users, fetchUsers } = useUsers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [newOfferData, setNewOfferData] = useState<OfferFormData>({ name: '', description: '' });

  const [formData, setFormData] = useState<CashEntryFormData>({
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    income: 0,
    offer_id: '',
    client_name: '',
    client_email: '',
    payment_type: 'Deposit',
    status: 'Paid',
    contracted_amount: 0,
    gross_profit: 0,
    setter_percentage: 0,
    closer_percentage: 0,
    setter_id: ''
  });

  // Fetch offers when form opens
  useEffect(() => {
    if (isOpen) {
      fetchOffers();
      fetchUsers();
    }
  }, [isOpen, fetchOffers, fetchUsers]);

  // Update form data when entry prop changes
  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date,
        due_date: entry.due_date || '',
        income: entry.income,
        offer_id: entry.offer_id || '',
        client_name: entry.client_name,
        client_email: entry.client_email,
        payment_type: entry.payment_type,
        status: entry.status,
        contracted_amount: entry.contracted_amount,
        gross_profit: entry.gross_profit,
        setter_percentage: entry.setter_percentage,
        closer_percentage: entry.closer_percentage,
        setter_id: entry.setter_id || ''
      });
    } else {
      // Reset form for new entry
      setFormData({
        date: new Date().toISOString().split('T')[0],
        due_date: '',
        income: 0,
        offer_id: '',
        client_name: '',
        client_email: '',
        payment_type: 'Deposit',
        status: 'Paid',
        contracted_amount: 0,
        gross_profit: 0,
        setter_percentage: 0,
        closer_percentage: 0,
        setter_id: ''
      });
    }
    setError('');
    setShowOfferForm(false);
  }, [entry, isOpen]);

  const paymentTypeOptions: PaymentType[] = [
    'Deposit', 'Installment', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'
  ];

  const statusOptions: PaymentStatus[] = ['Paid', 'Canceled', 'Refunded'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCreateOffer = async () => {
    if (!newOfferData.name.trim()) {
      setError('Offer name is required');
      return;
    }

    try {
      const result = await createOffer({
        ...newOfferData,
        created_by: user?.id || ''
      });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      // Select the newly created offer
      setFormData(prev => ({
        ...prev,
        offer_id: result.data?.id || ''
      }));

      // Reset offer form
      setNewOfferData({ name: '', description: '' });
      setShowOfferForm(false);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const calculateCommissions = () => {
    const grossProfit = formData.gross_profit;
    const setterPayment = (grossProfit * formData.setter_percentage) / 100;
    const closerPayment = (grossProfit * formData.closer_percentage) / 100;
    const totalCommissions = setterPayment + closerPayment;

    return { setterPayment, closerPayment, totalCommissions };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (formData.income < 0) {
      setError('Income must be positive');
      return;
    }

    if (formData.gross_profit > formData.income) {
      setError('Gross profit cannot exceed income');
      return;
    }

    if (formData.setter_percentage + formData.closer_percentage > 100) {
      setError('Total commission percentages cannot exceed 100%');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { setterPayment, closerPayment, totalCommissions } = calculateCommissions();

      const entryData = {
        ...formData,
        offer_id: formData.offer_id || null,
        setter_payment: setterPayment,
        closer_payment: closerPayment,
        total_commissions: totalCommissions,
        updated_at: new Date().toISOString()
      };

      if (entry) {
        // Update existing entry
        const { data, error } = await supabase
          .from('cash_entries')
          .update(entryData)
          .eq('id', entry.id)
          .select(`
            *,
            offer:offers(id, name, description),
            creator:created_by(id, email, full_name)
          `)
          .single();

        if (error) throw error;
        onSave(data);
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('cash_entries')
          .insert({
            ...entryData,
            created_by: user.id
          })
          .select(`
            *,
            offer:offers(id, name, description),
            creator:created_by(id, email, full_name)
          `)
          .single();

        if (error) throw error;
        onSave(data);
      }

      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const { setterPayment, closerPayment, totalCommissions } = calculateCommissions();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold gradient-text section-gradient-finances">
            {entry ? 'Edit Cash Entry' : 'Add New Cash Entry'}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Date and Income */}
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
                    Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Income and Setter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Income *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="income"
                      value={formData.income}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Setter
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      name="setter_id"
                      value={formData.setter_id}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white"
                    >
                      <option value="">Select setter...</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Offer Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Offer
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      name="offer_id"
                      value={formData.offer_id}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white"
                    >
                      <option value="">Select offer...</option>
                      {offers.map(offer => (
                        <option key={offer.id} value={offer.id}>
                          {offer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOfferForm(true)}
                    className="flex items-center space-x-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New</span>
                  </button>
                </div>
              </div>

              {/* New Offer Form */}
              {showOfferForm && (
                <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg space-y-4">
                  <h4 className="font-semibold text-white">Create New Offer</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Offer Name *
                      </label>
                      <input
                        type="text"
                        value={newOfferData.name}
                        onChange={(e) => setNewOfferData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="Enter offer name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newOfferData.description}
                        onChange={(e) => setNewOfferData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="Enter description"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleCreateOffer}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                    >
                      Create Offer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOfferForm(false);
                        setNewOfferData({ name: '', description: '' });
                      }}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Client Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="client_name"
                      value={formData.client_name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Client full name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Client Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="client_email"
                      value={formData.client_email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="client@example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Payment Type *
                  </label>
                  <select
                    name="payment_type"
                    value={formData.payment_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white"
                    required
                  >
                    {paymentTypeOptions.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white"
                    required
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Contracted Amount *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="contracted_amount"
                      value={formData.contracted_amount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Gross Profit *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-400" />
                    <input
                      type="number"
                      name="gross_profit"
                      value={formData.gross_profit}
                      onChange={handleChange}
                      min="0"
                      max={formData.income}
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Cannot exceed income (${formData.income.toFixed(2)})
                  </p>
                </div>
              </div>

              {/* Commission Percentages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Setter Percentage
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="setter_percentage"
                      value={formData.setter_percentage}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Closer Percentage
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="closer_percentage"
                      value={formData.closer_percentage}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-400">
                Total commission percentage: {(formData.setter_percentage + formData.closer_percentage).toFixed(2)}%
                {formData.setter_percentage + formData.closer_percentage > 100 && (
                  <span className="text-red-400 ml-2">⚠ Cannot exceed 100%</span>
                )}
              </div>
            </div>

            {/* Right Column - Commission Summary */}
            <div className="space-y-6">
              <div className="glass-card p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-rose-400" />
                  Commission Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Gross Profit:</span>
                    <span className="text-white font-semibold">
                      ${formData.gross_profit.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Setter Payment:</span>
                    <span className="text-blue-400 font-semibold">
                      ${setterPayment.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Closer Payment:</span>
                    <span className="text-green-400 font-semibold">
                      ${closerPayment.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                    <span className="text-gray-400">Total Commissions:</span>
                    <span className="text-rose-400 font-semibold">
                      ${totalCommissions.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Net Profit:</span>
                    <span className="text-emerald-400 font-semibold">
                      ${(formData.gross_profit - totalCommissions).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Commission Breakdown Chart */}
                {formData.gross_profit > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-400 mb-2">Commission Breakdown</div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 bg-blue-400 rounded-l-full transition-all duration-500"
                            style={{ width: `${(setterPayment / formData.gross_profit) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-blue-400 min-w-[3rem]">
                          {((setterPayment / formData.gross_profit) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 bg-green-400 rounded-l-full transition-all duration-500"
                            style={{ width: `${(closerPayment / formData.gross_profit) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-green-400 min-w-[3rem]">
                          {((closerPayment / formData.gross_profit) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="glass-card p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-amber-400" />
                  Financial Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Income:</span>
                    <span className="text-white font-semibold">
                      ${formData.income.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Contracted Amount:</span>
                    <span className="text-white font-semibold">
                      ${formData.contracted_amount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-semibold ${
                      formData.status === 'Paid' ? 'text-green-400' :
                      formData.status === 'Canceled' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {formData.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Payment Type:</span>
                    <span className="text-white font-semibold">
                      {formData.payment_type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
                  <span>{entry ? 'Update Entry' : 'Create Entry'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CashInForm;