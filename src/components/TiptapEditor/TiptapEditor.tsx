/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { forwardRef, useImperativeHandle, useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';

// Tiptap Extensions
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
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { Extension } from '@tiptap/core';
import ImportDocx from '@tiptap-pro/extension-import-docx';

// Material-UI Icons
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

// Local imports
import { VariableHighlightExtension } from './VariableHighlightExtension';
import SpinnerLoader from '../Common/SpinnerLoader';
import './styles.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props interface for the TiptapEditor component
 */
export interface TiptapEditorProps {
    /** Callback function triggered when editor content changes */
    onUpdate: (html: string) => void;
    /** Optional URL to load a DOCX document from */
    docUrl?: string;
    /** Callback function to receive detected placeholders */
    onPlaceholders: (placeholders: PlaceholderPos[]) => void;
}

/**
 * Ref interface exposing editor methods and state
 */
export interface TiptapEditorRef {
    /** Get current editor content as HTML string */
    getContent: () => string;
    /** Set editor content from HTML string */
    setContent: (content: string) => void;
    /** Import DOCX file into the editor */
    importDocx: (file: File) => Promise<void>;
    /** Navigate editor cursor to a specific placeholder */
    navigateToPlaceholder: (placeholder: PlaceholderPos) => void;
    /** Whether the editor is ready for use */
    isReady: boolean;
    /** Whether the editor is currently loading content */
    isLoading: boolean;
    /** Direct access to the Tiptap editor instance */
    editor: Editor | null;
}

/**
 * Interface representing a placeholder position in the document
 */
export interface PlaceholderPos {
    /** The raw placeholder text as it appears in the document */
    text: string;
    /** Human-readable label for the placeholder */
    label: string;
    /** Start position of the placeholder in the document */
    from: number;
    /** End position of the placeholder in the document */
    to: number;
}

// ============================================================================
// CUSTOM EXTENSIONS
// ============================================================================

/**
 * Custom FontSize extension for Tiptap
 * Allows setting and managing font sizes in the editor
 */
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
            setFontSize: (fontSize: string) => ({ chain }: { chain: any }) => {
                return chain()
                    .setMark('textStyle', { fontSize })
                    .run();
            },
            unsetFontSize: () => ({ chain }: { chain: any }) => {
                return chain()
                    .setMark('textStyle', { fontSize: null })
                    .removeEmptyTextStyle()
                    .run();
            },
        } as any;
    },
});

// ============================================================================
// CORE EDITOR COMPONENT
// ============================================================================

/**
 * Core Tiptap editor component with advanced functionality
 * Handles document editing, placeholder detection, and DOCX import
 */
