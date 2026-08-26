class PricingService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    getAll() {
        return this.apiClient.get('/pricing');
    }
}

export default PricingService;
