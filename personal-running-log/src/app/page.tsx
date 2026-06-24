import React from 'react';

const HomePage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-4xl font-bold mb-4">Welcome to RedRunner</h1>
            <p className="text-lg mb-8">Your personal running log and website.</p>
            <a href="/logs" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                View My Runs
            </a>
        </div>
    );
};

export default HomePage;