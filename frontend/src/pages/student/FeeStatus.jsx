import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiCurrencyRupee, HiCheckCircle, HiExclamationCircle, HiCreditCard, HiQrCode, HiXMark, HiArrowDownTray, HiSparkles } from 'react-icons/hi2'

export default function FeeStatus() {
  const [fee, setFee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [payModal, setPayModal] = useState(false)
  const [paymentMode, setPaymentMode] = useState('UPI') // 'UPI' | 'RAZORPAY'
  const [processing, setProcessing] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [schoolInfo, setSchoolInfo] = useState(null)

  useEffect(() => {
    fetchMyFees()
  }, [])

  const fetchMyFees = async () => {
    try {
      const [feeRes, infoRes] = await Promise.allSettled([
        api.get('/fees/my-fees'),
        api.get('/cms/info')
      ])
      if (feeRes.status === 'fulfilled') setFee(feeRes.value.data)
      if (infoRes.status === 'fulfilled') setSchoolInfo(infoRes.value.data)
    } catch (error) {
      console.error('Failed to fetch fees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOnlinePayment = async () => {
    if (!fee || !fee.balanceDue || fee.balanceDue <= 0) {
      alert('Fee account has no outstanding balance due ($0.00). Payment rejected.')
      return
    }
    setProcessing(true)
    try {
      const payload = {
        studentId: fee.studentId,
        amount: fee.balanceDue,
        paymentMode: paymentMode === 'UPI' ? 'UPI_ONLINE' : 'RAZORPAY_GATEWAY',
        remarks: `Online Payment via ${paymentMode} — Transaction Ref: ${Date.now()}`
      }
      const { data } = await api.post('/fees/payment', payload)
      setReceipt({
        receiptNumber: data.receiptNumber || `REC-${Date.now()}`,
        amountPaid: fee.balanceDue,
        date: new Date().toLocaleDateString('en-IN'),
        mode: paymentMode,
        studentName: fee.studentName,
        rollNumber: fee.rollNumber
      })
      setPayModal(false)
      fetchMyFees()
    } catch (error) {
      alert(error.response?.data?.message || 'Payment processing failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse text-surface-700/50">Loading fee status...</div>
  }

  if (!fee) {
    return (
      <div className="card p-8 text-center">
        <p className="text-surface-700/60">No fee records found for your account.</p>
      </div>
    )
  }

  const isPaid = fee.status === 'PAID' || fee.balanceDue <= 0
  const activeUpiId = schoolInfo?.upiId || 'apexschool.fee@upi'
  const customQrUrl = schoolInfo?.upiQrUrl
  const autoQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${activeUpiId}&pn=${encodeURIComponent(schoolInfo?.schoolName || 'Apex Academy')}&am=${fee.balanceDue}&cu=INR`
  const upiQrUrl = customQrUrl || autoQrUrl

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-surface-900">My Fee Status</h1>
        <p className="text-surface-700/60 mt-1">Academic Year: {fee.academicYear}</p>
      </div>

      {/* Status Banner */}
      <div className={`card p-6 ${isPaid ? 'border-accent-200 bg-accent-50/50' : 'border-red-200 bg-red-50/50'}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {isPaid ? (
              <HiCheckCircle className="w-8 h-8 text-accent-600" />
            ) : (
              <HiExclamationCircle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h2 className="text-xl font-display font-bold">
                {isPaid ? 'All Fees Paid' : `₹${fee.balanceDue?.toFixed(2)} Pending`}
              </h2>
              <p className="text-sm text-surface-700/60">
                {isPaid ? 'You have no outstanding dues.' : 'Please clear your pending dues.'}
              </p>
            </div>
          </div>

          {!isPaid && (
            <button
              onClick={() => setPayModal(true)}
              className="px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all animate-pulse"
            >
              <HiCreditCard className="w-5 h-5" />
              <span>Pay Fees Online</span>
            </button>
          )}
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="card p-6">
        <h2 className="text-lg font-display font-bold text-surface-900 mb-4">Fee Breakdown</h2>
        <div className="space-y-3">
          <div className="flex justify-between p-3 rounded-xl bg-surface-50">
            <span className="text-surface-700">Previous Year Pending</span>
            <span className="font-semibold">₹{fee.previousYearPending?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between p-3 rounded-xl bg-surface-50">
            <span className="text-surface-700">Current Year Due</span>
            <span className="font-semibold">₹{fee.currentYearDue?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between p-3 rounded-xl bg-primary-50 border border-primary-200">
            <span className="font-semibold text-primary-800">Grand Total</span>
            <span className="font-bold text-primary-800">₹{fee.grandTotal?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between p-3 rounded-xl bg-accent-50">
            <span className="text-accent-700">Total Paid</span>
            <span className="font-semibold text-accent-700">₹{fee.totalPaid?.toFixed(2)}</span>
          </div>
          <div className={`flex justify-between p-3 rounded-xl ${
            isPaid ? 'bg-accent-50' : 'bg-red-50 border border-red-200'}`}>
            <span className="font-semibold">Balance Due</span>
            <span className={`font-bold ${isPaid ? 'text-accent-700' : 'text-red-700'}`}>
              ₹{fee.balanceDue?.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 💳 ONLINE PAYMENT GATEWAY MODAL */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-surface-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-surface-900 text-white">
              <div className="flex items-center gap-2">
                <HiCreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Online Fee Checkout</h3>
              </div>
              <button onClick={() => setPayModal(false)} className="text-white/70 hover:text-white">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-center bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
                <p className="text-xs text-amber-900 font-medium uppercase tracking-wider">Total Payable Amount</p>
                <p className="text-3xl font-black text-amber-950 mt-0.5">₹{fee.balanceDue?.toFixed(2)}</p>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-2">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMode('UPI')}
                    className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-1.5 transition-all ${
                      paymentMode === 'UPI' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-surface-200 text-surface-600'
                    }`}
                  >
                    <HiQrCode className="w-6 h-6 text-emerald-600" />
                    <span>UPI / GPay / PhonePe</span>
                  </button>
                  <button
                    onClick={() => setPaymentMode('RAZORPAY')}
                    className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-1.5 transition-all ${
                      paymentMode === 'RAZORPAY' ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-surface-200 text-surface-600'
                    }`}
                  >
                    <HiCreditCard className="w-6 h-6 text-primary-600" />
                    <span>Card / Netbanking</span>
                  </button>
                </div>
              </div>

              {paymentMode === 'UPI' ? (
                <div className="text-center space-y-3 bg-surface-50 p-4 rounded-xl border border-surface-200">
                  <p className="text-xs font-bold text-surface-700">Scan QR Code using GPay / PhonePe / BHIM</p>
                  <div className="w-44 h-44 mx-auto bg-white p-2 rounded-xl shadow-xs border border-surface-200 flex items-center justify-center">
                    <img src={upiQrUrl} alt="UPI Payment QR Code" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-[11px] text-surface-500 font-mono">UPI ID: {activeUpiId}</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                  <p className="text-xs font-bold text-blue-900 flex items-center gap-1">
                    <HiSparkles className="w-4 h-4 text-blue-600" /> Razorpay Secured Payment Gateway
                  </p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Supports Debit/Credit Cards (Visa, Mastercard, RuPay), NetBanking, and Wallet payments with instant SSL encryption.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setPayModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleOnlinePayment}
                  disabled={processing}
                  className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white"
                >
                  {processing ? 'Processing...' : 'Confirm & Complete Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🧾 DIGITAL RECEIPT MODAL */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-surface-200 overflow-hidden text-center p-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <HiCheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-surface-900">Payment Successful!</h3>
              <p className="text-xs text-surface-500 mt-1">Receipt #{receipt.receiptNumber}</p>
            </div>

            <div className="bg-surface-50 p-4 rounded-xl space-y-2 text-left text-xs border border-surface-200">
              <div className="flex justify-between"><span className="text-surface-500">Student Name:</span><span className="font-bold">{fee.studentName || 'Student'}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Amount Paid:</span><span className="font-bold text-emerald-700">₹{receipt.amountPaid?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Payment Mode:</span><span className="font-bold">{receipt.mode}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Date & Time:</span><span className="font-bold">{receipt.date}</span></div>
            </div>

            <div className="flex gap-3 pt-2 print:hidden">
              <button onClick={() => window.print()} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <HiArrowDownTray className="w-4 h-4" /> Print Receipt
              </button>
              <button onClick={() => setReceipt(null)} className="btn-primary flex-1">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
