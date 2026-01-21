import logging
from typing import List, Optional, Tuple
from pathlib import Path
import sys
import os

# Add tree-sitter-dml bindings to path
dml_tree_sitter_path = Path(__file__).resolve().parent.parent.parent.parent.parent.parent / "tree-sitter-dml" / "bindings" / "python"
if dml_tree_sitter_path.exists():
    sys.path.insert(0, str(dml_tree_sitter_path))

from tree_sitter import Parser, Language
# Note: tree_sitter_dml is not yet available as a standard package
# You may need to build a custom DML grammar or use an alternative parsing approach
try:
    import tree_sitter_dml
    HAS_DML_PARSER = True
except ImportError:
    HAS_DML_PARSER = False
    logging.warning("tree_sitter_dml not available. DML analysis will use fallback parsing.")

from codewiki.src.be.dependency_analyzer.models.core import Node, CallRelationship

logger = logging.getLogger(__name__)

class TreeSitterDMLAnalyzer:
    """
    Analyzer for DML (Data Manipulation Language) files using Tree-sitter.
    
    This analyzer extracts:
    - Table definitions
    - Column definitions
    - Query patterns (SELECT, INSERT, UPDATE, DELETE)
    - Function/procedure definitions
    - Relationships between database objects
    """
    
    def __init__(self, file_path: str, content: str, repo_path: str = None):
        self.file_path = Path(file_path)
        self.content = content
        self.repo_path = repo_path or ""
        self.nodes: List[Node] = []
        self.call_relationships: List[CallRelationship] = []
        
        if not HAS_DML_PARSER:
            logger.warning(f"DML parser not available for {file_path}. Using basic parsing.")
            self._analyze_fallback()
        else:
            self._analyze()
    
    def _get_module_path(self) -> str:
        """Get the module path from file path relative to repo."""
        if self.repo_path:
            try:
                rel_path = os.path.relpath(str(self.file_path), self.repo_path)
            except ValueError:
                rel_path = str(self.file_path)
        else:
            rel_path = str(self.file_path)
        
        # Remove file extension
        for ext in ['.dml', '.sql', '.ddl']:
            if rel_path.endswith(ext):
                rel_path = rel_path[:-len(ext)]
                break
        return rel_path.replace('/', '.').replace('\\', '.')
    
    def _get_relative_path(self) -> str:
        """Get file path relative to repo root."""
        if self.repo_path:
            try:
                return os.path.relpath(str(self.file_path), self.repo_path)
            except ValueError:
                return str(self.file_path)
        else:
            return str(self.file_path)
    
    def _get_component_id(self, name: str) -> str:
        """Generate unique component ID."""
        module_path = self._get_module_path()
        return f"{module_path}.{name}" if module_path else name

    def _analyze(self):
        """Analyze DML file using tree-sitter parser."""
        if not HAS_DML_PARSER:
            return
        
        dml_language = tree_sitter_dml.language()
        parser = Parser(dml_language)
        tree = parser.parse(bytes(self.content, "utf8"))
        root = tree.root_node
        lines = self.content.splitlines()
        
        top_level_nodes = {}
        
        # Collect all top-level nodes using recursive traversal
        self._extract_nodes(root, top_level_nodes, lines)
        
        # Extract relationships between top-level nodes
        self._extract_relationships(root, top_level_nodes)
    
    def _analyze_fallback(self):
        """
        Fallback parsing method using regex/simple text parsing.
        This is used when tree-sitter-dml is not available.
        """
        import re
        
        lines = self.content.splitlines()
        relative_path = self._get_relative_path()
        
        # Pattern for CREATE TABLE statements
        create_table_pattern = re.compile(
            r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)',
            re.IGNORECASE
        )
        
        # Pattern for CREATE PROCEDURE/FUNCTION
        create_proc_pattern = re.compile(
            r'CREATE\s+(?:OR\s+REPLACE\s+)?(?:PROCEDURE|FUNCTION)\s+([a-zA-Z_][a-zA-Z0-9_]*)',
            re.IGNORECASE
        )
        
        # Simple parsing for table and procedure definitions
        current_line = 0
        for i, line in enumerate(lines, 1):
            line_stripped = line.strip()
            
            # Check for table definitions
            table_match = create_table_pattern.search(line_stripped)
            if table_match:
                table_name = table_match.group(1)
                component_id = self._get_component_id(table_name)
                
                # Find end of CREATE TABLE (look for semicolon or next CREATE)
                end_line = i
                for j in range(i, len(lines)):
                    if ';' in lines[j]:
                        end_line = j + 1
                        break
                
                source_code = "\n".join(lines[i-1:end_line])
                
                node_obj = Node(
                    id=component_id,
                    name=table_name,
                    component_type="table",
                    file_path=str(self.file_path),
                    relative_path=relative_path,
                    source_code=source_code,
                    start_line=i,
                    end_line=end_line,
                    has_docstring=False,
                    docstring="",
                    parameters=None,
                    node_type="table",
                    base_classes=None,
                    class_name=None,
                    display_name=f"table {table_name}",
                    component_id=component_id
                )
                self.nodes.append(node_obj)
            
            # Check for procedure/function definitions
            proc_match = create_proc_pattern.search(line_stripped)
            if proc_match:
                proc_name = proc_match.group(1)
                component_id = self._get_component_id(proc_name)
                
                # Find end of procedure (look for END or next CREATE)
                end_line = i
                for j in range(i, len(lines)):
                    if re.search(r'\bEND\b', lines[j], re.IGNORECASE):
                        end_line = j + 1
                        break
                
                source_code = "\n".join(lines[i-1:end_line])
                
                node_obj = Node(
                    id=component_id,
                    name=proc_name,
                    component_type="procedure",
                    file_path=str(self.file_path),
                    relative_path=relative_path,
                    source_code=source_code,
                    start_line=i,
                    end_line=end_line,
                    has_docstring=False,
                    docstring="",
                    parameters=None,
                    node_type="procedure",
                    base_classes=None,
                    class_name=None,
                    display_name=f"procedure {proc_name}",
                    component_id=component_id
                )
                self.nodes.append(node_obj)
    
    def _extract_nodes(self, node, top_level_nodes, lines):
        """Recursively extract top-level nodes (tables, procedures, functions)."""
        node_type = None
        node_name = None
        
        # These node types are examples and would depend on the actual DML grammar
        if node.type == "create_table_statement":
            node_type = "table"
            # Look for table_name identifier
            identifier = next((c for c in node.children if c.type == "identifier"), None)
            if identifier:
                node_name = identifier.text.decode()
                
        elif node.type == "create_procedure_statement":
            node_type = "procedure"
            identifier = next((c for c in node.children if c.type == "identifier"), None)
            if identifier:
                node_name = identifier.text.decode()
                
        elif node.type == "create_function_statement":
            node_type = "function"
            identifier = next((c for c in node.children if c.type == "identifier"), None)
            if identifier:
                node_name = identifier.text.decode()
        
        if node_type and node_name:
            component_id = self._get_component_id(node_name)
            relative_path = self._get_relative_path()
            node_obj = Node(
                id=component_id,
                name=node_name,
                component_type=node_type,
                file_path=str(self.file_path),
                relative_path=relative_path,
                source_code="\n".join(lines[node.start_point[0]:node.end_point[0]+1]),
                start_line=node.start_point[0]+1,
                end_line=node.end_point[0]+1,
                has_docstring=False,
                docstring="",
                parameters=None,
                node_type=node_type,
                base_classes=None,
                class_name=None,
                display_name=f"{node_type} {node_name}",
                component_id=component_id
            )
            self.nodes.append(node_obj)
            top_level_nodes[node_name] = node_obj
        
        # Recursively process children
        for child in node.children:
            self._extract_nodes(child, top_level_nodes, lines)
    
    def _extract_relationships(self, node, top_level_nodes):
        """Extract relationships between database objects."""
        
        # Example: procedure calls another procedure
        if node.type == "call_statement":
            containing_proc = self._find_containing_procedure(node, top_level_nodes)
            if containing_proc:
                containing_proc_id = self._get_component_id(containing_proc)
                
                # Get called procedure name
                identifier = next((c for c in node.children if c.type == "identifier"), None)
                if identifier:
                    called_proc = identifier.text.decode()
                    self.call_relationships.append(CallRelationship(
                        caller=containing_proc_id,
                        callee=called_proc,
                        call_line=node.start_point[0]+1,
                        is_resolved=False
                    ))
        
        # Example: SELECT from table
        if node.type == "select_statement":
            containing_proc = self._find_containing_procedure(node, top_level_nodes)
            if containing_proc:
                containing_proc_id = self._get_component_id(containing_proc)
                
                # Look for table references in FROM clause
                for child in node.children:
                    if child.type == "from_clause":
                        for table_node in child.children:
                            if table_node.type == "identifier":
                                table_name = table_node.text.decode()
                                if table_name in top_level_nodes:
                                    table_id = self._get_component_id(table_name)
                                    self.call_relationships.append(CallRelationship(
                                        caller=containing_proc_id,
                                        callee=table_id,
                                        call_line=node.start_point[0]+1,
                                        is_resolved=True
                                    ))
        
        # Recursively process children
        for child in node.children:
            self._extract_relationships(child, top_level_nodes)
    
    def _find_containing_procedure(self, node, top_level_nodes):
        """Find the procedure/function that contains this node."""
        current = node.parent
        while current:
            if current.type in ["create_procedure_statement", "create_function_statement"]:
                # Get procedure/function name
                identifier = next((c for c in current.children if c.type == "identifier"), None)
                if identifier:
                    proc_name = identifier.text.decode()
                    if proc_name in top_level_nodes:
                        return proc_name
            current = current.parent
        return None


def analyze_dml_file(file_path: str, content: str, repo_path: str = None) -> Tuple[List[Node], List[CallRelationship]]:
    """
    Analyze a DML file and extract nodes and relationships.
    
    Args:
        file_path: Path to the DML file
        content: Content of the file
        repo_path: Root path of the repository
        
    Returns:
        Tuple of (nodes, call_relationships)
    """
    analyzer = TreeSitterDMLAnalyzer(file_path, content, repo_path)
    return analyzer.nodes, analyzer.call_relationships
