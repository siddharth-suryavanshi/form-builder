import React from "react";

export default function FormTable({ field, value, onChange, disabled = false }) {
    const tableConfig = field.tableConfig || {};
    const { columns = [], sections = null, rows: predefinedRows = null, initialRowCount = 3, allowAddRows = true } = tableConfig;

    // Determine current table data structure
    // Case 1: Sectioned Checklist (like employee.json)
    if (sections && sections.length > 0) {
        const sectionData = value || {};

        const updateSectionCell = (sectionId, rowId, columnId, cellVal) => {
            const currentSec = sectionData[sectionId] || {};
            const currentRow = currentSec[rowId] || {};

            const updatedSectionData = {
                ...sectionData,
                [sectionId]: {
                    ...currentSec,
                    [rowId]: {
                        ...currentRow,
                        [columnId]: cellVal
                    }
                }
            };
            onChange(updatedSectionData);
        };

        return (
            <div className="table-responsive-container sectioned-table-container">
                <table className="universal-table checklist-table">
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.id}
                                    style={{ width: col.width !== "auto" ? col.width : undefined }}
                                    className={`col-header col-${col.type}`}
                                >
                                    {col.label.split("\n").map((line, i) => (
                                        <React.Fragment key={i}>
                                            {line}
                                            {i < col.label.split("\n").length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sections.map(section => (
                            <React.Fragment key={section.id}>
                                <tr className="section-header-row">
                                    <td colSpan={Math.max(columns.length, 1)} className="section-header-cell">
                                        <div className="section-title-badge">
                                            <span>{section.name}</span>
                                        </div>
                                    </td>
                                </tr>
                                {section.rows.map((rowItem, rIdx) => {
                                    const rowValues = sectionData[section.id]?.[rowItem.id] || {};

                                    return (
                                        <tr key={rowItem.id || rIdx} className="table-data-row">
                                            {columns.map(col => {
                                                // Check if row has static predefined text for this column (e.g. check_point)
                                                const staticText = rowItem[col.id];
                                                const cellValue = rowValues[col.id] !== undefined ? rowValues[col.id] : (staticText || col.defaultValue || "");

                                                // If this column is static checkpoint text in predefined row
                                                if (staticText && col.id === "check_point" && col.type !== "status" && col.type !== "textarea") {
                                                    return (
                                                        <td key={col.id} className="table-cell cell-static-text">
                                                            <div className="checkpoint-text">
                                                                <span className="row-index-bullet">{rIdx + 1}.</span>
                                                                <span>{staticText}</span>
                                                            </div>
                                                        </td>
                                                    );
                                                }

                                                return (
                                                    <td key={col.id} className={`table-cell cell-${col.type}`}>
                                                        {renderCellInput(
                                                            col,
                                                            cellValue,
                                                            (val) => updateSectionCell(section.id, rowItem.id, col.id, val),
                                                            disabled
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // Case 2: Standard or Predefined / Dynamic Row Table
    const tableRows = Array.isArray(value)
        ? value
        : (Array.isArray(predefinedRows)
            ? predefinedRows
            : Array.from({ length: initialRowCount }, (_, i) => ({ id: `row_${i}` })));

    const updateRowCell = (rowIndex, columnId, cellVal) => {
        const newRows = [...tableRows];
        newRows[rowIndex] = {
            ...newRows[rowIndex],
            [columnId]: cellVal
        };
        onChange(newRows);
    };

    const handleAddRow = () => {
        const newRow = { id: `row_${Date.now()}` };
        columns.forEach(col => {
            newRow[col.id] = col.defaultValue || "";
        });
        onChange([...tableRows, newRow]);
    };

    const handleRemoveRow = (rowIndex) => {
        if (tableRows.length <= 1) return;
        const newRows = tableRows.filter((_, idx) => idx !== rowIndex);
        onChange(newRows);
    };

    return (
        <div className="table-responsive-container dynamic-table-container">
            <table className="universal-table">
                <thead>
                    <tr>
                        <th className="row-num-header">#</th>
                        {columns.map(col => (
                            <th
                                key={col.id}
                                style={{ width: col.width !== "auto" ? col.width : undefined }}
                                className={`col-header col-${col.type}`}
                            >
                                {col.label}
                                {col.required && <span className="required-star">*</span>}
                            </th>
                        ))}
                        {allowAddRows && !disabled && <th className="row-actions-header">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {tableRows.map((rowItem, rIdx) => (
                        <tr key={rowItem.id || rIdx} className="table-data-row">
                            <td className="row-num-cell">{rIdx + 1}</td>
                            {columns.map(col => {
                                const cellValue = rowItem[col.id] !== undefined ? rowItem[col.id] : (col.defaultValue || "");
                                return (
                                    <td key={col.id} className={`table-cell cell-${col.type}`}>
                                        {renderCellInput(
                                            col,
                                            cellValue,
                                            (val) => updateRowCell(rIdx, col.id, val),
                                            disabled
                                        )}
                                    </td>
                                );
                            })}
                            {allowAddRows && !disabled && (
                                <td className="row-actions-cell">
                                    <button
                                        type="button"
                                        className="table-delete-row-btn"
                                        onClick={() => handleRemoveRow(rIdx)}
                                        title="Delete row"
                                        disabled={tableRows.length <= 1}
                                    >
                                        ✕
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {allowAddRows && !disabled && (
                <div className="table-bottom-bar">
                    <button
                        type="button"
                        className="table-add-row-btn"
                        onClick={handleAddRow}
                    >
                        ＋ Add New Row
                    </button>
                    <span className="table-row-count">{tableRows.length} rows</span>
                </div>
            )}
        </div>
    );
}

// Render individual cell input based on column type
function renderCellInput(col, value, onChange, disabled) {
    const val = value ?? "";

    switch (col.type) {
        case "status": {
            const options = col.options && col.options.length > 0
                ? col.options
                : [{ value: "OK", label: "OK" }, { value: "NOT OK", label: "NOT OK" }, { value: "NA", label: "N/A" }];

            const getStatusClass = (s) => {
                if (!s) return "";
                const normalized = String(s).toUpperCase();
                if (normalized.includes("NOT") || normalized.includes("FAIL") || normalized.includes("BAD")) return "status-not-ok";
                if (normalized.includes("OK") || normalized.includes("PASS") || normalized.includes("GOOD")) return "status-ok";
                return "status-neutral";
            };

            return (
                <div className={`status-select-wrapper ${getStatusClass(val)}`}>
                    <select
                        value={val}
                        disabled={disabled}
                        onChange={(e) => onChange(e.target.value)}
                        className="table-cell-select status-select"
                    >
                        <option value="">— Select —</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        case "dropdown": {
            return (
                <select
                    value={val}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="table-cell-select"
                >
                    <option value="">— Select —</option>
                    {(col.options || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );
        }

        case "textarea": {
            return (
                <textarea
                    value={val}
                    disabled={disabled}
                    placeholder={col.placeholder || "Enter remarks..."}
                    onChange={(e) => onChange(e.target.value)}
                    className="table-cell-textarea"
                    rows={1}
                />
            );
        }

        case "number": {
            return (
                <input
                    type="number"
                    value={val}
                    disabled={disabled}
                    placeholder={col.placeholder || "0"}
                    onChange={(e) => onChange(e.target.value)}
                    className="table-cell-input text-center"
                />
            );
        }

        case "date": {
            return (
                <input
                    type="date"
                    value={val}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="table-cell-input"
                />
            );
        }

        case "time": {
            return (
                <input
                    type="time"
                    value={val}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="table-cell-input"
                />
            );
        }

        case "checkbox": {
            return (
                <label className="table-checkbox-container">
                    <input
                        type="checkbox"
                        checked={Boolean(val === true || val === "true")}
                        disabled={disabled}
                        onChange={(e) => onChange(e.target.checked)}
                        className="table-cell-checkbox"
                    />
                </label>
            );
        }

        case "text":
        default: {
            return (
                <input
                    type="text"
                    value={val}
                    disabled={disabled}
                    placeholder={col.placeholder || ""}
                    onChange={(e) => onChange(e.target.value)}
                    className="table-cell-input"
                />
            );
        }
    }
}
