/*
 * pwix:accounts-core/src/common/js/functions.js
 */

import _ from 'lodash';

import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';
import { Logger } from 'meteor/pwix:logger';
import { Tracker } from 'meteor/tracker';

import { acOptions } from '../classes/ac-options.class';

AccountsCore._instances = {
    dep: new Tracker.Dependency(),
    data: {}
};

const logger = Logger.get();

// Setter
// @locus Anywhere
// @param {String} name
// @param {acAccount} instance
//  As a setter, this function is only called from the acAccount constructor.
AccountsCore._setInstance = function( name, instance ){
    logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, '_setInstance()', arguments );
    check( name, Match.NonEmptyString );
    check( instance, AccountsCore.Account );
    AccountsCore._instances.data[name] = instance;
    AccountsCore._instances.dep.changed();
};

// update the roles for the user
//  roles are handled by the Roles.EditPanel panel while user is only a user document
AccountsCore._updateRoles = async function( instance, user ){
    if( instance.haveRoles()){
        const roles = Package['pwix:roles'].Roles.EditPanel.roles();
        return await Package['pwix:roles'].Roles.setUserRoles( user, roles );
    }
    return true;
};

/**
 * @locus Anywhere
 * @param {String|Object} userA
 * @param {String|Object} userB
 * @returns {Boolean} whether userA and userB are same
 */
AccountsCore.areSame = function( userA, userB ){
    logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'areSame()', arguments );
    check( userA, Match.OneOf( Match.NonEmptyString, Match.ObjectIncluding({ _id: String })));
    check( userB, Match.OneOf( Match.NonEmptyString, Match.ObjectIncluding({ _id: String })));
    const idA = userA ? ( _.isObject( userA ) ? userA._id : ( _.isString( userA ) ? userA : null )) : null;
    const idB = userB ? ( _.isObject( userB ) ? userB._id : ( _.isString( userB ) ? userB : null )) : null;
    if( idA === null ){
        logger.warn( 'areSame() unable to get user identifier from \'userA\':', userA );
    }
    if( idB === null ){
        logger.warn( 'areSame() unable to get user identifier from \'userB\':', userB );
    }
    const res = ( idA === idB );
    return res;
};

/**
 * @summary Creates a new user account in the collection
 *  This common-code function:
 *  - check the permission of requesterId against
 *  - honors createAccountFn() common hooks if defined
 *  - delegates to Accounts.createAccount() if 'users' collection on client side and the package is present
 *  - else just insert the user document into the collection
 *  It is expected that this function be the entry point of the package for the feature, whether it is called from client or server-side.
 *  Other internal-level functions notably may not care of permissions.
 * NB:
 *  We do not force here a defined requesterId as an application may want allow signup
 * 
 * @param {String|AccountsCore.Account} instance the AccountsCore.Account instance or the AccountsCore.Account name
 * @param {String} userDoc the user document to be inserted
 * @param {String} requesterId the identifier of the requester user
 * 
 * @returns {Object} either '_id' or 'reason' or 'reason_i18n'
 */
