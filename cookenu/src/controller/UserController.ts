import { Request, Response } from "express";
import { UserDatabase } from "../database/UserDatabase";
import { User, USER_ROLES } from "../models/User";
import { Authenticator, ITokenPayload } from "../services/Authenticator";
import { HashManager } from "../services/HashManager";
import { IdGenerator } from "../services/IdGenerator";

export class UserController {

    /* ## Endpoint 1) Cadastro de usuário
    Desenvolva uma requisição de cadastro de novo usuário “NORMAL” que retorna ao final um
    token de acesso ao sistema.

    Validações e Regras de Negócio do endpoint (baixa prioridade, implemente se der tempo):
    - nickname, email e password devem ser fornecidos e serem do tipo string.
    - nickname deve possuir ao menos 3 caracteres, enquanto password ao menos 6 caracteres.
    - email deve ter um formato válido e único, não podendo repetir no banco de dados. */

    public signup = async (req: Request, res: Response) => {
        let errorCode = 400
        try {
            const nickname = req.body.nickname
            const email = req.body.email
            const password = req.body.password

            if (!nickname || !email || !password) {
                throw new Error("Parâmetros faltando")
            }

            if (typeof nickname !== "string") {
                throw new Error("Parâmetro 'nickname' deve ser uma string")
            }

            if (typeof email !== "string") {
                throw new Error("Parâmetro 'email' deve ser uma string")
            }

            if (typeof password !== "string") {
                throw new Error("Parâmetro 'password' deve ser uma string")
            }

            if (nickname.length < 3) {
                throw new Error("O parâmetro 'nickname' deve possuir ao menos 3 caracteres")
            }

            if (password.length < 6) {
                throw new Error("O parâmetro 'password' deve possuir ao menos 6 caracteres")
            }

            if (!email.includes("@") || !email.includes(".com")) {
                throw new Error("O parâmetro 'password' deve possuir ao menos 6 caracteres")
            }

            const idGenerator = new IdGenerator()
            const id = idGenerator.generate()

            const hashManager = new HashManager()
            const hashPassword = await hashManager.hash(password)

            const user = new User(
                id,
                nickname,
                email,
                hashPassword,
                USER_ROLES.NORMAL
            )

            const userDatabase = new UserDatabase()
            await userDatabase.createUser(user)

            const payload: ITokenPayload = {
                id: user.getId(),
                role: user.getRole()
            }

            const authenticator = new Authenticator()
            const token = authenticator.generateToken(payload)

            res.status(201).send({
                message: "Cadastro realizado com sucesso",
                token
            })
        } catch (error) {
            res.status(errorCode).send({ message: error.message })
        }
    }

    /* ## Endpoint 2) Login
    Desenvolva uma requisição de acesso de usuários já cadastrados ao sistema.
    Ao final, um token de acesso deve ser retornado.

    Validações e Regras de Negócio do endpoint (baixa prioridade, implemente se der tempo):
    - email e password devem ser fornecidos e serem do tipo string.
    - password deve possuir ao menos 6 caracteres.
    - email deve ter um formato válido.
    - O usuário com o e-mail fornecido deve existir no sistema.
    - A senha recebida hasheada deve ser igual ao hash guardado no banco de dados */

    public login = async (req: Request, res: Response) => {
        let errorCode = 400
        try {
            const email = req.body.email
            const password = req.body.password

            if (!email || !password) {
                errorCode = 401
                throw new Error("Email ou senha faltando")
            }

            if (typeof email !== "string") {
                throw new Error("Parâmetro 'email' deve ser uma string")
            }

            if (typeof password !== "string") {
                throw new Error("Parâmetro 'password' deve ser uma string")
            }

            if (password.length < 6) {
                throw new Error("O parâmetro 'password' deve possuir ao menos 6 caracteres")
            }

            if (!email.includes("@") || !email.includes(".com")) {
                throw new Error("O parâmetro 'password' deve possuir ao menos 6 caracteres")
            }

            const userDatabase = new UserDatabase()
            const userDB = await userDatabase.findByEmail(email)

            if (!userDB) {
                errorCode = 401
                throw new Error("Email não cadastrado")
            }

            const user = new User(
                userDB.id,
                userDB.nickname,
                userDB.email,
                userDB.password,
                userDB.role
            )

            const hashManager = new HashManager()
            const isPasswordCorrect = await hashManager.compare(
                password,
                user.getPassword()
            )

            if (!isPasswordCorrect) {
                errorCode = 401
                throw new Error("Senha inválida")
            }

            const payload: ITokenPayload = {
                id: user.getId(),
                role: user.getRole()
            }

            const authenticator = new Authenticator()
            const token = authenticator.generateToken(payload)

            res.status(200).send({
                message: "Login realizado com sucesso",
                token
            })
        } catch (error) {
            res.status(errorCode).send({ message: error.message })
        }
    }

    /* ## Endpoint 7) Deletar usuário
    Desenvolva uma requisição que permite a deleção de um usuário existente no sistema
    pelo seu id. Somente usuários do tipo “ADMIN” poderão consumir este recurso.

    Validações e Regras de Negócio do endpoint (baixa prioridade, implemente se der tempo):
    - id do usuário a ser deletado deve existir no sistema.
    - O usuário logado não poderá remover a si mesmo.

    Observação: antes de deletar o usuário, todas suas receitas devem ser deletadas para
    não dar erro de relações! */

    public deleteUser = async (req: Request, res: Response) => {
    let errorCode = 400
    try {
        const token = req.headers.authorization
        const id = req.params.id

        const authenticator = new Authenticator()
        const payload = authenticator.getTokenPayload(token)

        if (!payload) {
            errorCode = 401
            throw new Error("Token faltando ou inválido")
        }

        if (payload.role !== USER_ROLES.ADMIN) {
            errorCode = 403
            throw new Error("Somente admins podem acessar esse endpoint")
        }

        const userDatabase = new UserDatabase()
        const isUserExists = await userDatabase.checkIfExistsById(payload.id)

        if (!isUserExists) {
            errorCode = 401
            throw new Error("Token inválido")
        }

        if (id === payload.id) {
            throw new Error("Não é possível deletar a própria conta")
        }

        await userDatabase.deleteUser(id)

        res.status(200).send({
            message: "User deletado com sucesso"
        })
    } catch (error) {
        res.status(errorCode).send({ message: error.message })
    }
}
}