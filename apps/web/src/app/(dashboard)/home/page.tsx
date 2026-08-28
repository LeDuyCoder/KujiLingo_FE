import Link from "next/link";
import { Button } from "@/shared/components/ui/Button";

export const metadata = {
  title: "Trang chủ | KujiLingo",
  description: "Trang chủ học tiếng Nhật KujiLingo.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm">
      <h1 className="text-3xl font-extrabold text-zinc-950 mb-3">Chào mừng bạn đến với KujiLingo!</h1>
      <p className="text-zinc-500 max-w-md mb-8">Bắt đầu hành trình học tiếng Nhật của bạn bằng các khóa học được thiết kế khoa học từ N5 đến N1.</p>
      <Link href="/courses">
        <Button className="h-12 px-6">Đến trang Khóa học</Button>
      </Link>
    </div>
  );
}
