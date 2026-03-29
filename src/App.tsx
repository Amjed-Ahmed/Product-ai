import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Tag, 
  Type as TypeIcon, 
  FileText, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Languages
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface ProductDetails {
  titles: string[];
  description: string;
  keywords: string[];
}

type Language = 'en' | 'ar';

const translations = {
  en: {
    title: "Product Insight AI",
    poweredBy: "Powered by Gemini",
    uploadTitle: "Upload Product Image",
    dropzoneText: "Click or drag image to upload",
    dropzoneSubtext: "PNG, JPG or WEBP (Max 5MB)",
    changeImage: "Change Image",
    categoryLabel: "Product Category",
    generateBtn: "Generate Insights",
    analyzing: "Analyzing...",
    noInsightsTitle: "No Insights Yet",
    noInsightsSub: "Upload a product image and click \"Generate Insights\" to see AI-powered suggestions.",
    suggestedTitles: "Suggested Titles",
    productDescription: "Product Description",
    seoKeywords: "SEO Keywords",
    copyTooltip: "Copy to clipboard",
    error: "Failed to generate insights. Please try again.",
    categories: [
      "General", "Electronics", "Fashion", "Home & Kitchen", 
      "Beauty & Personal Care", "Sports & Outdoors", "Toys & Games", 
      "Books", "Automotive"
    ]
  },
  ar: {
    title: "محلل المنتجات الذكي",
    poweredBy: "مدعوم بواسطة Gemini",
    uploadTitle: "رفع صورة المنتج",
    dropzoneText: "انقر أو اسحب الصورة للرفع",
    dropzoneSubtext: "PNG أو JPG أو WEBP (بحد أقصى 5 ميجابايت)",
    changeImage: "تغيير الصورة",
    categoryLabel: "فئة المنتج",
    generateBtn: "توليد البيانات",
    analyzing: "جاري التحليل...",
    noInsightsTitle: "لا توجد بيانات بعد",
    noInsightsSub: "قم برفع صورة للمنتج واضغط على \"توليد البيانات\" لرؤية اقتراحات الذكاء الاصطناعي.",
    suggestedTitles: "العناوين المقترحة",
    productDescription: "وصف المنتج",
    seoKeywords: "الكلمات المفتاحية (SEO)",
    copyTooltip: "نسخ إلى الحافظة",
    error: "فشل في توليد البيانات. يرجى المحاولة مرة أخرى.",
    categories: [
      "عام", "إلكترونيات", "أزياء", "المنزل والمطبخ", 
      "الجمال والعناية الشخصية", "الرياضة والهواء الطلق", "الألعاب", 
      "الكتب", "السيارات"
    ]
  }
};

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [image, setImage] = useState<string | null>(null);
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Clear results when language changes to ensure consistency
  const handleLangToggle = () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    setLang(newLang);
    setResults(null);
    setError(null);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setResults(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const generateInsights = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const base64Data = image.split(',')[1];
      const category = translations.en.categories[categoryIdx];
      const targetLang = lang === 'ar' ? 'Arabic' : 'English';
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data,
                },
              },
              {
                text: `You are a professional product marketing expert. 
                Analyze this image of a product in the "${category}" category.
                
                CRITICAL REQUIREMENT: You MUST generate all content (titles, description, and keywords) strictly in ${targetLang}.
                
                Generate:
                1. Three catchy and SEO-friendly titles.
                2. A professional and detailed product description (around 100-150 words).
                3. A list of 10 relevant keywords for search optimization.
                
                Respond ONLY in JSON format with the following structure:
                {
                  "titles": ["Title 1", "Title 2", "Title 3"],
                  "description": "...",
                  "keywords": ["keyword1", "keyword2", ...]
                }`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titles: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              description: { type: Type.STRING },
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["titles", "description", "keywords"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={cn(
        "min-h-screen bg-[#F8F9FA] text-[#212529] selection:bg-blue-100 transition-colors duration-300",
        isRtl ? "font-arabic" : "font-sans"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-blue-200 shadow-lg">
              <ImageIcon className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">{t.title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLangToggle}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all text-sm font-bold border border-gray-200 active:scale-95"
            >
              <Languages className="w-4 h-4 text-blue-600" />
              {lang === 'en' ? 'العربية' : 'English'}
            </button>
            <div className="hidden sm:block text-xs text-gray-400 font-bold uppercase tracking-widest">
              {t.poweredBy}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload & Controls */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className={cn("w-5 h-5 text-blue-600", isRtl && "scale-x-[-1]")} />
                {t.uploadTitle}
              </h2>
              
              <div 
                {...getRootProps()} 
                className={cn(
                  "relative aspect-square rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-4",
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-gray-50",
                  image && "border-none"
                )}
              >
                <input {...getInputProps()} />
                {image ? (
                  <>
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-medium flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> {t.changeImage}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center px-6">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">{t.dropzoneText}</p>
                    <p className="text-xs text-gray-500 mt-1">{t.dropzoneSubtext}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                    {t.categoryLabel}
                  </label>
                  <select 
                    value={categoryIdx}
                    onChange={(e) => setCategoryIdx(parseInt(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    {t.categories.map((cat, idx) => (
                      <option key={idx} value={idx}>{cat}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={generateInsights}
                  disabled={!image || loading}
                  className={cn(
                    "w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2",
                    !image || loading 
                      ? "bg-gray-300 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-[0.98]"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.analyzing}
                    </>
                  ) : (
                    <>
                      {t.generateBtn}
                    </>
                  )}
                </button>
              </div>
            </section>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {results ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
                  className="space-y-6"
                >
                  {/* Titles */}
                  <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <TypeIcon className="w-4 h-4" /> {t.suggestedTitles}
                    </h3>
                    <div className="space-y-3">
                      {results.titles.map((title, idx) => (
                        <div key={idx} className="group relative bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-all">
                          <p className="text-gray-900 font-medium pr-8 pl-8">{title}</p>
                          <button 
                            onClick={() => navigator.clipboard.writeText(title)}
                            className={cn(
                              "absolute top-4 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity",
                              isRtl ? "left-4" : "right-4"
                            )}
                            title={t.copyTooltip}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Description */}
                  <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> {t.productDescription}
                    </h3>
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 leading-relaxed text-gray-700 whitespace-pre-wrap">
                      {results.description}
                    </div>
                  </section>

                  {/* Keywords */}
                  <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Tag className="w-4 h-4" /> {t.seoKeywords}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {results.keywords.map((keyword, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </section>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-dashed border-gray-300"
                >
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{t.noInsightsTitle}</h3>
                  <p className="text-gray-500 max-w-xs mt-2">
                    {t.noInsightsSub}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-gray-200 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2026 {t.title}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
