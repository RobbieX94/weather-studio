import type { Request, Response } from "express";
import type { AuthRequest } from "../types";
import { prisma } from "../lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PLANS: Record<string, { priceId: string; name: string }> = {
  freelance: {
    priceId: process.env.STRIPE_PRICE_FREELANCE!,
    name: "Freelance",
  },
  freelance_pro: {
    priceId: process.env.STRIPE_PRICE_FREELANCE_PRO!,
    name: "Freelance Pro",
  },
  studio: {
    priceId: process.env.STRIPE_PRICE_STUDIO!,
    name: "Studio",
  },
};

export async function createCheckoutSession(req: AuthRequest, res: Response) {
  const { plan } = req.body;
  const userId = req.user!.id;

  if (!PLANS[plan]) {
    res.status(400).json({ error: "Plan no válido" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    let customerId = user.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: PLANS[plan].priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?subscription=cancelled`,
      metadata: { userId, plan },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear sesión de pago" });
  }
}

export async function createPortalSession(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      res.status(400).json({ error: "No tienes una suscripción activa" });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard/settings`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al abrir el portal de facturación" });
  }
}

export async function getSubscription(req: AuthRequest, res: Response) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.id },
    });

    res.json({ subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).json({ error: "Webhook inválido" });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (!userId || !plan) break;

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId: session.customer as string,
            stripeSubId: session.subscription as string,
            plan,
            status: "active",
          },
          update: {
            stripeCustomerId: session.customer as string,
            stripeSubId: session.subscription as string,
            plan,
            status: "active",
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { plan },
        });

        await prisma.notification.create({
          data: {
            userId,
            title: "Suscripción activada",
            message: `Tu plan ${plan} ha sido activado correctamente. ¡Bienvenido!`,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const existing = await prisma.subscription.findFirst({
          where: { stripeSubId: sub.id },
        });

        if (!existing) break;

        await prisma.subscription.update({
          where: { stripeSubId: sub.id },
          data: {
            status: sub.status,
            currentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const existing = await prisma.subscription.findFirst({
          where: { stripeSubId: sub.id },
        });

        if (!existing) break;

        await prisma.subscription.update({
          where: { stripeSubId: sub.id },
          data: { status: "cancelled", plan: "freelance" },
        });

        await prisma.user.update({
          where: { id: existing.userId },
          data: { plan: "freelance" },
        });

        await prisma.notification.create({
          data: {
            userId: existing.userId,
            title: "Suscripción cancelada",
            message: "Tu suscripción ha sido cancelada. Sigues en el plan Freelance gratuito.",
          },
        });
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    res.status(500).json({ error: "Error procesando webhook" });
  }
}
