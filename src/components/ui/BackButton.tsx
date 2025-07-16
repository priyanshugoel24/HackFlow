"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { BackButtonProps } from "@/interfaces/BackButtonProps";

export default function BackButton({ 
  label = "Back", 
  className,
  variant = "ghost",
  size = "default"
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn("flex items-center gap-2", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
