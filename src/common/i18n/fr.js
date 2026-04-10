/*
 * pwix:accounts-core/src/common/i18n/fr.js
 */

AccountsCore.i18n = {
    ...AccountsCore.i18n,
    ...{
        fr: {
            checks: {
                email_empty: 'L\'adresse de messagerie n\'est pas renseignée',
                email_exists: 'L\'adresse de messagerie existe déjà',
                email_invalid: 'L\'adresse de messagerie est invalide',
                password_empty: 'Le mot de passe n\'est pas renseigné',
                password_short: 'Le mot de passe est trop court (mini=%s)',
                password_weak: 'Le mot de passe est trop faible (score=%s, mini=%s)',
                username_empty: 'Le nom d\'utilisateur n\'est pas renseigné',
                username_exists: 'Le nom d\'utilisateur existe déjà',
                username_short: 'Le nom d\'utilisateur est trop court (mini=%s)'
            },
            permissions: {
                create_error: 'Impossible de créer le nouveau compte',
                create_not_allowed: 'Vous n\'êtes pas autorisé à créer un nouveau compte dans la collection',
                delete_not_allowed: 'Vous n\'êtes pas autorisé à supprimer un compte de la collection',
                update_not_allowed: 'Vous n\'êtes pas autorisé à modifier les comptes dans la collection'
            }
        }
    }
};
