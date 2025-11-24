const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const inboxRoutes = require("./routes/inbox");
const promptRoutes = require("./routes/prompts");
const agentRoutes = require("./routes/agent");
const inboxAgentRoutes = require("./routes/inbox-agent");
const draftRoutes = require("./routes/drafts");
const agentResultsRoutes = require("./routes/agent_results");
const conversationsRoutes = require("./routes/conversations");

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

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
