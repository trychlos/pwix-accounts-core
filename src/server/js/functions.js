/*
 * pwix:accounts-hub/src/server/js/functions.js
 */

import _ from 'lodash';
const assert = require( 'assert' ).strict;

import { Accounts } from 'meteor/accounts-base';
import { Logger } from 'meteor/pwix:logger';
import { Mongo } from 'meteor/mongo';

import { ahOptions } from '../../common/classes/ah-options.class.js';

const logger = Logger.get();

AccountsHub.s = {

    /*
     * @summary Make sure all the fields of the fieldset are set in the item, even if undefined
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
     *  Each email address can only belong to one user
     *  In other words, an email address can be considered as a user identiier in Meteor ecosystems
     */
    async byEmailAddress( instanceName, email, options={} ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'byEmailAddress()', arguments );
        assert( instanceName && _.isString( instanceName ), 'expects instanceName be a string, got '+instanceName );
        assert( email && _.isString( email ), 'expects email be a string, got '+email );
        assert( options && _.isObject( options ), 'expects options be an object, got ',+options );
        let result = null;
        const ahInstance = AccountsHub.getInstance( instanceName );
        if( ahInstance ){
            assert( ahInstance instanceof AccountsHub.ahClass, 'expects an instance of AccountsHub.ahClass, got '+ahInstance );
            let docs = null;
            if( ahInstance.opts().collection() === ahOptions._defaults.name ){
                docs = await Accounts.findUserByEmail( email, options );
                if( docs ){
                    docs = [ docs ];
                }
            } else {
                const collection = ahInstance.collection();
                assert( collection && collection instanceof Mongo.Collection, 'expects a Mongo.Collection, got '+collection );
                docs = await collection.find( ahInstance.emailSelector( email ), options ).fetchAsync();
            }
            if( docs && docs.length === 1 && docs[0] ){
                result = AccountsHub.s.cleanupUserDocument( docs[0] );
            }
        } else {
            logger.error( 'byEmailAddress() ahInstance not found', instanceName );
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
        assert( instanceName && _.isString( instanceName ), 'expects instanceName be a string, got '+instanceName );
        assert( id && _.isString( id ), 'expects id be a string, got '+id );
        assert( options && _.isObject( options ), 'expects options be an object, got ',+options );
        let doc = null;
        const ahInstance = AccountsHub.getInstance( instanceName );
        if( ahInstance ){
            assert( ahInstance instanceof AccountsHub.ahClass, 'expects an instance of AccountsHub.ahClass, got '+ahInstance );
            const collection = ahInstance.collection();
            assert( collection && collection instanceof Mongo.Collection, 'expects a Mongo.Collection, got '+collection );
            doc = await collection.findOneAsync({ _id: id }, options );
            if( doc ){
                doc = AccountsHub.s.cleanupUserDocument( doc );
            }
        } else {
            logger.error( 'byId() ahInstance not found', instanceName );
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
        assert( instanceName && _.isString( instanceName ), 'expects instanceName be a string, got '+instanceName );
        assert( username && _.isString( username ), 'expects email be a string, got '+username );
        assert( options && _.isObject( options ), 'expects options be an object, got ',+options );
        let result = null;
        const ahInstance = AccountsHub.getInstance( instanceName );
        if( ahInstance ){
            assert( ahInstance instanceof AccountsHub.ahClass, 'expects an instance of AccountsHub.ahClass, got '+ahInstance );
            let docs = null;
            if( ahInstance.opts().collection() === ahOptions._defaults.name ){
                docs = await Accounts.findUserByUsername( username, options );
                if( docs ){
                    docs = [ docs ];
                }
            } else {
                const collection = ahInstance.collection();
                assert( collection && collection instanceof Mongo.Collection, 'expects a Mongo.Collection, got '+collection );
                docs = await collection.find( ahInstance.usernameSelector( username ), options ).fetchAsync();
            }
            if( docs && docs.length === 1 && docs[0] ){
                result = AccountsHub.s.cleanupUserDocument( docs[0] );
            }
        } else {
            logger.error( 'byUsername() ahInstance not found', instanceName );
        }
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.SERVER }, 'byUsername('+username+')', result );
        return result;
    },

    /**
     * @locus Server
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
    cleanupUserDocument( user ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'cleanupUserDocument()', arguments );
        if( user ){
            if( user.services ){
                delete user.services.resume;
                if( user.services.password ){
                    delete user.services.password.bcrypt;
                }
            }
            delete user.profile;
        }
        return user;
    }
};
