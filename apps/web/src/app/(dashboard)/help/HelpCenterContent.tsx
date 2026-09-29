"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Mail, Search } from "lucide-react";

const faqItems = [
  {
    question: "Làm thế nào để đặt lại mật khẩu?",
    answer:
      "Nếu vẫn đăng nhập được, vào Settings để đổi mật khẩu. Nếu bạn quên mật khẩu, hãy liên hệ đội ngũ hỗ trợ qua nút bên dưới để được hướng dẫn.",
  },
  {
    question: "Làm thế nào để lưu từ vựng?",
    answer:
      "Mở My Words để thêm từ vào bộ sưu tập cá nhân. Bạn cũng có thể đánh dấu yêu thích từ vựng khi học để tìm lại nhanh hơn.",
  },
  {
    question: "Tôi sử dụng từ điển như thế nào?",
    answer:
      "Chọn Dictionary ở thanh điều hướng, nhập từ tiếng Nhật hoặc nghĩa bạn muốn tra, rồi chọn một kết quả để xem chi tiết.",
  },
  {
    question: "Làm sao để theo dõi tiến độ học tập?",
    answer:
      "Trang Home hiển thị mục tiêu học mỗi ngày và tiến độ gần đây. Bạn cũng có thể mở từng khóa học để xem bài học đã hoàn thành.",
  },
  {
    question: "KujiLingo Pro có những gì?",
    answer:
      "Pro mở rộng quyền truy cập và các tính năng học tập nâng cao. Mở mục Upgrade Pro để xem quyền lợi và các gói hiện có.",
  },
  {
    question: "Vì sao tiến độ bài học chưa được cập nhật?",
    answer:
      "Hãy đảm bảo bạn đã hoàn thành hoạt động của bài học và kết nối mạng ổn định. Sau đó tải lại trang khóa học. Nếu tiến độ vẫn chưa đổi, hãy liên hệ hỗ trợ.",
  },
  {
    question: "Tôi có thể đổi mục tiêu học tập ở đâu?",
    answer:
      "Mở Settings để cập nhật mục tiêu học tập hằng ngày và các tùy chọn tài khoản khác.",
  },
];

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLocaleLowerCase();

const contactHref = `mailto:?subject=${encodeURIComponent("Hỗ trợ KujiLingo")}&body=${encodeURIComponent(
  "Xin chào đội ngũ KujiLingo,\n\nTôi cần hỗ trợ về:\n\nThông tin tài khoản (nếu cần):\n",
)}`;

export default function HelpCenterContent() {
  const [query, setQuery] = useState("");
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  const filteredFaqs = useMemo(() => {
    const keyword = normalizeSearchText(query.trim());
    if (!keyword) return faqItems.map((item, index) => ({ ...item, index }));

    return faqItems
      .map((item, index) => ({ ...item, index }))
      .filter((item) =>
        normalizeSearchText(`${item.question} ${item.answer}`).includes(keyword),
      );
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
          Trung tâm trợ giúp
        </h1>
        <p className="text-zinc-500">
          Tìm câu trả lời nhanh trong các câu hỏi thường gặp.
        </p>
      </header>

      <label className="relative block">
        <Search
          aria-hidden="true"
          size={20}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <span className="sr-only">Tìm kiếm câu hỏi</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm câu hỏi..."
          className="h-14 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[#c8102e] focus:ring-4 focus:ring-rose-100"
        />
      </label>

      <section aria-labelledby="faq-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="faq-heading" className="text-xl font-bold text-zinc-900">
            Câu hỏi thường gặp
          </h2>
          <span className="text-sm text-zinc-400">
            {filteredFaqs.length} câu hỏi
          </span>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((item) => {
            const isOpen = openQuestion === item.index;
            const answerId = `help-answer-${item.index}`;

            return (
              <article
                key={item.index}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-colors hover:border-zinc-300"
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() =>
                      setOpenQuestion(isOpen ? null : item.index)
                    }
                    className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c8102e]"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      aria-hidden="true"
                      size={20}
                      className={`shrink-0 text-zinc-400 transition-transform ${
                        isOpen ? "rotate-180 text-[#c8102e]" : ""
                      }`}
                    />
                  </button>
                </h3>
                <div
                  id={answerId}
                  hidden={!isOpen}
                  className="border-t border-zinc-100 px-5 py-4 text-sm leading-6 text-zinc-600"
                >
                  {item.answer}
                </div>
              </article>
            );
          })}

          {filteredFaqs.length === 0 && (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-8 text-center text-sm text-zinc-500">
              Không tìm thấy câu hỏi phù hợp. Hãy thử từ khóa khác hoặc liên hệ hỗ trợ bên dưới.
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-rose-100 bg-rose-50/70 p-6 sm:flex-row sm:items-center sm:p-7">
        <div>
          <h2 className="font-bold text-zinc-900">
            Chưa tìm thấy câu trả lời?
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Gửi câu hỏi cho đội ngũ KujiLingo, chúng tôi sẽ hỗ trợ bạn.
          </p>
        </div>
        <a
          href={contactHref}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#b7152b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a01226] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
        >
          <Mail aria-hidden="true" size={17} />
          Liên hệ hỗ trợ
        </a>
      </section>
    </div>
  );
}
