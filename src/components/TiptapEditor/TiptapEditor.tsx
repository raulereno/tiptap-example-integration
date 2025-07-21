'use client';
import React, { forwardRef, useImperativeHandle, useCallback, useRef, useState, useEffect, useMemo } from 'react';

// TypeScript interfaces
export interface TiptapEditorProps {
    onUpdate: (html: string) => void;
    docUrl?: string;
    onPlaceholders: (placeholders: PlaceholderPos[]) => void;
}

export interface TiptapEditorRef {
    getContent: () => string;
    setContent: (content: string) => void;
    importDocx: (file: File) => Promise<void>;
    navigateToPlaceholder: (placeholder: PlaceholderPos) => void;
    isReady: boolean;
    editor: any; // Editor type from @tiptap/core
}

export interface PlaceholderPos {
    text: string;
    label: string;
    from: number;
    to: number;
}
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { Extension } from '@tiptap/core';
import ImportDocx from '@tiptap-pro/extension-import-docx';
import { VariableHighlightExtension } from './VariableHighlightExtension';
import {
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    FormatStrikethrough,
    Highlight as HighlightIcon,
    FormatQuote,
    FormatAlignLeft,
    FormatAlignCenter,
    FormatAlignRight,
    FormatAlignJustify,
    TableChart,
    FormatListBulleted,
    FormatListNumbered,
    Link as LinkIcon,
    Image as ImageIcon,
    Code as CodeIcon,
    Undo,
    Redo,
    FormatColorText,

    HorizontalRule as HorizontalRuleIcon,
    ClearAll,
} from '@mui/icons-material';

import './styles.css';
import SpinnerLoader from '../Common/SpinnerLoader';

// Custom FontSize extension
const FontSize = Extension.create({
    name: 'fontSize',
    addGlobalAttributes() {
        return [
            {
                types: ['textStyle'],
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize: (fontSize) => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize })
                    .run();
            },
            unsetFontSize: () => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize: null })
                    .removeEmptyTextStyle()
                    .run();
            },
        };
    },
});

