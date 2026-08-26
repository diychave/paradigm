export const STAFF_PATH = (import.meta.env.VITE_STAFF_PATH || "office-n8r4").replace(
    /^\/+|\/+$/g,
    ""
);

export const isStaffAppPath = (pathname = window.location.pathname) => {
    const base = `/${STAFF_PATH}`;
    const path = (pathname || "/").replace(/\/+$/, "") || "/";
    return path === base || path.startsWith(`${base}/`);
};

export const officeHome = () => `/${STAFF_PATH}`;
export const officeLeads = () => `/${STAFF_PATH}/leads`;
export const officeCourses = () => `/${STAFF_PATH}/courses`;
export const officeCourse = (id) => `/${STAFF_PATH}/courses/${id}`;
export const officePeople = (query) => {
    const path = `/${STAFF_PATH}/people`;
    if (!query) return path;
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (value == null || value === "") return;
        params.set(key, String(value));
    });
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
};
export const officeSchedule = () => `/${STAFF_PATH}/schedule`;
export const officeTransactions = () => `/${STAFF_PATH}/transactions`;
export const officeListing = () => `/${STAFF_PATH}/listing`;