AccountsCore.createAccount = async function( instance, userDoc, requesterId ){
    check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.Account ));
    check( userDoc, Object );
    //logger.debug( 'createAccount()', arguments );
    // get AccountsCore.Account instance
    let acInstance = instance;
    if( _.isString( acInstance )){
        acInstance = AccountsCore.getInstance( acInstance );
    }
    check( acInstance, AccountsCore.Account );
    // check permission
    if( !await AccountsCore.isAllowed( 'pwix.accounts_core.feat.create', requesterId, { instance: acInstance })){
        return { reason_i18n: 'permissions.create_not_allowed' };
    }
    // honors createAccountFn() common hook if defined
    const fn = acInstance.opts().hooksCommon_createAccountFn();
    if( fn ){
        try {
            return await fn( userDoc, { instance: acInstance, userId: requesterId }, instance.opts().hooksCommon_createAccountArgs());
        } catch( e ){
            logger.error( e );
            return { reason: e.error };
        }
    }
    // rely on AccountsBase for 'users' collection
    //  see https://docs.meteor.com/api/accounts.html#Accounts-createAccount
    //  NB: contrarily to what say the doc, the actual code doesn't return anything
    //  see https://github.com/meteor/meteor/blob/devel/packages/accounts-password/password_client.js#L105
    //  NB: do not auto connect here - this must be handled by the caller
    if( acInstance.name() === AccountsCore.C.Users ){
        const createOpts = {};
        // have a username ?
        if( userDoc.username ){
            createOpts.username = userDoc.username;
        } else if( userDoc.usernames && userDoc.usernames[0].username ){
            createOpts.username = userDoc.usernames[0].username;
        }
        // have a password ?
        if( userDoc.password ){
            createOpts.password = userDoc.password;
        }
        // have an email address ?
        if( userDoc.email ){
            createOpts.email = userDoc.email;
        } else if( userDoc.emails && userDoc.emails[0].address ){
            createOpts.email = userDoc.emails[0].address;
        }
        try {
            if( Meteor.isClient ){
                await Meteor.callAsync( 'pwix.AccountsCore.m.createUserAsync', createOpts );
            } else {
                await Accounts.createUserAsync( createOpts );
            }
            const _item = await acInstance.byAnyIdentifier( createOpts.email || createOpts.username );
            if( _item ){
                return { _id: _item._id };
            } else {
                return { reason_i18n: 'permissions.create_account' };
            }
        } catch( e ){
            logger.error( e );
            return { reason: e.error };
        }

    // else do our best
    //  i.e. just insert the user document into the named accounts collection
    } else if( Meteor.isClient ){
        return await Meteor.callAsync( 'pwix.AccountsCore.m.createAccount', acInstance.name(), userDoc, requesterId );
    }
    return await AccountsCore.s.createAccount( acInstance, userDoc, requesterId );
}

/**
 * @summary Delete a user account from the collection
 *  This common-code function:
 *  - check the permission of requesterId against
 *  - honors deleteAccountFn() common hooks if defined
 *  - delete the user document from the collection
 *  It is expected that this function be the entry point of the package for the feature, whether it is called from client or server-side.
 *  Other internal-level functions notably may not care of permissions.
 * 
 * @param {String|AccountsCore.Account} instance the AccountsCore.Account instance or the AccountsCore.Account name
 * @param {String} userDoc the user document to be inserted
 * @param {String} requesterId the identifier of the requester user
 * 
 * @returns {Object} either 'count' or 'reason' or 'reason_i18n'
 */
AccountsCore.deleteAccount = async function( instance, user, requesterId ){
    check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.Account ));
    check( user, Match.OneOf( Match.NonEmptyString, Match.ObjectIncluding({ _id: Match.NonEmptyString })));
    check( requesterId, Match.NonEmptyString );
    // get AccountsCore.Account instance
    let acInstance = instance;
    if( _.isString( acInstance )){
        acInstance = AccountsCore.getInstance( acInstance );
    }
    check( acInstance, AccountsCore.Account );
    // check permission
    if( !await AccountsCore.isAllowed( 'pwix.accounts_core.feat.delete', requesterId, { instance: acInstance, id: user._id || user })){
        return { reason_i18n: 'permissions.delete_not_allowed' };
    }
    let res;
    // honors deleteAccountFn() common hook if defined
    const fn = instance.opts().hooksCommon_deleteAccountFn();
    if( fn ){
        try {
            return await fn( user, { instance: acInstance, userId: requesterId }, instance.opts().hooksCommon_deleteAccountArgs());
        } catch( e ){
            logger.error( e );
            return { reason: e.error };
        }
    }
    // else do our best
    //  i.e. just delete the user document from the named accounts collection
    if( Meteor.isClient ){
        return await Meteor.callAsync( 'pwix.AccountsCore.m.deleteAccount', acInstance.name(), user, requesterId );
    }
    return await AccountsCore.s.deleteAccount( acInstance, user, requesterId );
}

/**
 * Getter
 * @locus Anywhere
 * @param {String|AccountsCore.Account} instance
 * @returns {acAccount} the named acAccount instance, or null
 *  A reactive data source
 */
