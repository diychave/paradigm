class OfficeService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    home() {
        return this.apiClient.get("/office/home", { auth: true });
    }

    leads() {
        return this.apiClient.get("/office/leads", { auth: true });
    }

    updateLead(id, payload) {
        return this.apiClient.patch(`/office/leads/${id}`, payload, { auth: true });
    }

    lookups() {
        return this.apiClient.get("/office/lookups", { auth: true });
    }

    courses() {
        return this.apiClient.get("/office/courses", { auth: true });
    }

    course(id) {
        return this.apiClient.get(`/office/courses/${id}`, { auth: true });
    }

    createCourse(payload) {
        return this.apiClient.post("/office/courses", payload, { auth: true });
    }

    updateCourse(id, payload) {
        return this.apiClient.patch(`/office/courses/${id}`, payload, { auth: true });
    }

    addSection(courseId, title) {
        return this.apiClient.post(`/office/courses/${courseId}/sections`, { title }, { auth: true });
    }

    deleteSection(sectionId) {
        return this.apiClient.delete(`/office/sections/${sectionId}`, { auth: true });
    }

    addTopic(sectionId, payload) {
        return this.apiClient.post(`/office/sections/${sectionId}/topics`, payload, { auth: true });
    }

    deleteTopic(topicId) {
        return this.apiClient.delete(`/office/topics/${topicId}`, { auth: true });
    }

    grantStudent(courseId, userId) {
        return this.apiClient.post(
            `/office/courses/${courseId}/access`,
            { role: "student", user_id: userId },
            { auth: true }
        );
    }

    grantTeacher(courseId, userId) {
        return this.apiClient.post(
            `/office/courses/${courseId}/access`,
            { role: "teacher", user_id: userId },
            { auth: true }
        );
    }

    revokeAccess(courseId, userId, role) {
        const query = role ? `?role=${encodeURIComponent(role)}` : "";
        return this.apiClient.delete(`/office/courses/${courseId}/access/${userId}${query}`, {
            auth: true,
        });
    }

    updateSection(id, payload) {
        return this.apiClient.patch(`/office/sections/${id}`, payload, { auth: true });
    }

    updateTopic(id, payload) {
        return this.apiClient.patch(`/office/topics/${id}`, payload, { auth: true });
    }

    duplicateMaterial(id) {
        return this.apiClient.post(`/office/materials/${id}/duplicate`, {}, { auth: true });
    }

    bulkMaterials(payload) {
        return this.apiClient.post("/office/materials/bulk", payload, { auth: true });
    }

    reorder(courseId, payload) {
        return this.apiClient.patch(`/office/courses/${courseId}/reorder`, payload, { auth: true });
    }

    addMaterial(topicId, payload) {
        return this.apiClient.post(`/office/topics/${topicId}/materials`, payload, { auth: true });
    }

    updateMaterial(id, payload) {
        return this.apiClient.patch(`/office/materials/${id}`, payload, { auth: true });
    }

    deleteMaterial(id) {
        return this.apiClient.delete(`/office/materials/${id}`, { auth: true });
    }

    people(role) {
        if (role === "archived") {
            return this.apiClient.get("/office/people?archived=1", { auth: true });
        }
        const query = role ? `?role=${encodeURIComponent(role)}` : "";
        return this.apiClient.get(`/office/people${query}`, { auth: true });
    }

    person(id) {
        return this.apiClient.get(`/office/people/${id}`, { auth: true });
    }

    createPerson(payload) {
        return this.apiClient.post("/office/people", payload, { auth: true });
    }

    updatePerson(id, payload) {
        return this.apiClient.patch(`/office/people/${id}`, payload, { auth: true });
    }

    schedule() {
        return this.apiClient.get("/office/schedule", { auth: true });
    }

    createSlot(payload) {
        return this.apiClient.post("/office/schedule", payload, { auth: true });
    }

    deleteSlot(id) {
        return this.apiClient.delete(`/office/schedule/${id}`, { auth: true });
    }

    transactions() {
        return this.apiClient.get("/office/transactions", { auth: true });
    }

    createTransaction(payload) {
        return this.apiClient.post("/office/transactions", payload, { auth: true });
    }

    updateTransaction(id, payload) {
        return this.apiClient.patch(`/office/transactions/${id}`, payload, { auth: true });
    }

    deleteTransaction(id) {
        return this.apiClient.delete(`/office/transactions/${id}`, { auth: true });
    }

    listing() {
        return this.apiClient.get("/office/listing", { auth: true });
    }

    updateListingSite(payload) {
        return this.apiClient.patch("/office/listing/site", payload, { auth: true });
    }

    updateListingCourse(id, payload) {
        return this.apiClient.patch(`/office/listing/courses/${id}`, payload, { auth: true });
    }

    createPricing(payload) {
        return this.apiClient.post("/office/listing/pricing", payload, { auth: true });
    }

    updatePricing(id, payload) {
        return this.apiClient.patch(`/office/listing/pricing/${id}`, payload, { auth: true });
    }

    deletePricing(id) {
        return this.apiClient.delete(`/office/listing/pricing/${id}`, { auth: true });
    }

    createFaq(payload) {
        return this.apiClient.post("/office/listing/faq", payload, { auth: true });
    }

    updateFaq(id, payload) {
        return this.apiClient.patch(`/office/listing/faq/${id}`, payload, { auth: true });
    }

    deleteFaq(id) {
        return this.apiClient.delete(`/office/listing/faq/${id}`, { auth: true });
    }

    createSocial(payload) {
        return this.apiClient.post("/office/listing/socials", payload, { auth: true });
    }

    updateSocial(id, payload) {
        return this.apiClient.patch(`/office/listing/socials/${id}`, payload, { auth: true });
    }

    deleteSocial(id) {
        return this.apiClient.delete(`/office/listing/socials/${id}`, { auth: true });
    }

    createVideo(payload) {
        return this.apiClient.post("/office/listing/videos", payload, { auth: true });
    }

    updateVideo(id, payload) {
        return this.apiClient.patch(`/office/listing/videos/${id}`, payload, { auth: true });
    }

    deleteVideo(id) {
        return this.apiClient.delete(`/office/listing/videos/${id}`, { auth: true });
    }

    createReview(payload) {
        return this.apiClient.post("/office/listing/reviews", payload, { auth: true });
    }

    updateReview(id, payload) {
        return this.apiClient.patch(`/office/listing/reviews/${id}`, payload, { auth: true });
    }

    deleteReview(id) {
        return this.apiClient.delete(`/office/listing/reviews/${id}`, { auth: true });
    }
}

export default OfficeService;
