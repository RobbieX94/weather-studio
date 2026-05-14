import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil' as any,
})

const PRICE_MAP: Record<string, string> = {
  basico_monthly:        process.env.STRIPE_PRICE_BASICO_MONTHLY!,
  basico_yearly:         process.env.STRIPE_PRICE_BASICO_YEARLY!,
  freelance_pro_monthly: process.env.STRIPE_PRICE_FREELANCE_PRO_MONTHLY!,
  freelance_pro_yearly:  process.env.STRIPE_PRICE_FREELANCE_PRO_YEARLY!,
  studio_monthly:        process.env.STRIPE_PRICE_STUDIO_MONTHLY!,
  studio_yearly:         process.env.STRIPE_PRICE_STUDIO_YEARLY!,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  try {
    const { plan, billing, email, userId } = req.body

    if (!plan || !billing || !email)
      return res.status(400).json({ error: 'plan, billing y email son obligatorios' })

    if (plan === 'free')
      return res.status(400).json({ error: 'El plan Free no requiere pago' })

    const priceId = PRICE_MAP[`${plan}_${billing}`]
    if (!priceId)
      return res.status(400).json({ error: `Plan o ciclo inválido: ${plan}_${billing}` })

    const origin = req.headers.origin ?? 'https://weather-studio.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: userId ?? '', plan, billing },
      subscription_data: { metadata: { userId: userId ?? '', plan, billing } },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/register?plan=${plan}&billing=${billing}&canceled=1`,
      allow_promotion_codes: true,
      locale: 'es',
    })

    return res.status(200).json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return res.status(500).json({ error: error.message ?? 'Error creando la sesión de pago' })
  }
}
