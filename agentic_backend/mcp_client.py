import asyncio
import os
from typing import Dict, Any, Optional
import logging
from mcp.client import Client
from mcp.transport import StreamableHTTPClientTransport

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp_client")

class GitHubMCPClient:
    """
    Client for interacting with the GitHub Copilot MCP Server.
    Enables the backend agent to perform GitHub actions like creating PRs, 
    listing issues, and reading codebase context.
    """
    
    def __init__(self, pat: Optional[str] = None):
        self.pat = pat or os.getenv("GITHUB_PAT")
        self.url = "https://api.githubcopilot.com/mcp/"
        self.client = Client(name="hack-the-vibe-backend", version="1.0")
        self.transport = None

    async def connect(self):
        """Initialize connection to the MCP server via HTTP transport."""
        if not self.pat:
            raise ValueError("GitHub Personal Access Token (PAT) is required for MCP connection.")
        
        logger.info(f"Connecting to GitHub MCP server at {self.url}...")
        
        self.transport = StreamableHTTPClientTransport(
            url=self.url,
            headers={"Authorization": f"Bearer {self.pat}"}
        )
        
        try:
            await self.client.connect(self.transport)
            logger.info("Successfully connected to GitHub MCP.")
        except Exception as e:
            logger.error(f"Failed to connect to MCP: {str(e)}")
            raise

    async def list_available_tools(self):
        """Fetch and return list of tools exposed by the MCP server."""
        if not self.client:
            return []
        tools = await self.client.list_tools()
        return tools

    async def create_pull_request(self, repo: str, title: str, body: str, head: str, base: str = "main"):
        """
        Invoke the MCP tool to create a pull request.
        """
        params = {
            "repository": repo,
            "title": title,
            "body": body,
            "head": head,
            "base": base
        }
        
        logger.info(f"Invoking tool: github_create_pull_request on {repo}")
        
        result = await self.client.call_tool("github_create_pull_request", params=params)
        return result

    async def close(self):
        """Cleanup connection resources."""
        if self.transport:
            # Note: Specific SDK version might require manual transport closure
            logger.info("Closing MCP connection.")
            # await self.transport.close()

# Example usage/test harness
if __name__ == "__main__":
    async def main():
        client = GitHubMCPClient()
        try:
            await client.connect()
            tools = await client.list_available_tools()
            print(f"Discovered {len(tools)} tools via MCP protocol.")
            
            # Example (commented out to avoid execution)
            # res = await client.create_pull_request("owner/repo", "feat: test mcp", "body", "branch")
            
        finally:
            await client.close()

    asyncio.run(main())
