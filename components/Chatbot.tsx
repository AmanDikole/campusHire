"use client";

import { useChat, type Message } from "ai/react";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const { messages, input, setInput, handleInputChange, handleSubmit, isLoading } = useChat({
        api: "/api/chat",
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const suggestedQuestions = [
        { label: "Check my eligibility", query: "Am I eligible for any active jobs?" },
        { label: "Recommended jobs", query: "Show me jobs recommended for my profile." },
        { label: "Application status", query: "What is the status of my recent applications?" }
    ];

    const handleSuggestedClick = (query: string) => {
        // Create a synthetic event or just call handleSubmit with a custom message
        // For simplicity with useChat, we'll set input and then the user can hit send, 
        // OR we can try to trigger it manually.
        const e = { preventDefault: () => { } } as React.FormEvent;
        setInput(query);
        // We wait a tiny bit for state to update before submit
        setTimeout(() => {
            const form = document.getElementById('chat-form') as HTMLFormElement;
            if (form) form.requestSubmit();
        }, 10);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute bottom-20 right-0 w-[350px] sm:w-[420px] h-[600px] bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-slate-900 p-5 flex items-center justify-between text-white flex-shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none" />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="relative">
                                    <div className="bg-indigo-500 p-2 rounded-2xl">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base tracking-tight">CampusHire Guide</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Online & Ready</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/10 p-2 rounded-xl transition-all duration-200"
                                aria-label="Close Chat"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-5 bg-[#F8FAFC] flex flex-col gap-6 scrollbar-thin scrollbar-thumb-slate-200">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center gap-6 px-6">
                                    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 transform -rotate-3">
                                        <Bot className="w-10 h-10 text-indigo-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-slate-800 text-lg">Hello there!</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            I'm your personal placement assistant. Ask me about jobs, eligibility, or your current application status.
                                        </p>
                                    </div>

                                    <div className="w-full pt-4 space-y-2">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Suggested actions</p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {suggestedQuestions.map((q, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSuggestedClick(q.query)}
                                                    className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                                                >
                                                    {q.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                messages.map((message: Message) => (
                                    <div
                                        key={message.id}
                                        className={cn(
                                            "flex gap-3 max-w-[90%]",
                                            message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                        )}
                                    >
                                        {message.role !== "user" && (
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                                    <Bot className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        )}
                                        <div
                                            className={cn(
                                                "relative rounded-[1.5rem] px-4 py-3 text-sm shadow-sm",
                                                message.role === "user"
                                                    ? "bg-slate-900 text-white rounded-tr-none"
                                                    : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                                            )}
                                        >
                                            <div className={cn(
                                                "prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-inherit prose-ul:my-2 prose-li:my-0.5",
                                                message.role === "user" ? "prose-invert" : "prose-slate"
                                            )}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {message.content}
                                                </ReactMarkdown>
                                            </div>

                                            {message.toolInvocations?.map((toolInvocation: any) => {
                                                if (toolInvocation.state === 'call') {
                                                    return (
                                                        <div key={toolInvocation.toolCallId} className="mt-3 text-[11px] flex items-center gap-2 text-indigo-600 font-medium bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50">
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            Processing requirements...
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                            {isLoading && messages[messages.length - 1]?.role === "user" && (
                                <div className="flex gap-3 max-w-[85%] mr-auto">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="bg-white border border-slate-100 rounded-[1.5rem] rounded-tl-none px-5 py-4 flex items-center gap-1.5 shadow-sm">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
                            <form
                                id="chat-form"
                                onSubmit={handleSubmit}
                                className="flex items-center gap-2 relative bg-slate-50 border border-slate-200 rounded-2xl pr-1.5 pl-4 py-1.5 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/50 transition-all duration-300"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder="Type your question..."
                                    className="flex-1 bg-transparent py-2.5 outline-none text-sm text-slate-700 placeholder:text-slate-400 font-medium"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                            <div className="mt-3 flex justify-center">
                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                    <Bot className="w-2.5 h-2.5" /> AI Assistant • CampusHire v1.0
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 pointer-events-auto",
                    isOpen
                        ? "bg-slate-900 rotate-90"
                        : "bg-indigo-600 hover:shadow-indigo-500/40"
                )}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ opacity: 0, rotate: -45 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 45 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X className="w-7 h-7 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.2 }}
                            className="relative"
                        >
                            <MessageCircle className="w-8 h-8 text-white" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-400 border-4 border-indigo-600 rounded-full animate-ping" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
