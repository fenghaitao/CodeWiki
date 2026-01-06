# Installation and Setup

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [DEVELOPMENT.md](file://DEVELOPMENT.md)
- [pyproject.toml](file://pyproject.toml)
- [requirements.txt](file://requirements.txt)
- [codewiki/cli/main.py](file://codewiki/cli/main.py)
- [codewiki/cli/commands/config.py](file://codewiki/cli/commands/config.py)
- [codewiki/cli/config_manager.py](file://codewiki/cli/config_manager.py)
- [codewiki/cli/models/config.py](file://codewiki/cli/models/config.py)
- [codewiki/src/config.py](file://codewiki/src/config.py)
- [docker/DOCKER_README.md](file://docker/DOCKER_README.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Install from Source (pip)](#install-from-source-pip)
4. [Development Setup (Editable Install)](#development-setup-editable-install)
5. [Configure LLM API Access](#configure-llm-api-access)
6. [Verification Commands](#verification-commands)
7. [Platform-Specific Considerations](#platform-specific-considerations)
8. [Troubleshooting](#troubleshooting)
9. [Conclusion](#conclusion)

## Introduction
This guide walks you through installing and setting up CodeWiki, including prerequisites, installation from source, development setup, configuration of LLM API access, verification steps, platform-specific considerations, and troubleshooting common issues.

## Prerequisites
Before installing CodeWiki, ensure the following are available on your system:
- Python 3.12 or newer
- Node.js (required for Mermaid diagram validation in generated documentation)
- Git (recommended for branch creation features)
- Tree-sitter language parsers (installed as part of dependencies)

These requirements are documented in the project’s main documentation and development guide.

**Section sources**
- [README.md](file://README.md#L231-L237)
- [DEVELOPMENT.md](file://DEVELOPMENT.md#L45-L51)

## Install from Source (pip)
You can install CodeWiki directly from the GitHub repository using pip. After installation, verify the CLI is available.

- Install from source:
  - pip install git+https://github.com/FSoft-AI4Code/CodeWiki.git

- Verify installation:
  - codewiki --version

Notes:
- The project requires Python 3.12+ as enforced by the packaging metadata.
- Node.js is required for Mermaid validation of diagrams in generated documentation.
- Git is recommended for features that create branches during documentation generation.

**Section sources**
- [README.md](file://README.md#L33-L41)
- [pyproject.toml](file://pyproject.toml#L10-L10)
- [pyproject.toml](file://pyproject.toml#L56-L61)
- [requirements.txt](file://requirements.txt#L1-L165)

## Development Setup (Editable Install)
For contributors or developers extending CodeWiki, install the package in editable mode within a Python 3.12 virtual environment. This setup also installs development dependencies.

- Steps:
  - Create a virtual environment with Python 3.12
  - Activate the virtual environment
  - Install in editable mode: pip install -e .
  - Install development dependencies: pip install -r requirements.txt

This development setup ensures you can run the CLI and iterate on the codebase locally.

**Section sources**
- [DEVELOPMENT.md](file://DEVELOPMENT.md#L59-L68)

## Configure LLM API Access
CodeWiki supports multiple LLM providers via an OpenAI-compatible SDK layer. Configuration is managed through the CLI and stored securely.

- Set configuration:
  - Use the CLI to set API key, base URL, main model, cluster model, and fallback model
  - The API key is stored in the system keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service). If the keychain is unavailable, the CLI falls back to storing the key in an encrypted file in the configuration directory.

- Show configuration:
  - Display current configuration, including where the API key is stored.

- Validate configuration:
  - Validates the configuration file, presence of the API key, base URL format, and model settings. Optionally tests API connectivity.

- Environment variables (for web app or alternate contexts):
  - The backend reads environment variables for models and API settings when running the web application. The CLI bridges to the backend configuration using the stored settings and keyring.

Key points:
- The CLI stores the API key in the system keychain by default.
- The backend configuration supports environment variables for web app usage.
- The configuration file is stored under the user’s home directory in a hidden folder.

**Section sources**
- [README.md](file://README.md#L43-L56)
- [README.md](file://README.md#L137-L141)
- [codewiki/cli/commands/config.py](file://codewiki/cli/commands/config.py#L32-L161)
- [codewiki/cli/commands/config.py](file://codewiki/cli/commands/config.py#L163-L248)
- [codewiki/cli/commands/config.py](file://codewiki/cli/commands/config.py#L250-L399)
- [codewiki/cli/config_manager.py](file://codewiki/cli/config_manager.py#L26-L50)
- [codewiki/cli/config_manager.py](file://codewiki/cli/config_manager.py#L109-L160)
- [codewiki/cli/models/config.py](file://codewiki/cli/models/config.py#L82-L109)
- [codewiki/src/config.py](file://codewiki/src/config.py#L31-L40)
- [codewiki/src/config.py](file://codewiki/src/config.py#L74-L114)

## Verification Commands
After installation, verify that CodeWiki is correctly installed and configured.

- Verify CLI availability:
  - codewiki --version

- Verify configuration:
  - codewiki config show
  - codewiki config validate

These commands confirm that the CLI is accessible and that your configuration is valid.

**Section sources**
- [README.md](file://README.md#L33-L41)
- [codewiki/cli/commands/config.py](file://codewiki/cli/commands/config.py#L163-L248)
- [codewiki/cli/commands/config.py](file://codewiki/cli/commands/config.py#L250-L399)
- [codewiki/cli/main.py](file://codewiki/cli/main.py#L12-L31)

## Platform-Specific Considerations
CodeWiki integrates with the system keychain for secure storage of API credentials. The availability and behavior of the keychain differ by platform.

- macOS:
  - API key is stored in macOS Keychain via the keyring library.
- Windows:
  - API key is stored in Windows Credential Manager via the keyring library.
- Linux:
  - API key is stored in the system Secret Service (e.g., GNOME Keyring, KWallet) via the keyring library.

If the system keychain is unavailable, the CLI falls back to storing the API key in an encrypted file under the configuration directory.

- Configuration storage locations:
  - API key: system keychain (preferred) or encrypted file
  - Other settings: a JSON file in the user’s home directory under a hidden configuration folder

These behaviors are handled by the configuration manager and reflected in CLI messaging.

**Section sources**
- [codewiki/cli/commands/config.py](file://codewiki/cli/commands/config.py#L66-L72)
- [codewiki/cli/config_manager.py](file://codewiki/cli/config_manager.py#L26-L50)
- [codewiki/cli/config_manager.py](file://codewiki/cli/config_manager.py#L138-L159)
- [README.md](file://README.md#L137-L141)

## Troubleshooting
Common issues and resolutions during installation and setup:

- Python version compatibility:
  - Ensure Python 3.12+ is installed. The project metadata enforces this requirement.
  - If you encounter version errors, upgrade your Python interpreter to 3.12 or later.

- Node.js requirement for Mermaid validation:
  - Install Node.js as the project requires it for Mermaid diagram validation in generated documentation.
  - The packaging metadata documents Node.js as a build requirement.

- Git-related features:
  - Git is recommended for features that create branches during documentation generation. If unavailable, those features will not work.

- Tree-sitter language parsers:
  - Tree-sitter parsers are included as dependencies. If you encounter parser errors, ensure the parsers are installed and compatible with your environment.

- API key storage and retrieval:
  - If the system keychain is unavailable, the CLI warns and stores the API key in an encrypted file. Confirm that the keyring library is available and properly configured for your platform.

- Configuration validation failures:
  - Use the validation command to check configuration completeness and correctness. The validator verifies the configuration file, API key presence, base URL format, and model settings. Optionally, it tests API connectivity.

- Docker-based setup (alternative):
  - For containerized deployment, follow the Docker documentation. It covers environment variables, port mapping, persistent storage, and troubleshooting steps for common issues like port conflicts and permission problems.

**Section sources**
- [pyproject.toml](file://pyproject.toml#L10-L10)
- [pyproject.toml](file://pyproject.toml#L56-L61)
- [requirements.txt](file://requirements.txt#L1-L165)
- [DEVELOPMENT.md](file://DEVELOPMENT.md#L218-L233)
- [codewiki/cli/commands/config.py](file://codewiki/cli/commands/config.py#L250-L399)
- [codewiki/cli/config_manager.py](file://codewiki/cli/config_manager.py#L138-L159)
- [docker/DOCKER_README.md](file://docker/DOCKER_README.md#L254-L331)

## Conclusion
You now have the essential steps to install CodeWiki from source, set up a development environment, configure LLM API access securely, verify your installation, and troubleshoot common issues. For containerized deployments, consult the Docker documentation.