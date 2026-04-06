import type { Recipe } from "../types/recipe";
import { getPublicImageUrl } from "../services/storageService";

type RecipeCardProps = {
  recipe: Recipe;
  categoryName: string;
  isOwner: boolean;
  isLoggedIn: boolean;
  isFavorite: boolean;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipeId: number) => void;
  onToggleFavorite: (recipeId: number, isFavorite: boolean) => void;
};

export default function RecipeCard({
  recipe,
  categoryName,
  isOwner,
  isLoggedIn,
  isFavorite,
  onEdit,
  onDelete,
  onToggleFavorite
}: RecipeCardProps) {
  const imageUrl = getPublicImageUrl(recipe.image_path);

  return (
    <div className="recipe-card">
      <div className="recipe-card-image">
        <img 
          src={imageUrl} 
          alt={recipe.title}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://via.placeholder.com/400x300?text=No+Image";
          }}
        />
      </div>
      <div className="recipe-card-badge">{categoryName}</div>
      <h3 className="recipe-card-title">{recipe.title}</h3>
      <div className="recipe-card-meta">
        <span>By: {recipe.owner_email || recipe.user_id}</span>
        <span>•</span>
        <span>{recipe.prep_time} mins prep</span>
      </div>
      
      <div className="recipe-card-desc">
        <p>{recipe.description}</p>
      </div>
      
      <div className="recipe-card-actions">
        {isOwner && (
          <>
            <button className="btn-outline" onClick={() => onEdit(recipe)}>Edit Recipe</button>
            <button className="btn-danger" onClick={() => onDelete(recipe.id)}>Delete</button>
          </>
        )}
        
        {isLoggedIn ? (
          <button 
            className={isFavorite ? "btn-favorite" : "btn-outline"} 
            onClick={() => onToggleFavorite(recipe.id, isFavorite)}
          >
            {isFavorite ? "★ Favorited" : "☆ Add Favorite"}
          </button>
        ) : (
          <span style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", marginLeft: "auto" }}>
            Login required for favorite actions
          </span>
        )}
      </div>
    </div>
  );
}
