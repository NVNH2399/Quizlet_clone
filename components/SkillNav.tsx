import Link from "next/link";

const SKILLS = [
  { href: "study", icon: "🗂️", label: "Flashcard", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { href: "listen", icon: "🔊", label: "Nghe", color: "bg-purple-50 text-purple-600 border-purple-200" },
  { href: "write", icon: "✍️", label: "Viết", color: "bg-green-50 text-green-600 border-green-200" },
  { href: "speak", icon: "🎤", label: "Nói", color: "bg-orange-50 text-orange-600 border-orange-200" },
  { href: "reading", icon: "📖", label: "Đọc", color: "bg-pink-50 text-pink-600 border-pink-200" },
  { href: "import", icon: "📥", label: "Import", color: "bg-gray-50 text-gray-600 border-gray-200" },
];

export default function SkillNav({ setId }: { setId: string }) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 my-6">
      {SKILLS.map((skill) => (
        <Link
          key={skill.href}
          href={`/sets/${setId}/${skill.href}`}
          className={`flex flex-col items-center justify-center gap-2 border rounded-2xl py-5 px-2 transition-all hover:shadow-md hover:-translate-y-0.5 ${skill.color}`}
        >
          <span className="text-2xl">{skill.icon}</span>
          <span className="text-sm font-semibold">{skill.label}</span>
        </Link>
      ))}
    </div>
  );
}