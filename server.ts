import express from "express";
import path from "path";
import fs from "fs";
import { Scholarship, Application, SystemLog, SecurityAlert, AppTheme, AccessRequest } from "./src/types.js";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  where 
} from "firebase/firestore";

// Global fallback data stores (in-memory)
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
let admins: string[] = ["abdullah.binnasir.abn@gmail.com", "elena.r@arts.edu"];
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

// Firebase Dynamic Initialization
let db: any = null;

try {
  let config: any = null;
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  
  if (process.env.FIREBASE_CONFIG) {
    config = JSON.parse(process.env.FIREBASE_CONFIG);
  } else if (process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID) {
    config = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID,
      oAuthClientId: process.env.FIREBASE_OAUTH_CLIENT_ID
    };
  } else if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }

  if (config) {
    const firebaseApp = initializeApp(config);
    if (config.firestoreDatabaseId) {
      db = getFirestore(firebaseApp, config.firestoreDatabaseId);
    } else {
      db = getFirestore(firebaseApp);
    }
    console.log("Firebase initialized successfully with project:", config.projectId);
  } else {
    console.warn("No Firebase configuration found (neither config file nor environment variables). Running in local-only memory mode.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

// Automatic Seeding of Firestore DB
async function seedDatabase() {
  if (!db) return;
  try {
    // 1. Theme
    const themeRef = doc(db, "theme", "current");
    const themeSnap = await getDoc(themeRef);
    if (!themeSnap.exists()) {
      await setDoc(themeRef, currentTheme);
      console.log("Seeded default theme to Firestore.");
    }

    // 2. Admins
    const adminsSnap = await getDocs(collection(db, "admins"));
    if (adminsSnap.empty) {
      for (const email of admins) {
        await setDoc(doc(db, "admins", email), { email, role: "admin" });
      }
      console.log("Seeded admins to Firestore.");
    }

    // 3. Access Requests
    const reqsSnap = await getDocs(collection(db, "accessRequests"));
    if (reqsSnap.empty) {
      for (const req of accessRequests) {
        await setDoc(doc(db, "accessRequests", req.id), req);
      }
      console.log("Seeded access requests to Firestore.");
    }

    // 4. Scholarships
    const scholarshipsSnap = await getDocs(collection(db, "scholarships"));
    if (scholarshipsSnap.empty) {
      for (const s of scholarships) {
        await setDoc(doc(db, "scholarships", s.id), s);
      }
      console.log("Seeded scholarships to Firestore.");
    }

    // 5. Applications
    const appsSnap = await getDocs(collection(db, "applications"));
    if (appsSnap.empty) {
      for (const app of applications) {
        await setDoc(doc(db, "applications", app.id), app);
      }
      console.log("Seeded applications to Firestore.");
    }

    // 6. Security Alerts
    const alertsSnap = await getDocs(collection(db, "securityAlerts"));
    if (alertsSnap.empty) {
      for (const a of securityAlerts) {
        await setDoc(doc(db, "securityAlerts", a.id), a);
      }
      console.log("Seeded security alerts to Firestore.");
    }
  } catch (error) {
    console.error("Error seeding Firestore database:", error);
  }
}

// Theme Persistence Helpers
async function getTheme(): Promise<AppTheme> {
  if (!db) return currentTheme;
  try {
    const docRef = doc(db, "theme", "current");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppTheme;
    } else {
      await setDoc(docRef, currentTheme);
      return currentTheme;
    }
  } catch (err) {
    console.error("Error reading theme from Firestore:", err);
    return currentTheme;
  }
}

async function updateTheme(newTheme: Partial<AppTheme>): Promise<AppTheme> {
  currentTheme = { ...currentTheme, ...newTheme };
  if (!db) return currentTheme;
  try {
    const docRef = doc(db, "theme", "current");
    await setDoc(docRef, currentTheme, { merge: true });
  } catch (err) {
    console.error("Error updating theme in Firestore:", err);
  }
  return currentTheme;
}

// Admins Persistence Helpers
async function getAdmins(): Promise<string[]> {
  if (!db) return admins;
  try {
    const querySnapshot = await getDocs(collection(db, "admins"));
    const list: string[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) list.push(data.email);
    });
    if (list.length === 0) return admins;
    return list;
  } catch (err) {
    console.error("Error getting admins:", err);
    return admins;
  }
}

