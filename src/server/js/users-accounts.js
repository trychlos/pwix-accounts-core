/*
 * pwix:accounts-hub/src/server/js/users-accounts.js
 *
 * Server-only functions.
 * Only honors standard Meteor.users collection
 */

import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';

_fns = [];

// Server-side: this is a pre-create user on Meteor.users standard collection, though a temmporary _id is defined
const _onCreateUser = function( opts, user ){
    //console.log( 'AccountsHub.onCreateUser: opts=%o, user=%o', opts, user );
    // make sure each email has its own identifier (required by Blaze)
    ( user.emails || [] ).forEach(( it ) => {
        if( !it._id ){
            it._id = Random.id();
        }
    });
    // pwi 2024-10-11 have a default true loginAllowed to let iziam identities connect to application
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

AccountsHub.onCreateUser = function( f ){
    check( f, Function );
    _fns.push( f );
};

AccountsHub.onCreateUser( _onCreateUser );

// track the account creation
Accounts.validateNewUser(( user ) => {
    console.log( 'Accounts.validateNewUser: user=%o', user );
    // Return true to allow user creation to proceed
    return true;
});

/*
// Server-side: validating the new user creation in Accounts collection
Accounts.validateNewUser(( user ) => {
    console.log( 'Accounts.validateNewUser: user=%o', user );
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
    //console.log( o );
    if( !o.allowed ){
        return false;
    }
    return ( o && o.user ) ? o.user.loginAllowed : true;
});
