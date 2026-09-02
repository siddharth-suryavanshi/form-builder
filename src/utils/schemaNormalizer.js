/**
 * Universal Form Schema Normalizer
 * Standardizes ANY incoming JSON form definition into a consistent schema representation.
 * Supports enterprise forms, AI-generated forms, Formik/React JSON schema,
 * OpenAPI/JSON Schema formats, flat arrays, and sectioned checklist tables.
 */

// Helper: Safely generate a slug/id from text
export function toSlug(str) {
    if (!str || typeof str !== "string") return "field_" + Math.random().toString(36).substring(2, 9);
    return str
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
        .replace(/^_+|_+$/g, "") || "field_" + Math.random().toString(36).substring(2, 9);
}

// Helper: Normalize options from various shapes into [{ label, value }]
export function normalizeOptions(rawOptions) {
    if (!rawOptions) return [];

    // Comma-separated string
    if (typeof rawOptions === "string") {
        return rawOptions.split(",").map(opt => {
            const trimmed = opt.trim();
            return { label: trimmed, value: trimmed };
        }).filter(o => o.value);
    }

    // Object map: { "val1": "Label 1", "val2": "Label 2" }
    if (typeof rawOptions === "object" && !Array.isArray(rawOptions)) {
        return Object.entries(rawOptions).map(([val, lbl]) => ({
            value: String(val),
            label: typeof lbl === "string" ? lbl : String(val)
        }));
    }

    // Array
    if (Array.isArray(rawOptions)) {
        return rawOptions.map(opt => {
            if (opt === null || opt === undefined) return null;

            // Primitive (string, number, boolean)
            if (typeof opt !== "object") {
                return { label: String(opt), value: String(opt) };
            }

            // Object with various key naming conventions
            const value = opt.value ?? opt.id ?? opt.key ?? opt.code ?? opt.name ?? opt.val ?? opt.label;
            const label = opt.label ?? opt.name ?? opt.title ?? opt.text ?? opt.caption ?? opt.description ?? String(value);

            return {
                value: String(value ?? ""),
                label: String(label ?? value ?? "")
            };
        }).filter(Boolean);
    }

    return [];
}

// Helper: Map diverse field type strings into standardized types
export function normalizeFieldType(rawType) {
    if (!rawType || typeof rawType !== "string") return "text";
    const t = rawType.toLowerCase().trim().replace(/[-_ ]+/g, "");

    switch (t) {
        // Text & Strings
        case "text":
        case "string":
        case "input":
        case "varchar":
        case "char":
        case "singleline":
        case "shorttext":
            return "text";

        // Numbers
        case "number":
        case "int":
        case "integer":
        case "float":
        case "decimal":
        case "currency":
        case "numeric":
        case "amount":
        case "price":
        case "quantity":
            return "number";

        // Textarea / Multiline
        case "textarea":
        case "longtext":
        case "multiline":
        case "paragraph":
        case "notes":
        case "description":
        case "comment":
        case "comments":
            return "textarea";

        // Dropdown / Select
        case "dropdown":
        case "select":
        case "singleselect":
        case "options":
        case "choice":
        case "combobox":
        case "list":
            return "dropdown";

        // Radio
        case "radio":
        case "radiogroup":
        case "singlechoice":
        case "radiobutton":
        case "radios":
            return "radio";

        // Checkbox & Booleans
        case "checkbox":
        case "boolean":
        case "bool":
        case "switch":
        case "toggle":
            return "checkbox";

        // Multiselect / Tags / Multiple checkboxes
        case "checkboxgroup":
        case "checkboxes":
        case "multiselect":
        case "multiple":
        case "tags":
        case "checklistoptions":
            return "multiselect";

        // Dates & Times
        case "date":
            return "date";
        case "time":
            return "time";
        case "datetime":
        case "datetimelocal":
        case "timestamp":
            return "datetime";
        case "month":
            return "month";
        case "year":
            return "year";

        // Email, Phone, URL, Password
        case "email":
            return "email";
        case "tel":
        case "phone":
        case "telephone":
        case "mobile":
            return "tel";
        case "url":
        case "link":
        case "website":
            return "url";
        case "password":
            return "password";

        // Table / Repeater / Grid / Checklist
        case "table":
        case "grid":
        case "matrix":
        case "datagrid":
        case "repeater":
        case "subform":
        case "items":
        case "checklist":
        case "checklisttable":
        case "array":
            return "table";

        // Signature
        case "signature":
        case "sign":
        case "signaturepad":
        case "draw":
        case "drawing":
            return "signature";

        // File upload
        case "file":
        case "upload":
        case "attachment":
        case "image":
        case "photo":
        case "document":
            return "file";

        // Rating & Slider
        case "rating":
        case "star":
        case "stars":
        case "score":
        case "rate":
            return "rating";
        case "slider":
        case "range":
            return "slider";

        // Color
        case "color":
        case "picker":
            return "color";

        // Sections & Containers
        case "section":
        case "header":
        case "heading":
        case "group":
        case "fieldset":
        case "category":
        case "panel":
        case "card":
        case "container":
            return "section";

        case "divider":
        case "separator":
        case "hr":
            return "divider";

        // Labels & Informational
        case "label":
        case "info":
        case "help":
        case "alert":
        case "instruction":
        case "message":
        case "statictext":
        case "notice":
            return "label";

        // Status specific
        case "status":
            return "status";

        default:
            return "text";
    }
}

