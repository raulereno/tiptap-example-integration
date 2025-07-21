# Tiptap DOCX Demo

A minimal, fully-commented example showing how to use Tiptap 3 with DOCX import/export functionality.

## ✨ Features

- **Multiple Document Sources**: 
  - Example document (pre-loaded sample)
  - Custom URL (import from web)
  - Local file upload (drag & drop or file picker)
  - Blank document (start from scratch)

- **LocalStorage Integration**: 
  - Document URLs and filenames are stored in localStorage
  - Clean navigation without URL parameters
  - Persistent state between sessions

- **Advanced Editor Features**:
  - Real-time placeholder detection and navigation
  - Auto-save with debouncing
  - Manual save functionality
  - DOCX export with original filename preservation
  - Rich text formatting toolbar

- **Memory Management**:
  - Automatic cleanup of blob URLs
  - Efficient localStorage handling
  - Proper component lifecycle management

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up your Tiptap token**:
   - Get a token from [Tiptap Cloud](https://tiptap.dev/cloud)
   - Add it to your environment variables or update the token generation logic

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Home page with document selection
│   ├── edit-document/
│   │   └── page.tsx            # Main editor page
│   └── api/
│       ├── export-docx/        # DOCX export endpoint
│       └── generate-token/     # Tiptap token generation
├── components/
│   ├── TiptapEditor/           # Main editor component
│   ├── Toolbar/                # Rich text toolbar
│   └── Common/                 # Shared components
├── hooks/
│   ├── useDebounce.ts          # Debounced operations
│   └── useLocalStorage.ts      # localStorage management
├── services/
│   └── cases.ts               # API service functions
└── utils/
    ├── exportToDocx.ts        # DOCX export utilities
    └── blobUtils.ts           # Blob URL management
```

## 🔧 Key Components

### Home Page (`src/app/page.tsx`)
- Four document source options
- LocalStorage integration for document URLs
- File upload with blob URL management
- Responsive grid layout

### Editor Page (`src/app/edit-document/page.tsx`)
- Main document editing interface
- Placeholder detection and navigation
- Auto-save and manual save functionality
- DOCX export with filename preservation

### LocalStorage Hook (`src/hooks/useLocalStorage.ts`)
- Custom hook for localStorage management
- Type-safe document storage
- Automatic cleanup and error handling

### Blob Utils (`src/utils/blobUtils.ts`)
- Efficient blob URL management
- Memory leak prevention
- Cleanup utilities

## 🎯 Usage Examples

### Loading a Document from URL
```typescript
const { saveDocument } = useDocumentStorage()
saveDocument('https://example.com/document.docx', 'My Document.docx')
router.push('/edit-document')
```

### Uploading a Local File
```typescript
const handleFileUpload = (file: File) => {
  const blobUrl = URL.createObjectURL(file)
  saveDocument(blobUrl, file.name)
  router.push('/edit-document')
}
```

### Exporting with Original Filename
```typescript
const exportFilename = filename 
  ? `${filename.replace(/\.[^/.]+$/, '')}-edited-${Date.now()}.docx`
  : `document-${Date.now()}.docx`
```

## 🔒 LocalStorage Keys

The application uses the following localStorage keys:
- `tiptap_document_url`: Stores the current document URL
- `tiptap_document_filename`: Stores the original filename

## 🧹 Memory Management

- Blob URLs are automatically cleaned up when components unmount
- localStorage is cleared when navigating back to home
- Efficient state management prevents memory leaks

## 🎨 Styling

- Built with Tailwind CSS
- Responsive design for all screen sizes
- Material-UI icons for consistent UI
- Smooth transitions and hover effects

## 📝 Development Notes

- Uses Next.js 14 with App Router
- TypeScript for type safety
- Tiptap 3 with Pro extensions
- LocalStorage for state persistence
- Blob URLs for local file handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
