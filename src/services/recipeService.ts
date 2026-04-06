import { supabase } from "../lib/supabaseClient";
import type { NewRecipe, Recipe } from "../types/recipe";
import { deleteImage } from "./storageService";

export async function createRecipe(recipe: NewRecipe) {
  return await supabase.from("recipes").insert([recipe]);
}

// Get all recipes for the public dashboard
export async function getAllRecipes() {
  return await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function updateRecipe(recipeId: number, updatedRecipe: Partial<NewRecipe>) {
  return await supabase
    .from("recipes")
    .update(updatedRecipe)
    .eq("id", recipeId);
}

export async function deleteRecipe(recipeId: number) {
  // First fetch the recipe to get the image_path
  const { data: recipe, error: fetchError } = await supabase
    .from("recipes")
    .select("image_path")
    .eq("id", recipeId)
    .single();

  if (fetchError) {
    console.error("Error fetching recipe:", fetchError);
    return { error: fetchError };
  }

  // Delete the associated image from storage
  if (recipe?.image_path) {
    await deleteImage(recipe.image_path);
  }

  // Delete the recipe from database
  return await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId);
}