async function addAdmin(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!admins.includes(cleanEmail)) {
    admins.push(cleanEmail);
  }
  if (!db) return;
  try {
    await setDoc(doc(db, "admins", cleanEmail), { email: cleanEmail, role: "admin" });
  } catch (err) {
    console.error("Error adding admin:", err);
  }
}

async function removeAdmin(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const idx = admins.indexOf(cleanEmail);
  if (idx !== -1) {
    admins.splice(idx, 1);
  }
  if (!db) return;
  try {
    await deleteDoc(doc(db, "admins", cleanEmail));
  } catch (err) {
    console.error("Error removing admin:", err);
  }
}

// Access Requests Helpers
async function getAccessRequests(): Promise<AccessRequest[]> {
  if (!db) return accessRequests;
  try {
    const querySnapshot = await getDocs(collection(db, "accessRequests"));
    const list: AccessRequest[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as AccessRequest);
    });
    if (list.length === 0) return accessRequests;
    return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  } catch (err) {
    console.error("Error getting access requests:", err);
    return accessRequests;
  }
}

async function addAccessRequest(req: AccessRequest): Promise<void> {
  accessRequests.unshift(req);
  if (!db) return;
  try {
    await setDoc(doc(db, "accessRequests", req.id), req);
  } catch (err) {
    console.error("Error adding access request:", err);
  }
}

async function updateAccessRequestStatus(id: string, status: 'Approved' | 'Rejected' | 'Pending'): Promise<void> {
  const req = accessRequests.find(r => r.id === id);
  if (req) {
    req.status = status;
  }
  if (!db) return;
  try {
    await updateDoc(doc(db, "accessRequests", id), { status });
  } catch (err) {
    console.error("Error updating access request status:", err);
  }
}

async function approveAccessRequestsForEmail(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  accessRequests.forEach(r => {
    if (r.email === cleanEmail) {
      r.status = 'Approved';
    }
  });
  if (!db) return;
  try {
    const q = query(collection(db, "accessRequests"), where("email", "==", cleanEmail));
    const snapshot = await getDocs(q);
    for (const d of snapshot.docs) {
      await updateDoc(doc(db, "accessRequests", d.id), { status: "Approved" });
    }
  } catch (err) {
    console.error("Error approving requests for email:", err);
  }
}

async function rejectAccessRequestsForEmail(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  accessRequests.forEach(r => {
    if (r.email === cleanEmail) {
      r.status = 'Rejected';
    }
  });
  if (!db) return;
  try {
    const q = query(collection(db, "accessRequests"), where("email", "==", cleanEmail));
    const snapshot = await getDocs(q);
    for (const d of snapshot.docs) {
      await updateDoc(doc(db, "accessRequests", d.id), { status: "Rejected" });
    }
  } catch (err) {
    console.error("Error rejecting requests for email:", err);
  }
}

// Scholarships Helpers
async function getScholarships(): Promise<Scholarship[]> {
  if (!db) return scholarships;
  try {
    const querySnapshot = await getDocs(collection(db, "scholarships"));
    const list: Scholarship[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Scholarship);
    });
    if (list.length === 0) return scholarships;
    return list;
  } catch (err) {
    console.error("Error getting scholarships:", err);
    return scholarships;
  }
}

async function addScholarship(item: Scholarship): Promise<void> {
  scholarships.unshift(item);
  if (!db) return;
  try {
    await setDoc(doc(db, "scholarships", item.id), item);
  } catch (err) {
    console.error("Error adding scholarship:", err);
  }
}

