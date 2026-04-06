import { supabase } from "../lib/supabaseClient";

const BUCKET_NAME = "recipe_images";

/**
 * Upload an image file to Supabase Storage
 * Returns the path to the stored file
 */
export async function uploadImage(file: File, recipeId: number, userId: string): Promise<string | null> {
  if (!file) return null;

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${recipeId}_${userId}_${timestamp}_${file.name}`;
    const filePath = `recipes/${fileName}`;

    // Upload the file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }

    return data.path;
  } catch (error) {
    console.error("Unexpected error uploading image:", error);
    return null;
  }
}

/**
 * Get the public URL for an image stored in Supabase Storage
 */
export function getPublicImageUrl(imagePath: string | undefined): string {
  if (!imagePath) {
    // Return a placeholder image URL
    return "https://via.placeholder.com/400x300?text=No+Image";
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imagePath);
  return data?.publicUrl || "https://via.placeholder.com/400x300?text=No+Image";
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(imagePath: string | undefined): Promise<boolean> {
  if (!imagePath) return true;

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([imagePath]);

    if (error) {
      console.error("Error deleting image:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error deleting image:", error);
    return false;
  }
}

/**
 * Replace an existing image with a new one
 * Deletes the old image and uploads the new one
 */
export async function replaceImage(
  newFile: File | undefined,
  oldImagePath: string | undefined,
  recipeId: number,
  userId: string
): Promise<string | undefined> {
  if (!newFile) {
    // No new file provided, keep the old image
    return oldImagePath;
  }

  // Delete old image if it exists
  if (oldImagePath) {
    await deleteImage(oldImagePath);
  }

  // Upload new image
  const newImagePath = await uploadImage(newFile, recipeId, userId);
  return newImagePath || undefined;
}
