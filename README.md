# Maven Repository MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that provides comprehensive functionality to search and interact with Maven artifacts from mvnrepository.com and Maven Central.

## 🚀 Features

- **Search Maven Artifacts**: Find Maven artifacts by keyword with detailed results
- **Version Management**: Retrieve all available versions for any artifact
- **Dependency Management**: Get ready-to-use dependency snippets for Maven, Gradle, and SBT
- **POM Access**: Fetch complete POM.xml files directly from Maven Central
- **Multiple Transports**: Support for both stdio and SSE (Server-Sent Events) protocols
- **Rate Limiting**: Built-in intelligent rate limiting to respect mvnrepository.com

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn package manager

## 🛠️ Installation & Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd mvn-repository-mcp-server
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Run the server:**
   ```bash
   npm start
   ```

## 🚀 Usage

### Transport Protocols

The server supports two communication protocols:

#### stdio Transport (Default)
Perfect for local development and MCP client integration:

```bash
# Using npm scripts
npm run start:stdio
npm run dev:stdio

# Direct execution
node dist/index.js stdio
node dist/index.js  # stdio is default
```

#### SSE Transport
Ideal for web-based clients and HTTP integration:

```bash
# Using npm scripts (port 3000)
npm run start:sse
npm run dev:sse

# Direct execution
node dist/index.js sse
node dist/index.js sse --port 8080  # custom port
```

**SSE Endpoints:**
- SSE stream: `http://localhost:<port>/sse`
- Message posting: `http://localhost:<port>/message`

### Available Tools

#### 1. `search_maven_artifacts`
Search for Maven artifacts using keywords.

**Parameters:**
- `query` (string, required): Search term for Maven artifacts
- `maxResults` (number, optional): Maximum results to return (default: 10)

**Example:**
```json
{
  "name": "search_maven_artifacts",
  "arguments": {
    "query": "spring-boot-starter",
    "maxResults": 5
  }
}
```

#### 2. `get_artifact_versions`
Retrieve all available versions for a specific artifact.

**Parameters:**
- `groupId` (string, required): Maven group ID (e.g., 'org.springframework.boot')
- `artifactId` (string, required): Maven artifact ID (e.g., 'spring-boot-starter')

**Example:**
```json
{
  "name": "get_artifact_versions",
  "arguments": {
    "groupId": "junit",
    "artifactId": "junit"
  }
}
```

#### 3. `get_pom_xml`
Fetch the complete POM.xml file for a specific artifact version.

**Parameters:**
- `groupId` (string, required): Maven group ID
- `artifactId` (string, required): Maven artifact ID  
- `version` (string, required): Specific version

**Example:**
```json
{
  "name": "get_pom_xml",
  "arguments": {
    "groupId": "org.apache.commons",
    "artifactId": "commons-lang3",
    "version": "3.12.0"
  }
}
```

#### 4. `get_dependency_snippets`
Generate dependency declarations for Maven, Gradle, and SBT.

**Parameters:**
- `groupId` (string, required): Maven group ID
- `artifactId` (string, required): Maven artifact ID
- `version` (string, required): Specific version

**Example:**
```json
{
  "name": "get_dependency_snippets",
  "arguments": {
    "groupId": "com.fasterxml.jackson.core",
    "artifactId": "jackson-core",
    "version": "2.15.2"
  }
}
```

## 🔧 Development

### Available Scripts

- **`npm run build`** - Compile TypeScript to JavaScript
- **`npm run build:watch`** - Watch mode compilation
- **`npm run start`** - Run compiled server (stdio transport)
- **`npm run start:stdio`** - Explicitly use stdio transport
- **`npm run start:sse`** - Use SSE transport (port 3000)
- **`npm run dev:stdio`** - Build and run with stdio
- **`npm run dev:sse`** - Build and run with SSE
- **`npm run clean`** - Remove compiled files

### Project Structure

```
mvn-repository-mcp-server/
├── src/
│   ├── index.ts      # Main server entry point & CLI
│   ├── types.ts      # TypeScript interfaces
│   └── searcher.ts   # Core search & retrieval logic
├── dist/             # Compiled JavaScript output
├── package.json      # Project configuration
├── tsconfig.json     # TypeScript configuration
└── README.md         # This file
```

## 🎯 Use Cases

### For AI Assistants
- **Dependency Discovery**: Help users find appropriate Maven dependencies
- **Version Management**: Assist with dependency version selection and updates
- **Build File Generation**: Generate dependency blocks for different build tools
- **Security Analysis**: Identify artifacts with known vulnerabilities

### For Developers
- **Quick Search**: Rapidly find Maven artifacts without opening a browser
- **Dependency Analysis**: Examine POM files and dependency structures
- **Multi-Build Support**: Get snippets for Maven, Gradle, and SBT simultaneously
- **Version Comparison**: Compare different versions of the same artifact

### Integration Examples

**With AI Coding Assistants:**
```
User: "Find me the latest Spring Boot starter for web development"
Assistant: Uses search_maven_artifacts → "spring-boot-starter-web"
Assistant: Uses get_dependency_snippets → Provides Maven/Gradle configs
```

**For Dependency Updates:**
```
User: "Check if there are newer versions of JUnit available"
Assistant: Uses get_artifact_versions → Lists all JUnit versions with dates
Assistant: Highlights latest stable version and any security considerations
```

## ⚙️ Configuration

### Rate Limiting
The server includes intelligent rate limiting to respect mvnrepository.com:
- Minimum 3 seconds between requests
- Additional random delay of 2-6 seconds
- Automatic retry with exponential backoff on 403 errors

### Timeout Settings
- Default request timeout: 30 seconds
- Maven Central POM requests: 15 seconds
- Maximum of 3 retry attempts for failed requests

## 🔍 Troubleshooting

### Common Issues

**403 Access Denied Errors:**
- The server implements rate limiting to prevent this
- If encountered, the server will automatically retry with backoff
- Consider reducing request frequency if issues persist

**Network Timeouts:**
- Check internet connectivity
- Verify mvnrepository.com accessibility
- Consider firewall or proxy settings

**SSE Connection Issues:**
- Ensure the specified port is available
- Check firewall settings for the chosen port
- Verify no other services are using the same port

### Debug Mode
Set environment variable for verbose logging:
```bash
DEBUG=mvn-repository-mcp-server npm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related Links

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Maven Repository](https://mvnrepository.com)
- [Maven Central](https://search.maven.org)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
