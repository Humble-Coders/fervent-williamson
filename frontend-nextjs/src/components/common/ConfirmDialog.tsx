import React from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title = 'Confirm',
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
        </div>
        
        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-xl font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

