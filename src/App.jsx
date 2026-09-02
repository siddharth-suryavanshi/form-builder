import React, { useState } from "react";
import DynamicForm from "./DynamicForm";
import ImageFormGenerator from "./components/ImageFormGenerator";
import { sampleForms } from "./forms/sampleForms";
import "./DynamicForm.css";

export default function App() {
    const [activeTab, setActiveTab] = useState("ai_upload"); // "ai_upload" | "form" | "editor" | "samples"
    const [selectedSampleId, setSelectedSampleId] = useState(sampleForms[0].id);
    const [currentSchema, setCurrentSchema] = useState(sampleForms[0].schema);
    const [customJsonText, setCustomJsonText] = useState(JSON.stringify(sampleForms[0].schema, null, 2));
    const [jsonError, setJsonError] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastGeneratedImage, setLastGeneratedImage] = useState(null);
    const [notification, setNotification] = useState(null);

    const showNotification = (msg, type = "success") => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 4000);
    };

    // Callback when Groq Vision AI extracts a form schema from image
    const handleFormGenerated = (newSchema, imageBase64) => {
        setCurrentSchema(newSchema);
        setCustomJsonText(JSON.stringify(newSchema, null, 2));
        setLastGeneratedImage(imageBase64);
        setActiveTab("form");
        showNotification("✨ AI Form Successfully Generated & Rendered!");
    };

    // Preset sample selector
    const handleSelectSample = (sample) => {
        setSelectedSampleId(sample.id);
        setCurrentSchema(sample.schema);
        setCustomJsonText(JSON.stringify(sample.schema, null, 2));
        setJsonError("");
        setActiveTab("form");
        showNotification(`Loaded template: ${sample.name}`);
    };

    // Apply manual edits from JSON editor
    const handleApplyJsonEditor = () => {
        try {
            const parsed = JSON.parse(customJsonText);
            setCurrentSchema(parsed);
            setJsonError("");
            setActiveTab("form");
            showNotification("Applied updated JSON Schema!");
        } catch (err) {
            setJsonError(`Invalid JSON syntax: ${err.message}`);
        }
    };

    // Direct JSON file upload
    const handleJsonFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result;
                const parsed = JSON.parse(content);
                setCurrentSchema(parsed);
                setCustomJsonText(JSON.stringify(parsed, null, 2));
                setJsonError("");
                setActiveTab("form");
                showNotification(`Loaded JSON file: ${file.name}`);
            } catch (err) {
                setJsonError(`Failed to parse uploaded JSON: ${err.message}`);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="app-shell">
            {/* TOP NAVIGATION BAR */}
            <header className="app-topbar">
                <div className="app-branding">
                    <div>
                        <h1 className="app-title">form builder</h1>
                    </div>
                </div>

                <div className="topbar-controls">
                    <div className="view-mode-tabs">
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === "ai_upload" ? "active" : ""}`}
                            onClick={() => setActiveTab("ai_upload")}
                        >
                            image to form 
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === "form" ? "active" : ""}`}
                            onClick={() => setActiveTab("form")}
                        >
                             Rendered Form
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === "editor" ? "active" : ""}`}
                            onClick={() => setActiveTab("editor")}
                        >
                             JSON Schema
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === "samples" ? "active" : ""}`}
                            onClick={() => setActiveTab("samples")}
                        >
                            Sample Library
                        </button>
                    </div>

                    <label className="upload-schema-btn">
                        <span>Load JSON</span>
                        <input
                            type="file"
                            accept=".json,application/json"
                            onChange={handleJsonFileUpload}
                            style={{ display: "none" }}
                        />
                    </label>
                </div>
            </header>

            {/* NOTIFICATION TOAST */}
            {notification && (
                <div className={`notification-toast toast-${notification.type}`}>
                    <span>{notification.msg}</span>
                </div>
            )}

            {/* MAIN WORKSPACE */}
            <main className="app-main-content">
                {/* TAB 1: AI IMAGE-TO-FORM GENERATOR */}
                {activeTab === "ai_upload" && (
                    <ImageFormGenerator
                        onFormGenerated={handleFormGenerated}
                        isGenerating={isGenerating}
                        setIsGenerating={setIsGenerating}
                    />
                )}

                {/* TAB 2: LIVE RENDERED FORM */}
                {activeTab === "form" && (
                    <div className="form-renderer-tab-view">
                        <div className="form-view-top-actions">
                            <button
                                type="button"
                                className="action-pill-btn"
                                onClick={() => setActiveTab("ai_upload")}
                            >
                                Upload Another Form Image
                            </button>
                            <button
                                type="button"
                                className="action-pill-btn"
                                onClick={() => setActiveTab("editor")}
                            >
                                View / Edit Raw JSON Schema
                            </button>
                            {lastGeneratedImage && (
                                <button
                                    type="button"
                                    className="action-pill-btn"
                                    onClick={() => {
                                        const w = window.open("");
                                        w.document.write(`<img src="${lastGeneratedImage}" style="max-width:100%; height:auto;" />`);
                                    }}
                                >
                                    View Source Image
                                </button>
                            )}
                        </div>

                        <DynamicForm
                            formSchema={currentSchema}
                            onSubmitSuccess={(payload) => {
                                showNotification("Form submitted! Output captured.");
                            }}
                        />
                    </div>
                )}

                {/* TAB 3: JSON SCHEMA CODE EDITOR */}
                {activeTab === "editor" && (
                    <div className="json-editor-view">
                        <div className="editor-header">
                            <div>
                                <h2>Form JSON Schema Inspector &amp; Live Editor</h2>
                                <p>Inspect, edit, or paste ANY AI-generated form JSON schema below. Click "Apply &amp; Render" to test instantly.</p>
                            </div>
                            <div className="editor-action-buttons">
                                <button
                                    type="button"
                                    className="apply-json-btn"
                                    onClick={handleApplyJsonEditor}
                                >
                                    ▶ Apply &amp; Render Form
                                </button>
                            </div>
                        </div>

                        {jsonError && (
                            <div className="editor-error-alert">
                                <strong>Syntax Error:</strong> {jsonError}
                            </div>
                        )}

                        <textarea
                            className="json-textarea-input"
                            value={customJsonText}
                            onChange={(e) => {
                                setCustomJsonText(e.target.value);
                                setJsonError("");
                            }}
                            placeholder="Paste your form JSON schema here..."
                            rows={26}
                            spellCheck={false}
                        />
                    </div>
                )}

                {/* TAB 4: SAMPLE PRESET FORMS */}
                {activeTab === "samples" && (
                    <div className="sample-forms-library-view">
                        <div className="library-header">
                            <h2>Pre-Loaded Form Schema Library</h2>
                            <p>Select any form archetype to see how the universal renderer handles different industrial and enterprise formats:</p>
                        </div>

                        <div className="sample-cards-grid">
                            {sampleForms.map((sample) => (
                                <div
                                    key={sample.id}
                                    className={`sample-card ${selectedSampleId === sample.id ? "active-sample" : ""}`}
                                    onClick={() => handleSelectSample(sample)}
                                >
                                    <div className="sample-card-badge">{sample.badge}</div>
                                    <h3>{sample.name}</h3>
                                    <p>{sample.description}</p>
                                    <button type="button" className="load-sample-btn">
                                        Render This Form →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
