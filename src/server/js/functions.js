/*
 * pwix:accounts-core/src/server/js/functions.js
 */

import _ from 'lodash';

import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';
import { Logger } from 'meteor/pwix:logger';
import { Mongo } from 'meteor/mongo';

import { acOptions } from '../../common/classes/ac-options.class.js';

const logger = Logger.get();

AccountsCore.s = {

    // shamelessly copied from https://github.com/meteor/meteor/blob/devel/packages/accounts-base/accounts_server.js#L1895
    // Generates permutations of all case variations of a given string.
    _generateCasePermutationsForString( string ){
        let permutations = [''];
        for (let i = 0; i < string.length; i++) {
            const ch = string.charAt(i);
            permutations = [].concat(...(permutations.map(prefix => {
            const lowerCaseChar = ch.toLowerCase();
            const upperCaseChar = ch.toUpperCase();
            // Don't add unnecessary permutations when ch is not a letter
            if (lowerCaseChar === upperCaseChar) {
                return [prefix + ch];
            } else {
                return [prefix + lowerCaseChar, prefix + upperCaseChar];
            }
            })));
        }
        return permutations;
    },

    // shamelessly copied from https://github.com/meteor/meteor/blob/devel/packages/accounts-base/accounts_server.js#L303
    // Generates a MongoDB selector that can be used to perform a fast case
    // insensitive lookup for the given fieldName and string. Since MongoDB does
    // not support case insensitive indexes, and case insensitive regex queries
    // are slow, we construct a set of prefix selectors for all permutations of
    // the first 4 characters ourselves. We first attempt to matching against
    // these, and because 'prefix expression' regex queries do use indexes (see
    // http://docs.mongodb.org/v2.6/reference/operator/query/regex/#index-use),
    // this has been found to greatly improve performance (from 1200ms to 5ms in a
    // test with 1.000.000 users).
    _selectorForFastCaseInsensitiveLookup(fieldName, string){
        // Performance seems to improve up to 4 prefix characters
        const prefix = string.substring(0, Math.min(string.length, 4));
        const orClause = this._generateCasePermutationsForString(prefix).map(
        prefixPermutation => {
            const selector = {};
            selector[fieldName] =
                new RegExp(`^${Meteor._escapeRegExp(prefixPermutation)}`);
            return selector;
        });
        const caseInsensitiveClause = {};
        caseInsensitiveClause[fieldName] =
            new RegExp(`^${Meteor._escapeRegExp(string)}$`, 'i')
        return {$and: [{$or: orClause}, caseInsensitiveClause]};
    },

    /*
     * @param {String|AccountsCore.acAccount} instance
     * @param {Object} a user document
     * @param {Object} options
     * @returns {Promise} which eventually resolves to the transformed user document
     */
    async applyReadTransforms( acInstance, userDoc, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'applyReadTransforms()', arguments );
        check( acInstance, AccountsCore.acAccount );
        //logger.debug( 'applyReadTransforms()', acInstance._transforms );
        if( userDoc ){
            const transforms = acInstance.transformsRead();
            for( const fn of transforms ){
                userDoc = await fn( acInstance, userDoc, options );
            }
        }
        return userDoc;
    },

    /*
     * @param {String|AccountsCore.acAccount} instance
     * @param {String} a user identifier
     * @param {Object} options an optional Mongo options object
     * @returns {Promise} which eventually resolves to the user document
     */
    async byAnyIdentifier( instance, identifier, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'byAnyIdentifier()', arguments );
        return await AccountsCore.s.byId( instance, identifier, options )
            || await AccountsCore.s.byEmailAddress( instance, identifier, options )
            || await AccountsCore.s.byUsername( instance, identifier, options );
    },

    /*
     * @param {String|AccountsCore.acAccount} instance
     * @param {String} email the searched email address
     * @param {Object} options an optional dictionary of fields to return or exclude
     * @returns {Promise} which eventually resolves to the (unique) cleaned-up user document, or null
     *
     *  As a reminder, see https://v3-docs.meteor.com/api/accounts.html#Meteor-users
     *                 and https://v3-docs.meteor.com/api/accounts.html#passwords
     *                 and https://v3-docs.meteor.com/api/accounts.html#Accounts-findUserByEmail
     * 
     *  Each email address can only belong to one user
     *  In other words, an email address can be considered as a user identiier in Meteor ecosystems
     */
    async byEmailAddress( instance, email, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'byEmailAddress()', arguments );
        check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.acAccount ));
        check( email, Match.NonEmptyString );
        check( options, Object );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.acAccount );
        }
        let userDoc = null;
        if( acInstance.opts().collection() === 'users' ){
            userDoc = await Accounts.findUserByEmail( email, options );
        } else {
            userDoc = await AccountsCore.s.byQuery({ 'emails.address': email }, options );
        }
        userDoc = AccountsCore.s.applyReadTransforms( acInstance, userDoc );
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.SERVER }, 'byEmailAddress( \''+email+'\' ):', userDoc );
        return userDoc;
    },

    /*
     * @param {String|AccountsCore.acAccount} instance
     * @param {String} id the user identifier
     * @returns {Promise} which eventually resolves to the (unique) cleaned-up user document, or null
     */
    async byId( instance, id, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'byId()', arguments );
        check( id, String );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.acAccount );
        }
        let userDoc = await AccountsCore.s.byQuery( acInstance, { _id: id }, options );
        userDoc = AccountsCore.s.applyReadTransforms( acInstance, userDoc );
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.SERVER }, 'byUsername('+username+')', userDoc );
        return userDoc;
    },

    /*
     * @param {String|AccountsCore.acAccount} instance
     * @param {Object} query the MongoDB selector
     * @returns {Promise} which eventually resolves to the (unique) cleaned-up user document, or null
     */
    async byQuery( instance, query, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'byQuery()', arguments );
        check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.acAccount ));
        check( query, Object );
        check( options, Object );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.acAccount );
        }
        const collection = acInstance.collection();
        check( collection, Mongo.Collection );
        let userDoc = await collection.findOneAsync( query, options );
        // If user is not found, try a case insensitive lookup
        // shamelessly copied from https://github.com/meteor/meteor/blob/devel/packages/accounts-base/accounts_server.js
        if( !userDoc ){
            selector = this._selectorForFastCaseInsensitiveLookup( Object.keys( query )[0], Object.values( query )[0] );
            const candidates = await collection.find( selector, { ...options, limit: 2 }).fetchAsync();
            // No match if multiple candidates are found
            if( candidates.length === 1 ){
                userDoc = candidates[0];
            }
        }
        userDoc = AccountsCore.s.applyReadTransforms( acInstance, userDoc );
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.SERVER }, 'byQuery(', query, ')', userDoc );
        return userDoc;
    },

    /*
     * @param {String|AccountsCore.acAccount} instance
     * @param {String} username the searched username
     * @param {Object} options an optional dictionary of fields to return or exclude
     * @returns {Promise} which eventually resolves to the (unique) cleaned-up user document, or null
     *
     *  As a reminder, see https://v3-docs.meteor.com/api/accounts.html#Accounts-findUserByUsername
     *  Each username can only belong to one user
     *  In other words, a username can be considered as a user identiier in Meteor ecosystems
     * 
     * The default 'users' collection accepts an optional 'username'.
     * But pwix:accounts-core package, and later the pwix:accounts-manager package, extend this schema by defining cardinalities.
     * Nonetheless, username is always expected to be a unique identifier.
     */
    async byUsername( instance, username, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'byUsername()', arguments );
        check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.acAccount ));
        check( username, Match.NonEmptyString );
        check( options, Object );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.acAccount );
        }
        let userDoc = null;
        if( acInstance.opts().collection() === 'users' ){
            userDoc = await Accounts.findUserByUsername( username, options );
        } else {
            userDoc = await AccountsCore.s.byQuery({ username }, options ) || await AccountsCore.s.byQuery({ 'usernames.username': username });
        }
        userDoc = AccountsCore.s.applyReadTransforms( acInstance, userDoc );
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.SERVER }, 'byUsername( \''+username+'\' )', userDoc );
        return userDoc;
    },

    /*
     * @param {String|AccountsCore.acAccount} instance
     * @param {Object|String} user either the user document or the user identifier to be deleted
     * @param {Object} options
     * @returns {Promise} which eventually resolves to a truethy/falsy value
     */
    async deleteAccount( instance, user, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'deleteAccount()', arguments );
        check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.acAccount ));
        check( user, Match.OneOf( String, Object ));
        check( options, Object );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.acAccount );
        }
        let res;
        try {
            // preDelete server hook
            let fn = acInstance.opts().hooksServer_preDeleteFn();
            if( fn ){
                await fn( user, options );
            }
            const id = _.isString( user ) ? user : user._id;
            if( !id ){
                logger.error( 'deleteAccount() unable to get the user identfier, got', user );
                return false;
            }
            // successful insertAsync() returns the new identifier
            res = await acInstance.collection().removeAsync({ _id: id });
            // postDelete server hook
            fn = acInstance.opts().hooksServer_postDeleteFn();
            if( fn ){
                options.res = res;
                await fn( user, options );
            }
        } catch( e ){
            logger.error( e );
            res = false;
        }
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.SERVER }, 'deleteAccount()', res );
        return res;
    },

    /*
     * @param {String|AccountsCore.acAccount} instance
     * @param {Object} userDoc the user document to be created
     * @param {Object} options an optional dictionary of fields to return or exclude
     * @returns {Promise} which eventually resolves to a falsy value, or the unique identifier of the newly created record
     */
    async insertAccount( instance, userDoc, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'insertAccount()', arguments );
        check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.acAccount ));
        check( userDoc, Object );
        check( options, Object );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.acAccount );
        }
        let res;
        try {
            // preInsert server hook
            let fn = acInstance.opts().hooksServer_preInsertFn();
            if( fn ){
                await fn( userDoc, options );
            }
            // successful insertAsync() returns the new identifier
            res = await acInstance.collection().insertAsync( userDoc );
            if( res ){
                userDoc._id = res;
            }
            // postInsert server hook
            fn = acInstance.opts().hooksServer_postInsertFn();
            if( fn ){
                options.res = res;
                await fn( userDoc, options );
            }
        } catch( e ){
            logger.error( e );
            res = false;
        }
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.SERVER }, 'insertAccount()', res );
        return res;
    },

    /*
     * @param {String|AccountsCore.acAccount} instance
     * @param {Object} userDoc the user document to be updated
     * @param {Object} options an optional dictionary of fields to return or exclude
     * @returns {Promise} which eventually resolves to a falsy value, or the result of the operation
     */
    async updateAccount( instance, userDoc, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'updateAccount()', arguments );
        check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.acAccount ));
        check( userDoc, Object );
        check( options, Object );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.acAccount );
        }
        let res;
        try {
            // preUpdate server hook
            let fn = acInstance.opts().hooksServer_preUpdateFn();
            if( fn ){
                await fn( userDoc, options );
            }
            // successful updateAsync() returns the count of affected documents
            res = await acInstance.collection().updateAsync( userDoc );
            // postUpdate server hook
            fn = acInstance.opts().hooksServer_postUpdateFn();
            if( fn ){
                options.res = res;
                await fn( userDoc, options );
            }
        } catch( e ){
            logger.error( e );
            res = false;
        }
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.SERVER }, 'updateAccount()', res );
        return res;
    }
};
