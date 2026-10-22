import json
import uvicorn
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mcp.server import Server
from mcp.server.sse import SseServerTransport
from mcp.types import Tool, TextContent

mcp_server = Server("alexa-plus-tools")

DAILY_PROBLEMS = [
    {
        "id": "1",
        "type": "Java DSA",
        "question": "Write an algorithm to rotate an array to the right by k steps.",
        "difficulty": "Medium"
    },
    {
        "id": "2",
        "type": "Quantitative Aptitude",
        "question": "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
        "difficulty": "Easy"
    }
]

@mcp_server.list_tools()
async def handle_list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_daily_problem",
            description="Fetches the mock daily problem for Java DSA or Quantitative Aptitude.",
            inputSchema={"type": "object", "properties": {}}
        ),
        Tool(
            name="evaluate_logic",
            description="Evaluates a user's verbal algorithm approach for Time/Space complexity.",
            inputSchema={
                "type": "object",
                "properties": {
                    "verbal_approach": {"type": "string", "description": "User's verbal description of the approach (e.g., 'two pointer approach')"},
                    "problem_context": {"type": "string", "description": "The problem they are solving"}
                },
                "required": ["verbal_approach"]
            }
        ),
        Tool(
            name="fetch_tech_news",
            description="Fetches 2-3 headlines about recent developer updates.",
            inputSchema={"type": "object", "properties": {}}
        )
    ]

@mcp_server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "get_daily_problem":
        import random
        problem = random.choice(DAILY_PROBLEMS)
        return [TextContent(type="text", text=json.dumps(problem))]
        
    elif name == "evaluate_logic":
        approach = arguments.get("verbal_approach", "").lower()
        if "two pointer" in approach:
            evaluation = "Excellent approach! A two-pointer technique typically reduces Time Complexity to O(N) and Space Complexity to O(1)."
        elif "hash" in approach or "map" in approach:
            evaluation = "Good thought. Using a HashMap gives O(N) Time Complexity, but remember it takes O(N) Space Complexity."
        else:
            evaluation = "That's an interesting approach. Usually, brute force takes O(N^2) Time Complexity. Can we optimize it to O(N)?"
        return [TextContent(type="text", text=evaluation)]
        
    elif name == "fetch_tech_news":
        news = [
            "AWS announces new Bedrock capabilities for Agentic workflows.",
            "Next.js 15 RC introduces new caching strategies.",
            "Python 3.13 released with experimental JIT compiler."
        ]
        return [TextContent(type="text", text=json.dumps(news))]
    
    raise ValueError(f"Unknown tool: {name}")

app = FastAPI()

# SECURITY SPECIFICATION: Restrict Origins to prevent DNS rebinding
ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*", "MCP-Protocol-Version", "MCP-Session-Id"],
)

# SPECIFICATION: Single Endpoint for Streamable HTTP transport
sse_transport = SseServerTransport("/mcp")

def validate_origin(request: Request):
    """Spec: Servers MUST validate the Origin header on all incoming connections."""
    origin = request.headers.get("origin")
    if origin and origin not in ALLOWED_ORIGINS:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid Origin")

@app.get("/mcp")
async def sse_endpoint(request: Request):
    """Spec: GET establishes the Streamable HTTP SSE stream."""
    validate_origin(request)
    async with sse_transport.connect_sse(request.scope, request.receive, request._send) as streams:
        await mcp_server.run(streams[0], streams[1], mcp_server.create_initialization_options())

@app.post("/mcp")
async def messages_endpoint(request: Request):
    """Spec: POST handles client messages on the exact same endpoint."""
    validate_origin(request)
    await sse_transport.handle_post_message(request.scope, request.receive, request._send)

if __name__ == "__main__":
    # SPECIFICATION: Bind ONLY to localhost (127.0.0.1) instead of 0.0.0.0
    uvicorn.run(app, host="127.0.0.1", port=8000)
