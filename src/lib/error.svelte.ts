export interface FatalError {
    message: string;
    stack?: string;
    context?: Record<string, any>;
    timestamp: number;
}

class ErrorService {
    error = $state<FatalError | null>(null);

    report(message: string, stack?: string, context?: Record<string, any>) {
        if (this.error) return; // Only capture first fatal error
        this.error = {
            message,
            stack,
            context: {
                url: typeof window !== 'undefined' ? window.location.href : 'N/A',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
                base: import.meta.env.BASE_URL,
                ...context
            },
            timestamp: Date.now()
        };
        console.error('[FatalError]', this.error);
    }

    clear() {
        this.error = null;
    }
}

export const errorService = new ErrorService();

// Global listeners
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        errorService.report(event.message, event.error?.stack);
    });

    window.addEventListener('unhandledrejection', (event) => {
        errorService.report(
            `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
            event.reason?.stack
        );
    });
}