// Export the Toolbar component separately
export const TiptapToolbar = ({ editor, isLoading }: { editor: any; isLoading: boolean }) => { // Editor type from @tiptap/core
    // Solo deshabilitar si realmente está cargando, no por falta de editor
    const isDisabled = isLoading;

    const formatOptions = [
        { label: 'Normal Text', value: 'paragraph', action: () => editor?.chain().focus().setParagraph().run(), isActive: () => editor?.isActive('paragraph') || false },
        { label: 'Heading 1', value: 'h1', action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor?.isActive('heading', { level: 1 }) || false },
        { label: 'Heading 2', value: 'h2', action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor?.isActive('heading', { level: 2 }) || false },
        { label: 'Heading 3', value: 'h3', action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => editor?.isActive('heading', { level: 3 }) || false },
        { label: 'Heading 4', value: 'h4', action: () => editor?.chain().focus().toggleHeading({ level: 4 }).run(), isActive: () => editor?.isActive('heading', { level: 4 }) || false },
    ];

    const getCurrentFormat = () => {
        if (!editor) return 'Normal Text';
        const activeFormat = formatOptions.find(option => option.isActive());
        return activeFormat ? activeFormat.label : 'Normal Text';
    };

    const fontSizes = ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '24px', '30px', '36px', '48px', '60px', '72px'];

    return (
        <div className="modern-toolbar">
            <div className="toolbar-section">
                {/* Undo/Redo */}
                <div className="toolbar-group">
                    <button
                        type="button"
                        title="Undo (Ctrl+Z)"
                        onClick={() => editor?.chain().focus().undo().run()}
                        disabled={isDisabled || !editor?.can().undo()}
                        className={`toolbar-icon-btn ${isDisabled || !editor?.can().undo() ? 'disabled' : ''}`}
                    >
                        <Undo sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        type="button"
                        title="Redo (Ctrl+Y)"
                        onClick={() => editor?.chain().focus().redo().run()}
                        disabled={isDisabled || !editor?.can().redo()}
                        className={`toolbar-icon-btn ${isDisabled || !editor?.can().redo() ? 'disabled' : ''}`}
                    >
                        <Redo sx={{ fontSize: 18 }} />
                    </button>
                </div>

                <div className="toolbar-divider"></div>

                {/* Format and Font */}
                <div className="toolbar-group">
                    <select
                        className="format-select"
                        value={getCurrentFormat()}
                        onChange={(e) => {
                            if (editor) {
                                const selectedOption = formatOptions.find(option => option.label === e.target.value);
                                if (selectedOption) {
                                    selectedOption.action();
                                }
                            }
                        }}
                        disabled={!editor || isDisabled}
                    >
                        {formatOptions.map(option => (
                            <option key={option.value} value={option.label}>
                                {option.label}
                            </option>
                        ))}
                    </select>



                    <select
                        className="size-select"
                        onChange={(e) => {
                            if (editor && e.target.value) {
                                editor.chain().focus().setFontSize(e.target.value).run();
                            }
                        }}
                        defaultValue=""
                        disabled={!editor || isDisabled}
                    >
                        <option value="">Size</option>
                        {fontSizes.map(size => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="toolbar-divider"></div>

                {/* Text Formatting */}
                <div className="toolbar-group">
                    <button
                        type="button"
                        title="Bold (Ctrl+B)"
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        disabled={!editor || isDisabled}
                        className={`toolbar-icon-btn ${editor?.isActive('bold') ? 'active' : ''} ${(!editor || isDisabled) ? 'disabled' : ''}`}
                    >
                        <FormatBold sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        type="button"
                        title="Italic (Ctrl+I)"
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        disabled={!editor || isDisabled}
                        className={`toolbar-icon-btn ${editor?.isActive('italic') ? 'active' : ''} ${(!editor || isDisabled) ? 'disabled' : ''}`}
                    >
                        <FormatItalic sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        type="button"
                        title="Underline (Ctrl+U)"
                        onClick={() => editor?.chain().focus().toggleUnderline().run()}
                        disabled={!editor || isDisabled}
                        className={`toolbar-icon-btn ${editor?.isActive('underline') ? 'active' : ''} ${(!editor || isDisabled) ? 'disabled' : ''}`}
                    >
                        <FormatUnderlined sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        type="button"
                        title="Strikethrough"
                        onClick={() => editor?.chain().focus().toggleStrike().run()}
                        disabled={!editor || isDisabled}
                        className={`toolbar-icon-btn ${editor?.isActive('strike') ? 'active' : ''} ${(!editor || isDisabled) ? 'disabled' : ''}`}
                    >
                        <FormatStrikethrough sx={{ fontSize: 18 }} />
                    </button>
                </div>

                <div className="toolbar-divider"></div>

                {/* Text Color and Highlight */}
                <div className="toolbar-group">
                    <div className="color-picker-group">
                        <button
                            type="button"
                            title="Text Color"
                            className={`toolbar-icon-btn color-btn ${(!editor || isDisabled) ? 'disabled' : ''}`}
                            disabled={!editor || isDisabled}
                        >
                            <FormatColorText sx={{ fontSize: 18 }} />
                            <input
                                type="color"
                                onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
                                className="color-input"
                                disabled={!editor || isDisabled}
                            />
                        </button>
                    </div>
                    <button
                        type="button"
                        title="Highlight"
                        onClick={() => editor?.chain().focus().toggleHighlight().run()}
                        disabled={!editor || isDisabled}
                        className={`toolbar-icon-btn ${editor?.isActive('highlight') ? 'active' : ''} ${(!editor || isDisabled) ? 'disabled' : ''}`}
                    >
                        <HighlightIcon sx={{ fontSize: 18 }} />
                    </button>
                </div>

                <div className="toolbar-divider"></div>

                {/* Lists */}
                <div className="toolbar-group">
                    <button
                        type="button"
                        title="Bullet List"
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        disabled={!editor || isDisabled}
                        className={`toolbar-icon-btn ${editor?.isActive('bulletList') ? 'active' : ''} ${(!editor || isDisabled) ? 'disabled' : ''}`}
                    >
                        <FormatListBulleted sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        type="button"
                        title="Numbered List"
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        disabled={!editor || isDisabled}
                        className={`toolbar-icon-btn ${editor?.isActive('orderedList') ? 'active' : ''} ${(!editor || isDisabled) ? 'disabled' : ''}`}
                    >
                        <FormatListNumbered sx={{ fontSize: 18 }} />
                    </button>
                </div>

                <div className="toolbar-divider"></div>

                {/* Alignment */}
                <div className="toolbar-group">
                    <button
                        type="button"
                        title="Align Left"
                        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                        className={`toolbar-icon-btn ${editor?.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
                    >
                        <FormatAlignLeft sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        type="button"
                        title="Align Center"
                        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                        className={`toolbar-icon-btn ${editor?.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
                    >
                        <FormatAlignCenter sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        type="button"
                        title="Align Right"
                        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                        className={`toolbar-icon-btn ${editor?.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
                    >
                        <FormatAlignRight sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        type="button"
                        title="Justify"
                        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                        className={`toolbar-icon-btn ${editor?.isActive({ textAlign: 'justify' }) ? 'active' : ''}`}
                    >
                        <FormatAlignJustify sx={{ fontSize: 18 }} />
                    </button>
                </div>

                <div className="toolbar-divider"></div>

                {/* Insert Elements */}
                <div className="toolbar-group">
                    <button
                        type="button"
                        title="Insert Link"
                        onClick={() => {
                            const previousUrl = editor.getAttributes('link').href;
                            const url = window.prompt('Enter URL:', previousUrl);

                            if (url === null) return;

                            if (url === '') {
                                editor.chain().focus().extendMarkRange('link').unsetLink().run();
                                return;
                            }

                            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                        }}
                        className={`toolbar-icon-btn ${editor?.isActive('link') ? 'active' : ''}`}
                    >
                        <LinkIcon sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        type="button"
                        title="Insert Image"
                        onClick={() => {
                            const url = window.prompt('Enter image URL:');
                            if (url) {
                                editor.chain().focus().setImage({ src: url }).run();
                            }
                        }}
                        className="toolbar-icon-btn"
                    >
                        <ImageIcon sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        type="button"
                        title="Insert Table"
                        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                        className="toolbar-icon-btn"
                    >
                        <TableChart sx={{ fontSize: 18 }} />
                    </button>
                </div>

                <div className="toolbar-divider"></div>

                {/* More Formatting */}
                <div className="toolbar-group">
                    <button
                        type="button"
                        title="Code"
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        className={`toolbar-icon-btn ${editor?.isActive('code') ? 'active' : ''}`}
                    >
                        <CodeIcon sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        type="button"
                        title="Blockquote"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`toolbar-icon-btn ${editor?.isActive('blockquote') ? 'active' : ''}`}
                    >
                        <FormatQuote sx={{ fontSize: 18 }} />
                    </button>

                    <button
                        type="button"
                        title="Horizontal Rule"
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        className="toolbar-icon-btn"
                    >
                        <HorizontalRuleIcon sx={{ fontSize: 18 }} />
                    </button>
                    <button
                        type="button"
                        title="Clear Formatting"
                        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                        className="toolbar-icon-btn clear-formatting"
                    >
                        <ClearAll sx={{ fontSize: 18 }} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const TiptapEditorCore = forwardRef<TiptapEditorRef, TiptapEditorProps & { tiptapToken: string | null; onPlaceholdersChange: (placeholders: PlaceholderPos[]) => void }>(({ onUpdate, docUrl, tiptapToken, onPlaceholdersChange }, ref) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [hasImportedDocx, setHasImportedDocx] = useState(false);

    const extensions = useMemo(() => {
        const baseExtensions = [
            StarterKit.configure({
                // Configure StarterKit to include everything we need
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
            }),
            Image.configure({
                inline: true,
            }),
            Placeholder.configure({
                placeholder: 'Write something...',
            }),
            Highlight.configure({ multicolor: true }),
            TextStyle.configure({ mergeNestedSpanStyles: true }),
            Table,
            TableRow,
            TableCell,
            TableHeader,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link,
            Color,
            Underline,
            VariableHighlightExtension,
            FontSize,
        ];

        // Only add ImportDocx if we have a valid token to prevent timeout errors
        if (tiptapToken && process.env.NEXT_PUBLIC_TIPTAP_APP_ID) {
            try {
                baseExtensions.push(
                    ImportDocx.configure({
                        appId: process.env.NEXT_PUBLIC_TIPTAP_APP_ID,
                        token: tiptapToken,
                    })
                );
            } catch (error) {
                console.warn('ImportDocx extension failed to load:', error);
            }
        } else {
            console.warn('ImportDocx extension not added - missing token or app ID');
        }

        return baseExtensions;
    }, [tiptapToken]);

    // Helper function to check if a placeholder is empty
    const isEmptyPlaceholder = useCallback((rawText: string) => {
        // Check for empty placeholders like [], {}, {{}}
        if (rawText === '[]' || rawText === '{}' || rawText === '{{}}') {
            return true;
        }

        // Check for placeholders with only whitespace
        if (rawText.startsWith('{{') && rawText.endsWith('}}')) {
            const content = rawText.slice(2, -2).trim();
            return content === '';
        } else if (rawText.startsWith('[') && rawText.endsWith(']')) {
            const content = rawText.slice(1, -1).trim();
            return content === '';
        }

        return false;
    }, []);

    const findPlaceholders = useCallback((editorInstance: any) => {
        if (!editorInstance) return [];
        const placeholderRegex = /{{.*?}}|\[.*?\]/g;
        const found: PlaceholderPos[] = [];
        const uniquePlaceholders = new Set();

        editorInstance.state.doc.descendants((node: any, pos: number) => {
            if (!node.isText) return;

            const text = node.text || '';
            let match;
            while ((match = placeholderRegex.exec(text)) !== null) {
                const rawText = match[0];

                // Skip empty placeholders for the navigation list
                if (isEmptyPlaceholder(rawText)) {
                    continue;
                }

                if (!uniquePlaceholders.has(rawText)) {
                    let label = rawText;

                    if (rawText.startsWith('{{') && rawText.endsWith('}}')) {
                        const parts = rawText.slice(2, -2).split('|');
                        if (parts.length > 1) {
                            const potentialLabel = parts[parts.length - 2];
                            if (potentialLabel) {
                                label = potentialLabel.trim();
                            }
                        }
                    } else if (rawText.startsWith('[') && rawText.endsWith(']')) {
                        label = rawText.slice(1, -1).trim();
                    }

                    found.push({
                        text: rawText,
                        label: label,
                        from: pos + match.index,
                        to: pos + match.index + rawText.length,
                    });
                    uniquePlaceholders.add(rawText);
                }
            }
        });
        return found;
    }, [isEmptyPlaceholder]);

    const editor = useEditor({
        extensions,
        content: '',
        immediatelyRender: false,
        editorProps: {
            attributes: {
                style: 'font-family: Arial, sans-serif;',
            },
        },
        onUpdate: ({ editor: updatedEditor }) => {
            if (onUpdate && typeof onUpdate === 'function') {
                onUpdate(updatedEditor.getHTML());
            }
            if (onPlaceholdersChange) {
                onPlaceholdersChange(findPlaceholders(updatedEditor));
            }
        },
        onCreate: ({ editor: createdEditor }) => {
            // Buscar placeholders cuando el editor se crea
            if (onPlaceholdersChange) {
                setTimeout(() => {
                    onPlaceholdersChange(findPlaceholders(createdEditor));
                }, 100);
            }
        }
    });

    const handlePlaceholderNavigation = useCallback((placeholder: PlaceholderPos) => {
        if (!editor || !placeholder) return;

        const { from, to } = placeholder;

        editor.chain().focus().setTextSelection({ from, to }).run();

    }, [editor]);

    const importDocxFile = useCallback(async (file: File) => {
        if (!file || !editor) return;

        setIsLoading(true);
        setError(null);

        // Check if ImportDocx extension is available
        const hasImportDocx = editor.extensionManager.extensions.some(ext => ext.name === 'import-docx');

        if (!hasImportDocx) {
            setError(new Error('DOCX import is not available. Please check your connection and try again.'));
            setIsLoading(false);
            return;
        }

        try {
            editor.chain().focus().importDocx({
                file,
                onImport: (context: any) => {
                    const { setEditorContent, error: importError } = context;
                    setIsLoading(false);
                    if (importError) {
                        setError(importError instanceof Error ? importError : new Error('Import error'));
                        console.error('Tiptap DOCX Import Error:', importError);
                        return;
                    }
                    setEditorContent();
                    if (onPlaceholdersChange) {
                        onPlaceholdersChange(findPlaceholders(editor));
                    }
                    setError(null);
                },
            }).run();
        } catch (error) {
            console.error('Error during DOCX import:', error);
            setError(error instanceof Error ? error : new Error('Unknown error'));
            setIsLoading(false);
        }
        finally {
            setIsLoading(false);
        }
    }, [editor, onPlaceholdersChange, findPlaceholders]);

    useEffect(() => {
        if (docUrl && docUrl.toLowerCase().endsWith('.docx') && editor && tiptapToken && !hasImportedDocx) {
            const importFromUrl = async () => {
                setIsLoading(true);
                setError(null);
                setHasImportedDocx(true); // Mark as imported to prevent re-import

                // Check if ImportDocx extension is available
                const hasImportDocx = editor.extensionManager.extensions.some(ext => ext.name === 'import-docx');

                if (!hasImportDocx) {
                    console.warn('ImportDocx extension not available, skipping DOCX import');
                    setError(new Error('DOCX import not available. Please upload the file manually.'));
                    setIsLoading(false);
                    return;
                }

                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

                    const res = await fetch(docUrl, {
                        signal: controller.signal,
                    });

                    clearTimeout(timeoutId);

                    if (!res.ok) {
                        throw new Error(`Failed to fetch docx file: ${res.status} ${res.statusText}`);
                    }

                    const blob = await res.blob();
                    const file = new File([blob], docUrl.split('/').pop() || 'document.docx', {
                        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    });

                    await importDocxFile(file);
                } catch (e) {
                    if (e instanceof Error && e.name === 'AbortError') {
                        setError(new Error('File download timed out. Please try uploading the file manually.'));
                    } else {
                        setError(e instanceof Error ? e : new Error('Unknown error'));
                    }
                    console.error('Error fetching or importing docx from URL:', e);
                    setIsLoading(false);
                }
            };
            importFromUrl();
        }
    }, [docUrl, editor, importDocxFile, tiptapToken, hasImportedDocx]);



    // Efecto adicional para detectar placeholders después de que el editor esté completamente listo
    useEffect(() => {
        if (editor && !isLoading && onPlaceholdersChange) {
            const detectPlaceholders = () => {
                const placeholders = findPlaceholders(editor);
                if (placeholders.length > 0) {
                    onPlaceholdersChange(placeholders);
                }
            };

            // Detectar placeholders con un pequeño delay
            const timeoutId = setTimeout(detectPlaceholders, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [editor, isLoading, onPlaceholdersChange, findPlaceholders]);

    // Cleanup effect to ensure proper destruction
    useEffect(() => {
        return () => {
            if (editor) {
                editor.destroy();
            }
        };
    }, [editor]);

    useImperativeHandle(ref, () => ({
        getContent: () => editor?.getHTML() || '',
        setContent: (content: string) => editor?.commands.setContent(content, true) || false,
        importDocx: (file: File) => importDocxFile(file),
        navigateToPlaceholder: handlePlaceholderNavigation,
        isReady: !!editor,
        editor: editor, // Expose editor instance for external toolbar
    }));

    if (!editor) {
        return null;
    }

    return (
        <div className="tiptap-editor-container">
            <EditorContent editor={editor} />
        </div>
    );
});
TiptapEditorCore.displayName = 'TiptapEditorCore';


const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(({ onUpdate, docUrl, onPlaceholders }, ref) => {
    const [tiptapToken, setTiptapToken] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const editorCoreRef = useRef<TiptapEditorRef>(null);

    useEffect(() => {
        const fetchTiptapToken = async () => {
            try {
                // Add timeout to prevent hanging requests
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                const response = await fetch('/api/generate-token', {
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                if (data.token) {
                    setTiptapToken(data.token);
                    setError(null);
                } else {
                    throw new Error('No token received from server');
                }
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') {
                    console.warn('Tiptap token request timed out');
                    setError(new Error('Request timed out. DOCX import will not be available.'));
                } else {
                    console.error('Error fetching Tiptap token:', err);
                    setError(err instanceof Error ? err : new Error('Unknown error'));
                }
                // Don't block the editor if token fetch fails
                setTiptapToken(null);
            }
        };

        fetchTiptapToken();
    }, []);

    useImperativeHandle(ref, () => ({
        getContent: () => {
            const content = editorCoreRef.current?.getContent();
            return typeof content === 'string' ? content : '';
        },
        setContent: (content: string) => editorCoreRef.current?.setContent(content),
        importDocx: (file: File) => editorCoreRef.current?.importDocx(file) || Promise.resolve(),
        navigateToPlaceholder: (position: any) => editorCoreRef.current?.navigateToPlaceholder(position),
        isReady: !!tiptapToken,
        editor: editorCoreRef.current?.editor, // Expose editor instance
    }));

    if (error && error.message.includes('timed out')) {
        // Don't block the editor for timeout errors, just show a warning
        console.warn('Tiptap Pro features unavailable:', error.message);
    } else if (error && !error.message.includes('timed out')) {
        return <div className="hint error">Error: {error.message}</div>;
    }

    // Only render the editor when we have a valid token or when there's no error
    if (!tiptapToken) {
        if (error) {
            // If there's an error but no token, show a basic editor without DOCX import
            return (
                <TiptapEditorCore
                    ref={editorCoreRef}
                    onUpdate={onUpdate}
                    docUrl={undefined}
                    tiptapToken={null}
                    onPlaceholdersChange={onPlaceholders}
                    onPlaceholders={onPlaceholders}
                />
            );
        }
        // If no token and no error, show loading
        return <SpinnerLoader />
    }

    // Only pass docUrl if we have a valid token
    return (
        <TiptapEditorCore
            ref={editorCoreRef}
            onUpdate={onUpdate}
            docUrl={tiptapToken ? docUrl : undefined}
            tiptapToken={tiptapToken}
            onPlaceholdersChange={onPlaceholders}
            onPlaceholders={onPlaceholders}
        />
    );
});

TiptapEditor.displayName = 'TiptapEditor';

export default TiptapEditor; 
