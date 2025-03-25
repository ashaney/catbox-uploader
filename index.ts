import { serve } from "bun";
import { join } from "path";
import { statSync, existsSync } from "fs";

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = import.meta.dir;

console.log(`Starting Catbox Uploader server on port ${PORT}...`);

// Simple static file server
const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;
    
    // Handle CORS proxy for catbox.moe API
    if (path === "/proxy/catbox") {
      try {
        const originalRequest = req.clone();
        const formData = await originalRequest.formData();
        
        // Forward the request to catbox.moe
        const response = await fetch("https://catbox.moe/user/api.php", {
          method: "POST",
          body: formData,
        });
        
        // Return the response with CORS headers
        const responseText = await response.text();
        return new Response(responseText, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "text/plain",
          },
        });
      } catch (error) {
        console.error("Proxy error:", error);
        return new Response(`Proxy error: ${error instanceof Error ? error.message : String(error)}`, { 
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/plain",
          }
        });
      }
    }
    
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    
    // Default to index.html for root path
    if (path === "/") {
      path = "/index.html";
    }
    
    // Handle paths for public directory
    if (path.startsWith("/public/")) {
      const filePath = join(PUBLIC_DIR, path);
      
      if (existsSync(filePath)) {
        const file = Bun.file(filePath);
        const contentType = getMimeType(path);
        
        return new Response(file, {
          headers: {
            "Content-Type": contentType,
          },
        });
      }
    }
    
    const filePath = join(PUBLIC_DIR, path);
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return new Response("Not Found", { status: 404 });
    }
    
    try {
      // Get file stats
      const stats = statSync(filePath);
      
      if (stats.isDirectory()) {
        return new Response("Forbidden", { status: 403 });
      }
      
      // Serve the file
      const file = Bun.file(filePath);
      const contentType = getMimeType(path);
      
      return new Response(file, {
        headers: {
          "Content-Type": contentType,
        },
      });
    } catch (error) {
      console.error(`Error serving ${filePath}:`, error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`Catbox Uploader is running at http://localhost:${PORT}`);

// Helper function to determine MIME type
function getMimeType(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}