"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { revertEmailChange } from "@/shared/api/auth";
import { getErrorMessage } from "@/shared/api/client";

type RevertStatus = "idle" | "loading" | "success" | "error" | "missing";

export default function EmailChangeRevertPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<RevertStatus>(() => !token ? "missing" : "idle");
  const [message, setMessage] = useState<string>(() => !token ? "Missing email change token." : "Starting email change reversal...");
  const hasRequested = useRef(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    if (hasRequested.current) {
      return;
    }

    hasRequested.current = true;

    setStatus("loading");
    setMessage("Reverting your email change...");

    revertEmailChange({ token })
      .then((response) => {
        setStatus("success");
        setMessage(`Email reverted to ${response.email}.`);
      })
      .catch((err: unknown) => {
        setStatus("error");
        setMessage(getErrorMessage(err));
      });
  }, [token, status]);

  const isError = status === "error" || status === "missing";
  const isSuccess = status === "success";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-4 rounded-lg border bg-background p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Email Change Reversal</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        {(isError || isSuccess) && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => router.replace("/")}>
              Return Home
            </Button>
            {isSuccess && (
              <Button onClick={() => router.replace("/")}>
                Continue
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
