import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
            footerActionLink: 'text-blue-600 hover:text-blue-800'
          }
        }}
        fallbackRedirectUrl="/create"
        redirectUrl="/create"
      />
    </div>
  );
} 