import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, ArrowRight, Loader2, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Modal, Button } from '../UIComponents';
import { Group, Expense, Settlement, User as UserType } from '../../types';
import { analyzeGroupFinances } from '../../services/geminiService';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  expenses: Expense[];
  settlements: Settlement[];
  users: UserType[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestedQuestions = [
  "Who spent the most?",
  "Summarize our expenses",
  "What are the biggest expenses?",
  "Who owes whom?"
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose, group, expenses, settlements, users }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleAskAI = async (q?: string) => {
    const queryText = q || question;
    if (!queryText.trim()) return;

    // Add user message immediately
    const userMessage: Message = { role: 'user', content: queryText };
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    // Get AI response
    const answer = await analyzeGroupFinances(group, expenses, settlements, users, queryText);

    // Add AI response
    const aiMessage: Message = { role: 'assistant', content: answer };
    setMessages(prev => [...prev, aiMessage]);
    setIsLoading(false);
  };

  const handleClose = () => {
    setQuestion('');
    setMessages([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Divisely Smart Assistant" className="max-w-2xl">
      <div className="flex flex-col" style={{ minHeight: '500px', maxHeight: '70vh' }}>
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {messages.length === 0 && !isLoading ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="bg-teal-100 p-5 rounded-lg mb-4">
                <MessageSquare className="w-10 h-10 text-teal-500" />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-1">Ask anything about your expenses!</p>
              <p className="text-sm text-gray-500 mb-6">
                I can help you understand spending patterns and balances.
              </p>

              {/* Suggested Questions */}
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleAskAI(q)}
                    className="px-3 py-1.5 text-xs font-medium bg-white border border-teal-200 text-teal-600 rounded-md 
                      hover:bg-teal-50 hover:border-teal-300 transition-all shadow-sm hover:shadow"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Conversation */
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${message.role === 'user'
                      ? 'bg-gray-700 text-white'
                      : 'bg-teal-500 text-white'
                    }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[80%] p-3 rounded-lg shadow-sm ${message.role === 'user'
                      ? 'bg-gray-700 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-100 rounded-tl-sm'
                    }`}>
                    {message.role === 'user' ? (
                      <p className="text-sm">{message.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none text-gray-700 
                        prose-headings:text-gray-800 prose-headings:font-semibold prose-headings:mt-2 prose-headings:mb-1
                        prose-p:my-1 prose-p:leading-relaxed
                        prose-ul:my-1 prose-ul:pl-4
                        prose-li:my-0.5
                        prose-strong:text-teal-700 prose-strong:font-semibold
                        prose-em:text-gray-600">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading State */}
              {isLoading && (
                <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-gray-100 p-3 rounded-lg rounded-tl-sm shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Thinking</span>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <input
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-sm placeholder:text-gray-400"
            placeholder="Ask a question about your expenses..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAskAI()}
            disabled={isLoading}
          />
          <Button
            onClick={() => handleAskAI()}
            disabled={isLoading || !question.trim()}
            className="w-12 h-12 flex items-center justify-center px-0 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
