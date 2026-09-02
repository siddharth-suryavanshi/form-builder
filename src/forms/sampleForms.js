import employeeSchema from "./employee.json";

export const sampleForms = [
    {
        id: "process_checklist",
        name: "1. Process Controller Checklist (Current JSON)",
        badge: "Sectioned Checklist Table",
        description: "Standard industrial checklist with multiple sections (Entrance, Premixing, BHU, Mixing), status dropdowns, and signature.",
        schema: employeeSchema
    },
    {
        id: "employee_onboarding",
        name: "2. Employee Onboarding & Compliance",
        badge: "Nested Sections & Multi-Input",
        description: "Enterprise multi-section form with personal info, dates, department dropdown, radio groups, multi-checkboxes, file attachments, and canvas signature.",
        schema: {
            title: "Employee Onboarding & Verification Form",
            description: "Please complete all sections to initialize your employee profile and verify compliance documents.",
            metadata: {
                company: "Apex Global Technologies Inc.",
                document_number: "AGT-HR-2026-09",
                revision: "03",
                department: "People & Culture"
            },
            elements: [
                {
                    id: "personal_section",
                    type: "section",
                    label: "Personal Information",
                    description: "Basic identity and contact details",
                    fields: [
                        { id: "full_name", type: "text", label: "Full Legal Name", required: true, placeholder: "e.g. Jane Doe" },
                        { id: "email", type: "email", label: "Work Email Address", required: true, placeholder: "jane.doe@company.com" },
                        { id: "phone", type: "tel", label: "Phone Number", required: true, placeholder: "+1 (555) 000-0000" },
                        { id: "dob", type: "date", label: "Date of Birth", required: true }
                    ]
                },
                {
                    id: "employment_section",
                    type: "section",
                    label: "Employment Details",
                    fields: [
                        {
                            id: "department",
                            type: "dropdown",
                            label: "Assigned Department",
                            required: true,
                            options: ["Engineering", "Product & Design", "Sales & Marketing", "Quality Assurance", "Finance & Operations"]
                        },
                        {
                            id: "work_mode",
                            type: "radio",
                            label: "Work Arrangement",
                            options: ["On-Site", "Hybrid", "Fully Remote"],
                            defaultValue: "Hybrid"
                        },
                        { id: "start_date", type: "date", label: "Start Date", required: true },
                        { id: "annual_salary", type: "number", label: "Starting Base Salary (USD)", placeholder: "85000" }
                    ]
                },
                {
                    id: "certifications_table",
                    type: "table",
                    label: "Educational & Professional Qualifications",
                    columns: [
                        { id: "degree", label: "Degree / Certification", type: "text" },
                        { id: "institution", label: "Institution / Organization", type: "text" },
                        { id: "year_completed", label: "Year Completed", type: "number", width: "130px" },
                        { id: "verified", label: "HR Verified", type: "checkbox", width: "110px" }
                    ],
                    rows: [
                        { id: "cert_1", degree: "B.S. Computer Science", institution: "State University", year_completed: "2022", verified: true },
                        { id: "cert_2", degree: "AWS Certified Solutions Architect", institution: "Amazon Web Services", year_completed: "2024", verified: false }
                    ]
                },
                {
                    id: "compliance_section",
                    type: "section",
                    label: "Compliance & Security Agreements",
                    fields: [
                        { id: "nda_agreed", type: "checkbox", label: "I have read and agree to the Non-Disclosure Agreement (NDA)", required: true },
                        { id: "security_policy", type: "checkbox", label: "I agree to comply with Corporate Information Security Standards", required: true },
                        { id: "employee_signature", type: "signature", label: "Employee Authorized Signature", required: true }
                    ]
                }
            ]
        }
    },
    {
        id: "incident_report",
        name: "3. Quality & Incident Investigation Report",
        badge: "Ratings, Repeaters & Sliders",
        description: "Industrial safety & quality incident log featuring severity ratings, dynamic action items table, and root cause notes.",
        schema: {
            form_name: "Manufacturing Quality Incident Report",
            company: "BioPharma Precision Labs",
            code: "QMS-INC-8891",
            frequency: "Ad-hoc / Event Driven",
            fields: [
                { id: "incident_date", type: "date", label: "Date of Occurrence", required: true },
                { id: "incident_time", type: "time", label: "Time of Occurrence", required: true },
                {
                    id: "severity_level",
                    type: "dropdown",
                    label: "Incident Severity Classification",
                    required: true,
                    options: [
                        { value: "LOW", label: "Low - Minor Deviation (No Safety Risk)" },
                        { value: "MED", label: "Medium - Process Interruption" },
                        { value: "HIGH", label: "High - Batch Rejection / Equipment Damage" },
                        { value: "CRITICAL", label: "Critical - Safety / Regulatory Violation" }
                    ]
                },
                { id: "risk_rating", type: "rating", label: "Risk Assessment Score (1-5 Stars)", defaultValue: 3 },
                { id: "description", type: "textarea", label: "Detailed Description of Incident", required: true, placeholder: "Describe precisely what occurred..." },
                { id: "immediate_action", type: "textarea", label: "Immediate Containment Action Taken", placeholder: "What was done immediately to mitigate the issue?" },
                {
                    id: "corrective_actions_table",
                    type: "table",
                    label: "Corrective and Preventive Action (CAPA) Plan",
                    columns: [
                        { id: "action_item", label: "Action Description", type: "text" },
                        { id: "owner", label: "Responsible Owner", type: "text", width: "160px" },
                        { id: "due_date", label: "Target Due Date", type: "date", width: "160px" },
                        { id: "status", label: "Status", type: "status", options: ["OPEN", "IN PROGRESS", "COMPLETED"], width: "140px" }
                    ],
                    rows: 2,
                    allowAddRows: true
                },
                { id: "qa_manager_signature", type: "signature", label: "QA Lead Sign-off" }
            ]
        }
    },
    {
        id: "flat_array_schema",
        name: "4. Minimal Flat Array Schema",
        badge: "Direct Array JSON",
        description: "A bare JSON array without any wrapper object [ {...}, {...} ] demonstrating ultimate resilience.",
        schema: [
            { id: "customer_name", type: "text", label: "Customer Full Name", required: true },
            { id: "feedback_score", type: "rating", label: "Overall Satisfaction Rating" },
            { id: "service_feedback", type: "textarea", label: "How can we improve our service?" },
            { id: "subscribe_newsletter", type: "checkbox", label: "Subscribe to monthly updates and product releases" },
            { id: "customer_signature", type: "signature", label: "Customer Signature" }
        ]
    }
];
