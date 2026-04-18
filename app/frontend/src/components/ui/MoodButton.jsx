import React from "react";

const MoodButton = ({ label, isSelected, isDisabled, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
        isSelected
          ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
          : isDisabled
            ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50"
            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
};

export default MoodButton;
