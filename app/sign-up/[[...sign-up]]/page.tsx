import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Join ResuMaker</span>
          </h1>
          <p className="text-gray-600">Create an account to get started</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
              card: "bg-white shadow-xl border-0",
              headerTitle: "text-2xl font-bold",
              headerSubtitle: "text-gray-600",
            },
          }}
        />
      </div>
    </div>
  );
} 