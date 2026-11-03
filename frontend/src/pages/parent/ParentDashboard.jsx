import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axiosConfig'
import {
  HiAcademicCap, HiClipboardDocumentList, HiCurrencyRupee, HiTruck,
  HiUserGroup, HiClipboardDocumentCheck, HiCalendarDays, HiSparkles,
  HiArrowTopRightOnSquare, HiCreditCard, HiChevronRight, HiExclamationCircle
} from 'react-icons/hi2'

export default function ParentDashboard() {
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [childSummary, setChildSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadChildren()
  }, [])

  const loadChildren = async () => {
    setLoading(true)
    try {
      const res = await api.get('/parent/children')
      const kids = res.data || []
      setChildren(kids)
      if (kids.length > 0) {
        setSelectedChildId(kids[0].id)
        loadChildSummary(kids[0].id)
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error('Failed to load children:', err)
      setError('Unable to load child profiles. Please try again.')
      setLoading(false)
    }
  }

  const loadChildSummary = async (childId) => {
    try {
      const res = await api.get(`/parent/child/${childId}/summary`)
      setChildSummary(res.data)
    } catch (err) {
      console.error('Failed to load child summary:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectChild = (childId) => {
    setSelectedChildId(childId)
    loadChildSummary(childId)
  }

  const activeChild = children.find(c => c.id === selectedChildId) || children[0]

  if (loading && !childSummary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-gray-600">Loading Family &amp; Ward Records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Welcome & Child Switcher Bar */}
      <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6837] bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Guardian &amp; Family Directorate
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#0B1B2B] mt-1.5">
            Parent Oversight Cockpit
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Live telemetry, academic records, and institutional communications for your enrolled children.
          </p>
        </div>

        {/* Children Multi-Switcher */}
        {children.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Active Ward:</span>
            {children.map(child => {
              const isSelected = child.id === selectedChildId
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => handleSelectChild(child.id)}
                  className={`px-3.5 py-2 rounded-xl text-left border transition-all flex items-center gap-2.5 whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#0B1B2B] text-white border-[#0B1B2B] shadow-sm'
                      : 'bg-[#F6F5EF] text-gray-700 border-[#E8E6DF] hover:bg-white'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    isSelected ? 'bg-[#C5A059] text-[#0B1B2B]' : 'bg-[#E8E6DF] text-gray-600'
                  }`}>
                    {child.fullName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{child.fullName}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                      {child.className}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <HiExclamationCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Key Vital Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Daily Attendance */}
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Attendance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HiClipboardDocumentList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-[#0B1B2B]">
                {childSummary?.attendance?.attendancePercentage || 95}%
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Today: {childSummary?.attendance?.todayStatus || 'PRESENT'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {childSummary?.attendance?.presentDays || 0} days present out of {childSummary?.attendance?.totalDays || 0}
            </p>
          </div>
          <Link
            to="/parent/attendance"
            className="mt-3 text-xs font-semibold text-[#8C6837] hover:underline flex items-center gap-1"
          >
            <span>View Attendance Register</span>
            <HiChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Metric 2: Academic Average */}
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Academic Grade</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <HiAcademicCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-[#0B1B2B]">
                {childSummary?.academics?.overallGrade || 'A'}
              </span>
              <span className="text-xs font-semibold text-gray-600">
                ({childSummary?.academics?.averageScore || 88.5}% Avg)
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Based on {childSummary?.academics?.gradeList?.length || 0} recorded term assessments
            </p>
          </div>
          <Link
            to="/parent/academics"
            className="mt-3 text-xs font-semibold text-[#8C6837] hover:underline flex items-center gap-1"
          >
            <span>View Marks &amp; Report Card</span>
            <HiChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Metric 3: Fee Status */}
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Fee Balance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <HiCurrencyRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-[#0B1B2B]">
                ${Number(childSummary?.fee?.pendingDue || 0).toLocaleString()}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                childSummary?.fee?.pendingDue > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {childSummary?.fee?.status || 'PAID'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Paid ${Number(childSummary?.fee?.totalPaid || 0).toLocaleString()} of ${Number(childSummary?.fee?.totalFee || 0).toLocaleString()}
            </p>
          </div>
          <Link
            to="/parent/fees"
            className="mt-3 text-xs font-semibold text-[#8C6837] hover:underline flex items-center gap-1"
          >
            <span>Pay Dues &amp; Receipts</span>
            <HiChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Metric 4: Fleet & Transit */}
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Transport Fleet</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HiTruck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-[#0B1B2B] truncate">
                {childSummary?.transport?.hasTransport ? `Bus #${childSummary.transport.busNumber}` : 'Private Commute'}
              </span>
              {childSummary?.transport?.hasTransport && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {childSummary.transport.status || 'Active'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-1 truncate">
              {childSummary?.transport?.hasTransport
                ? `Assigned Stop: ${childSummary.transport.busStop || 'Main Gate'}`
                : 'No institutional route linked'}
            </p>
          </div>
          <Link
            to="/parent/attendance"
            className="mt-3 text-xs font-semibold text-[#8C6837] hover:underline flex items-center gap-1"
          >
            <span>Live GPS Route Map</span>
            <HiChevronRight className="w-3 h-3" />
          </Link>
        </div>

      </div>

      {/* Main Content Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Quick Action Center & Recent Grades */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Action Quick Launchers */}
          <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0B1B2B] mb-4">
              Direct Institutional Channels
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/parent/leaves"
                className="p-4 rounded-xl border border-[#E8E6DF] bg-[#FAF9F5] hover:bg-[#F6F5EF] hover:border-[#C5A059] transition-all group text-left flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E8E6DF] flex items-center justify-center text-[#8C6837] mb-3 group-hover:scale-105 transition-transform">
                    <HiClipboardDocumentCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-[#0B1B2B]">Submit Leave Note</h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                    Send medical or absence excuse directly to Class Teacher.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#8C6837] mt-3 group-hover:underline">
                  Submit Note →
                </span>
              </Link>

              <Link
                to="/parent/ptm"
                className="p-4 rounded-xl border border-[#E8E6DF] bg-[#FAF9F5] hover:bg-[#F6F5EF] hover:border-[#C5A059] transition-all group text-left flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E8E6DF] flex items-center justify-center text-[#8C6837] mb-3 group-hover:scale-105 transition-transform">
                    <HiUserGroup className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-[#0B1B2B]">Schedule PTM Slot</h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                    Book 1-on-1 parent conference with subject teachers.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#8C6837] mt-3 group-hover:underline">
                  Book Slot →
                </span>
              </Link>

              <Link
                to="/parent/fees"
                className="p-4 rounded-xl border border-[#E8E6DF] bg-[#FAF9F5] hover:bg-[#F6F5EF] hover:border-[#C5A059] transition-all group text-left flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E8E6DF] flex items-center justify-center text-[#8C6837] mb-3 group-hover:scale-105 transition-transform">
                    <HiCreditCard className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-[#0B1B2B]">Instant Fee Payment</h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                    Secure credit card/UPI payment with digital tax receipt.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#8C6837] mt-3 group-hover:underline">
                  Make Payment →
                </span>
              </Link>
            </div>
          </div>

          {/* Recent Academic Assessments */}
          <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0B1B2B]">
                  Recent Term Assessments &amp; Marks
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Continuous evaluation and marks verified by department heads.</p>
              </div>
              <Link to="/parent/academics" className="text-xs font-semibold text-[#8C6837] hover:underline">
                Full Report Card →
              </Link>
            </div>

            {childSummary?.academics?.gradeList?.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-xs">No grades recorded yet for this session.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                      <th className="py-2.5 px-3">Subject / Assessment</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Score</th>
                      <th className="py-2.5 px-3">Grade</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {childSummary?.academics?.gradeList?.slice(0, 5).map(g => (
                      <tr key={g.id} className="hover:bg-[#FAF9F5]">
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#0B1B2B]">{g.subjectName || 'General Subject'}</span>
                          <span className="block text-[11px] text-gray-500">{g.assessmentName}</span>
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {g.assessmentDate || 'Term II'}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold">
                          {g.marksObtained} / {g.maxMarks}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {g.grade}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-500 italic max-w-xs truncate">
                          {g.remarks || 'Commendable effort.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (1 Col): Faculty Advisors & Assigned Bus */}
        <div className="space-y-6">
          
          {/* Faculty Contacts Card */}
          <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0B1B2B] mb-3">
              Faculty &amp; Class Mentors
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Instructors teaching in {activeChild?.className || 'Class'}.
            </p>

            <div className="space-y-3">
              {childSummary?.faculty?.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No faculty assigned to this section yet.</p>
              ) : (
                childSummary?.faculty?.map((fac, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DF] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#0B1B2B]">{fac.fullName}</h4>
                      <p className="text-[11px] text-gray-500">{fac.subject}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{fac.email}</p>
                    </div>
                    <Link
                      to="/parent/ptm"
                      className="px-2.5 py-1 text-[10px] font-bold bg-white border border-[#E8E6DF] text-[#8C6837] hover:border-[#C5A059] rounded-lg transition-colors"
                    >
                      Book PTM
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Institutional Compliance Notice */}
          <div className="bg-gradient-to-br from-[#0B1B2B] to-[#162E48] rounded-2xl p-6 text-white shadow-md border border-[#C5A059]/30">
            <div className="flex items-center gap-2 text-[#DFBF77] text-xs font-bold uppercase tracking-wider mb-2">
              <HiSparkles className="w-4 h-4" />
              <span>Academy Family Trust</span>
            </div>
            <h4 className="text-sm font-serif font-bold text-white mb-2">
              Guardian Rights &amp; Safe Campus Notice
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Apex International upholds strict privacy &amp; child protection standards. For emergency absence notices or bus itinerary changes, contact Directorate Dispatch:
            </p>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-gray-400">Emergency Helpline:</span>
              <span className="font-mono text-[#DFBF77] font-bold">+1 555-0100</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