const TiptapEditorCore = forwardRef<TiptapEditorRef, TiptapEditorProps & { 
    tiptapToken: string | null; 
    onPlaceholdersChange: (placeholders: PlaceholderPos[]) => void 
}>(({ onUpdate, docUrl, tiptapToken, onPlaceholdersChange }, ref) => {
    
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [hasImportedDocx, setHasImportedDocx] = useState(false);

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    /**
     * Check if a placeholder is empty or contains only whitespace
     * 
     * @param rawText - The raw placeholder text to check
     * @returns True if the placeholder is empty
     */
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

    /**
     * Find all placeholders in the current editor content
     * Supports multiple placeholder formats: {{variable}}, [variable], {{variable|label}}
     * 
     * @param editorInstance - The Tiptap editor instance
     * @returns Array of placeholder positions and metadata
     */
    const findPlaceholders = useCallback((editorInstance: any) => {
        if (!editorInstance) return [];
        
        const placeholderRegex = /{{.*?}}|\[.*?\]/g;
        const found: PlaceholderPos[] = [];

        // Traverse all text nodes in the document
        editorInstance.state.doc.descendants((node: any, pos: number) => {
            if (!node.isText) return;

            const text = node.text || '';
            let match;
            const regex = new RegExp(placeholderRegex.source, 'g'); // Create new regex instance for each text node

            // Find all placeholder matches in this text node
            while ((match = regex.exec(text)) !== null) {
                const rawText = match[0];

                // Skip empty placeholders for cleaner navigation
                if (isEmptyPlaceholder(rawText)) {
                    continue;
                }

                let label = rawText;

                // Handle different placeholder formats
                if (rawText.startsWith('{{') && rawText.endsWith('}}')) {
                    // Format: {{variable|label}} - extract the label
                    const parts = rawText.slice(2, -2).split('|');
                    if (parts.length > 1) {
                        const potentialLabel = parts[parts.length - 2];
                        if (potentialLabel) {
                            label = potentialLabel.trim();
                        }
                    }
                } else if (rawText.startsWith('[') && rawText.endsWith(']')) {
                    // Format: [variable] - extract the variable name
                    label = rawText.slice(1, -1).trim();
                }

                found.push({
                    text: rawText,
                    label: label,
                    from: pos + match.index,
                    to: pos + match.index + rawText.length,
                });
            }
        });

        // Debug log to see how many placeholders were found
        console.log(`Found ${found.length} placeholders:`, found.map(p => p.text));

        return found;
    }, [isEmptyPlaceholder]);

    // ============================================================================
    // EDITOR EXTENSIONS CONFIGURATION
    // ============================================================================

    /**
     * Configure Tiptap extensions based on available features
     * Dynamically includes DOCX import if token is available
     */
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
            // Custom FontFamily extension
            Extension.create({
                name: 'fontFamily',
                addGlobalAttributes() {
                    return [
                        {
                            types: ['textStyle'],
                            attributes: {
                                fontFamily: {
                                    default: null,
                                    parseHTML: element => element.style.fontFamily,
                                    renderHTML: attributes => {
                                        if (!attributes.fontFamily) {
                                            return {};
                                        }
                                        return {
                                            style: `font-family: ${attributes.fontFamily}`,
                                        };
                                    },
                                },
                            },
                        },
                    ];
                },
                addCommands() {
                    return {
                        setFontFamily: (fontFamily: string) => ({ commands }: { commands: any }) => {
                            return commands.setMark('textStyle', { fontFamily });
                        },
                        unsetFontFamily: () => ({ commands }: { commands: any }) => {
                            return commands.unsetMark('textStyle');
                        },
                    } as any;
                },
            }),
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

    // ============================================================================
    // EDITOR INSTANCE
    // ============================================================================

    // Ref to store the timeout ID for cleanup
    const placeholderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Initialize the Tiptap editor with configured extensions
     */
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
            // Note: Placeholder detection is now handled by the parent component
            // with debounced updates to improve performance
        },
        onCreate: ({ editor: createdEditor }) => {
            // Detect placeholders when the editor is created
            if (onPlaceholdersChange) {
                setTimeout(() => {
                    onPlaceholdersChange(findPlaceholders(createdEditor));
                }, 100);
            }
        }
    });

    // ============================================================================
    // PLACEHOLDER NAVIGATION
    // ============================================================================

    /**
     * Navigate the editor cursor to a specific placeholder position
     * 
     * @param placeholder - The placeholder position information
     */
    const handlePlaceholderNavigation = useCallback((placeholder: PlaceholderPos) => {
        if (!editor || !placeholder) return;

        const { from, to } = placeholder;
        editor.chain().focus().setTextSelection({ from, to }).run();
    }, [editor]);

    // ============================================================================
    // DOCX IMPORT FUNCTIONALITY
    // ============================================================================

    /**
     * Import a DOCX file into the editor
     * Handles file processing and content insertion
     * 
     * @param file - The DOCX file to import
     */
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
                    // Detect placeholders after document import
                    if (onPlaceholdersChange) {
                        setTimeout(() => {
                            onPlaceholdersChange(findPlaceholders(editor));
                        }, 200);
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

    // ============================================================================
    // EFFECTS & LIFECYCLE MANAGEMENT
    // ============================================================================

    /**
     * Handle DOCX import from URL when component mounts
     * Automatically imports documents from provided docUrl
     */
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
                    // Detect placeholders after URL import
                    if (onPlaceholdersChange) {
                        setTimeout(() => {
                            onPlaceholdersChange(findPlaceholders(editor));
                        }, 300);
                    }
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

    /**
     * Detect placeholders when editor is ready (for documents without URL)
     * Handles initial placeholder detection for new documents
     */
    useEffect(() => {
        if (editor && !isLoading && onPlaceholdersChange && !docUrl) {
            const timeoutId = setTimeout(() => {
                const placeholders = findPlaceholders(editor);
                if (placeholders.length > 0) {
                    onPlaceholdersChange(placeholders);
                }
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [editor, isLoading, onPlaceholdersChange, findPlaceholders, docUrl]);

    /**
     * Cleanup effect to ensure proper destruction
     * Prevents memory leaks and ensures clean editor shutdown
     */
    useEffect(() => {
        return () => {
            if (editor) {
                editor.destroy();
            }
            // Clear any pending placeholder detection timeout
            if (placeholderTimeoutRef.current) {
                clearTimeout(placeholderTimeoutRef.current);
            }
        };
    }, [editor]);

    // ============================================================================
    // IMPERATIVE HANDLE
    // ============================================================================

    /**
     * Expose editor methods and state through ref
     * Allows parent components to interact with the editor
     */
    useImperativeHandle(ref, () => ({
        getContent: () => editor?.getHTML() || '',
        setContent: (content: string) => editor?.commands.setContent(content, true) || false,
        importDocx: (file: File) => importDocxFile(file),
        navigateToPlaceholder: handlePlaceholderNavigation,
        isReady: !!editor,
        isLoading: isLoading,
        editor: editor, // Expose editor instance for external toolbar
    }));

    // ============================================================================
    // RENDER
    // ============================================================================

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

// ============================================================================
// MAIN EDITOR COMPONENT
// ============================================================================

/**
 * Main Tiptap editor component with token management
 * Handles Tiptap Pro token fetching and provides fallback functionality
 */
const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(({ onUpdate, docUrl, onPlaceholders }, ref) => {
    
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================
    
    const [tiptapToken, setTiptapToken] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const editorCoreRef = useRef<TiptapEditorRef>(null);

    // ============================================================================
    // TOKEN MANAGEMENT
    // ============================================================================

    /**
     * Fetch Tiptap Pro token for advanced features
     * Handles timeout and error scenarios gracefully
     */
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

    // ============================================================================
    // IMPERATIVE HANDLE
    // ============================================================================

    /**
     * Expose editor methods through ref
     * Provides unified interface regardless of token availability
     */
    useImperativeHandle(ref, () => ({
        getContent: () => {
            const content = editorCoreRef.current?.getContent();
            return typeof content === 'string' ? content : '';
        },
        setContent: (content: string) => editorCoreRef.current?.setContent(content),
        importDocx: (file: File) => editorCoreRef.current?.importDocx(file) || Promise.resolve(),
        navigateToPlaceholder: (position: any) => editorCoreRef.current?.navigateToPlaceholder(position),
        isReady: !!tiptapToken,
        isLoading: editorCoreRef.current?.isLoading || false,
        editor: editorCoreRef.current?.editor || null, // Expose editor instance
    }));

    // ============================================================================
    // ERROR HANDLING
    // ============================================================================

    if (error && error.message.includes('timed out')) {
        // Don't block the editor for timeout errors, just show a warning
        console.warn('Tiptap Pro features unavailable:', error.message);
    } else if (error && !error.message.includes('timed out')) {
        return <div className="hint error">Error: {error.message}</div>;
    }

    // ============================================================================
    // RENDER LOGIC
    // ============================================================================

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
