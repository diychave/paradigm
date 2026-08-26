class SiteService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    get() {
        return this.apiClient.get("/site");
    }
}

export default SiteService;
