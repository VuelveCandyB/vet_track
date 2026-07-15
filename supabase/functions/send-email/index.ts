import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@latest"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

interface SendEmailRequest {
  to: string | string[]
  subject: string
  html: string
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const { to, subject, html } = (await req.json()) as SendEmailRequest

    const recipients = Array.isArray(to) ? to : [to]

    const data = await resend.emails.send({
      from: "VetTrack <noreply@vettrack.com>",
      to: recipients,
      subject,
      html,
    })

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
