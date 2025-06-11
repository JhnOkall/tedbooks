import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth"; 
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 12);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
  }

  const { originalFilename, uploadType } = await req.json();

  if (!originalFilename || !uploadType) {
    return NextResponse.json({ message: "Missing required parameters." }, { status: 400 });
  }

  // Build path
  const fileExtension = originalFilename.split(".").pop() || "bin";
  let finalPathname: string;

  if (uploadType === "cover") {
    finalPathname = `images/covers/${nanoid()}.${fileExtension}`;
  } else {
    const slug = originalFilename.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    finalPathname = `books/${slug}.${fileExtension}`;
  }

  // Generate the signed upload URL
  const { url, pathname } = await put(finalPathname, new Blob([]), {
    access: "public",
    contentType: undefined, // Client will send correct Content-Type
    addRandomSuffix: false,
  });

  return NextResponse.json({ uploadUrl: url, pathname });
}
