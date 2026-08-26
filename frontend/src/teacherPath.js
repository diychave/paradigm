export const TEACHER_PATH = (import.meta.env.VITE_TEACHER_PATH || "elysium").replace(
    /^\/+|\/+$/g,
    ""
);

export const isTeacherAppPath = (pathname = window.location.pathname) => {
    const base = `/${TEACHER_PATH}`;
    const path = (pathname || "/").replace(/\/+$/, "") || "/";
    return path === base || path.startsWith(`${base}/`);
};

export const teacherHome = () => `/${TEACHER_PATH}`;
export const teacherStudents = () => `/${TEACHER_PATH}/students`;
export const teacherStudent = (id) => `/${TEACHER_PATH}/students/${id}`;
export const teacherCourses = () => `/${TEACHER_PATH}/courses`;
export const teacherCourse = (id) => `/${TEACHER_PATH}/courses/${id}`;
export const teacherSchedule = () => `/${TEACHER_PATH}/schedule`;
export const teacherLesson = (slotId, date) => `/${TEACHER_PATH}/lessons/${slotId}/${date}`;
