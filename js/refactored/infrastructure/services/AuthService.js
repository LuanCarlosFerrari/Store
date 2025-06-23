/**
 * Authentication Service - Gerencia autenticação com Supabase
 */
export class AuthService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.currentUser = null;
    }

    async signIn(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw new Error(`Erro ao fazer login: ${error.message}`);
        }

        this.currentUser = data.user;
        return data.user;
    }

    async signUp(email, password) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            throw new Error(`Erro ao criar conta: ${error.message}`);
        }

        return data.user;
    }

    async signOut() {
        const { error } = await this.supabase.auth.signOut();

        if (error) {
            throw new Error(`Erro ao fazer logout: ${error.message}`);
        }

        this.currentUser = null;
    }

    async getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        const { data: { user }, error } = await this.supabase.auth.getUser();

        if (error) {
            throw new Error(`Erro ao obter usuário atual: ${error.message}`);
        }

        this.currentUser = user;
        return user;
    }

    async isAuthenticated() {
        try {
            const user = await this.getCurrentUser();
            return !!user;
        } catch {
            return false;
        }
    }

    onAuthStateChange(callback) {
        return this.supabase.auth.onAuthStateChange((event, session) => {
            this.currentUser = session?.user || null;
            callback(event, session);
        });
    }
}
