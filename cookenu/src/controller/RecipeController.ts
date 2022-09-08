import { Request, Response } from "express";
import { RecipeDatabase } from "../database/RecipeDatabase";
import { Recipe } from "../models/Recipe";
import { USER_ROLES } from "../models/User";
import { Authenticator } from "../services/Authenticator";
import { IdGenerator } from "../services/IdGenerator";

    /* ## Endpoint 6) Busca de receita
    Desenvolva uma requisição que permite um usuário logado no sistema buscar a lista de receitas. 

    Validações e Regras de Negócio do endpoint (baixa prioridade, implemente se der tempo):
    - token deve existir e representar um usuário válido
    - busca pelo nome, caso não exista o parâmetro de busca é retornada a lista com todas receitas
    - ordenação por data de atualização junto com paginação */

export class RecipeController {
    public getAllRecipes = async (req: Request, res: Response) => {
        let errorCode = 400
        try {
            const token = req.headers.authorization

            if (!token) {
                errorCode = 401
                throw new Error("Token faltando")
            }

            const authenticator = new Authenticator()
            const payload = authenticator.getTokenPayload(token)

            if (!payload) {
                errorCode = 401
                throw new Error("Token inválido")
            }

            const recipeDatabase = new RecipeDatabase()
            const recipesDB = await recipeDatabase.getAllRecipes()

            const recipes = recipesDB.map((recipeDB) => {
                return new Recipe(
                    recipeDB.id,
                    recipeDB.title,
                    recipeDB.description,
                    recipeDB.created_at,
                    recipeDB.updated_at,
                    recipeDB.creator_id
                )
            })

            res.status(200).send({ recipes })
        } catch (error) {
            res.status(errorCode).send({ message: error.message })
        }
    }

    /* ## Endpoint 3) Cadastro de nova receita
    Desenvolva uma requisição que permite um usuário logado no sistema criar uma nova
    receita. A receita criada deve ser retornada ao final da operação

    Validações e Regras de Negócio do endpoint (baixa prioridade, implemente se der tempo):
    - token deve existir e representar um usuário válido.
    - title e description devem ser fornecidos e serem do tipo string.
    - title deve possuir ao menos 3 caracteres, enquanto description ao menos 10 caracteres. */

    public postRecipe = async (req: Request, res: Response) => {
        let errorCode = 400
        try {
            const token = req.headers.authorization
            const { title, description } = req.body

            if (!token) {
                errorCode = 401
                throw new Error("Token faltando")
            }

            const authenticator = new Authenticator()
            const payload = authenticator.getTokenPayload(token)

            if (!payload) {
                errorCode = 401
                throw new Error("Token inválido")
            }

            if (!title || !description) {
                throw new Error("Parâmetros faltando")
            }

            if (typeof title !== "string") {
                throw new Error("Parâmetro 'title' deve ser uma string")
            }

            if (typeof description !== "string") {
                throw new Error("Parâmetro 'description' deve ser uma string")
            }

            if (title.length < 3) {
                throw new Error("O parâmetro 'title' deve possuir ao menos 3 caracteres")
            }

            if (description.length < 10) {
                throw new Error("O parâmetro 'description' deve possuir ao menos 10 caracteres")
            }

            const idGenerator = new IdGenerator()
            const id = idGenerator.generate()

            const recipe = new Recipe(
                id,
                title,
                description,
                new Date(),
                new Date(),
                payload.id
            )

            const recipeDatabase = new RecipeDatabase()
            await recipeDatabase.postRecipe(recipe)

            res.status(201).send({
                message: "Receita adicionada com sucesso!",
                token
            })
        } catch (error) {
            res.status(errorCode).send({ message: error.message })
        }
    }

