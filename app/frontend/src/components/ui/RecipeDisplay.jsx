import React from "react";

export default function RecipeDisplay({ currentRecipe, setCurrentRecipe }) {
  return (
    <div className="h-full flex flex-col">
      {!currentRecipe ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🍳</span>
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Nothing to see here
          </h3>
          <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
            Ask the POOR Cook for a recipe based on your current filters to find
            a recipe!
          </p>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* Recipe Header */}
          <div className="p-6 border-b border-slate-100 relative">
            <button
              onClick={() => setCurrentRecipe(null)}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
              title="Close Recipe"
            >
              ✕
            </button>

            <h2 className="text-2xl font-black text-slate-800 leading-tight mb-2 pr-8">
              {currentRecipe.title}
            </h2>

            {/* Slider Pills */}
            <div className="flex gap-4 mb-3">
              <div className="flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                ⏱️ {currentRecipe.time}
              </div>
              <div className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                👥 {currentRecipe.servings}
              </div>
            </div>

            {/* Dynamic Filter Pills */}
            {currentRecipe.tags && (
              <div className="flex flex-wrap gap-2 mt-2">
                {/* Mood Pills */}
                {currentRecipe.tags.mood &&
                  currentRecipe.tags.mood !== "No specific mood" &&
                  currentRecipe.tags.mood.split(", ").map((m, i) => (
                    <span
                      key={`mood-${i}`}
                      className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50/50 border border-indigo-100 rounded-full"
                    >
                      {m}
                    </span>
                  ))}

                {/* Preference Pill */}
                {currentRecipe.tags.meal_type &&
                  currentRecipe.tags.meal_type !== "No specific preference" && (
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50/50 border border-emerald-100 rounded-full">
                      {currentRecipe.tags.meal_type}
                    </span>
                  )}

                {/* Exclusion Pills */}
                {currentRecipe.tags.allergies &&
                  !currentRecipe.tags.allergies.includes("None") &&
                  currentRecipe.tags.allergies.map((allergy, i) => (
                    <span
                      key={`allergy-${i}`}
                      className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400/70 bg-red-50 border border-red-100 rounded-full line-through decoration-red-400/50"
                      style={{ textDecorationThickness: "2px" }}
                    >
                      {allergy}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Ingredients Section */}
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                Ingredients
              </h3>
              <ul className="grid grid-cols-1 gap-3">
                {currentRecipe.ingredients.map((ing, index) => (
                  <li
                    key={index}
                    className="flex items-center text-slate-700 text-sm"
                  >
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-3 shrink-0"></span>
                    {ing.name}
                  </li>
                ))}
              </ul>
            </section>

            {/* Instructions Section */}
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                Instructions
              </h3>
              <div className="space-y-4">
                {currentRecipe.instructions.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <p className="text-sm text-slate-600 leading-relaxed pt-0.5">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