AccountsCore.getInstance = function( instance ){
    logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'getInstance()', arguments );
    if( !instance || ( !_.isString( instance ) && !( instance instanceof AccountsCore.Account ))){
        logger.error( 'getInstance() expects instance be a non-empty string or an instance of AccountsCore.Account, got', instance, 'throwing...' );
        throw new Error( 'Bad argument: instance' );
    }
    let acInstance = instance;
    if( _.isString( instance )){
        acInstance = AccountsCore._instances.data[instance] || null;
        AccountsCore._instances.dep.depend();
    }
    if( acInstance && !( acInstance instanceof AccountsCore.Account )){
        logger.error( 'getInstance() expects \'acInstance\' be an instance of AccountsCore.Account, or null, got', acInstance, 'throwing...' );
        throw new Error( 'Bad result: acInstance' );
    }
    return acInstance;
};

/**
 * @param {String} action
 * @param {String} userId
 * @param {Any} args an object with following keys:
 *  - instance:
 *    > either a string which is an AccountsCore.Account instance name
 *    > or the AccountsCore.Account instance itself.
 * @returns {Boolean} true if the current user is allowed to do the action
 *  NB: default is to allow all if task action is not provided
 */
AccountsCore.isAllowed = async function( action, userId=null, args={} ){
    check( action, Match.NonEmptyString );
    // we leave pass here an unset/undefined userId - this is to the application to decide
    // typical use case: an application let any user sign up
    let allowed = true;
    let acInstance = args.instance;
    if( _.isString( acInstance )){
        acInstance = AccountsCore.getInstance( acInstance );
    }
    check( acInstance, AccountsCore.Account );
    const fn = acInstance.opts().allowFn();
    if( fn ){
        args.instance = acInstance;
        allowed = await fn( ...arguments );
    }
    return allowed;
};

/**
 * @summary Update a user account in the collection
 *  This common-code function:
 *  - check the permission of requesterId against
 *  - honors updateAccountFn() common hooks if defined
 *  - update the user document into the collection
 *  It is expected that this function be the entry point of the package for the feature, whether it is called from client or server-side.
 *  Other internal-level functions notably may not care of permissions.
 * 
 * @param {String|AccountsCore.Account} instance the AccountsCore.Account instance or the AccountsCore.Account name
 * @param {String} userDoc the user document to be inserted
 * @param {String} requesterId the identifier of the requester user
 * @param {Object} opts an optional options object with following keys:
 *  - orig: the original document, which, when set, let us check that it has not been modified in the mean time
 * + Meteor options to updateAsync():
 *  - multi: whether to update multiple documents, defaulting to false
 *  - upsert: whether to insert the document if it doesn't exist yet, defaulting to false
 *  - arrayFilters: specify which fields to modify in an array.
 * 
 * @returns {Object} either 'count' or 'reason' or 'reason_i18n'
 */
AccountsCore.updateAccount = async function( instance, userDoc, requesterId, opts={} ){
    check( instance, Match.OneOf( Match.NonEmptyString, AccountsCore.Account ));
    check( userDoc, Match.OneOf( Match.NonEmptyString, Match.ObjectIncluding({ _id: Match.NonEmptyString })));
    check( requesterId, Match.NonEmptyString );
    // get AccountsCore.Account instance
    let acInstance = instance;
    if( _.isString( acInstance )){
        acInstance = AccountsCore.getInstance( acInstance );
    }
    check( acInstance, AccountsCore.Account );
    // check permission
    if( !await AccountsCore.isAllowed( 'pwix.accounts_core.feat.update', requesterId, { instance: acInstance, id: userDoc._id || userDoc })){
        return { reason_i18n: 'permissions.update_not_allowed' };
    }
    const fn = instance.opts().hooksCommon_updateAccountFn();
    if( fn ){
        try {
            opts.instance = acInstance;
            opts.userId = requesterId;
            return await fn( userDoc, opts, instance.opts().hooksCommon_updateAccountArgs());
        } catch( e ){
            logger.error( e );
            return { reason: e.error };
        }
    }
    // just update the user document in the collection
    if( Meteor.isClient ){
        return await Meteor.callAsync( 'pwix.AccountsCore.m.updateAccount', acInstance.name(), userDoc, requesterId, opts );
    }
    return await AccountsCore.s.updateAccount( acInstance, userDoc, requesterId, opts );
}
