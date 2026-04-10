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
     * @param {String} pubName the publication name
     * @param {AccountsCore.Account} instance
     * @param {Object} a user document
     * @param {Object} options
     * @param {String} userId the requester user
     * @returns {Promise} which eventually resolves to the transformed user document
     */
    async applyPublishTransforms( pubName, acInstance, userDoc, options={}, userId ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'applyPublishTransforms()', arguments );
        check( pubName, Match.NonEmptyString );
        check( acInstance, AccountsCore.Account );
        if( userDoc ){
            const transforms = acInstance.transformsPublish( pubName );
            //if( userDoc._id === 'KkpHFA8JcL8hWi6Cn' ) logger.debug( 'applyPublishTransforms()', transforms, 'userDoc', userDoc );
            for( const fn of transforms ){
                userDoc = await fn( acInstance, userDoc, options, userId || userDoc._id );
                //if( userDoc._id === 'KkpHFA8JcL8hWi6Cn' ) logger.debug( 'applyPublishTransforms()', userDoc );
            }
        }
        return userDoc;
    },

    /*
     * @param {AccountsCore.Account} instance
     * @param {Object} a user document
     * @param {Object} options
     * @returns {Promise} which eventually resolves to the transformed user document
     */
    async applyReadTransforms( acInstance, userDoc, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'applyReadTransforms()', arguments );
        check( acInstance, AccountsCore.Account );
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
     * @param {AccountsCore.Account} instance
     * @param {Object} a user document
     * @param {Object} options
     * @returns {Promise} which eventually resolves to the transformed user document
     */
    async applyUpdateTransforms( acInstance, userDoc, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'applyUpdateTransforms()', arguments );
        check( acInstance, AccountsCore.Account );
        //logger.debug( 'applyUpdateTransforms()', acInstance._transforms );
        if( userDoc ){
            const transforms = acInstance.transformsUpdate();
            for( const fn of transforms ){
                userDoc = await fn( acInstance, userDoc, options );
            }
        }
        return userDoc;
    },

    /*
     * @param {String|AccountsCore.Account} instance
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
     * @param {String|AccountsCore.Account} instance
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
        check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.Account ));
        check( email, Match.NonEmptyString );
        check( options, Object );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.Account );
        }
        let userDoc = null;
        if( acInstance.opts().collection() === 'users' ){
            userDoc = await Accounts.findUserByEmail( email, options );
        } else {
            userDoc = await AccountsCore.s.byQuery({ 'emails.address': email }, options );
        }
        userDoc = await AccountsCore.s.applyReadTransforms( acInstance, userDoc );
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.SERVER }, 'byEmailAddress( \''+email+'\' ):', userDoc );
        return userDoc;
    },

    /*
     * @param {String|AccountsCore.Account} instance
     * @param {String} id the user identifier
     * @returns {Promise} which eventually resolves to the (unique) cleaned-up user document, or null
     */
    async byId( instance, id, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'byId()', arguments );
        check( id, String );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.Account );
        }
        let userDoc = await AccountsCore.s.byQuery( acInstance, { _id: id }, options );
        userDoc = await AccountsCore.s.applyReadTransforms( acInstance, userDoc );
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.SERVER }, 'byId('+id+')', userDoc );
        return userDoc;
    },

    /*
     * @param {String|AccountsCore.Account} instance
     * @param {Object} query the MongoDB selector
     * @returns {Promise} which eventually resolves to the (unique) cleaned-up user document, or null
     */
    async byQuery( instance, query, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'byQuery()', arguments );
        check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.Account ));
        check( query, Object );
        check( options, Object );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.Account );
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
        userDoc = await AccountsCore.s.applyReadTransforms( acInstance, userDoc );
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.SERVER }, 'byQuery(', query, ')', userDoc );
        return userDoc;
    },

    /*
     * @param {String|AccountsCore.Account} instance
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
        check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.Account ));
        check( username, Match.NonEmptyString );
        check( options, Object );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.Account );
        }
        let userDoc = null;
        if( acInstance.opts().collection() === 'users' ){
            userDoc = await Accounts.findUserByUsername( username, options );
        } else {
            userDoc = await AccountsCore.s.byQuery({ username }, options ) || await AccountsCore.s.byQuery({ 'usernames.username': username });
        }
        userDoc = await AccountsCore.s.applyReadTransforms( acInstance, userDoc );
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.SERVER }, 'byUsername( \''+username+'\' )', userDoc );
        return userDoc;
    },

    /*
     * @param {String|AccountsCore.Account} instance
     * @param {Object} userDoc the user document to be created
     * @param {String} requesterId the current user identifier (the requester)
     * @returns {Promise} which eventually resolves to an object
     *  - _id: on success
     *  - reason: on failure
     * May throw in pre/post server hooks themselves throw
     */
    async createAccount( instance, userDoc, requesterId ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'createAccount()', arguments );
        check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.Account ));
        check( userDoc, Object );
        check( requesterId, Match.NonEmptyString );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.Account );
        }
        let res;
        try {
            // preCreate server hook
            let fn = acInstance.opts().hooksServer_preCreateFn();
            if( fn ){
                await fn( userDoc, requesterId );
            }
            // successful insertAsync() returns the new identifier
            const _id = await acInstance.collection().insertAsync( userDoc );
            if( _id ){
                userDoc._id = _id;
                res = { _id: _id };
            }
            // postCreate server hook
            fn = acInstance.opts().hooksServer_postCreateFn();
            if( fn ){
                await fn( userDoc, requesterId );
            }
        } catch( e ){
            logger.error( e );
            res = { reason: e.error };
        }
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.SERVER }, 'createAccount()', res );
        return res;
    },

    /*
     * @param {String|AccountsCore.Account} instance
     * @param {Object|String} user either the user document or the user identifier to be deleted
     * @param {String} requesterId the current user identifier (the requester)
     * @returns {Promise} which eventually resolves to an object
     *  - count: on success
     *  - reason: on failure
     */
    async deleteAccount( instance, userDoc, requesterId ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'deleteAccount()', arguments );
        check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.Account ));
        check( userDoc, Match.OneOf( Match.NonEmptyString, Match.ObjectIncluding({ _id: Match.NonEmptyString })));
        check( requesterId, Match.NonEmptyString );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.Account );
        }
        let res;
        try {
            // preDelete server hook
            let fn = acInstance.opts().hooksServer_preDeleteFn();
            if( fn ){
                await fn( userDoc, requesterId );
            }
            const id = _.isString( userDoc ) ? userDoc : userDoc._id;
            if( !id ){
                logger.error( 'deleteAccount() unable to get the user identifier from', userDoc );
                return false;
            }
            // successful insertAsync() returns the new identifier
            const count = await acInstance.collection().removeAsync({ _id: id });
            res = { count };
            // postDelete server hook
            fn = acInstance.opts().hooksServer_postDeleteFn();
            if( fn ){
                await fn( userDoc, requesterId );
            }
        } catch( e ){
            logger.error( e );
            res = { reason: e.error };
        }
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.SERVER }, 'deleteAccount()', res );
        return res;
    },

    /*
     * @param {String|AccountsCore.Account} instance
     * @param {Object} userDoc the user document to be updated
     * @param {String} requesterId the current user identifier (the requester)
     * @param {Object} opts an optional options object with following keys:
     *  - orig: the original document, which, when set, let us check that it has not been modified in the mean time
     * + Meteor options to updateAsync():
     *  - multi: whether to update multiple documents, defaulting to false
     *  - upsert: whether to insert the document if it doesn't exist yet, defaulting to false
     *  - arrayFilters: specify which fields to modify in an array.
     * @returns {Promise} which eventually resolves to an object
     *  - count: on success
     *  - reason: on failure
     */
    async updateAccount( instance, userDoc, requesterId, opts={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'updateAccount()', arguments );
        check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.Account ));
        check( userDoc, Object );
        check( requesterId, Match.NonEmptyString );
        check( opts, Object );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.Account );
        }
        let res;
        try {
            // preUpdate server hook
            let fn = acInstance.opts().hooksServer_preUpdateFn();
            if( fn ){
                await fn( userDoc, requesterId, opts );
            }
            // update transformations
            userDoc = await AccountsCore.s.applyUpdateTransforms( acInstance, userDoc, opts );
            // successful updateAsync() returns the count of affected documents
            // because userDoc is used as a modifier, then the '_id' is removed by Meteor/Mongo
            const _id = userDoc._id;
            const count = await acInstance.collection().updateAsync({ _id: _id }, { $set: userDoc });
            userDoc._id = _id;
            res = { count };
            // postUpdate server hook
            fn = acInstance.opts().hooksServer_postUpdateFn();
            if( fn ){
                await fn( userDoc, requesterId, opts );
            }
        } catch( e ){
            logger.error( e );
            res = { reason: e.error };
        }
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.SERVER }, 'updateAccount()', res );
        return res;
    },

    // just update the collection
    //  do not care of any permission here
    async updateByQuery( instance, selector, modifier, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'updateByQuery()', arguments );
        check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.Account ));
        check( selector, Object );
        check( modifier, Object );
        let acInstance = instance;
        if( _.isString( instance )){
            acInstance = AccountsCore.getInstance( instance );
            check( acInstance, AccountsCore.Account );
        }
        try {
            const res = await acInstance.collection().updateAsync( selector, { $set: modifier });
            if( !res ){
                throw new Meteor.Error( 'AccountsCore.s.updateByQuery', 'Unable to update account', selector );
            }
            return res;
        } catch( e ){
            throw new Meteor.Error( 'AccountsCore.s.updateByQuery', 'Unable to update account', selector );
        }
    }
};
