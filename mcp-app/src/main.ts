import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { z } from "zod";
import fs from "fs";
import path from "path";

// Initialize the Express App
const app = express();
app.use(cors());

// Serve the interactive UI static files
app.use("/ui", express.static(path.join(process.cwd(), "src/ui")));

// Factory function for the MCP Server
function createServer() {
    const server = new McpServer({
        name: "mcp-interactive-app",
        version: "1.0.0"
    });

    // Tool 1: Interactive Tool that returns a UI
    server.tool(
        "show-dashboard",
        "Shows an interactive dashboard UI in the chat",
        {},
        async () => {
            // In MCP Apps, you can return a URI to an interactive UI resource
            return {
                content: [{
                    type: "text",
                    text: "Here is the interactive dashboard! [View Dashboard](http://localhost:3002/ui/index.html)"
                }]
            };
        }
    );

    // Tool 2: Backend API for the UI to call
    server.tool(
        "get-server-time",
        "Gets the current server time for the dashboard",
        {},
        async () => {
            return {
                content: [{ type: "text", text: new Date().toISOString() }]
            };
        }
    );

    return server;
}

// Streamable HTTP Endpoint for MCP Clients (like Claude)
app.all("/mcp", async (req, res) => {
    const server = createServer();
    const transport = new NodeStreamableHTTPServerTransport(req, res);
    await server.connect(transport);
});

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`🚀 MCP App Server running on http://localhost:${PORT}`);
    console.log(`🔗 MCP Endpoint: http://localhost:${PORT}/mcp`);
    console.log(`🖥️  Interactive UI: http://localhost:${PORT}/ui/index.html`);
});