async function updateScholarship(id: string, data: Partial<Scholarship>): Promise<Scholarship | null> {
  const idx = scholarships.findIndex(s => s.id === id);
  if (idx !== -1) {
    scholarships[idx] = { ...scholarships[idx], ...data };
  }
  if (!db) return idx !== -1 ? scholarships[idx] : null;
  try {
    const docRef = doc(db, "scholarships", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, data);
      const updated = await getDoc(docRef);
      return updated.data() as Scholarship;
    }
  } catch (err) {
    console.error("Error updating scholarship:", err);
  }
  return idx !== -1 ? scholarships[idx] : null;
}

async function removeScholarship(id: string): Promise<Scholarship | null> {
  const idx = scholarships.findIndex(s => s.id === id);
  let removed: Scholarship | null = null;
  if (idx !== -1) {
    removed = scholarships[idx];
    scholarships.splice(idx, 1);
  }
  if (!db) return removed;
  try {
    const docRef = doc(db, "scholarships", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Scholarship;
      await deleteDoc(docRef);
      return data;
    }
  } catch (err) {
    console.error("Error deleting scholarship:", err);
  }
  return removed;
}

// Applications Helpers
async function getApplications(): Promise<Application[]> {
  if (!db) return applications;
  try {
    const querySnapshot = await getDocs(collection(db, "applications"));
    const list: Application[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Application);
    });
    if (list.length === 0) return applications;
    return list;
  } catch (err) {
    console.error("Error getting applications:", err);
    return applications;
  }
}

async function addApplication(appItem: Application): Promise<void> {
  applications.unshift(appItem);
  if (!db) return;
  try {
    await setDoc(doc(db, "applications", appItem.id), appItem);
  } catch (err) {
    console.error("Error adding application:", err);
  }
}

async function updateApplicationStatus(id: string, status: 'Approved' | 'Rejected' | 'Pending'): Promise<Application | null> {
  const idx = applications.findIndex(a => a.id === id);
  if (idx !== -1) {
    applications[idx].status = status;
  }
  if (!db) return idx !== -1 ? applications[idx] : null;
  try {
    const docRef = doc(db, "applications", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, { status });
      const updated = await getDoc(docRef);
      return updated.data() as Application;
    }
  } catch (err) {
    console.error("Error updating application status:", err);
  }
  return idx !== -1 ? applications[idx] : null;
}

// System Logs Helpers
async function getSystemLogs(): Promise<SystemLog[]> {
  if (!db) return systemLogs;
  try {
    const q = query(collection(db, "systemLogs"), orderBy("timestamp", "desc"), limit(100));
    const querySnapshot = await getDocs(q);
    const list: SystemLog[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as SystemLog);
    });
    return list;
  } catch (err) {
    console.error("Error getting system logs:", err);
    return systemLogs;
  }
}

async function addSystemLog(log: SystemLog): Promise<void> {
  systemLogs.unshift(log);
  if (systemLogs.length > 100) {
    systemLogs.pop();
  }
  if (!db) return;
  try {
    await setDoc(doc(db, "systemLogs", log.id), log);
  } catch (err) {
    console.error("Error adding system log:", err);
  }
}

// Security Alerts Helpers
async function getSecurityAlerts(): Promise<SecurityAlert[]> {
  if (!db) return securityAlerts;
  try {
    const q = query(collection(db, "securityAlerts"), orderBy("timestamp", "desc"), limit(100));
    const querySnapshot = await getDocs(q);
    const list: SecurityAlert[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as SecurityAlert);
    });
    if (list.length === 0) return securityAlerts;
    return list;
  } catch (err) {
    console.error("Error getting security alerts:", err);
    return securityAlerts;
  }
}

async function addSecurityAlert(alert: SecurityAlert): Promise<void> {
  securityAlerts.unshift(alert);
  if (!db) return;
  try {
    await setDoc(doc(db, "securityAlerts", alert.id), alert);
  } catch (err) {
    console.error("Error adding security alert:", err);
  }
}

