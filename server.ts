import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Scholarship, Application, SystemLog, SecurityAlert, AppTheme, AccessRequest } from "./src/types.js";

// Global data stores (in-memory)
let currentTheme: AppTheme = {
  primaryColor: "#5c3a21",
  bgColor: "#fbf2eb",
  surfaceColor: "#fffaf6",
  accentColor: "#b25329",
  fontColor: "#361e12",
  fontFamily: "Space Grotesk",
  darkMode: false
};

// Admin Permissions List & Google Docs Access Requests
let admins: string[] = ["abdullah.binnasir.abn@gmail.com"];
let accessRequests: AccessRequest[] = [
  {
    id: "req-1",
    name: "Sarah Jenkins",
    email: "s.jenkins@stanford.edu",
    requestedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    message: "Hi Abdullah, I need admin access to review STEM Fellowship applicants and manage the scholarship budget."
  },
  {
    id: "req-2",
    name: "Marcus Aurelius",
    email: "marcus.philosophy@rome.edu",
    requestedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    message: "Requesting access to update the humanities and art scholarship guidelines."
  },
  {
    id: "req-3",
    name: "Elena Rostova",
    email: "elena.r@arts.edu",
    requestedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    status: 'Approved',
    message: "I need access to help select applicants for the Arts & Clay Merit."
  }
];
// Automatically make sure approved request email is also in admins
admins.push("elena.r@arts.edu");

let scholarships: Scholarship[] = [
  {
    id: "1",
    title: "Global Innovators Grant",
    deadline: "2024-10-15",
    awardAmount: 10000,
    status: "Active",
    category: "STEM",
    description: "Supporting students working on breakthrough technologies, high-concurrency systems, or innovative UI paradigms."
  },
  {
    id: "2",
    title: "Women in STEM Fellowship",
    deadline: "2024-11-01",
    awardAmount: 5000,
    status: "Active",
    category: "STEM",
    description: "Dedicated to encouraging women to lead research in computer science, space technology, and mechanical engineering."
  },
  {
    id: "3",
    title: "Community Leadership Award",
    deadline: "2024-12-31",
    awardAmount: 2500,
    status: "Draft",
    category: "Humanities",
    description: "Awarded to grassroots community organizers and student volunteers creating a measurable local impact."
  },
  {
    id: "4",
    title: "Global Arts & Clay Merit",
    deadline: "2024-09-30",
    awardAmount: 12000,
    status: "Active",
    category: "Arts",
    description: "Celebrating experimental designs, physical modeling, ceramic craft, and tactile aesthetic studies."
  },
  {
    id: "5",
    title: "Climate Action Fund",
    deadline: "2024-11-15",
    awardAmount: 8500,
    status: "Active",
    category: "Environment",
    description: "A financial grant targeting student-led ecological stewardship, carbon recapture prototypes, and green power solutions."
  }
];

let applications: Application[] = [
  {
    id: "app-1",
    scholarshipId: "1",
    scholarshipTitle: "Global Innovators Grant",
    studentName: "John Doe",
    studentEmail: "john.doe@gmail.com",
    appliedDate: "2024-07-14",
    status: "Pending",
    gpa: "3.85",
    income: "$42,000",
    essay: "I believe technology should feel like molded clay—highly adaptive, tactile, and user-centric. Winning this grant will allow me to fund my studies in high-performance web engineering."
  },
  {
    id: "app-2",
    scholarshipId: "2",
    scholarshipTitle: "Women in STEM Fellowship",
    studentName: "Sarah Jenkins",
    studentEmail: "s.jenkins@stanford.edu",
    appliedDate: "2024-07-12",
    status: "Approved",
    gpa: "3.95",
    income: "$28,000",
    essay: "We need more diverse representation in materials science. This scholarship will fund my thesis on clay-embedded nanotech batteries for clean energy storage."
  },
  {
    id: "app-3",
    scholarshipId: "4",
    scholarshipTitle: "Global Arts & Clay Merit",
    studentName: "Elena Rostova",
    studentEmail: "elena.r@arts.edu",
    appliedDate: "2024-07-10",
    status: "Pending",
    gpa: "3.62",
    income: "$55,000",
    essay: "Claymorphism is more than a design style; it brings digital elements back into our tactile human space. This grant will help me set up a digital ceramic production workshop."
  }
];

