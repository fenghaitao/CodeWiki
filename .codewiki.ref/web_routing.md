# Web Routing Module Documentation

## Overview

The web_routing module is a critical component of the CodeWiki web application that handles all HTTP routes and request processing. It provides the interface between users and the documentation generation system, managing repository submissions, job status tracking, and documentation viewing. The module integrates with background processing, caching, and template rendering systems to deliver a seamless user experience.

## Architecture

The web_routing module consists of three main components that work together to handle web requests:

```mermaid
graph TB
    subgraph "Web Routing Module"
        WR[WebRoutes]
        TTL[StringTemplateLoader]
        WAC[WebAppConfig]
    end
    
    subgraph "External Dependencies"
        BW[BackgroundWorker]
        CM[CacheManager]
        GRP[GitHubRepoProcessor]
        FM[FileManager]
    end
    
    WR --> BW
    WR --> CM
    WR --> GRP
    WR --> FM
    TTL --> WR
    WAC --> WR
```

## Core Components

### WebRoutes

The `WebRoutes` class is the primary handler for all web routes in the application. It manages:

- Main page rendering with repository submission form
- Repository submission processing
- Job status tracking and API endpoints
- Documentation viewing and serving
- Job cleanup operations

#### Key Methods

- `index_get()`: Renders the main page with recent jobs and submission form
- `index_post()`: Processes repository submissions and adds jobs to the queue
- `get_job_status()`: API endpoint for checking job status
- `view_docs()`: Redirects to generated documentation
- `serve_generated_docs()`: Serves individual documentation files
- `cleanup_old_jobs()`: Removes expired job entries

### StringTemplateLoader

The `StringTemplateLoader` is a custom Jinja2 template loader that enables rendering of string-based templates. It provides:

- Template rendering utilities using Jinja2
- Navigation rendering from module tree structures
- Job list rendering for display

### WebAppConfig

The `WebAppConfig` class manages all configuration settings for the web application, including:

- Directory paths for cache, temp, and output
- Queue and cache settings
- Job cleanup parameters
- Server configuration
- Git operation settings

## Component Interactions

The web_routing module interacts with several other modules in the system:

```mermaid
graph LR
    subgraph "Web Routing Module"
        WR[WebRoutes]
    end
    
    subgraph "Frontend Components"
        BW[BackgroundWorker]
        CM[CacheManager]
        GRP[GitHubRepoProcessor]
    end
    
    subgraph "Backend Components"
        DG[DocumentationGenerator]
        DA[DependencyAnalyzer]
    end
    
    subgraph "Core Components"
        FM[FileManager]
        CFG[Config]
    end
    
    WR --> BW
    WR --> CM
    WR --> GRP
    BW --> DG
    BW --> DA
    WR --> FM
    WR --> CFG
```

## Data Flow

The web_routing module follows this data flow pattern:

```mermaid
sequenceDiagram
    participant User
    participant WR as WebRoutes
    participant BW as BackgroundWorker
    participant CM as CacheManager
    participant GRP as GitHubRepoProcessor
    
    User->>WR: Submit repository URL
    WR->>GRP: Validate GitHub URL
    GRP-->>WR: Return validation result
    WR->>CM: Check for cached documentation
    CM-->>WR: Return cached docs or None
    WR->>BW: Add job to queue
    BW-->>WR: Return job status
    WR-->>User: Show job status
```

## Process Flow

### Repository Submission Process

```mermaid
flowchart TD
    A[User submits repo URL] --> B{Validate URL format}
    B -->|Invalid| C[Show error message]
    B -->|Valid| D{Check for existing job}
    D -->|Job exists| E[Show existing job status]
    D -->|No existing job| F{Check cache for docs}
    F -->|Docs in cache| G[Create completed job, redirect to docs]
    F -->|No cached docs| H[Add job to processing queue]
    H --> I[Return success message]
    C --> J[Render page with error]
    E --> J
    G --> K[Redirect to docs]
    I --> J
    K --> L[View documentation]
    J --> M{Wait for processing}
    M -->|Docs ready| L
```

### Documentation Serving Process

```mermaid
flowchart TD
    A[User requests docs] --> B{Job exists in system?}
    B -->|Yes| C{Job completed?}
    B -->|No| D{Check cache by job ID?}
    C -->|Yes| E[Load docs from job path]
    D -->|Yes| F[Load docs from cache]
    D -->|No| G[Return 404 error]
    F --> H[Recreate job status]
    E --> I[Load module tree and metadata]
    H --> I
    I --> J[Render documentation page]
    G --> J
    J --> K[Return HTML response]
```

## Configuration Settings

The web_routing module uses the following configuration parameters:

| Setting | Default Value | Purpose |
|---------|---------------|---------|
| CACHE_DIR | "./output/cache" | Directory for cached documentation |
| TEMP_DIR | "./output/temp" | Temporary file storage |
| OUTPUT_DIR | "./output" | Main output directory |
| QUEUE_SIZE | 100 | Maximum number of queued jobs |
| CACHE_EXPIRY_DAYS | 365 | Days before cache expires |
| JOB_CLEANUP_HOURS | 24000 | Hours before old jobs are cleaned up |
| RETRY_COOLDOWN_MINUTES | 3 | Minutes before retrying failed jobs |
| DEFAULT_HOST | "127.0.0.1" | Default server host |
| DEFAULT_PORT | 8000 | Default server port |

## Error Handling

The web_routing module implements comprehensive error handling:

- **URL Validation**: Checks for valid GitHub repository URLs
- **Job Status**: Prevents duplicate submissions and handles retry cooldowns
- **File Access**: Validates documentation file existence before serving
- **Template Rendering**: Handles template errors gracefully
- **HTTP Exceptions**: Returns appropriate status codes for various error conditions

## Integration Points

The web_routing module integrates with:

- [job_management](job_management.md) for job status tracking
- [caching_system](caching_system.md) for documentation caching
- [repository_processing](repository_processing.md) for GitHub repository handling
- [core_utils](core_utils.md) for file operations
- [documentation_generator](documentation_generator.md) for documentation generation

## Dependencies

The web_routing module depends on several external libraries:

- FastAPI for web framework functionality
- Jinja2 for template rendering
- Pathlib for file path operations
- Dataclasses for data structure management

## Performance Considerations

- **Caching**: Implements caching to avoid redundant documentation generation
- **Job Cleanup**: Automatically removes old job entries to prevent memory bloat
- **URL Normalization**: Standardizes repository URLs for consistent comparison
- **Queue Management**: Limits queue size to prevent system overload

## Security Considerations

- **Input Validation**: Validates GitHub URLs to prevent malicious input
- **Path Validation**: Ensures requested files exist before serving
- **Rate Limiting**: Implements retry cooldowns to prevent abuse
- **Directory Traversal Protection**: Uses Path operations to prevent access to unauthorized files

## Testing Considerations

When testing the web_routing module, consider:

- URL validation edge cases
- Job status race conditions
- Cache invalidation scenarios
- Error response handling
- Template rendering with various data inputs