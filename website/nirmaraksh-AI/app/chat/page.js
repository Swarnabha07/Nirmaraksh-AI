import { redirect } from "next/navigation";
import ChatLayout from "@/components/chat/ChatLayout";
import { createClient } from "@/lib/supabase/server";

// /chat is auth-protected. The session is verified on the server (getUser() validates the token
// with Supabase) on every request, so logged-out visitors never receive the chat UI.
export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return <ChatLayout />;
}
