/*
 * pwix:accounts-hub/src/server/js/functions.js
 */

import _ from 'lodash';

import { Accounts } from 'meteor/accounts-base';
import { Logger } from 'meteor/pwix:logger';
import { Mongo } from 'meteor/mongo';

import { ahOptions } from '../../common/classes/ah-options.class.js';

const logger = Logger.get();

AccountsHub.s = {
    /*
     * @summary Make sure all the fields of the fieldset are set in the item, even if undefined
     *  This is needed so that we can remove a field when updating an account instead of having a special function to remove that field
     * @param {Object} item
     * @returns {Object} item
     */
    addUndef( instanceName, item ){
        const ahInstance = AccountsHub.getInstance( instanceName );
        if( ahInstance.fieldSet && typeof ahInstance.fieldSet === 'function' ){
            ahInstance.fieldSet().names().forEach(( it ) => {
                if( it.indexOf( '.' ) === -1 && !Object.keys( item ).includes( it )){
                    item[it] = undefined;
                }
            });
        }
        return item;
    },

    /*
     * @param {String} the searched email address
     * @param {Object} options an optional dictionary of fields to return or exclude
     * @returns {Promise} which eventually resolves to the cleaned-up user document, or null
     *
     *  As a reminder, see https://v3-docs.meteor.com/api/accounts.html#Meteor-users
     *                 and https://v3-docs.meteor.com/api/accounts.html#passwords
     *                 and https://v3-docs.meteor.com/api/accounts.html#Accounts-findUserByEmail
     * 
     *  Each email address can only belong to one user
     *  In other words, an email address can be considered as a user identiier in Meteor ecosystems
     */
    async byEmailAddress( instanceName, email, options={} ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'byEmailAddress()', arguments );
        if( !instanceName || !_.isString( instanceName )){
            logger.error( 'expects instanceName be a non-empty string, got', instanceName, 'throwing...' );
            throw new Error( 'Bad argument: instanceName' );
        }
        if( !email || !_.isString( email )){
            logger.error( 'expects email be a non-empty string, got', email, 'throwing...' );
            throw new Error( 'Bad argument: email' );
        }
        if( !options || !_.isObject( options )){
            logger.error( 'expects options be an Object, got', options, 'throwing...' );
            throw new Error( 'Bad argument: options' );
        }
        let result = null;
        const ahInstance = AccountsHub.getInstance( instanceName );
        if( !ahInstance || !( ahInstance instanceof AccountsHub.ahClass )){
            logger.error( 'expects ahInstance be an instance of AccountsHub.ahClass, got', ahInstance, 'throwing...' );
            throw new Error( 'Bad argument: ahInstance' );
        }
        let docs = null;
        if( ahInstance.opts().collection() === ahOptions._defaults.name ){
            docs = await Accounts.findUserByEmail( email, options );
            if( docs ){
                docs = [ docs ];
            }
        } else {
            const collection = ahInstance.collection();
            if( !collection || !( collection instanceof Mongo.Collection )){
                logger.error( 'expects collection be an instance of Mongo.Collection, got', collection, 'throwing...' );
                throw new Error( 'Bad argument: collection' );
            }
            docs = await collection.find( ahInstance.emailSelector( email ), options ).fetchAsync();
        }
        if( docs && docs.length > 1 ){
            logger.error( 'expects email address be an account identifier, but got', docs.length, 'documents, throwing...' );
            throw new Error( 'Bad argument: account' );
        }
        if( docs && docs.length ){
            result = AccountsHub.s.cleanupUserDocument( docs[0] );
        }
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.SERVER }, 'byEmailAddress('+email+'):', result );
        return result;
},

    /*
     * @param {String} the user identifier
     * @returns {Promise} which eventually resolves to the user document
     */
    async byId( instanceName, id, options={} ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'byId()', arguments );
        if( !instanceName || !_.isString( instanceName )){
            logger.error( 'expects instanceName be a non-empty string, got', instanceName, 'throwing...' );
            throw new Error( 'Bad argument: instanceName' );
        }
        if( !id || !_.isString( id )){
            logger.error( 'expects id be a non-empty string, got', id, 'throwing...' );
            throw new Error( 'Bad argument: id' );
        }
        if( !options || !_.isObject( options )){
            logger.error( 'expects options be an Object, got', options, 'throwing...' );
            throw new Error( 'Bad argument: options' );
        }
        let doc = null;
        const ahInstance = AccountsHub.getInstance( instanceName );
        if( !ahInstance || !( ahInstance instanceof AccountsHub.ahClass )){
            logger.error( 'expects ahInstance be an instance of AccountsHub.ahClass, got', ahInstance, 'throwing...' );
            throw new Error( 'Bad argument: ahInstance' );
        }
        const collection = ahInstance.collection();
        if( !collection || !( collection instanceof Mongo.Collection )){
            logger.error( 'expects collection be an instance of Mongo.Collection, got', collection, 'throwing...' );
            throw new Error( 'Bad argument: collection' );
        }
        doc = await collection.findOneAsync({ _id: id }, options );
        if( doc ){
            doc = AccountsHub.s.cleanupUserDocument( doc );
        }
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.SERVER }, 'byId('+id+')', doc );
        return doc;
    },

    /*
     * @param {String} the searched username
     * @param {Object} options an optional dictionary of fields to return or exclude
     * @returns {Promise} which eventually resolves to the user document, or null
     *
     *  As a reminder, see https://v3-docs.meteor.com/api/accounts.html#Accounts-findUserByUsername
     *  Each username can only belong to one user
     *  In other words, a username can be considered as a user identiier in Meteor ecosystems
     */
    async byUsername( instanceName, username, options={} ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'byUsername()', arguments );
        if( !instanceName || !_.isString( instanceName )){
            logger.error( 'expects instanceName be a non-empty string, got', instanceName, 'throwing...' );
            throw new Error( 'Bad argument: instanceName' );
        }
        if( !username || !_.isString( username )){
            logger.error( 'expects username be a non-empty string, got', username, 'throwing...' );
            throw new Error( 'Bad argument: username' );
        }
        if( !options || !_.isObject( options )){
            logger.error( 'expects options be an Object, got', options, 'throwing...' );
            throw new Error( 'Bad argument: options' );
        }
        let result = null;
        const ahInstance = AccountsHub.getInstance( instanceName );
        if( !ahInstance || !( ahInstance instanceof AccountsHub.ahClass )){
            logger.error( 'expects ahInstance be an instance of AccountsHub.ahClass, got', ahInstance, 'throwing...' );
            throw new Error( 'Bad argument: ahInstance' );
        }
        let docs = null;
        if( ahInstance.opts().collection() === ahOptions._defaults.name ){
            docs = await Accounts.findUserByUsername( username, options );
            if( docs ){
                docs = [ docs ];
            }
        } else {
            const collection = ahInstance.collection();
            if( !collection || !( collection instanceof Mongo.Collection )){
                logger.error( 'expects collection be an instance of Mongo.Collection, got', collection, 'throwing...' );
            throw new Error( 'Bad argument: collection' );
            }
            docs = await collection.find( ahInstance.usernameSelector( username ), options ).fetchAsync();
        }
        if( docs && docs.length > 1 ){
            logger.error( 'expects username be an account identifier, but got', docs.length, 'documents, throwing...' );
            throw new Error( 'Bad argument: account' );
        }
        if( docs && docs.length ){
            result = AccountsHub.s.cleanupUserDocument( docs[0] );
        }
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.SERVER }, 'byUsername('+username+')', result );
        return result;
    },

    /**
     * @locus Server
     * @summary Remove from the to-be-returned user document fields which are considered as too sensitive to be sent to the client
     * @param {Object} document
     * @returns {Object} the cleaned-up user document
     *
     * make sure the password, even crypted, is not returned:
     * {
     *     _id: '55QDvyxocA8XBnyTy',
     *     createdAt: 2023-02-08T21:16:56.851Z,
     *     services: { password: {}, email: { verificationTokens: [Array] } },
     *     username: 'cccc',
     *     emails: [ { address: 'cccc@ccc.cc', verified: true } ],
     *     isAllowed: true,
     *     createdBy: 'EqvmJAhNAZTBAECya',
     *     lastConnection: 2023-02-09T13:22:14.057Z,
     *     updatedAt: 2023-02-09T13:25:16.114Z,
     *     updatedBy: 'EqvmJAhNAZTBAECya'
     * }
     * 
     * Note: do NOT expose this function in client-side world. This would be a security risk as a malicious user could just override it.
     */
    sensitiveFields: [
        'services.resume',
        'services.password',
        'profile'
    ],
    cleanupUserDocument( user ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'cleanupUserDocument()', arguments );
        if( user ){
            AccountsHub.s.sensitiveFields.forEach(( it ) => {
                let o = user;
                const words = it.split( '.' );
                for( let i=0 ; i<words.length-1 ; ++i ){
                    o = o[words[i]];
                }
                delete o[words[words.length-1]];
            });
        }
        return user;
    }
};
