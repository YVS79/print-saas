declare global {
  interface Window {
    fabric: any;
  }
}

let fabricModule: any = null;

export async function getFabric(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Fabric can only run on client');
  }

  if (!fabricModule) {
    // Fabric v6 использует именованные экспорты
    const mod = await import('fabric');
    // В v6 все классы экспортируются напрямую: mod.Canvas, mod.Rect, mod.IText и т.д.
    fabricModule = mod;
  }

  return fabricModule;
}
