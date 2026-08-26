import { lazy, Suspense } from 'react'
import Modal from '@components/Modal/Modal'
import ErrorBoundary from '@components/ErrorBoundary/ErrorBoundary'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Loader from '@components/Loader/Loader'
import { TEACHER_PATH } from '@/teacherPath'
import { STAFF_PATH } from '@/staffPath'

const Main = lazy(() => import('@components/pages/Main/Main'))
const Course = lazy(() => import('@components/pages/Course/Course'))
const Offer = lazy(() => import('@components/pages/Offer/Offer'))
const Pricing = lazy(() => import('@components/pages/Pricing/Pricing'))
const Login = lazy(() => import('@components/pages/Login/Login'))
const Dashboard = lazy(() => import('@components/pages/Student/Dashboard'))
const Courses = lazy(() => import('@components/pages/Student/Courses'))
const CourseDetail = lazy(() => import('@components/pages/Student/CourseDetail'))
const Schedule = lazy(() => import('@components/pages/Student/Schedule'))
const TeacherApp = lazy(() => import('@components/pages/Teacher/TeacherApp'))
const TeacherHome = lazy(() => import('@components/pages/Teacher/TeacherHome'))
const TeacherStudent = lazy(() => import('@components/pages/Teacher/TeacherStudent'))
const TeacherStudents = lazy(() => import('@components/pages/Teacher/Students'))
const TeacherCourses = lazy(() => import('@components/pages/Teacher/Courses'))
const TeacherCoursePage = lazy(() => import('@components/pages/Teacher/CoursePage'))
const TeacherSchedule = lazy(() => import('@components/pages/Teacher/SchedulePage'))
const OfficeApp = lazy(() => import('@components/pages/Office/OfficeApp'))
const OfficeHome = lazy(() => import('@components/pages/Office/OfficeHome'))
const OfficeLeads = lazy(() => import('@components/pages/Office/OfficeLeads'))
const OfficeCourses = lazy(() => import('@components/pages/Office/OfficeCourses'))
const OfficeCourse = lazy(() => import('@components/pages/Office/OfficeCourse'))
const OfficePeople = lazy(() => import('@components/pages/Office/OfficePeople'))
const OfficeSchedule = lazy(() => import('@components/pages/Office/OfficeSchedule'))
const OfficeTransactions = lazy(() => import('@components/pages/Office/OfficeTransactions'))
const OfficeListing = lazy(() => import('@components/pages/Office/OfficeListing'))
const NotFound = lazy(() => import('@components/pages/NotFound/NotFound'))

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loader />}>
        <Router>
          <Routes>
            <Route path='/' element={<Main />} />
            <Route path='/course/:id' element={<Course />} />
            <Route path='/oferta' element={<Offer />} />
            <Route path='/prices' element={<Pricing />} />
            <Route path='/login' element={<Login />} />
            <Route path='/account' element={<Dashboard />} />
            <Route path='/account/courses' element={<Courses />} />
            <Route path='/account/courses/:courseId' element={<CourseDetail />} />
            <Route path='/account/assignments' element={<Navigate to="/account" replace />} />
            <Route path='/account/schedule' element={<Schedule />} />
            <Route path='/account/settings' element={<Navigate to="/account" replace />} />
            <Route path={`/${TEACHER_PATH}/*`} element={<TeacherApp />}>
              <Route index element={<TeacherHome />} />
              <Route path="students" element={<TeacherStudents />} />
              <Route path="students/:id" element={<TeacherStudent />} />
              <Route path="courses" element={<TeacherCourses />} />
              <Route path="courses/:courseId" element={<TeacherCoursePage />} />
              <Route path="schedule" element={<TeacherSchedule />} />
              <Route path="lessons/:slotId/:date" element={<Navigate to={`/${TEACHER_PATH}/schedule`} replace />} />
            </Route>
            <Route path={`/${STAFF_PATH}/*`} element={<OfficeApp />}>
              <Route index element={<OfficeHome />} />
              <Route path="leads" element={<OfficeLeads />} />
              <Route path="courses" element={<OfficeCourses />} />
              <Route path="courses/:courseId" element={<OfficeCourse />} />
              <Route path="people" element={<OfficePeople />} />
              <Route path="schedule" element={<OfficeSchedule />} />
              <Route path="transactions" element={<OfficeTransactions />} />
              <Route path="listing" element={<OfficeListing />} />
            </Route>
            <Route path='*' element={<NotFound />} />
          </Routes>
        </Router>
        <Modal />
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
