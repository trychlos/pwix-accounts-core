/*
 * pwix:accounts-core/src/common/js/functions.js
 */

import _ from 'lodash';

import { check, Match } from 'meteor/check';
import { Logger } from 'meteor/pwix:logger';
import { Tracker } from 'meteor/tracker';

AccountsCore._instances = {
    dep: new Tracker.Dependency(),
    data: {}
};

const logger = Logger.get();

/*
 * Setter
 * @locus Anywhere
 * @param {String} name
 * @param {acAccount} instance
 *  As a setter, this function is only called from the acAccount (actually IAccountCommon) constructor.
 */
AccountsCore._setInstance = function( name, instance ){
    logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, '_setInstance()', arguments );
    check( name, Match.NonEmptyString );
    check( instance, AccountsCore.acAccount );
    AccountsCore._instances.data[name] = instance;
    AccountsCore._instances.dep.changed();
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
