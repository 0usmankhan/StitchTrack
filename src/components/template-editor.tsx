'use client';

import React, { useMemo } from 'react';
// Dynamic import for ReactQuill to avoid SSR issues
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface TemplateEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholders: string[];
}

export function TemplateEditor({ value, onChange, placeholders }: TemplateEditorProps) {
    const modules = useMemo(() => ({
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'clean'],
        ],
    }), []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add toast here
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-sm text-muted-foreground mr-2 self-center">Variables:</span>
                {placeholders.map((placeholder) => (
                    <Badge
                        key={placeholder}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80"
                        onClick={() => copyToClipboard(placeholder)}
                        title="Click to copy"
                    >
                        {placeholder}
                    </Badge>
                ))}
            </div>
            <div className="h-[400px] mb-12">
                <ReactQuill
                    theme="snow"
                    value={value}
                    onChange={onChange}
                    modules={modules}
                    className="h-full"
                />
            </div>
        </div>
    );
}
