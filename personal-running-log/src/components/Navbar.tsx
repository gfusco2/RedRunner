import Link from 'next/link';

const Navbar = () => {
    return (
        <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between">
                <div className="text-white text-lg font-bold">
                    <Link href="/">RedRunner</Link>
                </div>
                <div className="space-x-4">
                    <Link href="/logs" className="text-gray-300 hover:text-white">Logs</Link>
                    <Link href="/about" className="text-gray-300 hover:text-white">About</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;