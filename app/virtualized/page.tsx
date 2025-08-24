"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export default function VirtualizedPage() {
    const parentRef = useRef<HTMLDivElement>(null);

    const rows = Array.from({ length: 5000 }, (_, i) => `Row ${i + 1}`);

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 40,
    });

    return (
        <div>
            <h1 id="page-title" tabIndex={-1} className="text-xl font-bold mb-4">
                Virtualized List Demo
            </h1>
            <div
                ref={parentRef}
                style={{
                    height: `400px`,
                    overflow: "auto",
                    border: "1px solid #ccc",
                }}
            >
                <div
                    style={{
                        height: rowVirtualizer.getTotalSize(),
                        width: "100%",
                        position: "relative",
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                        <div
                            key={virtualRow.key}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: virtualRow.size,
                                transform: `translateY(${virtualRow.start}px)`,
                                display: "flex",
                                alignItems: "center",
                                padding: "0 8px",
                                borderBottom: "1px solid #eee",
                            }}
                        >
                            {rows[virtualRow.index]}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
