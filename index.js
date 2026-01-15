
// Get elements
const speedNumber = document.getElementById('speedNumber');
const status = document.getElementById('status');
const metrics = document.getElementById('metrics');
const ping = document.getElementById('ping');
const upload = document.getElementById('upload');

let testing = false;

// Start test on click anywhere
document.body.addEventListener('click', () => {
    if (!testing) {
        runTest();
    }
});

async function runTest() {
    testing = true;
    metrics.classList.remove('show');
    
    // Reset values
    speedNumber.textContent = '--';
    ping.textContent = '-- ms';
    upload.textContent = '-- MB/s';

    try {
        // Test ping first
        status.textContent = 'Testing ping...';
        speedNumber.classList.add('loading');
        const pingResult = await testPing();
        ping.textContent = `${pingResult} ms`;

        // Test download with live updates
        status.textContent = 'Testing download...';
        const downloadResult = await testDownload();
        speedNumber.textContent = downloadResult;
        speedNumber.classList.remove('loading');

        // Test upload
        status.textContent = 'Testing upload...';
        const uploadResult = await testUpload();
        upload.textContent = `${uploadResult} MB/s`;

        // Show results
        status.textContent = 'Test complete';
        metrics.classList.add('show');
        
    } catch (error) {
        status.textContent = 'Error - Click to retry';
        speedNumber.textContent = '--';
        console.error(error);
    }

    testing = false;
}

// Ping test
async function testPing() {
    const measurements = [];
    for (let i = 0; i < 3; i++) {
        const start = performance.now();
        await fetch('https://cloudflare.com/cdn-cgi/trace', { 
            method: 'HEAD',
            cache: 'no-store'
        });
        const end = performance.now();
        measurements.push(end - start);
    }
    const avg = measurements.reduce((a, b) => a + b) / measurements.length;
    return Math.round(avg);
}

// Download test - runs for 5 seconds and calculates average
async function testDownload() {
    const testDuration = 5000; // 5 seconds
    const startTime = performance.now();
    let totalBytes = 0;
    let downloadCount = 0;
    
    // Keep downloading for 5 seconds
    while (performance.now() - startTime < testDuration) {
        const fileSize = 5 * 1024 * 1024; // 5 MB chunks
        const url = `https://speed.cloudflare.com/__down?bytes=${fileSize}`;
        
        const chunkStart = performance.now();
        const response = await fetch(url);
        await response.blob();
        const chunkEnd = performance.now();
        
        totalBytes += fileSize;
        downloadCount++;
        
        // Update display with current average
        const elapsed = (chunkEnd - startTime) / 1000;
        const currentSpeed = (totalBytes / (1024 * 1024)) / elapsed;
        speedNumber.textContent = currentSpeed.toFixed(1);
    }
    
    // Calculate final average speed
    const totalDuration = (performance.now() - startTime) / 1000;
    const avgSpeed = (totalBytes / (1024 * 1024)) / totalDuration;
    return avgSpeed.toFixed(1);
}

// Upload test - runs for 5 seconds and calculates average
async function testUpload() {
    const testDuration = 5000; // 5 seconds
    const startTime = performance.now();
    let totalBytes = 0;
    
    // Keep uploading for 5 seconds
    while (performance.now() - startTime < testDuration) {
        const dataSize = 1 * 1024 * 1024; // 1 MB chunks
        
        // Create data in chunks (crypto has 65536 byte limit)
        const chunkSize = 65536;
        const chunks = [];
        for (let i = 0; i < dataSize; i += chunkSize) {
            const chunk = new Uint8Array(chunkSize);
            crypto.getRandomValues(chunk);
            chunks.push(chunk);
        }
        
        const data = new Blob(chunks);
        
        await fetch('https://speed.cloudflare.com/__up', {
            method: 'POST',
            body: data
        });
        
        totalBytes += dataSize;
    }
    
    // Calculate final average speed
    const totalDuration = (performance.now() - startTime) / 1000;
    const avgSpeed = (totalBytes / (1024 * 1024)) / totalDuration;
    return avgSpeed.toFixed(1);
}