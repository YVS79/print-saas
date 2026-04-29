export type ID = string;
export type ISODate = string;
export type Format = "A4" | "A3";

export interface Shop {
  id: ID;
  slug: string;
  name: string;
  domain?: string | null;
  isActive: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface User {
  id: ID;
  shopId: ID;
  email: string;
  name: string;
  role: "owner" | "manager";
  isActive: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Asset {
  id: ID;
  shopId: ID;
  key: string;
  bucket: string;
  mimeType: string;
  widthPx?: number;
  heightPx?: number;
  sizeBytes: number;
  createdByUserId: ID;
  createdAt: ISODate;
}

export interface Template {
  id: ID;
  shopId: ID;
  name: string;
  format: Format;
  widthMM: number;
  heightMM: number;
  bleedMM: number;
  baseDesignId: ID;
  isActive: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type CanvasObjectType = "image" | "text" | "shape";

export interface CanvasObjectBase {
  id: ID;
  type: CanvasObjectType;
  xMM: number;
  yMM: number;
  widthMM: number;
  heightMM: number;
  rotationDeg: number;
  opacity: number;
  zIndex: number;
}

export interface CanvasImageObject extends CanvasObjectBase {
  type: "image";
  assetId: ID;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CanvasTextObject extends CanvasObjectBase {
  type: "text";
  text: string;
  fontFamily: string;
  fontSizePt: number;
  color: string;
  align: "left" | "center" | "right";
  lineHeight: number;
}

export interface CanvasShapeObject extends CanvasObjectBase {
  type: "shape";
  shape: "rect" | "circle" | "line";
  fill?: string;
  stroke?: string;
  strokeWidthMM?: number;
}

export type CanvasObject = CanvasImageObject | CanvasTextObject | CanvasShapeObject;

export interface CanvasDesign {
  id: ID;
  shopId: ID;
  designId: ID;
  format: Format;
  widthMM: number;
  heightMM: number;
  dpi: 300;
  bleedMM: number;
  objects: CanvasObject[];
  version: number;
  schemaVersion: number;
  updatedAt: ISODate;
  createdByUserId: ID;
}

export interface Order {
  id: ID;
  shopId: ID;
  designId: ID;
  designVersion: number;
  quantity: number;
  status: "created" | "queued" | "printed" | "cancelled";
  customerName?: string;
  customerPhone?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface PrintJob {
  id: ID;
  shopId: ID;
  orderId: ID;
  designId: ID;
  designVersion: number;
  printerFormat: Format;
  dpi: 300;
  bleedMM: number;
  status: "queued" | "rendering" | "ready" | "failed";
  pdfAssetId?: ID;
  errorMessage?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}
