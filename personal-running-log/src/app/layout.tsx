import React from "react";
import Navbar from "../components/Navbar";
import "../styles/globals.css";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <footer className="bg-gray-800 text-white text-center p-4">
        © {new Date().getFullYear()} RedRunner. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;