class FaqService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    getAll() {
        return this.apiClient.get('/faq');
    }
}

export default FaqService;
