"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqData: FaqItem[] = [
    {
      question: "Do I need prior Japanese knowledge to start?",
      answer: "Not at all. KujiLingo is built for all learning levels. We provide an initial N5 onboarding path covering Hiragana and Katakana for complete beginners before you enter the Arena.",
    },
    {
      question: "How does the PvP Arena help me learn?",
      answer: "Under pressure, your brain is forced to access recall memory much faster. The real-time duel dynamic transitions your vocabulary and grammar knowledge from slow calculation to fast, instinctual recognition.",
    },
    {
      question: "Is KujiLingo a complete study resource?",
      answer: "KujiLingo is designed as the ultimate performance engine for vocabulary, kanji, and grammar retention. For complete fluency, we recommend pairing it with conversational practice and reading native materials.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-white py-20 lg:py-24 border-b border-zinc-100" id="faq">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>

        {/* Accordions */}
        <div className="flex flex-col gap-4">
          {faqData.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between p-6 text-left font-semibold text-zinc-800 hover:text-zinc-950 focus:outline-none cursor-pointer"
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    size={18}
                    className={`text-zinc-400 transition-transform duration-300 ${
                      isOpen ? "transform rotate-180 text-[#b7152b]" : ""
                    }`}
                  />
                </button>
                
                {/* Answer Area */}
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[200px] border-t border-zinc-50" : "max-h-0"
                  } overflow-hidden`}
                >
                  <p className="p-6 text-sm text-zinc-500 leading-relaxed bg-zinc-50/30">
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
