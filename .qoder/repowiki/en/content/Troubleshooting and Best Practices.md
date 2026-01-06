# Troubleshooting and Best Practices

<cite>
**Referenced Files in This Document**   
- [README.md](file://README.md)
- [codewiki/cli/commands/generate.py](file://codewiki/cli/commands/generate.py)
- [codewiki/cli/commands/config.py](file://codewiki/cli/commands/config.py)
- [codewiki/cli/utils/errors.py](file://codewiki/cli/utils/errors.py)
- [codewiki/cli/utils/api_errors.py](file://codewiki/cli/utils/api_errors.py)
- [codewiki/cli/utils/logging.py](file://codewiki/cli/utils/logging.py)
- [codewiki/src/be/llm_services.py](file://codewiki/src/be/llm_services.py)
- [codewiki/src/config.py](file://codewiki/src/config.py)
- [codewiki/cli/config_manager.py](file://codewiki/cli/config_manager.py)
- [codewiki/cli/utils/validation.py](file://codewiki/cli/utils/validation.py)
- [codewiki/cli/utils/repo_validator.py](file://codewiki/cli/utils/repo_validator.py)
- [codewiki/src/be/dependency_analyzer/ast_parser.py](file://codewiki/src/be/dependency_analyzer/ast_parser.py)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Common Issues and Solutions](#common-issues-and-solutions)
   - [Tree-sitter Parser Errors](#tree-sitter-parser-errors)
   - [LLM API Connectivity Issues](#llm-api-connectivity-issues)
   - [Memory Problems with Large Repositories](#memory-problems-with-large-repositories)
   - [Configuration Validation Failures](#configuration-validation-failures)
3. [Debugging Techniques](#debugging-techniques)
4. [Best Practices](#best-practices)
   - [Configuration Management](#configuration-management)
   - [Model Selection](#model-selection)
   - [Rate Limit Handling](#rate-limit-handling)
5. [Performance Optimization](#performance-optimization)
6. [Known Limitations](#known-limitations)
7. [Error Message Interpretation](#error-message-interpretation)
8. [Conclusion](#conclusion)

## Introduction

CodeWiki is an AI-powered documentation generator that transforms codebases into comprehensive, architecture-aware documentation. This guide provides troubleshooting solutions for common issues and outlines best practices for optimal usage. The system supports multiple programming languages and uses LLM-powered analysis to generate holistic documentation with visual artifacts.

**Section sources**
- [README.md](file://README.md)

## Common Issues and Solutions

### Tree-sitter Parser Errors

Tree-sitter parser errors typically occur when analyzing JavaScript, TypeScript, or other supported languages. These errors may manifest as failed file analysis or incomplete dependency graphs.

**Solutions:**
- Ensure tree-sitter language bindings are properly installed
- Verify that the file content being analyzed is valid syntax
- Check that the parser initialization succeeds in the analyzer classes
- Review the error logs for specific parser initialization failures

The system uses tree-sitter parsers for JavaScript and TypeScript analysis, with error handling that logs initialization failures and returns empty results on analysis errors.

**Section sources**
- [codewiki/src/be/dependency_analyzer/analyzers/javascript.py](file://codewiki/src/be/dependency_analyzer/analyzers/javascript.py#L1-L705)
- [codewiki/src/be/dependency_analyzer/analyzers/typescript.py](file://codewiki/src/be/dependency_analyzer/analyzers/typescript.py#L945-L982)

### LLM API Connectivity Issues

LLM API connectivity issues can prevent documentation generation and are typically related to authentication, network connectivity, or rate limiting.

**Common Error Types and Solutions:**

| Error Type | Symptoms | Solutions |
|-----------|---------|----------|
| Authentication Failure | 401 errors, invalid API key messages | Verify API key with `codewiki config show`, update with `codewiki config set --api-key`, check provider dashboard |
| Rate Limit Exceeded | 429 errors, quota exceeded messages | Wait and retry, check API quota, consider upgrading plan, generate during off-peak hours |
| Network/Connection Errors | Timeout, connection refused, network unreachable | Check internet connection, verify base URL, test connectivity with curl, check for proxy/firewall issues |
| Service Unavailable | 5xx errors, service down messages | Check provider status page, retry later, contact provider support |

The API error handler provides specific troubleshooting guidance based on the error type detected in the response.

**Section sources**
- [codewiki/cli/utils/api_errors.py](file://codewiki/cli/utils/api_errors.py#L1-L141)
- [codewiki/src/be/llm_services.py](file://codewiki/src/be/llm_services.py#L1-L86)

### Memory Problems with Large Repositories

Large repositories can cause memory issues during the hierarchical decomposition and analysis phases.

**Solutions:**
- Increase system memory or use a machine with more RAM
- Process repositories in smaller chunks if possible
- Use the `--no-cache` flag to force regeneration and clear previous cached data
- Monitor memory usage during processing and adjust repository size accordingly

The system uses hierarchical decomposition to manage large codebases, breaking them into smaller modules for processing.

**Section sources**
- [README.md](file://README.md)
- [codewiki/src/config.py](file://codewiki/src/config.py#L1-L114)

### Configuration Validation Failures

Configuration validation failures occur when the system cannot validate the LLM API settings or credentials.

**Common Causes and Solutions:**
- **Missing configuration file**: Run `codewiki config set` to configure API credentials
- **Invalid API key**: Verify and update the API key using `codewiki config set --api-key`
- **Invalid base URL**: Validate the URL format and ensure it uses HTTPS (except for localhost)
- **Missing model names**: Specify main, cluster, and fallback models in the configuration

Use `codewiki config validate` to check configuration validity and connectivity.

**Section sources**
- [codewiki/cli/commands/config.py](file://codewiki/cli/commands/config.py#L1-L399)
- [codewiki/cli/utils/validation.py](file://codewiki/cli/utils/validation.py#L1-L251)

## Debugging Techniques

### Using the --verbose Flag

The `--verbose` flag enables detailed progress and debug information during documentation generation.

**Benefits:**
- Shows step-by-step processing progress
- Displays debug messages for each stage
- Provides detailed error information when failures occur
- Helps identify bottlenecks in the generation process

Enable verbose mode by adding the `-v` or `--verbose` flag to any generate command:
```bash
codewiki generate --verbose
```

### Using CODEWIKI_LOG_LEVEL Environment Variable

The `CODEWIKI_LOG_LEVEL` environment variable controls the logging verbosity of the system.

**Available Levels:**
- `DEBUG`: Maximum detail, including internal processing steps
- `INFO`: Standard progress information
- `WARNING`: Only warnings and errors
- `ERROR`: Only error messages

Set the environment variable before running commands:
```bash
export CODEWIKI_LOG_LEVEL=DEBUG
codewiki generate
```

The logging system uses colored output to distinguish between different message types (success, warning, error).

**Section sources**
- [codewiki/cli/utils/logging.py](file://codewiki/cli/utils/logging.py#L1-L86)
- [codewiki/cli/commands/generate.py](file://codewiki/cli/commands/generate.py#L1-L266)

## Best Practices

### Configuration Management

Proper configuration management is critical for successful documentation generation.

**Best Practices:**
- Store API keys securely using the system keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- Use environment variables for web app mode configuration
- Regularly validate configuration with `codewiki config validate`
- Keep configuration files in the default location (`~/.codewiki/config.json`)

The configuration manager handles secure storage of API keys and validation of settings.

**Section sources**
- [codewiki/cli/config_manager.py](file://codewiki/cli/config_manager.py#L1-L232)
- [codewiki/src/config.py](file://codewiki/src/config.py#L1-L114)

### Model Selection

Optimal model selection impacts documentation quality and cost.

**Recommendations:**
- Use top-tier models (Claude Sonnet/Opus, GPT-4) for clustering and main documentation
- Use more cost-effective models as fallback options
- Consider the trade-off between quality and cost for large repositories
- Validate model availability with your provider

The system warns when non-top-tier models are used for clustering, as this may impact documentation quality.

**Section sources**
- [codewiki/cli/commands/config.py](file://codewiki/cli/commands/config.py#L1-L399)
- [codewiki/cli/utils/validation.py](file://codewiki/cli/utils/validation.py#L209-L229)

### Rate Limit Handling

Effective rate limit handling ensures reliable operation with LLM APIs.

**Strategies:**
- Monitor API usage and stay within quota limits
- Implement retry logic with exponential backoff
- Schedule generation during off-peak hours
- Use fallback models when primary models are rate-limited
- Consider upgrading API plans for large-scale usage

The system stops generation on rate limit errors to prevent partial results and provides specific troubleshooting guidance.

**Section sources**
- [codewiki/cli/utils/api_errors.py](file://codewiki/cli/utils/api_errors.py#L1-L141)

## Performance Optimization

### Leveraging Caching

Caching improves performance by avoiding redundant processing.

**Cache Features:**
- Stores intermediate analysis results
- Skips processing for unchanged code sections
- Can be bypassed with the `--no-cache` flag
- Automatically invalidated when source changes

Use `--no-cache` only when you need to force full regeneration.

**Section sources**
- [codewiki/cli/commands/generate.py](file://codewiki/cli/commands/generate.py#L1-L266)

### Parallel Processing

The system supports parallel processing for improved performance.

**Optimization Tips:**
- Process multiple repositories concurrently when possible
- Ensure sufficient system resources (CPU, memory) for parallel operations
- Monitor system load during processing
- Consider the I/O limitations of disk and network

The recursive agentic system enables adaptive processing based on module complexity.

**Section sources**
- [README.md](file://README.md)

## Known Limitations

### Systems Programming Languages (C/C++)

Based on benchmark results, CodeWiki has limitations with systems programming languages:

| Language Category | Performance | Notes |
|------------------|-----------|-------|
| High-Level (Python, JS, TS) | 79.14% | Best performance |
| Managed (C#, Java) | 68.84% | Good performance |
| Systems (C, C++) | 53.24% | Lower performance than DeepWiki |

**Reasons for Lower Performance:**
- Complex memory management patterns
- Low-level pointer arithmetic
- Template metaprogramming complexity
- Header file dependencies
- Macro preprocessing

The system attempts to handle C/C++ code by including functions as leaf nodes when no classes/structures are found, but documentation quality may be suboptimal.

**Section sources**
- [README.md](file://README.md)
- [codewiki/src/be/dependency_analyzer/dependency_graphs_builder.py](file://codewiki/src/be/dependency_analyzer/dependency_graphs_builder.py#L66-L94)

## Error Message Interpretation

### Common Error Patterns

Understanding error messages helps diagnose issues quickly.

**Configuration Errors (Exit Code 2):**
- Missing or invalid credentials
- Incomplete configuration
- Invalid API keys or URLs

**Repository Errors (Exit Code 3):**
- Not a git repository (when using `--create-branch`)
- Uncommitted changes in working directory
- No supported code files found

**API Errors (Exit Code 4):**
- Rate limits exceeded
- Authentication failures
- Network connectivity issues
- Service unavailability

**File System Errors (Exit Code 5):**
- Insufficient permissions
- Disk space limitations
- Output directory not writable

The system provides actionable suggestions with many error messages to help resolve issues.

**Section sources**
- [codewiki/cli/utils/errors.py](file://codewiki/cli/utils/errors.py#L1-L114)
- [codewiki/cli/commands/generate.py](file://codewiki/cli/commands/generate.py#L1-L266)
- [codewiki/cli/commands/config.py](file://codewiki/cli/commands/config.py#L1-L399)

## Conclusion

CodeWiki provides a powerful solution for generating comprehensive documentation for code repositories. By following these troubleshooting guidelines and best practices, users can effectively resolve common issues and optimize their documentation generation process. Pay particular attention to proper configuration management, model selection, and understanding the system's limitations with systems programming languages. The verbose logging and debugging tools provide valuable insights for diagnosing and resolving issues.