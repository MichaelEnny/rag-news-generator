import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <Link href="/" className="auth-back-link">
        Back to landing page
      </Link>
      <div className="auth-card-wrap">
        <SignUp />
      </div>
    </main>
  );
}
