import React from "react";

export default function Header() {
  return (
    <header className="flex flex-col items-center justify-center py-4 bg-white border-b border-slate-200 shadow-sm z-10 w-full">
      <h1 className="text-3xl font-extrabold tracking-tight text-indigo-600 uppercase">
        P.O.O.R. - Preparation of Oulu Recipes
      </h1>
      <p className="text-slate-400 text-sm font-medium tracking-wide">
        Your recipe helper
      </p>
    </header>
  );
}