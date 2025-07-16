import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { SmartComposeModalProps } from "@/interfaces/SmartComposeModalProps";

export default function SmartComposeModal({
  open,
  setOpen,
  projectSlug,
  onSuccess,
}: SmartComposeModalProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedCard, setParsedCard] = useState<null | {
    title: string;
    content: string;
    type: "TASK" | "INSIGHT" | "DECISION";
    visibility: "PUBLIC" | "PRIVATE";
  }>(null);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const parsedRes = await axios.post("/api/context-cards/parse", { 
        input, 
        projectId: projectSlug 
      });
      const { parsedCard } = parsedRes.data;

      if (!parsedCard?.title || !parsedCard?.content || !parsedCard?.type || !parsedCard?.visibility) {
        throw new Error("Incomplete card details received from Gemini");
      }

      setParsedCard(parsedCard);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to create card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedCard) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", parsedCard.title);
      formData.append("content", parsedCard.content);
      formData.append("type", parsedCard.type);
      formData.append("visibility", parsedCard.visibility);
      formData.append("projectId", projectSlug);

      await axios.post("/api/context-cards", formData);

      toast.success("Card created successfully via AI ✨");
      setOpen(false);
      setInput("");
      setParsedCard(null);
      onSuccess?.();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to create card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && setOpen(val)}>
      <DialogContent className="min-w-xl max-w-2xl">
        <DialogHeader>
          <DialogTitle>Smart Compose</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!parsedCard ? (
            <>
              <Textarea
                placeholder="Describe the card you want to create. Example: Create a public INSIGHT card titled 'Remote Collaboration' that discusses async workflows."
                rows={6}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <div className="flex justify-end">
                <Button onClick={handleGenerate} disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Generate
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-muted p-4 rounded space-y-2">
                <p><strong>Title:</strong> {parsedCard.title}</p>
                <p><strong>Type:</strong> {parsedCard.type}</p>
                <p><strong>Visibility:</strong> {parsedCard.visibility}</p>
                <p><strong>Content:</strong> {parsedCard.content}</p>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setParsedCard(null)} disabled={loading}>
                  Edit
                </Button>
                <Button onClick={handleConfirm} disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Confirm & Create
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}