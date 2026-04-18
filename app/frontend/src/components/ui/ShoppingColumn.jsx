import React from "react";
import { OULU_STORES } from "../../constants/ouluStores";

export default function ShoppingColumn({
  selectedStore,
  setSelectedStore,
  findPrices,
  isFetchingPrices,
  shoppingList,
  clearList,
  toggleItem,
}) {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Card 1: Where are you shopping? */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">
            Where are you shopping?
          </label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {OULU_STORES.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={findPrices}
          disabled={isFetchingPrices || shoppingList.length === 0}
          className={`w-full py-2 rounded font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
            isFetchingPrices
              ? "bg-slate-100 text-slate-400 cursor-wait"
              : "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98]"
          }`}
        >
          {isFetchingPrices ? "Searching Inventory..." : "Find Prices"}
        </button>
      </div>

      {/* Card 2: Items to Get */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* List Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Items to get
          </span>
          <button
            onClick={clearList}
            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase"
          >
            Clear All
          </button>
        </div>

        {/* The Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {shoppingList.length > 0 ? (
            shoppingList.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  item.checked
                    ? "bg-slate-50 border-slate-100 opacity-50"
                    : "bg-white border-slate-200 shadow-sm hover:border-indigo-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      item.checked
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white border-slate-300"
                    }`}
                  >
                    {item.checked && (
                      <span className="text-[10px] text-white">✓</span>
                    )}
                  </div>
                  <span
                    className={`text-sm ${item.checked ? "line-through text-slate-400" : "text-slate-700 font-medium"}`}
                  >
                    {item.name}
                  </span>
                </div>

                {item.price && !item.checked && (
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                    {item.price}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <span className="text-3xl mb-2">🛒</span>
              <p className="text-xs italic">Your list is empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
