# Implementation Plan

- [x] 1. Set up dependencies and project structure
  - Install `marked` library for markdown parsing
  - Install `@types/marked` for TypeScript support
  - Update package.json with new dependencies
  - _Requirements: 5.1, 5.4_

- [x] 2. Create markdown processing module
  - [x] 2.1 Create `markdownProcessor.ts` with IMarkdownProcessor interface
    - Define interface for markdown-to-HTML conversion
    - Create MarkdownProcessor class implementing the interface
    - _Requirements: 2.1, 5.3_
  
  - [x] 2.2 Implement custom renderer for code blocks
    - Create custom marked renderer that detects ```mermaid blocks
    - Extract Mermaid code without modification
    - Generate unique IDs for each Mermaid block
    - Wrap Mermaid code in div with proper escaping
    - _Requirements: 2.1, 2.2, 5.1_
  
  - [x] 2.3 Implement markdown conversion logic
    - Configure marked with custom renderer
    - Handle relative link resolution
    - Preserve cite blocks and other custom elements
    - Generate anchor IDs for headers
    - _Requirements: 2.1, 5.3_

- [x] 3. Create theme detection and management
  - [x] 3.1 Implement theme detection in WikiViewerProvider
    - Read VSCode theme kind using vscode.window.activeColorTheme
    - Map VSCode theme to Mermaid theme names
    - Extract relevant CSS variables for styling
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 3.2 Create theme change listener
    - Listen to vscode.window.onDidChangeActiveColorTheme event
    - Update webview when theme changes
    - Send theme update message to webview
    - _Requirements: 3.1, 3.2_
  
  - [x] 3.3 Implement theme info interface and utilities
    - Create IThemeInfo interface
    - Create utility functions for theme mapping
    - Define CSS variable mappings for Mermaid
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Improve Mermaid initialization in webview
  - [x] 4.1 Create robust initialization sequence
    - Wait for DOM content loaded before initializing Mermaid
    - Check if Mermaid library loaded successfully from CDN
    - Configure Mermaid with theme and security settings
    - Add error callback for initialization failures
    - _Requirements: 4.1, 4.2_
  
  - [x] 4.2 Implement diagram rendering logic
    - Query all Mermaid diagram containers
    - Render each diagram with proper error handling
    - Track rendering status for each diagram
    - Handle multiple diagrams independently
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.4, 4.4_
  
  - [x] 4.3 Add re-initialization support for content updates
    - Clear previous Mermaid state when content updates
    - Re-render all diagrams with new content
    - Maintain scroll position during updates
    - _Requirements: 4.3_

- [x] 5. Implement comprehensive error handling
  - [x] 5.1 Create error display UI components
    - Design error message HTML template
    - Add CSS styling for error display
    - Create collapsible section for diagram code
    - Add retry and documentation link buttons
    - _Requirements: 2.3_
  
  - [x] 5.2 Implement error detection and handling
    - Catch Mermaid parsing errors
    - Catch CDN loading failures
    - Catch rendering exceptions
    - Generate user-friendly error messages
    - _Requirements: 2.3, 4.2_
  
  - [x] 5.3 Add error logging and telemetry
    - Log errors to browser console with diagram context
    - Track error types and frequencies
    - Provide debugging information for developers
    - _Requirements: 2.3_

- [x] 6. Update WikiViewerProvider to use new components
  - [x] 6.1 Refactor getWebviewContent method
    - Replace markdownToHtml with MarkdownProcessor
    - Pass theme information to HTML template
    - Include error handling scripts
    - Update webview HTML structure
    - _Requirements: 2.1, 3.1, 4.1_
  
  - [x] 6.2 Update webview HTML template
    - Add theme-aware CSS variables
    - Update Mermaid initialization script
    - Add error handling and retry logic
    - Improve loading indicators
    - _Requirements: 3.1, 3.3, 4.1_
  
  - [x] 6.3 Implement theme update messaging
    - Send theme info on initial load
    - Handle theme change messages from extension
    - Update Mermaid configuration on theme change
    - Re-render diagrams with new theme
    - _Requirements: 3.1, 3.2_

- [x] 7. Remove legacy markdown parsing code
  - [x] 7.1 Remove custom markdownToHtml method
    - Delete regex-based markdown parsing
    - Remove Mermaid syntax manipulation code
    - Clean up unused helper functions
    - _Requirements: 5.1, 5.2_
  
  - [x] 7.2 Update imports and dependencies
    - Remove unused code references
    - Update TypeScript imports
    - Clean up commented code
    - _Requirements: 5.1_

- [x] 8. Add configuration options
  - [x] 8.1 Define extension settings in package.json
    - Add qoderWiki.mermaid.theme setting
    - Add qoderWiki.mermaid.errorDisplay setting
    - Provide default values and descriptions
    - _Requirements: 3.1_
  
  - [x] 8.2 Implement settings reading in extension
    - Read configuration values on activation
    - Apply user preferences to Mermaid config
    - Handle configuration changes
    - _Requirements: 3.1_

- [x] 9. Test with real wiki content
  - [x] 9.1 Test all diagram types from content folder
    - Test graph/flowchart diagrams
    - Test class diagrams
    - Test sequence diagrams
    - Test state diagrams
    - Verify all diagrams render correctly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 9.2 Test theme switching
    - Switch between light and dark themes
    - Verify diagrams update correctly
    - Check color consistency
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 9.3 Test error scenarios
    - Test with invalid Mermaid syntax
    - Test with unsupported diagram types
    - Verify error messages display correctly
    - Test retry functionality
    - _Requirements: 2.3_
  
  - [x] 9.4 Test multiple diagrams in single document
    - Open Project Overview.md with multiple diagrams
    - Verify all diagrams render independently
    - Check performance with many diagrams
    - _Requirements: 2.4, 4.4_

- [x] 10. Documentation and polish
  - [x] 10.1 Update README with Mermaid support details
    - Document supported diagram types
    - Add examples of Mermaid usage
    - Document error handling behavior
    - _Requirements: 5.1_
  
  - [x] 10.2 Add inline code comments
    - Document complex logic in markdown processor
    - Explain theme mapping decisions
    - Document error handling strategies
    - _Requirements: 5.1_
  
  - [x] 10.3 Create wiki authoring guidelines
    - Document Mermaid best practices
    - Provide diagram examples
    - List common errors and solutions
    - _Requirements: 5.1_
