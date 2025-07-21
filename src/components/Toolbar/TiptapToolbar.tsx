import { Undo, Redo, FormatBold, FormatItalic, FormatUnderlined, FormatStrikethrough, FormatColorText, Highlight, FormatListBulleted, FormatListNumbered, FormatAlignLeft, FormatAlignCenter, FormatAlignRight, FormatAlignJustify, Link, Image, TableChart, Code, FormatQuote, ClearAll, Highlight as HighlightIcon, Link as LinkIcon, Image as ImageIcon, Code as CodeIcon, Superscript as SuperscriptIcon, Subscript as SubscriptIcon, HorizontalRule as HorizontalRuleIcon } from '@mui/icons-material';

// Export the Toolbar component separately
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TiptapToolbar = ({ editor, isLoading }: { editor: any; isLoading: boolean }) => {
  // Check if editor is available and ready
  const isEditorAvailable = editor && typeof editor.chain === 'function' && typeof editor.isActive === 'function';
  
  // Disable toolbar if loading or editor not available
  const isDisabled = isLoading || !isEditorAvailable;

  const formatOptions = [
      { label: 'Normal Text', value: 'paragraph', action: () => editor?.chain().focus().setParagraph().run(), isActive: () => editor?.isActive('paragraph') || false },
      { label: 'Heading 1', value: 'h1', action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor?.isActive('heading', { level: 1 }) || false },
      { label: 'Heading 2', value: 'h2', action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor?.isActive('heading', { level: 2 }) || false },
      { label: 'Heading 3', value: 'h3', action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => editor?.isActive('heading', { level: 3 }) || false },
      { label: 'Heading 4', value: 'h4', action: () => editor?.chain().focus().toggleHeading({ level: 4 }).run(), isActive: () => editor?.isActive('heading', { level: 4 }) || false },
  ];

  const getCurrentFormat = () => {
      if (!isEditorAvailable) return 'Normal Text';
      const activeFormat = formatOptions.find(option => option.isActive());
      return activeFormat ? activeFormat.label : 'Normal Text';
  };

  const fontSizes = ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '24px', '30px', '36px', '48px', '60px', '72px'];
  const fontFamilies = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Helvetica', 'Trebuchet MS', 'Comic Sans MS'];

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
                          if (isEditorAvailable) {
                              const selectedOption = formatOptions.find(option => option.label === e.target.value);
                              if (selectedOption) {
                                  selectedOption.action();
                              }
                          }
                      }}
                      disabled={isDisabled}
                  >
                      {formatOptions.map(option => (
                          <option key={option.value} value={option.label}>
                              {option.label}
                          </option>
                      ))}
                  </select>

                  <select
                      className="font-select"
                      onChange={(e) => {
                          if (isEditorAvailable && e.target.value) {
                              editor.chain().focus().setFontFamily(e.target.value).run();
                          }
                      }}
                      value={editor?.getAttributes('textStyle')?.fontFamily || 'Arial'}
                      disabled={isDisabled}
                  >
                      <option value="">Font Family</option>
                      {fontFamilies.map(font => (
                          <option key={font} value={font} style={{ fontFamily: font }}>
                              {font}
                          </option>
                      ))}
                  </select>

                  <select
                      className="size-select"
                      onChange={(e) => {
                          if (isEditorAvailable && e.target.value) {
                              editor.chain().focus().setFontSize(e.target.value).run();
                          }
                      }}
                      defaultValue=""
                      disabled={isDisabled}
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
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive('bold') ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  >
                      <FormatBold sx={{ fontSize: 18 }} />
                  </button>
                  <button
                      type="button"
                      title="Italic (Ctrl+I)"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive('italic') ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  >
                      <FormatItalic sx={{ fontSize: 18 }} />
                  </button>
                  <button
                      type="button"
                      title="Underline (Ctrl+U)"
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive('underline') ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  >
                      <FormatUnderlined sx={{ fontSize: 18 }} />
                  </button>
                  <button
                      type="button"
                      title="Strikethrough"
                      onClick={() => editor?.chain().focus().toggleStrike().run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive('strike') ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
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
                          className={`toolbar-icon-btn color-btn ${isDisabled ? 'disabled' : ''}`}
                          disabled={isDisabled}
                      >
                          <FormatColorText sx={{ fontSize: 18 }} />
                          <input
                              type="color"
                              onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
                              className="color-input"
                              disabled={isDisabled}
                          />
                      </button>
                  </div>
                  <button
                      type="button"
                      title="Highlight"
                      onClick={() => editor?.chain().focus().toggleHighlight().run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive('highlight') ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
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
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive('bulletList') ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  >
                      <FormatListBulleted sx={{ fontSize: 18 }} />
                  </button>
                  <button
                      type="button"
                      title="Numbered List"
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive('orderedList') ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
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
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive({ textAlign: 'left' }) ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  >
                      <FormatAlignLeft sx={{ fontSize: 18 }} />
                  </button>
                  <button
                      type="button"
                      title="Align Center"
                      onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive({ textAlign: 'center' }) ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  >
                      <FormatAlignCenter sx={{ fontSize: 18 }} />
                  </button>
                  <button
                      type="button"
                      title="Align Right"
                      onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive({ textAlign: 'right' }) ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  >
                      <FormatAlignRight sx={{ fontSize: 18 }} />
                  </button>
                  <button
                      type="button"
                      title="Justify"
                      onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive({ textAlign: 'justify' }) ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
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
                          if (!isEditorAvailable) return;
                          const previousUrl = editor.getAttributes('link').href;
                          const url = window.prompt('Enter URL:', previousUrl);

                          if (url === null) return;

                          if (url === '') {
                              editor.chain().focus().extendMarkRange('link').unsetLink().run();
                              return;
                          }

                          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                      }}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive('link') ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  >
                      <LinkIcon sx={{ fontSize: 18 }} />
                  </button>
                  <button
                      type="button"
                      title="Insert Image"
                      onClick={() => {
                          if (!isEditorAvailable) return;
                          const url = window.prompt('Enter image URL:');
                          if (url) {
                              editor.chain().focus().setImage({ src: url }).run();
                          }
                      }}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${isDisabled ? 'disabled' : ''}`}
                  >
                      <ImageIcon sx={{ fontSize: 18 }} />
                  </button>
                  <button
                      type="button"
                      title="Insert Table"
                      onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${isDisabled ? 'disabled' : ''}`}
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
                      onClick={() => editor?.chain().focus().toggleCode().run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive('code') ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  >
                      <CodeIcon sx={{ fontSize: 18 }} />
                  </button>
                  <button
                      type="button"
                      title="Blockquote"
                      onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive('blockquote') ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  >
                      <FormatQuote sx={{ fontSize: 18 }} />
                  </button>
                  <button
                      type="button"
                      title="Superscript"
                      onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive('superscript') ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  >
                      <SuperscriptIcon sx={{ fontSize: 18 }} />
                  </button>
                  <button
                      type="button"
                      title="Subscript"
                      onClick={() => editor?.chain().focus().toggleSubscript().run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${editor?.isActive('subscript') ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  >
                      <SubscriptIcon sx={{ fontSize: 18 }} />
                  </button>
                  <button
                      type="button"
                      title="Horizontal Rule"
                      onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn ${isDisabled ? 'disabled' : ''}`}
                  >
                      <HorizontalRuleIcon sx={{ fontSize: 18 }} />
                  </button>
                  <button
                      type="button"
                      title="Clear Formatting"
                      onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
                      disabled={isDisabled}
                      className={`toolbar-icon-btn clear-formatting ${isDisabled ? 'disabled' : ''}`}
                  >
                      <ClearAll sx={{ fontSize: 18 }} />
                  </button>
              </div>
          </div>
      </div>
  );
};

export default TiptapToolbar;