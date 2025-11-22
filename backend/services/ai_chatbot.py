"""
AI Chatbot Service
Handles natural language queries and code generation
"""

from typing import List, Dict, Optional, AsyncGenerator
import os

class AIChatbot:
    """AI-powered chatbot for insurance fraud investigations"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.model = "gpt-4"
        
    def detect_intent(self, message: str) -> str:
        """
        Detect user intent from message
        
        Returns:
            Intent type: 'code_generation', 'data_query', 'explanation', or 'general'
        """
        message_lower = message.lower()
        
        # Check for code generation intent
        code_keywords = ['generate', 'create', 'plot', 'chart', 'visualize', 'graph', 'show me']
        if any(keyword in message_lower for keyword in code_keywords):
            return 'code_generation'
        
        # Check for data query intent
        query_keywords = ['how many', 'what is', 'show', 'list', 'find', 'search']
        if any(keyword in message_lower for keyword in query_keywords):
            return 'data_query'
        
        # Check for explanation intent
        explain_keywords = ['why', 'explain', 'how does', 'what causes', 'understand']
        if any(keyword in message_lower for keyword in explain_keywords):
            return 'explanation'
        
        return 'general'
    
    async def generate_code(self, message: str, context: Optional[Dict] = None) -> tuple:
        """
        Generate Python code for data analysis or visualization
        
        Returns:
            (explanation_text, generated_code)
        """
        # TODO: Integrate with OpenAI API for actual code generation
        # Placeholder response
        
        if 'chart' in message.lower() or 'plot' in message.lower():
            code = """
import matplotlib.pyplot as plt
import pandas as pd

# Sample data
data = {
    'Month': ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    'Fraud_Count': [15, 23, 18, 31, 27]
}

df = pd.DataFrame(data)

# Create visualization
plt.figure(figsize=(10, 6))
plt.bar(df['Month'], df['Fraud_Count'], color='red', alpha=0.7)
plt.title('Monthly Fraud Detection Count')
plt.xlabel('Month')
plt.ylabel('Number of Fraudulent Claims')
plt.grid(axis='y', alpha=0.3)
plt.show()
"""
            
            return ("I've generated a bar chart showing monthly fraud counts. You can modify the data or chart type as needed.", code)
        
        return ("I'll help you generate that code.", "# Code generation placeholder")
    
    async def query_data(self, message: str, context: Optional[Dict] = None) -> str:
        """
        Query data and return results in natural language
        """
        # TODO: Implement actual data querying
        # Placeholder response
        return (
            "Based on the current data, there are 187 flagged claims out of 1,524 total claims, "
            "representing a 12.3% detection rate. The average risk score is 23.7 out of 100."
        )
    
    async def explain_analysis(self, message: str, context: Optional[Dict] = None) -> str:
        """
        Provide explanations about fraud detection methods
        """
        # TODO: Integrate with LLM for detailed explanations
        
        if 'benford' in message.lower():
            return (
                "Benford's Law states that in naturally occurring numerical datasets, "
                "the leading digit is more likely to be small (1 appears ~30% of the time, "
                "9 appears ~4.5%). Fraudulent data often deviates from this distribution because "
                "people tend to fabricate numbers more uniformly or use round numbers."
            )
        
        if 'model' in message.lower() or 'ml' in message.lower():
            return (
                "Our machine learning model uses XGBoost, an ensemble method that combines "
                "multiple decision trees. It's trained on historical claims with known fraud labels "
                "and learns patterns that distinguish fraudulent from legitimate claims. The model "
                "considers factors like claim amount, timing, provider history, and behavioral patterns."
            )
        
        return "I can explain various aspects of our fraud detection system. What would you like to know more about?"
    
    async def generate_response(
        self,
        message: str,
        history: List,
        context: Optional[Dict] = None
    ) -> str:
        """
        Generate general conversational response
        """
        # TODO: Integrate with OpenAI/Anthropic API
        # Placeholder response
        return (
            "I'm an AI assistant specialized in insurance fraud detection for Hong Kong claims. "
            "I can help you analyze claims, generate visualizations, explain detection methods, "
            "and answer questions about the system. How can I assist you today?"
        )
    
    async def stream_response(
        self,
        message: str,
        history: List,
        context: Optional[Dict] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream response in chunks (for WebSocket)
        """
        # TODO: Implement streaming with OpenAI API
        response = await self.generate_response(message, history, context)
        
        # Simulate streaming
        words = response.split()
        for word in words:
            yield word + " "
    
    def get_suggestions(self, query: str = "") -> List[str]:
        """
        Get contextual suggestions for user queries
        """
        suggestions = [
            "Analyze claim CLM12345678",
            "Show fraud trends for last 30 days",
            "Generate a risk score distribution chart",
            "Which providers have highest fraud rates?",
            "Explain how Benford's Law detects fraud",
            "Show geographic fraud hotspots in Hong Kong",
            "Create a network graph of suspicious connections",
            "What are the top risk factors?",
            "Compare this month to last month",
            "Export high-risk claims to CSV"
        ]
        
        if query:
            # Filter suggestions based on query
            query_lower = query.lower()
            suggestions = [s for s in suggestions if any(word in s.lower() for word in query_lower.split())]
        
        return suggestions[:5]  # Return top 5