let systemLogs: SystemLog[] = [];
let securityAlerts: SecurityAlert[] = [
  {
    id: "alert-1",
    timestamp: new Date().toISOString(),
    type: "DDoS Protection Activated",
    sourceIp: "104.22.41.98",
    details: "Rate limiting triggered for IP 104.22.41.98 after 180 requests/min. Shielding high-concurrency API nodes.",
    severity: "Low",
    status: "Mitigated"
  },
  {
    id: "alert-2",
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    type: "Potential XSS Filter Trigger",
    sourceIp: "198.51.100.12",
    details: "Detected scripted payloads inside applied student essays. Payload disarmed and user access quarantined.",
    severity: "Medium",
    status: "Mitigated"
  }
];

// Helper to push a log
function addLog(
  activityType: SystemLog['activityType'],
  severity: SystemLog['severity'],
  details: string,
  ip: string = "127.0.0.1",
  userAgent: string = "System",
  statusCode: number = 200,
  method: string = "SYS",
  url: string = ""
) {
  const log: SystemLog = {
    id: `log-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    method,
    url,
    statusCode,
    ip,
    userAgent,
    activityType,
    details,
    severity
  };
  systemLogs.unshift(log);
  // Keep logs list trimmed to prevent memory issues
  if (systemLogs.length > 500) {
    systemLogs.pop();
  }
}

// Populate initial server startup logs
addLog("DATA_MUTATION", "INFO", "Zaneen main database initialized with default program templates.");
addLog("THEME_CHANGE", "INFO", "Immersive peach-and-brown system theme loaded as active brand template.");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      const severity = res.statusCode >= 400 ? "WARNING" : "INFO";
      const activityType = req.url.startsWith("/api/theme") 
        ? "THEME_CHANGE" 
        : req.url.startsWith("/api/auth") 
        ? "AUTH_EVENT" 
        : req.method !== "GET" 
        ? "DATA_MUTATION" 
        : "API_REQUEST";

      addLog(
        activityType,
        severity,
        `${req.method} ${req.originalUrl} - Completed in ${duration}ms`,
        req.ip || "127.0.0.1",
        req.headers["user-agent"] || "unknown",
        res.statusCode,
        req.method,
        req.originalUrl
      );
    });
    next();
  });

  // API: Get/Set Theme
  app.get("/api/theme", (req, res) => {
    res.json(currentTheme);
  });

  app.post("/api/theme", (req, res) => {
    const newTheme = req.body;
    currentTheme = { ...currentTheme, ...newTheme };
    addLog(
      "THEME_CHANGE",
      "INFO",
      `System color profile updated. Accent: ${currentTheme.accentColor}, DarkMode: ${currentTheme.darkMode}`
    );
    res.json(currentTheme);
  });

  // API: Get/Modify Scholarships
  app.get("/api/scholarships", (req, res) => {
    res.json(scholarships);
  });

  app.post("/api/scholarships", (req, res) => {
    const newProg = req.body;
    const item: Scholarship = {
      id: `prog-${Math.random().toString(36).substr(2, 9)}`,
      title: newProg.title || "Untitled Program",
      deadline: newProg.deadline || new Date().toISOString().split('T')[0],
      awardAmount: Number(newProg.awardAmount) || 1000,
      status: newProg.status || "Draft",
      category: newProg.category || "General",
      description: newProg.description || ""
    };
    scholarships.unshift(item);
    addLog("DATA_MUTATION", "INFO", `Created new scholarship program: "${item.title}"`);
    res.status(201).json(item);
  });

  app.put("/api/scholarships/:id", (req, res) => {
    const { id } = req.params;
    const idx = scholarships.findIndex(s => s.id === id);
    if (idx !== -1) {
      scholarships[idx] = { ...scholarships[idx], ...req.body };
      addLog("DATA_MUTATION", "INFO", `Modified scholarship program: "${scholarships[idx].title}"`);
      res.json(scholarships[idx]);
    } else {
      res.status(404).json({ error: "Scholarship not found" });
    }
  });

  app.delete("/api/scholarships/:id", (req, res) => {
    const { id } = req.params;
    const idx = scholarships.findIndex(s => s.id === id);
    if (idx !== -1) {
      const removed = scholarships[idx];
      scholarships.splice(idx, 1);
      addLog("DATA_MUTATION", "WARNING", `Deleted scholarship program: "${removed.title}"`);
      res.json({ success: true, removed });
    } else {
      res.status(404).json({ error: "Scholarship not found" });
    }
  });

  // API: Get/Submit Applications
  app.get("/api/applications", (req, res) => {
    res.json(applications);
  });

  app.post("/api/applications", (req, res) => {
    const appBody = req.body;
    const scholarship = scholarships.find(s => s.id === appBody.scholarshipId);
    
    const newApp: Application = {
      id: `app-${Math.random().toString(36).substr(2, 9)}`,
      scholarshipId: appBody.scholarshipId,
      scholarshipTitle: scholarship ? scholarship.title : "General Scholarship",
      studentName: appBody.studentName || "Anonymous Student",
      studentEmail: appBody.studentEmail || "student@edu.com",
      appliedDate: new Date().toISOString().split('T')[0],
      status: "Pending",
      gpa: appBody.gpa || "4.00",
      income: appBody.income || "$40,000",
      essay: appBody.essay || ""
    };
    
    applications.unshift(newApp);
    addLog("DATA_MUTATION", "INFO", `Received incoming student application from ${newApp.studentName} for "${newApp.scholarshipTitle}"`);
    res.status(201).json(newApp);
  });

  app.put("/api/applications/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const idx = applications.findIndex(a => a.id === id);
    if (idx !== -1) {
      applications[idx].status = status;
      addLog("DATA_MUTATION", "INFO", `Updated application status of ${applications[idx].studentName} to "${status}"`);
      res.json(applications[idx]);
    } else {
      res.status(404).json({ error: "Application not found" });
    }
  });

  // API: Get logs & security alerts
  app.get("/api/logs", (req, res) => {
    res.json(systemLogs);
  });

  app.get("/api/alerts", (req, res) => {
    res.json(securityAlerts);
  });

  app.post("/api/alerts/mitigate/:id", (req, res) => {
    const { id } = req.params;
    const alert = securityAlerts.find(a => a.id === id);
    if (alert) {
      alert.status = "Mitigated";
      addLog("SECURITY_ALERT", "INFO", `Security alert of type "${alert.type}" marked as mitigated by Admin.`);
      res.json(alert);
    } else {
      res.status(404).json({ error: "Alert not found" });
    }
  });

  // API: Auth list, requests and promotions (Google Docs style)
  app.get("/api/auth/admins", (req, res) => {
    res.json({
      admins: admins,
      accessRequests: accessRequests
    });
  });

  app.post("/api/auth/request-access", (req, res) => {
    const { name, email, message } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const targetEmail = email.trim().toLowerCase();
    
    // Check if already an admin
    if (admins.includes(targetEmail)) {
      return res.status(400).json({ error: "This email is already an authorized administrator." });
    }

    // Check if already requested and still pending
    const existing = accessRequests.find(r => r.email === targetEmail && r.status === 'Pending');
    if (existing) {
      return res.json({ success: true, message: "An access request is already pending for this email." });
    }

    const newRequest: AccessRequest = {
      id: `req-${Math.random().toString(36).substr(2, 9)}`,
      name: name || "Anonymous User",
      email: targetEmail,
      requestedAt: new Date().toISOString(),
      status: 'Pending',
      message: message || "Requested administrator console permissions."
    };

    accessRequests.unshift(newRequest);
    addLog("SECURITY_ALERT", "WARNING", `Admin access request registered: ${newRequest.name} (${newRequest.email})`);
    res.json({ success: true, message: "Access request successfully submitted." });
  });

  app.post("/api/auth/promote", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const targetEmail = email.trim().toLowerCase();
    
    if (!admins.includes(targetEmail)) {
      admins.push(targetEmail);
    }

    // Approve any pending requests for this email
    accessRequests.forEach(r => {
      if (r.email === targetEmail) {
        r.status = 'Approved';
      }
    });

    addLog("DATA_MUTATION", "INFO", `Email ${targetEmail} promoted to Admin role.`);
    res.json({ success: true, admins, accessRequests });
  });

  app.post("/api/auth/reject-request", (req, res) => {
    const { id } = req.body;
    const request = accessRequests.find(r => r.id === id);
    if (request) {
      request.status = 'Rejected';
      addLog("DATA_MUTATION", "WARNING", `Access request from ${request.email} was rejected.`);
      res.json({ success: true, accessRequests });
    } else {
      res.status(404).json({ error: "Request not found" });
    }
  });

  app.post("/api/auth/revoke", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const targetEmail = email.trim().toLowerCase();
    if (targetEmail === "abdullah.binnasir.abn@gmail.com") {
      return res.status(400).json({ error: "Cannot revoke permissions of the primary super administrator." });
    }
    
    const idx = admins.indexOf(targetEmail);
    if (idx !== -1) {
      admins.splice(idx, 1);
    }
    
    // Set approved status back to Rejected in requests
    accessRequests.forEach(r => {
      if (r.email === targetEmail) {
        r.status = 'Rejected';
      }
    });

    addLog("DATA_MUTATION", "WARNING", `Admin permissions revoked for ${targetEmail}.`);
    res.json({ success: true, admins, accessRequests });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, name, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const userEmail = email.trim().toLowerCase();
    const isSystemAdmin = admins.includes(userEmail);

    if (role === 'admin' && !isSystemAdmin) {
      return res.status(403).json({
        error: "forbidden",
        message: "You do not have permission to access the Zaneen Admin Portal. Request access from the administrator."
      });
    }

    res.json({
      success: true,
      user: {
        name: name || (isSystemAdmin ? "Administrator" : "Student User"),
        email: userEmail,
        role: isSystemAdmin ? "admin" : "student",
        avatar: isSystemAdmin
          ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkmOHh6_tzgokYQIwRCQFyO4VsX2-SQV3efippR63wqB3fAn_TWyQXA-jAJyup0zkKdk4n9hyLmv3JmUxKpdqGszUyI93VcVbDg-CLSzrhYyhXgGduPWynG6urf5cM7OTN7vGihoi2eloj7GPfeIPAPA_GVR6xvrW9iwEfGMFvVOtXCLIT8CiXHd4PKI1B7MBixcXF8AbZNyqGGlYF73Ch6ehkFCsAjXqD5Rkzh5avYNbkCGGveOf1rhN91KI8jTocut3hV7QZAZ0'
          : undefined
      }
    });
  });

  // Simulated live security monitor
  setInterval(() => {
    const rand = Math.random();
    if (rand < 0.05) { // 5% chance every 15s to spawn a dynamic alert/log for suspense and realism
      const IPs = ["203.0.113.15", "198.51.100.82", "192.0.2.204", "185.220.101.4"];
      const maliciousIP = IPs[Math.floor(Math.random() * IPs.length)];
      
      const newAlert: SecurityAlert = {
        id: `alert-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: "Suspicious API Activity Blocked",
        sourceIp: maliciousIP,
        details: `Secured request layer: query sanitization prevented unauthorized DB inspection on /api/scholarships from host ${maliciousIP}.`,
        severity: Math.random() > 0.5 ? "High" : "Medium",
        status: "Active"
      };
      
      securityAlerts.unshift(newAlert);
      addLog(
        "SECURITY_ALERT", 
        newAlert.severity === "High" ? "CRITICAL" : "WARNING", 
        `ALARM: ${newAlert.type} on host ${newAlert.sourceIp}`,
        newAlert.sourceIp,
        "Threat Defense Core",
        403
      );
    }
  }, 15000);

  // Serve static assets or mount Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
