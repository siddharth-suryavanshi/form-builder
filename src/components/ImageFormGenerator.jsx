import React, { useState, useEffect, useRef } from "react";
import { generateFormFromImage, AVAILABLE_GROQ_MODELS, fileToDataUrl } from "../services/groqService";

export default function ImageFormGenerator({ onFormGenerated, isGenerating, setIsGenerating }) {
    const [selectedModel, setSelectedModel] = useState("llama-3.2-11b-vision-preview");
    const [customModel, setCustomModel] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [customPrompt, setCustomPrompt] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [statusStep, setStatusStep] = useState("");
    const fileInputRef = useRef(null);

    // Global paste listener for Ctrl+V image screenshots
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.indexOf("image") !== -1) {
                    const blob = item.getAsFile();
                    if (blob) {
                        handleProcessImageFile(blob);
                        break;
                    }
                }
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, []);

    const handleProcessImageFile = async (file) => {
        if (!file.type.startsWith("image/")) {
            setErrorMsg("Please upload a valid image file (PNG, JPG, WEBP, or GIF).");
            return;
        }

        setImageFile(file);
        setErrorMsg("");
        try {
            const dataUrl = await fileToDataUrl(file);
            setImagePreview(dataUrl);
        } catch (err) {
            setErrorMsg("Failed to read image file: " + err.message);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleProcessImageFile(e.dataTransfer.files[0]);
        }
    };

    // Generate a high-resolution SVG sample form image on the fly for quick demo testing
    const loadSampleFormImage = (type) => {
        let title = "ONLINE PROCESS CONTROLLER CHECKLIST";
        let docNo = "NENPL/QF/001";
        let company = "North East Nutrients Private Limited";
        let section = "PREMIXING & HYGIENE";

        if (type === "medical") {
            title = "CLINICAL INCIDENT & AUDIT REPORT";
            docNo = "MED-QA-904";
            company = "Apex Healthcare & Diagnostics";
            section = "INCIDENT CLASSIFICATION";
        } else if (type === "asset") {
            title = "IT EQUIPMENT REQUISITION FORM";
            docNo = "IT-REQ-2026";
            company = "Global Technologies Inc.";
            section = "HARDWARE & ACCESSORIES";
        }

        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200" style="background:#ffffff; font-family:Arial, sans-serif;">
            <rect width="100%" height="100%" fill="#ffffff"/>
            <rect x="25" y="25" width="850" height="1150" fill="none" stroke="#222222" stroke-width="2"/>
            
            <!-- Header -->
            <rect x="25" y="25" width="850" height="110" fill="#f8fafc" stroke="#222222" stroke-width="2"/>
            <text x="50" y="65" font-size="16" font-weight="bold" fill="#0f172a">${company}</text>
            <text x="50" y="100" font-size="22" font-weight="bold" fill="#1e293b">${title}</text>
            <text x="700" y="65" font-size="13" font-weight="bold" fill="#475569">Doc: ${docNo}</text>
            <text x="700" y="90" font-size="13" fill="#475569">Rev: 01 | Daily</text>
            
            <!-- Basic Fields -->
            <rect x="50" y="160" width="380" height="40" fill="none" stroke="#94a3b8" stroke-width="1.5" rx="4"/>
            <text x="65" y="185" font-size="14" fill="#64748b">Date: 2026-09-02</text>
            
            <rect x="470" y="160" width="380" height="40" fill="none" stroke="#94a3b8" stroke-width="1.5" rx="4"/>
            <text x="485" y="185" font-size="14" fill="#64748b">Inspector / Operator Name: John Smith</text>
            
            <!-- Section Header -->
            <rect x="50" y="230" width="800" height="36" fill="#1e293b"/>
            <text x="65" y="254" font-size="14" font-weight="bold" fill="#ffffff">${section}</text>
            
            <!-- Table Header -->
            <rect x="50" y="280" width="800" height="38" fill="#e2e8f0" stroke="#475569" stroke-width="1"/>
            <text x="65" y="304" font-size="13" font-weight="bold" fill="#0f172a">#</text>
            <text x="100" y="304" font-size="13" font-weight="bold" fill="#0f172a">Check Point / Item Description</text>
            <text x="620" y="304" font-size="13" font-weight="bold" fill="#0f172a">Status (OK/Not OK)</text>
            <text x="760" y="304" font-size="13" font-weight="bold" fill="#0f172a">Remarks</text>
            
            <!-- Table Rows -->
            <rect x="50" y="318" width="800" height="45" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
            <text x="65" y="345" font-size="13" fill="#334155">1</text>
            <text x="100" y="345" font-size="13" fill="#334155">Check for presence of IPA &amp; sanitization solution</text>
            <rect x="615" y="326" width="100" height="28" fill="#ecfdf5" stroke="#10b981" rx="4"/>
            <text x="645" y="345" font-size="12" font-weight="bold" fill="#065f46">OK</text>
            <line x1="740" y1="345" x2="830" y2="345" stroke="#cbd5e1" stroke-width="1"/>
            
            <rect x="50" y="363" width="800" height="45" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
            <text x="65" y="390" font-size="13" fill="#334155">2</text>
            <text x="100" y="390" font-size="13" fill="#334155">Check temperature of mixing unit not more than 45°C</text>
            <rect x="615" y="371" width="100" height="28" fill="#ecfdf5" stroke="#10b981" rx="4"/>
            <text x="645" y="390" font-size="12" font-weight="bold" fill="#065f46">OK</text>
            <line x1="740" y1="390" x2="830" y2="390" stroke="#cbd5e1" stroke-width="1"/>

            <rect x="50" y="408" width="800" height="45" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
            <text x="65" y="435" font-size="13" fill="#334155">3</text>
            <text x="100" y="435" font-size="13" fill="#334155">Check cleanliness of utensils, hoppers &amp; containers</text>
            <rect x="615" y="416" width="100" height="28" fill="#fef2f2" stroke="#ef4444" rx="4"/>
            <text x="635" y="435" font-size="12" font-weight="bold" fill="#991b1b">NOT OK</text>
            <text x="745" y="435" font-size="12" fill="#64748b">Cleaned at 10 AM</text>
            
            <!-- Remarks Area -->
            <text x="50" y="500" font-size="14" font-weight="bold" fill="#0f172a">General Observations / Corrective Action:</text>
            <rect x="50" y="515" width="800" height="80" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" rx="4"/>
            <text x="65" y="545" font-size="13" fill="#64748b">All primary hygiene parameters verified. Container 3 scheduled for sanitization.</text>
            
            <!-- Signature Box -->
            <text x="50" y="640" font-size="14" font-weight="bold" fill="#0f172a">Authorized Operator Signature:</text>
            <rect x="50" y="655" width="360" height="110" fill="#ffffff" stroke="#475569" stroke-width="1.5" stroke-dasharray="4 4" rx="4"/>
            <path d="M 80 720 Q 140 670, 200 710 T 320 690" stroke="#1e293b" stroke-width="3" fill="none"/>
            <text x="80" y="750" font-size="12" fill="#94a3b8">Digitally signed &amp; verified</text>
        </svg>`;

        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result);
            setImageFile(blob);
            setErrorMsg("");
        };
        reader.readAsDataURL(blob);
    };

    const handleExtractAndGenerate = async () => {
        if (!imagePreview) {
            setErrorMsg("Please upload or select a form image first.");
            return;
        }

        setErrorMsg("");
        setIsGenerating(true);
        setStatusStep("Connecting to Groq Vision API...");

        try {
            const activeModel = selectedModel === "custom" ? customModel : selectedModel;
            setStatusStep(`Analyzing form structure with ${activeModel}...`);

            const generatedSchema = await generateFormFromImage({
                imageBase64: imagePreview,
                model: activeModel,
                customPrompt
            });

            setStatusStep("Successfully extracted form schema! Rendering form...");
            setTimeout(() => {
                setIsGenerating(false);
                setStatusStep("");
                if (onFormGenerated) {
                    onFormGenerated(generatedSchema, imagePreview);
                }
            }, 600);
        } catch (err) {
            setIsGenerating(false);
            setStatusStep("");
            setErrorMsg(err.message || "Failed to generate form from image.");
        }
    };

    return (
        <div className="image-generator-container">
            {/* HERO BANNER */}
            <div className="generator-hero-banner">
                <h2>Upload ANY Form Image → Instant Interactive Form</h2>
                <p>
                    Convert the paper forms in the digital interactive forms.
                </p>
            </div>

            <div className="generator-grid-layout">
                {/* LEFT PANEL: CONFIG & UPLOAD */}
                <div className="generator-config-card">
                    {/* MODEL SELECTOR */}
                    <div className="config-section">
                        <div className="section-title-row">
                            <label className="section-label"> Groq Model</label>
                            {/* <span className="api-key-status-pill">⚡ API Key Connected</span> */}
                        </div>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="model-select-dropdown"
                        >
                            {AVAILABLE_GROQ_MODELS.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                            <option value="custom">Custom Model ID...</option>
                        </select>
                        {selectedModel === "custom" && (
                            <input
                                type="text"
                                value={customModel}
                                onChange={(e) => setCustomModel(e.target.value)}
                                placeholder="e.g. qwen/qwen3.8-27b or custom model endpoint"
                                className="custom-model-input"
                            />
                        )}
                    </div>

                    {/* IMAGE DROPZONE */}
                    <div className="config-section">
                        <label className="section-label"> Form Image Source</label>
                        <div
                            className={`image-dropzone ${dragActive ? "drag-active" : ""} ${imagePreview ? "has-image" : ""}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                onChange={(e) => e.target.files?.[0] && handleProcessImageFile(e.target.files[0])}
                                style={{ display: "none" }}
                            />
                            {imagePreview ? (
                                <div className="preview-container">
                                    <img src={imagePreview} alt="Form preview" className="uploaded-image-preview" />
                                    <div className="preview-overlay">
                                        <span>Click or drop new image to replace</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="dropzone-empty-state">
                                    <div className="dropzone-icon">📄</div>
                                    <p className="dropzone-primary-text">
                                        <strong>Click to browse</strong> or drag & drop form image
                                    </p>
                                    <p className="dropzone-sub-text">
                                        PNG, JPG, WEBP • Or press <strong>Ctrl+V</strong> to paste screenshot
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* SAMPLE DEMO BUTTONS */}
                        {/* <div className="sample-images-bar">
                            <span className="sample-bar-label">Or try a demo form image:</span>
                            <div className="sample-buttons-row">
                                <button
                                    type="button"
                                    className="sample-img-btn"
                                    onClick={() => loadSampleFormImage("industrial")}
                                >
                                    🏭 Industrial Checklist
                                </button>
                                <button
                                    type="button"
                                    className="sample-img-btn"
                                    onClick={() => loadSampleFormImage("medical")}
                                >
                                    🏥 Clinical Report
                                </button>
                                <button
                                    type="button"
                                    className="sample-img-btn"
                                    onClick={() => loadSampleFormImage("asset")}
                                >
                                    💻 Requisition Form
                                </button>
                            </div>
                        </div> */}
                    </div>

                    {/* CUSTOM INSTRUCTION PROMPT */}
                    <div className="config-section">
                        <label className="section-label">
                            Optional Extraction Notes / Instructions.
                        </label>
                        <input
                            type="text"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g. Include specific dropdown options for status, or make signature required"
                            className="prompt-input"
                        />
                    </div>

                    {/* ERROR BANNER */}
                    {errorMsg && (
                        <div className="generator-error-banner">
                            <span className="error-icon">⚠️</span>
                            <div>
                                <strong>Extraction Failed:</strong> {errorMsg}
                            </div>
                        </div>
                    )}

                    {/* SUBMIT BUTTON */}
                    <div className="generator-action-row">
                        <button
                            type="button"
                            className={`extract-btn ${isGenerating ? "loading" : ""}`}
                            onClick={handleExtractAndGenerate}
                            disabled={isGenerating || !imagePreview}
                        >
                            {isGenerating ? (
                                <>
                                    <span className="btn-spinner"></span>
                                    <span>Processing with Groq Vision...</span>
                                </>
                            ) : (
                                <>
                                    <span>⚡</span>
                                    <span>Extract &amp; Generate Form with AI</span>
                                </>
                            )}
                        </button>
                    </div>

                    {statusStep && (
                        <div className="generator-status-indicator">
                            <span className="status-dot-pulse"></span>
                            <span>{statusStep}</span>
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL: LIVE VISUAL PREVIEW & FEATURES */}
                <div className="generator-preview-panel">
                    <div className="preview-card-header">
                        <h3>Uploaded Document View</h3>
                        {imageFile && <span className="image-filename-tag">{imageFile.name || "Pasted image"}</span>}
                    </div>

                    <div className="document-viewport">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Full document" className="full-document-img" />
                        ) : (
                            <div className="viewport-placeholder">
                                <div className="placeholder-icon">📋</div>
                                <h4>No Form Image Loaded Yet</h4>
                                <p>Upload any scanned document, photograph, or screenshot of a form to analyze.</p>
                                <div className="features-checklist">
                                    <div className="feature-item">✓ Automatically detects headers, IDs, and revision numbers</div>
                                    <div className="feature-item">✓ Converts complex tables, matrices &amp; sectioned checklists</div>
                                    <div className="feature-item">✓ Generates dropdowns, radio pills &amp; multi-checkboxes</div>
                                    <div className="feature-item">✓ Adds interactive Canvas Signature Pad for sign-offs</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
