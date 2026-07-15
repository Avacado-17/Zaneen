export interface Scholarship {
  id: string;
  title: string;
  deadline: string;
  awardAmount: number;
  status: 'Active' | 'Draft' | 'Archived';
  description: string;
  category: string;
}

export interface Application {
  id: string;
  scholarshipId: string;
  scholarshipTitle: string;
  studentName: string;
  studentEmail: string;
  appliedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  gpa: string;
  income: string;
  essay: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  ip: string;
  userAgent: string;
  activityType: 'API_REQUEST' | 'AUTH_EVENT' | 'THEME_CHANGE' | 'SECURITY_ALERT' | 'DATA_MUTATION';
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  type: string;
  sourceIp: string;
  details: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Active' | 'Mitigated' | 'Resolved';
}

export interface AppTheme {
  primaryColor: string; // hex
  bgColor: string; // hex
  surfaceColor: string; // hex
  accentColor: string; // hex
  fontColor: string; // hex
  fontFamily: 'Geist' | 'Inter' | 'Space Grotesk' | 'JetBrains Mono';
  darkMode: boolean;
}

export interface UserSession {
  user: {
    name: string;
    email: string;
    role: 'student' | 'admin' | 'none';
    avatar?: string;
  } | null;
  mfaVerified: boolean;
  needsMfa: boolean;
}

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  message?: string;
}

