/*
 * pwix:accounts-core/src/server/js/users_accounts.js
 *
 * Server-only functions.
 * Honors standard Meteor.users collection methods (and only for 'users' collection).
 * 
 * AccountsCommon:
 *  actions
 *      createUser
 *      createUserVerifyingEmail
 *      sendResetPasswordEmail
 *      sendEnrollmentEmail
 *      sendVerificationEmail
 *  hooks
 *      onResetPasswordLink
 *      onEnrollmentLink
 *      onEmailVerificationLink
 *      onLogin
 *          register a callback to be called when the user has successfully logged in
 *          can have several
 *      onLoginFailure
 *          register a callback to be called when a login attempt has failed
 *          can have several
 *      onLogout
 *          register a callback to be called when a user has logged out
 *          can have several
 * 
 * AccountsServer:
 *  actions
 *  hooks
 *      validateNewUser
 *          register a callback to be called before a user account is created - can check but not modify
 *          can have several
 *      onCreateUser
 *          register a callback to be called before a user account is created - can modify or even rewrite a document, but not refuse it
 *          only one
 *      validateLoginAttempt
 *          register a callback to be called when a user tries to log in - can refuse the login
 *          can have several
 *      beforeExternalLogin
 *          register a callback to be called whenever login or user creation from external service is attempted - can refuse but not modify the document
 *          only one
 *      setAdditionalFindUserOnExternalLogin
 *          register a callback to be called whenever a user is logged in via oauth and a user is not found with the service id - can refuse
 *          only one
 */

import { Accounts } from 'meteor/accounts-base';
import { Logger } from 'meteor/pwix:logger';
import { Random } from 'meteor/random';

const logger = Logger.get();
_fns = [];

// Server-side: this is a pre-create user on Meteor.users standard collection, though a temmporary _id is defined
const _onCreateUser = function( opts, user ){
    //logger.log( 'AccountsCore.onCreateUser: opts=%o, user=%o', opts, user );
    // make sure each email has its own identifier (required by Blaze)
    ( user.emails || [] ).forEach(( it ) => {
        if( !it._id ){
            it._id = Random.id();
        }
    });
    // pwi 2024-10-11 have a default true loginAllowed to let testAccounts identities connect to application
    // we expect that identities which are not permitted are refused by their (missing) memberships
    // that this helps for tests at least
    user.loginAllowed = true;
    return user;
};

// Server-side: this is a pre-create user on Meteor.users standard collection, though an _id is already defined
// NB: this function can only be called once
Accounts.onCreateUser(( opts, user ) => {
    let custom = user;
    _fns.forEach(( fn ) => {
        custom = fn( opts, custom );
    });
    return custom;
});

AccountsCore.onCreateUser = function( f ){
    check( f, Function );
    _fns.push( f );
};

AccountsCore.onCreateUser( _onCreateUser );

// track the account creation
Accounts.validateNewUser(( user ) => {
    logger.log( 'Accounts.validateNewUser: user=%o', user );
    // Return true to allow user creation to proceed
    return true;
});

/*
// Server-side: validating the new user creation in Accounts collection
Accounts.validateNewUser(( user ) => {
    logger.log( 'Accounts.validateNewUser: user=%o', user );
    new SimpleSchema({
        _id: { type: String },
        username: { type: String, optional: true },
        emails: { type: Array },
        'emails.$': { type: Object },
        'emails.$.address': { type: String },
        'emails.$.verified': { type: Boolean },
        createdAt: { type: Date },
        createdBy: { type: String },
        updatedAt: { type: Date, optional: true },
        updatedBy: { type: String, optional: true },
        services: { type: Object, blackbox: true },
        lastConnection: { type: Date, optional: true },
        isAllowed: { type: Boolean },
        apiAllowed: { type: Boolean, defaultValue: false },
        notes: { type: String, optional: true }
    }).validate( user );

    // Return true to allow user creation to proceed
    return true;
});
*/

// https://docs.meteor.com/api/accounts-multi.html#AccountsServer-validateLoginAttempt
// https://v3-docs.meteor.com/api/accounts.html#AccountsServer-validateLoginAttempt
// @locus Meteor.users collection
Accounts.validateLoginAttempt(( o ) => {
    //logger.debug( o );
    if( !o.allowed ){
        return false;
    }
    return ( o && o.user ) ? o.user.loginAllowed : true;
});