    /* ## Endpoint 4) Editar receita
    Desenvolva uma requisição que permite um usuário logado no sistema alterar o título
    e/ou a descrição de uma receita existente. Usuários do tipo “NORMAL” só poderão alterar
    as receitas que foram criados por eles mesmo, enquanto usuários do tipo “ADMIN” podem
    alterarqualquer receita do sistema. A receita alterada deve ser retornada ao final da
    operação com a updatedAt atualizada.

    Validações e Regras de Negócio do endpoint (baixa prioridade, implemente se der tempo):
    - token deve existir e representar um usuário válido.
    - title e description devem ser fornecidos e serem do tipo string.
    - title deve possuir ao menos 3 caracteres, enquanto description ao menos 10 caracteres.
    - A receita a ser modificada deve existir no sistema.
    - role do usuário deve restringir o tipo de alteração permitida. */

    public editRecipe = async (req: Request, res: Response) => {
        let errorCode = 400
        try {
            const token = req.headers.authorization
            const id = req.params.id
            const { title, description } = req.body

            if (!token) {
                errorCode = 401
                throw new Error("Token faltando")
            }

            const authenticator = new Authenticator()
            const payload = authenticator.getTokenPayload(token)

            if (!payload) {
                errorCode = 401
                throw new Error("Token inválido")
            }

            if (!title || !description) {
                throw new Error("Parâmetros faltando")
            }

            if (typeof title !== "string") {
                throw new Error("Parâmetro 'title' deve ser uma string")
            }

            if (typeof description !== "string") {
                throw new Error("Parâmetro 'description' deve ser uma string")
            }

            if (title.length < 3) {
                throw new Error("O parâmetro 'title' deve possuir ao menos 3 caracteres")
            }

            if (description.length < 10) {
                throw new Error("O parâmetro 'description' deve possuir ao menos 10 caracteres")
            }

            const recipeDatabase = new RecipeDatabase()
            const receitaDB = await recipeDatabase.findById(id)

            if (!receitaDB) {
                errorCode = 401
                throw new Error("Id inválido")
            }

            if (payload.role === USER_ROLES.NORMAL) {
                if (payload.id !== id) {
                    errorCode = 403
                    throw new Error("Somente admins podem alterar outras receitas além da prória")
                }
            }

            const recipe = new Recipe(
                receitaDB.id,
                receitaDB.title,
                receitaDB.description,
                receitaDB.created_at,
                receitaDB.updated_at = new Date(),
                receitaDB.creator_id
            )

            title && recipe.setTitle(title)
            description && recipe.setDescription(description)

            await recipeDatabase.editRecipe(recipe)

            res.status(201).send({
                message: "Edição realizada com sucesso",
                recipe
            })
        } catch (error) {
            res.status(errorCode).send({ message: error.message })
        }
    }


    /* ## Endpoint 5) Deletar receita
    Desenvolva uma requisição que permite um usuário logado no sistema remover uma
    receita pela sua id. Usuários do tipo “NORMAL” só poderão remover as receitas que
    foram criados por eles mesmo, enquanto usuários do tipo “ADMIN” podem remover qualquer
    receita do sistema. 

    Validações e Regras de Negócio do endpoint (baixa prioridade, implemente se der tempo):
    - token deve existir e representar um usuário válido.
    - A receita a ser removida deve existir no sistema.
    - role do usuário deve restringir o tipo de alteração permitida. */

    public deleteRecipe = async (req: Request, res: Response) => {
        let errorCode = 400
        try {
            const token = req.headers.authorization
            const id = req.params.id
    
            if (!token) {
                errorCode = 401
                throw new Error("Token faltando")
            }

            const authenticator = new Authenticator()
            const payload = authenticator.getTokenPayload(token)

            if (!payload) {
                errorCode = 401
                throw new Error("Token inválido")
            }
    
            if (payload.role !== USER_ROLES.ADMIN) {
                errorCode = 403
                throw new Error("Somente admins podem acessar esse endpoint")
            }
    
            const recipeDatabase = new RecipeDatabase()
            const receitaDB = await recipeDatabase.findById(id)
    
            if (!receitaDB) {
                errorCode = 401
                throw new Error("Id inválido")
            }
    
            await recipeDatabase.deleteRecipe(id)
    
            res.status(200).send({
                message: "Receita deletada com sucesso"
            })
        } catch (error) {
            res.status(errorCode).send({ message: error.message })
        }
    }
}