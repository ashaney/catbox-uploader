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
        // Get the original request data
        const originalRequest = req.clone();
        const formData = await originalRequest.formData();
        
        console.log("Proxying request to catbox.moe");
        
        // Create a new FormData object for the outgoing request
        const outgoingFormData = new FormData();
        
        // Get the reqtype from the form data
        const reqtype = formData.get('reqtype');
        console.log("Request type:", reqtype);
        
        // Add the reqtype to the outgoing form data
        if (reqtype) {
          outgoingFormData.append('reqtype', reqtype.toString());
        } else {
          console.error("No reqtype found in the request");
          return new Response("Missing reqtype parameter", { 
            status: 400,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "text/plain",
            }
          });
        }
        
        // If this is a file upload, handle the file
        if (reqtype === 'fileupload') {
          const file = formData.get('fileToUpload');
          if (file instanceof File) {
            console.log(`Processing file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
            
            // Check if file size is within limits (catbox.moe has a 200MB limit)
            if (file.size > 200 * 1024 * 1024) {
              return new Response("File size exceeds the 200MB limit", { 
                status: 413,
                headers: {
                  "Access-Control-Allow-Origin": "*",
                  "Content-Type": "text/plain",
                }
              });
            }
            
            // Add the file to the outgoing form data
            outgoingFormData.append('fileToUpload', file);
          } else {
            console.error("No valid file found in the request");
            return new Response("No valid file found in the request", { 
              status: 400,
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/plain",
              }
            });
          }
        }
        
        // Forward the request to catbox.moe
        const response = await fetch("https://catbox.moe/user/api.php", {
          method: "POST",
          body: outgoingFormData,
        });
        
        // Log the response status
        console.log("Catbox.moe API response status:", response.status);
        
        // Get the response text
        const responseText = await response.text();
        console.log("Catbox.moe API response:", responseText);
        
        // Return the response with CORS headers
        return new Response(responseText, {
          status: response.status,
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