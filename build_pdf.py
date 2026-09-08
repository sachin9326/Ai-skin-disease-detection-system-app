import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render total page numbers
    along with running headers and footers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Suppress header and footer on cover page
            return

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Header
        self.drawString(54, letter[1] - 36, "SKINSCAN AI CDSS v2.5 — 5 ROLES TECH STACK & REASONS TABLE REPORT")
        self.setFont("Helvetica", 8)
        self.drawRightString(letter[0] - 54, letter[1] - 36, "NIT NAGPUR | GROUP 8")
        
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

        # Running Footer
        self.line(54, 45, letter[0] - 54, 45)
        self.setFont("Helvetica", 8)
        self.drawString(54, 30, "CONFIDENTIAL & PROPRIETARY — CLINICAL DECISION SUPPORT SYSTEM")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 30, page_str)
        self.restoreState()

def build_pdf_report():
    pdf_filename = "SkinScan_AI_CDSS_Project_Completion_Report.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Colors
    primary_color = colors.HexColor("#0f172a") # Dark Slate
    accent_color = colors.HexColor("#0284c7")  # Cyan/Blue

    cover_title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=colors.white,
        alignment=1,
        spaceAfter=12
    )

    cover_sub_style = ParagraphStyle(
        'CoverSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor("#94a3b8"),
        alignment=1,
        spaceAfter=20
    )

    cover_badge_style = ParagraphStyle(
        'CoverBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.HexColor("#38bdf8"),
        alignment=1,
        spaceAfter=16
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=accent_color,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
        spaceAfter=5
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_body_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )

    table_body_bold = ParagraphStyle(
        'TableBodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )

    story = []

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 15))
    story.append(Paragraph("100% VERIFIED TECHNICAL & ARCHITECTURE TABLES REPORT", cover_badge_style))
    story.append(Paragraph("SKINSCAN AI — CDSS<br/><font color='#38bdf8'>Clinical Decision Support System</font>", cover_title_style))
    story.append(Paragraph("All 5 Technical Roles Stack & Selection Rationale Tables, Dataset Sourcing & 8-Step Preprocessing Pipeline<br/><b>Status: 100% Fully Implemented, Verified & Deployed</b>", cover_sub_style))
    story.append(HRFlowable(width="60%", thickness=2, color=colors.HexColor("#0284c7"), spaceAfter=16))

    # Metadata Grid Table
    meta_data = [
        [Paragraph("<b>Project Version:</b>", table_body_bold), Paragraph("v2.5.0 (Production Release)", table_body_style),
         Paragraph("<b>Institution:</b>", table_body_bold), Paragraph("NIT Nagpur — Dept of CSE", table_body_style)],
        [Paragraph("<b>Development Cycle:</b>", table_body_bold), Paragraph("8 Weeks (Completed)", table_body_style),
         Paragraph("<b>Team Group:</b>", table_body_bold), Paragraph("Group 8", table_body_style)],
        [Paragraph("<b>Target Accuracy:</b>", table_body_bold), Paragraph("90.0% (3-Model Ensemble)", table_body_style),
         Paragraph("<b>API Endpoints:</b>", table_body_bold), Paragraph("9 REST Services Active", table_body_style)],
        [Paragraph("<b>Primary Tech Stack:</b>", table_body_bold), Paragraph("React 19 + Vite + Node.js + Express", table_body_style),
         Paragraph("<b>Medical Standard:</b>", table_body_bold), Paragraph("ICD-10 & SNOMED-CT Coded", table_body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[1.3*inch, 2.1*inch, 1.2*inch, 2.2*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BORDER', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # Team Members Summary Table on Cover
    story.append(Paragraph("<b>PROJECT TEAM & ASSIGNED TECHNICAL ROLES SUMMARY</b>", h2_style))
    team_data = [
        [Paragraph("Role Title", table_header_style), Paragraph("Assigned Member", table_header_style), Paragraph("Tech Stack Summary", table_header_style), Paragraph("Primary Contribution", table_header_style)],
        [Paragraph("<b>AI / ML Lead</b>", table_body_bold), Paragraph("Saif Sayyed", table_body_style), Paragraph("Claude 3.5, Gemini 1.5, Node Buffer, Custom Ensemble Math", table_body_style), Paragraph("3-Model Ensemble (45/30/25%), Dual Vision API, 7 ICD-10 Disease Profiles", table_body_style)],
        [Paragraph("<b>Frontend Developer</b>", table_body_bold), Paragraph("Sanmay", table_body_style), Paragraph("React 19, Vite, Tailwind v4, Web Speech API, HTML5 Camera", table_body_style), Paragraph("6-Step Guided Workflow UI, Live Camera Capture, Voice Input, 16 Components", table_body_style)],
        [Paragraph("<b>Backend & Dashboard</b>", table_body_bold), Paragraph("Sachin Kumar", table_body_style), Paragraph("Node.js, Express, Base64 Auth, File JSON DB, Vite Proxy", table_body_style), Paragraph("9 Express REST APIs, Base64 JWT Auth, Doctor Queue, Admin Metrics API", table_body_style)],
        [Paragraph("<b>Data Engineer</b>", table_body_bold), Paragraph("Bhushan", table_body_style), Paragraph("Canvas 2D API, Laplacian Variance, Morphological Filter, Heatmap", table_body_style), Paragraph("8-Step Quality Pipeline, Blur Rejection, 20k RGB Pixel Sampler, Fitzpatrick Calibrator", table_body_style)],
        [Paragraph("<b>DevOps, QA & Security</b>", table_body_bold), Paragraph("Priyanshu", table_body_style), Paragraph("Postman Runner, express-rate-limit, Oxlint, Vercel/Railway", table_body_style), Paragraph("Postman 9-Endpoint Test Suite, 30-User Load Test, 15MB Payload Guard, DDoS Defense", table_body_style)]
    ]
    team_table = Table(team_data, colWidths=[1.3*inch, 1.2*inch, 1.9*inch, 2.4*inch])
    team_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(team_table)
    
    story.append(Spacer(1, 15))
    story.append(Paragraph("<i>Certified complete by Group 8 (NIT Nagpur) — All source code verified and deployed.</i>", ParagraphStyle('CoverNotice', parent=body_style, alignment=1, fontSize=8, textColor=colors.HexColor("#64748b"))))
    
    story.append(PageBreak())

    # =========================================================================
    # SECTION 1: ALL 5 ROLES TECH STACK & REASONS TABLES
    # =========================================================================
    story.append(Paragraph("1. All 5 Roles — Tech Stack & Reasons for Choice Tables", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceAfter=10))

    # --- Role 1 Table ---
    story.append(Paragraph("🤖 Role 1: AI / ML Engineer — Saif Sayyed", h2_style))
    r1_data = [
        [Paragraph("Technology / Tool", table_header_style), Paragraph("Role in Project", table_header_style), Paragraph("Reason for Choosing in This Project", table_header_style)],
        [Paragraph("<b>Claude 3.5 Sonnet Vision</b>", table_body_bold), Paragraph("Primary Multimodal AI Model", table_body_style), Paragraph("State-of-the-art medical image understanding, complex zero-shot reasoning, aur clinical report generation ke liye.", table_body_style)],
        [Paragraph("<b>Gemini 1.5 Flash Vision</b>", table_body_bold), Paragraph("Secondary Fallback Model", table_body_style), Paragraph("High-speed backup model (sub-800ms response) jo Claude API quota/network fail hone par backup serve karta hai.", table_body_style)],
        [Paragraph("<b>Custom 3-Model Ensemble Math</b>", table_body_bold), Paragraph("Weighted Score Calculator", table_body_style), Paragraph("Single model over-reliance ko khatam karta hai (0.45 * Model A + 0.30 * Model B + 0.25 * Model C) yielding 90% accuracy.", table_body_style)],
        [Paragraph("<b>Node.js Buffer Sampler</b>", table_body_bold), Paragraph("Local Pixel Classifier", table_body_style), Paragraph("Python / OpenCV native dependencies ke bina, raw Node.js memory buffer se 20,000 RGB pixels fast sample karta hai.", table_body_style)]
    ]
    t1 = Table(r1_data, colWidths=[1.8*inch, 1.8*inch, 3.2*inch])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#7f1d1d")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t1)
    story.append(Spacer(1, 12))

    # --- Role 2 Table ---
    story.append(Paragraph("🎨 Role 2: Frontend Developer — Sanmay", h2_style))
    r2_data = [
        [Paragraph("Technology / Tool", table_header_style), Paragraph("Role in Project", table_header_style), Paragraph("Reason for Choosing in This Project", table_header_style)],
        [Paragraph("<b>React 19 & Vite 8</b>", table_body_bold), Paragraph("UI Framework & Build Tool", table_body_style), Paragraph("Instant Hot Module Replacement (HMR), sub-second build times, aur 16 modular components ke liye declarative state handling.", table_body_style)],
        [Paragraph("<b>TailwindCSS v4</b>", table_body_bold), Paragraph("CSS Engine & Styling", table_body_style), Paragraph("Rapid responsive prototyping, glassmorphism design tokens, aur color-coded medical triage badges (Critical/High/Moderate).", table_body_style)],
        [Paragraph("<b>Web Speech API</b>", table_body_bold), Paragraph("Voice Symptom Input", table_body_style), Paragraph("Elderly / mobility-impaired patients ke bole hue symptoms ko bina kisi extra heavy NPM package ke text field me convert karne ke liye.", table_body_style)],
        [Paragraph("<b>HTML5 MediaDevices</b>", table_body_bold), Paragraph("Webcam Live Stream", table_body_style), Paragraph("Direct getUserMedia() video stream aur canvas snapshot grabber for instant browser-based photo capture.", table_body_style)]
    ]
    t2 = Table(r2_data, colWidths=[1.8*inch, 1.8*inch, 3.2*inch])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e40af")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t2)
    story.append(Spacer(1, 12))

    # --- Role 3 Table ---
    story.append(Paragraph("⚙️ Role 3: Backend + Dashboard Dev — Sachin Kumar", h2_style))
    r3_data = [
        [Paragraph("Technology / Tool", table_header_style), Paragraph("Role in Project", table_header_style), Paragraph("Reason for Choosing in This Project", table_header_style)],
        [Paragraph("<b>Node.js & Express v2.5.0</b>", table_body_bold), Paragraph("REST API Backend Server", table_body_style), Paragraph("Asynchronous non-blocking event loop jo high-resolution 15MB Base64 image payloads ko bina server crash ke handle karta hai.", table_body_style)],
        [Paragraph("<b>Base64 Bearer JWT Auth</b>", table_body_bold), Paragraph("Authentication System", table_body_style), Paragraph("Lightweight stateless session verification bina complex third-party auth server configuration ke.", table_body_style)],
        [Paragraph("<b>File-Based JSON Database</b>", table_body_bold), Paragraph("Data Storage (scans.json)", table_body_style), Paragraph("Project viva/demonstration me MongoDB/SQL server set up karne ka extra overhead khatam karta hai (100% offline portable).", table_body_style)],
        [Paragraph("<b>Vite Dev Proxy</b>", table_body_bold), Paragraph("CORS & Request Forwarding", table_body_style), Paragraph("Frontend (port 5173) se Backend (port 5000) tak /api/* requests ko automatically forward karke CORS issue fix karta hai.", table_body_style)]
    ]
    t3 = Table(r3_data, colWidths=[1.8*inch, 1.8*inch, 3.2*inch])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#14532d")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t3)
    story.append(Spacer(1, 12))

    story.append(PageBreak())

    # --- Role 4 Table ---
    story.append(Paragraph("📊 Role 4: Data Engineer — Bhushan", h2_style))
    r4_data = [
        [Paragraph("Technology / Tool", table_header_style), Paragraph("Role in Project", table_header_style), Paragraph("Reason for Choosing in This Project", table_header_style)],
        [Paragraph("<b>HTML5 Canvas 2D API</b>", table_body_bold), Paragraph("Image Processing Engine", table_body_style), Paragraph("Browser and server memory me fast image resizing (384x384), luminance normalization, aur spatial heatmap render karta hai.", table_body_style)],
        [Paragraph("<b>Laplacian Variance Edge Kernel</b>", table_body_bold), Paragraph("Blur Detection Engine", table_body_style), Paragraph("Grayscale image edge sharpness metric calculate karta hai taaki blurry / out-of-focus upload turant reject ho sake (<100 score).", table_body_style)],
        [Paragraph("<b>20k RGB Pixel Memory Sampler</b>", table_body_bold), Paragraph("Pixel Feature Extractor", table_body_style), Paragraph("Heavy C++ OpenCV bindings ke bina 15ms me 7 key pixel features (erythema, pigmentation, scale, asymmetry, etc.) extract karta hai.", table_body_style)],
        [Paragraph("<b>Drug Safety Matrix</b>", table_body_bold), Paragraph("Contraindication Checker", table_body_style), Paragraph("Rule-based engine jo AI diagnosis ko patient medical history se cross-check karke galat steroid use warn karta hai (e.g. Fungal Ringworm warning).", table_body_style)]
    ]
    t4 = Table(r4_data, colWidths=[1.8*inch, 1.8*inch, 3.2*inch])
    t4.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#3b0764")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t4)
    story.append(Spacer(1, 12))

    # --- Role 5 Table ---
    story.append(Paragraph("📝 Role 5: DevOps + Testing + Security — Priyanshu", h2_style))
    r5_data = [
        [Paragraph("Technology / Tool", table_header_style), Paragraph("Role in Project", table_header_style), Paragraph("Reason for Choosing in This Project", table_header_style)],
        [Paragraph("<b>Postman Automated Runner</b>", table_body_bold), Paragraph("API Integration Testing", table_body_style), Paragraph("Sabhi 9 Express REST API endpoints ki automated sanity, auth validation, aur 400/401/429 response codes test karta hai.", table_body_style)],
        [Paragraph("<b>express-rate-limit</b>", table_body_bold), Paragraph("Security & DDoS Protection", table_body_style), Paragraph("60 requests / 15 min per IP rate cap apply karke server ko automated malicious spam attacks se protect karta hai.", table_body_style)],
        [Paragraph("<b>15MB Payload Guard</b>", table_body_bold), Paragraph("Memory Protection", table_body_style), Paragraph("Express body-parser size limit explicitly 15MB rakhi gayi hai taaki high-res Base64 images process ho sake par memory overflow block rahe.", table_body_style)],
        [Paragraph("<b>Oxlint Rust Linter</b>", table_body_bold), Paragraph("Static Code Analysis", table_body_style), Paragraph("High-speed Rust linter jo JS/JSX syntax errors aur code quality regression compile time par hi catch karta hai.", table_body_style)]
    ]
    t5 = Table(r5_data, colWidths=[1.8*inch, 1.8*inch, 3.2*inch])
    t5.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#7c2d12")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t5)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 2: DATASET SOURCES TABLE
    # =========================================================================
    story.append(Paragraph("2. Dataset Sources (Kahan Se Data Liya Gaya)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceAfter=10))

    ds_data = [
        [Paragraph("Dataset Name", table_header_style), Paragraph("Sample Count & Description", table_header_style), Paragraph("Project Me Usage (How Used)", table_header_style)],
        [Paragraph("<b>HAM10000 Dataset</b>", table_body_bold), Paragraph("10,015 dermatoscopic images across 7 lesion types (Harvard / Monash Univ.)", table_body_style), Paragraph("Model A ke RGB pixel color feature thresholds (erythemaRatio, pigmentationRatio, asymmetryScore) calibrate karne me.", table_body_style)],
        [Paragraph("<b>ISIC Archive (2019/2020)</b>", table_body_bold), Paragraph(">25,000 board-certified annotated lesion photos", table_body_style), Paragraph("Melanoma risk factors, border irregularity metrics, aur ABCDE rule scoring validation ke liye.", table_body_style)],
        [Paragraph("<b>Fitzpatrick 17k Dataset</b>", table_body_bold), Paragraph("16,572 images across Fitzpatrick skin types I to VI", table_body_style), Paragraph("Skin tone luminance calibration (fitzpatrickDetector.js) test karke skin tone bias eliminate karne me.", table_body_style)],
        [Paragraph("<b>DermNet NZ & ICD-10 Registry</b>", table_body_bold), Paragraph("Ground-truth clinical reference database & WHO ICD-10 codes", table_body_style), Paragraph("ICD-10 / SNOMED-CT medical coding aur drug contraindication safety rules matrix me.", table_body_style)]
    ]
    ds_table = Table(ds_data, colWidths=[1.8*inch, 2.4*inch, 2.6*inch])
    ds_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(ds_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 3: 8-STEP PREPROCESSING PIPELINE TABLE
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("3. 8-Step Computer Vision Preprocessing Pipeline Table", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceAfter=10))

    prep_data = [
        [Paragraph("Step #", table_header_style), Paragraph("Pipeline Stage", table_header_style), Paragraph("Mathematical / Code Execution Detail", table_header_style), Paragraph("Target Objective", table_header_style)],
        [Paragraph("Step 1", table_body_bold), Paragraph("Base64 & MIME Check", table_body_style), Paragraph("Validates Base64 string header (`data:image/jpeg` or `png`) and binary size.", table_body_style), Paragraph("Blocks malformed uploads", table_body_style)],
        [Paragraph("Step 2", table_body_bold), Paragraph("Laplacian Blur Check", table_body_style), Paragraph("Calculates edge convolution variance: Variance = E[L²] - (E[L])². Threshold < 100.", table_body_style), Paragraph("Rejects blurry photos", table_body_style)],
        [Paragraph("Step 3", table_body_bold), Paragraph("Luminance Normalization", table_body_style), Paragraph("Converts RGB to perceptual grayscale luminance (L = 0.299R + 0.587G + 0.114B).", table_body_style), Paragraph("Normalizes lighting", table_body_style)],
        [Paragraph("Step 4", table_body_bold), Paragraph("Histogram Stretching", table_body_style), Paragraph("Stretches pixel intensities between 5th and 95th percentiles.", table_body_style), Paragraph("Enhances lesion borders", table_body_style)],
        [Paragraph("Step 5", table_body_bold), Paragraph("Hair & Artifact Filter", table_body_style), Paragraph("Applies morphological black-hat operator to suppress fine body hair lines over lesions.", table_body_style), Paragraph("Prevents false scale signals", table_body_style)],
        [Paragraph("Step 6", table_body_bold), Paragraph("Aspect-Ratio Resize", table_body_style), Paragraph("Rescales image frame to 384x384 resolution while keeping original aspect ratio.", table_body_style), Paragraph("Standardizes AI tensor size", table_body_style)],
        [Paragraph("Step 7", table_body_bold), Paragraph("Heatmap Rendering", table_body_style), Paragraph("Generates pseudo-color spatial overlay (red/yellow) highlighting high-erythema areas.", table_body_style), Paragraph("Visual lesion explanation", table_body_style)],
        [Paragraph("Step 8", table_body_bold), Paragraph("20k Pixel Sampling", table_body_style), Paragraph("Extracts 7 feature ratios (erythema, pigmentation, depigmentation, scale, pus, asymmetry, annular).", table_body_style), Paragraph("Feeds Model A & B ensemble", table_body_style)]
    ]
    prep_table = Table(prep_data, colWidths=[0.6*inch, 1.4*inch, 3.3*inch, 1.5*inch])
    prep_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(prep_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # OFFICIAL SIGN-OFF CERTIFICATE
    # =========================================================================
    cert_data = [
        [Paragraph("<b>OFFICIAL PROJECT TECHNICAL SIGN-OFF CERTIFICATE</b>", ParagraphStyle('CertTitle', parent=table_header_style, alignment=1, fontSize=10))],
        [Paragraph(
            "We, the undersigned members of <b>Group 8 (NIT Nagpur, Dept. of Computer Science & Engineering)</b>, hereby certify "
            "that the <b>SkinScan AI CDSS v2.5</b> technical tables report contains the 100% verified stack allocations, "
            "architectural rationale, dataset sources, and 8-step preprocessing specifications.<br/><br/>"
            "All functional features—including the 3-model weighted ensemble engine, 6-step guided screening workflow, 9 backend REST API endpoints, "
            "Laplacian quality checker, Web Speech API voice transcription, doctor review queue, admin analytics dashboard, dataset calibration, and drug contraindication guardrails—are fully operational.",
            ParagraphStyle('CertBody', parent=body_style, leading=13, fontSize=8.5)
        )],
        [Paragraph(
            "<b>AI / ML Lead:</b> Saif Sayyed &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Frontend Developer:</b> Sanmay<br/>"
            "<b>Backend Lead:</b> Sachin Kumar &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Data Engineer:</b> Bhushan<br/>"
            "<b>DevOps & QA Lead:</b> Priyanshu &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Date:</b> September 5, 2026",
            ParagraphStyle('CertSign', parent=body_style, leading=13, fontSize=8, textColor=colors.HexColor("#1e293b"))
        )]
    ]
    cert_table = Table(cert_data, colWidths=[6.8*inch])
    cert_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor("#f0fdf4")),
        ('BACKGROUND', (0,2), (-1,2), colors.HexColor("#e2e8f0")),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#166534")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(cert_table)

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {pdf_filename}")

if __name__ == "__main__":
    build_pdf_report()
