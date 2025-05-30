/**
 * Types and interfaces for Maven Repository MCP Server
 */

export interface MavenArtifact {
    groupId: string;
    artifactId: string;
    version: string;
    description?: string;
    url?: string;
    lastUpdated?: string;
    usages?: number;
}

export interface ArtifactVersion {
    version: string;
    releaseDate?: string;
    vulnerabilities?: number;
    url?: string;
}

export interface ArtifactVersions {
    groupId: string;
    artifactId: string;
    versions: ArtifactVersion[];
    totalVersions: number;
}

export interface DependencySnippet {
    maven: string;
    gradle: string;
    sbt?: string;
    ivy?: string;
}

export interface SearchResult {
    artifacts: MavenArtifact[];
    totalResults: number;
    query: string;
}

export interface ServerConfig {
    name: string;
    version: string;
    maxResultsLimit?: number;
    timeout?: number;
}

export type TransportType = "stdio" | "sse";

export interface TransportConfig {
    type: TransportType;
    port?: number; // Only used for SSE transport
}
