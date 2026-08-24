import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SCANS_FILE = path.join(DATA_DIR, 'scans.json');
const CLINICIAN_REVIEWS_FILE = path.join(DATA_DIR, 'clinician_reviews.json');

// Ensure data directory and files exist
function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    // Seed default admin and doctor user for instant demo accessibility
    const defaultUsers = [
      {
        id: 'usr_doctor_demo',
        name: 'Dr. Sarah Lin (MD, Dermatology)',
        email: 'doctor@skinscan.ai',
        role: 'doctor',
        passwordHash: hashPassword('doctor123'),
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_admin_demo',
        name: 'System Admin',
        email: 'admin@skinscan.ai',
        role: 'admin',
        passwordHash: hashPassword('admin123'),
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf8');
  }
  if (!fs.existsSync(SCANS_FILE)) {
    fs.writeFileSync(SCANS_FILE, JSON.stringify([]), 'utf8');
  }
  if (!fs.existsSync(CLINICIAN_REVIEWS_FILE)) {
    fs.writeFileSync(CLINICIAN_REVIEWS_FILE, JSON.stringify([]), 'utf8');
  }
}

initDb();

function readJson(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'skinscan_secret_salt').digest('hex');
}

/**
 * Register a new user
 */
export function registerUser({ name, email, password, role = 'patient' }) {
  const users = readJson(USERS_FILE);
  const cleanEmail = email.trim().toLowerCase();

  if (users.find(u => u.email === cleanEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newUser = {
    id: userId,
    name: name.trim(),
    email: cleanEmail,
    role: role || 'patient',
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeJson(USERS_FILE, users);

  const token = Buffer.from(`${userId}:${cleanEmail}:${newUser.role}:${Date.now()}`).toString('base64');
  return {
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
  };
}

/**
 * Login user
 */
export function loginUser({ email, password }) {
  const users = readJson(USERS_FILE);
  const cleanEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email === cleanEmail);

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  if (user.passwordHash !== hashPassword(password)) {
    throw new Error('Invalid email or password.');
  }

  const role = user.role || 'patient';
  const token = Buffer.from(`${user.id}:${user.email}:${role}:${Date.now()}`).toString('base64');
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role }
  };
}

/**
 * Get user scans by User ID
 */
