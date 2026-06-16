import * as http from "node:http";
import { RestTransport } from "../sdk/client.js";
const requests = [];
const server = http.createServer((req, res) => {
    if (!req.url?.includes("/api/v1/tasks/task_reconnect/events")) {
        res.writeHead(404);
        res.end();
        return;
    }
    requests.push(req.headers["last-event-id"]);
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    if (requests.length === 1) {
        res.write('id: 1\nevent: queued\ndata: {"progress":0}\n\n');
        res.write('id: 2\nevent: probing\ndata: {"progress":0.2}\n\n');
        res.end();
        return;
    }
    res.write('id: 3\nevent: done\ndata: {"progress":1,"run_id":"run_reconnect"}\n\n');
    res.end();
});
const port = await listen(server);
const transport = new RestTransport(`http://127.0.0.1:${port}`);
const events = [];
await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("timed out waiting for reconnect done event")), 5000);
    const stop = transport.streamEvents("task_reconnect", (event) => {
        events.push(event);
        if (event.event === "done") {
            clearTimeout(timeout);
            stop();
            resolve();
        }
    });
});
server.close();
if (requests[0] !== undefined)
    throw new Error(`first request should not send Last-Event-ID: ${requests[0]}`);
if (requests[1] !== "2")
    throw new Error(`reconnect should send Last-Event-ID=2: ${JSON.stringify(requests)}`);
if (events.map((event) => event.event).join(",") !== "queued,probing,done") {
    throw new Error(`unexpected events: ${JSON.stringify(events)}`);
}
console.log("sse reconnect check passed");
function listen(server) {
    return new Promise((resolve) => {
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            if (!address || typeof address === "string")
                throw new Error("server did not bind a TCP port");
            resolve(address.port);
        });
    });
}
