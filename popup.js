document.addEventListener('DOMContentLoaded', () => {
    // Fetch and display public IP address
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            let infoDiv = document.getElementById('info');
            let ipDiv = document.createElement('div');
            ipDiv.textContent = `Public IP Address: ${data.ip}`;
            infoDiv.appendChild(ipDiv);
        })
        .catch(error => console.error('Error fetching IP address:', error));

    // Get and display browser and OS details
    const infoDiv = document.getElementById('info');
    const browserDetailsDiv = document.createElement('div');

    // Get browser and OS details
    const browserName = navigator.userAgentData?.brands
        ? navigator.userAgentData.brands.map(brand => `${brand.brand} ${brand.version}`).join(', ')
        : navigator.userAgent;
    const platform = navigator.platform || 'Unknown Platform';
    const userAgent = navigator.userAgent || 'Unknown User Agent';
    const language = navigator.language || 'Unknown Language';

    // Display details
    browserDetailsDiv.innerHTML = `
      <p><strong>Browser Details:</strong></p>
      <p>Browser: ${browserName}</p>
      <p>Platform: ${platform}</p>
      <p>User Agent: ${userAgent}</p>
      <p>Language: ${language}</p>
    `;
    infoDiv.appendChild(browserDetailsDiv);

    // Other functionality
    const downloadVideoBtn = document.getElementById('download-video');
    const takeScreenshotBtn = document.getElementById('take-screenshot');
    const screenRecordBtn = document.getElementById('screen-record');
    const recordingPreview = document.getElementById('recording-preview');

    // Check for video on the page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabs[0].id },
                func: () => document.querySelector('video')?.src || null,
            },
            (results) => {
                if (results && results[0].result) {
                    downloadVideoBtn.disabled = false;
                    downloadVideoBtn.addEventListener('click', () => {
                        chrome.downloads.download({ url: results[0].result });
                    });
                }
            }
        );
    });

    // Take Screenshot
    takeScreenshotBtn.addEventListener('click', () => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'screenshot.png';
            link.click();
        });
    });

    // Screen Recording
    let mediaRecorder;
    let recordedChunks = [];
    screenRecordBtn.addEventListener('click', async () => {
        if (screenRecordBtn.textContent === 'Start Recording') {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            mediaRecorder = new MediaRecorder(stream);
            recordedChunks = [];
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                recordingPreview.src = url;
                recordingPreview.style.display = 'block';

                const link = document.createElement('a');
                link.href = url;
                link.download = 'recording.webm';
                link.click();
            };
            mediaRecorder.start();
            screenRecordBtn.textContent = 'Stop Recording';
        } else {
            mediaRecorder.stop();
            screenRecordBtn.textContent = 'Start Recording';
        }
    });
});
