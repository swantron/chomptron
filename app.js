// Recipe History & Favorites Manager
const RecipeManager = {
    storageKey: "chomptron_recipes",
    currentRecipeId: null,

    getRecipes() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    },

    saveRecipe(ingredients, recipe, dietaryPreferences = {}) {
        const recipes = this.getRecipes();
        const id = Date.now().toString();
        const recipeName = this.extractRecipeName(recipe);
        const parsedRecipe = parseRecipe(recipe);

        const newRecipe = {
            id,
            ingredients,
            recipe,
            recipeName,
            timestamp: new Date().toISOString(),
            favorite: false,
            rating: 0,
            servingSize: parsedRecipe.servingSize || null,
            dietaryPreferences: dietaryPreferences,
        };

        recipes.unshift(newRecipe);

        // Keep only last 100 recipes
        if (recipes.length > 100) {
            recipes.pop();
        }

        localStorage.setItem(this.storageKey, JSON.stringify(recipes));
        this.currentRecipeId = id;
        return id;
    },

    updateRecipe(id, updates) {
        const recipes = this.getRecipes();
        const recipe = recipes.find((r) => r.id === id);
        if (recipe) {
            Object.assign(recipe, updates);
            localStorage.setItem(this.storageKey, JSON.stringify(recipes));
        }
    },

    extractRecipeName(recipe) {
        // Try to extract recipe name from first line or heading
        const lines = recipe.split("\n");
        for (let line of lines) {
            const cleaned = line
                .replace(/\*\*/g, "")
                .replace(/^#+\s*/, "")
                .trim();
            if (cleaned && cleaned.length > 3 && cleaned.length < 100) {
                return cleaned;
            }
        }
        return "Untitled Recipe";
    },

    toggleFavorite(id) {
        const recipes = this.getRecipes();
        const recipe = recipes.find((r) => r.id === id);
        if (recipe) {
            recipe.favorite = !recipe.favorite;
            localStorage.setItem(this.storageKey, JSON.stringify(recipes));
        }
        return recipe?.favorite;
    },

    deleteRecipe(id) {
        let recipes = this.getRecipes();
        recipes = recipes.filter((r) => r.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(recipes));
    },

    clearAll() {
        if (
            confirm(
                "Are you sure you want to clear all recipe history? This cannot be undone.",
            )
        ) {
            localStorage.removeItem(this.storageKey);
            this.currentRecipeId = null;
            renderHistory();
        }
    },

    exportToJSON() {
        const recipes = this.getRecipes();
        const dataStr = JSON.stringify(recipes, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `chomptron-recipes-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    },

    exportToText() {
        const recipes = this.getRecipes();
        let text = "CHOMPTRON RECIPE COLLECTION\n";
        text += "=".repeat(50) + "\n\n";

        recipes.forEach((r, index) => {
            text += `Recipe #${index + 1}: ${r.recipeName}\n`;
            text += `Date: ${new Date(r.timestamp).toLocaleString()}\n`;
            text += `Ingredients: ${r.ingredients}\n`;
            text += `Favorite: ${r.favorite ? "⭐ Yes" : "No"}\n`;
            text += "-".repeat(50) + "\n";
            text += r.recipe + "\n";
            text += "=".repeat(50) + "\n\n";
        });

        const dataBlob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `chomptron-recipes-${Date.now()}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    },
};

let historyFilter = "all"; // 'all' or 'favorites'
let currentServingMultiplier = 1;
let currentRecipeData = null;

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem("chomptron_theme") || "light";
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        document.querySelector(".theme-toggle").textContent = "☀️";
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    document.querySelector(".theme-toggle").textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("chomptron_theme", isDark ? "dark" : "light");
}

// Initialize theme on load
initTheme();

// Recipe Parsing
function parseRecipe(recipeText) {
    const parsed = {
        name: "",
        servingSize: null,
        prepTime: null,
        cookTime: null,
        totalTime: null,
        ingredients: [],
        instructions: [],
        tips: "",
        raw: recipeText
    };

    const lines = recipeText.split("\n").map(l => l.trim()).filter(l => l);

    let currentSection = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Recipe Name
        if (line.match(/^[*]*Recipe Name[:*]/i) || (!parsed.name && i < 3 && line.length < 100)) {
            parsed.name = line.replace(/^[*]*Recipe Name[:*]\s*/i, "").replace(/\*\*/g, "").trim();
            if (!parsed.name && i < 3) parsed.name = line;
            continue;
        }

        // Serving Size
        const servingMatch = line.match(/Serving Size[:*]\s*(\d+)/i);
        if (servingMatch) {
            parsed.servingSize = parseInt(servingMatch[1]);
            continue;
        }

        // Times
        const prepMatch = line.match(/Prep Time[:*]\s*(\d+)/i);
        if (prepMatch) parsed.prepTime = prepMatch[1];

        const cookMatch = line.match(/Cook Time[:*]\s*(\d+)/i);
        if (cookMatch) parsed.cookTime = cookMatch[1];

        const totalMatch = line.match(/Total Time[:*]\s*(\d+)/i);
        if (totalMatch) parsed.totalTime = totalMatch[1];

        // Ingredients
        if (line.match(/^Ingredients?:/i)) {
            currentSection = "ingredients";
            continue;
        }

        // Instructions
        if (line.match(/^Instructions?:/i) || line.match(/^Steps?:/i)) {
            currentSection = "instructions";
            continue;
        }

        // Tips
        if (line.match(/^Tips?:/i)) {
            currentSection = "tips";
            continue;
        }

        // Collect items
        if (currentSection === "ingredients" && (line.startsWith("-") || line.match(/^\d+\./))) {
            parsed.ingredients.push(line.replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, ""));
        } else if (currentSection === "instructions" && (line.match(/^\d+\./) || line.startsWith("-"))) {
            parsed.instructions.push(line.replace(/^\d+\.\s*/, "").replace(/^[-•]\s*/, ""));
        } else if (currentSection === "tips") {
            parsed.tips += line + " ";
        }
    }

    // Fallback: if no structured parsing worked, try to extract name from first line
    if (!parsed.name && lines.length > 0) {
        parsed.name = lines[0].replace(/\*\*/g, "").trim();
    }

    return parsed;
}

// Recipe Scaling
function adjustServings(delta) {
    currentServingMultiplier = Math.max(0.5, Math.min(4, currentServingMultiplier + delta));
    document.getElementById("servingMultiplier").textContent = currentServingMultiplier + "x";
    updateScaledRecipe();
}

function updateScaledRecipe() {
    if (!currentRecipeData || !currentRecipeData.parsed) return;

    const parsed = currentRecipeData.parsed;
    const multiplier = currentServingMultiplier;

    // Update serving count display
    if (parsed.servingSize) {
        const scaledServings = Math.round(parsed.servingSize * multiplier);
        document.getElementById("servingCount").textContent = `(${scaledServings} servings)`;
    }

    // Scale ingredients
    const scaledIngredients = parsed.ingredients.map(ing => {
        return scaleIngredientText(ing, multiplier);
    });

    // Re-render recipe with scaled ingredients
    displayRecipe(currentRecipeData.recipe, currentRecipeData.parsed, scaledIngredients);
}

// Recipe Rating
function rateRecipe(rating) {
    if (!RecipeManager.currentRecipeId) return;

    RecipeManager.updateRecipe(RecipeManager.currentRecipeId, { rating });

    // Update star display
    const stars = document.querySelectorAll(".recipe-rating .star");
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = "⭐";
            star.classList.add("filled");
        } else {
            star.textContent = "☆";
            star.classList.remove("filled");
        }
    });
}

// Dietary Preferences Dropdown
function toggleDietaryDropdown() {
    const options = document.getElementById("dietaryOptions");
    const toggle = document.querySelector(".dietary-toggle");
    options.classList.toggle("hidden");
    toggle.classList.toggle("open");
}

function updateDietaryCount() {
    const checkboxes = document.querySelectorAll(".dietary-checkboxes input[type='checkbox']");
    const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
    const countEl = document.getElementById("dietaryCount");
    if (checked > 0) {
        countEl.textContent = `(${checked} selected)`;
    } else {
        countEl.textContent = "(Optional)";
    }
}

// Share Recipe
function shareRecipe() {
    if (!currentRecipeData) return;

    const recipe = RecipeManager.getRecipes().find(r => r.id === RecipeManager.currentRecipeId);
    if (!recipe) return;

    // Create shareable URL
    const shareData = {
        name: recipe.recipeName,
        ingredients: recipe.ingredients,
        recipe: recipe.recipe.substring(0, 500) // Limit size
    };

    const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)));
    const shareUrl = `${window.location.origin}${window.location.pathname}?recipe=${encoded}`;

    // Try Web Share API, fallback to clipboard
    if (navigator.share) {
        navigator.share({
            title: recipe.recipeName,
            text: `Check out this recipe: ${recipe.recipeName}`,
            url: shareUrl
        }).then(() => {
            showToast("Recipe shared!");
        }).catch((err) => {
            if (err.name !== 'AbortError') {
                copyToClipboard(shareUrl);
                showToast("Recipe link copied to clipboard!");
            }
        });
    } else {
        copyToClipboard(shareUrl);
        showToast("Recipe link copied to clipboard!");
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(() => {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
    });
}

// Print Recipe
function printRecipe() {
    window.print();
}

// Load recipe from URL
function loadRecipeFromURL() {
    const params = new URLSearchParams(window.location.search);

    // Check for simple ingredients parameter (from tronswan widget)
    const ingredientsParam = params.get("ingredients");
    if (ingredientsParam) {
        document.getElementById("ingredients").value = ingredientsParam;
        document.getElementById("ingredients").focus();
        return;
    }

    // Check for full recipe parameter (from share link)
    const recipeParam = params.get("recipe");
    if (recipeParam) {
        try {
            const recipeData = JSON.parse(decodeURIComponent(atob(recipeParam)));
            document.getElementById("ingredients").value = recipeData.ingredients;
            // Generate recipe with these ingredients
            generateRecipe();
        } catch (e) {
            console.error("Failed to load recipe from URL", e);
        }
    }
}

function toggleHistory() {
    const panel = document.getElementById("historyPanel");
    const backdrop = document.getElementById("historyBackdrop");
    panel.classList.toggle("open");
    backdrop.classList.toggle("show");
    if (panel.classList.contains("open")) {
        renderHistory();
    }
}

function renderHistory(searchQuery = "") {
    const recipes = RecipeManager.getRecipes();
    const historyList = document.getElementById("historyList");

    let filtered = recipes;

    // Apply favorites filter
    if (historyFilter === "favorites") {
        filtered = recipes.filter((r) => r.favorite);
    }

    // Apply search filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
            (r) =>
                r.recipeName.toLowerCase().includes(query) ||
                r.ingredients.toLowerCase().includes(query) ||
                r.recipe.toLowerCase().includes(query),
        );
    }

    if (filtered.length === 0) {
        historyList.innerHTML = `
        <div class="empty-history">
          <p>${historyFilter === "favorites" ? "No favorite recipes yet" : searchQuery ? "No recipes found" : "No recipes yet"}</p>
          <p style="font-size: 0.9em;">Generate recipes to see them here!</p>
        </div>
      `;
        return;
    }

    historyList.innerHTML = filtered
        .map(
            (r) => `
      <div class="recipe-item" onclick="loadRecipe('${r.id}')">
        <div class="recipe-item-header">
          <div class="recipe-name">${r.recipeName}</div>
          <button class="favorite-btn" onclick="event.stopPropagation(); toggleRecipeFavorite('${r.id}')">
            ${r.favorite ? "⭐" : "☆"}
          </button>
        </div>
        <div class="recipe-timestamp">${new Date(r.timestamp).toLocaleString()}</div>
        <div class="recipe-ingredients-preview">${r.ingredients.substring(0, 60)}${r.ingredients.length > 60 ? "..." : ""}</div>
      </div>
    `,
        )
        .join("");
}

function filterHistory() {
    const searchQuery = document.getElementById("historySearch").value;
    renderHistory(searchQuery);
}

function showFavorites() {
    historyFilter = "favorites";
    document.getElementById("historySearch").value = "";
    renderHistory();
}

function showAllHistory() {
    historyFilter = "all";
    document.getElementById("historySearch").value = "";
    renderHistory();
}

function loadRecipe(id) {
    const recipes = RecipeManager.getRecipes();
    const recipe = recipes.find((r) => r.id === id);
    if (recipe) {
        RecipeManager.currentRecipeId = id;
        document.getElementById("ingredients").value = recipe.ingredients;

        // Parse and display recipe
        const parsed = parseRecipe(recipe.recipe);
        currentRecipeData = {
            recipe: recipe.recipe,
            parsed: parsed
        };

        // Reset scaling
        currentServingMultiplier = 1;
        document.getElementById("servingMultiplier").textContent = "1x";

        displayRecipe(recipe.recipe, parsed);
        updateFavoriteButton();
        updateRecipeUI();
        toggleHistory();

        // Scroll to recipe
        document
            .getElementById("recipeOutput")
            .scrollIntoView({ behavior: "smooth" });
    }
}

function toggleRecipeFavorite(id) {
    const isFavorite = RecipeManager.toggleFavorite(id);
    renderHistory(document.getElementById("historySearch").value);
    if (id === RecipeManager.currentRecipeId) {
        updateFavoriteButton();
    }
}

function toggleFavorite() {
    if (RecipeManager.currentRecipeId) {
        const isFavorite = RecipeManager.toggleFavorite(
            RecipeManager.currentRecipeId,
        );
        updateFavoriteButton();
    }
}

function updateFavoriteButton() {
    const btn = document.getElementById("favoriteBtn");
    if (!RecipeManager.currentRecipeId) {
        btn.classList.remove("favorited");
        btn.innerHTML = "☆ Favorite";
        return;
    }

    const recipes = RecipeManager.getRecipes();
    const recipe = recipes.find(
        (r) => r.id === RecipeManager.currentRecipeId,
    );
    if (recipe?.favorite) {
        btn.classList.add("favorited");
        btn.innerHTML = "⭐ Favorited";
    } else {
        btn.classList.remove("favorited");
        btn.innerHTML = "☆ Favorite";
    }
}

function exportRecipes() {
    const recipes = RecipeManager.getRecipes();
    if (recipes.length === 0) {
        alert("No recipes to export!");
        return;
    }

    if (
        confirm(
            "Export as JSON (for backup) or Text (for reading)?\n\nOK = JSON, Cancel = Text",
        )
    ) {
        RecipeManager.exportToJSON();
    } else {
        RecipeManager.exportToText();
    }
}

function clearHistory() {
    RecipeManager.clearAll();
}

// Rate limiting: prevent requests more than once per 2 seconds
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds

async function generateRecipe() {
    const ingredients = document.getElementById("ingredients").value.trim();
    const loadingIndicator = document.getElementById("loadingIndicator");
    const recipeOutput = document.getElementById("recipeOutput");
    const errorMessage = document.getElementById("errorMessage");
    const generateBtn = document.getElementById("generateBtn");

    errorMessage.classList.add("hidden");
    recipeOutput.classList.add("hidden");

    if (!ingredients) {
        showError("Please enter some ingredients!");
        return;
    }

    // Get dietary preferences
    const dietaryPreferences = {
        vegan: document.getElementById("diet-vegan").checked,
        vegetarian: document.getElementById("diet-vegetarian").checked,
        glutenFree: document.getElementById("diet-glutenFree").checked,
        dairyFree: document.getElementById("diet-dairyFree").checked,
        nutFree: document.getElementById("diet-nutFree").checked,
        shellfishFree: document.getElementById("diet-shellfishFree").checked,
        eggFree: document.getElementById("diet-eggFree").checked,
        soyFree: document.getElementById("diet-soyFree").checked,
    };

    // Client-side rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
        showError(`Please wait ${waitTime} second${waitTime > 1 ? 's' : ''} before making another request.`);
        return;
    }
    lastRequestTime = now;

    loadingIndicator.classList.remove("hidden");
    generateBtn.disabled = true;

    try {
        const response = await fetch("/api/generate-recipe", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ingredients: ingredients,
                dietaryPreferences: dietaryPreferences
            }),
        });

        const data = await response.json();

        if (data.success) {
            // Parse recipe
            const parsed = parseRecipe(data.recipe);

            // Save to history
            RecipeManager.saveRecipe(ingredients, data.recipe, dietaryPreferences);

            // Store current recipe data
            currentRecipeData = {
                recipe: data.recipe,
                parsed: parsed
            };

            // Reset scaling
            currentServingMultiplier = 1;
            document.getElementById("servingMultiplier").textContent = "1x";

            // Display recipe
            displayRecipe(data.recipe, parsed);
            updateFavoriteButton();
            updateRecipeUI();
        } else {
            // Handle quota errors with retry countdown
            if (data.quotaExceeded && data.retryAfter) {
                showQuotaError(data.error, data.retryAfter);
                // Update last request time to prevent immediate retry
                lastRequestTime = Date.now() + (data.retryAfter * 1000);
            } else {
                showError(data.error || "Failed to generate recipe");
            }
        }
    } catch (error) {
        showError("Network error: " + error.message);
    } finally {
        loadingIndicator.classList.add("hidden");
        generateBtn.disabled = false;
    }
}

function displayRecipe(recipe, parsed = null, scaledIngredients = null) {
    const recipeContent = document.getElementById("recipeContent");
    const recipeOutput = document.getElementById("recipeOutput");

    // If we have parsed data, display in structured format
    if (parsed && (parsed.ingredients.length > 0 || parsed.instructions.length > 0)) {
        const multiplier = currentServingMultiplier;
        const ingredients = scaledIngredients || parsed.ingredients;

        let html = '';

        // Recipe Name
        if (parsed.name) {
            html += `<div class="recipe-section"><h3>${parsed.name}</h3></div>`;
        }

        // Meta Information
        if (parsed.servingSize || parsed.prepTime || parsed.cookTime || parsed.totalTime) {
            html += '<div class="recipe-meta">';
            if (parsed.servingSize) {
                const servings = Math.round(parsed.servingSize * multiplier);
                html += `<div class="recipe-meta-item"><span class="recipe-meta-label">Servings</span><span class="recipe-meta-value">${servings}</span></div>`;
            }
            if (parsed.prepTime) {
                html += `<div class="recipe-meta-item"><span class="recipe-meta-label">Prep Time</span><span class="recipe-meta-value">${parsed.prepTime} min</span></div>`;
            }
            if (parsed.cookTime) {
                html += `<div class="recipe-meta-item"><span class="recipe-meta-label">Cook Time</span><span class="recipe-meta-value">${parsed.cookTime} min</span></div>`;
            }
            if (parsed.totalTime) {
                html += `<div class="recipe-meta-item"><span class="recipe-meta-label">Total Time</span><span class="recipe-meta-value">${parsed.totalTime} min</span></div>`;
            }
            html += '</div>';
        }

        // Ingredients
        if (ingredients.length > 0) {
            html += '<div class="recipe-section"><h3>Ingredients</h3><ul>';
            ingredients.forEach(ing => {
                html += `<li>${ing.replace(/\*\*/g, "")}</li>`;
            });
            html += '</ul></div>';
        }

        // Instructions
        if (parsed.instructions.length > 0) {
            html += '<div class="recipe-section"><h3>Instructions</h3><ol>';
            parsed.instructions.forEach(step => {
                html += `<li>${step.replace(/\*\*/g, "")}</li>`;
            });
            html += '</ol></div>';
        }

        // Tips
        if (parsed.tips) {
            html += `<div class="recipe-section"><h3>Tips</h3><p>${parsed.tips.trim()}</p></div>`;
        }

        // Fallback: if structured parsing didn't work well, show raw recipe
        if (!parsed.name && ingredients.length === 0 && parsed.instructions.length === 0) {
            const formattedRecipe = recipe
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\n\n/g, "</p><p>")
                .replace(/\n/g, "<br>");
            html = "<p>" + formattedRecipe + "</p>";
        }

        recipeContent.innerHTML = html;
    } else {
        // Fallback to simple formatting
        const formattedRecipe = recipe
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n\n/g, "</p><p>")
            .replace(/\n/g, "<br>");
        recipeContent.innerHTML = "<p>" + formattedRecipe + "</p>";
    }

    recipeOutput.classList.add("hidden");

    // Use setTimeout to ensure the browser registers the removal/addition for animation re-trigger
    setTimeout(() => {
        recipeOutput.classList.remove("hidden");

        // Stagger children entrance
        const children = recipeContent.children;
        for (let i = 0; i < children.length; i++) {
            children[i].style.animationDelay = `${i * 0.1}s`;
            children[i].classList.add("slide-up-item");
        }
    }, 10);
}

function updateRecipeUI() {
    if (!RecipeManager.currentRecipeId) return;

    const recipe = RecipeManager.getRecipes().find(r => r.id === RecipeManager.currentRecipeId);
    if (!recipe) return;

    // Update rating
    if (recipe.rating) {
        rateRecipe(recipe.rating);
    } else {
        // Reset stars
        document.querySelectorAll(".recipe-rating .star").forEach(star => {
            star.textContent = "☆";
            star.classList.remove("filled");
        });
    }

    // Update serving count
    if (recipe.servingSize) {
        const scaledServings = Math.round(recipe.servingSize * currentServingMultiplier);
        document.getElementById("servingCount").textContent = `(${scaledServings} servings)`;
    }
}

function showError(message) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
}

function showQuotaError(message, retryAfter) {
    const errorMessage = document.getElementById("errorMessage");
    let secondsLeft = retryAfter;

    const updateMessage = () => {
        if (secondsLeft > 0) {
            errorMessage.textContent = `${message} Retrying automatically in ${secondsLeft} seconds...`;
            errorMessage.classList.remove("hidden");
            secondsLeft--;
            setTimeout(updateMessage, 1000);
        } else {
            errorMessage.textContent = "You can try again now!";
            errorMessage.classList.remove("hidden");
        }
    };

    updateMessage();
}

function clearRecipe() {
    document.getElementById("recipeOutput").classList.add("hidden");
    document.getElementById("ingredients").value = "";
    document.getElementById("ingredients").focus();
    RecipeManager.currentRecipeId = null;
    currentRecipeData = null;
    currentServingMultiplier = 1;
    document.getElementById("servingMultiplier").textContent = "1x";
    document.getElementById("servingCount").textContent = "";

    // Reset stars
    document.querySelectorAll(".recipe-rating .star").forEach(star => {
        star.textContent = "☆";
        star.classList.remove("filled");
    });

    // Reset dietary checkboxes
    document.querySelectorAll(".dietary-checkboxes input[type='checkbox']").forEach(cb => {
        cb.checked = false;
    });
    updateDietaryCount();

    // Close dietary dropdown if open
    const options = document.getElementById("dietaryOptions");
    const toggle = document.querySelector(".dietary-toggle");
    if (!options.classList.contains("hidden")) {
        options.classList.add("hidden");
        toggle.classList.remove("open");
    }

    updateFavoriteButton();
}

// Load recipe from URL on page load
window.addEventListener("DOMContentLoaded", () => {
    loadRecipeFromURL();
});

function copyRecipe(event) {
    const recipeContent = document.getElementById("recipeContent");
    const textContent = recipeContent.innerText;
    const btn = event.target;
    const originalText = btn.textContent;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
            .writeText(textContent)
            .then(() => {
                btn.textContent = "Copied! ✓";
                showToast("Recipe copied to clipboard!");
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            })
            .catch((err) => {
                console.error("Clipboard error:", err);
                fallbackCopy(textContent, btn, originalText);
            });
    } else {
        fallbackCopy(textContent, btn, originalText);
    }
}

function fallbackCopy(text, btn, originalText) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.setAttribute("readonly", "");
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let success = false;
    try {
        success = document.execCommand("copy");
    } catch (error) {
        console.error("Fallback copy error:", error);
    }

    document.body.removeChild(textarea);

    if (success) {
        btn.textContent = "Copied! ✓";
        showToast("Recipe copied to clipboard!");
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    } else {
        showError("Failed to copy recipe to clipboard");
    }
}

document
    .getElementById("ingredients")
    .addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            generateRecipe();
        }
    });

// Advanced Scaling Helpers
function scaleIngredientText(text, multiplier) {
    if (multiplier === 1) return text;

    // Match numbers, decimals, and fractions
    // Handles: 1, 1.5, 1/2, 1 1/2, .5
    const regex = /(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.\d+|\d+)/g;

    return text.replace(regex, (match) => {
        try {
            const value = parseAmount(match);
            const scaled = value * multiplier;
            return formatAmount(scaled);
        } catch (e) {
            return match;
        }
    });
}

function parseAmount(amountStr) {
    amountStr = amountStr.trim();

    // Mixed number: "1 1/2"
    if (amountStr.includes(' ')) {
        const parts = amountStr.split(/\s+/);
        return parseFloat(parts[0]) + parseFraction(parts[1]);
    }

    // Fraction: "1/2"
    if (amountStr.includes('/')) {
        return parseFraction(amountStr);
    }

    // Decimal or Integer
    return parseFloat(amountStr);
}

function parseFraction(fracStr) {
    const parts = fracStr.split('/');
    return parseFloat(parts[0]) / parseFloat(parts[1]);
}

function formatAmount(value) {
    if (value === 0) return "0";

    // If it's effectively an integer (within small epsilon)
    if (Math.abs(value - Math.round(value)) < 0.01) {
        return Math.round(value).toString();
    }

    // Try common cooking fractions
    const commonFractions = [
        { v: 0.25, f: "1/4" },
        { v: 0.333, f: "1/3" },
        { v: 0.5, f: "1/2" },
        { v: 0.666, f: "2/3" },
        { v: 0.75, f: "3/4" }
    ];

    const whole = Math.floor(value);
    const remainder = value - whole;

    if (remainder < 0.01) return whole.toString();

    for (const frac of commonFractions) {
        if (Math.abs(remainder - frac.v) < 0.05) {
            return (whole > 0 ? whole + " " : "") + frac.f;
        }
    }

    // Fallback to decimal
    return (Math.round(value * 100) / 100).toString();
}

// Toast Notification System
function showToast(message, duration = 3000) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
