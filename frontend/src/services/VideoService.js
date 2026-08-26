class VideoService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    getAll() {
        return this.apiClient.get('/video');
    }
}

export default VideoService;