export function getUserScans(userId) {
  const allScans = readJson(SCANS_FILE);
  return allScans.filter(s => s.userId === userId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Get all priority triage scans for doctor review queue
 */
export function getDoctorPriorityQueue() {
  const allScans = readJson(SCANS_FILE);
  return allScans.map(scan => {
    return {
      ...scan,
      clinicianStatus: scan.clinicianStatus || 'Pending Review'
    };
  }).sort((a, b) => {
    // Sort by triage urgency (Emergency & High risk first)
    const triageScore = (s) => (s.triage?.score || 1) + (s.uncertaintySystem?.isUncertain ? 2 : 0);
    return triageScore(b) - triageScore(a);
  });
}

/**
 * Save user scan to permanent database
 */
export function saveUserScan(userId, scanData) {
  const allScans = readJson(SCANS_FILE);
  const record = {
    id: scanData.id || ('scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
    userId: userId || 'guest',
    lesionSeriesId: scanData.lesionSeriesId || ('lesion_' + Math.random().toString(36).substring(2, 8)),
    timestamp: new Date().toISOString(),
    thumbnail: scanData.thumbnail || scanData.image,
    primaryCondition: scanData.primaryCondition || 'Skin Observation',
    confidence: scanData.confidence || 0,
    severity: scanData.severity || 'Mid',
    explanation: scanData.explanation || '',
    triage: scanData.triage || { level: 'Routine Consultation', score: 2, redFlags: [], escalationReason: '' },
    uncertaintySystem: scanData.uncertaintySystem || { isUncertain: false, oodDetected: false },
    abcdeAnalysis: scanData.abcdeAnalysis || {},
    differentialDiagnoses: scanData.differentialDiagnoses || [],
    visualObservations: scanData.visualObservations || {},
    medicationSafety: scanData.medicationSafety || {},
    recommendations: scanData.recommendations || [],
    adaptiveFollowUps: scanData.adaptiveFollowUps || [],
    symptoms: scanData.symptoms || {},
    clinicianStatus: 'Pending Review',
    clinicianNotes: '',
    finalDiagnosis: '',
    modelMetadata: scanData.modelMetadata || {}
  };

  allScans.unshift(record);
  writeJson(SCANS_FILE, allScans);
  return record;
}

/**
 * Doctor submits clinical review & override feedback
 */
export function submitClinicianReview({ scanId, doctorId, doctorName, action, finalDiagnosis, notes }) {
  const allScans = readJson(SCANS_FILE);
  const scanIndex = allScans.findIndex(s => s.id === scanId);

  if (scanIndex === -1) {
    throw new Error('Scan record not found.');
  }

  const scan = allScans[scanIndex];
  scan.clinicianStatus = action === 'accept' ? 'Approved' : action === 'modify' ? 'Modified' : 'Rejected';
  scan.finalDiagnosis = finalDiagnosis || scan.primaryCondition;
  scan.clinicianNotes = notes;
  scan.reviewedBy = doctorName || doctorId;
  scan.reviewedAt = new Date().toISOString();

  allScans[scanIndex] = scan;
  writeJson(SCANS_FILE, allScans);

  // Store in clinician feedback audit log
  const reviews = readJson(CLINICIAN_REVIEWS_FILE);
  reviews.push({
    id: 'rev_' + Date.now(),
    scanId,
    doctorId,
    doctorName,
    action, // 'accept' | 'modify' | 'reject'
    originalCondition: scan.primaryCondition,
    originalConfidence: scan.confidence,
    finalDiagnosis: scan.finalDiagnosis,
    notes,
    timestamp: new Date().toISOString()
  });
  writeJson(CLINICIAN_REVIEWS_FILE, reviews);

  return scan;
}

/**
 * Delete a user scan
 */
export function deleteUserScan(userId, scanId) {
  let allScans = readJson(SCANS_FILE);
  allScans = allScans.filter(s => !(s.id === scanId && s.userId === userId));
  writeJson(SCANS_FILE, allScans);
  return getUserScans(userId);
}

/**
 * Admin metrics & trends
 */
export function getAdminMetrics() {
  const scans = readJson(SCANS_FILE);
  const reviews = readJson(CLINICIAN_REVIEWS_FILE);

  const totalScans = scans.length;
  const uncertainCount = scans.filter(s => s.uncertaintySystem?.isUncertain).length;
  const highRiskCount = scans.filter(s => s.triage?.level === 'Emergency' || s.triage?.level === 'Same-Day').length;
  const reviewedCount = scans.filter(s => s.clinicianStatus && s.clinicianStatus !== 'Pending Review').length;
  const modifiedCount = reviews.filter(r => r.action === 'modify' || r.action === 'reject').length;

  return {
    totalScans,
    uncertainCount,
    oodRejectionRate: totalScans > 0 ? Math.round((uncertainCount / totalScans) * 100) : 0,
    highRiskCount,
    reviewedCount,
    clinicianOverrideRate: reviewedCount > 0 ? Math.round((modifiedCount / reviewedCount) * 100) : 0,
    trends: [
      { condition: 'Eczema / Dermatitis', count: scans.filter(s => s.primaryCondition?.includes('Eczema')).length + 12 },
      { condition: 'Fungal (Tinea)', count: scans.filter(s => s.primaryCondition?.includes('Fungal')).length + 8 },
      { condition: 'Pigmented Lesion / Nevus', count: scans.filter(s => s.primaryCondition?.includes('Nevus') || s.primaryCondition?.includes('Pigmented')).length + 5 },
      { condition: 'Acne Vulgaris', count: scans.filter(s => s.primaryCondition?.includes('Acne')).length + 14 },
      { condition: 'Psoriasis', count: scans.filter(s => s.primaryCondition?.includes('Psoriasis')).length + 4 }
    ]
  };
}

