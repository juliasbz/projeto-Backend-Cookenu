import { Router } from 'express'
import { RecipeController } from '../controller/RecipeController'

export const recipeRouter = Router()

const recipeController = new RecipeController()

recipeRouter.get("/recipes", recipeController.getAllRecipes)
recipeRouter.post("/createrecipe", recipeController.postRecipe)
recipeRouter.put("/recipes/:id", recipeController.editRecipe)
recipeRouter.delete("/recipes/:id", recipeController.deleteRecipe)