// Normalize a Table Column definition
export function normalizeTableColumn(col, index) {
    if (!col) return null;

    if (typeof col === "string") {
        return {
            id: toSlug(col),
            label: col,
            type: "text",
            width: "auto",
            options: []
        };
    }

    const id = col.id || col.name || col.key || col.field || col.fieldId || `col_${index}`;
    const label = col.label || col.title || col.name || col.header || col.text || id;
    const type = normalizeFieldType(col.type || "text");
    const options = normalizeOptions(col.options || col.choices || col.values || col.enum);
    const width = col.width ? (typeof col.width === "number" ? `${col.width}px` : col.width) : "auto";

    return {
        id: String(id),
        label: String(label),
        type,
        width,
        options,
        required: Boolean(col.required || col.mandatory),
        placeholder: col.placeholder || "",
        defaultValue: col.defaultValue ?? col.default_value ?? col.default ?? ""
    };
}

// Normalize a single Field / Element
export function normalizeField(field, index = 0) {
    if (!field || typeof field !== "object") return null;

    // Resolve field ID
    const rawId = field.id ?? field.name ?? field.key ?? field.field ?? field.fieldId ?? field.name_id ?? field._id ?? `field_${index}`;
    const id = String(rawId);

    // Resolve Label
    const label = field.label ?? field.title ?? field.name ?? field.header ?? field.prompt ?? field.question ?? field.text ?? field.caption ?? (typeof rawId === "string" ? rawId.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : `Field ${index + 1}`);

    // Resolve Type
    let rawType = field.type;
    if (!rawType) {
        if (field.columns || field.sections || (Array.isArray(field.rows) && field.rows.length > 0)) {
            rawType = "table";
        } else if (field.options || field.choices || field.enum) {
            rawType = "dropdown";
        } else if (field.fields || field.elements || field.items || field.children) {
            rawType = "section";
        } else {
            rawType = "text";
        }
    }
    const type = normalizeFieldType(rawType);

    // Resolve Options
    const options = normalizeOptions(field.options ?? field.choices ?? field.values ?? field.enum ?? field.items);

    // Resolve Validation / Constraints
    const required = Boolean(
        field.required === true ||
        field.required === "true" ||
        field.mandatory === true ||
        field.is_required === true ||
        field.validation?.required === true ||
        field.rules?.some?.(r => r.required)
    );

    const min = field.min ?? field.minimum ?? field.minLength;
    const max = field.max ?? field.maximum ?? field.maxLength;
    const step = field.step;
    const placeholder = field.placeholder ?? field.hint ?? "";
    const description = field.description ?? field.help_text ?? field.helpText ?? field.tooltip ?? field.subtitle ?? "";
    const defaultValue = field.defaultValue ?? field.default_value ?? field.default ?? field.value ?? field.initialValue ?? "";
    const disabled = Boolean(field.disabled || field.readonly || field.readOnly);
    const gridSpan = field.gridSpan ?? field.colSpan ?? field.width ?? field.columns ?? (type === "table" || type === "section" ? 12 : 6);

    // Normalize Table Specifics
    let tableConfig = null;
    if (type === "table") {
        let columns = [];
        if (Array.isArray(field.columns)) {
            columns = field.columns.map((c, i) => normalizeTableColumn(c, i)).filter(Boolean);
        }

        // Check if table has predefined sections (e.g. employee.json checklist)
        let sections = null;
        if (Array.isArray(field.sections) && field.sections.length > 0) {
            sections = field.sections.map((sec, sIdx) => ({
                id: sec.id || `sec_${sIdx}`,
                name: sec.name || sec.title || sec.label || `Section ${sIdx + 1}`,
                rows: Array.isArray(sec.rows) ? sec.rows.map((r, rIdx) => ({
                    id: r.id || `${sec.id || sIdx}_row_${rIdx}`,
                    ...r
                })) : []
            }));

            // Auto-detect columns if columns not specified
            if (columns.length === 0 && sections[0]?.rows?.[0]) {
                const sampleRow = sections[0].rows[0];
                columns = Object.keys(sampleRow)
                    .filter(k => k !== "id")
                    .map((k, i) => normalizeTableColumn({ id: k, label: k.replace(/_/g, " "), type: "text" }, i));
            }
        }

        // Check if table has a flat rows array
        let rows = null;
        let initialRowCount = 3;
        let allowAddRows = true;

        if (Array.isArray(field.rows)) {
            rows = field.rows.map((r, rIdx) => {
                if (typeof r === "object") {
                    return { id: r.id || `row_${rIdx}`, ...r };
                }
                return { id: `row_${rIdx}`, [columns[0]?.id || "item"]: r };
            });

            // If columns were empty, infer from rows
            if (columns.length === 0 && rows.length > 0) {
                const sampleRow = rows[0];
                columns = Object.keys(sampleRow)
                    .filter(k => k !== "id")
                    .map((k, i) => normalizeTableColumn({ id: k, label: k.replace(/_/g, " "), type: "text" }, i));
            }
            allowAddRows = field.allowAddRows ?? false;
        } else if (typeof field.rows === "number") {
            initialRowCount = field.rows;
            allowAddRows = field.allowAddRows ?? true;
        } else {
            allowAddRows = field.allowAddRows ?? true;
        }

        tableConfig = {
            columns,
            sections,
            rows,
            initialRowCount,
            allowAddRows: sections ? false : allowAddRows
        };
    }

    // Normalize Nested Children (for Sections / Groups / Fieldsets)
    let children = null;
    const rawChildren = field.fields || field.elements || field.items || field.children || field.components || field.controls;
    if (Array.isArray(rawChildren) && rawChildren.length > 0) {
        children = rawChildren.map((c, i) => normalizeField(c, i)).filter(Boolean);
    }

    return {
        id,
        label,
        type,
        options,
        required,
        min,
        max,
        step,
        placeholder,
        description,
        defaultValue,
        disabled,
        gridSpan,
        tableConfig,
        children,
        raw: field
    };
}