async function updateSecurityAlertStatus(id: string, status: 'Active' | 'Mitigated'): Promise<SecurityAlert | null> {
  const alert = securityAlerts.find(a => a.id === id);
  if (alert) {
    alert.status = status;
  }
  if (!db) return alert || null;
  try {
    const docRef = doc(db, "securityAlerts", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, { status });
      const updated = await getDoc(docRef);
      return updated.data() as SecurityAlert;
    }
  } catch (err) {
    console.error("Error updating security alert status:", err);
  }
  return alert || null;
}

// Helper to push a log (used by middleware or other routines)
async function addLog(
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
  await addSystemLog(log);
}

const app = express();
const PORT = 3000;

// Run database seeding and startup logging asynchronously
if (!process.env.VERCEL) {
  (async () => {
    await seedDatabase();
    await addLog("DATA_MUTATION", "INFO", "Zaneen main database initialized and seeded with default program templates.");
    await addLog("THEME_CHANGE", "INFO", "Immersive peach-and-brown system theme loaded as active brand template.");
  })();
}

// Body parsers
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", async () => {
    const duration = Date.now() - start;
    const severity = res.statusCode >= 400 ? "WARNING" : "INFO";
    const activityType = req.url.startsWith("/api/theme") 
      ? "THEME_CHANGE" 
      : req.url.startsWith("/api/auth") 
      ? "AUTH_EVENT" 
      : req.method !== "GET" 
      ? "DATA_MUTATION" 
      : "API_REQUEST";

    await addLog(
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
app.get("/api/theme", async (req, res) => {
  const theme = await getTheme();
  res.json(theme);
});

app.post("/api/theme", async (req, res) => {
  const newTheme = req.body;
  const theme = await updateTheme(newTheme);
  await addLog(
    "THEME_CHANGE",
    "INFO",
    `System color profile updated. Accent: ${theme.accentColor}, DarkMode: ${theme.darkMode}`
  );
  res.json(theme);
});

// API: Get/Modify Scholarships
app.get("/api/scholarships", async (req, res) => {
  const list = await getScholarships();
  res.json(list);
});

app.post("/api/scholarships", async (req, res) => {
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
  await addScholarship(item);
  await addLog("DATA_MUTATION", "INFO", `Created new scholarship program: "${item.title}"`);
  res.status(201).json(item);
});

app.put("/api/scholarships/:id", async (req, res) => {
  const { id } = req.params;
  const updated = await updateScholarship(id, req.body);
  if (updated) {
    await addLog("DATA_MUTATION", "INFO", `Modified scholarship program: "${updated.title}"`);
    res.json(updated);
  } else {
    res.status(404).json({ error: "Scholarship not found" });
  }
});

app.delete("/api/scholarships/:id", async (req, res) => {
  const { id } = req.params;
  const removed = await removeScholarship(id);
  if (removed) {
    await addLog("DATA_MUTATION", "WARNING", `Deleted scholarship program: "${removed.title}"`);
    res.json({ success: true, removed });
  } else {
    res.status(404).json({ error: "Scholarship not found" });
  }
});

// API: Get/Submit Applications
app.get("/api/applications", async (req, res) => {
  const list = await getApplications();
  res.json(list);
});

app.post("/api/applications", async (req, res) => {
  const appBody = req.body;
  const list = await getScholarships();
  const scholarship = list.find(s => s.id === appBody.scholarshipId);
  
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
  
  await addApplication(newApp);
  await addLog("DATA_MUTATION", "INFO", `Received incoming student application from ${newApp.studentName} for "${newApp.scholarshipTitle}"`);
  res.status(201).json(newApp);
});

app.put("/api/applications/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = await updateApplicationStatus(id, status);
  if (updated) {
    await addLog("DATA_MUTATION", "INFO", `Updated application status of ${updated.studentName} to "${status}"`);
    res.json(updated);
  } else {
    res.status(404).json({ error: "Application not found" });
  }
});

// API: Get logs & security alerts
app.get("/api/logs", async (req, res) => {
  const logs = await getSystemLogs();
  res.json(logs);
});

app.get("/api/alerts", async (req, res) => {
  const alerts = await getSecurityAlerts();
  res.json(alerts);
});

