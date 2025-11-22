"""
AI Chatbot API Routes
Handles conversational queries and code generation for custom analysis
"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

router = APIRouter()

class ChatMessage(BaseModel):
    """Chat message structure"""
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = datetime.now()

class ChatRequest(BaseModel):
    """Chat request with conversation history"""
    message: str
    conversation_id: Optional[str] = None
    context: Optional[dict] = None

class ChatResponse(BaseModel):
    """Chat response"""
    message: str
    conversation_id: str
    code: Optional[str] = None
    visualization: Optional[dict] = None
    suggestions: Optional[List[str]] = None

class CodeExecutionRequest(BaseModel):
    """Request to execute generated code"""
    code: str
    context: Optional[dict] = None

# In-memory conversation storage (use Redis/database in production)
conversations = {}

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Send a message to the AI chatbot
    Handles natural language queries about claims and fraud patterns
    """
    try:
        import uuid
        from services.ai_chatbot import AIChatbot
        
        # Initialize or retrieve conversation
        if not request.conversation_id:
            conversation_id = str(uuid.uuid4())
            conversations[conversation_id] = []
        else:
            conversation_id = request.conversation_id
            if conversation_id not in conversations:
                conversations[conversation_id] = []
        
        # Add user message to history
        conversations[conversation_id].append(ChatMessage(
            role="user",
            content=request.message
        ))
        
        # Initialize chatbot
        chatbot = AIChatbot()
        
        # Detect intent
        intent = chatbot.detect_intent(request.message)
        
        # Generate response based on intent
        if intent == "code_generation":
            # User wants to generate visualization or analysis code
            response_text, code = await chatbot.generate_code(
                request.message,
                context=request.context
            )
            
            response = ChatResponse(
                message=response_text,
                conversation_id=conversation_id,
                code=code,
                suggestions=[
                    "Modify the chart type",
                    "Filter by date range",
                    "Export results to CSV"
                ]
            )
            
        elif intent == "data_query":
            # User wants to query specific data
            response_text = await chatbot.query_data(
                request.message,
                context=request.context
            )
            
            response = ChatResponse(
                message=response_text,
                conversation_id=conversation_id,
                suggestions=[
                    "Show more details",
                    "Compare with previous period",
                    "Generate report"
                ]
            )
            
        elif intent == "explanation":
            # User wants explanation of results
            response_text = await chatbot.explain_analysis(
                request.message,
                context=request.context
            )
            
            response = ChatResponse(
                message=response_text,
                conversation_id=conversation_id,
                suggestions=[
                    "Tell me more about Benford's Law",
                    "How does the ML model work?",
                    "What are the key risk factors?"
                ]
            )
            
        else:
            # General conversation
            response_text = await chatbot.generate_response(
                message=request.message,
                history=conversations[conversation_id],
                context=request.context
            )
            
            response = ChatResponse(
                message=response_text,
                conversation_id=conversation_id,
                suggestions=[
                    "Analyze a specific claim",
                    "Show fraud trends",
                    "Generate custom visualization"
                ]
            )
        
        # Add assistant response to history
        conversations[conversation_id].append(ChatMessage(
            role="assistant",
            content=response.message
        ))
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

@router.post("/execute-code")
async def execute_code(request: CodeExecutionRequest):
    """
    Execute generated Python code safely in a sandboxed environment
    Returns the result or visualization data
    """
    try:
        from services.code_executor import CodeExecutor
        
        executor = CodeExecutor()
        result = await executor.execute_safely(
            code=request.code,
            context=request.context
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing code: {str(e)}")

@router.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str):
    """
    Retrieve conversation history
    """
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {
        "conversation_id": conversation_id,
        "messages": conversations[conversation_id]
    }

@router.delete("/conversation/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """
    Delete conversation history
    """
    if conversation_id in conversations:
        del conversations[conversation_id]
        return {"message": "Conversation deleted"}
    
    raise HTTPException(status_code=404, detail="Conversation not found")

@router.websocket("/ws/{conversation_id}")
async def websocket_chat(websocket: WebSocket, conversation_id: str):
    """
    WebSocket endpoint for real-time chat
    """
    await websocket.accept()
    
    # Initialize conversation if doesn't exist
    if conversation_id not in conversations:
        conversations[conversation_id] = []
    
    try:
        from services.ai_chatbot import AIChatbot
        chatbot = AIChatbot()
        
        while True:
            # Receive message
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Add user message
            conversations[conversation_id].append(ChatMessage(
                role="user",
                content=message_data["message"]
            ))
            
            # Generate response (streaming)
            response_text = ""
            async for chunk in chatbot.stream_response(
                message=message_data["message"],
                history=conversations[conversation_id],
                context=message_data.get("context")
            ):
                response_text += chunk
                await websocket.send_json({
                    "type": "chunk",
                    "content": chunk
                })
            
            # Add assistant response
            conversations[conversation_id].append(ChatMessage(
                role="assistant",
                content=response_text
            ))
            
            # Send completion signal
            await websocket.send_json({
                "type": "complete",
                "conversation_id": conversation_id
            })
            
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for conversation {conversation_id}")
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
        await websocket.close()

@router.get("/suggestions")
async def get_suggestions(query: str = ""):
    """
    Get contextual suggestions for user queries
    """
    from services.ai_chatbot import AIChatbot
    chatbot = AIChatbot()
    
    suggestions = chatbot.get_suggestions(query)
    
    return {"suggestions": suggestions}
