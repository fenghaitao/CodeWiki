# CLI Command Reference

<cite>
**Referenced Files in This Document**
- [main.py](file://codewiki/cli/main.py)
- [generate.py](file://codewiki/cli/commands/generate.py)
- [config.py](file://codewiki/cli/commands/config.py)
- [progress.py](file://codewiki/cli/utils/progress.py)
- [errors.py](file://codewiki/cli/utils/errors.py)
- [logging.py](file://codewiki/cli/utils/logging.py)
- [job.py](file://codewiki/cli/models/job.py)
- [doc_generator.py](file://codewiki/cli/adapters/doc_generator.py)
- [html_generator.py](file://codewiki/cli/html_generator.py)
- [git_manager.py](file://codewiki/cli/git_manager.py)
- [repo_validator.py](file://codewiki/cli/utils/repo_validator.py)
- [README.md](file://README.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document provides a comprehensive CLI command reference for the Click-based command-line interface of CodeWiki. It covers all available commands, including codewiki generate and codewiki config, along with their subcommands and options. It explains syntax, parameters, options, return values, and exit codes. It also details the progress tracking system, success/failure indicators, error handling, and how the CLI integrates with underlying Python modules. Practical examples are drawn from the repository’s README.

## Project Structure
The CLI is organized around Click groups and commands. The main entry registers the CLI group, version command, and subcommands. The generate command orchestrates configuration loading, repository validation, optional git branch creation, documentation generation, and post-generation instructions. The config group manages API credentials and settings.

```mermaid
graph TB
A["codewiki/cli/main.py<br/>Registers CLI group and subcommands"] --> B["codewiki/cli/commands/generate.py<br/>Generate command"]
A --> C["codewiki/cli/commands/config.py<br/>Config group and subcommands"]
B --> D["codewiki/cli/adapters/doc_generator.py<br/>CLIDocumentationGenerator"]
D --> E["codewiki/src/be/documentation_generator.py<br/>Backend generator"]
B --> F["codewiki/cli/utils/repo_validator.py<br/>Repository validation"]
B --> G["codewiki/cli/git_manager.py<br/>Git operations"]
B --> H["codewiki/cli/utils/progress.py<br/>ProgressTracker"]
B --> I["codewiki/cli/utils/logging.py<br/>CLILogger"]
B --> J["codewiki/cli/models/job.py<br/>DocumentationJob"]
B --> K["codewiki/cli/html_generator.py<br/>HTMLGenerator"]
C --> L["codewiki/cli/utils/validation.py<br/>Validation helpers"]
C --> M["codewiki/cli/utils/errors.py<br/>Error handling"]
```

**Diagram sources**
- [main.py](file://codewiki/cli/main.py#L1-L57)
- [generate.py](file://codewiki/cli/commands/generate.py#L1-L266)
- [config.py](file://codewiki/cli/commands/config.py#L1-L399)
- [doc_generator.py](file://codewiki/cli/adapters/doc_generator.py#L1-L289)
- [repo_validator.py](file://codewiki/cli/utils/repo_validator.py#L1-L188)
- [git_manager.py](file://codewiki/cli/git_manager.py#L1-L228)
- [progress.py](file://codewiki/cli/utils/progress.py#L1-L223)
- [logging.py](file://codewiki/cli/utils/logging.py#L1-L86)
- [job.py](file://codewiki/cli/models/job.py#L1-L157)
- [html_generator.py](file://codewiki/cli/html_generator.py#L1-L285)
- [errors.py](file://codewiki/cli/utils/errors.py#L1-L114)

**Section sources**
- [main.py](file://codewiki/cli/main.py#L1-L57)

## Core Components
- CLI entrypoint and version command: Registers the CLI group and version output.
- Generate command: Validates configuration, repository, optional git branch creation, runs documentation generation, and prints post-generation instructions.
- Config group: Provides subcommands to set, show, and validate configuration.
- Utilities: Progress tracking, logging, error handling, repository validation, git operations, and HTML generation.

**Section sources**
- [main.py](file://codewiki/cli/main.py#L1-L57)
- [generate.py](file://codewiki/cli/commands/generate.py#L1-L266)
- [config.py](file://codewiki/cli/commands/config.py#L1-L399)

## Architecture Overview
The CLI command flow integrates Click decorators with internal utilities and the backend documentation generator. The generate command constructs a CLIDocumentationGenerator, which coordinates backend generation, progress tracking, and optional HTML generation. Post-generation, it displays instructions and statistics.

```mermaid
sequenceDiagram
participant U as "User"
participant CLI as "Click CLI"
participant Gen as "generate_command"
participant CM as "ConfigManager"
participant RV as "repo_validator"
participant GM as "GitManager"
participant CDG as "CLIDocumentationGenerator"
participant BE as "Backend Generator"
participant HG as "HTMLGenerator"
participant LG as "Post-Gen Instructions"
U->>CLI : codewiki generate [options]
CLI->>Gen : invoke generate_command(ctx, options)
Gen->>CM : load() and validate configuration
Gen->>RV : validate_repository() and check_writable_output()
alt create_branch enabled
Gen->>GM : check_clean_working_directory()
Gen->>GM : create_documentation_branch()
end
Gen->>CDG : construct with repo_path, output_dir, config, flags
CDG->>BE : run backend generation (async)
opt github_pages enabled
CDG->>HG : generate index.html
end
CDG-->>Gen : DocumentationJob
Gen->>LG : display_post_generation_instructions()
LG-->>U : print success/failure, stats, next steps
```

**Diagram sources**
- [generate.py](file://codewiki/cli/commands/generate.py#L1-L266)
- [doc_generator.py](file://codewiki/cli/adapters/doc_generator.py#L1-L289)
- [repo_validator.py](file://codewiki/cli/utils/repo_validator.py#L1-L188)
- [git_manager.py](file://codewiki/cli/git_manager.py#L1-L228)
- [html_generator.py](file://codewiki/cli/html_generator.py#L1-L285)

## Detailed Component Analysis

### CLI Entry and Version Command
- Registers the CLI group and version option.
- Exposes a version command for printing version information.
- Imports and registers subcommands for config and generate.

**Section sources**
- [main.py](file://codewiki/cli/main.py#L1-L57)

### Generate Command
- Purpose: Generate comprehensive documentation for a code repository.
- Syntax: codewiki generate [options]
- Options:
  - --output, -o: Output directory for generated documentation (default: docs)
  - --create-branch: Create a new git branch for documentation changes
  - --github-pages: Generate index.html for GitHub Pages deployment
  - --no-cache: Force full regeneration, ignoring cache
  - --verbose, -v: Show detailed progress and debug information
- Behavior:
  - Loads and validates configuration; exits with configuration error if missing or incomplete.
  - Validates repository and output directory writability.
  - Optionally creates a documentation branch if git repository is clean.
  - Constructs GenerationOptions and CLIDocumentationGenerator with LLM config and flags.
  - Runs backend generation asynchronously and optionally generates HTML.
  - Prints post-generation instructions with statistics and next steps.
- Return values and exit codes:
  - Success: 0
  - Configuration error: 2
  - Repository error: 3
  - API error: 4
  - File system error: 5
  - General error: 1
  - Keyboard interrupt: 130
- Practical examples from README:
  - Basic generation: codewiki generate
  - Custom output directory: codewiki generate --output ./documentation
  - Create git branch for documentation: codewiki generate --create-branch
  - Generate HTML viewer for GitHub Pages: codewiki generate --github-pages
  - Enable verbose logging: codewiki generate --verbose
  - Full-featured generation: codewiki generate --create-branch --github-pages --verbose

```mermaid
flowchart TD
Start(["Invoke generate_command"]) --> LoadCfg["Load and validate configuration"]
LoadCfg --> CfgOK{"Configuration valid?"}
CfgOK --> |No| ExitCfgErr["Exit with code 2"]
CfgOK --> |Yes| ValidateRepo["Validate repository and output directory"]
ValidateRepo --> RepoOK{"Repository valid?"}
RepoOK --> |No| ExitRepoErr["Exit with code 3"]
RepoOK --> |Yes| CheckGit{"--create-branch?"}
CheckGit --> |Yes| GitClean{"Working directory clean?"}
GitClean --> |No| ExitRepoErr2["Exit with code 3"]
GitClean --> |Yes| CreateBranch["Create documentation branch"]
CheckGit --> |No| GenDocs["Run documentation generation"]
CreateBranch --> GenDocs
GenDocs --> GenOK{"Generation succeeded?"}
GenOK --> |No| ExitAPIErr["Exit with code 4"]
GenOK --> |Yes| GHPages{"--github-pages?"}
GHPages --> |Yes| MakeHTML["Generate index.html"]
GHPages --> |No| PostInstr["Display post-generation instructions"]
MakeHTML --> PostInstr
PostInstr --> End(["Exit with code 0"])
```

**Diagram sources**
- [generate.py](file://codewiki/cli/commands/generate.py#L1-L266)
- [errors.py](file://codewiki/cli/utils/errors.py#L1-L114)
- [repo_validator.py](file://codewiki/cli/utils/repo_validator.py#L1-L188)
- [git_manager.py](file://codewiki/cli/git_manager.py#L1-L228)
- [doc_generator.py](file://codewiki/cli/adapters/doc_generator.py#L1-L289)
- [html_generator.py](file://codewiki/cli/html_generator.py#L1-L285)

**Section sources**
- [generate.py](file://codewiki/cli/commands/generate.py#L1-L266)
- [README.md](file://README.md#L115-L136)

### Config Group and Subcommands
- Purpose: Manage CodeWiki configuration (API credentials and settings).
- Subcommands:
  - codewiki config set
    - Options:
      - --api-key: LLM API key (stored securely in system keychain)
      - --base-url: LLM API base URL
      - --main-model: Primary model for documentation generation
      - --cluster-model: Model for module clustering (recommend top-tier)
      - --fallback-model: Fallback model for documentation generation
    - Behavior: Validates inputs, saves configuration, warns if cluster model is not top-tier.
    - Exit codes: 0 on success, 2 on configuration error.
  - codewiki config show
    - Options:
      - --json: Output in JSON format
    - Behavior: Displays current configuration with masked API key and storage location.
  - codewiki config validate
    - Options:
      - --quick: Skip API connectivity test
      - --verbose, -v: Show detailed validation steps
    - Behavior: Checks configuration file existence/format, API key presence, base URL validity, model configuration, and optionally tests API connectivity.

```mermaid
classDiagram
class ConfigSet {
+invoke(api_key, base_url, main_model, cluster_model, fallback_model)
+validate_inputs()
+save_config()
+warn_if_not_top_tier()
}
class ConfigShow {
+invoke(output_json)
+load_and_display()
}
class ConfigValidate {
+invoke(quick, verbose)
+check_file()
+check_api_key()
+check_base_url()
+check_models()
+test_connectivity()
}
class ConfigGroup {
+register subcommands
}
ConfigGroup --> ConfigSet : "subcommand"
ConfigGroup --> ConfigShow : "subcommand"
ConfigGroup --> ConfigValidate : "subcommand"
```

**Diagram sources**
- [config.py](file://codewiki/cli/commands/config.py#L1-L399)

**Section sources**
- [config.py](file://codewiki/cli/commands/config.py#L1-L399)

### Progress Tracking System
- ProgressTracker: Tracks overall progress across five stages with weighted estimates and ETA calculation.
- ModuleProgressBar: Provides a progress bar for module-by-module generation with verbose and non-verbose modes.
- CLIDocumentationGenerator integrates ProgressTracker to report stage transitions and completion messages.
- CLILogger provides step-level logging with colored output and optional verbose debug messages.

```mermaid
classDiagram
class ProgressTracker {
+start_stage(stage, description)
+update_stage(progress, message)
+complete_stage(message)
+get_overall_progress() float
+get_eta() str
}
class ModuleProgressBar {
+update(module_name, cached)
+finish()
}
class CLIDocumentationGenerator {
+generate() DocumentationJob
-_run_backend_generation()
-_run_html_generation()
-_finalize_job()
}
class CLILogger {
+debug(message)
+info(message)
+success(message)
+warning(message)
+error(message)
+step(message, step, total)
+elapsed_time() str
}
CLIDocumentationGenerator --> ProgressTracker : "uses"
CLIDocumentationGenerator --> ModuleProgressBar : "uses"
generate_command ..> CLILogger : "uses"
```

**Diagram sources**
- [progress.py](file://codewiki/cli/utils/progress.py#L1-L223)
- [logging.py](file://codewiki/cli/utils/logging.py#L1-L86)
- [doc_generator.py](file://codewiki/cli/adapters/doc_generator.py#L1-L289)
- [generate.py](file://codewiki/cli/commands/generate.py#L1-L266)

**Section sources**
- [progress.py](file://codewiki/cli/utils/progress.py#L1-L223)
- [logging.py](file://codewiki/cli/utils/logging.py#L1-L86)
- [doc_generator.py](file://codewiki/cli/adapters/doc_generator.py#L1-L289)
- [generate.py](file://codewiki/cli/commands/generate.py#L1-L266)

### Relationship Between CLI Commands and Python Modules
- generate_command depends on:
  - ConfigManager for configuration loading and validation
  - repo_validator for repository and output directory checks
  - GitManager for branch creation and status checks
  - CLIDocumentationGenerator for backend orchestration
  - HTMLGenerator for GitHub Pages index.html generation
  - Job models and statistics for reporting
- config commands depend on:
  - ConfigManager for saving/loading configuration
  - Validation utilities for input sanitization
  - Error utilities for consistent exit codes

**Section sources**
- [generate.py](file://codewiki/cli/commands/generate.py#L1-L266)
- [config.py](file://codewiki/cli/commands/config.py#L1-L399)
- [doc_generator.py](file://codewiki/cli/adapters/doc_generator.py#L1-L289)
- [html_generator.py](file://codewiki/cli/html_generator.py#L1-L285)
- [job.py](file://codewiki/cli/models/job.py#L1-L157)
- [repo_validator.py](file://codewiki/cli/utils/repo_validator.py#L1-L188)
- [git_manager.py](file://codewiki/cli/git_manager.py#L1-L228)

## Dependency Analysis
The CLI commands are loosely coupled to their utilities and adapters, promoting modularity and testability. The generate command centralizes orchestration, delegating specialized tasks to dedicated modules.

```mermaid
graph TB
GenCmd["generate_command"] --> CMgr["ConfigManager"]
GenCmd --> RV["repo_validator"]
GenCmd --> GM["GitManager"]
GenCmd --> CDG["CLIDocumentationGenerator"]
CDG --> BE["Backend Generator"]
GenCmd --> HG["HTMLGenerator"]
GenCmd --> LG["CLILogger"]
GenCmd --> PJ["ProgressTracker"]
GenCmd --> Job["DocumentationJob"]
CfgCmd["config_* commands"] --> V["validation utilities"]
CfgCmd --> Err["errors utilities"]
```

**Diagram sources**
- [generate.py](file://codewiki/cli/commands/generate.py#L1-L266)
- [config.py](file://codewiki/cli/commands/config.py#L1-L399)
- [doc_generator.py](file://codewiki/cli/adapters/doc_generator.py#L1-L289)
- [html_generator.py](file://codewiki/cli/html_generator.py#L1-L285)
- [repo_validator.py](file://codewiki/cli/utils/repo_validator.py#L1-L188)
- [git_manager.py](file://codewiki/cli/git_manager.py#L1-L228)
- [progress.py](file://codewiki/cli/utils/progress.py#L1-L223)
- [logging.py](file://codewiki/cli/utils/logging.py#L1-L86)
- [job.py](file://codewiki/cli/models/job.py#L1-L157)
- [errors.py](file://codewiki/cli/utils/errors.py#L1-L114)

**Section sources**
- [generate.py](file://codewiki/cli/commands/generate.py#L1-L266)
- [config.py](file://codewiki/cli/commands/config.py#L1-L399)

## Performance Considerations
- Stage weights: Dependency Analysis (40%), Module Clustering (20%), Documentation Generation (30%), HTML Generation (5%), Finalization (5%). This influences ETA calculations.
- Verbose mode increases backend logging verbosity and detailed step reporting.
- Using --no-cache forces full regeneration, increasing runtime.
- GitHub Pages generation adds an extra stage for HTML creation.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Configuration not found or invalid:
  - Run codewiki config set to configure API credentials and models.
  - Use codewiki config validate to check configuration completeness.
- Not a git repository:
  - Initialize with git init if using --create-branch.
- Working directory has uncommitted changes:
  - Commit or stash changes before creating documentation branch.
- Output directory not writable:
  - Ensure parent directory exists and is writable.
- API connectivity failures:
  - Verify base URL and API key; test connectivity with codewiki config validate.
- Keyboard interrupts:
  - The CLI exits with code 130.

Exit codes summary:
- 0: Success
- 1: General error
- 2: Configuration error
- 3: Repository error
- 4: API error
- 5: File system error
- 130: Interrupted by user

**Section sources**
- [generate.py](file://codewiki/cli/commands/generate.py#L1-L266)
- [config.py](file://codewiki/cli/commands/config.py#L1-L399)
- [errors.py](file://codewiki/cli/utils/errors.py#L1-L114)

## Conclusion
The CodeWiki CLI provides a robust interface for generating repository documentation with optional git integration and GitHub Pages support. The generate command orchestrates configuration validation, repository checks, optional branch creation, backend generation, and post-generation instructions. The config group streamlines credential and model management. Progress tracking and logging offer clear feedback during long-running operations. Adhering to the documented options and exit codes ensures reliable automation and troubleshooting.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Command Reference Summary
- codewiki generate
  - Options: --output/-o, --create-branch, --github-pages, --no-cache, --verbose/-v
  - Exit codes: 0, 1, 2, 3, 4, 5, 130
  - Examples: README shows basic generation, custom output, branch creation, GitHub Pages, verbose, and combined options.
- codewiki config set
  - Options: --api-key, --base-url, --main-model, --cluster-model, --fallback-model
  - Exit codes: 0, 2
- codewiki config show
  - Options: --json
- codewiki config validate
  - Options: --quick, --verbose/-v

**Section sources**
- [generate.py](file://codewiki/cli/commands/generate.py#L1-L266)
- [config.py](file://codewiki/cli/commands/config.py#L1-L399)
- [README.md](file://README.md#L115-L136)