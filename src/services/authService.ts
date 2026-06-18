import { supabase, supabaseAdmin } from '../supabaseClient';

export const authService = {
  async register(email: string, password: string) {
    if (!supabase) throw new Error('Supabase non configuré')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async login(email: string, password: string) {
    if (!supabase) throw new Error('Supabase non configuré')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async deleteAccount(userId: string) {
    if (!supabaseAdmin) {
      throw new Error('Le client admin Supabase n\'est pas configuré (clé Service Role manquante)');
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
    return { message: 'Utilisateur supprimé avec succès' };
  },

  async logout() {
    if (!supabase) throw new Error('Supabase non configuré')
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { message: 'Déconnexion réussie' };
  }
};
