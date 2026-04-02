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

const USERS = acOptions._defaults.name;

const logger = Logger.get();

// Setter
// @locus Anywhere
// @param {String} name
// @param {acAccount} instance
//  As a setter, this function is only called from the acAccount constructor.
AccountsCore._setInstance = function( name, instance ){
    logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, '_setInstance()', arguments );
    check( name, Match.NonEmptyString );
    check( instance, AccountsCore.acAccount );
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
 *  This common-code function honor createUserFn common-code hook
 * @param {String} user the user document
 * @param {Object} options an optional options object with following keys:
 *  - instance, the name of the instance, defaulting to 'users'
 * @returns truthy of falsy value
 */
AccountsCore.createUser = async function( userDoc, options={} ){
    check( userDoc, Object );
    let instance = options.instance || USERS;
    if( _.isString( instance )){
        instance = AccountsCore.getInstance( instance );
    }
    check( instance, AccountsCore.acAccount );
    let res;

    // if a createUser hook is defined, then call it
    const fn = instance.opts().hooksCommon_createUserFn();
    if( fn ){
        try {
            res = await fn( userDoc, options, instance.opts().hooksCommon_createUserArgs());
        } catch( e ){
            logger.error( e );
            res = false;
        }

        // else rely on AccountsBase for 'users' collection
    //  see https://docs.meteor.com/api/accounts.html#Accounts-createUser
    } else if( instance.name() === USERS ){
        const createOpts = {};
        // have a username ?
        if( userDoc.username ){
            createOpts.username = userDoc.username;
        } else if( userDoc.usernames[0].username ){
            createOpts.username = userDoc.usernames[0].username;
        }
        // have a password ?
        if( userDoc.password ){
            createOpts.password = userDoc.password;
        }
        // have an email address ?
        if( userDoc.emails[0].address ){
            createOpts.email = userDoc.emails[0].address;
        }
        try {
            res = await Accounts.createUserAsync( createOpts );
        } catch( e ){
            logger.error( e );
            res = false;
        }

    // else do our best
    } else if( Meteor.isClient ){
        res = await Meteor.callAsync( 'pwix.AccountsCore.m.insertAccount', instance.name(), userDoc, options );

    } else {
        res = await AccountsCore.s.insertAccount( instance, userDoc, options );
    }

    return res;
}

/**
 * @summary Delete a user account from the collection
 *  This common-code function honor deleteUserFn common-code hook
 * @param {Object|String} user either a user identfier or a user document
 * @param {Object} options an optional options object with following keys:
 *  - instance, the name of the instance, defaulting to 'users'
 */
AccountsCore.deleteUser = async function( user, options={} ){
    check( user, Match.OneOf( Match.NonEmptyString, Match.ObjectIncluding({ _id: Match.NonEmptyString })));
    let instance = options.instance || USERS;
    if( _.isString( instance )){
        instance = AccountsCore.getInstance( instance );
    }
    check( instance, AccountsCore.acAccount );
    let res;
    const fn = instance.opts().hooksCommon_deleteUserFn();
    if( fn ){
        try {
            res = await fn( user, options, instance.opts().hooksCommon_deleteUserArgs());
        } catch( e ){
            logger.error( e );
            res = false;
        }
    } else if( Meteor.isClient ){
        res = await Meteor.callAsync( 'pwix.AccountsCore.m.deleteAccount', instance.name(), user, options );
    } else {
        res = await AccountsCore.s.deleteAccount( instance, user, options );
    }
    return res;
}

/**
 * Getter
 * @locus Anywhere
 * @param {String|AccountsCore.acAccount} instance
 * @returns {acAccount} the named acAccount instance, or null
 *  A reactive data source
 */
AccountsCore.getInstance = function( instance ){
    logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'getInstance()', arguments );
    if( !instance || ( !_.isString( instance ) && !( instance instanceof AccountsCore.acAccount ))){
        logger.error( 'getInstance() expects instance be a non-empty string or an instance of AccountsCore.acAccount, got', instance, 'throwing...' );
        throw new Error( 'Bad argument: instance' );
    }
    let acInstance = instance;
    if( _.isString( instance )){
        acInstance = AccountsCore._instances.data[instance] || null;
        AccountsCore._instances.dep.depend();
    }
    if( acInstance && !( acInstance instanceof AccountsCore.acAccount )){
        logger.error( 'getInstance() expects \'acInstance\' be an instance of AccountsCore.acAccount, or null, got', acInstance, 'throwing...' );
        throw new Error( 'Bad result: acInstance' );
    }
    return acInstance;
};

/**
 * @param {String} action
 * @param {String} userId
 * @param {Any} args an object with following keys:
 *  - instance:
 *    > either a string which is an acAccount instance name
 *    > or the acAccount instance itself.
 * @returns {Boolean} true if the current user is allowed to do the action
 *  NB: default is to allow all if task action is not provided
 */
AccountsCore.isAllowed = async function( action, userId=null, args={} ){
    if( !action || !_.isString( action )){
        logger.error( 'isAllowed() expects \'action\' be a non-empty string, got', action, 'throwing...' );
        throw new Error( 'Bad argument: action' );
    }
    if( !userId ){
        return false;
    }
    let allowed = true;
    const acInstance = AccountsCore.getInstance( args.instance );
    if( acInstance ){
        const fn = acInstance.opts().allowFn();
        if( fn ){
            args.instance = acInstance;
            allowed = await fn( ...arguments );
        }
    }
    return allowed;
};

/**
 * @summary Update a user account in the collection
 *  This common-code function honor updateUserFn common-code hook
 * @param {Object} user the user document
 * @param {Object} options an optional options object with following keys:
 *  - instance, the name of the instance, defaulting to 'users'
 */
AccountsCore.updateUser = async function( userDoc, options={} ){
    check( userDoc, Object );
    let instance = options.instance || USERS;
    if( _.isString( instance )){
        instance = AccountsCore.getInstance( instance );
    }
    check( instance, AccountsCore.acAccount );
    let res;
    const fn = instance.opts().hooksCommon_updateUserFn();
    if( fn ){
        try {
            res = await fn( userDoc, options, instance.opts().hooksCommon_updateUserArgs());
        } catch( e ){
            logger.error( e );
            res = false;
        }
    } else if( Meteor.isClient ){
        res = await Meteor.callAsync( 'pwix.AccountsCore.m.updateccount', instance.name(), userDoc, options );
    } else {
        res = await AccountsCore.s.deleteAccount( instance, userDoc, options );
    }
    return res;
}
