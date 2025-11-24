const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const inboxRoutes = require("./routes/inbox");
const promptRoutes = require("./routes/prompts");
const agentRoutes = require("./routes/agent");
const draftRoutes = require("./routes/drafts");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/inbox", inboxRoutes);
app.use("/prompts", promptRoutes);
app.use("/agent", agentRoutes);
app.use("/drafts", draftRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
