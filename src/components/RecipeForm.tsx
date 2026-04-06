import { useState, useEffect, useRef } from "react";
import type { Category } from "../types/category";
import type { NewRecipe, Recipe, RecipeFormData } from "../types/recipe";
import { uploadImage, replaceImage, getPublicImageUrl } from "../services/storageService";

type RecipeFormProps = {
  categories: Category[];
  userId: string;
  userEmail: string;
  editingRecipe: Recipe | null;
  onAddRecipe: (recipe: NewRecipe) => Promise<boolean>;
  onEditRecipe: (recipeId: number, recipe: Partial<NewRecipe>) => Promise<boolean>;
  onCancelEdit: () => void;
  error: string;
  successMessage: string;
};

const initialForm: RecipeFormData = {
  title: "",
  description: "",
  prep_time: 0,
  category_id: "",
  image_file: undefined,
};

export default function RecipeForm({
  categories,
  userId,
  userEmail,
  editingRecipe,
  onAddRecipe,
  onEditRecipe,
  onCancelEdit,
  error,
  successMessage,
}: RecipeFormProps) {
  const [form, setForm] = useState<RecipeFormData>(initialForm);
  const [localError, setLocalError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingRecipe) {
      setForm({
        title: editingRecipe.title,
        description: editingRecipe.description,
        prep_time: editingRecipe.prep_time,
        category_id: editingRecipe.category_id.toString(),
        image_file: undefined,
      });
      // Show current image if editing
      if (editingRecipe.image_path) {
        setPreviewUrl(getPublicImageUrl(editingRecipe.image_path));
      } else {
        setPreviewUrl("");
      }
      setLocalError("");
    } else {
      setForm(initialForm);
      setPreviewUrl("");
    }
  }, [editingRecipe]);

  function updateField<K extends keyof RecipeFormData>(key: K, value: RecipeFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      updateField("image_file", file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function clearImage() {
    setPreviewUrl("");
    updateField("image_file", undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function validate() {
    if (!form.title.trim() || !form.description.trim() || !form.prep_time || !String(form.category_id).trim()) {
      setLocalError("All fields are required.");
      return false;
    }
    if (Number(form.prep_time) <= 0) {
      setLocalError("Prep time must be greater than zero.");
      return false;
    }
    setLocalError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsUploading(true);
    let imagePath: string | undefined;

    if (editingRecipe) {
      // Handle image replacement if a new file is selected
      if (form.image_file) {
        imagePath = await replaceImage(
          form.image_file,
          editingRecipe.image_path,
          editingRecipe.id,
          userId
        );
      } else {
        // Keep existing image
        imagePath = editingRecipe.image_path;
      }

      const ok = await onEditRecipe(editingRecipe.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        prep_time: Number(form.prep_time),
        category_id: Number(form.category_id),
        image_path: imagePath,
      });
      if (ok) onCancelEdit();
    } else {
      // Upload image if provided
      if (form.image_file) {
        // We need to create the recipe first to get the ID
        // So we'll pass the file through and let MainContent handle it
        imagePath = undefined; // Will be handled in MainContent
      }

      const recipe: NewRecipe = {
        title: form.title.trim(),
        description: form.description.trim(),
        prep_time: Number(form.prep_time),
        category_id: Number(form.category_id),
        user_id: userId,
        owner_email: userEmail,
        image_path: imagePath,
      };
      
      // Store the file temporarily for MainContent to handle
      (recipe as any).tempImageFile = form.image_file;
      
      const ok = await onAddRecipe(recipe);
      if (ok) setForm(initialForm);
    }

    setIsUploading(false);
  }

  return (
    <div className="form-card">
      <form onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: "1.5rem" }}>{editingRecipe ? "Edit Recipe" : "Share a New Recipe"}</h2>

        <div className="form-group">
          <label>Recipe Title</label>
          <input
            type="text"
            placeholder="e.g. Grandma's Apple Pie"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Description & Instructions</label>
          <textarea
            placeholder="Share the steps and magic behind this recipe..."
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "1.5rem" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Prep Time (minutes)</label>
            <input
              type="number"
              min="1"
              value={form.prep_time}
              onChange={(e) => updateField("prep_time", Number(e.target.value))}
            />
          </div>

          <div className="form-group" style={{ flex: 2 }}>
            <label>Category</label>
            <select
              value={form.category_id}
              onChange={(e) => updateField("category_id", e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Recipe Image (Optional)</label>
          <div style={{ marginTop: "0.5rem" }}>
            {previewUrl && (
              <div style={{ marginBottom: "1rem" }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: "300px",
                    maxHeight: "300px",
                    borderRadius: "8px",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                />
                <button
                  type="button"
                  className="btn-outline"
                  onClick={clearImage}
                  style={{ marginTop: "0.5rem" }}
                >
                  Remove Image
                </button>
              </div>
            )}
            {!previewUrl && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "block", marginBottom: "0.5rem" }}
              />
            )}
            <small style={{ color: "var(--text-muted)", display: "block" }}>
              {previewUrl ? "Click 'Remove Image' to change it" : "Supported formats: JPG, PNG, GIF, WebP"}
            </small>
          </div>
        </div>

        {localError && <p className="error-msg">{localError}</p>}
        {error && <p className="error-msg">{error}</p>}
        {successMessage && <p className="success-msg">{successMessage}</p>}

        <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
          <button type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : editingRecipe ? "Save Changes" : "Post Recipe"}
          </button>
          {editingRecipe && (
            <button type="button" className="btn-outline" onClick={onCancelEdit}>Cancel Edit</button>
          )}
        </div>
      </form>
    </div>
  );
}