// Find field collection from arbitrary JSON object
export function extractRawElements(schema) {
    if (!schema) return [];

    // If schema is directly an array
    if (Array.isArray(schema)) return schema;

    // Check common container keys
    const candidateKeys = [
        "elements",
        "fields",
        "items",
        "inputs",
        "controls",
        "components",
        "sections",
        "questions",
        "data",
        "form_fields",
        "formElements",
        "pages"
    ];

    for (const key of candidateKeys) {
        if (Array.isArray(schema[key]) && schema[key].length > 0) {
            // Special case for SurveyJS-style pages: [{ elements: [...] }]
            if (key === "pages" && schema.pages[0]?.elements) {
                return schema.pages.flatMap(p => p.elements || []);
            }
            return schema[key];
        }
    }

    // Standard JSON Schema format: { properties: { field1: { type: 'string' } } }
    const propertiesObj = schema.properties || schema.schema?.properties;
    if (propertiesObj && typeof propertiesObj === "object") {
        const requiredList = Array.isArray(schema.required) ? schema.required : [];
        return Object.entries(propertiesObj).map(([key, prop]) => ({
            id: key,
            name: key,
            label: prop.title || prop.description || key,
            type: prop.type,
            required: requiredList.includes(key),
            enum: prop.enum,
            ...prop
        }));
    }

    // Single nested container object
    if (schema.form && typeof schema.form === "object") {
        if (Array.isArray(schema.form.elements)) return schema.form.elements;
        if (Array.isArray(schema.form.fields)) return schema.form.fields;
        if (Array.isArray(schema.form.items)) return schema.form.items;
    }

    return [];
}