app.post("/api/alerts/mitigate/:id", async (req, res) => {
  const { id } = req.params;
  const alert = await updateSecurityAlertStatus(id, "Mitigated");
  if (alert) {
    await addLog("SECURITY_ALERT", "INFO", `Security alert of type "${alert.type}" marked as mitigated by Admin.`);
    res.json(alert);
  } else {
    res.status(404).json({ error: "Alert not found" });
  }
});

// API: Auth list, requests and promotions (Google Docs style)
app.get("/api/auth/admins", async (req, res) => {
  const adminList = await getAdmins();
  const reqList = await getAccessRequests();
  res.json({
    admins: adminList,
    accessRequests: reqList
  });
});

app.post("/api/auth/request-access", async (req, res) => {
  const { name, email, message } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  const targetEmail = email.trim().toLowerCase();
  
  const adminList = await getAdmins();
  if (adminList.includes(targetEmail)) {
    return res.status(400).json({ error: "This email is already an authorized administrator." });
  }

  const reqList = await getAccessRequests();
  const existing = reqList.find(r => r.email === targetEmail && r.status === 'Pending');
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

  await addAccessRequest(newRequest);
  await addLog("SECURITY_ALERT", "WARNING", `Admin access request registered: ${newRequest.name} (${newRequest.email})`);
  res.json({ success: true, message: "Access request successfully submitted." });
});

app.post("/api/auth/promote", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  const targetEmail = email.trim().toLowerCase();
  
  await addAdmin(targetEmail);
  await approveAccessRequestsForEmail(targetEmail);

  const adminList = await getAdmins();
  const reqList = await getAccessRequests();

  await addLog("DATA_MUTATION", "INFO", `Email ${targetEmail} promoted to Admin role.`);
  res.json({ success: true, admins: adminList, accessRequests: reqList });
});

app.post("/api/auth/reject-request", async (req, res) => {
  const { id } = req.body;
  const reqList = await getAccessRequests();
  const request = reqList.find(r => r.id === id);
  if (request) {
    await updateAccessRequestStatus(id, 'Rejected');
    const updatedReqList = await getAccessRequests();
    await addLog("DATA_MUTATION", "WARNING", `Access request from ${request.email} was rejected.`);
    res.json({ success: true, accessRequests: updatedReqList });
  } else {
    res.status(404).json({ error: "Request not found" });
  }
});

app.post("/api/auth/revoke", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  const targetEmail = email.trim().toLowerCase();
  if (targetEmail === "abdullah.binnasir.abn@gmail.com") {
    return res.status(400).json({ error: "Cannot revoke permissions of the primary super administrator." });
  }
  
  await removeAdmin(targetEmail);
  await rejectAccessRequestsForEmail(targetEmail);

  const adminList = await getAdmins();
  const reqList = await getAccessRequests();

  await addLog("DATA_MUTATION", "WARNING", `Admin permissions revoked for ${targetEmail}.`);
  res.json({ success: true, admins: adminList, accessRequests: reqList });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, name, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  const userEmail = email.trim().toLowerCase();
  const adminList = await getAdmins();
  const isSystemAdmin = adminList.includes(userEmail);

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
if (!process.env.VERCEL) {
  setInterval(async () => {
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
      
      await addSecurityAlert(newAlert);
      await addLog(
        "SECURITY_ALERT", 
        newAlert.severity === "High" ? "CRITICAL" : "WARNING", 
        `ALARM: ${newAlert.type} on host ${newAlert.sourceIp}`,
        newAlert.sourceIp,
        "Threat Defense Core",
        403
      );
    }
  }, 15000);
}

async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const viteModule = "vite";
    const { createServer: createViteServer } = await import(/* @vite-ignore */ viteModule);
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

if (!process.env.VERCEL) {
  bootstrap().catch((err) => {
    console.error("Failed to start server:", err);
  });
}

export default app;
if (typeof module !== "undefined" && module.exports) {
  module.exports = app;
}
