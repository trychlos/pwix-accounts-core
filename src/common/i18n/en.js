/*
 * pwix:accounts-core/src/common/i18n/en.js
 */

AccountsCore.i18n = {
    ...AccountsCore.i18n,
    ...{
        en: {
            checks: {
                email_empty: 'Email address is not set',
                email_exists: 'Email address is already in use',
                email_invalid: 'Email address is invalid',
                password_empty: 'Password is not set',
                password_short: 'Password is too short (min is %s)',
                password_weak: 'Password is too weak (score is %s, min is %s)',
                username_empty: 'Username is not set',
                username_exists: 'Username is already in use',
                username_short: 'Username is too short (min is %s)'
            },
            dialogs: {
                accounts_select_dialog_title: 'Select one or more user accounts',
                accounts_select_ph: 'Select the desired accounts'
            },
            permissions: {
                create_error: 'Unable to create the new account',
                create_not_allowed: 'You are not allowed to create a new account in the collection',
                delete_not_allowed: 'You are not allowed to remove an account from the collection',
                update_not_allowed: 'You are not allowed to update accounts in the collection'
            }
        }
    }
};
