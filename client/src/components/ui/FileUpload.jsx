import React from 'react';
import { Upload } from 'lucide-react';

const FileUpload = ({ onFileSelect, accept = ".pdf,.jpg,.png", maxSize = 10 * 1024 * 1024, selectedFile }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= maxSize) {
      onFileSelect(file);
    } else if (file) {
      alert("File is too large.");
    }
  };

  return (
    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition relative">
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        accept={accept} 
        onChange={handleFileChange} 
      />
      <div className="flex flex-col items-center pointer-events-none">
        <Upload className="w-10 h-10 text-slate-400 mb-3" />
        <p className="text-slate-600 font-medium">Drag & drop a file or click to browse</p>
        <p className="text-slate-400 text-sm mt-1">PDF, JPG, PNG up to {maxSize / (1024*1024)}MB</p>
      </div>
      {selectedFile && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
          Selected: {selectedFile.name}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
