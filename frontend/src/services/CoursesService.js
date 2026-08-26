class CoursesService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    getAll() {
        return this.apiClient.get('/courses');
    }

    getById(id) {
        return this.apiClient.get(`/courses/${id}`);
    }
}

export default CoursesService;
