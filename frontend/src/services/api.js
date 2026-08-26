import ApiClient from "./ApiClient";
import CoursesService from "./CoursesService";
import ReviewsService from "./ReviewsService";
import VideoService from "./VideoService";
import FaqService from "./FaqService";
import SocialsService from "./SocialsService";
import PricingService from "./PricingService";
import LeadsService from "./LeadsService";
import AuthService from "./AuthService";
import LearningService from "./LearningService";
import OfficeService from "./OfficeService";
import SiteService from "./SiteService";

class Api {
    constructor(baseURL) {
        this.client = new ApiClient(baseURL);
        this.courses = new CoursesService(this.client);
        this.reviews = new ReviewsService(this.client);
        this.video = new VideoService(this.client);
        this.faq = new FaqService(this.client);
        this.socials = new SocialsService(this.client);
        this.pricing = new PricingService(this.client);
        this.leads = new LeadsService(this.client);
        this.auth = new AuthService(this.client);
        this.learning = new LearningService(this.client);
        this.office = new OfficeService(this.client);
        this.site = new SiteService(this.client);
    }
}

const api = new Api(import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api");

export default api;
