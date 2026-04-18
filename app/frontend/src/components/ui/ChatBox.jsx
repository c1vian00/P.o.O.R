import React from "react";

export default function ChatBox({
  messages,
  isTyping,
  inputValue,
  setInputValue,
  handleSendMessage,
  messagesEndRef,
}) {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-inner border border-slate-100 overflow-hidden">
      {/* Message History Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-slate-100 text-slate-800 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-400 px-4 py-2 rounded-2xl rounded-bl-none text-sm shadow-sm animate-pulse">
              POOR is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar Area */}
      <div className="p-3 bg-slate-50 border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={
              isTyping ? "POOR is searching..." : "Ask me for a recipe..."
            }
            value={inputValue}
            disabled={isTyping}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className={`flex-1 px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none ${
              isTyping
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500"
            }`}
          />
          <button
            onClick={handleSendMessage}
            disabled={isTyping || !inputValue.trim()}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              isTyping || !inputValue.trim()
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
            }`}
          >
            {isTyping ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
