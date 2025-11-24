import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import InboxPage from "./pages/InboxPage";
import PromptsPage from "./pages/PromptsPage";
import AgentPage from "./pages/AgentPage";
import DraftsPage from "./pages/DraftsPage";

export default function App() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Inbox", icon: "📧" },
    { path: "/agent", label: "Agent Chat", icon: "🤖" },
    { path: "/prompts", label: "Prompt Brain", icon: "🧠" },
    { path: "/drafts", label: "Drafts", icon: "📝" }
  ];

  return (
    <div className="app-container">
      <header className="topbar">
        <h1 className= "logo">Email Agent</h1>
        <nav>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? "active" : ""}
            >
              {/* <span>{item.icon}</span> */}
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<InboxPage />} />
          <Route path="/agent" element={<AgentPage />} />
          <Route path="/prompts" element={<PromptsPage />} />
          <Route path="/drafts" element={<DraftsPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="flex items-center justify-center gap-sm">
          <span>Your intelligent email companion—always learning.</span>
        </div>
      </footer>
    </div>
  );
}
