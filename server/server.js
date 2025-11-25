const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();

const inboxRoutes = require("./routes/inbox");
const promptRoutes = require("./routes/prompts");
const agentRoutes = require("./routes/agent");
const inboxAgentRoutes = require("./routes/inbox-agent");
const draftRoutes = require("./routes/drafts");
const agentResultsRoutes = require("./routes/agent_results");
const conversationsRoutes = require("./routes/conversations");
const { connect } = require("./utils/db");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/inbox", inboxRoutes);
app.use("/prompts", promptRoutes);
app.use("/agent", agentRoutes);
app.use("/inbox-agent", inboxAgentRoutes);
app.use("/drafts", draftRoutes);
app.use("/agent-results", agentResultsRoutes);
app.use("/conversations", conversationsRoutes);

const PORT = process.env.PORT || 5000;

(async () => {
    try {
        await connect();
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
})();
