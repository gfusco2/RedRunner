import Link from "next/link";

const navLink =
  "text-gray-300 hover:text-white transition-colors";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between">
        <div className="text-lg font-bold text-white">
          <Link href="/">RedRunner</Link>
        </div>
        <div className="flex space-x-4">
          <Link href="/dashboard" className={navLink}>
            Dashboard
          </Link>
          <Link href="/training-log" className={navLink}>
            Training Log
          </Link>
        </div>
      </div>
    </nav>
  );
}
