import { TenantId } from '@ahteam/core-domain';
import { TenantContextData } from '../context/TenantContext';

/**
 * Resolution Strategy
 */
export type ResolutionStrategy = 'subdomain' | 'header' | 'path' | 'query';

/**
 * TenantResolver
 * 
 * Resolves tenant from incoming requests.
 * Supports multiple resolution strategies.
 */
export class TenantResolver {
    private strategy: ResolutionStrategy;
    private headerName: string;
    private queryParam: string;

    constructor(options: {
        strategy?: ResolutionStrategy;
        headerName?: string;
        queryParam?: string;
    } = {}) {
        this.strategy = options.strategy ?? 'subdomain';
        this.headerName = options.headerName ?? 'X-Tenant-ID';
        this.queryParam = options.queryParam ?? 'tenant';
    }

    /**
     * Resolve tenant from request headers
     */
    public resolveFromHeaders(headers: Record<string, string | undefined>): string | null {
        return headers[this.headerName.toLowerCase()] ?? null;
    }

    /**
     * Resolve tenant from subdomain
     * Example: tenant1.example.com -> tenant1
     */
    public resolveFromSubdomain(host: string): string | null {
        const parts = host.split('.');
        if (parts.length >= 3) {
            const subdomain = parts[0];
            // Ignore common subdomains
            if (subdomain && !['www', 'api', 'admin', 'app'].includes(subdomain)) {
                return subdomain;
            }
        }
        return null;
    }

    /**
     * Resolve tenant from URL path
     * Example: /tenant/tenant1/products -> tenant1
     */
    public resolveFromPath(path: string): string | null {
        const match = path.match(/^\/tenant\/([^/]+)/);
        return match?.[1] ?? null;
    }

    /**
     * Resolve tenant from query parameter
     * Example: ?tenant=tenant1
     */
    public resolveFromQuery(query: Record<string, string | undefined>): string | null {
        return query[this.queryParam] ?? null;
    }

    /**
     * Resolve tenant using configured strategy
     */
    public resolve(request: {
        headers: Record<string, string | undefined>;
        host: string;
        path: string;
        query: Record<string, string | undefined>;
    }): string | null {
        switch (this.strategy) {
            case 'subdomain':
                return this.resolveFromSubdomain(request.host);
            case 'header':
                return this.resolveFromHeaders(request.headers);
            case 'path':
                return this.resolveFromPath(request.path);
            case 'query':
                return this.resolveFromQuery(request.query);
            default:
                return null;
        }
    }

    /**
     * Build tenant context from tenant slug
     * In production, this would fetch from database
     */
    public async buildContext(tenantSlug: string): Promise<TenantContextData | null> {
        // TODO: Fetch from database in production
        // This is a placeholder implementation
        return {
            tenantId: TenantId.create(tenantSlug),
            tenantSlug,
            plan: 'free',
        };
    }
}
