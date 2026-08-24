import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { analyzeSkinImage } from './services/visionService.js';
import { 
  registerUser, 
  loginUser, 
  getUserScans, 
  saveUserScan, 
  deleteUserScan, 
  getDoctorPriorityQueue, 
  submitClinicianReview, 
  getAdminMetrics 
} from './services/authService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse JSON payloads (limit 15mb for base64 image data)
app.use(express.json({ limit: '15mb' }));

// Rate limiting middleware: max 60 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again later.',
    status: 429
  }
});

// Auth helper middleware
function getUserFromReq(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [userId, email, role] = decoded.split(':');
    return { userId, email, role: role || 'patient' };
  } catch (err) {
    return null;
  }
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'SkinScan AI CDSS API',
    version: '2.5.0',
    timestamp: new Date().toISOString()
  });
});

// AUTHENTICATION ENDPOINTS
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    const result = registerUser({ name, email, password, role });
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const result = loginUser({ email, password });
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// USER SCANS SYNC ENDPOINTS
app.get('/api/user/scans', (req, res) => {
  const user = getUserFromReq(req);
  if (!user || !user.userId) {
    return res.status(401).json({ error: 'Unauthorized user token.' });
  }
  const scans = getUserScans(user.userId);
  return res.json({ success: true, scans });
});

app.post('/api/user/scans', (req, res) => {
  const user = getUserFromReq(req);
  const userId = user ? user.userId : 'guest';
  const { scanData } = req.body;
  if (!scanData) {
    return res.status(400).json({ error: 'Scan data required.' });
  }
  const record = saveUserScan(userId, scanData);
  return res.json({ success: true, record });
});

app.delete('/api/user/scans/:id', (req, res) => {
  const user = getUserFromReq(req);
  if (!user || !user.userId) {
    return res.status(401).json({ error: 'Unauthorized user token.' });
  }
  const updatedScans = deleteUserScan(user.userId, req.params.id);
  return res.json({ success: true, scans: updatedScans });
});

// CLINICIAN / DOCTOR DASHBOARD ENDPOINTS
app.get('/api/doctor/queue', (req, res) => {
  const queue = getDoctorPriorityQueue();
  return res.json({ success: true, queue });
});

app.post('/api/doctor/review', (req, res) => {
  try {
    const { scanId, doctorId, doctorName, action, finalDiagnosis, notes } = req.body;
    if (!scanId || !action) {
      return res.status(400).json({ error: 'Scan ID and review action are required.' });
    }
    const updatedRecord = submitClinicianReview({ scanId, doctorId, doctorName, action, finalDiagnosis, notes });
    return res.json({ success: true, record: updatedRecord });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ADMIN METRICS & MONITORING ENDPOINTS
app.get('/api/admin/metrics', (req, res) => {
  const metrics = getAdminMetrics();
  return res.json({ success: true, metrics });
});

// Skin Analysis endpoint (Multimodal)
app.post('/api/analyze-skin', apiLimiter, async (req, res) => {
  try {
    const { image, provider, apiKey, model, symptoms } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No skin image provided for analysis.' });
    }

    const analysisResult = await analyzeSkinImage({
      imageBase64: image,
      provider,
      apiKey,
      model,
      symptoms
    });

    return res.json({
      success: true,
      data: analysisResult,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Skin Analysis API Error:', error);
    return res.status(500).json({
      error: 'Failed to analyze skin image.',
      details: error.message,
      disclaimer: 'SkinScan AI: Clinical decision support tool failed to complete analysis.'
    });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 SkinScan AI Express Server running on http://localhost:${PORT}`);
});

