document.getElementById('notificationForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const statusMessageEl = document.getElementById('status-message');
    statusMessageEl.innerHTML = '<span class="text-glitch-shadow">INITIATING...</span> // PROCESSING TRANSMISSION...';

    // Collect checked tags
    const tagsAll = document.querySelectorAll('input[name="tags"]:checked');
    const selectedTags = [];
    tagsAll.forEach(checkbox => {
        selectedTags.push(checkbox.value);
    });
    const tagsString = selectedTags.join(',');

    // Get form values
    const message = document.getElementById('message').value;
    const datetime = document.getElementById('datetime').value;
    const title = document.getElementById('title').value;
    const topic = document.getElementById('topic').value;
    const key = document.getElementById('key').value;

    // --- Dynamic URL Construction ---
    const ntfyUrl = `https://ntfy.xmtp.net/${topic}`; 
    // --- Authorization Header uses the input key ---
    const headers = {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${key}`,
        'Title': title,
        'Tags': tagsString
    };

    // Check for scheduled delivery
    if (datetime) {
        const scheduledDate = new Date(datetime);
        if (isNaN(scheduledDate.getTime())) {
             statusMessageEl.innerHTML = '<span class="text-glitch-error">ERROR: Invalid Schedule Time.</span>';
             return;
        }
        const unixTimestamp = Math.floor(scheduledDate.getTime() / 1000);
        // X-Delay header tells ntfy to schedule the notification
        headers['X-Delay'] = unixTimestamp;
    }

    try {
        const response = await fetch(ntfyUrl, {
            method: 'PUT',
            headers: headers,
            body: message
        });

        if (response.ok) {
            statusMessageEl.innerHTML = '<span class="text-glitch-success">SUCCESS: Notification Transmitted.</span> // STATUS 200';
            
            // Store original values before form reset
            const originalTopic = topic;
            const originalKey = key;
            
            document.getElementById('notificationForm').reset();
            
            // Restore the Topic and Key fields after reset for convenience
            document.getElementById('topic').value = originalTopic; 
            document.getElementById('key').value = originalKey; 

        } else {
            statusMessageEl.innerHTML = `<span class="text-glitch-error">ERROR: Transmission Failed.</span> // STATUS ${response.status}`;
        }
    } catch (error) {
        statusMessageEl.innerHTML = '<span class="text-glitch-error">FATAL ERROR: Network Interruption.</span>';
        console.error('Error:', error);
    }
});
