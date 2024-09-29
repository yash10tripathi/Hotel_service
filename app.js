const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json());

const FILE_PATH = './requests.json';

const readData = () => {
    const data = fs.readFileSync(FILE_PATH);
    return JSON.parse(data);
};

const writeData = (data) => {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
};

// Initialize JSON file if not existing
if (!fs.existsSync(FILE_PATH)) {
    writeData([]);
}

// POST /requests - Add a new service request
app.post('/requests', (req, res) => {
    const { guestName, roomNumber, requestDetails, priority, status } = req.body;
    const newRequest = {
        id: Math.random().toString(36).substring(7),
        guestName,
        roomNumber,
        requestDetails,
        priority,
        status: status || 'received',
    };

    const requests = readData();
    requests.push(newRequest);
    writeData(requests);

    res.status(201).json(newRequest);
});

// GET /requests - Retrieve all requests sorted by priority
app.get('/requests', (req, res) => {
    const requests = readData();

    // Sort by priority (lower number means higher priority)
    const sortedRequests = requests.sort((a, b) => a.priority - b.priority);

    res.json(sortedRequests);
});

// GET /requests/:id - Retrieve a specific request by its ID
app.get('/requests/:id', (req, res) => {
    const { id } = req.params;
    const requests = readData();
    const request = requests.find(r => r.id === id);

    if (request) {
        res.json(request);
    } else {
        res.status(404).json({ message: "Request not found" });
    }
});

// PUT /requests/:id - Update details or priority of an existing request
app.put('/requests/:id', (req, res) => {
    const { id } = req.params;
    const { guestName, roomNumber, requestDetails, priority, status } = req.body;

    let requests = readData();
    let requestIndex = requests.findIndex(r => r.id === id);

    if (requestIndex !== -1) {
        // Update the found request
        requests[requestIndex] = {
            ...requests[requestIndex],
            guestName: guestName || requests[requestIndex].guestName,
            roomNumber: roomNumber || requests[requestIndex].roomNumber,
            requestDetails: requestDetails || requests[requestIndex].requestDetails,
            priority: priority !== undefined ? priority : requests[requestIndex].priority,
            status: status || requests[requestIndex].status,
        };

        writeData(requests);
        res.json(requests[requestIndex]);
    } else {
        res.status(404).json({ message: "Request not found" });
    }
});

// DELETE /requests/:id - Remove a completed or canceled request
app.delete('/requests/:id', (req, res) => {
    const { id } = req.params;

    let requests = readData();
    const requestIndex = requests.findIndex(r => r.id === id);

    if (requestIndex !== -1) {
        const request = requests[requestIndex];

        if (request.status === 'completed' || request.status === 'canceled') {
            requests.splice(requestIndex, 1);
            writeData(requests);
            res.json({ message: "Request removed successfully" });
        } else {
            res.status(400).json({ message: "Only completed or canceled requests can be deleted" });
        }
    } else {
        res.status(404).json({ message: "Request not found" });
    }
});

// POST /requests/:id/complete - Mark a request as completed
app.post('/requests/:id/complete', (req, res) => {
    const { id } = req.params;

    let requests = readData();
    const requestIndex = requests.findIndex(r => r.id === id);

    if (requestIndex !== -1) {
        requests[requestIndex].status = 'completed';
        writeData(requests);
        res.json({ message: "Request marked as completed" });
    } else {
        res.status(404).json({ message: "Request not found" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
