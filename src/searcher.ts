/**
 * Maven Repository search utilities
 */

import { MavenArtifact, SearchResult, ArtifactVersions, ArtifactVersion, DependencySnippet } from './types.js';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';

export class MavenRepositorySearcher {
    private readonly baseUrl = 'https://mvnrepository.com';
    private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0';
    private readonly axiosInstance: AxiosInstance;
    private lastRequestTime: number = 0;

    constructor() {
        this.axiosInstance = axios.create({
            timeout: 30000,
            maxRedirects: 5,
            withCredentials: true,
            headers: {
                'User-Agent': this.userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'DNT': '1',
                'Sec-GPC': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Priority': 'u=0, i',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache',
            }
        });
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async intelligentDelay(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minDelay = 3000; // Minimum 3 seconds between requests
        const randomDelay = Math.random() * 4000 + 2000; // 2-6 seconds additional random delay
        
        if (timeSinceLastRequest < minDelay) {
            await this.delay(minDelay - timeSinceLastRequest + randomDelay);
        } else {
            await this.delay(randomDelay);
        }
        
        this.lastRequestTime = Date.now();
    }

    private async makeRequest(url: string, retryCount: number = 0): Promise<string> {
        const maxRetries = 3;
        
        try {
            await this.intelligentDelay();

            // Add referer for non-search requests
            const headers: Record<string, string> = {};
            if (!url.includes('/search')) {
                headers['Referer'] = this.baseUrl;
            }

            const response = await this.axiosInstance.get(url, { headers });
            return response.data;
            
        } catch (error: any) {
            if (error.response?.status === 403 && retryCount < maxRetries) {
                console.log(`Got 403, retrying in ${(retryCount + 1) * 5} seconds... (attempt ${retryCount + 1}/${maxRetries})`);
                
                // Exponential backoff with jitter
                const backoffTime = (retryCount + 1) * 5000 + Math.random() * 3000;
                await this.delay(backoffTime);
                
                return this.makeRequest(url, retryCount + 1);
            }
            
            if (error.response?.status === 403) {
                throw new Error(`Access denied after ${maxRetries} retries. The site may have temporarily blocked this IP address.`);
            }
            
            throw error;
        }
    }

    async searchArtifacts(query: string, maxResults: number = 10): Promise<SearchResult> {
        const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
        console.log(`Searching: ${searchUrl}`);

        const responseData = await this.makeRequest(searchUrl);
        const $ = cheerio.load(responseData);
        const artifacts: MavenArtifact[] = [];

        $('.im').each((index, element) => {
            if (artifacts.length >= maxResults) return false;

            const $element = $(element);
            const $link = $element.find('.im-title a');
            const $subtitle = $element.find('.im-subtitle');
            const $usages = $element.find('.im-usage');

            if ($link.length > 0) {
                const href = $link.attr('href');
                const title = $link.text().trim();
                const subtitle = $subtitle.text().trim();
                const usagesText = $usages.text().trim();

                if (href && title) {
                    // Parse group:artifact from the URL pattern /artifact/group/artifact
                    const urlParts = href.split('/');
                    if (urlParts.length >= 4 && urlParts[1] === 'artifact') {
                        const groupId = urlParts[2];
                        const artifactId = urlParts[3];

                        // Extract version from title if present
                        const versionMatch = title.match(/(\d+(?:\.\d+)*(?:[.-][A-Za-z0-9]+)*)/);
                        const version = versionMatch ? versionMatch[1] : 'latest';

                        // Parse usages count
                        let usages = 0;
                        if (usagesText) {
                            const usagesMatch = usagesText.match(/(\d{1,3}(?:,\d{3})*)/);
                            if (usagesMatch) {
                                usages = parseInt(usagesMatch[1].replace(/,/g, ''));
                            }
                        }

                        artifacts.push({
                            groupId,
                            artifactId,
                            version,
                            description: subtitle || undefined,
                            url: `${this.baseUrl}${href}`,
                            usages
                        });
                    }
                }
            }
        });

        return {
            artifacts,
            totalResults: artifacts.length,
            query
        };
    }

    async getArtifactVersions(groupId: string, artifactId: string): Promise<ArtifactVersions> {
        const artifactUrl = `${this.baseUrl}/artifact/${groupId}/${artifactId}`;
        console.log(`Fetching versions for: ${artifactUrl}`);

        const responseData = await this.makeRequest(artifactUrl);
        const $ = cheerio.load(responseData);
        const versions: ArtifactVersion[] = [];

        // Look for version table
        $('.grid.versions tbody tr').each((index, element) => {
            const $element = $(element);
            const $versionLink = $element.find('td:first-child a');
            const $dateCell = $element.find('td:nth-child(2)');
            const $vulnCell = $element.find('td:nth-child(3)');

            if ($versionLink.length > 0) {
                const version = $versionLink.text().trim();
                const href = $versionLink.attr('href');
                const releaseDate = $dateCell.text().trim() || undefined;

                // Parse vulnerability count
                let vulnerabilities = 0;
                const vulnText = $vulnCell.text().trim();
                if (vulnText && vulnText !== '-') {
                    const vulnMatch = vulnText.match(/(\d+)/);
                    if (vulnMatch) {
                        vulnerabilities = parseInt(vulnMatch[1]);
                    }
                }

                versions.push({
                    version,
                    releaseDate,
                    vulnerabilities: vulnerabilities > 0 ? vulnerabilities : undefined,
                    url: href ? `${this.baseUrl}${href}` : undefined
                });
            }
        });

        return {
            groupId,
            artifactId,
            versions,
            totalVersions: versions.length
        };
    }

    async getPomXml(groupId: string, artifactId: string, version: string): Promise<string> {
        const pomUrl = `https://repo1.maven.org/maven2/${groupId.replace(/\./g, '/')}/${artifactId}/${version}/${artifactId}-${version}.pom`;
        console.log(`Fetching POM: ${pomUrl}`);

        // For Maven Central, we can use a simpler request since it doesn't have Cloudflare protection
        const response = await axios.get(pomUrl, {
            headers: { 'User-Agent': this.userAgent },
            timeout: 15000,
        });

        return response.data;
    }

    async getDependencySnippets(groupId: string, artifactId: string, version: string): Promise<DependencySnippet> {
        const artifactUrl = `${this.baseUrl}/artifact/${groupId}/${artifactId}/${version}`;
        console.log(`Fetching dependency snippets: ${artifactUrl}`);

        const responseData = await this.makeRequest(artifactUrl);
        const $ = cheerio.load(responseData);

        // Extract Maven snippet
        let maven = '';
        const mavenTextarea = $('#maven-a textarea, .maven textarea, textarea[id*="maven"]');
        if (mavenTextarea.length > 0) {
            maven = mavenTextarea.text().trim();
        }

        // Extract Gradle snippet
        let gradle = '';
        const gradleTextarea = $('#gradle-a textarea, .gradle textarea, textarea[id*="gradle"]');
        if (gradleTextarea.length > 0) {
            gradle = gradleTextarea.text().trim();
        }

        // Extract SBT snippet if available
        let sbt = '';
        const sbtTextarea = $('#sbt-a textarea, .sbt textarea, textarea[id*="sbt"]');
        if (sbtTextarea.length > 0) {
            sbt = sbtTextarea.text().trim();
        }

        // If we couldn't extract from the page, fall back to manual construction
        if (!maven) {
            maven = `<dependency>
    <groupId>${groupId}</groupId>
    <artifactId>${artifactId}</artifactId>
    <version>${version}</version>
</dependency>`;
        }

        if (!gradle) {
            gradle = `implementation '${groupId}:${artifactId}:${version}'`;
        }

        if (!sbt) {
            sbt = `libraryDependencies += "${groupId}" % "${artifactId}" % "${version}"`;
        }

        return {
            maven,
            gradle,
            sbt
        };
    }

    async getArtifactDetails(groupId: string, artifactId: string): Promise<MavenArtifact | null> {
        const versions = await this.getArtifactVersions(groupId, artifactId);
        if (versions.versions.length > 0) {
            const latestVersion = versions.versions[0]; // Assuming first is latest
            return {
                groupId,
                artifactId,
                version: latestVersion.version,
                url: latestVersion.url,
                lastUpdated: latestVersion.releaseDate
            };
        }
        return null;
    }
}
