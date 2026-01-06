# Dependency Graph Analysis and Topological Sorting

<cite>
**Referenced Files in This Document**
- [dependency_graphs_builder.py](file://codewiki/src/be/dependency_analyzer/dependency_graphs_builder.py)
- [topo_sort.py](file://codewiki/src/be/dependency_analyzer/topo_sort.py)
- [ast_parser.py](file://codewiki/src/be/dependency_analyzer/ast_parser.py)
- [analysis_service.py](file://codewiki/src/be/dependency_analyzer/analysis/analysis_service.py)
- [call_graph_analyzer.py](file://codewiki/src/be/dependency_analyzer/analysis/call_graph_analyzer.py)
- [repo_analyzer.py](file://codewiki/src/be/dependency_analyzer/analysis/repo_analyzer.py)
- [core.py](file://codewiki/src/be/dependency_analyzer/models/core.py)
- [python.py](file://codewiki/src/be/dependency_analyzer/analyzers/python.py)
- [documentation_generator.py](file://codewiki/src/be/documentation_generator.py)
- [cluster_modules.py](file://codewiki/src/be/cluster_modules.py)
- [doc_generator.py](file://codewiki/cli/adapters/doc_generator.py)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Topological Sorting and Cycle Handling](#topological-sorting-and-cycle-handling)
8. [Module Clustering and Documentation Pipeline](#module-clustering-and-documentation-pipeline)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Conclusion](#conclusion)

## Introduction
This document explains the dependency analysis and topological sorting system in CodeWiki. It focuses on how the system parses repositories, extracts code components, builds a dependency graph, detects and resolves cycles, and produces leaf nodes that drive module clustering and documentation generation. It also covers the orchestration of these steps in the broader documentation generation pipeline.

## Project Structure
The dependency analysis lives under the backend dependency analyzer package and integrates with the documentation generator and CLI adapter.

```mermaid
graph TB
subgraph "Dependency Analyzer"
DGB["DependencyGraphBuilder<br/>build_dependency_graph()"]
TP["Topological Utilities<br/>topological_sort(), dependency_first_dfs(), get_leaf_nodes()"]
DP["DependencyParser<br/>parse_repository(), save_dependency_graph()"]
AS["AnalysisService<br/>analyze_local_repository(), analyze_repository_full()"]
CG["CallGraphAnalyzer<br/>analyze_code_files(), extract_code_files()"]
RA["RepoAnalyzer<br/>analyze_repository_structure()"]
PY["Python Analyzer<br/>PythonASTAnalyzer"]
CORE["Models<br/>Node, CallRelationship"]
end
subgraph "Documentation Pipeline"
DG["DocumentationGenerator<br/>generate_module_documentation()"]
CL["Cluster Modules<br/>cluster_modules()"]
end
subgraph "CLI Adapter"
DOCGEN["CLIDocumentationGenerator<br/>generate()"]
end
AS --> RA
AS --> CG
CG --> PY
CG --> CORE
DP --> AS
DP --> CORE
DGB --> DP
DGB --> TP
DG --> DGB
DG --> CL
DOCGEN --> DG
```

**Diagram sources**
- [dependency_graphs_builder.py](file://codewiki/src/be/dependency_analyzer/dependency_graphs_builder.py#L1-L94)
- [topo_sort.py](file://codewiki/src/be/dependency_analyzer/topo_sort.py#L1-L350)
- [ast_parser.py](file://codewiki/src/be/dependency_analyzer/ast_parser.py#L1-L146)
- [analysis_service.py](file://codewiki/src/be/dependency_analyzer/analysis/analysis_service.py#L1-L370)
- [call_graph_analyzer.py](file://codewiki/src/be/dependency_analyzer/analysis/call_graph_analyzer.py#L1-L536)
- [repo_analyzer.py](file://codewiki/src/be/dependency_analyzer/analysis/repo_analyzer.py#L1-L127)
- [python.py](file://codewiki/src/be/dependency_analyzer/analyzers/python.py#L1-L267)
- [core.py](file://codewiki/src/be/dependency_analyzer/models/core.py#L1-L64)
- [documentation_generator.py](file://codewiki/src/be/documentation_generator.py#L1-L292)
- [cluster_modules.py](file://codewiki/src/be/cluster_modules.py#L1-L113)
- [doc_generator.py](file://codewiki/cli/adapters/doc_generator.py#L1-L289)

**Section sources**
- [dependency_graphs_builder.py](file://codewiki/src/be/dependency_analyzer/dependency_graphs_builder.py#L1-L94)
- [topo_sort.py](file://codewiki/src/be/dependency_analyzer/topo_sort.py#L1-L350)
- [ast_parser.py](file://codewiki/src/be/dependency_analyzer/ast_parser.py#L1-L146)
- [analysis_service.py](file://codewiki/src/be/dependency_analyzer/analysis/analysis_service.py#L1-L370)
- [call_graph_analyzer.py](file://codewiki/src/be/dependency_analyzer/analysis/call_graph_analyzer.py#L1-L536)
- [repo_analyzer.py](file://codewiki/src/be/dependency_analyzer/analysis/repo_analyzer.py#L1-L127)
- [core.py](file://codewiki/src/be/dependency_analyzer/models/core.py#L1-L64)
- [python.py](file://codewiki/src/be/dependency_analyzer/analyzers/python.py#L1-L267)
- [documentation_generator.py](file://codewiki/src/be/documentation_generator.py#L1-L292)
- [cluster_modules.py](file://codewiki/src/be/cluster_modules.py#L1-L113)
- [doc_generator.py](file://codewiki/cli/adapters/doc_generator.py#L1-L289)

## Core Components
- DependencyGraphBuilder: Orchestrates repository parsing, saves dependency graphs, constructs a dependency graph from components, and identifies leaf nodes.
- Topological Utilities: Provides cycle detection (Tarjan’s algorithm), cycle resolution, topological sort, dependency-first DFS, and leaf node extraction.
- DependencyParser: Parses repositories, builds components from analysis results, and persists dependency graphs.
- AnalysisService: Coordinates repository structure analysis and call graph generation across multiple languages.
- CallGraphAnalyzer: Extracts code files, routes to language-specific analyzers, resolves relationships, deduplicates, and generates visualization data.
- RepoAnalyzer: Builds a file tree with include/exclude filtering and safety checks.
- Python Analyzer: AST-based Python analysis to extract classes/functions and relationships.
- Models: Node and CallRelationship define the component and relationship structures.
- DocumentationGenerator: Drives the end-to-end pipeline, using dependency graph outputs to cluster modules and generate documentation.
- Cluster Modules: Formats and clusters leaf nodes into module trees for documentation.
- CLI Adapter: Wraps the backend generation with progress tracking and CLI integration.

**Section sources**
- [dependency_graphs_builder.py](file://codewiki/src/be/dependency_analyzer/dependency_graphs_builder.py#L1-L94)
- [topo_sort.py](file://codewiki/src/be/dependency_analyzer/topo_sort.py#L1-L350)
- [ast_parser.py](file://codewiki/src/be/dependency_analyzer/ast_parser.py#L1-L146)
- [analysis_service.py](file://codewiki/src/be/dependency_analyzer/analysis/analysis_service.py#L1-L370)
- [call_graph_analyzer.py](file://codewiki/src/be/dependency_analyzer/analysis/call_graph_analyzer.py#L1-L536)
- [repo_analyzer.py](file://codewiki/src/be/dependency_analyzer/analysis/repo_analyzer.py#L1-L127)
- [python.py](file://codewiki/src/be/dependency_analyzer/analyzers/python.py#L1-L267)
- [core.py](file://codewiki/src/be/dependency_analyzer/models/core.py#L1-L64)
- [documentation_generator.py](file://codewiki/src/be/documentation_generator.py#L1-L292)
- [cluster_modules.py](file://codewiki/src/be/cluster_modules.py#L1-L113)
- [doc_generator.py](file://codewiki/cli/adapters/doc_generator.py#L1-L289)

## Architecture Overview
The system follows a layered approach:
- Input: Repository path or GitHub URL.
- Analysis: Repo structure analysis and call graph construction across languages.
- Graph Construction: Build component graph from relationships and filter to repository-contained dependencies.
- Topology: Detect and resolve cycles, compute leaf nodes, and produce traversal orders.
- Clustering: Group leaf nodes into modules using LLM-based clustering.
- Documentation: Generate module docs and repository overview in dependency order.

```mermaid
sequenceDiagram
participant CLI as "CLI Adapter"
participant DG as "DocumentationGenerator"
participant DGB as "DependencyGraphBuilder"
participant DP as "DependencyParser"
participant AS as "AnalysisService"
participant CG as "CallGraphAnalyzer"
participant RA as "RepoAnalyzer"
participant TP as "Topological Utils"
CLI->>DG : generate()
DG->>DGB : build_dependency_graph()
DGB->>DP : parse_repository()
DP->>AS : analyze_local_repository()/analyze_repository_full()
AS->>RA : analyze_repository_structure()
AS->>CG : analyze_code_files()
CG->>CG : extract_code_files()
CG->>CG : route to language analyzers
CG-->>AS : functions, relationships
AS-->>DP : call_graph_result
DP->>DP : _build_components_from_analysis()
DP-->>DGB : components
DGB->>DP : save_dependency_graph()
DGB->>TP : build_graph_from_components(components)
DGB->>TP : get_leaf_nodes(graph, components)
TP-->>DGB : leaf_nodes
DGB-->>DG : components, leaf_nodes
```

**Diagram sources**
- [doc_generator.py](file://codewiki/cli/adapters/doc_generator.py#L165-L248)
- [documentation_generator.py](file://codewiki/src/be/documentation_generator.py#L249-L292)
- [dependency_graphs_builder.py](file://codewiki/src/be/dependency_analyzer/dependency_graphs_builder.py#L18-L94)
- [ast_parser.py](file://codewiki/src/be/dependency_analyzer/ast_parser.py#L28-L146)
- [analysis_service.py](file://codewiki/src/be/dependency_analyzer/analysis/analysis_service.py#L41-L168)
- [call_graph_analyzer.py](file://codewiki/src/be/dependency_analyzer/analysis/call_graph_analyzer.py#L27-L103)
- [repo_analyzer.py](file://codewiki/src/be/dependency_analyzer/analysis/repo_analyzer.py#L31-L127)
- [topo_sort.py](file://codewiki/src/be/dependency_analyzer/topo_sort.py#L239-L350)

## Detailed Component Analysis

### DependencyGraphBuilder
Responsibilities:
- Ensures output directories exist.
- Prepares dependency graph file paths.
- Uses DependencyParser to parse repository and build components.
- Saves the dependency graph JSON.
- Builds a dependency graph from components using build_graph_from_components.
- Extracts leaf nodes using get_leaf_nodes with type filtering and sanitization.

Key behaviors:
- Type-aware leaf node selection: prioritizes classes/interfaces/structs; falls back to functions for C-based projects.
- Sanitizes identifiers and filters out invalid entries.
- Returns both components and leaf nodes for downstream use.

```mermaid
flowchart TD
Start(["build_dependency_graph"]) --> EnsureDir["Ensure dependency graph directory"]
EnsureDir --> Paths["Compute sanitized repo name and file paths"]
Paths --> Parser["Instantiate DependencyParser(repo_path)"]
Parser --> Parse["parser.parse_repository()"]
Parse --> Save["parser.save_dependency_graph()"]
Save --> BuildGraph["build_graph_from_components(components)"]
BuildGraph --> LeafNodes["get_leaf_nodes(graph, components)"]
LeafNodes --> FilterTypes{"Available types include class/interface/struct?"}
FilterTypes --> |Yes| KeepTyped["Keep only class/interface/struct leaf nodes"]
FilterTypes --> |No| KeepFuncs["Also include functions for C-based projects"]
KeepTyped --> Validate["Sanitize identifiers and remove invalid entries"]
KeepFuncs --> Validate
Validate --> Return(["Return (components, leaf_nodes)"])
```

**Diagram sources**
- [dependency_graphs_builder.py](file://codewiki/src/be/dependency_analyzer/dependency_graphs_builder.py#L18-L94)
- [topo_sort.py](file://codewiki/src/be/dependency_analyzer/topo_sort.py#L239-L350)

**Section sources**
- [dependency_graphs_builder.py](file://codewiki/src/be/dependency_analyzer/dependency_graphs_builder.py#L18-L94)

### DependencyParser
Responsibilities:
- Initializes AnalysisService.
- Parses repository structure and call graph.
- Builds Node objects and populates component dependencies.
- Persists dependency graph to JSON.

Key behaviors:
- Maps legacy IDs to canonical component IDs.
- Infers module paths from component IDs.
- Resolves relationships by matching caller/callee to known components.

```mermaid
classDiagram
class DependencyParser {
+string repo_path
+Dict~str, Node~ components
+Set~str~ modules
+AnalysisService analysis_service
+parse_repository(filtered_folders) Dict~str, Node~
-_build_components_from_analysis(call_graph_result) void
-_determine_component_type(func_dict) str
-_file_to_module_path(file_path) str
+save_dependency_graph(output_path) Dict
}
class AnalysisService {
+analyze_local_repository(repo_path, max_files, languages) Dict
+analyze_repository_full(github_url, include_patterns, exclude_patterns) AnalysisResult
-_analyze_structure(repo_dir, include_patterns, exclude_patterns) Dict
-_analyze_call_graph(file_tree, repo_dir) Dict
}
class Node {
+string id
+string name
+string component_type
+string file_path
+string relative_path
+Set~str~ depends_on
+string source_code
+int start_line
+int end_line
+bool has_docstring
+string docstring
+str[] parameters
+string node_type
+str[] base_classes
+string class_name
+string display_name
+string component_id
}
DependencyParser --> AnalysisService : "uses"
DependencyParser --> Node : "creates"
```

**Diagram sources**
- [ast_parser.py](file://codewiki/src/be/dependency_analyzer/ast_parser.py#L18-L146)
- [analysis_service.py](file://codewiki/src/be/dependency_analyzer/analysis/analysis_service.py#L24-L168)
- [core.py](file://codewiki/src/be/dependency_analyzer/models/core.py#L7-L64)

**Section sources**
- [ast_parser.py](file://codewiki/src/be/dependency_analyzer/ast_parser.py#L28-L146)
- [analysis_service.py](file://codewiki/src/be/dependency_analyzer/analysis/analysis_service.py#L41-L168)
- [core.py](file://codewiki/src/be/dependency_analyzer/models/core.py#L7-L64)

### Topological Utilities
Functions:
- detect_cycles(graph): Implements Tarjan’s algorithm to find strongly connected components (cycles).
- resolve_cycles(graph): Removes a representative edge from each detected cycle to produce an acyclic graph.
- topological_sort(graph): Performs Kahn’s algorithm on the acyclic graph to produce a dependency-first ordering.
- dependency_first_dfs(graph): DFS traversal that processes dependencies before dependents.
- build_graph_from_components(components): Converts component sets of depends_on into adjacency sets.
- get_leaf_nodes(graph, components): Identifies leaf nodes (nodes with no incoming edges) and applies type filtering and sanitization.

```mermaid
flowchart TD
A["Input graph (adjacency sets)"] --> B["detect_cycles()"]
B --> C{"Cycles found?"}
C --> |No| D["resolve_cycles() returns original graph"]
C --> |Yes| E["resolve_cycles() removes edges to break cycles"]
D --> F["topological_sort() Kahn's algorithm"]
E --> F
F --> G["Reverse to get dependencies first"]
A --> H["dependency_first_dfs() DFS"]
A --> I["get_leaf_nodes() find nodes with no incoming edges"]
```

**Diagram sources**
- [topo_sort.py](file://codewiki/src/be/dependency_analyzer/topo_sort.py#L18-L350)

**Section sources**
- [topo_sort.py](file://codewiki/src/be/dependency_analyzer/topo_sort.py#L18-L350)

### AnalysisService and CallGraphAnalyzer
AnalysisService orchestrates:
- RepoAnalyzer to build a file tree with include/exclude patterns.
- CallGraphAnalyzer to extract and analyze code files across supported languages.
- Result consolidation into functions and relationships.

CallGraphAnalyzer:
- Extracts code files from the file tree.
- Routes to language-specific analyzers (Python, JavaScript/TypeScript, Java, C#, C, C++, PHP).
- Resolves relationships by name and component_id lookups.
- Deduplicates relationships and generates visualization data.

```mermaid
sequenceDiagram
participant AS as "AnalysisService"
participant RA as "RepoAnalyzer"
participant CG as "CallGraphAnalyzer"
participant PY as "Python Analyzer"
participant CORE as "Models"
AS->>RA : analyze_repository_structure()
AS->>CG : analyze_code_files(code_files, repo_dir)
CG->>CG : extract_code_files(file_tree)
CG->>PY : analyze_python_file(...)
PY-->>CG : functions, relationships
CG->>CG : _resolve_call_relationships()
CG->>CG : _deduplicate_relationships()
CG-->>AS : functions, relationships, visualization
```

**Diagram sources**
- [analysis_service.py](file://codewiki/src/be/dependency_analyzer/analysis/analysis_service.py#L41-L168)
- [call_graph_analyzer.py](file://codewiki/src/be/dependency_analyzer/analysis/call_graph_analyzer.py#L27-L103)
- [python.py](file://codewiki/src/be/dependency_analyzer/analyzers/python.py#L148-L267)
- [core.py](file://codewiki/src/be/dependency_analyzer/models/core.py#L7-L64)

**Section sources**
- [analysis_service.py](file://codewiki/src/be/dependency_analyzer/analysis/analysis_service.py#L41-L168)
- [call_graph_analyzer.py](file://codewiki/src/be/dependency_analyzer/analysis/call_graph_analyzer.py#L27-L103)
- [python.py](file://codewiki/src/be/dependency_analyzer/analyzers/python.py#L148-L267)
- [core.py](file://codewiki/src/be/dependency_analyzer/models/core.py#L7-L64)

### Documentation Pipeline Integration
DocumentationGenerator:
- Calls DependencyGraphBuilder to obtain components and leaf nodes.
- Clusters leaf nodes into modules via cluster_modules.
- Generates module documentation in dependency order and creates repository overview.
- Creates metadata and manages file outputs.

```mermaid
sequenceDiagram
participant DG as "DocumentationGenerator"
participant DGB as "DependencyGraphBuilder"
participant CL as "cluster_modules"
participant AG as "AgentOrchestrator"
DG->>DGB : build_dependency_graph()
DGB-->>DG : components, leaf_nodes
DG->>CL : cluster_modules(leaf_nodes, components, config)
CL-->>DG : module_tree
DG->>AG : generate_module_documentation(components, leaf_nodes)
AG-->>DG : working_dir
DG->>DG : create_documentation_metadata()
```

**Diagram sources**
- [documentation_generator.py](file://codewiki/src/be/documentation_generator.py#L249-L292)
- [dependency_graphs_builder.py](file://codewiki/src/be/dependency_analyzer/dependency_graphs_builder.py#L18-L94)
- [cluster_modules.py](file://codewiki/src/be/cluster_modules.py#L44-L113)

**Section sources**
- [documentation_generator.py](file://codewiki/src/be/documentation_generator.py#L249-L292)
- [cluster_modules.py](file://codewiki/src/be/cluster_modules.py#L44-L113)

## Dependency Analysis
- Repository parsing: RepoAnalyzer builds a safe file tree with include/exclude patterns. AnalysisService coordinates structure and call graph analysis.
- Call graph construction: CallGraphAnalyzer extracts code files and routes to language analyzers. Python analyzer uses AST to extract classes/functions and relationships.
- Component assembly: DependencyParser converts analysis results into Node objects and populates depends_on sets. It also maps legacy identifiers and infers module paths.
- Graph persistence: DependencyParser saves the dependency graph JSON for later use.

Common issues and mitigations:
- Unsupported files: CallGraphAnalyzer filters unsupported languages; ensure include patterns match desired languages.
- Unresolved relationships: _resolve_call_relationships attempts to match by component_id and method name; unresolved calls are preserved for visualization.
- Safety checks: RepoAnalyzer rejects symlinks and escapes; safe_open_text is used to prevent unsafe reads.

**Section sources**
- [repo_analyzer.py](file://codewiki/src/be/dependency_analyzer/analysis/repo_analyzer.py#L31-L127)
- [analysis_service.py](file://codewiki/src/be/dependency_analyzer/analysis/analysis_service.py#L231-L340)
- [call_graph_analyzer.py](file://codewiki/src/be/dependency_analyzer/analysis/call_graph_analyzer.py#L27-L103)
- [python.py](file://codewiki/src/be/dependency_analyzer/analyzers/python.py#L148-L267)
- [ast_parser.py](file://codewiki/src/be/dependency_analyzer/ast_parser.py#L47-L146)

## Topological Sorting and Cycle Handling
Workflow:
- Graph construction: build_graph_from_components transforms component depends_on sets into adjacency sets.
- Cycle detection: detect_cycles uses Tarjan’s algorithm to find strongly connected components.
- Cycle resolution: resolve_cycles removes edges from detected cycles to produce an acyclic graph.
- Traversals:
  - topological_sort: Kahn’s algorithm with in-degree counting; returns dependency-first order.
  - dependency_first_dfs: DFS that recurses into dependencies before adding the current node.
- Leaf nodes: get_leaf_nodes identifies nodes with no incoming edges and applies type filtering and sanitization.

```mermaid
flowchart TD
S["Start"] --> G["Build graph from components"]
G --> C["Detect cycles (Tarjan)"]
C --> R{"Any cycles?"}
R --> |No| T["Topological sort (Kahn)"]
R --> |Yes| RC["Resolve cycles by removing edges"]
RC --> T
T --> O["Return dependency-first order"]
```

**Diagram sources**
- [topo_sort.py](file://codewiki/src/be/dependency_analyzer/topo_sort.py#L18-L169)

**Section sources**
- [topo_sort.py](file://codewiki/src/be/dependency_analyzer/topo_sort.py#L18-L169)

## Module Clustering and Documentation Pipeline
- Leaf nodes feeding clustering: DependencyGraphBuilder filters leaf nodes by type and sanitizes identifiers; cluster_modules groups them by file and invokes LLM clustering.
- Dynamic programming generation: DocumentationGenerator processes leaf modules first, then parent modules, and finally the repository overview, using the module tree produced by clustering.

```mermaid
sequenceDiagram
participant DGB as "DependencyGraphBuilder"
participant CL as "cluster_modules"
participant DG as "DocumentationGenerator"
DGB-->>DG : components, leaf_nodes
DG->>CL : format_potential_core_components(leaf_nodes, components)
CL-->>DG : module_tree
DG->>DG : generate_module_documentation(components, leaf_nodes)
```

**Diagram sources**
- [dependency_graphs_builder.py](file://codewiki/src/be/dependency_analyzer/dependency_graphs_builder.py#L18-L94)
- [cluster_modules.py](file://codewiki/src/be/cluster_modules.py#L14-L113)
- [documentation_generator.py](file://codewiki/src/be/documentation_generator.py#L124-L198)

**Section sources**
- [cluster_modules.py](file://codewiki/src/be/cluster_modules.py#L14-L113)
- [documentation_generator.py](file://codewiki/src/be/documentation_generator.py#L124-L198)

## Performance Considerations
- Large graphs:
  - Limit analysis scope: Use include/exclude patterns and max_files to constrain analysis volume.
  - Targeted sampling: CallGraphAnalyzer’s _select_most_connected_nodes can reduce graph size for LLM-friendly contexts.
  - Efficient graph representation: Adjacency sets minimize memory overhead for sparse graphs.
- Traversal efficiency:
  - Kahn’s algorithm (topological_sort) runs in O(V+E); ensure in-degree counts are computed once.
  - DFS (dependency_first_dfs) is linear in V+E; precompute reverse graph only when needed.
- I/O:
  - Persist dependency graphs to avoid repeated parsing.
  - Use streaming or chunked processing for large JSON outputs.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues:
- Cyclic dependencies:
  - Symptoms: topological_sort warning about unresolved cycles.
  - Resolution: resolve_cycles automatically removes edges; review cycle reports and adjust project structure if necessary.
- Missing components:
  - Causes: unresolved relationships or external library calls.
  - Mitigation: ensure all relevant files are included; verify include patterns and language filters.
- Invalid leaf nodes:
  - Causes: malformed identifiers or non-code entries.
  - Mitigation: DependencyGraphBuilder filters invalid identifiers and type mismatches; verify component types and IDs.
- LLM clustering failures:
  - Causes: invalid response format or token limits.
  - Mitigation: cluster_modules validates response tags and module tree shape; reduce token count by grouping fewer components per prompt.

Operational tips:
- Enable verbose logging in CLI adapter to inspect backend stages.
- Verify output directories exist and are writable before generation.
- Confirm LLM credentials and model configurations are set.

**Section sources**
- [topo_sort.py](file://codewiki/src/be/dependency_analyzer/topo_sort.py#L121-L169)
- [dependency_graphs_builder.py](file://codewiki/src/be/dependency_analyzer/dependency_graphs_builder.py#L64-L94)
- [cluster_modules.py](file://codewiki/src/be/cluster_modules.py#L61-L113)
- [doc_generator.py](file://codewiki/cli/adapters/doc_generator.py#L165-L248)

## Conclusion
The dependency analysis and topological sorting system in CodeWiki provides a robust foundation for understanding code structure, resolving cycles, and driving module clustering and documentation generation. By combining AST-based parsing, multi-language call graph analysis, and graph-theoretic utilities, the system supports scalable documentation workflows across diverse repositories.