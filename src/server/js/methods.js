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

    // delete an account
    async 'pwix.AccountsCore.m.deleteAccount'( instanceName, user, options={} ){
        check( instanceName, Match.NonEmptyString );
        check( user, Match.OneOf( Match.NonEmptyString, Match.ObjectIncludeingKeys({ _id: Match.NonEmptyString })));
        check( options, Object );
        return await AccountsCore.s.deleteAccount( instanceName, user, options );
    },

    // insert a new account - this is a fallback for not-users collections which do not provide a createUser() hook
    async 'pwix.AccountsCore.m.insertAccount'( instanceName, userDoc, options={} ){
        check( instanceName, Match.NonEmptyString );
        check( userDoc, Object );
        check( options, Object );
        return await AccountsCore.s.insertAccount( instanceName, userDoc, options );
    },

    // update an account
    async 'pwix.AccountsCore.m.updateAccount'( instanceName, userDoc, options={} ){
        check( instanceName, Match.NonEmptyString );
        check( userDoc, Object );
        check( options, Object );
        return await AccountsCore.s.updateAccount( instanceName, userDoc, options );
    }
});
