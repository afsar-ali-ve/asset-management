import React from 'react';
import Modal from './Modal';

const DeleteConfirmModal = ({
  isOpen,
  title = 'Delete item',
  message = 'Are you sure you want to delete this item?',
  itemName,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  return (
    <Modal open={isOpen} title={title} onClose={isLoading ? undefined : onCancel} maxWidth="max-w-md">
      <div className="space-y-5" role="alertdialog" aria-modal="true" aria-labelledby="delete-confirm-title">
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p id="delete-confirm-title" className="font-semibold">{message}</p>
          {itemName && <p className="mt-1 break-words text-red-700">{itemName}</p>}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
