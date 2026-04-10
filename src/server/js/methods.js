/*
 * pwix:accounts-core/src/server/js/methods.js
 */

import _ from 'lodash';

import { check, Match } from 'meteor/check';
import { Logger } from 'meteor/pwix:logger';

const logger = Logger.get();

Meteor.methods({
    // find a user by one of his/her known identifiers
    async 'pwix.AccountsCore.m.byAnyIdentifier'( instanceName, identifier, options={} ){
        check( instanceName, Match.NonEmptyString );
        check( identifier, Match.OneOf( Match.NonEmptyString, Object ));
        check( options, Object );
        return await AccountsCore.s.byAnyIdentifier( instanceName, identifier, options );
    },

    // find a user by one of his/her email addresses
    async 'pwix.AccountsCore.m.byEmailAddress'( instanceName, email, options={} ){
        check( instanceName, Match.NonEmptyString );
        check( email, Match.NonEmptyString );
        check( options, Object );
        return await AccountsCore.s.byEmailAddress( instanceName, email, options );
    },

    // find a user by query
    async 'pwix.AccountsCore.m.byQuery'( instanceName, query, options={} ){
        check( instanceName, Match.NonEmptyString );
        check( query, Object );
        check( options, Object );
        return await AccountsCore.s.byQuery( instanceName, query, options );
    },

    // find a user by his/her username
    async 'pwix.AccountsCore.m.byUsername'( instanceName, username, options={} ){
        check( instanceName, Match.NonEmptyString );
        check( username, Match.NonEmptyString );
        check( options, Object );
        return await AccountsCore.s.byUsername( instanceName, username, options );
    },

    // insert a new account - this is a fallback for not-users collections which do not provide a createAccount() hook
    async 'pwix.AccountsCore.m.createAccount'( instanceName, userDoc, requesterId ){
        check( instanceName, Match.NonEmptyString );
        check( userDoc, Object );
        check( requesterId, Match.NonEmptyStringject );
        try {
            return await AccountsCore.s.createAccount( instanceName, userDoc, requesterId );
        } catch( e ){
            logger.error( e );
            return { reason: e.error };
        }
    },

    // insert a new account in the 'users' collection
    //  a special method to be sure the account is created on server side, thus do not auto connect
    async 'pwix.AccountsCore.m.createUserAsync'( createOpts ){
        return await Accounts.createUserAsync( createOpts );
    },

    // delete an account
    async 'pwix.AccountsCore.m.deleteAccount'( instanceName, user, requesterId ){
        check( instanceName, Match.NonEmptyString );
        check( user, Match.OneOf( Match.NonEmptyString, Match.ObjectIncluding({ _id: Match.NonEmptyString })));
        check( requesterId, Match.NonEmptyString );
        try {
            return await AccountsCore.s.deleteAccount( instanceName, user, requesterId );
        } catch( e ){
            logger.error( e );
            return { reason: e.error };
        }
    },

    // update an account
    async 'pwix.AccountsCore.m.updateAccount'( instanceName, userDoc, requesterId, opts={} ){
        check( instanceName, Match.NonEmptyString );
        check( userDoc, Object );
        check( requesterId, Match.NonEmptyString );
        check( opts, Object );
        return await AccountsCore.s.updateAccount( instanceName, userDoc, requesterId, opts );
    }
});
