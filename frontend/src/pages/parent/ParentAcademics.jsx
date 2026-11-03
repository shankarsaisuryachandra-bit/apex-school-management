import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiAcademicCap, HiPrinter, HiArrowDownTray, HiChartBar,
  HiCheckBadge, HiDocumentCheck, HiInformationCircle
} from 'react-icons/hi2'

export default function ParentAcademics() {
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReportCardModal, setShowReportCardModal] = useState(false)

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
    } catch (err) {
      console.error('Failed to load academics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectChild = (id) => {
    setSelectedChildId(id)
    loadChildData(id)
  }

  const activeChild = children.find(c => c.id === selectedChildId) || children[0]
  const academics = summary?.academics
  const student = summary?.student

  const handlePrintReportCard = () => {
    window.print()
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header & Switcher */}
      <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6837] bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Scholastic Registry &amp; Assessment
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#0B1B2B] mt-1.5">
            Academic Performance &amp; Report Card
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Verified marks, grade distributions, and printable institutional transcripts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Children Multi-Switcher */}
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

          {/* Download Official Report Card Button */}
          <button
            type="button"
            onClick={() => setShowReportCardModal(true)}
            className="btn-gold flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-xs shrink-0"
          >
            <HiPrinter className="w-4 h-4" />
            <span>Generate Report Card</span>
          </button>
        </div>
      </div>

      {/* GPA & Honor Banner */}
      <div className="bg-gradient-to-r from-[#0B1B2B] via-[#162E48] to-[#0B1B2B] rounded-2xl p-6 text-white border border-[#C5A059]/30 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#DFBF77] bg-[#C5A059]/20 px-2 py-0.5 rounded-md border border-[#C5A059]/40">
              Institutional Evaluation Term II
            </span>
            <span className="text-xs text-gray-400">Class: {student?.className || 'Grade 10'}</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-white">
            {student?.fullName || 'Student'} — Academic Portfolio
          </h2>
          <p className="text-xs text-gray-300">
            Admission Number: <span className="font-mono text-[#DFBF77]">{student?.admissionNumber}</span> • Academic Year 2025–2026
          </p>
        </div>

        <div className="flex items-center gap-6 divide-x divide-white/10">
          <div className="text-center">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Overall Grade</span>
            <p className="text-3xl font-serif font-bold text-[#DFBF77] mt-0.5">
              {academics?.overallGrade || 'A'}
            </p>
            <span className="text-[10px] text-emerald-400 font-semibold">First Class Distinction</span>
          </div>

          <div className="text-center pl-6">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Average Score</span>
            <p className="text-3xl font-serif font-bold text-white mt-0.5">
              {academics?.averageScore || 88.5}%
            </p>
            <span className="text-[10px] text-gray-300">Composite Score</span>
          </div>
        </div>
      </div>

      {/* Assessments Gradebook Table */}
      <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0B1B2B]">
              Subject-Wise Assessment Gradebook
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Individual evaluation components recorded by faculty chairs.
            </p>
          </div>
        </div>

        {academics?.gradeList?.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            No assessments currently on file for this student.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-400 font-semibold bg-[#FAF9F5]">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Assessment Name</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Marks Obtained</th>
                  <th className="py-3 px-4">Max Marks</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {academics?.gradeList?.map(g => (
                  <tr key={g.id} className="hover:bg-[#FAF9F5]">
                    <td className="py-3 px-4 font-bold text-[#0B1B2B]">
                      {g.subjectName || 'Mathematics'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {g.assessmentName}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {g.assessmentDate || '2026-10-04'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#0B1B2B]">
                      {g.marksObtained}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-500">
                      {g.maxMarks}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        g.grade?.startsWith('A')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : g.grade?.startsWith('B')
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {g.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 italic max-w-sm truncate">
                      {g.remarks || 'Excellent analytical reasoning and participation.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Report Card Modal */}
      {showReportCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-[#C5A059]/40 max-h-[90vh] overflow-y-auto">
            
            {/* Action Bar (Top) */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 print:hidden">
              <span className="text-xs font-bold text-gray-400 uppercase">Transcript Preview</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintReportCard}
                  className="btn-gold flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg"
                >
                  <HiPrinter className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportCardModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Transcript Template */}
            <div className="pt-6 space-y-6">
              
              {/* Institutional Crest & Header */}
              <div className="text-center pb-4 border-b-2 border-[#0B1B2B]">
                <h2 className="text-2xl font-serif font-bold text-[#0B1B2B] tracking-tight">
                  APEX INTERNATIONAL ACADEMY
                </h2>
                <p className="text-xs uppercase tracking-widest text-[#8C6837] font-semibold mt-0.5">
                  Official Statement of Academic Achievement
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Accredited by International Baccalaureate &amp; Directorate of Secondary Education
                </p>
              </div>

              {/* Student Metadata Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF9F5] p-4 rounded-xl text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Student Name</span>
                  <span className="font-bold text-[#0B1B2B]">{student?.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Admission No.</span>
                  <span className="font-mono font-bold text-[#0B1B2B]">{student?.admissionNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Class &amp; Section</span>
                  <span className="font-bold text-[#0B1B2B]">{student?.className}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Academic Session</span>
                  <span className="font-bold text-[#0B1B2B]">2025–2026</span>
                </div>
              </div>

              {/* Table of Marks */}
              <table className="w-full text-left text-xs border border-gray-200">
                <thead>
                  <tr className="bg-[#0B1B2B] text-white text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Assessment</th>
                    <th className="py-2.5 px-3 text-right">Max Marks</th>
                    <th className="py-2.5 px-3 text-right">Marks Scored</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {academics?.gradeList?.map((g, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-semibold text-[#0B1B2B]">{g.subjectName || 'Mathematics'}</td>
                      <td className="py-2.5 px-3 text-gray-600">{g.assessmentName}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-500">{g.maxMarks}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0B1B2B]">{g.marksObtained}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{g.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Overall Summary Bar */}
              <div className="flex items-center justify-between p-4 bg-[#FAF9F5] rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="font-bold text-[#0B1B2B]">Overall Evaluation:</span>
                  <span className="ml-2 text-emerald-700 font-bold">FIRST CLASS WITH DISTINCTION</span>
                </div>
                <div>
                  <span className="text-gray-500">Cumulative Average:</span>
                  <span className="ml-2 font-bold font-serif text-[#0B1B2B] text-sm">{academics?.averageScore}%</span>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="pt-8 flex items-center justify-between border-t border-gray-200 text-xs text-gray-500">
                <div className="text-center">
                  <div className="w-32 border-b border-gray-400 mb-1"></div>
                  <span>Class Teacher Signature</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-[#C5A059] flex items-center justify-center text-[9px] uppercase font-bold text-[#8C6837] tracking-tighter mx-auto mb-1">
                    Apex Seal
                  </div>
                  <span>Office of Registrar</span>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-gray-400 mb-1"></div>
                  <span>Principal &amp; Director</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  )
}