// Main: Universal Schema Normalizer Function
export function normalizeFormSchema(rawSchema) {
    if (!rawSchema) {
        return {
            meta: { title: "Untitled Form" },
            fields: [],
            isValid: false,
            error: "Empty or invalid schema"
        };
    }

    let parsed = rawSchema;
    if (typeof rawSchema === "string") {
        try {
            parsed = JSON.parse(rawSchema);
        } catch (err) {
            return {
                meta: { title: "Invalid JSON" },
                fields: [],
                isValid: false,
                error: `JSON parse error: ${err.message}`
            };
        }
    }

    // 1. Extract Form Metadata safely
    const metaContainer = parsed.form || parsed.meta || parsed.metadata || parsed.header || parsed.info || parsed;

    const title =
        parsed.form?.name ||
        parsed.name ||
        parsed.title ||
        parsed.form_name ||
        parsed.formTitle ||
        parsed.document_name ||
        parsed.header?.title ||
        parsed.meta?.title ||
        parsed.info?.title ||
        (Array.isArray(parsed) ? "Dynamic Form" : "Custom Form");

    const description =
        parsed.form?.description ||
        parsed.description ||
        parsed.subtitle ||
        parsed.info?.description ||
        metaContainer.description ||
        "";

    const company =
        parsed.form?.company ||
        parsed.company ||
        parsed.organization ||
        metaContainer.company ||
        "";

    const address =
        parsed.form?.address ||
        parsed.address ||
        metaContainer.address ||
        "";

    const documentNumber =
        parsed.form?.document_number ||
        parsed.form?.documentNumber ||
        parsed.document_number ||
        parsed.doc_no ||
        parsed.code ||
        metaContainer.document_number ||
        metaContainer.id ||
        "";

    const revision =
        parsed.form?.revision ||
        parsed.revision ||
        parsed.rev ||
        metaContainer.revision ||
        "";

    const frequency =
        parsed.form?.frequency ||
        parsed.frequency ||
        metaContainer.frequency ||
        "";

    const version =
        parsed.form?.version ||
        parsed.version ||
        metaContainer.version ||
        "";

    const layout =
        parsed.form?.layout ||
        parsed.layout ||
        "portrait";

    const meta = {
        title: String(title),
        description: String(description),
        company: String(company),
        address: String(address),
        documentNumber: String(documentNumber),
        revision: String(revision),
        frequency: String(frequency),
        version: String(version),
        layout: String(layout)
    };

    // 2. Extract and Normalize Elements
    const rawElements = extractRawElements(parsed);
    const fields = rawElements.map((el, i) => normalizeField(el, i)).filter(Boolean);

    return {
        meta,
        fields,
        raw: parsed,
        isValid: fields.length > 0 || Object.keys(meta).some(k => Boolean(meta[k])),
        error: null
    };
}
