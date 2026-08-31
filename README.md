# 📊 Project Dashboard

A lightweight, zero-dependency, client-side Gantt-style timeline application designed for Technical Program & Project Managers. It visualizes project portfolios, delivery roadmaps, project sizing, delivery status/health, and team workloads directly in any modern web browser.

---

## 🚀 Key Features

- **Zero Dependencies & Offline Ready:** Pure vanilla HTML5, CSS3, and modern ES6+ JavaScript. Runs offline directly via `file:///` without local web servers, CDNs, or external parsers.
- **Embedded Baseline Dataset:** Contains an embedded dataset inside the HTML file so stakeholders and reviewers can open the file and view the roadmap immediately without uploading anything.
- **Dual Data Ingestion:** Supports dynamic file drag-and-drop or file upload for both **`.csv`** and **`.json`** datasets with UTF-8 BOM auto-stripping.
- **Dedicated Project Lanes:** Strict $1\text{ Project} = 1\text{ Row}$ sub-lane rendering for clear, collision-free portfolio tracking.
- **Dynamic Project Sizing:** Visual bar thickness scales proportionally according to project T-Shirt size (`S`, `M`, `L`, `XL`).
- **Rich Multi-Tier Tooltips:**
  - **Overall Header Tooltip:** Full summary of active PM counts, project totals, size distributions, and status health.
  - **Quarter & Month Axis Tooltips:** Real-time statistics of projects active across specific quarters and months.
  - **Project Manager Workload Tooltip:** Side-anchored summary of size distributions and health metrics per PM.
  - **Project Hover Card:** Floating dark slate card revealing project title, true-length date bar, duration, external link, size, and status.
- **Flexible Controls & Filters:**
  - **Multi-Select Filters:** Filter dynamically by Project Manager, Project Size, and Delivery Status.
  - **View Modes:** Toggle between `Compact` (resting bars with hover expansion), `Super Compact` (dynamically collapsed row heights to eliminate false gaps), and `Full Info` (all project cards permanently expanded).
  - **Colour Modes:** Render bars with a `Status to PM` horizontal gradient, solid `Project Manager` colour, or solid `Status` colour.
  - **Zoom & Pan Controls:** Smooth horizontal scaling from $100\%$ up to $400\%$.
  - **Today Marker:** Prominent red vertical indicator marking the current date.

---

## 🛠️ Getting Started

### 1. Quick Start (No Setup Required)
Simply double-click `index.html` to open it in any modern browser (Chrome, Edge, Firefox, Safari). The built-in embedded dataset loads automatically.

### 2. Loading Custom Data
Click **`📁 Upload CSV / JSON`** in the top-right toolbar to load your own project register file.

---

## 📋 Data Formats & Field Specification

The dashboard includes a flexible normalization engine that automatically detects common column header variations.

### Supported Fields

| Field | Accepted Header Names | Description & Allowed Values |
| :--- | :--- | :--- |
| **Project Manager** | `Project Manager`, `PM`, `project_manager`, `projectManager` | Assignee name (Default: `Unassigned`). |
| **Project Name** | `Project Name`, `Project`, `project_name`, `projectName`, `name` | Project title (Default: `Untitled Project`). |
| **Start Date** | `Start Date`, `Start`, `start_date`, `startDate` | Date format: `DD-Mon-YYYY` (e.g. `15-Jul-2026`) or `YYYY-MM-DD`. |
| **End / Due Date** | `End/Due Date`, `Due Date`, `End Date`, `End`, `end_date`, `endDate` | Date format: `DD-Mon-YYYY` (e.g. `15-Oct-2026`) or `YYYY-MM-DD`. |
| **Status** | `RAG Status`, `RAG`, `Status`, `rag_status`, `status` | `GREEN`, `AMBER`, `RED`, `COMPLETED` / `DONE`, `TODO` / `NOT STARTED`, `BLOCKED`. |
| **Size** | `Size`, `Project Size`, `T-Shirt Size`, `Tshirt Size`, `T-Shirt` | `S` (6px), `M` (10px), `L` (14px), `XL` (18px) (Default: `S`). |
| **Hyperlink** | `URL`, `Link`, `Jira`, `Confluence`, `Project URL`, `Project Link` | Optional URL. Opens in a new tab (`target="_blank"`). |

---

### CSV Format Example (`sample_projects.csv`)

```csv
Project Manager,Project Name,Start Date,End/Due Date,RAG Status,URL,Size
Michael Jackson,Core API Gateway Modernization,15-Jul-2026,15-Oct-2026,GREEN,[https://example.com/jira/PROJ-101,M](https://example.com/jira/PROJ-101,M)
Sam Taylor,Payment Processing Engine V2,30-Mar-2026,10-Aug-2026,GREEN,,M
Sam Taylor,Real-Time Fraud Detection Engine,30-Mar-2026,28-Sep-2026,GREEN,,M
Jordan Lee,Cloud Database Migration (Aurora),25-Sep-2025,31-Mar-2026,COMPLETED,[https://example.com/wiki/cloud-migration,M](https://example.com/wiki/cloud-migration,M)
Chris Evans,Microservices Architecture Transition,06-Jun-2026,15-Dec-2026,GREEN,,L
Chris Evans,Global CDN & Edge Compute Rollout,19-Aug-2026,30-Jun-2027,TODO,,M
Pat Robinson,Zero-Trust Authentication Engine,01-Jun-2026,31-Dec-2026,GREEN,,S
Jordan Lee,Legacy Monolith Decommissioning,22-Jul-2026,31-Mar-2027,GREEN,[https://example.com/wiki/monolith-sunset,XL](https://example.com/wiki/monolith-sunset,XL)
