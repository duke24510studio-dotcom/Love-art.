import OpenAI from "openai";

export const AI_DISCLOSURE =
  "This artwork was created using AI-assisted tools and carefully curated, edited, and finalized by the seller.";

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to your .env file.");
  }
  return new OpenAI({ apiKey });
}

export function getOutputImagesDir(): string {
  return process.env.OUTPUT_DIR
    ? `${process.env.OUTPUT_DIR.replace(/\/$/, "")}/images`
    : "outputs/images";
}
