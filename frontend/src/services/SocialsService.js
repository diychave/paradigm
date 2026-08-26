class SocialsService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    getAll() {
        return this.apiClient.get('/socials');
    }
}

export default SocialsService;
