declare module 'next-pwa' {
    import { NextConfig } from 'next';

    interface RuntimeCachingEntry {
        urlPattern: RegExp | string;
        handler: 'CacheFirst' | 'CacheOnly' | 'NetworkFirst' | 'NetworkOnly' | 'StaleWhileRevalidate';
        options?: {
            cacheName?: string;
            expiration?: {
                maxEntries?: number;
                maxAgeSeconds?: number;
            };
            networkTimeoutSeconds?: number;
            backgroundSync?: {
                name: string;
                options?: {
                    maxRetentionTime?: number;
                };
            };
        };
    }

    interface PWAConfig {
        dest?: string;
        disable?: boolean;
        register?: boolean;
        skipWaiting?: boolean;
        scope?: string;
        sw?: string;
        runtimeCaching?: RuntimeCachingEntry[];
        publicExcludes?: string[];
        buildExcludes?: (string | RegExp)[];
        fallbacks?: {
            document?: string;
            image?: string;
            audio?: string;
            video?: string;
            font?: string;
        };
        cacheOnFrontEndNav?: boolean;
        reloadOnOnline?: boolean;
        customWorkerDir?: string;
        customWorkerSrc?: string;
        customWorkerDest?: string;
        dynamicStartUrl?: boolean;
        dynamicStartUrlRedirect?: string;
    }

    function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;

    export default withPWA;
}
