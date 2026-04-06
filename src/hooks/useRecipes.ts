import { useEffect, useState } from "react";
import type { NewRecipe, Recipe } from "../types/recipe";
import { createRecipe, getAllRecipes, updateRecipe, deleteRecipe } from "../services/recipeService";
import { uploadImage } from "../services/storageService";

// Custom hook for loading and managing all recipes
export function useRecipes() {
  // Stores all recipes
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Loads all recipes
  async function loadRecipes() {
    setLoading(true);
    setError("");

    const { data, error } = await getAllRecipes();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setRecipes(data as Recipe[] ?? []);
    setLoading(false);
  }

  // Reload recipes on mount
  useEffect(() => {
    loadRecipes();
  }, []);

  // Adds a new recipe
  async function addRecipe(recipe: NewRecipe) {
    clearMessages();
    
    // Extract temporary image file if present
    const imageFile = (recipe as any).tempImageFile as File | undefined;
    
    // Create a clean recipe object without the temporary property
    const cleanRecipe: NewRecipe = {
      title: recipe.title,
      description: recipe.description,
      prep_time: recipe.prep_time,
      category_id: recipe.category_id,
      user_id: recipe.user_id,
      owner_email: recipe.owner_email,
      image_path: recipe.image_path,
    };
    
    const { data, error } = await createRecipe(cleanRecipe);

    if (error) {
      setError(error.message);
      return false;
    }

    // If a recipe was created and there's an image file, upload it
    if (data && data.length > 0 && imageFile) {
      const newRecipeId = data[0].id;
      const imagePath = await uploadImage(imageFile, newRecipeId, recipe.user_id);
      
      // Update the recipe with the image path
      if (imagePath) {
        await updateRecipe(newRecipeId, { image_path: imagePath });
      }
    }

    setSuccessMessage("Recipe added successfully.");
    await loadRecipes();
    return true;
  }

  // Updates an existing recipe
  async function editRecipe(recipeId: number, updatedData: Partial<NewRecipe>) {
    clearMessages();
    const { error } = await updateRecipe(recipeId, updatedData);

    if (error) {
      setError(error.message);
      return false;
    }

    setSuccessMessage("Recipe updated successfully.");
    await loadRecipes();
    return true;
  }

  // Deletes a recipe
  async function removeRecipe(recipeId: number) {
    clearMessages();
    const { error } = await deleteRecipe(recipeId);

    if (error) {
      setError(error.message);
      return false;
    }

    setSuccessMessage("Recipe deleted successfully.");
    await loadRecipes();
    return true;
  }

  // Helper to clear messages
  function clearMessages() {
    setError("");
    setSuccessMessage("");
  }

  return {
    recipes,
    loading,
    error,
    successMessage,
    addRecipe,
    editRecipe,
    removeRecipe,
    refreshRecipes: loadRecipes,
    clearMessages,
  };
}

