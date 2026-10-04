"use client";

import { useState } from "react";
import { AgentIcon, FeatureIcon } from "@/components/ui/Icons";
import { site } from "@/data/site";
import {
  workspaceAgentKinds,
  workspaceAudit,
  workspaceFeed,
  workspaceFindings,
  workspaceMenu,
  workspaceReports,
  workspaceStats,
} from "@/data/workspace";

const capitalize = (value) => value[0].toUpperCase() + value.slice(1);

function Sidebar({ view, onSelect }) {
  return (
    <aside className="workspace-sidebar">
      <div className="workspace-sidebar-brand"><span>{site.name}</span></div>
      <div className="workspace-switcher">
        <span className="workspace-avatar">A</span>
        <div><strong>Atlas workspace</strong><small>DEMO ENVIRONMENT</small></div>
        <span className="switcher-chevron">⌄</span>
      </div>
      <span className="sidebar-group-label">WORKSPACE</span>
      <nav aria-label="Workspace preview panels">
        {workspaceMenu.map((item) => (
          <button
            key={item.view}
            type="button"
            onClick={() => onSelect(item.view)}
            className={view === item.view ? "active" : ""}
            aria-current={view === item.view ? "page" : undefined}
          >
            <FeatureIcon name={item.icon} />
            {item.label}
            {item.view === "findings" && <span className="sidebar-count">03</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-divider" />
      <span className="sidebar-group-label">OPERATIONS</span>
      <div className="sidebar-static"><AgentIcon kind="manager" /> Agent network</div>
      <div className="sidebar-static"><FeatureIcon name="targets" /> Scope &amp; targets</div>
      <div className="sidebar-bottom"><span className="sidebar-online" /> All systems operational</div>
    </aside>
  );
}

function ActivityWidget() {
  return (
    <div className="workspace-widget widget-activity">
      <div className="widget-heading"><h4>Activity feed</h4><span>LIVE UPDATES</span></div>
      <div className="feed-list">
        {workspaceFeed.map((item) => (
          <div key={item.actor}>
            <i className={`feed-dot ${item.tone}`} />
            <span><strong>{item.actor}</strong>{` ${item.text}`}<small>{item.meta}</small></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FindingsWidget() {
  return (
    <div className="workspace-widget widget-findings">
      <div className="widget-heading"><h4>Findings</h4><span>03 IN REVIEW</span></div>
      <div className="finding-list">
        {workspaceFindings.map((finding) => (
          <div key={finding.title}>
            <span className={`finding-severity ${finding.severity}`}>{finding.label}</span>
            <span><strong>{finding.title}</strong><small>{finding.meta}</small></span>
            <span className="finding-arrow">↗</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsWidget() {
  return (
    <div className="workspace-widget widget-reports">
      <div className="widget-heading"><h4>Reports</h4><span>02 GENERATED</span></div>
      <div className="report-list">
        {workspaceReports.map((report) => (
          <div key={report.title}>
            <span className="report-file"><FeatureIcon name="audit" /></span>
            <span><strong>{report.title}</strong><small>{report.meta}</small></span>
            <span className="report-ready">READY</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditWidget() {
  return (
    <div className="workspace-widget widget-audit">
      <div className="widget-heading"><h4>Audit log</h4><span>TRACEABLE ACTIONS</span></div>
      <div className="audit-list">
        {workspaceAudit.map((entry) => (
          <div key={entry.time}>
            <span>{entry.time}</span>
            <strong>{entry.title}</strong>
            <small>{entry.source}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function TerminalWidget() {
  return (
    <div className="workspace-widget widget-terminal">
      <div className="widget-heading">
        <h4><span className="terminal-prompt">&gt;_</span> Security operations</h4>
        <span><span className="terminal-led" /> SESSION ACTIVE</span>
      </div>
      <div className="terminal-lines">
        <p><span>{`operator@${site.name.toLowerCase()}`}</span>:~$ mission status --scope authorized</p>
        <p><i>✓</i> Scope validated <span>24 authorized assets</span></p>
        <p><i>✓</i> Agents synchronized <span>5 agents online</span></p>
        <p><i>›</i> Awaiting approval <span>verification gate / 01</span></p>
        <p className="terminal-cursor">_<span /></p>
      </div>
    </div>
  );
}

export default function WorkspacePreview() {
  const [view, setView] = useState("overview");
  const overview = view === "overview";
  const show = (panel) => overview || view === panel;
  const activeItem = workspaceMenu.find((item) => item.view === view);

  return (
    <div className="workspace-window" aria-label={`Interactive sample of the ${site.name} security workspace`}>
      <Sidebar view={view} onSelect={setView} />
      <div className="workspace-body">
        <div className="workspace-topbar">
          <span>Workspace <span>/</span> <strong>{activeItem?.label}</strong></span>
          <div>
            <span className="workspace-topbar-status"><span className="live-dot" /> MISSION ACTIVE</span>
            <span className="workspace-user">SC</span>
          </div>
        </div>
        <div className="workspace-content">
          <div className="workspace-title-row">
            <div>
              <span className="workspace-overline">SECURITY OPERATIONS / LIVE VIEW</span>
              <h3>{overview ? "Mission control" : activeItem?.label}</h3>
              <p>Visibility across every agent, action, and decision.</p>
            </div>
            <span className="workspace-time">DEMO DATA <span>·</span> SESSION 001</span>
          </div>
          <div className="workspace-stat-row">
            {workspaceStats.map((stat) => (
              <div key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}{stat.suffix && <span>{stat.suffix}</span>}</strong>
              </div>
            ))}
          </div>
          <div className="workspace-agents">
            <div className="workspace-agents-header">
              <strong>Agent status</strong>
              <span><span className="live-dot" /> ALL CONNECTED</span>
            </div>
            <div className="workspace-agent-row">
              {workspaceAgentKinds.map((kind) => (
                <div className="workspace-agent" key={kind}>
                  <span className="workspace-agent-icon"><AgentIcon kind={kind} /></span>
                  <span>{capitalize(kind)}</span>
                  <i />
                </div>
              ))}
            </div>
          </div>
          <div className={overview ? "workspace-widgets" : "workspace-widgets focused"}>
            {overview && <ActivityWidget />}
            {show("findings") && <FindingsWidget />}
            {show("reports") && <ReportsWidget />}
            {show("audit") && <AuditWidget />}
            <TerminalWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
