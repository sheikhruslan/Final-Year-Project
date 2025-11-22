"""
Code Executor Service
Safely execute user-generated Python code for custom analysis
"""

import sys
from io import StringIO
from typing import Dict, Any, Optional
import json
import traceback

class CodeExecutor:
    """Safely execute Python code in sandboxed environment"""
    
    def __init__(self):
        self.allowed_modules = [
            'pandas', 'numpy', 'matplotlib', 'seaborn',
            'plotly', 'datetime', 'json', 'math'
        ]
    
    async def execute_safely(self, code: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Execute code in restricted environment
        
        Args:
            code: Python code to execute
            context: Additional context/data to make available
            
        Returns:
            Dict with execution results or error
        """
        try:
            # Create restricted globals
            restricted_globals = {
                '__builtins__': {
                    'print': print,
                    'len': len,
                    'range': range,
                    'enumerate': enumerate,
                    'zip': zip,
                    'map': map,
                    'filter': filter,
                    'sum': sum,
                    'min': min,
                    'max': max,
                    'abs': abs,
                    'round': round,
                    'sorted': sorted,
                    'list': list,
                    'dict': dict,
                    'tuple': tuple,
                    'set': set,
                    'str': str,
                    'int': int,
                    'float': float,
                    'bool': bool,
                }
            }
            
            # Add allowed modules
            for module in self.allowed_modules:
                try:
                    restricted_globals[module] = __import__(module)
                except ImportError:
                    pass
            
            # Add context data
            if context:
                restricted_globals['context'] = context
            
            # Capture stdout
            old_stdout = sys.stdout
            sys.stdout = StringIO()
            
            # Execute code
            exec(code, restricted_globals)
            
            # Get output
            output = sys.stdout.getvalue()
            sys.stdout = old_stdout
            
            return {
                'success': True,
                'output': output,
                'result': restricted_globals.get('result'),
                'message': 'Code executed successfully'
            }
            
        except Exception as e:
            sys.stdout = old_stdout
            
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc(),
                'message': f'Error executing code: {str(e)}'
            }
