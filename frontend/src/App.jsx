import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import LoginPage from './auth/LoginPage'
import LandingPage from './pages/public/LandingPage'
import CorporateNavbar from './components/ui/CorporateNavbar'
import MgmtDashboard from './pages/management/MgmtDashboard'
import FeeDashboard from './pages/management/FeeDashboard'
import CmsEditor from './pages/management/CmsEditor'
import PromotionPanel from './pages/management/PromotionPanel'
import StudentManagement from './pages/management/StudentManagement'
import TeacherManagement from './pages/management/TeacherManagement'
import ClassManagement from './pages/management/ClassManagement'
import AlumniDirectory from './pages/management/AlumniDirectory'
import PayrollManagement from './pages/management/PayrollManagement'
import TransportManagement from './pages/management/TransportManagement'
import LibraryManagement from './pages/management/LibraryManagement'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import AttendanceMarker from './pages/teacher/AttendanceMarker'
import GradebookEditor from './pages/teacher/GradebookEditor'
import StudentDashboard from './pages/student/StudentDashboard'
import FeeStatus from './pages/student/FeeStatus'
import AcademicProgress from './pages/student/AcademicProgress'
import StudentAttendance from './pages/student/StudentAttendance'
import EventScheduler from './pages/management/EventScheduler'
import LeaveManagement from './pages/management/LeaveManagement'
import TeacherSubstitutionManager from './pages/management/TeacherSubstitutionManager'
import SchoolGallery from './pages/management/SchoolGallery'
import PtmManagement from './pages/management/PtmManagement'
import InventoryManagement from './pages/management/InventoryManagement'
import HealthRecords from './pages/management/HealthRecords'
import SystemAuditLogs from './pages/management/SystemAuditLogs'
import AdmitCardGenerator from './pages/management/AdmitCardGenerator'
import AssignmentManagement from './pages/management/AssignmentManagement'
import IdCardGenerator from './pages/management/IdCardGenerator'
import ELibraryPage from './pages/shared/ELibraryPage'
import StaffRolesPermissions from './pages/management/StaffRolesPermissions'
import DatabaseBackupConsole from './pages/management/DatabaseBackupConsole'
import AdmissionsPage from './pages/public/AdmissionsPage'
import AcademicCalendar from './pages/public/AcademicCalendar'
import CareersPage from './pages/public/CareersPage'
import BusHardwareDashboard from './pages/transport/BusHardwareDashboard'
import PrincipalExecutiveCockpit from './pages/management/PrincipalExecutiveCockpit'
import ParentDashboard from './pages/parent/ParentDashboard'
import ParentAttendance from './pages/parent/ParentAttendance'
import ParentAcademics from './pages/parent/ParentAcademics'
import ParentFees from './pages/parent/ParentFees'
import ParentPtm from './pages/parent/ParentPtm'
import ParentLeaves from './pages/parent/ParentLeaves'
import MessagingHubPage from './pages/shared/MessagingHubPage'

export default function App() {
  const { user } = useAuth()

  return (
    <>
      <CorporateNavbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
      <Route path="/admissions" element={<AdmissionsPage />} />
      <Route path="/calendar" element={<AcademicCalendar />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Management Portal */}
      <Route path="/management" element={<ProtectedRoute role="MANAGEMENT" />}>
        <Route index element={<PrincipalExecutiveCockpit />} />
        <Route path="overview" element={<MgmtDashboard />} />
        <Route path="executive-cockpit" element={<PrincipalExecutiveCockpit />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="teachers" element={<TeacherManagement />} />
        <Route path="classes" element={<ClassManagement />} />
        <Route path="assignments" element={<AssignmentManagement />} />
        <Route path="events" element={<EventScheduler />} />
        <Route path="admit-cards" element={<AdmitCardGenerator />} />
        <Route path="leaves" element={<LeaveManagement />} />
        <Route path="substitutions" element={<TeacherSubstitutionManager />} />
        <Route path="ptm" element={<PtmManagement />} />
        <Route path="gallery" element={<SchoolGallery />} />
        <Route path="inventory" element={<InventoryManagement />} />
        <Route path="health" element={<HealthRecords />} />
        <Route path="audit-logs" element={<SystemAuditLogs />} />
        <Route path="roles" element={<StaffRolesPermissions />} />
        <Route path="backup" element={<DatabaseBackupConsole />} />
        <Route path="fees" element={<FeeDashboard />} />
        <Route path="payroll" element={<PayrollManagement />} />
        <Route path="transport" element={<TransportManagement />} />
        <Route path="library" element={<ELibraryPage />} />
        <Route path="library-catalogue" element={<LibraryManagement />} />
        <Route path="cms" element={<CmsEditor />} />
        <Route path="promotions" element={<PromotionPanel />} />
        <Route path="alumni" element={<AlumniDirectory />} />
      </Route>

      {/* Teacher Portal */}
      <Route path="/teacher" element={<ProtectedRoute role="TEACHER" />}>
        <Route index element={<TeacherDashboard />} />
        <Route path="library" element={<ELibraryPage />} />
        <Route path="attendance" element={<AttendanceMarker />} />
        <Route path="gradebook" element={<GradebookEditor />} />
        <Route path="assignments" element={<AssignmentManagement />} />
        <Route path="events" element={<EventScheduler />} />
        <Route path="admit-cards" element={<AdmitCardGenerator />} />
        <Route path="leaves" element={<LeaveManagement />} />
        <Route path="ptm" element={<PtmManagement />} />
        <Route path="health" element={<HealthRecords />} />
      </Route>

      {/* Student Portal */}
      <Route path="/student" element={<ProtectedRoute role="STUDENT" />}>
        <Route index element={<StudentDashboard />} />
        <Route path="library" element={<ELibraryPage />} />
        <Route path="fees" element={<FeeStatus />} />
        <Route path="academics" element={<AcademicProgress />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="assignments" element={<AssignmentManagement />} />
        <Route path="events" element={<EventScheduler />} />
        <Route path="admit-cards" element={<AdmitCardGenerator />} />
        <Route path="id-card" element={<IdCardGenerator />} />
        <Route path="leaves" element={<LeaveManagement />} />
        <Route path="ptm" element={<PtmManagement />} />
        <Route path="gallery" element={<SchoolGallery />} />
        <Route path="health" element={<HealthRecords />} />
      </Route>

      {/* Guardian & Parent Portal */}
      <Route path="/parent" element={<ProtectedRoute role="PARENT" />}>
        <Route index element={<ParentDashboard />} />
        <Route path="attendance" element={<ParentAttendance />} />
        <Route path="academics" element={<ParentAcademics />} />
        <Route path="fees" element={<ParentFees />} />
        <Route path="ptm" element={<ParentPtm />} />
        <Route path="leaves" element={<ParentLeaves />} />
      </Route>

      {/* Bus Fleet Operator Console */}
      <Route path="/bus-console" element={<ProtectedRoute role={['BUS_OPERATOR', 'MANAGEMENT']} />}>
        <Route index element={<BusHardwareDashboard />} />
      </Route>

      {/* Universal In-App Messaging & Parent-Teacher Chat Hub */}
      <Route path="/messages" element={<ProtectedRoute />}>
        <Route index element={<MessagingHubPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></>
  )
}
