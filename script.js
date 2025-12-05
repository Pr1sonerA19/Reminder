document.getElementById('notificationForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const statusMessageEl = document.getElementById('status-message');
    statusMessageEl.innerHTML = '<span class="text-glitch-shadow">INITIATING...</span> // CALCULATING TIMESTAMPS...';

    // Collect checked tags
    const tagsAll = document.querySelectorAll('input[name="tags"]:checked');
    const selectedTags = [];
    tagsAll.forEach(checkbox => {
        selectedTags.push(checkbox.value);
    });
    const tagsString = selectedTags.join(',');

    // Get form values
    const message = document.getElementById('message').value;
    const datetimeStr = document.getElementById('datetime').value;
    // Default to 1 day if empty or invalid
    const repeatDays = parseInt(document.getElementById('repeatDays').value) || 1; 
    const title = document.getElementById('title').value;
    const topic = document.getElementById('topic').value;
    const key = document.getElementById('key').value;

    const ntfyUrl = `https://ntfy.xmtp.net/${topic}`; 

    // --- Validation ---
    // If the user wants to repeat, they MUST select a start time.
    if (repeatDays > 1 && !datetimeStr) {
        statusMessageEl.innerHTML = '<span class="text-glitch-error">ERROR: Start Time Required for Loop.</span>';
        return;
    }

    // --- Prepare Transmission Loop ---
    const requests = [];
    const baseDate = datetimeStr ? new Date(datetimeStr) : null;

    // Loop for X days
    for (let i = 0; i < repeatDays; i++) {
        
        // Dynamic Headers
        // If repeating, we append (1/X), (2/X) to the title so you know which day it is.
        const currentTitle = repeatDays > 1 ? `${title} (${i + 1}/${repeatDays})` : title;

        const headers = {
            'Content-Type': 'text/plain',
            'Authorization': `Bearer ${key}`,
            'Title': currentTitle,
            'Tags': tagsString
        };

        // Calculate Time Offset
        if (baseDate) {
            if (isNaN(baseDate.getTime())) {
                statusMessageEl.innerHTML = '<span class="text-glitch-error">ERROR: Invalid Schedule Time.</span>';
                return;
            }

            // Create a new date object for this iteration: Base Date + i days
            const scheduledDate = new Date(baseDate);
            scheduledDate.setDate(baseDate.getDate() + i);

            // Convert to Unix Timestamp (Seconds)
            const unixTimestamp = Math.floor(scheduledDate.getTime() / 1000);
            headers['X-Delay'] = unixTimestamp;
        } else if (i > 0) {
            // Safety Check: If no date is provided, we cannot repeat "instantly" 
            // multiple times or it sends spam. We break the loop after the first send.
            break; 
        }

        // Push the fetch promise to our array
        const req = fetch(ntfyUrl, {
            method: 'PUT',
            headers: headers,
            body: message
        });
        requests.push(req);
    }

    // --- Execute Batch Transmission ---
    try {
        statusMessageEl.innerHTML = `<span class="text-glitch-shadow">TRANSMITTING...</span> // PACKETS: ${requests.length}`;
        
        // Wait for all requests to finish
        const responses = await Promise.all(requests);
        
        // Check if all were successful
        const allOk = responses.every(r => r.ok);

        if (allOk) {
            statusMessageEl.innerHTML = `<span class="text-glitch-success">SUCCESS: ${requests.length} Notifications Queued.</span> // STATUS 200`;
            
            // Store original values before form reset
            const originalTopic = topic;
            const originalKey = key;
            
            document.getElementById('notificationForm').reset();
            
            // Restore persistent fields
            document.getElementById('topic').value = originalTopic; 
            document.getElementById('key').value = originalKey; 
            document.getElementById('repeatDays').value = "1"; // Reset repeats to 1

        } else {
            statusMessageEl.innerHTML = `<span class="text-glitch-error">PARTIAL ERROR: Some packets dropped.</span>`;
        }
    } catch (error) {
        statusMessageEl.innerHTML = '<span class="text-glitch-error">FATAL ERROR: Network Interruption.</span>';
        console.error('Error:', error);
    }
});
