import { useEffect, useRef } from "react";
import api from "@services/api";

export default function useCabinetSync(onChange, enabled = true) {
    const cb = useRef(onChange);
    cb.current = onChange;

    useEffect(() => {
        if (!enabled) return undefined;
        let version = null;
        let timer = 0;
        let cancelled = false;

        const tick = async () => {
            try {
                const data = await api.learning.getSync();
                if (cancelled) return;
                const next = data?.version ?? 0;
                if (version !== null && next !== version) {
                    cb.current?.();
                }
                version = next;
            } catch {
                // ignore polling errors
            }
        };

        tick();
        timer = window.setInterval(tick, 4000);
        const onVis = () => {
            if (document.visibilityState === "visible") tick();
        };
        document.addEventListener("visibilitychange", onVis);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, [enabled]);
}
