import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiCurrencyRupee, HiCreditCard, HiCheckCircle, HiArrowDownTray,
  HiShieldCheck, HiSparkles, HiXMark, HiPrinter, HiReceiptPercent
} from 'react-icons/hi2'

export default function ParentFees() {
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPayModal, setShowPayModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('CARD')
  const [processing, setProcessing] = useState(false)
  const [successReceipt, setSuccessReceipt] = useState(null)
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8921')
  const [cardExpiry, setCardExpiry] = useState('08/28')
  const [cardCvv, setCardCvv] = useState('492')
  const [upiId, setUpiId] = useState('guardian@okhdfcbank')

  useEffect(() => {
    loadChildren()
  }, [])

  const loadChildren = async () => {
    try {
      const res = await api.get('/parent/children')
      const kids = res.data || []
      setChildren(kids)
      if (kids.length > 0) {
        setSelectedChildId(kids[0].id)
        loadChildData(kids[0].id)
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error('Failed to load children:', err)
      setLoading(false)
    }
  }

  const loadChildData = async (childId) => {
    setLoading(true)
    try {
      const res = await api.get(`/parent/child/${childId}/summary`)
      setSummary(res.data)
      if (res.data?.fee?.pendingDue > 0) {
        setPaymentAmount(res.data.fee.pendingDue.toString())
      } else {
        setPaymentAmount('5000')
      }
    } catch (err) {
      console.error('Failed to load child fee data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectChild = (id) => {
    setSelectedChildId(id)
    setSuccessReceipt(null)
    loadChildData(id)
  }

  const handleProcessPayment = async (e) => {
    e.preventDefault()
    setProcessing(true)
    try {
      const res = await api.post(`/parent/child/${selectedChildId}/pay-fee`, {
        amount: Number(paymentAmount),
        paymentMode: paymentMode
      })
      setSuccessReceipt(res.data)
      setShowPayModal(false)
      // Reload updated fee ledger
      await loadChildData(selectedChildId)
    } catch (err) {
      console.error('Error processing payment:', err)
      alert('Payment processing failed. Please verify institutional gateway status.')
    } finally {
      setProcessing(false)
    }
  }

  const activeChild = children.find(c => c.id === selectedChildId) || children[0]
  const fee = summary?.fee
  const student = summary?.student

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header & Child Switcher */}
      <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6837] bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Bursar Directorate &amp; Accounts
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#0B1B2B] mt-1.5">
            Fee Accounts Ledger &amp; Online Checkout
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Institutional fee dues, breakdown ledger, verified payments, and automated receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {children.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Ward:</span>
              {children.map(child => {
                const isSelected = child.id === selectedChildId
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => handleSelectChild(child.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-[#0B1B2B] text-white border-[#0B1B2B]'
                        : 'bg-[#F6F5EF] text-gray-700 border-[#E8E6DF] hover:bg-white'
                    }`}
                  >
                    {child.fullName}
                  </button>
                )
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setSuccessReceipt(null)
              setShowPayModal(true)
            }}
            className="btn-gold flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-xs shrink-0"
          >
            <HiCreditCard className="w-4 h-4" />
            <span>Pay Dues Online</span>
          </button>
        </div>
      </div>

      {/* Success Receipt Banner */}
      {successReceipt && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <HiCheckCircle className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-emerald-950">
                Payment Authorized Successfully!
              </h3>
              <p className="text-xs text-emerald-800">
                Receipt Number: <span className="font-mono font-bold">{successReceipt.receiptNumber}</span> • Amount: ${Number(successReceipt.amount).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 hover:bg-emerald-800 transition-colors shrink-0"
          >
            <HiPrinter className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      )}

      {/* Ledger Numbers Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Annual Fee Total</span>
          <p className="text-2xl font-bold font-serif text-[#0B1B2B] mt-1">
            ${Number(fee?.totalFee || 50000).toLocaleString()}
          </p>
          <span className="text-[10px] text-gray-500">Session 2025–2026</span>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Total Settled</span>
          <p className="text-2xl font-bold font-serif text-emerald-600 mt-1">
            ${Number(fee?.totalPaid || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-gray-500">Verified by Accounts</span>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Current Balance Due</span>
          <p className="text-2xl font-bold font-serif text-amber-600 mt-1">
            ${Number(fee?.pendingDue || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-amber-700 font-semibold">Due by Oct 31, 2026</span>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Ledger Status</span>
          <div className="mt-1.5">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              fee?.status === 'PAID'
                ? 'bg-emerald-100 text-emerald-800'
                : fee?.status === 'PARTIAL'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {fee?.status || 'PARTIAL'}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 block mt-1.5">Direct Debit Active</span>
        </div>
      </div>

      {/* Fee Itemization Breakdown Table */}
      <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#0B1B2B] mb-3">
          Term II Itemized Fee Structure
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Approved by the Directorate of Finance for {student?.className || 'Grade 10'}.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-400 font-semibold bg-[#FAF9F5]">
                <th className="py-2.5 px-3">Component</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Term Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              <tr>
                <td className="py-3 px-3 font-bold text-[#0B1B2B]">Tuition &amp; Instruction</td>
                <td className="py-3 px-3 text-gray-500">Regular academic instruction and lab curriculum</td>
                <td className="py-3 px-3 text-right font-mono font-semibold">$30,000.00</td>
                <td className="py-3 px-3 text-center"><span className="text-emerald-600 font-bold">Settled</span></td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-[#0B1B2B]">Digital E-Library &amp; Courseware</td>
                <td className="py-3 px-3 text-gray-500">Full access to digital e-reader, textbooks, and AI tutor</td>
                <td className="py-3 px-3 text-right font-mono font-semibold">$5,000.00</td>
                <td className="py-3 px-3 text-center"><span className="text-emerald-600 font-bold">Settled</span></td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-[#0B1B2B]">Transport Corridor Fleet</td>
                <td className="py-3 px-3 text-gray-500">Dedicated bus service on South Corridor Route #12</td>
                <td className="py-3 px-3 text-right font-mono font-semibold">$10,000.00</td>
                <td className="py-3 px-3 text-center"><span className="text-amber-600 font-bold">Due</span></td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-[#0B1B2B]">Campus Sports &amp; Wellness</td>
                <td className="py-3 px-3 text-gray-500">Athletic fields, gymnasium, and infirmary coverage</td>
                <td className="py-3 px-3 text-right font-mono font-semibold">$5,000.00</td>
                <td className="py-3 px-3 text-center"><span className="text-amber-600 font-bold">Due</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#0B1B2B] mb-4">
          Verified Payment History &amp; Vouchers
        </h3>

        {fee?.payments?.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            No payments recorded yet for this academic year.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-400 font-semibold bg-[#FAF9F5]">
                  <th className="py-2.5 px-3">Receipt Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Amount Paid</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {fee?.payments?.map((p, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF9F5]">
                    <td className="py-3 px-3 font-mono font-bold text-[#0B1B2B]">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      {p.paymentDate ? String(p.paymentDate).substring(0, 10) : '2026-10-01'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      ${Number(p.amountPaid).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-gray-500 italic">
                      {p.notes || 'Institutional fee deposit'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="text-[11px] font-semibold text-[#8C6837] hover:underline flex items-center gap-1 justify-end ml-auto"
                      >
                        <HiArrowDownTray className="w-3.5 h-3.5" />
                        <span>Voucher</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Payment Checkout Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#C5A059]/40 relative font-sans animate-in zoom-in-95 duration-150">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowPayModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1"
            >
              <HiXMark className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6837] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                PCI-DSS Level 1 Secure Gateway
              </span>
              <h2 className="text-xl font-serif font-bold text-[#0B1B2B] mt-1.5">
                Online Fee Checkout
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Settling dues for: <strong className="text-[#0B1B2B]">{student?.fullName}</strong> ({student?.admissionNumber})
              </p>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              
              {/* Payment Amount */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Payment Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 text-sm font-bold text-[#0B1B2B] focus:outline-none focus:border-[#C5A059]"
                    required
                    min="100"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500">
                  <span>Quick select:</span>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount((fee?.pendingDue || 25000).toString())}
                    className="text-[#8C6837] font-semibold hover:underline"
                  >
                    Full Due (${Number(fee?.pendingDue || 25000).toLocaleString()})
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount('10000')}
                    className="text-[#8C6837] font-semibold hover:underline"
                  >
                    $10,000 Installment
                  </button>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CARD', label: 'Credit Card' },
                    { id: 'UPI', label: 'UPI / QR' },
                    { id: 'NET_BANKING', label: 'NetBanking' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMode(m.id)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-all ${
                        paymentMode === m.id
                          ? 'bg-[#0B1B2B] text-[#DFBF77] border-[#0B1B2B]'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Payment Details */}
              {paymentMode === 'CARD' ? (
                <div className="space-y-3 p-3.5 rounded-xl bg-[#FAF9F5] border border-gray-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-md border border-gray-300 text-xs font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-md border border-gray-300 text-xs font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-gray-200 space-y-2">
                  <label className="block text-[11px] font-semibold text-gray-600">Virtual Payment Address (UPI ID)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-gray-300 text-xs font-mono"
                    required
                  />
                  <p className="text-[10px] text-gray-400">Google Pay, PhonePe, and Apple Pay supported.</p>
                </div>
              )}

              {/* Security Badge */}
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1">
                <HiShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>256-Bit SSL Encrypted Banking Channel</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className="btn-gold w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {processing ? (
                  <span>Authorizing Transaction...</span>
                ) : (
                  <>
                    <HiShieldCheck className="w-4 h-4" />
                    <span>Authorize &amp; Pay ${Number(paymentAmount || 0).toLocaleString()}</span>
                  </>
                )}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}
