import React, { useRef, useState, useEffect } from "react";

export default function SignaturePad({ value, onChange, label, disabled = false }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(Boolean(value));

    // Draw initial image if value is provided as data URL
    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Set responsive canvas resolution
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && canvas.width !== rect.width) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        if (value && typeof value === "string" && value.startsWith("data:image")) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setHasSignature(true);
            };
            img.src = value;
        }
    }, [value]);

    const getCanvasCoordinates = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX = e.clientX;
        let clientY = e.clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const startDrawing = (e) => {
        if (disabled) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const { x, y } = getCanvasCoordinates(e);

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing || disabled) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const { x, y } = getCanvasCoordinates(e);

        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = (e) => {
        if (!isDrawing) return;
        if (e && e.preventDefault) e.preventDefault();
        setIsDrawing(false);

        const canvas = canvasRef.current;
        if (!canvas) return;
        try {
            const dataUrl = canvas.toDataURL("image/png");
            if (onChange) {
                onChange(dataUrl);
            }
        } catch (err) {
            console.error("Signature export error:", err);
        }
    };

    const handleClear = () => {
        if (disabled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        if (onChange) {
            onChange("");
        }
    };

    return (
        <div className="signature-container">
            <div className="signature-pad-wrapper">
                <canvas
                    ref={canvasRef}
                    className="signature-canvas"
                    width={400}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {!hasSignature && (
                    <div className="signature-watermark">
                        <span>✍️ Draw signature above</span>
                    </div>
                )}
            </div>
            <div className="signature-actions">
                <button
                    type="button"
                    className="signature-clear-btn"
                    onClick={handleClear}
                    disabled={disabled || !hasSignature}
                >
                    Clear Signature
                </button>
                {hasSignature && <span className="signature-badge">✓ Signed</span>}
            </div>
        </div>
    );
}
