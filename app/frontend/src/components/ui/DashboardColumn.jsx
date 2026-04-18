import React from "react";

const DashboardColumn = ({
  children,
  title,
  widthClass = "flex-1",
  bgColor = "bg-white",
}) => {
  return (
    <div
      className={`${widthClass} ${bgColor} border-r border-slate-200 flex flex-col relative overflow-hidden`}
    >
      <div className="p-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm z-10">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          {title}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
};

export default DashboardColumn;
