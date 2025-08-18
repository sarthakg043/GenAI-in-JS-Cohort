
export async function findAvailablePort(startPort = 8080) {
  const net = await import('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      // Port is busy, try next one
      resolve(findAvailablePort(startPort + 1));
    });
  });
}