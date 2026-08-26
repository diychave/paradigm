class LeadsService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    create(payload) {
        return this.apiClient.post("/leads", payload);
    }
}

export default LeadsService;
