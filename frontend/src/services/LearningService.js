class LearningService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    getMyEnrollments() {
        return this.apiClient.get("/my/enrollments", { auth: true });
    }

    getMyEnrollment(courseId) {
        return this.apiClient.get(`/my/enrollments/${courseId}`, { auth: true });
    }

    getMySchedule() {
        return this.apiClient.get("/my/schedule", { auth: true });
    }

    getSync() {
        return this.apiClient.get("/my/sync", { auth: true });
    }

    teacherStudents() {
        return this.apiClient.get("/teacher/students", { auth: true });
    }

    teacherStudent(id) {
        return this.apiClient.get(`/teacher/students/${id}`, { auth: true });
    }

    teacherSetTopicStatus(enrollmentId, topicId, status) {
        return this.apiClient.patch(
            `/teacher/enrollments/${enrollmentId}/topics/${topicId}`,
            { status },
            { auth: true }
        );
    }

    teacherAddAssignment(topicId, payload) {
        return this.apiClient.post(`/teacher/topics/${topicId}/assignments`, payload, {
            auth: true,
        });
    }

    teacherDeleteAssignment(assignmentId) {
        return this.apiClient.delete(`/teacher/assignments/${assignmentId}`, { auth: true });
    }

    teacherAddStudentMaterial(enrollmentId, topicId, payload) {
        return this.apiClient.post(
            `/teacher/enrollments/${enrollmentId}/topics/${topicId}/materials`,
            payload,
            { auth: true }
        );
    }

    teacherDeleteStudentMaterial(id) {
        return this.apiClient.delete(`/teacher/student-materials/${id}`, { auth: true });
    }

    teacherGrade(enrollmentId, assignmentId, payload) {
        return this.apiClient.patch(
            `/teacher/enrollments/${enrollmentId}/assignments/${assignmentId}`,
            payload,
            { auth: true }
        );
    }

    teacherCourses() {
        return this.apiClient.get("/teacher/courses", { auth: true });
    }

    teacherCourse(id) {
        return this.apiClient.get(`/teacher/courses/${id}`, { auth: true });
    }

    teacherAddMaterial(topicId, payload) {
        return this.apiClient.post(`/teacher/topics/${topicId}/materials`, payload, {
            auth: true,
        });
    }

    teacherUpdateAssignment(assignmentId, payload) {
        return this.apiClient.patch(`/teacher/assignments/${assignmentId}`, payload, {
            auth: true,
        });
    }

    teacherSaveNotes(enrollmentId, notes) {
        return this.apiClient.patch(
            `/teacher/enrollments/${enrollmentId}/notes`,
            { notes },
            { auth: true }
        );
    }

    teacherAttendance(payload) {
        return this.apiClient.patch("/teacher/attendance", payload, { auth: true });
    }

    teacherLesson(slotId, date) {
        return this.apiClient.get(`/teacher/lessons/${slotId}/${date}`, { auth: true });
    }

    teacherSchedule() {
        return this.apiClient.get("/teacher/schedule", { auth: true });
    }

    teacherSetLessonStatus(slotId, date, status) {
        return this.apiClient.post(
            "/teacher/schedule/exceptions",
            { slot_id: slotId, date, status },
            { auth: true }
        );
    }

    teacherCancelLesson(slotId, date) {
        return this.teacherSetLessonStatus(slotId, date, "cancelled");
    }

    teacherRestoreLesson(exceptionId) {
        return this.apiClient.delete(`/teacher/schedule/exceptions/${exceptionId}`, {
            auth: true,
        });
    }

    toggleLesson(id) {
        return this.apiClient.post(`/my/lessons/${id}/toggle`, {}, { auth: true });
    }
}

export default LearningService;
