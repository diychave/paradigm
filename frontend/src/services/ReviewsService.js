class ReviewsService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    getText(page = 1, limit = 6, filter) {
        const query = filter
            ? `?course=${filter}&_page=${page}&_per_page=${limit}`
            : `?_page=${page}&_per_page=${limit}`;

        return this.apiClient.get(`/reviews${query}`);
    }
}

export default ReviewsService;
