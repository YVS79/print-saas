/**
 * Widget Module — Public iframe widget for order placement.
 *
 * This module will provide the embeddable widget that third-party shops
 * can include on their websites. The widget allows customers to:
 *  - Browse available templates
 *  - Upload photos
 *  - Select print options
 *  - Place an order
 *
 * Authentication is via JWT token (see server/auth/widget-token.ts).
 *
 * ── Planned exports ──
 *
 * - generateWidgetToken(shopId: string): string
 * - WidgetEmbed: React component for the iframe
 * - WidgetConfig: configuration interface
 * - createWidgetOrder(input): Promise<OrderRecord>
 *
 * All will be implemented in future MVP sprints.
 */

export interface WidgetConfig {
  shopId: string;
  apiBaseUrl: string;
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
  };
}

/**
 * Placeholder: embedded widget URL generator.
 * E.g. https://print-saas.app/widget/{shopId}?token={jwt}
 */
export function getWidgetUrl(_config: WidgetConfig): string {
  void _config;
  // TODO: implement in widget module sprint
  return "";
}

/**
 * Placeholder: validate widget token and return shop context.
 */
export async function verifyWidgetAccess(_token: string): Promise<{ shopId: string } | null> {
  void _token;
  // TODO: implement in widget module sprint
  return null;
}
