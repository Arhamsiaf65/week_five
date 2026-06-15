import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    suppressErrorRendering: true,
});

interface MermaidDiagramProps {
    chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgCode, setSvgCode] = useState<string>('');
    const [isError, setIsError] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;

        const renderDiagram = async () => {
            if (!chart) return;
            
            const sanitizedChart = chart
                .replace(/^```mermaid\s*/i, '')
                .replace(/\s*```$/i, '')
                .trim();
                
            if (!sanitizedChart) return;
            
            try {
                // Parse the diagram first to see if it's valid syntax yet (useful during streaming)
                await mermaid.parse(sanitizedChart, { suppressErrors: true });
                
                // If parse succeeds, render it
                const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
                const { svg } = await mermaid.render(id, sanitizedChart);
                
                if (isMounted) {
                    setSvgCode(svg);
                    setIsError(false);
                }
            } catch (error) {
                // It failed to parse/render (likely because it's still streaming or invalid syntax)
                if (isMounted) {
                    setIsError(true);
                }
            }
        };

        // Debounce slightly to reduce CPU load while streaming
        const timeoutId = setTimeout(() => {
            renderDiagram();
        }, 300);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [chart]);

    if (isError || !svgCode) {
        return (
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4">
                <pre>{chart}</pre>
            </div>
        );
    }

    return (
        <div 
            className="flex justify-center overflow-x-auto p-4 bg-white dark:bg-slate-50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-300 my-4"
            ref={containerRef}
            dangerouslySetInnerHTML={{ __html: svgCode }}
        />
    );
};
