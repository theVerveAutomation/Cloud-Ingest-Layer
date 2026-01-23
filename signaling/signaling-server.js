const db = require("./db-queries");
const io = require("socket.io")(3000, {
    cors: {
        origin: "*", // Allow all origins (Lock this down to your domain in production!)
        methods: ["GET", "POST"]
    }
});

console.log("Signaling Server running on port 3000");

// Map EdgeID -> SocketID
const edges = new Map();

io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id}`);

    // 1. Edge Registration
    socket.on("register_edge", async (edgeId) => {
        edges.set(edgeId, socket.id);
        const data = await db.fetchCamerasForAOrganization(edgeId);
        console.log(`Edge Online: ${edgeId}`);
        socket.emit("edge_registered", { data });
    });

    // 2. Start Stream Command (Frontend -> Cloud -> Edge)
    socket.on("start_relay", (data) => {
        const { targetEdgeId, camId } = data;
        const edgeSocket = edges.get(targetEdgeId);

        if (edgeSocket) {
            console.log(`Requesting relay for ${camId} from ${targetEdgeId}`);
            const ingestPath = `live/${targetEdgeId}_${camId}`;

            io.to(edgeSocket).emit("cmd_stream_push", {
                camId,
                ingestPath
            });
        } else {
            console.log(`Edge ${targetEdgeId} not found!`);
        }
    });

    socket.on("relay_info", (relayData) => {
        console.log(`Relay info received: `, relayData);
        io.to(socket.id).emit("relay_info", relayData);
    });

    // 3. Stop Stream Command
    socket.on("stop_relay", (data) => {
        console.log("Stop relay command received");
        const { targetEdgeId, camId } = data;
        const edgeSocket = edges.get(targetEdgeId);
        if (edgeSocket) {
            io.to(edgeSocket).emit("cmd_stream_stop", { camId });
        }
    });

    // 4. Cleanup on disconnect
    socket.on("disconnect", () => {
        // Optional: Remove edge from map if it disconnects
        for (const [key, value] of edges.entries()) {
            if (value === socket.id) {
                edges.delete(key);
                console.log(`Edge Offline: ${key}`);
                break;
            }
        }
    });
});