import React, { useState, useEffect, useMemo } from "react";
import { normalizeFormSchema } from "./utils/schemaNormalizer";
import SignaturePad from "./components/SignaturePad";
import FormTable from "./components/FormTable";
import "./DynamicForm.css";

export default function DynamicForm({ formSchema, onSubmitSuccess, initialValues = {} }) {
    // 1. Normalize schema safely
    const normalized = useMemo(() => {
        return normalizeFormSchema(formSchema);
    }, [formSchema]);

    const { meta, fields, isValid, error } = normalized;

    // 2. Initialize Form State
    const [formData, setFormData] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [submissionData, setSubmissionData] = useState(null);

    // Reset or initialize form values when schema changes
    useEffect(() => {
        const initial = { ...initialValues };

        const seedValues = (fieldList) => {
            if (!Array.isArray(fieldList)) return;
            fieldList.forEach(field => {
                if (field.defaultValue !== undefined && field.defaultValue !== "" && initial[field.id] === undefined) {
                    initial[field.id] = field.defaultValue;
                }
                // Seed children if section
                if (field.children) {
                    seedValues(field.children);
                }
            });
        };

        seedValues(fields);
        setFormData(initial);
        setSubmitted(false);
        setValidationErrors({});
        setSubmissionData(null);
    }, [formSchema, fields]);

    const handleChange = (fieldId, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));

        // Clear validation error on change
        if (validationErrors[fieldId]) {
            setValidationErrors(prev => {
                const updated = { ...prev };
                delete updated[fieldId];
                return updated;
            });
        }
        setSubmitted(false);
    };

    const handleReset = () => {
        setFormData({});
        setValidationErrors({});
        setSubmitted(false);
        setSubmissionData(null);
    };

    // Form Submission & Validation
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate required fields
        const errors = {};
        const validateFields = (fieldList) => {
            fieldList.forEach(field => {
                if (field.required) {
                    const val = formData[field.id];
                    if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
                        errors[field.id] = `${field.label || "This field"} is required.`;
                    }
                }
                if (field.children) {
                    validateFields(field.children);
                }
            });
        };

        validateFields(fields);

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            // Scroll to first error
            const firstErrField = Object.keys(errors)[0];
            const element = document.getElementById(`field-container-${firstErrField}`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            return;
        }

        console.log("UNIVERSAL FORM SUBMITTED DATA:", formData);
        setSubmissionData(formData);
        setSubmitted(true);

        if (onSubmitSuccess) {
            onSubmitSuccess(formData);
        }
    };

    if (!isValid && error) {
        return (
            <div className="form-error-state">
                <div className="error-icon">⚠️</div>
                <h3>Unable to Render Form</h3>
                <p>{error}</p>
                <div className="error-hint">Please verify that your JSON format is valid syntax.</div>
            </div>
        );
    }

    return (
        <div className="universal-form-container">
            {/* FORM HEADER & METADATA BANNER */}
            <div className="form-header-card">
                <div className="header-top-row">
                    <div className="header-main-info">
                        {meta.company && <span className="company-tag">{meta.company}</span>}
                        <h1 className="form-title">{meta.title || "Untitled Form"}</h1>
                        {meta.description && <p className="form-subtitle">{meta.description}</p>}
                        {meta.address && <p className="company-address">{meta.address}</p>}
                    </div>

                    <div className="header-meta-badges">
                        {meta.documentNumber && (
                            <div className="meta-badge">
                                <span className="meta-badge-label">Doc No:</span>
                                <span className="meta-badge-value">{meta.documentNumber}</span>
                            </div>
                        )}
                        {meta.revision && (
                            <div className="meta-badge">
                                <span className="meta-badge-label">Rev:</span>
                                <span className="meta-badge-value">{meta.revision}</span>
                            </div>
                        )}
                        {meta.frequency && (
                            <div className="meta-badge">
                                <span className="meta-badge-label">Freq:</span>
                                <span className="meta-badge-value">{meta.frequency}</span>
                            </div>
                        )}
                        {meta.version && (
                            <div className="meta-badge">
                                <span className="meta-badge-label">Version:</span>
                                <span className="meta-badge-value">{meta.version}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSubmit} noValidate className="form-body-root">
                <div className="form-fields-grid">
                    {fields.map((field, idx) => (
                        <FieldRenderer
                            key={field.id || idx}
                            field={field}
                            value={formData[field.id]}
                            onChange={(val) => handleChange(field.id, val)}
                            formData={formData}
                            onNestedChange={handleChange}
                            error={validationErrors[field.id]}
                        />
                    ))}
                </div>

                {/* FORM ACTIONS TOOLBAR */}
                <div className="form-actions-toolbar">
                    <button type="submit" className="submit-btn primary-action-btn">
                        <span>✓</span> Submit Form
                    </button>
                    <button type="button" onClick={handleReset} className="reset-btn secondary-action-btn">
                        <span>↺</span> Reset
                    </button>
                    <button type="button" onClick={() => window.print()} className="print-btn secondary-action-btn">
                        <span>🖨️</span> Print / PDF
                    </button>
                </div>
            </form>

            {/* SUBMISSION SUCCESS MODAL / PAYLOAD VIEWER */}
            {submitted && submissionData && (
                <div className="submission-success-banner">
                    <div className="success-banner-header">
                        <div className="success-icon-badge">✓</div>
                        <div>
                            <h3>Form Submitted Successfully!</h3>
                            <p>Here is the captured structured payload ready for API dispatch:</p>
                        </div>
                    </div>
                    <div className="payload-json-box">
                        <pre>{JSON.stringify(submissionData, null, 2)}</pre>
                    </div>
                    <div className="payload-actions">
                        <button
                            type="button"
                            className="copy-payload-btn"
                            onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(submissionData, null, 2));
                                alert("Submission JSON copied to clipboard!");
                            }}
                        >
                            📋 Copy JSON Output
                        </button>
                        <button
                            type="button"
                            className="dismiss-payload-btn"
                            onClick={() => setSubmitted(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// -------------------------------------------------------------
// RECURSIVE FIELD RENDERER
// -------------------------------------------------------------
function FieldRenderer({ field, value, onChange, formData, onNestedChange, error }) {
    if (!field) return null;

    // 1. Structural Containers
    if (field.type === "section") {
        return (
            <div className="form-section-card full-width-span" id={`field-container-${field.id}`}>
                <div className="section-card-header">
                    <h3>{field.label}</h3>
                    {field.description && <p className="section-desc">{field.description}</p>}
                </div>
                {field.children && field.children.length > 0 && (
                    <div className="section-children-grid">
                        {field.children.map((childField, cIdx) => (
                            <FieldRenderer
                                key={childField.id || cIdx}
                                field={childField}
                                value={formData[childField.id]}
                                onChange={(val) => onNestedChange(childField.id, val)}
                                formData={formData}
                                onNestedChange={onNestedChange}
                                error={error}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (field.type === "divider") {
        return <hr className="form-divider full-width-span" />;
    }

    if (field.type === "label") {
        return (
            <div className="form-label-banner full-width-span" id={`field-container-${field.id}`}>
                <p className="form-label-text">{field.label}</p>
                {field.description && <span className="form-label-sub">{field.description}</span>}
            </div>
        );
    }

    // 2. Table / Complex Matrix
    if (field.type === "table") {
        return (
            <div className="form-field-wrapper full-width-span" id={`field-container-${field.id}`}>
                <div className="field-label-row">
                    <label className="field-label font-bold">
                        {field.label}
                        {field.required && <span className="required-star">*</span>}
                    </label>
                    {field.description && <span className="field-desc">{field.description}</span>}
                </div>
                <FormTable
                    field={field}
                    value={value}
                    onChange={onChange}
                    disabled={field.disabled}
                />
                {error && <div className="field-validation-error">{error}</div>}
            </div>
        );
    }

    // 3. Signature
    if (field.type === "signature") {
        return (
            <div className="form-field-wrapper signature-field-wrapper" id={`field-container-${field.id}`}>
                <div className="field-label-row">
                    <label className="field-label">
                        {field.label}
                        {field.required && <span className="required-star">*</span>}
                    </label>
                    {field.description && <span className="field-desc">{field.description}</span>}
                </div>
                <SignaturePad
                    value={value}
                    onChange={onChange}
                    label={field.label}
                    disabled={field.disabled}
                />
                {error && <div className="field-validation-error">{error}</div>}
            </div>
        );
    }

    // 4. Standard Input Widgets
    const spanClass = field.gridSpan === 12 ? "full-width-span" : "half-width-span";

    return (
        <div className={`form-field-wrapper ${spanClass}`} id={`field-container-${field.id}`}>
            <div className="field-label-row">
                <label htmlFor={field.id} className="field-label">
                    {field.label}
                    {field.required && <span className="required-star">*</span>}
                </label>
                {field.description && <span className="field-desc">{field.description}</span>}
            </div>

            <div className="field-input-container">
                {renderInputWidget(field, value, onChange)}
            </div>

            {error && <div className="field-validation-error">{error}</div>}
        </div>
    );
}

// -------------------------------------------------------------
// INPUT WIDGET DISPATCHER
// -------------------------------------------------------------
function renderInputWidget(field, value, onChange) {
    const val = value ?? "";

    switch (field.type) {
        case "textarea":
            return (
                <textarea
                    id={field.id}
                    value={val}
                    rows={field.rows || 3}
                    placeholder={field.placeholder || "Enter details..."}
                    disabled={field.disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="universal-textarea"
                />
            );

        case "dropdown":
            return (
                <select
                    id={field.id}
                    value={val}
                    disabled={field.disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="universal-select"
                >
                    <option value="">{field.placeholder || "— Select an option —"}</option>
                    {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );

        case "radio":
            return (
                <div className="universal-radio-group">
                    {field.options.map((opt) => (
                        <label key={opt.value} className={`radio-pill ${val === opt.value ? "selected" : ""}`}>
                            <input
                                type="radio"
                                name={field.id}
                                value={opt.value}
                                checked={val === opt.value}
                                disabled={field.disabled}
                                onChange={(e) => onChange(e.target.value)}
                            />
                            <span>{opt.label}</span>
                        </label>
                    ))}
                </div>
            );

        case "checkbox":
            return (
                <label className="universal-checkbox-label">
                    <input
                        type="checkbox"
                        id={field.id}
                        checked={Boolean(val === true || val === "true")}
                        disabled={field.disabled}
                        onChange={(e) => onChange(e.target.checked)}
                        className="universal-checkbox"
                    />
                    <span className="checkbox-custom-box"></span>
                    <span className="checkbox-text">{field.placeholder || field.label}</span>
                </label>
            );

        case "multiselect": {
            const selectedList = Array.isArray(val) ? val : [];
            const handleToggle = (optVal) => {
                if (selectedList.includes(optVal)) {
                    onChange(selectedList.filter(item => item !== optVal));
                } else {
                    onChange([...selectedList, optVal]);
                }
            };

            return (
                <div className="multiselect-group">
                    {field.options.map((opt) => {
                        const isChecked = selectedList.includes(opt.value);
                        return (
                            <label key={opt.value} className={`multiselect-pill ${isChecked ? "checked" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={field.disabled}
                                    onChange={() => handleToggle(opt.value)}
                                />
                                <span>{opt.label}</span>
                            </label>
                        );
                    })}
                </div>
            );
        }

        case "rating": {
            const currentScore = Number(val) || 0;
            return (
                <div className="rating-star-container">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className={`star-btn ${star <= currentScore ? "active" : ""}`}
                            onClick={() => onChange(star)}
                            disabled={field.disabled}
                        >
                            ★
                        </button>
                    ))}
                    <span className="rating-score-text">
                        {currentScore > 0 ? `${currentScore} / 5 Stars` : "Not Rated"}
                    </span>
                </div>
            );
        }

        case "slider":
            return (
                <div className="slider-wrapper">
                    <input
                        type="range"
                        id={field.id}
                        min={field.min ?? 0}
                        max={field.max ?? 100}
                        step={field.step ?? 1}
                        value={val || field.min || 0}
                        disabled={field.disabled}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="universal-slider"
                    />
                    <span className="slider-badge">{val || field.min || 0}</span>
                </div>
            );

        case "file":
            return (
                <div className="file-upload-wrapper">
                    <input
                        type="file"
                        id={field.id}
                        disabled={field.disabled}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                onChange({
                                    name: file.name,
                                    size: `${(file.size / 1024).toFixed(1)} KB`,
                                    type: file.type
                                });
                            }
                        }}
                        className="file-input-native"
                    />
                    <div className="file-upload-display">
                        <span className="upload-icon">📁</span>
                        <span className="upload-text">
                            {val?.name ? `Selected: ${val.name} (${val.size})` : "Choose a file to attach..."}
                        </span>
                    </div>
                </div>
            );

        case "date":
            return (
                <input
                    type="date"
                    id={field.id}
                    value={val}
                    disabled={field.disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="universal-input"
                />
            );

        case "time":
            return (
                <input
                    type="time"
                    id={field.id}
                    value={val}
                    disabled={field.disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="universal-input"
                />
            );

        case "datetime":
            return (
                <input
                    type="datetime-local"
                    id={field.id}
                    value={val}
                    disabled={field.disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="universal-input"
                />
            );

        case "number":
            return (
                <input
                    type="number"
                    id={field.id}
                    value={val}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    placeholder={field.placeholder || "0"}
                    disabled={field.disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="universal-input"
                />
            );

        case "email":
            return (
                <input
                    type="email"
                    id={field.id}
                    value={val}
                    placeholder={field.placeholder || "name@example.com"}
                    disabled={field.disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="universal-input"
                />
            );

        case "tel":
            return (
                <input
                    type="tel"
                    id={field.id}
                    value={val}
                    placeholder={field.placeholder || "+1 (555) 000-0000"}
                    disabled={field.disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="universal-input"
                />
            );

        case "password":
            return (
                <input
                    type="password"
                    id={field.id}
                    value={val}
                    placeholder={field.placeholder || "••••••••"}
                    disabled={field.disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="universal-input"
                />
            );

        case "text":
        default:
            return (
                <input
                    type="text"
                    id={field.id}
                    value={val}
                    placeholder={field.placeholder || ""}
                    disabled={field.disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="universal-input"
                />
            );
    }
}