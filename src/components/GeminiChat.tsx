import { useState, useRef, useEffect } from 'react';
// Dùng fetch API trực tiếp thay vì @google/genai để tránh lỗi version
import { Student, Subject, Grade } from '../types';
import {
  MessageCircle, X, Send, Bot, User, Loader2,
  Sparkles, Trash2, ChevronDown, AlertCircle
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GeminiChatProps {
  students: Student[];
  subjects: Subject[];
  grades: Grade[];
  apiKey: string;
}

const SUGGESTED_QUESTIONS = [
  '📊 Sinh viên nào có GPA cao nhất?',
  '⚠️ Sinh viên nào có nguy cơ trượt môn?',
  '📚 Môn học nào có điểm trung bình thấp nhất?',
  '🏆 Thống kê xếp loại học lực toàn trường',
  '💡 Gợi ý cải thiện chất lượng đào tạo',
];

export default function GeminiChat({ students, subjects, grades, apiKey }: GeminiChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Xin chào! 👋 Tôi là **AI hỗ trợ Quản lý Điểm** được tích hợp Google Gemini.\n\nTôi có thể giúp bạn:\n- 📊 Phân tích kết quả học tập sinh viên\n- 🔍 Tìm kiếm thông tin nhanh chóng\n- 💡 Đưa ra gợi ý cải thiện\n- 📈 Thống kê và báo cáo\n\nBạn muốn hỏi gì về dữ liệu điểm số?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const buildContext = () => {
    // Tính GPA cho từng sinh viên
    const studentStats = students.map(sv => {
      const svGrades = grades.filter(g => g.studentId === sv.id);
      if (svGrades.length === 0) return { ...sv, gpa: 0, totalCredits: 0, gradeCount: 0 };
      
      let totalWeighted = 0;
      let totalCredits = 0;
      svGrades.forEach(g => {
        const sub = subjects.find(s => s.id === g.subjectId);
        const credits = sub?.credits || 3;
        totalWeighted += (g.averageScore ?? 0) * credits;
        totalCredits += credits;
      });
      const gpa = totalCredits > 0 ? totalWeighted / totalCredits : 0;
      return { ...sv, gpa: Math.round(gpa * 100) / 100, totalCredits, gradeCount: svGrades.length };
    });

    // Thống kê môn học
    const subjectStats = subjects.map(sub => {
      const subGrades = grades.filter(g => g.subjectId === sub.id);
      if (subGrades.length === 0) return { ...sub, avgScore: 0, passRate: 0, studentCount: 0 };
      const avg = subGrades.reduce((s, g) => s + (g.averageScore ?? 0), 0) / subGrades.length;
      const pass = subGrades.filter(g => (g.averageScore ?? 0) >= 5).length;
      return { ...sub, avgScore: Math.round(avg * 100) / 100, passRate: Math.round(pass / subGrades.length * 100), studentCount: subGrades.length };
    });

    // Xếp loại
    const classify = (gpa: number) => {
      if (gpa >= 9) return 'Xuất sắc';
      if (gpa >= 8) return 'Giỏi';
      if (gpa >= 7) return 'Khá';
      if (gpa >= 5) return 'Trung bình';
      if (gpa >= 4) return 'Yếu';
      return 'Kém';
    };

    const context = `
# DỮ LIỆU HỆ THỐNG QUẢN LÝ ĐIỂM SINH VIÊN

## THỐNG KÊ TỔNG QUAN
- Tổng số sinh viên: ${students.length}
- Tổng số môn học: ${subjects.length}
- Tổng số bản ghi điểm: ${grades.length}
- GPA trung bình toàn trường: ${studentStats.length > 0 ? (studentStats.reduce((s, sv) => s + sv.gpa, 0) / studentStats.filter(sv => sv.gradeCount > 0).length || 0).toFixed(2) : 'N/A'}

## DANH SÁCH SINH VIÊN VÀ GPA
${studentStats.sort((a, b) => b.gpa - a.gpa).map((sv, i) =>
  `${i + 1}. ${sv.name} (${sv.studentId}) - Lớp: ${sv.className} - GPA: ${sv.gpa} - Xếp loại: ${classify(sv.gpa)} - Số môn: ${sv.gradeCount}`
).join('\n')}

## THỐNG KÊ THEO MÔN HỌC
${subjectStats.sort((a, b) => a.avgScore - b.avgScore).map(sub =>
  `- ${sub.name} (${sub.subjectId}): Điểm TB: ${sub.avgScore}/10 - Tỷ lệ đạt: ${sub.passRate}% - Số SV: ${sub.studentCount} - Tín chỉ: ${sub.credits}`
).join('\n')}

## PHÂN BỐ XẾP LOẠI
${['Xuất sắc', 'Giỏi', 'Khá', 'Trung bình', 'Yếu', 'Kém'].map(loai => {
  const count = studentStats.filter(sv => sv.gradeCount > 0 && classify(sv.gpa) === loai).length;
  return `- ${loai}: ${count} sinh viên`;
}).join('\n')}

## SINH VIÊN CÓ NGUY CƠ TRƯỢT (GPA < 5)
${studentStats.filter(sv => sv.gpa < 5 && sv.gradeCount > 0).map(sv =>
  `- ${sv.name} (${sv.studentId}): GPA ${sv.gpa}`
).join('\n') || '- Không có sinh viên nào có nguy cơ trượt'}

## CHI TIẾT ĐIỂM SỐ
${grades.map(g => {
  const sv = students.find(s => s.id === g.studentId);
  const sub = subjects.find(s => s.id === g.subjectId);
  return `${sv?.name || 'N/A'} - ${sub?.name || 'N/A'}: CC=${g.attendanceScore} GK=${g.midtermScore} CK=${g.finalScore} TB=${g.averageScore} (${g.semester})`;
}).join('\n')}
`;
    return context;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setError(null);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const context = buildContext();

      const prompt = `Bạn là AI trợ lý thông minh hỗ trợ hệ thống quản lý điểm sinh viên đại học. 
Hãy trả lời bằng tiếng Việt, ngắn gọn, chính xác và hữu ích.
Sử dụng emoji phù hợp để làm sinh động câu trả lời.
Nếu được hỏi về dữ liệu cụ thể, hãy trích dẫn từ context bên dưới.

${context}

Câu hỏi của người dùng: ${text}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text
        || 'Xin lỗi, tôi không thể trả lời câu hỏi này.';

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: unknown) {
      console.error('Gemini error:', err);
      let errorMsg = 'Có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại.';
      if (err instanceof Error) {
        if (err.message.includes('API_KEY') || err.message.includes('api key')) {
          errorMsg = 'API Key không hợp lệ. Vui lòng kiểm tra lại VITE_GEMINI_API_KEY.';
        } else if (err.message.includes('quota') || err.message.includes('QUOTA')) {
          errorMsg = 'Đã hết quota API. Vui lòng thử lại sau hoặc nâng cấp tài khoản.';
        }
      }
      setError(errorMsg);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ ${errorMsg}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: `Xin chào! 👋 Tôi là **AI hỗ trợ Quản lý Điểm** được tích hợp Google Gemini.\n\nBạn muốn hỏi gì về dữ liệu điểm số?`,
      timestamp: new Date(),
    }]);
    setError(null);
  };

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white`}
        title="Chat với AI Gemini"
      >
        <div className="relative">
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-2 md:bottom-6 md:right-6 z-50 w-[calc(100vw-1rem)] md:w-[420px] h-[580px] md:h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">AI Gemini Assistant</h3>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-blue-100 text-xs">Đang hoạt động • Gemini 2.0 Flash</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearChat} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Xóa lịch sử">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                  {msg.role === 'user'
                    ? <User className="w-4 h-4 text-white" />
                    : <Bot className="w-4 h-4 text-white" />
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-500 text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'
                  }`}>
                    <div
                      dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 px-1">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}

            {/* Loading */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-sm text-gray-500">AI đang suy nghĩ...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 flex-shrink-0 border-t border-gray-100 bg-white">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <ChevronDown className="w-3 h-3" /> Gợi ý câu hỏi:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi... (Enter để gửi)"
                className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent max-h-24 min-h-[44px]"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-md"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-1.5">
              Powered by Google Gemini 2.0 Flash ✨
            </p>
          </div>
        </div>
      )}
    </>
  );
}
