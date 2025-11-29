import React, { useState } from 'react';
import { Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { Modal, Button } from '../UIComponents';
import { Group, Expense, User } from '../../types';
import { analyzeGroupFinances } from '../../services/geminiService';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  expenses: Expense[];
  users: User[];
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose, group, expenses, users }) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAskAI = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    setResponse('');
    const answer = await analyzeGroupFinances(group, expenses, users, question);
    setResponse(answer);
    setIsLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Divisely Smart Assistant">
      <div className="flex flex-col h-[400px]">
        <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {response ? (
            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-white p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl shadow-sm border border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {response}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
              <div className="bg-indigo-50 p-4 rounded-full mb-3">
                <MessageSquare className="w-8 h-8 text-indigo-300" />
              </div>
              <p className="text-sm font-medium text-gray-600">Ask anything about your group expenses!</p>
              <p className="text-xs mt-2 text-gray-400">
                "Who spent the most on food?"
                <br />
                "Summarize our trip expenses"
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="Ask a question..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAskAI()}
          />
          <Button
            onClick={handleAskAI}
            disabled={isLoading}
            className="w-12 flex items-center justify-center px-0 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
