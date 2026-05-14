import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil' as any,
})

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const config = { api: { bodyParser: false } }

async function buffer(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function updateUserPlan(userId: string, plan: string) {
  if (!userId) return
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ plan })
    .eq('id', userId)
  if (error) console.error('Error actualizando plan:', error)
  else console.log(`✅ Plan actualizado: ${userId} → ${plan}`)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  let event: Stripe.Event
  try {
    const body = await buffer(req)
    event = stripe.webhooks.constructEvent(body, req.headers['stripe-signature'] as string, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        if (s.metadata?.userId && s.metadata?.plan)
          await updateUserPlan(s.metadata.userId, s.metadata.plan)
        break
      }

      case 'invoice.payment_succeeded': {
        const inv = event.data.object as Stripe.Invoice
        const subId = (inv as any).subscription as string
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          if (sub.metadata?.userId && sub.metadata?.plan)
            await updateUserPlan(sub.metadata.userId, sub.metadata.plan)
        }
        break
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice
        const subId = (inv as any).subscription as string
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          if (sub.metadata?.userId) await updateUserPlan(sub.metadata.userId, 'free')
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        if (sub.metadata?.userId) await updateUserPlan(sub.metadata.userId, 'free')
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        if (sub.metadata?.userId && sub.metadata?.plan && sub.status === 'active')
          await updateUserPlan(sub.metadata.userId, sub.metadata.plan)
        break
      }

      default:
        console.log(`Evento no manejado: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (err: any) {
    console.error('Error en webhook:', err)
    return res.status(500).json({ error: 'Error interno' })
  }
}
