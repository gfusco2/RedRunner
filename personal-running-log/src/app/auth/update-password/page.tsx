import UpdatePasswordForm from "./UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Choose a password you will use to sign in to RedRunner.
        </p>
      </div>
      <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-soft">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
