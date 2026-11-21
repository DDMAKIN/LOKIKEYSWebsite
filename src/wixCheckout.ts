// Hands the LOKI KEYS bag to the Wix store's hosted checkout.
// Same REST calls as Wix's own headless storefront code (ecom Cart V2 + redirect session):
// use the current shopper or signed-in member session, put the bag into their Wix cart,
// apply a reward code, then send the shopper to Wix's secure checkout page.
import { WIX } from "./site";
import { wixFetch } from "./wixSession";
import type { Product } from "./catalog";

const call = wixFetch;

export type CheckoutLine = { product: Product; quantity: number };

/**
 * Replaces the shopper's Wix cart with the bag, applies the reward code if there is one,
 * and resolves to the URL of Wix's hosted checkout.
 */
export async function startCheckout(lines: CheckoutLine[], couponCode?: string): Promise<string> {
  if (!lines.length) throw new Error("Your bag is empty.");

  // Start from a clean cart so it matches the bag exactly.
  try {
    const current = await call("/ecom/v2/carts/current", undefined, "GET");
    const ids: string[] = (current?.cart?.lineItems || []).map((l: { id: string }) => l.id);
    if (ids.length) await call("/ecom/v2/carts/current/remove-line-items", { lineItemIds: ids });
    if (current?.cart?.coupons?.length) await call("/ecom/v2/carts/current/remove-coupon", {});
  } catch (e) {
    if ((e as { status?: number }).status !== 404) throw e; // 404 = no cart yet
  }

  let added;
  try {
    added = await call("/ecom/v2/carts/current/add-line-items", {
      catalogItems: lines.map(({ product, quantity }) => ({
        quantity,
        catalogReference: {
          catalogItemId: product.wixProductId,
          appId: WIX.storesAppId,
          options: { variantId: product.wixVariantId },
        },
      })),
    });
  } catch {
    throw new Error(
      "One of the items in your bag is out of stock or no longer available. Remove it and try again.",
    );
  }
  const cartId: string | undefined = added?.cart?.id;
  if (!cartId) throw new Error("Checkout couldn't start. Please try again.");

  if (couponCode) {
    try {
      await call("/ecom/v2/carts/current/add-coupon", { coupon: { code: couponCode } });
    } catch {
      // A used or expired code shouldn't block the purchase; the shopper sees the real total at checkout.
    }
  }

  const origin = window.location.origin;
  const session = await call("/headless/v1/redirect-session", {
    ecomCheckout: { checkoutId: cartId },
    callbacks: { postFlowUrl: `${origin}/`, thankYouPageUrl: `${origin}/?order=complete` },
  });
  const url: string | undefined = session?.redirectSession?.fullUrl;
  if (!url) throw new Error("Checkout couldn't start. Please try again.");
  return url;
}
